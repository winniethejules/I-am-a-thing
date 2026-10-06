/**
 * The CPUs, three-free: a kusin that searches and a vätte that hides, behind one Bot (it plays
 * whichever role its body has now). Both make human mistakes on purpose (voxelparty-game's
 * quality bar): the kusin gets nervous and tests real things, the vätte sometimes picks a poor spot
 * and taunts when it shouldn't.
 */
import { PathFollower, ThinkTimer, stickFor, wrapAngle, type Rng } from '@voxelparty/sdk/core';
import type { Pawn, World } from './core';
import { RANGE } from './rules';
import { KUSIN_MOVE, REAL_THINGS, VATTE, formBox, moveOf } from './things';

/** What a player does this frame: the same shape for a human (game.ts) and a bot. */
export interface Intent {
  fwd: number;
  side: number;
  jump: boolean;
  /** How far to turn, radians. */
  dyaw: number;
  dpitch: number;
  fire: boolean;
  /** A vätte: the form to become this frame (an index into FORMS, VATTE to be itself), or NO_FORM. */
  become: number;
  /** A vätte: lock or unlock (pressed this frame). */
  lock: boolean;
  /** A vätte: taunt (pressed this frame). */
  taunt: boolean;
}

/** "Become nothing this frame." */
export const NO_FORM = -2;

export const IDLE: Readonly<Intent> = { fwd: 0, side: 0, jump: false, dyaw: 0, dpitch: 0, fire: false, become: NO_FORM, lock: false, taunt: false };

/** How fast it can turn, radians a second. */
const TURN = 6;
/** Where a kusin stands to look round the small rooms: the pantry, the bathroom, farstun, the bedroom's far end. */
const LOOKS = [
  { x: 5.7, y: 0, z: 4.35 }, { x: 7.1, y: 0, z: 4.25 }, { x: 0, y: 0, z: 8.8 }, { x: 3.0, y: 0, z: 8.9 }, { x: -4.6, y: 0, z: 11.6 }, { x: 8.2, y: 0, z: 11.3 },
  // The garden: the patio, the kubb lawn, the woodpile, the front path.
  { x: -2.5, y: -0.5, z: -4.0 }, { x: 8.0, y: -0.5, z: -5.0 }, { x: -10.5, y: -0.5, z: 3.0 }, { x: 3.0, y: -0.5, z: 14.0 }, { x: 13.0, y: -0.5, z: 6.0 },
];
/** How far a taunt carries, metres. */
const EARSHOT = 9;

/** What a kusin thinks of a vätte it can see: suspicion builds up to 1, then it shoots. */
interface Hunch {
  sus: number;
  at: number;
}

export class Bot {
  private readonly follow: PathFollower;
  private readonly think: ThinkTimer;
  private readonly look: ThinkTimer;
  private readonly out: Intent = { ...IDLE };
  private stuckT = 0;
  private stuckX = 0;
  private stuckZ = 0;
  /** How long it's had nowhere to go (it plans again after a moment, not every frame). */
  private idleT = 0;
  private life = -1;

  // The kusin.
  private target: { pid: string | null; thing: number; x: number; y: number; z: number } | null = null;
  private readonly hunches = new Map<string, Hunch>();
  /** Real things it has already tested this life: it won't fall for the same one twice. */
  private readonly tested = new Set<number>();
  /** The last taunt it heard from each vätte (so it reacts to each taunt once). */
  private readonly heard = new Map<string, number>();
  private errYaw = 0;
  private errPitch = 0;
  private aimT = 0;
  private sweep = 0;
  /** Following a taunt it heard: it won't wander off for this long. */
  private leadT = 0;

  // The vätte.
  private plan: { f: number; x: number; z: number; y?: number } | null = null;
  private lastHits = 0;
  private hidT = 0;
  private nearT = 0;

  /** `skill` scales reaction, aim, turning and nerve (0.7 sloppy .. 1.2 sharp). */
  constructor(private readonly rand: Rng, readonly skill: number, w: World) {
    this.follow = new PathFollower(w.arena.nav);
    this.think = new ThinkTimer(1 / skill, rand);
    this.look = new ThinkTimer(0.25 / skill, rand);
  }

  update(dt: number, me: Pawn, w: World): Intent {
    const o = Object.assign(this.out, IDLE);
    if (!me.alive) {
      this.follow.reset();
      this.target = this.plan = null;
      return o;
    }
    if (me.life !== this.life) {
      // A new life: start from scratch.
      this.life = me.life;
      this.follow.reset();
      this.target = this.plan = null;
      this.hunches.clear();
      this.tested.clear();
      this.lastHits = this.hidT = this.nearT = 0;
    }
    return w.role(me) === 'k' ? this.seek(dt, me, w, o) : this.hide(dt, me, w, o);
  }

  // ------------------------------------------------------------ the kusin

  private seek(dt: number, me: Pawn, w: World, o: Intent): Intent {
    const b = me.body;
    if (this.look.tick(dt)) {
      this.listen(me, w);
      this.watch(me, w);
    }
    if (this.target) this.aim(dt, me, o);
    this.idleT = this.follow.idle ? this.idleT + dt : 0;
    this.leadT -= dt;
    if (this.think.tick(dt) || this.idleT > 0.4) {
      this.idleT = 0;
      if (this.leadT <= 0 || this.follow.idle) this.wander(me, w);
      // Nerves: now and then, with nothing better to go on, test a real thing nearby.
      if (!this.target && w.phase === 'seek' && this.rand() < 0.015 / this.skill) this.test(me, w);
    }
    const s = this.follow.steer(b);
    const slow = this.target ? 0.25 : 0.75;   // creep while aiming, walk while searching
    this.move(b.yaw, s.x * slow, s.z * slow, o);
    o.jump = s.jump;
    if (!this.target) {
      // Look round as it walks: where it's going, swept side to side, eyes on the furniture.
      this.sweep += dt * (0.9 + this.skill * 0.3);
      const head = s.x || s.z ? Math.atan2(s.x, s.z) : b.yaw;
      o.dyaw = clampTurn(wrapAngle(head + Math.sin(this.sweep) * 0.9 - b.yaw), TURN * 0.5 * dt);
      o.dpitch = clampTurn(-0.28 + Math.sin(this.sweep * 0.7) * 0.15 - b.pitch, dt * 1.5);
    }
    this.unstick(dt, me, o);
    return o;
  }

  /**
   * Look at every vätte in sight. A bare vätte is obvious; a thing that moves gives itself away; a
   * thing where no such thing stood, or on the floor where it doesn't belong, is suspicious; a
   * thing standing still among its own kind takes a long, hard look.
   */
  private watch(me: Pawn, w: World) {
    const b = me.body, ey = b.y + KUSIN_MOVE.eye;
    let best: { pid: string; x: number; y: number; z: number } | null = null, bestSus = 0;
    for (const p of w.pawns.values()) {
      if (p === me || !w.alive(p) || w.role(p) !== 'v') continue;
      const { h } = formBox(p.form), q = p.body;
      const dx = q.x - b.x, dz = q.z - b.z, d = Math.hypot(dx, dz);
      const facing = (Math.sin(b.yaw) * dx + Math.cos(b.yaw) * dz) / (d || 1);
      if (d > RANGE || facing < 0.35 || !w.arena.sees(b.x, ey, b.z, q.x, q.y + h * 0.6, q.z)) continue;
      const hunch = this.hunches.get(p.pid) ?? { sus: 0, at: w.now };
      const moving = Math.hypot(q.vx, q.vz) > 0.4;
      const bare = p.form === VATTE;
      const home = REAL_THINGS.some((th) => th.f === p.form && Math.hypot(th.x - q.x, th.z - q.z) < 1.4 && Math.abs(th.y - q.y) < 0.3);
      const rate = bare ? 4 : (moving ? 1.6 : 0.2) * (home ? 0.45 : 1.4) * this.skill * (d < 3 ? 2 : 1);
      hunch.sus = Math.min(1.5, hunch.sus + rate * 0.25);
      hunch.at = w.now;
      this.hunches.set(p.pid, hunch);
      if (hunch.sus > bestSus) [best, bestSus] = [{ pid: p.pid, x: q.x, y: q.y + h * 0.5, z: q.z }, hunch.sus];
    }
    for (const [pid, h] of this.hunches) if (w.now - h.at > 4000) this.hunches.delete(pid);
    if (best && bestSus >= 1) {
      if (this.target?.pid !== best.pid) this.aimAt(best.pid, -1, best.x, best.y, best.z);
      else Object.assign(this.target, { x: best.x, y: best.y, z: best.z });
    } else if (this.target?.pid) this.target = null;
  }

  /**
   * Hear a taunt: a kusin within earshot knows roughly where it came from. It heads there, and if
   * the thing is in sight, the taunt is half a confession.
   */
  private listen(me: Pawn, w: World) {
    const b = me.body;
    for (const p of w.pawns.values()) {
      if (p === me || !w.alive(p) || w.role(p) !== 'v' || w.now - p.tauntAt > 1000 || this.heard.get(p.pid) === p.tauntAt) continue;
      const q = p.body, d = Math.hypot(q.x - b.x, q.z - b.z);
      if (d > EARSHOT) continue;
      this.heard.set(p.pid, p.tauntAt);
      const hunch = this.hunches.get(p.pid) ?? { sus: 0, at: w.now };
      hunch.sus = Math.min(1.5, hunch.sus + 0.45 * this.skill);
      hunch.at = w.now;
      this.hunches.set(p.pid, hunch);
      // Off towards the sound, give or take a step: it's a guess, not a map.
      const miss = 1.2 / this.skill;
      this.leadT = 6;
      if (!this.target) this.follow.goTo(b, q.x + (this.rand() - 0.5) * miss, 0, q.z + (this.rand() - 0.5) * miss);
    }
  }

  /** Pick a real thing in sight, close by, and shoot it to see (a wrong guess, on purpose). */
  private test(me: Pawn, w: World) {
    const b = me.body, ey = b.y + KUSIN_MOVE.eye;
    const near = REAL_THINGS.map((th, j) => ({ th, j, d: Math.hypot(th.x - b.x, th.z - b.z) }))
      .filter(({ th, j, d }) => d < 3 && d > 0.8 && !this.tested.has(j) && w.arena.sees(b.x, ey, b.z, th.x, th.y + th.h * 0.5, th.z));
    if (!near.length) return;
    const { th, j } = near[Math.floor(this.rand() * near.length)];
    this.tested.add(j);
    this.aimAt(null, j, th.x, th.y + th.h * 0.5, th.z);
  }

  private aimAt(pid: string | null, thing: number, x: number, y: number, z: number) {
    this.target = { pid, thing, x, y, z };
    this.aimT = 0;
    // A fresh aiming error: good bots start closer.
    this.errYaw = (this.rand() - 0.5) * (0.4 / this.skill);
    this.errPitch = (this.rand() - 0.5) * (0.2 / this.skill);
  }

  /** Turn towards the target and shoot once it's been on it long enough. A test shot is one dart. */
  private aim(dt: number, me: Pawn, o: Intent) {
    const t = this.target!, b = me.body, ey = b.y + KUSIN_MOVE.eye;
    this.aimT += dt;
    const dx = t.x - b.x, dy = t.y - ey, dz = t.z - b.z, d = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz), pitch = Math.atan2(dy, d);
    // The error settles as it tracks, but a wobble keeps it human.
    const settle = Math.exp(-dt * 1.8 * this.skill);
    this.errYaw = this.errYaw * settle + (this.rand() - 0.5) * 0.015 / this.skill;
    this.errPitch = this.errPitch * settle + (this.rand() - 0.5) * 0.01 / this.skill;
    const turn = TURN * (0.7 + this.skill * 0.4) * dt;
    o.dyaw = clampTurn(wrapAngle(yaw + this.errYaw - b.yaw), turn);
    o.dpitch = clampTurn(pitch + this.errPitch - b.pitch, turn * 0.7);
    const off = Math.abs(wrapAngle(yaw - b.yaw)) + Math.abs(pitch - b.pitch);
    o.fire = this.aimT > 0.5 / this.skill && off < 0.03 + 0.14 / Math.max(2, d);
    if (o.fire) {
      // One dart, then look again: a hunch needs fresh evidence before the next (a hit shows itself:
      // the thing squeaks and jumps), a test dart was only ever one.
      const h = t.pid ? this.hunches.get(t.pid) : undefined;
      if (h) h.sus = 0.4;
      this.target = null;
    }
    if (this.aimT > 4) this.target = null;      // lost it
  }

  /** Where next: a random spot in the kitchen (the hall is a dead end nobody hides in, yet). */
  private wander(me: Pawn, w: World) {
    if (!this.follow.idle && this.rand() < 0.7) return;
    // Every room a vätte can hide in: the vättar's spawns, which are spread through the house, and a look into the small rooms.
    const spots = [...w.arena.spawns.filter((s) => !s.hall), ...LOOKS];
    const s = spots[Math.floor(this.rand() * spots.length)];
    this.follow.goTo(me.body, s.x + (this.rand() - 0.5) * 0.6, s.y, s.z + (this.rand() - 0.5) * 0.6);
  }

  // ------------------------------------------------------------ the vätte

  private hide(dt: number, me: Pawn, w: World, o: Intent): Intent {
    const b = me.body;
    const hits = w.hits(me);
    if (hits > this.lastHits) {
      // Hit! Panic: unlock and run for another spot.
      this.lastHits = hits;
      if (me.locked) o.lock = true;
      this.plan = null;
    }
    if (!this.plan) this.plan = this.choose(me, w);
    const p = this.plan;
    const d = Math.hypot(p.x - b.x, p.z - b.z);
    if (me.locked) {
      // Hidden: hold still. A bold vätte taunts when no kusin is near (and a sloppy one when one is).
      this.hidT += dt;
      const kusin = nearestKusin(me, w);
      const brave = kusin > 4 || this.rand() < 0.002 / this.skill;
      if (brave && this.hidT > 3 && this.rand() < dt * 0.08) o.taunt = true;
      return o;
    }
    if (d > 0.3) {
      // The paths go node to node; the last stretch it walks straight. Stuck short of the spot for
      // a while, it settles for where it stands.
      let sx: number, sz: number;
      if (d > 0.9) {
        if ((this.follow.idle || this.think.tick(dt)) && !this.follow.goTo(b, p.x, p.y ?? 0, p.z)) {
          this.plan = null;   // no way there from here: think again
          return o;
        }
        const s = this.follow.steer(b);
        [sx, sz, o.jump] = [s.x, s.z, s.jump];
        this.nearT = 0;
      } else {
        [sx, sz] = [(p.x - b.x) / d, (p.z - b.z) / d];
        this.nearT += dt;
        if (this.nearT > 1.5) [p.x, p.z] = [b.x, b.z];
      }
      this.move(b.yaw, sx, sz, o);
      if (sx || sz) o.dyaw = clampTurn(wrapAngle(Math.atan2(sx, sz) - b.yaw), TURN * dt);
      // Close: become the thing on the way in (as itself it's quicker).
      if (d < 0.6 && me.form !== p.f) o.become = p.f;
      if (d > 0.9) this.unstick(dt, me, o);
      return o;
    }
    if (me.form !== p.f) o.become = p.f;
    else if (Math.hypot(b.vx, b.vz) < 0.3 && b.ground) {
      // Face the way its kind faces, then lock.
      o.dyaw = clampTurn(wrapAngle(this.faceOf(p) - b.yaw), TURN * dt);
      if (Math.abs(wrapAngle(this.faceOf(p) - b.yaw)) < 0.15) o.lock = true;
    }
    return o;
  }

  /**
   * A hiding plan: a form a real thing on the floor has, and a spot beside one of them. Now and
   * then (a sloppier vätte more often) a spot in the open instead, the mistake kusiner live for.
   */
  private choose(me: Pawn, w: World): { f: number; x: number; z: number; y?: number } {
    // A kind first (six chairs mustn't make everyone a chair), then one of that kind to stand by.
    const floor = REAL_THINGS.filter((th) => th.f >= 0 && th.y < 0.05);   // on a floor or the lawn
    const kinds = [...new Set(floor.map((th) => th.f))];
    const open = this.rand() < 0.15 / this.skill;
    for (let tries = 0; tries < 24; tries++) {
      const f = kinds[Math.floor(this.rand() * kinds.length)];
      const ofKind = floor.filter((th) => th.f === f);
      const th = ofKind[Math.floor(this.rand() * ofKind.length)];
      const { r, h } = formBox(th.f), m = moveOf(false, th.f), rr = Math.min(r, m.radius);
      const a = this.rand() * Math.PI * 2, gap = open ? 1.5 + this.rand() * 1.5 : th.r + r + 0.08;
      const x = th.x + Math.sin(a) * gap, z = th.z + Math.cos(a) * gap;
      if (w.arena.boxHits(x - rr, th.y + 0.02, z - rr, x + rr, th.y + h, z + rr)) continue;
      const node = w.arena.nav.nodes[w.arena.nav.nearest(x, th.y, z)];
      if (!node || Math.hypot(node.x - x, node.z - z) > 0.6) continue;
      // A spot it can't walk to (boxed in by the table and the wall) is no spot at all.
      if (!this.follow.goTo(me.body, x, th.y, z)) continue;
      return { f: th.f, x, z, y: th.y };
    }
    // Nowhere good: be a cup in the corner by the door. (It happens.)
    return { f: 0, x: 4.0 + this.rand() * 0.6, z: 4.6 };
  }

  /** The yaw its kind stands at nearby (chairs face the table), so the copy looks like the rest. */
  private faceOf(p: { f: number; x: number; z: number }) {
    let best = 0, bestD = Infinity;
    for (const th of REAL_THINGS) {
      if (th.f !== p.f) continue;
      const d = Math.hypot(th.x - p.x, th.z - p.z);
      if (d < bestD) [best, bestD] = [th.p.yaw, d];
    }
    return best;
  }

  // ------------------------------------------------------------ both

  private move(yaw: number, mx: number, mz: number, o: Intent) {
    const stick = stickFor(yaw, mx, mz);
    const len = Math.max(1, Math.hypot(stick.fwd, stick.side));
    o.fwd = stick.fwd / len;
    o.side = stick.side / len;
  }

  /** Stuck on something: hop, and find another way. */
  private unstick(dt: number, me: Pawn, o: Intent) {
    const b = me.body;
    this.stuckT += dt;
    if (this.stuckT < 1) return;
    const trying = Math.abs(o.fwd) + Math.abs(o.side) > 0.3;
    if (trying && Math.hypot(b.x - this.stuckX, b.z - this.stuckZ) < 0.4) {
      o.jump = true;
      this.follow.reset();
      if (this.plan && this.rand() < 0.5) this.plan = null;
    }
    this.stuckT = 0;
    this.stuckX = b.x;
    this.stuckZ = b.z;
  }
}

/** How far the nearest kusin in play is. */
function nearestKusin(me: Pawn, w: World) {
  let d = Infinity;
  for (const p of w.pawns.values()) if (p !== me && w.alive(p) && w.role(p) === 'k') d = Math.min(d, Math.hypot(p.body.x - me.body.x, p.body.z - me.body.z));
  return d;
}

const clampTurn = (a: number, max: number) => Math.max(-max, Math.min(max, a));


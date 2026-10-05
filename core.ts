/**
 * The netcode, with no three.js and no DOM, so `rules.test.ts` can run whole sessions headless
 * (FakeRoom: joins, leaves, the host leaving, reloads). game.ts feeds it your intent each frame
 * and draws what it says.
 *
 * The recipe (vp docs fps, vp docs netcode):
 * - Everyone moves their own body at once and streams it (PlayerSync): where it is, where it
 *   looks, and for a vätte which thing it is (`f`) and whether it's locked still (`lk`). The host
 *   runs the CPUs.
 * - A kusin decides what its dart hit, from what it sees: the walls and furniture (the grid), every
 *   real thing in the kitchen, and every vätte's body as drawn, in its form's box. It sends the dart
 *   (so everyone draws it flying and sticking) and a claim: a vätte it hit, or a wrong guess.
 * - The host judges claims (plausible?) and owns the match: roles, darts, catches, patience,
 *   respawns. It broadcasts snapshots and events (HostSync) and keeps the match with the room, so a
 *   new host carries on. A spawn names the spot; whoever runs that body moves it there.
 */
import {
  HostSync, PlayerSync, Seats, botRng, fpsStep, mulberry32, newFpsBody, rayBox, spreadDir, turn,
  type GameFrame, type LinkPlayer, type MinigameLink, type Rng,
} from '@voxelparty/sdk/core';
import { Bot, IDLE, NO_FORM, type Intent } from './bot';
import { Arena, DEATH_Y } from './map';
import { FIRE_MS, FireRate, Match, RANGE, SPREAD, isEv, isSnap, type Ev, type Role, type Snap } from './rules';
import { FORMS, KUSIN_MOVE, REAL_THINGS, VATTE, formBox, formHp, moveOf } from './things';

/** What each player streams about their body: feet, look, life, and (a vätte) its form and lock. */
export type Net = { x: number; y: number; z: number; yw: number; pt: number; l: number; f: number; lk: number };

/**
 * A player's one-offs: a dart (from o to e; `t` the real thing it stuck in, -1 none; `v` 1 if it
 * hit a vätte), a claim on a vätte, a wrong guess, a taunt.
 */
export type Shot =
  | { k: 'shot'; o: number[]; e: number[]; t: number; v: number }
  | { k: 'hit'; v: string; l: number }
  | { k: 'wrong'; t: number }
  | { k: 'taunt' };

/** Something to show: game.ts turns these into effects and sounds, exactly once each. */
export type Cue =
  | { k: 'shot'; pid: string; o: number[]; e: number[]; t: number; v: number }
  | { k: 'dmg'; v: string; a: string; hits: number }
  | { k: 'wrong'; a: string; t: number; hp: number }
  | { k: 'frag'; v: string; a: string }
  | { k: 'poff'; pid: string; from: number; to: number }
  | { k: 'lock'; pid: string; on: boolean }
  | { k: 'taunt'; pid: string }
  | { k: 'role'; pid: string; r: Role }
  | { k: 'spawn'; pid: string }
  | { k: 'jump'; pid: string }
  | { k: 'land'; pid: string; speed: number }
  | { k: 'win'; pid: string; r: number };

/** Everything a CPU gets to know. */
export interface World {
  readonly arena: Arena;
  readonly pawns: ReadonlyMap<string, Pawn>;
  readonly now: number;
  alive(p: Pawn): boolean;
  role(p: Pawn): Role;
  /** A vätte's darts taken this life. */
  hits(p: Pawn): number;
}

/** A player's body on this client: simulated here (`own`), or drawn from their stream. */
export class Pawn {
  readonly body = newFpsBody();
  /** Our own: in play. (Everyone else's comes from the match.) */
  alive = false;
  /** The life it's on: ours from the host's spawns, others' from their stream. */
  life = 0;
  own = false;
  cool = 0;
  /** A vätte's form: an index into FORMS, or VATTE (-1) as itself. */
  form = VATTE;
  /** A vätte locked still (it can look round, not move). */
  locked = false;
  tauntCool = 0;
  /** This frame's step-ups and landing speed, for the camera. */
  stepped = 0;
  landed = 0;

  constructor(readonly pid: string, readonly rand: Rng) {}
}

/** CPU skills, handed out in the order they're first seen. */
const BOT_SKILL = [0.8, 1, 1.15, 0.9];
/** How long a player may stream the wrong life before the host spawns them again (a spawn they missed). */
const STALE_MS = 1500;
/** Taunts: one every this many seconds. */
const TAUNT_S = 1.5;
/** A dart that reaches a thing's box within this of the grid's coarser cells hit the thing. */
const THING_SLACK = 0.3;
/** How far a vätte reaches to become something. */
export const REACH = 2.6;

const r2 = (v: number) => Math.round(v * 100) / 100;
const isVec = (v: unknown): v is number[] => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

/** What a ray from (o) along (d) meets first: the grid, a real thing (its index), or a vätte. */
export interface RayHit {
  t: number;
  thing: number;
  pawn: Pawn | null;
}

export class Core implements World {
  readonly arena = new Arena();
  readonly match = new Match();
  readonly seats: Seats;
  readonly pawns = new Map<string, Pawn>();
  /** Effects to show; game.ts drains it every frame. */
  readonly cues: Cue[] = [];
  now = 0;
  private readonly moves: PlayerSync<Net, Shot>;
  private readonly sync: HostSync<Snap, Ev>;
  private readonly rate = new FireRate();
  private readonly bots = new Map<string, Bot>();
  private readonly inbox: Ev[] = [];
  private readonly offs: (() => void)[] = [];
  /** Host: since when each player has streamed the wrong life. */
  private readonly stale = new Map<string, number>();
  private readonly dir = [0, 0, 0];
  private roster: readonly LinkPlayer[] = [];
  /** Host: the roster the roles were last balanced for. */
  private balanced: readonly LinkPlayer[] | null = null;
  private wasHost: boolean;
  private botsMade = 0;
  /** CPUs a staged scene holds still (`stage`'s `hold`). */
  private readonly held = new Set<string>();
  private spawnNo = 0;

  constructor(
    readonly link: MinigameLink,
    private readonly frame: GameFrame,
    /** This player's intent for the frame (game.ts reads the mouse and keys); null: your CPU plays for you (autopilot). */
    private readonly intent: () => Intent | null,
  ) {
    this.seats = new Seats(link);
    this.moves = new PlayerSync<Net, Shot>(link, { angles: ['yw'] });
    this.sync = new HostSync<Snap, Ev>(link, {
      valid: isSnap,
      // The match stays with the room, so a new host (or a host that reloaded) carries on.
      keep: { save: () => this.match.save(), load: (w) => this.match.load(w) },
    });
    this.offs.push(this.sync.onEvent((e) => isEv(e) && this.inbox.push(e)));
    this.offs.push(this.moves.onEvent((_i, e, pid) => this.heard(pid, e)));
    this.offs.push(this.moves.onReset((_i, pid) => this.restarted(pid)));
    this.wasHost = link.isHost;
    this.now = link.now();
    this.follow();
  }

  update(dt: number) {
    const { link } = this;
    const now = (this.now = link.now());
    this.follow();
    // Just became host: the old host's last words first.
    if (link.isHost && !this.wasHost) for (const e of this.inbox.splice(0)) this.apply(e);
    this.wasHost = link.isHost;
    if (!link.isHost) this.hear();

    link.players.forEach((lp, i) => {
      const p = this.pawns.get(lp.id);
      if (!p) return;
      const role = this.seats.role(i), own = role !== 'remote';
      if (own && !p.own) this.adopt(p);
      p.own = own;
      if (!own) return this.remote(p, i);
      const it = !this.frame.live || this.held.has(lp.id) ? IDLE : role === 'local' ? (this.intent() ?? this.bot(lp.id).update(dt, p, this)) : this.bot(lp.id).update(dt, p, this);
      this.play(p, i, it, dt);
      const b = p.body;
      this.moves.send(i, { x: r2(b.x), y: r2(b.y), z: r2(b.z), yw: r2(b.yaw), pt: r2(b.pitch), l: p.life, f: p.form, lk: p.locked ? 1 : 0 });
    });

    if (link.isHost) this.host(dt, now);
  }

  /** Your body, if you play. */
  me(): Pawn | undefined {
    return this.link.you ? this.pawns.get(this.link.you) : undefined;
  }

  /** Is this body in play? Ours by what the host told us; everyone else's by the match. */
  alive(p: Pawn): boolean {
    return p.own ? p.alive : !!this.match.stats.get(p.pid)?.alive;
  }

  role(p: Pawn): Role {
    return this.match.stats.get(p.pid)?.role ?? 'v';
  }

  hits(p: Pawn): number {
    return this.match.stats.get(p.pid)?.hits ?? 0;
  }

  /**
   * What a ray meets first: the walls and furniture, a real thing (its box, as map.ts fills the
   * grid), or a vätte's body in its form's box. `skip` is the one looking.
   */
  cast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, max: number, skip: Pawn | null): RayHit {
    // A real thing stands in grid cells a little bigger than itself: one just behind the grid's hit is still the thing.
    let t = this.arena.ray(ox, oy, oz, dx, dy, dz, max), thing = -1, pawn: Pawn | null = null, tt = Math.min(max, t + THING_SLACK);
    REAL_THINGS.forEach((th, j) => {
      const u = rayBox(ox, oy, oz, dx, dy, dz, th.x, th.y, th.z, tt, th.r, th.h);
      if (u >= 0 && u < tt) [tt, thing] = [u, j];
    });
    if (thing >= 0) t = tt;
    for (const q of this.pawns.values()) {
      if (q === skip || !this.alive(q) || this.role(q) !== 'v') continue;
      const { r, h } = formBox(q.form);
      const u = rayBox(ox, oy, oz, dx, dy, dz, q.body.x, q.body.y, q.body.z, t, r, h);
      if (u >= 0 && u < t) [t, thing, pawn] = [u, -1, q];
    }
    return { t, thing, pawn };
  }

  /** The thing a vätte looks at within reach: its form, or NO_FORM. */
  aimedForm(p: Pawn): number {
    const b = p.body, m = moveOf(false, p.form);
    const [dx, dy, dz] = spreadDir(b.yaw, b.pitch, 0, () => 0.5, this.dir);
    const hit = this.cast(b.x, b.y + m.eye, b.z, dx, dy, dz, REACH, p);
    return hit.thing >= 0 && !hit.pawn ? REAL_THINGS[hit.thing].f : NO_FORM;
  }

  /**
   * Host, for staged scenes (`vp shot` scripts, voxelparty-kvalitet §6): make `pid` a kusin or a
   * vätte now and start them a new life as it, at spawn spot `s`; `hold` keeps a CPU standing still.
   */
  stage(pid: string, r: Role, s = 0, hold = false) {
    const st = this.match.stats.get(pid);
    if (!this.link.isHost || !st) return false;
    if (hold) this.held.add(pid);
    else this.held.delete(pid);
    st.role = r;
    this.emit({ k: 'role', pid, r });
    this.emit(this.match.respawn(pid, s));
    return true;
  }

  dispose() {
    for (const off of this.offs) off();
    this.sync.dispose();
    this.moves.dispose();
  }

  // ------------------------------------------------------------ everyone

  /** Match the pawns and the match to the roster when it changes (it's a new array each time). */
  private follow() {
    if (this.link.players === this.roster) return;
    this.roster = this.link.players;
    const ids = this.roster.map((p) => p.id);
    for (const id of ids) if (!this.pawns.has(id)) this.pawns.set(id, new Pawn(id, mulberry32(hash(id) ^ this.link.seed)));
    for (const id of [...this.pawns.keys()]) {
      if (ids.includes(id)) continue;
      this.pawns.delete(id);
      this.bots.delete(id);
      this.stale.delete(id);
      this.rate.forget(id);
    }
    this.match.sync(ids);
  }

  /** We just started running a body someone else ran (a CPU after a host change): carry on with it. */
  private adopt(p: Pawn) {
    const st = this.match.stats.get(p.pid);
    p.alive = !!st?.alive && st.life === p.life;
    p.body.vx = p.body.vy = p.body.vz = 0;
  }

  private bot(pid: string): Bot {
    let b = this.bots.get(pid);
    if (!b) {
      const k = this.botsMade++;
      this.bots.set(pid, (b = new Bot(botRng(this.link.seed, 0xf9a + k), BOT_SKILL[k % BOT_SKILL.length], this)));
    }
    return b;
  }

  /** Move, look, shoot or hide for a body this client runs (you, or a CPU on the host). */
  private play(p: Pawn, i: number, it: Intent, dt: number) {
    p.stepped = p.landed = 0;
    if (!p.alive) return;
    const b = p.body, kusin = this.role(p) === 'k';
    p.tauntCool -= dt;
    if (!kusin) this.hide(p, i, it);
    // A locked vätte stays exactly as it is: the look is the camera's (game.ts), not the body's.
    if (!p.locked) turn(b, it.dyaw, it.dpitch);
    if (!this.frame.live) return;
    const r = fpsStep(this.arena, b, p.locked ? IDLE : it, dt, moveOf(kusin, p.form));
    p.stepped = r.stepped;
    if (r.jumped) this.cues.push({ k: 'jump', pid: p.pid });
    if (r.landed > 6) {
      p.landed = r.landed;
      this.cues.push({ k: 'land', pid: p.pid, speed: r.landed });
    }
    if (b.y < DEATH_Y) {
      // Fell out: out of play at once here, and the host counts it.
      p.alive = false;
      if (this.link.isHost) for (const e of this.match.fall(p.pid, p.life, this.now)) this.emit(e);
      else this.moves.event(i, { k: 'hit', v: p.pid, l: p.life });
      return;
    }
    if (!kusin) return;
    p.cool -= dt;
    if (it.fire && p.cool <= 0) {
      p.cool = FIRE_MS / 1000;
      this.fire(p, i);
    }
  }

  /** A vätte's own moves: become a thing, lock or unlock, taunt. */
  private hide(p: Pawn, i: number, it: Intent) {
    if (it.become !== NO_FORM && it.become !== p.form && this.fits(p, it.become)) {
      this.cues.push({ k: 'poff', pid: p.pid, from: p.form, to: it.become });
      p.form = it.become;
      p.locked = false;
    }
    if (it.lock && (p.locked || p.body.ground)) {
      p.locked = !p.locked;
      if (p.locked) Object.assign(p.body, { vx: 0, vz: 0 });
      this.cues.push({ k: 'lock', pid: p.pid, on: p.locked });
    }
    if (it.taunt && p.tauntCool <= 0) {
      p.tauntCool = TAUNT_S;
      this.cues.push({ k: 'taunt', pid: p.pid });
      this.moves.event(i, { k: 'taunt' });
    }
  }

  /** Is there room for this form where the body stands? (A chair doesn't fit under the table.) */
  private fits(p: Pawn, f: number): boolean {
    if (f !== VATTE && !FORMS[f]) return false;
    const b = p.body, { r, h } = formBox(f), m = moveOf(false, f);
    const rr = Math.min(r, m.radius);
    return !this.arena.boxHits(b.x - rr, b.y + 0.02, b.z - rr, b.x + rr, b.y + h, b.z + rr);
  }

  /** A dart from the kusin's eye: whatever it meets first. A vätte is a claim, a real thing a wrong guess. */
  private fire(p: Pawn, i: number) {
    const b = p.body, ox = b.x, oy = b.y + KUSIN_MOVE.eye, oz = b.z;
    const [dx, dy, dz] = spreadDir(b.yaw, b.pitch, SPREAD, p.rand, this.dir);
    const hit = this.cast(ox, oy, oz, dx, dy, dz, RANGE, p);
    const o = [r2(ox), r2(oy), r2(oz)], e = [r2(ox + dx * hit.t), r2(oy + dy * hit.t), r2(oz + dz * hit.t)];
    const shot = { k: 'shot' as const, o, e, t: hit.thing, v: hit.pawn ? 1 : 0 };
    this.cues.push({ ...shot, pid: p.pid });
    this.moves.event(i, shot);
    if (hit.pawn) this.claim(p, i, { k: 'hit', v: hit.pawn.pid, l: hit.pawn.life });
    else if (hit.thing >= 0) this.claim(p, i, { k: 'wrong', t: hit.thing });
  }

  /** A claim: the host judges it now; anyone else asks the host. */
  private claim(p: Pawn, i: number, c: Shot) {
    if (this.link.isHost) this.judge(p.pid, c);
    else this.moves.event(i, c);
  }

  /** Something the host said: follow it in our copy of the match, move our body if it's a spawn, show it. */
  private apply(e: Ev) {
    this.match.follow(e, this.now);
    if (e.k === 'dmg') this.cues.push({ k: 'dmg', v: e.v, a: e.a, hits: e.hits });
    else if (e.k === 'wrong') this.cues.push({ k: 'wrong', a: e.a, t: e.t, hp: e.hp });
    else if (e.k === 'role') this.cues.push({ k: 'role', pid: e.pid, r: e.r });
    else if (e.k === 'frag') {
      const p = this.pawns.get(e.v);
      if (p?.own) p.alive = false;
      this.cues.push({ k: 'frag', v: e.v, a: e.a });
    } else if (e.k === 'spawn') {
      const p = this.pawns.get(e.pid), s = this.arena.spawns[e.s];
      if (!p || !s) return;
      p.life = e.l;
      if (p.own) {
        Object.assign(p.body, newFpsBody(s.x, s.y, s.z, s.yaw));
        Object.assign(p, { alive: true, cool: 0, form: VATTE, locked: false });
      }
      this.cues.push({ k: 'spawn', pid: e.pid });
    } else if (e.k === 'win') this.cues.push({ k: 'win', pid: e.pid, r: e.r });
  }

  /** Other players' one-offs: darts to draw, taunts to hear, and (on the host) claims to judge. */
  private heard(pid: string, e: Shot) {
    if (!e || typeof e !== 'object') return;
    if (e.k === 'shot' && isVec(e.o) && isVec(e.e) && Number.isInteger(e.t) && (e.v === 0 || e.v === 1)) {
      this.cues.push({ k: 'shot', pid, o: e.o, e: e.e, t: e.t, v: e.v });
    } else if (e.k === 'taunt') this.cues.push({ k: 'taunt', pid });
    else if (this.link.isHost) this.judge(pid, e);
  }

  /** A player's game started over (a reload): forget what we counted for them; they need a body again. */
  private restarted(pid: string) {
    this.rate.forget(pid);
    const st = this.match.stats.get(pid);
    if (this.link.isHost && st?.alive) this.emit(this.match.respawn(pid, this.spot(pid)));
  }

  /** Someone else's body: where their stream says, drawn a moment behind; a new form or lock is a cue. */
  private remote(p: Pawn, i: number) {
    const s = this.moves.smooth(i), l = this.moves.latest(i);
    if (s && [s.x, s.y, s.z, s.yw, s.pt].every(Number.isFinite)) Object.assign(p.body, { x: s.x, y: s.y, z: s.z, yaw: s.yw, pitch: s.pt });
    if (!l) return;
    if (Number.isInteger(l.l)) p.life = l.l;
    const f = Number.isInteger(l.f) && (l.f === VATTE || FORMS[l.f]) ? l.f : VATTE;
    if (f !== p.form) {
      this.cues.push({ k: 'poff', pid: p.pid, from: p.form, to: f });
      p.form = f;
    }
    const lk = l.lk === 1;
    if (lk !== p.locked) {
      p.locked = lk;
      this.cues.push({ k: 'lock', pid: p.pid, on: lk });
    }
  }

  // ------------------------------------------------------------ host

  private host(dt: number, now: number) {
    if (this.balanced !== this.link.players) {
      // Kusiner and vättar as the room wants them; a changed role starts a new life as it.
      this.balanced = this.link.players;
      for (const e of this.match.balance(this.link.players.map((p) => p.id))) {
        this.emit(e);
        if (e.k === 'role' && this.match.stats.get(e.pid)?.life) this.emit(this.match.respawn(e.pid, this.spot(e.pid)));
      }
    }
    if (this.frame.live) for (const e of this.match.tick(now, (pid) => this.spot(pid))) this.emit(e);
    this.heal(now);
    this.sync.tick(dt, () => this.match.snapshot(this.link.players.map((p) => p.id)));
  }

  /** Tell everyone, and do it here too. */
  private emit(e: Ev) {
    this.sync.event(e);
    this.apply(e);
  }

  /**
   * Is a claim plausible? A dart in range, not faster than the gun fires, at a vätte (its form's
   * darts, as we see it) or a real thing; or a fall (a player claiming their own body). Then the
   * match decides.
   */
  private judge(a: string, c: Shot) {
    const pa = this.pawns.get(a);
    if (!pa) return;
    if (c.k === 'hit') {
      if (typeof c.v !== 'string' || !Number.isInteger(c.l)) return;
      if (c.v === a) {
        for (const e of this.match.fall(a, c.l, this.now)) this.emit(e);
        return;
      }
      const pv = this.pawns.get(c.v);
      if (!pv || Math.hypot(pa.body.x - pv.body.x, pa.body.y - pv.body.y, pa.body.z - pv.body.z) > RANGE + 4) return;
      if (!this.rate.take(a, this.now)) return;
      for (const e of this.match.hit(a, c.v, c.l, formHp(pv.form), this.now)) this.emit(e);
    } else if (c.k === 'wrong') {
      const th = REAL_THINGS[c.t];
      if (!th || Math.hypot(pa.body.x - th.x, pa.body.z - th.z) > RANGE + 4) return;
      if (!this.rate.take(a, this.now)) return;
      for (const e of this.match.wrong(a, c.t, this.now)) this.emit(e);
    }
  }

  /**
   * Nobody may be stuck: a body the match says is alive but that isn't (we reloaded or took over
   * as host; a player whose game missed its spawn and streams the wrong life) gets a fresh spawn.
   */
  private heal(now: number) {
    this.link.players.forEach((lp, i) => {
      const st = this.match.stats.get(lp.id), p = this.pawns.get(lp.id);
      if (!st?.alive || !p) return void this.stale.delete(lp.id);
      if (p.own) {
        if (!p.alive || p.life !== st.life) this.emit(this.match.respawn(lp.id, this.spot(lp.id)));
        return;
      }
      const l = this.moves.latest(i)?.l;
      if (l === undefined || l === st.life) return void this.stale.delete(lp.id);
      const since = this.stale.get(lp.id) ?? now;
      this.stale.set(lp.id, since);
      if (now - since > STALE_MS) {
        this.stale.delete(lp.id);
        this.emit(this.match.respawn(lp.id, this.spot(lp.id)));
      }
    });
  }

  /** The spawn spot farthest from everyone else in play (taking turns among ties). */
  private spot(pid: string): number {
    const spawns = this.arena.spawns, n = spawns.length, k0 = this.spawnNo++;
    let best = 0, bestD = -1;
    for (let j = 0; j < n; j++) {
      const k = (k0 + j) % n, s = spawns[k];
      let d = 99;
      for (const q of this.pawns.values()) if (q.pid !== pid && this.alive(q)) d = Math.min(d, Math.hypot(q.body.x - s.x, q.body.z - s.z));
      if (d > bestD + 0.5) [best, bestD] = [k, d];
    }
    return best;
  }

  // ------------------------------------------------------------ clients

  /** The host's word: its events (exactly once, in order), then its newest snapshot. */
  private hear() {
    for (const e of this.inbox.splice(0)) this.apply(e);
    const s = this.sync.fresh();
    if (s) this.match.apply(s, this.now);
  }
}


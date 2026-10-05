/**
 * A CPU, three-free. It walks the arena's paths (to where it last saw someone, else a spawn spot
 * where people turn up), and fights what it can see: it notices you after a human reaction time,
 * tracks with an aiming error that settles but never vanishes, strafes and hops while it shoots.
 */
import { FPS_ARENA, PathFollower, ThinkTimer, stickFor, wrapAngle, type Rng } from '@voxelparty/sdk/core';
import type { Pawn, World } from './core';
import { RANGE } from './rules';

/** What a player does this frame: the same shape for a human (`readIntent` in game.ts) and a bot. */
export interface Intent {
  fwd: number;
  side: number;
  jump: boolean;
  /** How far to turn, radians. */
  dyaw: number;
  dpitch: number;
  fire: boolean;
}

export const IDLE: Readonly<Intent> = { fwd: 0, side: 0, jump: false, dyaw: 0, dpitch: 0, fire: false };

/** How fast it can turn, radians a second. */
const TURN = 7;

export class Bot {
  private readonly follow: PathFollower;
  private readonly think: ThinkTimer;
  private readonly look: ThinkTimer;
  private target: { pid: string; seen: number } | null = null;
  private lastSeen: { x: number; y: number; z: number; at: number } | null = null;
  private errYaw = 0;
  private errPitch = 0;
  private strafe = 1;
  private strafeT = 0;
  private stuckT = 0;
  private stuckX = 0;
  private stuckZ = 0;
  /** How long it's had nowhere to go (it plans again after a moment, not every frame). */
  private idleT = 0;
  private readonly out: Intent = { ...IDLE };

  /** `skill` scales reaction, aim and turning (0.7 sloppy .. 1.2 sharp). */
  constructor(private readonly rand: Rng, readonly skill: number, w: World) {
    this.follow = new PathFollower(w.arena.nav);
    this.think = new ThinkTimer(1 / skill, rand);
    this.look = new ThinkTimer(0.2 / skill, rand);
  }

  update(dt: number, me: Pawn, w: World): Intent {
    const o = Object.assign(this.out, IDLE);
    if (!me.alive) {
      this.follow.reset();
      this.target = null;
      return o;
    }
    const b = me.body;
    if (this.look.tick(dt)) this.spot(me, w);
    if (this.target) this.aim(dt, me, w);

    // Launched by the pad: let it carry us, and plan again from wherever we land.
    const flying = this.follow.flying(b);
    this.idleT = this.follow.idle ? this.idleT + dt : 0;
    if (!flying && (this.think.tick(dt) || this.idleT > 0.25)) {
      this.idleT = 0;
      this.plan(me, w);
    }
    const s = this.follow.steer(b);
    let mx = s.x, mz = s.z;
    o.jump = s.jump;
    const t = this.target && w.pawns.get(this.target.pid);
    if (t && !flying) {
      // In a fight: side-step across the line of fire, now and then the other way, and hop.
      this.strafeT -= dt;
      if (this.strafeT <= 0) {
        this.strafe = this.rand() < 0.5 ? -1 : 1;
        this.strafeT = 0.5 + this.rand();
      }
      const dx = t.body.x - b.x, dz = t.body.z - b.z, d = Math.hypot(dx, dz) || 1;
      let sx = (-dz / d) * this.strafe, sz = (dx / d) * this.strafe;
      // Not off the edge: strafe the other way if there's no floor over there.
      if (w.arena.groundBelow(b.x + sx * 1.5, b.y + 0.5, b.z + sz * 1.5) < b.y - 2) {
        [sx, sz] = [-sx, -sz];
        this.strafe = -this.strafe;
      }
      mx = mx * 0.5 + sx * 0.8;
      mz = mz * 0.5 + sz * 0.8;
      if (b.ground && this.rand() < dt * 0.8 * this.skill) o.jump = true;
    }
    const stick = stickFor(b.yaw, mx, mz);
    const len = Math.hypot(stick.fwd, stick.side) || 1;
    o.fwd = stick.fwd / len;
    o.side = stick.side / len;
    // No one to shoot: look where we're going.
    if (!this.target && (mx || mz)) {
      o.dyaw = clampTurn(wrapAngle(Math.atan2(mx, mz) - b.yaw), TURN * 0.7 * dt);
      o.dpitch = clampTurn(-b.pitch * 0.5, dt);
    }
    this.unstick(dt, me, o);
    return o;
  }

  /** The nearest enemy in sight and roughly in front (or the one we're already fighting). */
  private spot(me: Pawn, w: World) {
    const b = me.body, ey = b.y + FPS_ARENA.eye;
    let best: Pawn | null = null, bestD = Infinity;
    for (const p of w.pawns.values()) {
      if (p === me || !w.alive(p)) continue;
      const dx = p.body.x - b.x, dz = p.body.z - b.z, d = Math.hypot(dx, p.body.y - b.y, dz);
      const known = this.target?.pid === p.pid;
      const facing = (Math.sin(b.yaw) * dx + Math.cos(b.yaw) * dz) / (Math.hypot(dx, dz) || 1);
      if (d > RANGE || (!known && facing < -0.2 && d > 5)) continue;
      if (!w.arena.sees(b.x, ey, b.z, p.body.x, p.body.y + 1.2, p.body.z)) continue;
      const score = d * (known ? 0.6 : 1);
      if (score < bestD) [best, bestD] = [p, score];
    }
    if (!best) {
      const t = this.target && w.pawns.get(this.target.pid);
      if (t) this.lastSeen = { x: t.body.x, y: t.body.y, z: t.body.z, at: w.now };
      this.target = null;
      return;
    }
    if (this.target?.pid !== best.pid) {
      this.target = { pid: best.pid, seen: 0 };
      // A fresh aiming error: good bots start closer.
      this.errYaw = (this.rand() - 0.5) * (0.5 / this.skill);
      this.errPitch = (this.rand() - 0.5) * (0.25 / this.skill);
    }
  }

  /** Turn towards the target's chest, and shoot once it's been seen long enough and we're on it. */
  private aim(dt: number, me: Pawn, w: World) {
    const t = w.pawns.get(this.target!.pid);
    if (!t || !w.alive(t)) {
      this.target = null;
      return;
    }
    this.target!.seen += dt;
    const b = me.body, ey = b.y + FPS_ARENA.eye;
    const dx = t.body.x - b.x, dy = t.body.y + 1.1 - ey, dz = t.body.z - b.z, d = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz), pitch = Math.atan2(dy, d);
    // The error settles as it tracks, but a wobble keeps it human.
    const settle = Math.exp(-dt * 1.6 * this.skill);
    this.errYaw = this.errYaw * settle + (this.rand() - 0.5) * 0.02 / this.skill;
    this.errPitch = this.errPitch * settle + (this.rand() - 0.5) * 0.012 / this.skill;
    const turn = TURN * (0.7 + this.skill * 0.4) * dt;
    this.out.dyaw = clampTurn(wrapAngle(yaw + this.errYaw - b.yaw), turn);
    this.out.dpitch = clampTurn(pitch + this.errPitch - b.pitch, turn * 0.7);
    const off = Math.abs(wrapAngle(yaw - b.yaw)) + Math.abs(pitch - b.pitch);
    this.out.fire = this.target!.seen > 0.45 / this.skill && off < 0.06 + 0.6 / Math.max(4, d);
  }

  /** Where next: where we last saw someone (for a few seconds), else a spawn spot. */
  private plan(me: Pawn, w: World) {
    const seen = this.lastSeen && w.now - this.lastSeen.at < 5000 ? this.lastSeen : null;
    const s = seen ?? w.arena.spawns[Math.floor(this.rand() * w.arena.spawns.length)];
    this.follow.goTo(me.body, s.x, s.y, s.z);
  }

  /** Stuck on something: hop, and find another way. */
  private unstick(dt: number, me: Pawn, o: Intent) {
    const b = me.body;
    this.stuckT += dt;
    if (this.stuckT < 1) return;
    const trying = Math.abs(o.fwd) + Math.abs(o.side) > 0.3;
    if (trying && !this.target && Math.hypot(b.x - this.stuckX, b.z - this.stuckZ) < 0.8) {
      o.jump = true;
      this.follow.reset();
    }
    this.stuckT = 0;
    this.stuckX = b.x;
    this.stuckZ = b.z;
  }
}

const clampTurn = (a: number, max: number) => Math.max(-max, Math.min(max, a));

/**
 * The house's two moving residents, three-free (scene.ts draws them): mormor, who strolls a fixed
 * route through the hall and the kitchen and stops for a while at each stop, and Misse the cat, who
 * sleeps in the armchair until a vätte moves near, then goes and sits beside it (a clue, not proof).
 * Visual only: neither blocks anybody, and neither is a real thing (nothing hides as them).
 */

export interface Pt {
  x: number;
  z: number;
}

export interface Pose extends Pt {
  yaw: number;
  moving: boolean;
}

/** Mormor: walks the route in turn, and waits 5–10 s at each stop. */
export class Mormor {
  private i = 0;
  private wait = 0;
  private pose: Pose;

  constructor(private readonly route: readonly Pt[], private readonly speed: number, private readonly rand: () => number) {
    this.pose = { x: route[0].x, z: route[0].z, yaw: 0, moving: false };
  }

  step(dt: number): Pose {
    const p = this.pose;
    if (this.wait > 0) {
      this.wait -= dt;
      p.moving = false;
      return p;
    }
    const goal = this.route[this.i];
    const dx = goal.x - p.x, dz = goal.z - p.z, d = Math.hypot(dx, dz);
    if (d < 0.05) {
      this.i = (this.i + 1) % this.route.length;
      this.wait = 5 + this.rand() * 5;
      p.moving = false;
      return p;
    }
    const s = Math.min(d, this.speed * dt);
    p.x += (dx / d) * s;
    p.z += (dz / d) * s;
    p.yaw = Math.atan2(dx, dz);
    p.moving = true;
    return p;
  }
}

/** Misse: sleeps in her chair, wakes for a moving vätte within reach, sits beside it, then goes home. */
export class Misse {
  /** Where she is, and which way she faces. */
  readonly pose: Pose;
  /** Asleep in the chair, walking, or sitting beside a vätte. */
  mode: 'sleep' | 'walk' | 'sit' = 'sleep';
  /** How far a vätte has to be, and moving, for her to notice (metres). */
  static readonly HEAR_M = 3;
  /** How long she keeps a vätte in mind after it stops moving (ms). */
  static readonly MIND_MS = 6000;
  private goal: Pt | null = null;
  private facing = 0;
  private seen = -Infinity;

  constructor(readonly home: Pt, private readonly seat: number, private readonly speed = 1.1) {
    this.pose = { x: home.x, z: home.z, yaw: 0, moving: false };
  }

  /** Called for every moving vätte, on every client alike: if it's near, she wakes and goes to sit beside it. */
  hear(x: number, z: number, now: number) {
    const dx = x - this.pose.x, dz = z - this.pose.z, d = Math.hypot(dx, dz);
    if (d > Misse.HEAR_M) return;
    // Her spot: half a metre from the vätte, on the side she's on.
    const ox = -dx / (d || 1), oz = -dz / (d || 1);
    this.goal = { x: x + ox * 0.5, z: z + oz * 0.5 };
    this.facing = Math.atan2(-ox, -oz);
    this.seen = now;
  }

  step(dt: number, now: number): Pose {
    const p = this.pose;
    if (this.goal && now - this.seen > Misse.MIND_MS) this.goal = null;
    const goal = this.goal ?? this.home;
    const dx = goal.x - p.x, dz = goal.z - p.z, d = Math.hypot(dx, dz);
    if (d > 0.08) {
      const s = Math.min(d, this.speed * dt);
      p.x += (dx / d) * s;
      p.z += (dz / d) * s;
      p.yaw = Math.atan2(dx, dz);
      p.moving = true;
      this.mode = 'walk';
      return p;
    }
    p.moving = false;
    if (this.goal) {
      p.yaw = this.facing;
      this.mode = 'sit';
    } else {
      p.yaw = Math.PI / 2;
      this.mode = 'sleep';
    }
    return p;
  }

  /** Her height: the chair's seat when asleep, the floor otherwise. */
  get y(): number {
    return this.mode === 'sleep' ? this.seat : 0;
  }
}

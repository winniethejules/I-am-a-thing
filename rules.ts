/**
 * The match, with no three.js and no DOM, so it runs headless under `bun test` too. The host keeps
 * the real one and decides everything in it (damage, frags, respawns, the round); every other
 * client keeps a copy from the host's snapshots, for the HUD. Everyone is keyed by player id:
 * people join and leave mid-game.
 */

export const MAX_HP = 100;
/** The blaster: damage per hit, time between shots, reach, and aim spread (radians). */
export const DAMAGE = 25;
export const FIRE_MS = 170;
export const RANGE = 60;
export const SPREAD = 0.012;
/** Falling off: enough to kill anyone. */
export const FALL = 999;
/** Back in play this long after dying. */
export const RESPAWN_MS = 2000;
/** First to this many frags wins the round; then everyone starts again from 0. */
export const WIN = 10;

export interface Stat {
  hp: number;
  frags: number;
  deaths: number;
  alive: boolean;
  /** Which life this is (a spawn starts the next one). A hit names the life it was aimed at, so it can't land on the next one. */
  life: number;
  /** When they died (link ms). */
  deadAt: number;
}

/** One-off things the host tells everyone (they ride along with its snapshots). */
export type Ev =
  | { k: 'dmg'; v: string; a: string; d: number; hp: number }
  /** `a === v`: fell off. */
  | { k: 'frag'; v: string; a: string }
  /** `s`: the spawn spot's index; `l`: the life it starts. Whoever runs `pid` moves it there. */
  | { k: 'spawn'; pid: string; s: number; l: number }
  | { k: 'win'; pid: string; r: number };

/** What the host broadcasts: the round, and per player id [hp, frags, deaths, alive 0/1, life]. */
export interface Snap {
  r: number;
  ids: string[];
  s: number[];
}

export const isSnap = (x: unknown): x is Snap => {
  const s = x as Snap;
  return !!s && typeof s.r === 'number' && Array.isArray(s.ids) && Array.isArray(s.s) && s.s.length === s.ids.length * 5
    && s.ids.every((id) => typeof id === 'string') && s.s.every(Number.isFinite);
};

export const isEv = (x: unknown): x is Ev => {
  const e = x as Ev;
  if (!e || typeof e !== 'object') return false;
  switch (e.k) {
    case 'dmg': return typeof e.v === 'string' && typeof e.a === 'string' && Number.isFinite(e.d) && Number.isFinite(e.hp);
    case 'frag': return typeof e.v === 'string' && typeof e.a === 'string';
    case 'spawn': return typeof e.pid === 'string' && Number.isInteger(e.s) && Number.isInteger(e.l);
    case 'win': return typeof e.pid === 'string' && Number.isInteger(e.r);
    default: return false;
  }
};

const fresh = (): Stat => ({ hp: 0, frags: 0, deaths: 0, alive: false, life: 0, deadAt: -Infinity });

export class Match {
  readonly stats = new Map<string, Stat>();
  round = 1;

  /** Match the roster: joiners start dead with no life yet (the host spawns them at once), leavers go. */
  sync(ids: readonly string[]) {
    for (const id of ids) if (!this.stats.has(id)) this.stats.set(id, fresh());
    for (const id of [...this.stats.keys()]) if (!ids.includes(id)) this.stats.delete(id);
  }

  /**
   * Host: `a` hit `v` for `d`, aimed at life `l`. What happened, or nothing if it doesn't stand:
   * the victim already died (two shooters, one kill) or has respawned since, or the shooter is dead.
   */
  hit(a: string, v: string, d: number, l: number, now: number): Ev[] {
    const sv = this.stats.get(v), sa = this.stats.get(a);
    if (!sv || !sa || !sv.alive || sv.life !== l || !(d > 0) || (a !== v && !sa.alive)) return [];
    sv.hp = Math.max(0, sv.hp - d);
    const out: Ev[] = [{ k: 'dmg', v, a, d, hp: sv.hp }];
    if (sv.hp > 0) return out;
    sv.alive = false;
    sv.deadAt = now;
    sv.deaths++;
    if (a !== v) sa.frags++;
    out.push({ k: 'frag', v, a });
    if (sa.frags >= WIN) {
      out.push({ k: 'win', pid: a, r: this.round });
      // A new round: scores from 0, everyone plays on.
      this.round++;
      for (const s of this.stats.values()) s.frags = s.deaths = 0;
    }
    return out;
  }

  /** Host, every frame: bring back whoever has waited long enough. `spot(pid)` picks where. */
  tick(now: number, spot: (pid: string) => number): Ev[] {
    const out: Ev[] = [];
    for (const [pid, s] of this.stats) if (!s.alive && now - s.deadAt >= RESPAWN_MS) out.push(this.respawn(pid, spot(pid)));
    return out;
  }

  /** Host: `pid` starts a new life at spawn spot `s`, whatever they were doing. */
  respawn(pid: string, s: number): Ev {
    const st = this.stats.get(pid)!;
    st.alive = true;
    st.hp = MAX_HP;
    st.life++;
    return { k: 'spawn', pid, s, l: st.life };
  }

  /** Clients: follow an event before the next snapshot confirms it (who's alive, on which life). */
  follow(e: Ev, now: number) {
    if (e.k === 'dmg') {
      const s = this.stats.get(e.v);
      if (s) s.hp = e.hp;
    } else if (e.k === 'frag') {
      const s = this.stats.get(e.v);
      if (s && s.alive) Object.assign(s, { alive: false, deadAt: now });
    } else if (e.k === 'spawn') {
      const s = this.stats.get(e.pid);
      if (s && e.l >= s.life) Object.assign(s, { alive: true, hp: MAX_HP, life: e.l });
    }
  }

  snapshot(ids: readonly string[]): Snap {
    const s: number[] = [];
    for (const id of ids) {
      const st = this.stats.get(id) ?? fresh();
      s.push(st.hp, st.frags, st.deaths, st.alive ? 1 : 0, st.life);
    }
    return { r: this.round, ids: ids.slice(), s };
  }

  /** Clients: take the host's word (for players we know of). */
  apply(snap: Snap, now: number) {
    this.round = snap.r;
    snap.ids.forEach((id, j) => {
      const st = this.stats.get(id);
      if (!st) return;
      const [hp, frags, deaths, alive, life] = snap.s.slice(j * 5, j * 5 + 5);
      if (st.alive && !alive) st.deadAt = now;
      Object.assign(st, { hp, frags, deaths, alive: alive === 1, life });
    });
  }

  /** The whole match as plain JSON, for the next host (HostSync's `keep`). */
  save() {
    // (-Infinity isn't JSON: "never died" goes as 0, long ago.)
    return { r: this.round, st: [...this.stats].map(([id, s]) => [id, s.hp, s.frags, s.deaths, s.alive ? 1 : 0, s.life, Number.isFinite(s.deadAt) ? s.deadAt : 0]) };
  }

  /** Take over a kept match. It came over the network: anything malformed is skipped. */
  load(w: unknown) {
    const k = w as { r?: unknown; st?: unknown };
    if (!k || !Number.isInteger(k.r) || !Array.isArray(k.st)) return;
    this.round = k.r as number;
    for (const row of k.st as unknown[]) {
      if (!Array.isArray(row) || typeof row[0] !== 'string' || !row.slice(1).every((v) => typeof v === 'number')) continue;
      const st = this.stats.get(row[0]);
      if (!st) continue;
      const [, hp, frags, deaths, alive, life, deadAt] = row as [string, number, number, number, number, number, number];
      Object.assign(st, { hp, frags, deaths, alive: alive === 1, life, deadAt: Number.isFinite(deadAt) ? deadAt : -Infinity });
    }
  }
}

/**
 * Host: how many hits a shooter may claim. Shots are FIRE_MS apart, but claims arrive in bursts
 * (they ride along with the shooter's state, 20 times a second), so a few may come at once.
 */
export class FireRate {
  private readonly b = new Map<string, { n: number; t: number }>();

  take(pid: string, now: number): boolean {
    const b = this.b.get(pid) ?? { n: 3, t: now };
    b.n = Math.min(3, b.n + (now - b.t) / FIRE_MS);
    b.t = now;
    this.b.set(pid, b);
    if (b.n < 1) return false;
    b.n--;
    return true;
  }

  /** Their game restarted (or they left): start them afresh. */
  forget(pid: string) {
    this.b.delete(pid);
  }
}

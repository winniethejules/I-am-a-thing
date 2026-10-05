/**
 * The match, with no three.js and no DOM, so it runs headless under `bun test` too. The host keeps
 * the real one and decides everything in it (roles, darts, catches, wrong guesses, respawns); every
 * other client keeps a copy from the host's snapshots, for the HUD. Everyone is keyed by player id:
 * people join and leave mid-game.
 *
 * Phase 1 (PLAN.md): kusiner hunt vättar with suction darts. A dart in a vätte counts towards its
 * form's darts (a cup takes 1, a chair 2): enough, and it's caught (tagen). A dart in a real thing is
 * a wrong guess, and costs the kusin. Rounds and the hide phase come in phase 2.
 */

/** The kusin's patience. */
export const MAX_HP = 100;
/** A wrong guess costs this, a catch gives back this. */
export const WRONG = 8;
export const HEAL = 15;
/** The suction gun: time between darts, reach, aim spread (radians). */
export const FIRE_MS = 600;
export const RANGE = 25;
export const SPREAD = 0.006;
/** Falling out of the world (the house has no holes: a safety net). */
export const FALL = 999;
/** Back in play this long after being caught. */
export const RESPAWN_MS = 3000;
/** The first kusin to catch this many wins the round; then everyone starts again from 0. */
export const WIN = 6;
/** Kusiner : vättar, 1 : 3 (but always one of each once there are two players). */
export const VATTAR_PER_KUSIN = 3;

export type Role = 'k' | 'v';

export interface Stat {
  role: Role;
  /** Kusin: patience left. */
  hp: number;
  /** Vätte: darts taken this life. */
  hits: number;
  /** Kusin: vättar caught this round. Vätte: times it got away (phase 2). */
  frags: number;
  deaths: number;
  alive: boolean;
  /** Which life this is (a spawn starts the next one). A hit names the life it was aimed at, so it can't land on the next one. */
  life: number;
  /** When they were caught or ran out of patience (link ms). */
  deadAt: number;
}

/** One-off things the host tells everyone (they ride along with its snapshots). */
export type Ev =
  /** A dart in vätte `v` from kusin `a`: `hits` taken so far this life. */
  | { k: 'dmg'; v: string; a: string; hits: number }
  /** Kusin `a` guessed wrong (thing `t` in REAL_THINGS, -1 for none): `hp` left. */
  | { k: 'wrong'; a: string; t: number; hp: number }
  /** `v` is out: caught by `a` (a vätte), or out of patience or fallen (`a === v`). `hp`: `a`'s patience now. */
  | { k: 'frag'; v: string; a: string; hp: number }
  /** `pid` is now a kusin or a vätte (from their next life). */
  | { k: 'role'; pid: string; r: Role }
  /** `s`: the spawn spot's index; `l`: the life it starts. Whoever runs `pid` moves it there. */
  | { k: 'spawn'; pid: string; s: number; l: number }
  | { k: 'win'; pid: string; r: number };

/** What the host broadcasts: the round, and per player id [role 0 kusin/1 vätte, hp, hits, frags, deaths, alive 0/1, life]. */
export interface Snap {
  r: number;
  ids: string[];
  s: number[];
}
const PER = 7;

export const isSnap = (x: unknown): x is Snap => {
  const s = x as Snap;
  return !!s && typeof s.r === 'number' && Array.isArray(s.ids) && Array.isArray(s.s) && s.s.length === s.ids.length * PER
    && s.ids.every((id) => typeof id === 'string') && s.s.every(Number.isFinite);
};

const isRole = (r: unknown): r is Role => r === 'k' || r === 'v';

export const isEv = (x: unknown): x is Ev => {
  const e = x as Ev;
  if (!e || typeof e !== 'object') return false;
  switch (e.k) {
    case 'dmg': return typeof e.v === 'string' && typeof e.a === 'string' && Number.isInteger(e.hits);
    case 'wrong': return typeof e.a === 'string' && Number.isInteger(e.t) && Number.isFinite(e.hp);
    case 'frag': return typeof e.v === 'string' && typeof e.a === 'string' && Number.isFinite(e.hp);
    case 'role': return typeof e.pid === 'string' && isRole(e.r);
    case 'spawn': return typeof e.pid === 'string' && Number.isInteger(e.s) && Number.isInteger(e.l);
    case 'win': return typeof e.pid === 'string' && Number.isInteger(e.r);
    default: return false;
  }
};

const fresh = (role: Role = 'v'): Stat => ({ role, hp: 0, hits: 0, frags: 0, deaths: 0, alive: false, life: 0, deadAt: -Infinity });

/** How many kusiner a room of `n` wants. */
export const kusinerFor = (n: number) => (n <= 1 ? n : Math.max(1, Math.round(n / (VATTAR_PER_KUSIN + 1))));

export class Match {
  readonly stats = new Map<string, Stat>();
  round = 1;

  /** Match the roster: joiners start out with no life yet (the host spawns them at once), leavers go. */
  sync(ids: readonly string[]) {
    for (const id of ids) if (!this.stats.has(id)) this.stats.set(id, fresh());
    for (const id of [...this.stats.keys()]) if (!ids.includes(id)) this.stats.delete(id);
  }

  /**
   * Host: the roles the room wants (kusinerFor), keeping everyone who already has the right one:
   * the earliest in the roster stay kusiner, newcomers fill what's missing. A changed role takes
   * effect at once (the player starts a new life as it).
   */
  balance(ids: readonly string[]): Ev[] {
    const want = kusinerFor(ids.length), out: Ev[] = [];
    let have = ids.filter((id) => this.stats.get(id)?.role === 'k').length;
    for (const id of ids) {
      const st = this.stats.get(id);
      if (!st) continue;
      if (st.role === 'v' && have < want) [st.role, have] = ['k', have + 1];
      else if (st.role === 'k' && have > want && ids.indexOf(id) >= want) [st.role, have] = ['v', have - 1];
      else continue;
      out.push({ k: 'role', pid: id, r: st.role });
    }
    return out;
  }

  /**
   * Host: kusin `a` put a dart in vätte `v`, aimed at life `l`; `cap` is the darts its form takes.
   * What happened, or nothing if it doesn't stand: the wrong roles, the vätte already caught (two
   * darts, one catch) or respawned since, or the kusin out.
   */
  hit(a: string, v: string, l: number, cap: number, now: number): Ev[] {
    const sv = this.stats.get(v), sa = this.stats.get(a);
    if (!sv || !sa || sv.role !== 'v' || sa.role !== 'k' || !sv.alive || sv.life !== l || !sa.alive) return [];
    sv.hits++;
    const out: Ev[] = [{ k: 'dmg', v, a, hits: sv.hits }];
    if (sv.hits < Math.max(1, cap)) return out;
    this.out(sv, now);
    sa.frags++;
    sa.hp = Math.min(MAX_HP, sa.hp + HEAL);
    out.push({ k: 'frag', v, a, hp: sa.hp });
    if (sa.frags >= WIN) {
      out.push({ k: 'win', pid: a, r: this.round });
      // A new round: scores from 0, everyone plays on.
      this.round++;
      for (const s of this.stats.values()) s.frags = s.deaths = 0;
    }
    return out;
  }

  /** Host: kusin `a` hit a real thing (`t`): it costs patience, and all of it puts them out for a moment. */
  wrong(a: string, t: number, now: number): Ev[] {
    const sa = this.stats.get(a);
    if (!sa || sa.role !== 'k' || !sa.alive) return [];
    sa.hp = Math.max(0, sa.hp - WRONG);
    const out: Ev[] = [{ k: 'wrong', a, t, hp: sa.hp }];
    if (sa.hp > 0) return out;
    this.out(sa, now);
    out.push({ k: 'frag', v: a, a, hp: 0 });
    return out;
  }

  /** Host: `v` fell out of the world on life `l`. */
  fall(v: string, l: number, now: number): Ev[] {
    const sv = this.stats.get(v);
    if (!sv || !sv.alive || sv.life !== l) return [];
    this.out(sv, now);
    return [{ k: 'frag', v, a: v, hp: sv.hp }];
  }

  private out(s: Stat, now: number) {
    s.alive = false;
    s.deadAt = now;
    s.deaths++;
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
    Object.assign(st, { alive: true, hp: MAX_HP, hits: 0, life: st.life + 1 });
    return { k: 'spawn', pid, s, l: st.life };
  }

  /** Clients: follow an event before the next snapshot confirms it. */
  follow(e: Ev, now: number) {
    const s = this.stats.get(e.k === 'wrong' ? e.a : e.k === 'dmg' || e.k === 'frag' ? e.v : e.pid);
    if (!s) return;
    if (e.k === 'dmg') s.hits = e.hits;
    else if (e.k === 'wrong') s.hp = e.hp;
    else if (e.k === 'role') s.role = e.r;
    else if (e.k === 'frag') {
      if (s.alive) Object.assign(s, { alive: false, deadAt: now });
      const a = this.stats.get(e.a);
      if (a && e.a !== e.v) a.hp = e.hp;
    } else if (e.k === 'spawn' && e.l >= s.life) Object.assign(s, { alive: true, hp: MAX_HP, hits: 0, life: e.l });
  }

  snapshot(ids: readonly string[]): Snap {
    const s: number[] = [];
    for (const id of ids) {
      const st = this.stats.get(id) ?? fresh();
      s.push(st.role === 'k' ? 0 : 1, st.hp, st.hits, st.frags, st.deaths, st.alive ? 1 : 0, st.life);
    }
    return { r: this.round, ids: ids.slice(), s };
  }

  /** Clients: take the host's word (for players we know of). */
  apply(snap: Snap, now: number) {
    this.round = snap.r;
    snap.ids.forEach((id, j) => {
      const st = this.stats.get(id);
      if (!st) return;
      const [role, hp, hits, frags, deaths, alive, life] = snap.s.slice(j * PER, j * PER + PER);
      if (st.alive && !alive) st.deadAt = now;
      Object.assign(st, { role: role === 0 ? 'k' : 'v', hp, hits, frags, deaths, alive: alive === 1, life });
    });
  }

  /** The whole match as plain JSON, for the next host (HostSync's `keep`). */
  save() {
    // (-Infinity isn't JSON: "never out" goes as 0, long ago.)
    return {
      r: this.round,
      st: [...this.stats].map(([id, s]) => [id, s.role === 'k' ? 0 : 1, s.hp, s.hits, s.frags, s.deaths, s.alive ? 1 : 0, s.life, Number.isFinite(s.deadAt) ? s.deadAt : 0]),
    };
  }

  /** Take over a kept match. It came over the network: anything malformed is skipped. */
  load(w: unknown) {
    const k = w as { r?: unknown; st?: unknown };
    if (!k || !Number.isInteger(k.r) || !Array.isArray(k.st)) return;
    this.round = k.r as number;
    for (const row of k.st as unknown[]) {
      if (!Array.isArray(row) || row.length !== 9 || typeof row[0] !== 'string' || !row.slice(1).every((v) => typeof v === 'number')) continue;
      const st = this.stats.get(row[0]);
      if (!st) continue;
      const [, role, hp, hits, frags, deaths, alive, life, deadAt] = row as [string, ...number[]];
      Object.assign(st, { role: role === 0 ? 'k' : 'v', hp, hits, frags, deaths, alive: alive === 1, life, deadAt: Number.isFinite(deadAt) ? deadAt : -Infinity });
    }
  }
}

/**
 * Host: how many darts a kusin may claim (hits and wrong guesses alike). Darts are FIRE_MS apart,
 * but claims arrive in bursts (they ride along with the shooter's state), so a few may come at once.
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

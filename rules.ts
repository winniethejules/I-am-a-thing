/**
 * The match, with no three.js and no DOM, so it runs headless under `bun test` too. The host keeps
 * the real one and decides everything in it (rounds, roles, darts, catches, wrong guesses, scores,
 * respawns); every other client keeps a copy from the host's snapshots and events, for the HUD.
 * Everyone is keyed by player id: people join and leave mid-game.
 *
 * A round (PLAN.md phase 2):
 * 1. **Hide** (HIDE_MS): the kusiner wait in the hall with their eyes shut; the vättar become things.
 * 2. **Seek** (SEEK_MS): the kusiner hunt with suction darts. A dart in a vätte counts towards its
 *    form's darts (a cup takes 1, a chair 2): enough, and it's caught, out until the next round. A
 *    dart in a real thing is a wrong guess and costs patience; out of patience, a kusin sits out a moment.
 * 3. **End** (END_MS): every vätte caught (the kusiner win) or the time's up (the vättar win). Scores.
 * Then the next round, the kusin's turn passing on down the roster. MATCH_ROUNDS rounds make a match.
 * With fewer than two players there's no round: everyone roams ('wait').
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
/** A kusin out of patience is back this long after. */
export const RESPAWN_MS = 3000;
/** The round's phases. */
export const HIDE_MS = 40_000;
export const SEEK_MS = 180_000;
export const END_MS = 8000;
/** Rounds in a match (then the party gets its "play again?" vote, and the scores start over). */
export const MATCH_ROUNDS = 4;
/** Kusiner : vättar, 1 : 3 (but always one of each once there are two players). */
export const VATTAR_PER_KUSIN = 3;
/** Points: a catch, a wrong guess, each 10 s a vätte stays hidden, surviving the round, a taunt (a few a round). */
export const POINTS = { catch: 5, wrong: -1, per10s: 1, survive: 5, taunt: 2, taunts: 5 } as const;

export type Role = 'k' | 'v';
export type Phase = 'wait' | 'hide' | 'seek' | 'end';
export const PHASES: readonly Phase[] = ['wait', 'hide', 'seek', 'end'];

export interface Stat {
  role: Role;
  /** Kusin: patience left. */
  hp: number;
  /** Vätte: darts taken this life. */
  hits: number;
  /** Points this match. */
  score: number;
  /** Kusin: vättar caught this round. */
  frags: number;
  /** Vätte: taunts that scored this round. */
  taunts: number;
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
  /** `pid` is now a kusin or a vätte. */
  | { k: 'role'; pid: string; r: Role }
  /** `s`: the spawn spot's index; `l`: the life it starts. Whoever runs `pid` moves it there. */
  | { k: 'spawn'; pid: string; s: number; l: number }
  /** The round `r` enters phase `ph` until link time `until`; at an end, `win` says who won it. */
  | { k: 'phase'; r: number; ph: Phase; until: number; win?: Role }
  /** A taunt that scored. */
  | { k: 'taunt'; pid: string; score: number }
  /** The match is decided (MATCH_ROUNDS played): `scores` by player id, best first. */
  | { k: 'match'; ids: string[]; scores: number[] };

/** What the host broadcasts: the round and its phase, and per player id [role 0 kusin/1 vätte, hp, hits, score, frags, alive 0/1, life]. */
export interface Snap {
  r: number;
  ph: number;
  until: number;
  ids: string[];
  s: number[];
}
const PER = 7;

export const isSnap = (x: unknown): x is Snap => {
  const s = x as Snap;
  return !!s && typeof s.r === 'number' && Number.isInteger(s.ph) && Number.isFinite(s.until) && Array.isArray(s.ids) && Array.isArray(s.s)
    && s.s.length === s.ids.length * PER && s.ids.every((id) => typeof id === 'string') && s.s.every(Number.isFinite);
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
    case 'phase': return Number.isInteger(e.r) && PHASES.includes(e.ph) && Number.isFinite(e.until) && (e.win === undefined || isRole(e.win));
    case 'taunt': return typeof e.pid === 'string' && Number.isFinite(e.score);
    case 'match': return Array.isArray(e.ids) && Array.isArray(e.scores) && e.ids.length === e.scores.length;
    default: return false;
  }
};

const fresh = (role: Role = 'v'): Stat => ({ role, hp: 0, hits: 0, score: 0, frags: 0, taunts: 0, deaths: 0, alive: false, life: 0, deadAt: -Infinity });

/** How many kusiner a room of `n` wants. */
export const kusinerFor = (n: number) => (n <= 1 ? n : Math.max(1, Math.round(n / (VATTAR_PER_KUSIN + 1))));

/** Where a body should start: a kusin waiting in the hall, or anyone in the kitchen. */
export type Spot = (pid: string, hall: boolean) => number;

export class Match {
  readonly stats = new Map<string, Stat>();
  round = 0;
  phase: Phase = 'wait';
  /** When the phase ends (link ms; Infinity while waiting). */
  until = Infinity;
  /** Rounds played this match. */
  played = 0;
  /** Host: where the kusin's turn is in the roster. */
  private turn = 0;
  /** Host: when this round's seeking started. */
  private seekAt = 0;

  /** Match the roster: joiners start out with no life yet (the host admits them), leavers go. */
  sync(ids: readonly string[]) {
    for (const id of ids) if (!this.stats.has(id)) this.stats.set(id, fresh());
    for (const id of [...this.stats.keys()]) if (!ids.includes(id)) this.stats.delete(id);
  }

  /**
   * Host: someone new is in. While the vättar hide (or nobody plays yet) they're a vätte and go and
   * hide at once; once the seeking has started they join the kusiner, so they play straight away.
   */
  admit(pid: string, spot: Spot): Ev[] {
    const st = this.stats.get(pid);
    if (!st) return [];
    const r: Role = this.phase === 'seek' || this.phase === 'end' ? 'k' : 'v';
    st.role = r;
    return [{ k: 'role', pid, r }, this.respawn(pid, spot(pid, r === 'k' && this.phase === 'hide'))];
  }

  /** Host, every frame: the round's clock, the end of the round, respawns. `ids` is the roster, in order. */
  tick(now: number, ids: readonly string[], spot: Spot): Ev[] {
    const out: Ev[] = [];
    if (ids.length < 2) {
      if (this.phase !== 'wait') out.push(this.enter('wait', Infinity));
    } else if (this.phase === 'wait' || (this.phase === 'end' && now >= this.until)) {
      out.push(...this.start(now, ids, spot));
    } else if (this.phase === 'hide' && now >= this.until) {
      this.seekAt = now;
      out.push(this.enter('seek', now + SEEK_MS));
    } else if (this.phase === 'seek') {
      const vattar = ids.filter((id) => this.stats.get(id)?.role === 'v');
      const kusiner = ids.length - vattar.length;
      const hidden = vattar.filter((id) => this.stats.get(id)!.alive);
      if (!hidden.length) out.push(...this.finish(now, 'k', ids));
      else if (now >= this.until || !kusiner) out.push(...this.finish(now, 'v', ids));
    }
    // Back in play: anyone while nobody's playing a round, a kusin out of patience after a moment.
    // A caught vätte waits for the next round.
    for (const [pid, s] of this.stats) {
      if (s.alive || now - s.deadAt < RESPAWN_MS) continue;
      if (this.phase === 'wait' || (s.role === 'k' && this.phase === 'seek')) out.push(this.respawn(pid, spot(pid, false)));
    }
    return out;
  }

  /** A new round: the next kusiner in turn, everyone starting a fresh life where their role starts. */
  private start(now: number, ids: readonly string[], spot: Spot): Ev[] {
    const out: Ev[] = [];
    if (this.played >= MATCH_ROUNDS) {
      // The match is decided: tell the party, and start the next one from 0.
      const order = ids.slice().sort((a, b) => (this.stats.get(b)?.score ?? 0) - (this.stats.get(a)?.score ?? 0));
      out.push({ k: 'match', ids: order, scores: order.map((id) => this.stats.get(id)?.score ?? 0) });
      for (const s of this.stats.values()) s.score = 0;
      this.played = 0;
    }
    this.round++;
    const n = ids.length, want = kusinerFor(n);
    const kusiner = new Set(Array.from({ length: want }, (_, j) => ids[(this.turn + j) % n]));
    this.turn = (this.turn + want) % n;
    for (const id of ids) {
      const s = this.stats.get(id)!;
      const r: Role = kusiner.has(id) ? 'k' : 'v';
      if (s.role !== r) out.push({ k: 'role', pid: id, r });
      Object.assign(s, { role: r, frags: 0, taunts: 0 });
    }
    out.push(this.enter('hide', now + HIDE_MS));
    for (const id of ids) out.push(this.respawn(id, spot(id, this.stats.get(id)!.role === 'k')));
    return out;
  }

  /** The round is over: the hidden vättar score their time and the survival bonus. */
  private finish(now: number, win: Role, ids: readonly string[]): Ev[] {
    for (const id of ids) {
      const s = this.stats.get(id)!;
      if (s.role === 'v' && s.alive) s.score += POINTS.survive + this.timePoints(now);
    }
    this.played++;
    return [this.enter('end', now + END_MS, win)];
  }

  private enter(ph: Phase, until: number, win?: Role): Ev {
    this.phase = ph;
    this.until = until;
    return { k: 'phase', r: this.round, ph, until, ...(win && { win }) };
  }

  /** A hidden vätte's points for its time hidden so far this round. */
  private timePoints(now: number) {
    return Math.floor(Math.max(0, now - this.seekAt) / 10_000) * POINTS.per10s;
  }

  /**
   * Host: kusin `a` put a dart in vätte `v`, aimed at life `l`; `cap` is the darts its form takes.
   * What happened, or nothing if it doesn't stand: not seeking, the wrong roles, the vätte already
   * caught (two darts, one catch) or respawned since, or the kusin out.
   */
  hit(a: string, v: string, l: number, cap: number, now: number): Ev[] {
    const sv = this.stats.get(v), sa = this.stats.get(a);
    if (this.phase !== 'seek' || !sv || !sa || sv.role !== 'v' || sa.role !== 'k' || !sv.alive || sv.life !== l || !sa.alive) return [];
    sv.hits++;
    const out: Ev[] = [{ k: 'dmg', v, a, hits: sv.hits }];
    if (sv.hits < Math.max(1, cap)) return out;
    sv.score += this.timePoints(now);
    this.out(sv, now);
    sa.frags++;
    sa.score += POINTS.catch;
    sa.hp = Math.min(MAX_HP, sa.hp + HEAL);
    out.push({ k: 'frag', v, a, hp: sa.hp });
    return out;
  }

  /** Host: kusin `a` hit a real thing (`t`): it costs patience and a point; all of it puts them out for a moment. */
  wrong(a: string, t: number, now: number): Ev[] {
    const sa = this.stats.get(a);
    if (this.phase !== 'seek' || !sa || sa.role !== 'k' || !sa.alive) return [];
    sa.hp = Math.max(0, sa.hp - WRONG);
    sa.score += POINTS.wrong;
    const out: Ev[] = [{ k: 'wrong', a, t, hp: sa.hp }];
    if (sa.hp > 0) return out;
    this.out(sa, now);
    out.push({ k: 'frag', v: a, a, hp: 0 });
    return out;
  }

  /** Host: a hidden vätte taunted while the kusiner seek: a few taunts a round score. */
  taunt(pid: string): Ev[] {
    const s = this.stats.get(pid);
    if (this.phase !== 'seek' || !s || s.role !== 'v' || !s.alive || s.taunts >= POINTS.taunts) return [];
    s.taunts++;
    s.score += POINTS.taunt;
    return [{ k: 'taunt', pid, score: s.score }];
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

  /** Host: `pid` starts a new life at spawn spot `s`, whatever they were doing. */
  respawn(pid: string, s: number): Ev {
    const st = this.stats.get(pid)!;
    Object.assign(st, { alive: true, hp: MAX_HP, hits: 0, life: st.life + 1 });
    return { k: 'spawn', pid, s, l: st.life };
  }

  /** Clients: follow an event before the next snapshot confirms it. */
  follow(e: Ev, now: number) {
    if (e.k === 'phase') {
      Object.assign(this, { round: e.r, phase: e.ph, until: e.until });
      if (e.ph === 'hide') for (const s of this.stats.values()) Object.assign(s, { frags: 0, taunts: 0 });
      return;
    }
    if (e.k === 'match') {
      for (const s of this.stats.values()) s.score = 0;
      return;
    }
    const s = this.stats.get(e.k === 'wrong' ? e.a : e.k === 'dmg' || e.k === 'frag' ? e.v : e.pid);
    if (!s) return;
    if (e.k === 'dmg') s.hits = e.hits;
    else if (e.k === 'wrong') s.hp = e.hp;
    else if (e.k === 'role') s.role = e.r;
    else if (e.k === 'taunt') s.score = e.score;
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
      s.push(st.role === 'k' ? 0 : 1, st.hp, st.hits, st.score, st.frags, st.alive ? 1 : 0, st.life);
    }
    return { r: this.round, ph: PHASES.indexOf(this.phase), until: Number.isFinite(this.until) ? this.until : -1, ids: ids.slice(), s };
  }

  /** Clients: take the host's word (for players we know of). */
  apply(snap: Snap, now: number) {
    this.round = snap.r;
    this.phase = PHASES[snap.ph] ?? 'wait';
    this.until = snap.until < 0 ? Infinity : snap.until;
    snap.ids.forEach((id, j) => {
      const st = this.stats.get(id);
      if (!st) return;
      const [role, hp, hits, score, frags, alive, life] = snap.s.slice(j * PER, j * PER + PER);
      if (st.alive && !alive) st.deadAt = now;
      Object.assign(st, { role: role === 0 ? 'k' : 'v', hp, hits, score, frags, alive: alive === 1, life });
    });
  }

  /** The whole match as plain JSON, for the next host (HostSync's `keep`). */
  save() {
    // (-Infinity and Infinity aren't JSON: "never out" goes as 0, long ago; "no end" as -1.)
    return {
      r: this.round, ph: PHASES.indexOf(this.phase), until: Number.isFinite(this.until) ? this.until : -1,
      played: this.played, turn: this.turn, seekAt: this.seekAt,
      st: [...this.stats].map(([id, s]) => [id, s.role === 'k' ? 0 : 1, s.hp, s.hits, s.score, s.frags, s.taunts, s.deaths, s.alive ? 1 : 0, s.life, Number.isFinite(s.deadAt) ? s.deadAt : 0]),
    };
  }

  /** Take over a kept match. It came over the network: anything malformed is skipped. */
  load(w: unknown) {
    const k = w as { r?: unknown; ph?: unknown; until?: unknown; played?: unknown; turn?: unknown; seekAt?: unknown; st?: unknown };
    if (!k || !Number.isInteger(k.r) || !Number.isInteger(k.ph) || !Array.isArray(k.st)) return;
    this.round = k.r as number;
    this.phase = PHASES[k.ph as number] ?? 'wait';
    this.until = typeof k.until === 'number' && k.until >= 0 ? k.until : Infinity;
    if (Number.isInteger(k.played)) this.played = k.played as number;
    if (Number.isInteger(k.turn)) this.turn = k.turn as number;
    if (typeof k.seekAt === 'number') this.seekAt = k.seekAt;
    for (const row of k.st as unknown[]) {
      if (!Array.isArray(row) || row.length !== 11 || typeof row[0] !== 'string' || !row.slice(1).every((v) => typeof v === 'number')) continue;
      const st = this.stats.get(row[0]);
      if (!st) continue;
      const [, role, hp, hits, score, frags, taunts, deaths, alive, life, deadAt] = row as [string, ...number[]];
      Object.assign(st, { role: role === 0 ? 'k' : 'v', hp, hits, score, frags, taunts, deaths, alive: alive === 1, life, deadAt: Number.isFinite(deadAt) ? deadAt : -Infinity });
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

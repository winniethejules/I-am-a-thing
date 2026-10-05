/**
 * The netcode, with no three.js and no DOM, so `rules.test.ts` can run whole sessions headless
 * (FakeRoom: joins, leaves, the host leaving, reloads). game.ts feeds it your intent each frame
 * and draws what it says.
 *
 * The shooter recipe (vp docs fps):
 * - Everyone moves their own body at once and streams it (PlayerSync); the host runs the CPUs.
 * - The shooter decides hits, from what it sees: a hitscan against the grid and everyone's bodies
 *   as drawn. It sends two one-offs riding along with its state: the shot (so everyone draws the
 *   tracer) and, if it hit, a claim naming the victim and the life it hit.
 * - The host judges claims (is it plausible?) and owns the match: HP, frags, deaths, respawns. It
 *   broadcasts snapshots and events (HostSync) and keeps the match with the room, so a new host
 *   carries on. A spawn names the spot; whoever runs that body moves it there.
 */
import {
  FPS_ARENA, HostSync, PlayerSync, Seats, botRng, fpsStep, mulberry32, newFpsBody, rayBox, spreadDir, turn,
  type GameFrame, type LinkPlayer, type MinigameLink, type Rng,
} from '@voxelparty/sdk/core';
import { Bot, IDLE, type Intent } from './bot';
import { Arena, DEATH_Y } from './map';
import { DAMAGE, FALL, FIRE_MS, FireRate, Match, RANGE, SPREAD, isEv, isSnap, type Ev, type Snap } from './rules';

/** What each player streams about their body: feet, look, and which life they're on. */
export type Net = { x: number; y: number; z: number; yw: number; pt: number; l: number };

/** A player's one-offs: a shot (from o to e) for the tracer, and a hit claim. */
export type Shot = { k: 'shot'; o: number[]; e: number[] } | { k: 'hit'; v: string; d: number; l: number };

/** Something to show: game.ts turns these into effects and sounds, exactly once each. */
export type Cue =
  | { k: 'shot'; pid: string; o: number[]; e: number[] }
  | { k: 'dmg'; v: string; a: string; d: number }
  | { k: 'frag'; v: string; a: string }
  | { k: 'spawn'; pid: string }
  | { k: 'jump'; pid: string }
  | { k: 'pad'; pid: string }
  | { k: 'land'; pid: string; speed: number }
  | { k: 'win'; pid: string; r: number };

/** Everything a CPU gets to know. */
export interface World {
  readonly arena: Arena;
  readonly pawns: ReadonlyMap<string, Pawn>;
  readonly now: number;
  alive(p: Pawn): boolean;
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
  /** This frame's step-ups and landing speed, for the camera. */
  stepped = 0;
  landed = 0;

  constructor(readonly pid: string, readonly rand: Rng) {}
}

/** CPU skills, handed out in the order they're first seen. */
const BOT_SKILL = [0.8, 1, 1.15, 0.9];
/** How long a player may stream the wrong life before the host spawns them again (a spawn they missed). */
const STALE_MS = 1500;

const r2 = (v: number) => Math.round(v * 100) / 100;
const isVec = (v: unknown): v is number[] => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

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
  private wasHost: boolean;
  private botsMade = 0;
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
      const it = !this.frame.live ? IDLE : role === 'local' ? (this.intent() ?? this.bot(lp.id).update(dt, p, this)) : this.bot(lp.id).update(dt, p, this);
      this.play(p, i, it, dt);
      const b = p.body;
      this.moves.send(i, { x: r2(b.x), y: r2(b.y), z: r2(b.z), yw: r2(b.yaw), pt: r2(b.pitch), l: p.life });
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

  /** Move, look and shoot for a body this client runs (you, or a CPU on the host). */
  private play(p: Pawn, i: number, it: Intent, dt: number) {
    p.stepped = p.landed = 0;
    if (!p.alive) return;
    const b = p.body;
    turn(b, it.dyaw, it.dpitch);
    if (!this.frame.live) return;
    const r = fpsStep(this.arena, b, it, dt);
    p.stepped = r.stepped;
    if (r.jumped) this.cues.push({ k: 'jump', pid: p.pid });
    if (r.landed > 6) {
      p.landed = r.landed;
      this.cues.push({ k: 'land', pid: p.pid, speed: r.landed });
    }
    if (b.y < DEATH_Y) {
      // Fell off: out of play at once here, and the host counts the death.
      p.alive = false;
      return this.claim(p, i, p.pid, FALL, p.life);
    }
    p.cool -= dt;
    if (it.fire && p.cool <= 0) {
      p.cool = FIRE_MS / 1000;
      this.fire(p, i);
    }
  }

  /** A hitscan from the eye: the grid, then every body as this client draws it. */
  private fire(p: Pawn, i: number) {
    const b = p.body, ox = b.x, oy = b.y + FPS_ARENA.eye, oz = b.z;
    const [dx, dy, dz] = spreadDir(b.yaw, b.pitch, SPREAD, p.rand, this.dir);
    let t = this.arena.ray(ox, oy, oz, dx, dy, dz, RANGE), victim: Pawn | null = null;
    for (const q of this.pawns.values()) {
      if (q === p || !this.alive(q)) continue;
      const u = rayBox(ox, oy, oz, dx, dy, dz, q.body.x, q.body.y, q.body.z, t);
      if (u >= 0 && u < t) [t, victim] = [u, q];
    }
    const o = [r2(ox), r2(oy), r2(oz)], e = [r2(ox + dx * t), r2(oy + dy * t), r2(oz + dz * t)];
    this.cues.push({ k: 'shot', pid: p.pid, o, e });
    this.moves.event(i, { k: 'shot', o, e });
    if (victim) this.claim(p, i, victim.pid, DAMAGE, victim.life);
  }

  /** A hit (or a fall): the host judges it now; anyone else asks the host. */
  private claim(p: Pawn, i: number, v: string, d: number, l: number) {
    if (this.link.isHost) this.judge(p.pid, v, d, l);
    else this.moves.event(i, { k: 'hit', v, d, l });
  }

  /** Something the host said: follow it in our copy of the match, move our body if it's a spawn, show it. */
  private apply(e: Ev) {
    this.match.follow(e, this.now);
    if (e.k === 'dmg') this.cues.push({ k: 'dmg', v: e.v, a: e.a, d: e.d });
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
        p.alive = true;
        p.cool = 0;
      }
      this.cues.push({ k: 'spawn', pid: e.pid });
    } else if (e.k === 'win') this.cues.push({ k: 'win', pid: e.pid, r: e.r });
  }

  /** Other players' one-offs: shots to draw, and (on the host) hits to judge. */
  private heard(pid: string, e: Shot) {
    if (!e || typeof e !== 'object') return;
    if (e.k === 'shot' && isVec(e.o) && isVec(e.e)) this.cues.push({ k: 'shot', pid, o: e.o, e: e.e });
    else if (e.k === 'hit' && this.link.isHost && typeof e.v === 'string' && Number.isFinite(e.d) && Number.isInteger(e.l)) this.judge(pid, e.v, e.d, e.l);
  }

  /** A player's game started over (a reload): forget what we counted for them; they need a body again. */
  private restarted(pid: string) {
    this.rate.forget(pid);
    const st = this.match.stats.get(pid);
    if (this.link.isHost && st?.alive) this.emit(this.match.respawn(pid, this.spot(pid)));
  }

  /** Someone else's body: where their stream says, drawn a moment behind. */
  private remote(p: Pawn, i: number) {
    const s = this.moves.smooth(i), l = this.moves.latest(i);
    if (s && [s.x, s.y, s.z, s.yw, s.pt].every(Number.isFinite)) Object.assign(p.body, { x: s.x, y: s.y, z: s.z, yaw: s.yw, pitch: s.pt });
    if (l && Number.isInteger(l.l)) p.life = l.l;
  }

  // ------------------------------------------------------------ host

  private host(dt: number, now: number) {
    if (this.frame.live) for (const e of this.match.tick(now, (pid) => this.spot(pid))) this.emit(e);
    this.heal(now);
    this.sync.tick(dt, () => this.match.snapshot(this.link.players.map((p) => p.id)));
  }

  /** Tell everyone, and do it here too. */
  private emit(e: Ev) {
    this.sync.event(e);
    this.apply(e);
  }

  /** Is a claimed hit plausible? The right damage, in range, not faster than the gun fires; then the match decides. */
  private judge(a: string, v: string, d: number, l: number) {
    if (a === v ? d !== FALL : d !== DAMAGE) return;
    const pa = this.pawns.get(a), pv = this.pawns.get(v);
    if (!pa || !pv) return;
    if (a !== v) {
      if (Math.hypot(pa.body.x - pv.body.x, pa.body.y - pv.body.y, pa.body.z - pv.body.z) > RANGE + 4) return;
      if (!this.rate.take(a, this.now)) return;
    }
    for (const e of this.match.hit(a, v, d, l, this.now)) this.emit(e);
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

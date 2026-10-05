/**
 * Drawing, input and sound. The rules and netcode live in core.ts (three-free, tested headless):
 * this file reads your mouse and keys into an intent (`readIntent`), runs the core, and shows what
 * it says: your eyes and gun (`FpsCamera`), everyone else's avatars, tracers, the HUD. Everything
 * per player is keyed by player id, because in a session people join and leave mid-game.
 */
import { Group, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3 } from 'three';
import {
  Avatar, B, FpsCamera, Fx, Island, Popups, Sfx, Volume, arenaStage, blockGeometry, esc, meadow, meshVolume, mulberry32, readIntent,
  type ArenaStage, type FpsIntent, type GameContext, type GameStage, type LinkPlayer,
} from '@voxelparty/sdk';
import type { Intent } from './bot';
import { Core, type Pawn } from './core';
import { CELL, GX0, GY0, GZ0, M, NX, NY, NZ, land } from './map';
import { MAX_HP } from './rules';
import { SOUNDS } from './sounds';

const FOV = 90;
// scratch
const _v = new Vector3(), _u = new Vector3(), _s = new Vector3(), _q = new Quaternion(), _m = new Matrix4();
const _z = new Vector3(0, 0, 1);

interface Rig {
  av: Avatar;
  shown: boolean;
  walk: number;
}

/** A tracer flying from the muzzle to where the shot stopped. */
interface Streak {
  o: Vector3;
  e: Vector3;
  t: number;
  life: number;
}

export class Shooter implements GameStage {
  /** What the engine draws: the arena stage's scene, through its camera (your eyes, in play). */
  readonly view: ArenaStage;
  private readonly core: Core;
  private readonly fp: FpsCamera;
  private readonly gun = new Group();
  private readonly flash: Mesh;
  private readonly sfx: Sfx;
  private readonly fx: Fx;
  private readonly popups: Popups;
  private readonly hud = new Hud();
  private readonly rigs = new Map<string, Rig>();
  private readonly tracers: InstancedMesh;
  /** Everyone's avatar holds one of these. */
  private readonly avatarGun = blockGeometry(B.METAL_DARK, [0.1, 0.12, 0.45]);
  private readonly streaks: Streak[] = [];
  private readonly shownFrags = new Map<string, number>();
  private readonly read: FpsIntent = { fwd: 0, side: 0, jump: false, dyaw: 0, dpitch: 0, fire: false, alt: false, firePressed: false, altPressed: false, slot: null, wheel: 0 };
  private firstPerson = false;
  private flashT = 0;
  private stepT = 0;
  private readonly deathAt = new Vector3();
  private killer = '';

  constructor(private readonly ctx: GameContext) {
    const { engine, link, flow } = ctx;
    // First person: no tilt-shift, a wide lens, a near plane close enough for the gun.
    this.view = arenaStage(engine, { fov: FOV, tilt: 0, near: 0.04, far: 900, shadowExtent: 24, pollen: false, fog: [140, 700] });
    const scene = this.view.scene;
    scene.add(this.view.camera); // the gun is a child of the camera, so the camera must be in the scene
    this.fp = new FpsCamera(this.view.camera, { fov: FOV });
    this.flash = new Mesh(blockGeometry(B.LANTERN, 0.1), engine.mats.actor);
    this.buildGun();
    this.fp.hold(this.gun, { scale: 0.26 });

    // The island: the same land shape as the grid (map.ts), a paved arena in a meadow.
    const island = new Island({
      rand: mulberry32(link.seed), mats: engine.mats, size: [40, 40], origin: [-20, -20],
      land: (x, z) => land(x - 20 + 0.5, z - 20 + 0.5),
      top: (v, x, z, r) => {
        const inside = Math.max(Math.abs(x - 20 + 0.5), Math.abs(z - 20 + 0.5)) < 13;
        v.set(x, 1, z, inside ? B.PATH : B.GRASS);
        if (!inside) meadow(v, x, 2, z, r);
      },
    });
    scene.add(island.group);

    this.core = new Core(link, flow, () => this.intent());
    this.buildStructures();
    this.tracers = new InstancedMesh(blockGeometry(B.GOLD, [0.05, 0.05, 1]), engine.mats.actor, 64);
    this.tracers.count = 0;
    this.tracers.frustumCulled = false;
    scene.add(this.tracers);
    this.fx = new Fx(scene, engine.mats.actor);
    this.popups = new Popups(scene);
    // Sounds in 3D, heard from the camera: quieter far away, panned by where they are.
    this.sfx = new Sfx({ you: -1, ears: () => this.view.camera, live: () => flow.live });
  }

  onPlayers(_players: readonly LinkPlayer[], joined: readonly LinkPlayer[]) {
    for (const p of joined) this.hud.feed(`<b>${esc(p.name)}</b> joined`);
  }

  update(dt: number, t: number) {
    this.core.update(dt);
    this.cues();
    this.draw(dt, t);
  }

  dispose() {
    this.core.dispose();
    this.hud.dispose();
    this.fx.dispose();
    this.popups.dispose();
    this.tracers.geometry.dispose();
    this.avatarGun.dispose();
    this.view.dispose();
  }

  // ------------------------------------------------------------ building

  /** Your gun, in camera space (FpsCamera shrinks it into your body, so it never pokes into walls). */
  private buildGun() {
    const mat = this.ctx.engine.mats.actor;
    const part = (id: number, size: [number, number, number], x: number, y: number, z: number) => {
      const m = new Mesh(blockGeometry(id, size), mat);
      m.position.set(x, y, z);
      this.gun.add(m);
    };
    part(B.METAL_DARK, [0.13, 0.15, 0.42], 0, 0, -0.08);
    part(B.METAL, [0.07, 0.07, 0.26], 0, 0.02, -0.4);
    part(B.PLANKS, [0.08, 0.2, 0.1], 0, -0.15, 0.04);
    part(B.GEM, [0.09, 0.05, 0.12], 0, 0.1, -0.1);
    this.flash.position.set(0, 0.02, -0.56);
    this.flash.visible = false;
    this.gun.add(this.flash);
  }

  /** Everything built on the island, meshed from the grid's cells (the floor is the Island's). */
  private buildStructures() {
    const { engine } = this.ctx, grid = this.core.arena;
    const block: Record<number, number> = { [M.WALL]: B.STONE, [M.CRATE]: B.PLANKS, [M.TRIM]: B.COBBLE, [M.PAD]: B.GOLD };
    const y0 = Math.round((0 - GY0) / CELL); // the cell row at world y 0
    const vol = new Volume(NX, NY - y0, NZ);
    for (let cy = y0; cy < NY; cy++)
      for (let cz = 0; cz < NZ; cz++)
        for (let cx = 0; cx < NX; cx++) {
          const c = grid.get(cx, cy, cz);
          if (c >= M.WALL) vol.set(cx, cy - y0, cz, block[c] ?? B.STONE);
        }
    const data = meshVolume(vol, { voxel: CELL });
    if (!data.opaque) return;
    const mesh = new Mesh(data.opaque, engine.mats.solid);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.set(GX0, 0, GZ0);
    this.view.scene.add(mesh);
  }

  // ------------------------------------------------------------ input

  /** WASD, Space and the mouse (while it's locked), zoomed look turning slower. */
  private intent(): Intent | null {
    // On autopilot (vp shot, vp check) your own CPU plays your seat: the view and HUD stay yours.
    if (this.ctx.input.autopilot) return null;
    return readIntent(this.ctx.input, { scale: this.fp.lookScale, out: this.read });
  }

  // ------------------------------------------------------------ effects, once each

  private cues() {
    const { link } = this.ctx, core = this.core, you = link.you;
    for (const c of core.cues.splice(0)) {
      const p = 'pid' in c ? core.pawns.get(c.pid) : undefined;
      const mine = 'pid' in c && c.pid === you;
      switch (c.k) {
        case 'shot': {
          this.streaks.push({ o: new Vector3(...c.o), e: new Vector3(...c.e), t: 0, life: Math.max(0.05, Math.hypot(c.e[0] - c.o[0], c.e[1] - c.o[1], c.e[2] - c.o[2]) / 140) });
          this.fx.sparkle(c.e[0], c.e[1], c.e[2], 4, 2, 0.06);
          if (mine) {
            this.fp.recoil(0.06, 0.04);
            this.flashT = 0.05;
            this.sfx.play(SOUNDS.shot);
          } else this.sfx.at3d(SOUNDS.shot, c.o[0], c.o[1], c.o[2]);
          break;
        }
        case 'dmg': {
          const v = core.pawns.get(c.v);
          if (v && core.alive(v)) this.fx.sparkle(v.body.x, v.body.y + 1.2, v.body.z, 8, 3, 0.08);
          if (c.v === you) {
            this.hud.hurt();
            this.fp.shake(0.25);
            this.sfx.play(SOUNDS.hurt);
          } else if (c.a === you) {
            this.hud.hitMark();
            this.sfx.play(SOUNDS.hit);
          }
          break;
        }
        case 'frag': {
          const v = core.pawns.get(c.v);
          if (v) this.fx.ringPuff(v.body.x, v.body.y + 0.8, v.body.z, 12, 3);
          this.hud.feed(c.a === c.v ? `<b>${esc(this.name(c.v))}</b> fell off` : `<b>${esc(this.name(c.a))}</b> fragged <b>${esc(this.name(c.v))}</b>`);
          if (c.v === you && v) {
            this.deathAt.set(v.body.x, v.body.y, v.body.z);
            this.killer = c.a;
          }
          if (c.a === you && c.a !== c.v) {
            this.hud.center(`You fragged ${esc(this.name(c.v))}`);
            this.sfx.play(SOUNDS.frag);
          }
          break;
        }
        case 'spawn':
          if (mine) {
            this.fp.reset();
            this.sfx.play(SOUNDS.respawn);
          } else if (p) this.sfx.at3d(SOUNDS.respawn, p.body.x, p.body.y + 1, p.body.z, { vol: 0.5 });
          break;
        case 'jump':
        case 'land':
        case 'pad': {
          const def = SOUNDS[c.k];
          if (mine) this.sfx.play(def, { vol: c.k === 'jump' ? 0.5 : 1 });
          else if (p) this.sfx.at3d(def, p.body.x, p.body.y, p.body.z, { vol: 0.6 });
          break;
        }
        case 'win':
          this.ctx.flow.hud.banner(`${this.name(c.pid).toUpperCase()} WINS ROUND ${c.r}!`, this.color(c.pid));
          this.sfx.play(SOUNDS.win);
          break;
      }
    }
  }

  // ------------------------------------------------------------ drawing

  private draw(dt: number, t: number) {
    const { link, flow, engine, players } = this.ctx, core = this.core;
    const me = core.me();
    this.firstPerson = !!me && flow.live && core.alive(me);

    // Everyone's avatar: add joiners, drop leavers, hide the dead (and yourself, in first person).
    for (const [pid, rig] of this.rigs) {
      if (core.pawns.has(pid)) continue;
      this.view.scene.remove(rig.av.root);
      this.rigs.delete(pid);
      this.shownFrags.delete(pid);
    }
    link.players.forEach((lp, i) => {
      const p = core.pawns.get(lp.id);
      if (!p) return;
      let rig = this.rigs.get(lp.id);
      if (!rig) {
        const av = new Avatar(engine.mats.actor, players[i].look, { scale: 0.9, turn: 22 });
        const gun = new Mesh(this.avatarGun, engine.mats.actor);
        gun.position.set(-0.3, 1.05, 0.3);
        av.char.body.add(gun);
        this.view.scene.add(av.root);
        this.rigs.set(lp.id, (rig = { av, shown: false, walk: 0 }));
      }
      const show = core.alive(p) && !(lp.id === link.you && this.firstPerson);
      rig.av.root.visible = show;
      if (show && !rig.shown) rig.av.teleport(p.body.x, p.body.y, p.body.z, p.body.yaw);
      rig.shown = show;
      if (show) this.pose(rig, p, dt);
      const f = core.match.stats.get(lp.id)?.frags ?? 0;
      if (f !== this.shownFrags.get(lp.id)) {
        this.shownFrags.set(lp.id, f);
        flow.hud.setStat(i, `${f} ⚔`);
      }
    });

    this.drawStreaks(dt);
    this.flashT -= dt;
    this.flash.visible = this.flashT > 0;
    this.gun.visible = this.firstPerson;
    this.hud.update(dt, this.firstPerson, me ? (core.match.stats.get(me.pid)?.hp ?? MAX_HP) : MAX_HP, !!me && flow.live && !core.alive(me));
    this.camera(dt, t, me);
    this.fx.update(dt);
    this.popups.update(dt);
    this.view.update(dt, t);
  }

  /** An avatar where its body is, with a little run cycle. */
  private pose(rig: Rig, p: Pawn, dt: number) {
    const b = p.body, body = rig.av.char.body;
    rig.av.set(b.x, b.y, b.z, b.yaw);
    rig.av.update(dt);
    const ground = this.core.arena.boxHits(b.x - 0.3, b.y - 0.1, b.z - 0.3, b.x + 0.3, b.y, b.z + 0.3);
    if (ground && rig.av.speed > 0.5) rig.walk += dt * (6 + rig.av.speed * 0.9);
    body.position.y = ground ? Math.abs(Math.sin(rig.walk)) * 0.12 : 0.05;
    body.rotation.x = ground ? 0 : -0.15;
  }

  /** Tracers: a short streak flying from the muzzle to where the shot stopped. */
  private drawStreaks(dt: number) {
    let n = 0;
    for (let i = this.streaks.length - 1; i >= 0; i--) {
      const s = this.streaks[i];
      s.t += dt;
      if (s.t >= s.life) {
        this.streaks.splice(i, 1);
        continue;
      }
      const len = s.o.distanceTo(s.e);
      if (len < 0.05 || n >= 64) continue;
      _u.subVectors(s.e, s.o).divideScalar(len);
      _q.setFromUnitVectors(_z, _u);
      const seg = Math.min(1.6, len * 0.5), at = Math.min(len - seg / 2, (s.t / s.life) * len + seg / 2);
      _v.copy(s.o).addScaledVector(_u, Math.max(seg / 2, at));
      _m.compose(_v, _q, _s.set(1, 1, seg));
      this.tracers.setMatrixAt(n++, _m);
    }
    this.tracers.count = n;
    this.tracers.instanceMatrix.needsUpdate = true;
  }

  // ------------------------------------------------------------ the camera

  private camera(dt: number, t: number, me: Pawn | undefined) {
    const cam = this.view.camera, core = this.core;
    if (this.firstPerson && me) {
      const b = me.body;
      this.fp.update(dt, b, me, this.read);
      // Footsteps: yours only, a few a second.
      const speed = Math.hypot(b.vx, b.vz);
      this.stepT -= dt * (b.ground ? speed / 8.5 : 0);
      if (this.stepT <= 0 && b.ground && speed > 2) {
        this.stepT = 0.34;
        this.sfx.play(SOUNDS.land, { vol: 0.12, pitch: 7 });
      }
      return;
    }
    this.fp.easeFov(dt);
    if (me && this.ctx.flow.live && !core.alive(me)) {
      // Dead: rise over where you fell and look at who did it.
      const k = this.rigs.get(this.killer);
      _v.set(this.deathAt.x, Math.max(this.deathAt.y, -4) + 3.5, this.deathAt.z);
      cam.position.lerp(_v, Math.min(1, dt * 4));
      if (k?.shown) cam.lookAt(k.av.shown.x, k.av.shown.y + 1.2, k.av.shown.z);
      else cam.lookAt(this.deathAt.x, this.deathAt.y, this.deathAt.z + 0.01);
      return;
    }
    // The title card, spectating: a slow flight round the island.
    const a = t * 0.07;
    _v.set(Math.sin(a) * 30, 15 + Math.sin(t * 0.13) * 3, Math.cos(a) * 30);
    cam.position.lerp(_v, Math.min(1, dt * 2));
    cam.lookAt(0, 1.5, 0);
  }

  private name(pid: string) {
    return this.ctx.link.players.find((p) => p.id === pid)?.name ?? 'Someone';
  }

  private color(pid: string) {
    return this.ctx.players[this.ctx.link.players.findIndex((p) => p.id === pid)]?.color ?? '#ffcc33';
  }
}

// ---------------------------------------------------------------- the HUD

const CSS = `
.fps { position: fixed; inset: 0; pointer-events: none; font: 700 16px system-ui, sans-serif; color: #fff; text-shadow: 0 2px 0 #0008; }
.fps .x { position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; margin: -7px; opacity: .9;
  background: linear-gradient(#fff, #fff) center / 2px 14px no-repeat, linear-gradient(#fff, #fff) center / 14px 2px no-repeat; }
.fps .hit { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(45deg); font-size: 34px; opacity: 0; transition: opacity .15s; }
.fps .hit.on { opacity: 1; transition: none; }
.fps .hurt { position: absolute; inset: 0; box-shadow: inset 0 0 120px #f00c; opacity: 0; transition: opacity .4s; }
.fps .hurt.on { opacity: 1; transition: none; }
.fps .hp { position: absolute; left: 24px; bottom: 20px; font-size: 40px; }
.fps .hp small { font-size: 14px; opacity: .8; margin-left: 6px; }
.fps .feed { position: absolute; right: 18px; top: 90px; text-align: right; font-size: 14px; line-height: 1.6; }
.fps .mid { position: absolute; left: 0; right: 0; top: 60%; text-align: center; font-size: 22px; }
.fps .off { display: none; }`;

/** Crosshair, hit marker, hurt flash, health, a kill feed and a centre line. Plain DOM; clicks go through to the game. */
class Hud {
  private readonly root = document.createElement('div');
  private readonly style = document.createElement('style');
  private readonly el: Record<'x' | 'hit' | 'hurt' | 'hp' | 'feed' | 'mid', HTMLElement>;
  private hitT = 0;
  private hurtT = 0;
  private midT = 0;
  private lastHp = -1;

  constructor() {
    this.style.textContent = CSS;
    this.root.className = 'fps';
    this.root.innerHTML = '<div class="hurt"></div><div class="x"></div><div class="hit">+</div><div class="hp"></div><div class="feed"></div><div class="mid"></div>';
    const q = (c: string) => this.root.querySelector<HTMLElement>(`.${c}`)!;
    this.el = { x: q('x'), hit: q('hit'), hurt: q('hurt'), hp: q('hp'), feed: q('feed'), mid: q('mid') };
    document.head.append(this.style);
    document.body.append(this.root);
  }

  update(dt: number, playing: boolean, hp: number, dead: boolean) {
    for (const k of ['x', 'hp'] as const) this.el[k].classList.toggle('off', !playing);
    if (hp !== this.lastHp) this.el.hp.innerHTML = `${(this.lastHp = hp)}<small>HP</small>`;
    this.el.hit.classList.toggle('on', (this.hitT -= dt) > 0);
    this.el.hurt.classList.toggle('on', (this.hurtT -= dt) > 0);
    if (dead) this.el.mid.textContent = 'Fragged! Back in a moment…';
    else if ((this.midT -= dt) <= 0) this.el.mid.textContent = '';
  }

  hitMark() {
    this.hitT = 0.12;
  }

  hurt() {
    this.hurtT = 0.1;
  }

  center(html: string) {
    this.el.mid.innerHTML = html;
    this.midT = 1.5;
  }

  /** A line in the kill feed (HTML: escape names). The last four stay. */
  feed(html: string) {
    const line = document.createElement('div');
    line.innerHTML = html;
    this.el.feed.append(line);
    while (this.el.feed.childElementCount > 4) this.el.feed.firstElementChild!.remove();
    setTimeout(() => line.remove(), 6000);
  }

  dispose() {
    this.root.remove();
    this.style.remove();
  }
}

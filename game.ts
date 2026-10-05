/**
 * Drawing, input and sound. The rules and netcode live in core.ts (three-free, tested headless):
 * this file reads your mouse and keys into an intent, runs the core, and shows what it says.
 *
 * - A kusin plays in first person (`FpsCamera`), the suction gun in hand.
 * - A vätte plays in third person: the camera behind it; locked still, the mouse looks round it.
 * - Everyone is drawn as their own character, or as the thing they've become (`Avatar.setLook`).
 * - Every moment gets a picture, a sound and a reaction on the same frame (voxelparty-kvalitet §4):
 *   darts fly and stick, things wobble, a vätte tumbles out of a caught thing with stars round it.
 *
 * Everything per player is keyed by player id, because in a session people join and leave.
 */
import { BufferGeometry, Group, InstancedMesh, Matrix4, Mesh, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import {
  Avatar, FpsCamera, Popups, Sfx, Vfx, arenaStage, blockGeometry, esc, meshVolume, readIntent, useGameAssets, type Volume,
  type ArenaStage, type FpsIntent, type GameContext, type GameStage, type LinkPlayer,
} from '@voxelparty/sdk';
import { NO_FORM, type Intent } from './bot';
import { GUN_VOXEL, KUSIN_VOXEL, VATTE_VOXEL, dart, kusin, kusinLook, suctionGun, suctionGunFp, vatte, vatteLook } from './characters';
import { Core, type Cue, type Pawn } from './core';
import { PHOTOS, type LookName, type PhotoPoint } from './look';
import { buildModels, type ModelKey } from './models';
import { MAX_HP, WRONG, type Phase } from './rules';
import { KitchenScene } from './scene';
import { SOUNDS } from './sounds';
import { BLOCKS, TEXTURES, type Ids } from './textures';
import { FORMS, INVENTORY, KUSIN_MOVE, REAL_THINGS, VATTE, blendIn, formBox } from './things';
import { EFFECTS } from './vfx';

const FOV = 84;
/** A stable number per player id: their kusin's jumper, their vätte's cap. */
const lookNo = (id: string) => [...id].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;
/** The third-person camera behind a vätte: distance, height over its middle. */
const TP_DIST = 2.1, TP_RISE = 0.35;
/** Darts: how fast they fly, how long they stay stuck, how many at once. */
const DART_SPEED = 32, DART_STAY = 8, DART_CAP = 48;
/** What a dart sounds like and throws up, by what it hit. */
const MATERIAL: Partial<Record<ModelKey, 'porcelain' | 'wood' | 'cloth'>> = {
  cup: 'porcelain', biscuits: 'porcelain', coffeePot: 'porcelain',
  chair: 'wood', logBasket: 'wood', breadBasket: 'wood', crossword: 'cloth', potholder: 'cloth', geranium: 'cloth',
};
// scratch
const _v = new Vector3(), _u = new Vector3(), _q = new Quaternion(), _m = new Matrix4(), _s = new Vector3();
const _z = new Vector3(0, 0, 1);

interface Rig {
  av: Avatar;
  shown: boolean;
  walk: number;
  /** What it's drawn as now: 'k', or a vätte's form (VATTE or a FORMS index). */
  as: 'k' | number;
  /** A caught vätte tumbling out of its thing: seconds left. */
  outT: number;
  /** A hop (taunts, darts, locks): seconds left. */
  hopT: number;
}

/** A dart: flying from o to e, then stuck there (or falling, off a vätte). */
interface Dart {
  o: Vector3;
  e: Vector3;
  t: number;
  fly: number;
  /** Bounced off a vätte: it drops to the floor. */
  falls: boolean;
  y: number;
  vy: number;
}

export class Shooter implements GameStage {
  /** What the engine draws: the arena stage's scene, through its camera. */
  readonly view: ArenaStage;
  private readonly core: Core;
  private readonly fp: FpsCamera;
  private readonly gun = new Group();
  private readonly sfx: Sfx;
  private readonly vfx: Vfx;
  private readonly popups: Popups;
  private readonly hud = new Hud();
  private readonly rigs = new Map<string, Rig>();
  private readonly darts: Dart[] = [];
  private readonly dartMesh: InstancedMesh;
  /** Everyone's avatar holds one of these. */
  private readonly avatarGun: BufferGeometry;
  private readonly ids: Ids;
  private readonly kitchen: KitchenScene;
  /** The things a vätte can become, as bodies (`Avatar.setLook`). */
  private readonly formVols: Volume[];
  private readonly formVoxel: number[];
  /** A photo point holding the camera (voxelparty-kvalitet §2), or null. */
  private photoAt: PhotoPoint | null = null;
  private readonly shownFrags = new Map<string, string>();
  private lastTick = -1;
  /** Who won the round that just ended, for the board. */
  private roundWin: 'k' | 'v' | undefined;
  private readonly read: FpsIntent = { fwd: 0, side: 0, jump: false, dyaw: 0, dpitch: 0, fire: false, alt: false, firePressed: false, altPressed: false, slot: null, wheel: 0 };
  private readonly it: Intent = { fwd: 0, side: 0, jump: false, dyaw: 0, dpitch: 0, fire: false, become: NO_FORM, lock: false, taunt: false };
  private firstPerson = false;
  private stepT = 0;
  /** The third-person camera's look, while a vätte is locked (the body keeps still). */
  private orbitYaw = 0;
  private orbitPitch = -0.2;
  private readonly deathAt = new Vector3();
  private killer = '';

  constructor(private readonly ctx: GameContext) {
    const { engine, link, flow } = ctx;
    this.ids = useGameAssets(TEXTURES, BLOCKS);
    this.avatarGun = meshVolume(suctionGun(this.ids), { voxel: GUN_VOXEL, origin: [1.5, 0, 3] }).opaque!;
    // A near plane close enough for the gun. A low sun from the north-west, through the windows.
    this.view = arenaStage(engine, {
      fov: FOV, tilt: 0, near: 0.04, far: 400, shadowExtent: 13, pollen: false, fog: [70, 320], sun: [-0.3, 0.42, -0.85],
    });
    this.view.sunAt(new Vector3(3, 0, 0));
    const scene = this.view.scene;
    scene.add(this.view.camera); // the gun is a child of the camera, so the camera must be in the scene
    this.fp = new FpsCamera(this.view.camera, { fov: FOV, tuning: KUSIN_MOVE });
    this.buildGun();
    this.fp.hold(this.gun);

    // Mormors kök: the house, the garden, every thing in it, the light (scene.ts).
    this.kitchen = new KitchenScene(ctx, this.view, this.ids);
    const models = buildModels(this.ids);
    this.formVols = FORMS.map((f) => models[f.key].vol);
    this.formVoxel = FORMS.map((f) => models[f.key].voxel);

    this.core = new Core(link, flow, () => this.intent());
    const dg = meshVolume(dart(this.ids), { voxel: 1 / 32, origin: [1.5, 1.5, 8] }).opaque!;
    this.dartMesh = new InstancedMesh(dg, engine.mats.actor, DART_CAP);
    this.dartMesh.count = 0;
    this.dartMesh.frustumCulled = false;
    this.dartMesh.castShadow = true;
    scene.add(this.dartMesh);
    this.vfx = new Vfx(this.view);
    this.popups = new Popups(scene);
    // Sounds in 3D, heard from the camera: quieter far away, panned by where they are.
    this.sfx = new Sfx({ you: -1, ears: () => this.view.camera, live: () => flow.live });
  }

  onPlayers(_players: readonly LinkPlayer[], joined: readonly LinkPlayer[]) {
    for (const p of joined) this.hud.feed(`<b>${esc(p.name)}</b> kom in`);
  }

  update(dt: number, t: number) {
    this.core.update(dt);
    this.cues();
    this.draw(dt, t);
  }

  dispose() {
    this.core.dispose();
    this.hud.dispose();
    this.vfx.dispose();
    this.popups.dispose();
    this.kitchen.dispose();
    this.dartMesh.geometry.dispose();
    this.avatarGun.dispose();
    this.view.dispose();
  }

  // ------------------------------------------------------------ building

  /**
   * Your suction gun in first person, with the hand that holds it and the jumper's sleeve
   * (voxelparty-kvalitet §5), about 0.5 long with the muzzle to −z, as FpsCamera.hold expects.
   */
  private buildGun() {
    const mat = this.ctx.engine.mats.actor, k = this.ids;
    const gun = new Mesh(meshVolume(suctionGunFp(k), { voxel: 1 / 48, origin: [3.5, 6, 12] }).opaque!, mat);
    gun.rotation.y = Math.PI;
    gun.name = 'gun';
    const hand = new Mesh(blockGeometry(k.SKIN, [0.1, 0.1, 0.12]), mat);
    hand.position.set(0, -0.08, 0.12);
    const thumb = new Mesh(blockGeometry(k.SKIN, [0.04, 0.04, 0.08]), mat);
    thumb.position.set(-0.073, 0, 0.08);   // beside the hand, not in it
    const sleeve = new Mesh(blockGeometry(k.KNIT, [0.14, 0.14, 0.36]), mat);
    sleeve.position.set(0.03, -0.15, 0.34);
    sleeve.rotation.x = 0.35;
    const cuff = new Mesh(blockGeometry(k.WHITE, [0.145, 0.145, 0.04]), mat);
    cuff.position.set(0.03, -0.1, 0.19);
    cuff.rotation.x = 0.35;
    // The dart loaded in the barrel: gone the moment it's shot, pushed back in by the thumb.
    const loaded = new Mesh(meshVolume(dart(k), { voxel: 1 / 48, origin: [1.5, 1.5, 8] }).opaque!, mat);
    loaded.rotation.y = Math.PI;
    loaded.position.set(0, 0.0, -0.26);
    loaded.name = 'loaded';
    this.gun.add(gun, hand, thumb, sleeve, cuff, loaded);
  }

  // ------------------------------------------------------------ the look test (PLAN.md phase 0)

  /** Hold the camera on a photo point by name, or let go (null). Returns the point's name. */
  photo(name: string | null) {
    this.photoAt = name ? (PHOTOS.find((p) => p.name === name) ?? null) : null;
    return this.photoAt?.name ?? null;
  }

  /** Switch the lighting variant: 'A', 'B' or 'C' (look.ts). */
  look(name: LookName) {
    this.kitchen.setLook(name);
    return name;
  }

  // ------------------------------------------------------------ input

  /**
   * Your mouse and keys as an intent. A kusin: move, look, shoot. A vätte: move and look, `E`
   * becomes the thing you look at (`E` at nothing, yourself again), `R` locks you still (then the
   * mouse looks round you), `Q` taunts.
   */
  private intent(): Intent | null {
    // On autopilot (vp shot, vp check) your own CPU plays your seat: the view and HUD stay yours.
    const { input } = this.ctx;
    if (input.autopilot) return null;
    const r = readIntent(input, { scale: this.fp.lookScale, out: this.read });
    const it = Object.assign(this.it, { fwd: r.fwd, side: r.side, jump: r.jump, dyaw: r.dyaw, dpitch: r.dpitch, fire: r.fire, become: NO_FORM, lock: false, taunt: false });
    const me = this.core.me();
    if (!me || this.core.role(me) === 'k') return it;
    if (input.pressed('become')) {
      const f = this.core.aimedForm(me);
      it.become = f !== NO_FORM ? f : me.form !== VATTE ? VATTE : NO_FORM;
    }
    it.lock = input.pressed('lock');
    it.taunt = input.pressed('taunt');
    if (me.locked) {
      this.orbitYaw += r.dyaw;
      this.orbitPitch = Math.max(-1.2, Math.min(0.6, this.orbitPitch + r.dpitch));
    }
    return it;
  }

  // ------------------------------------------------------------ effects, once each

  private cues() {
    const core = this.core, you = this.ctx.link.you;
    for (const c of core.cues.splice(0)) {
      const p = 'pid' in c ? core.pawns.get(c.pid) : undefined;
      const mine = 'pid' in c && c.pid === you;
      switch (c.k) {
        case 'shot': this.shot(c, mine); break;
        case 'dmg': {
          // A dart in a vätte that holds (a chair takes two): it squeaks, flashes and hops.
          const v = core.pawns.get(c.v), rig = this.rigs.get(c.v);
          if (!v) break;
          const { h } = formBox(v.form);
          this.vfx.play(EFFECTS.dartVatte, { at: _v.set(v.body.x, v.body.y + h * 0.6, v.body.z) });
          this.sfx.at3d(SOUNDS.squeak, v.body.x, v.body.y + h * 0.5, v.body.z);
          if (rig) {
            rig.hopT = 0.3;
            rig.av.flash('#ffffff', 0.12);
          }
          if (c.a === you) this.hud.hitMark();
          if (c.v === you) {
            this.hud.hurt();
            this.fp.shake(0.2);
          }
          break;
        }
        case 'wrong': this.wrong(c); break;
        case 'frag': this.frag(c); break;
        case 'poff': {
          if (!p) break;
          const { h } = formBox(c.to);
          this.vfx.play(EFFECTS.poff, { at: _v.set(p.body.x, p.body.y, p.body.z) });
          this.sfx.at3d(SOUNDS.poff, p.body.x, p.body.y + h * 0.5, p.body.z, { vol: mine ? 1 : 0.8 });
          const rig = this.rigs.get(c.pid);
          if (rig) this.ctx.tween.from(rig.av.char.root.scale, { x: 0.35, y: 1.6, z: 0.35 }, { time: 0.32, ease: 'outBack' });
          if (mine && c.to >= 0) this.hud.center(`Du är en <b>${FORMS[c.to].name}</b>`);
          break;
        }
        case 'lock': {
          const rig = this.rigs.get(c.pid);
          if (mine) {
            this.sfx.play(SOUNDS.lock);
            this.hud.center(c.on ? 'Låst. Håll dig still!' : '');
            if (c.on && p) [this.orbitYaw, this.orbitPitch] = [p.body.yaw, Math.min(-0.15, p.body.pitch)];
          }
          if (rig && c.on) this.ctx.tween.to(rig.av.char.root.scale, { x: 1.12, y: 0.86, z: 1.12 }, { time: 0.07, yoyo: true, repeat: 1 });
          break;
        }
        case 'taunt': {
          if (!p) break;
          const key = p.form >= 0 ? FORMS[p.form].key : null;
          const sound = key === 'cup' || key === 'biscuits' || key === 'coffeePot' ? SOUNDS.tauntTink : key === 'chair' || key === 'logBasket' ? SOUNDS.tauntCreak : SOUNDS.tauntGiggle;
          this.sfx.at3d(sound, p.body.x, p.body.y + 0.4, p.body.z, { vol: mine ? 1 : 0.9 });
          this.vfx.play(EFFECTS.taunt, { at: _v.set(p.body.x, p.body.y + formBox(p.form).h * 0.8, p.body.z) });
          const rig = this.rigs.get(c.pid);
          if (rig) rig.hopT = 0.45;
          break;
        }
        case 'role':
          if (c.pid === you) this.ctx.flow.hud.banner(c.r === 'k' ? 'DU ÄR KUSIN!' : 'DU ÄR VÄTTE!', c.r === 'k' ? '#ff8a1c' : '#c2402f');
          break;
        case 'spawn':
          if (mine) {
            this.fp.reset();
            this.sfx.play(SOUNDS.respawn);
          }
          if (p) this.vfx.play(EFFECTS.spawn, { at: _v.set(p.body.x, p.body.y, p.body.z) });
          break;
        case 'jump':
        case 'land': {
          const def = SOUNDS[c.k];
          if (mine) this.sfx.play(def, { vol: c.k === 'jump' ? 0.5 : 1 });
          else if (p) this.sfx.at3d(def, p.body.x, p.body.y, p.body.z, { vol: 0.6 });
          break;
        }
        case 'phase': this.phaseCue(c.ph, c.win); break;
        case 'score':
          if (c.pid === you) this.hud.center('Taunt! <small>+2 poäng</small>');
          break;
        case 'match': {
          // The match is decided: the party gets its "play again?" vote while the game carries on.
          const scores = this.ctx.link.players.map((lp) => c.scores[c.ids.indexOf(lp.id)] ?? 0);
          this.ctx.flow.matchOver(scores);
          this.ctx.flow.hud.banner(`${this.name(c.ids[0]).toUpperCase()} VANN MATCHEN!`, '#ffd34a');
          break;
        }
      }
    }
  }

  /** A new phase of the round: a banner and a sound for what it means to you. */
  private phaseCue(ph: Phase, win?: 'k' | 'v') {
    const me = this.core.me(), kusin = !!me && this.core.role(me) === 'k', { banner } = this.ctx.flow.hud;
    if (ph === 'hide') {
      banner(kusin ? 'BLUNDA OCH RÄKNA!' : 'GÖM DIG!', kusin ? '#ff8a1c' : '#c2402f');
      this.sfx.play(SOUNDS.bell);
    } else if (ph === 'seek') {
      banner(kusin ? 'LETA!' : 'KUSINERNA KOMMER!', kusin ? '#ff8a1c' : '#c2402f');
      this.sfx.play(SOUNDS.whistle);
    } else if (ph === 'end') {
      this.roundWin = win;
      banner(win === 'k' ? 'KUSINERNA VANN!' : 'VÄTTARNA VANN!', win === 'k' ? '#ff8a1c' : '#c2402f');
      this.sfx.play(SOUNDS.win);
    } else banner('VÄNTAR PÅ FLER', '#9fd3b0');
  }

  /** A dart leaves the gun: the gun kicks, a puff at the muzzle, the dart flies. */
  private shot(c: Extract<Cue, { k: 'shot' }>, mine: boolean) {
    const o = new Vector3(...c.o), e = new Vector3(...c.e);
    this.darts.push({ o, e, t: 0, fly: Math.max(0.03, o.distanceTo(e) / DART_SPEED), falls: c.v === 1, y: 0, vy: 0 });
    if (this.darts.length > DART_CAP) this.darts.shift();
    _u.subVectors(e, o).normalize();
    if (mine) {
      this.fp.recoil(0.08, 0.05);
      this.sfx.play(SOUNDS.shot);
      const loaded = this.gun.getObjectByName('loaded');
      if (loaded) {
        loaded.visible = false;
        setTimeout(() => (loaded.visible = true), 380);   // pushed back in by the thumb before the next
      }
    } else {
      // Someone else's: the puff of air at their muzzle (yours is in your face: the recoil and the empty barrel say it).
      this.sfx.at3d(SOUNDS.shot, o.x, o.y, o.z);
      this.vfx.play(EFFECTS.muzzle, { at: _v.copy(o).addScaledVector(_u, 0.55).add(_s.set(0, -0.2, 0)), dir: _u });
    }
  }

  /** Where a dart lands, at the moment it lands: a sound and a burst for what it hit. */
  private landed(d: Dart, thing: number) {
    _u.subVectors(d.e, d.o).normalize();
    const at = d.e;
    if (d.falls) return;   // a dart in a vätte: the dmg or frag cue shows it
    const key = thing >= 0 ? REAL_THINGS[thing].p.key : null;
    const mat = key ? MATERIAL[key] : undefined;
    const [effect, sound] = mat === 'porcelain' ? [EFFECTS.dartPorcelain, SOUNDS.klink]
      : mat === 'wood' ? [EFFECTS.dartWood, SOUNDS.tock]
      : mat === 'cloth' ? [EFFECTS.dartCloth, SOUNDS.fluff]
      : [EFFECTS.dartWall, SOUNDS.plopp];
    this.vfx.play(effect, { at, dir: _u });
    this.sfx.at3d(sound, at.x, at.y, at.z);
    if (thing >= 0) this.kitchen.wobble(REAL_THINGS[thing].p);
  }

  /** A wrong guess: the thing wobbles and puffs grey dust, a red "Fel!", the kusin flinches. */
  private wrong(c: Extract<Cue, { k: 'wrong' }>) {
    const th = REAL_THINGS[c.t];
    if (th) {
      _v.set(th.x, th.y + th.h + 0.15, th.z);
      this.vfx.play(EFFECTS.wrongGuess, { at: _v, dir: _u.copy(this.view.camera.position).sub(_v).normalize() });
      this.popups.show(th.x, th.y + th.h + 0.2, th.z, 'Fel!', '#ff5a36', { height: 0.2, rise: 0.35 });
      this.kitchen.wobble(th.p);
    }
    if (c.a === this.ctx.link.you) {
      this.sfx.play(SOUNDS.bonk);
      this.fp.shake(0.35);
      this.hud.hurt();
      this.hud.center(`Fel gissat! <small>−${WRONG} tålamod</small>`);
    } else if (th) this.sfx.at3d(SOUNDS.bonk, th.x, th.y, th.z, { vol: 0.7 });
  }

  /** Someone's out: a caught vätte tumbles out of its thing with stars, or a kusin's patience ran out. */
  private frag(c: Extract<Cue, { k: 'frag' }>) {
    const core = this.core, you = this.ctx.link.you, v = core.pawns.get(c.v), rig = this.rigs.get(c.v);
    if (c.a !== c.v && v) {
      const { h } = formBox(v.form);
      this.vfx.play(EFFECTS.caught, { at: _v.set(v.body.x, v.body.y, v.body.z) });
      this.popups.show(v.body.x, v.body.y + Math.max(h, 0.5) + 0.25, v.body.z, 'Tagen!', '#ffd34a', { height: 0.22, rise: 0.4, life: 1.4 });
      this.sfx.at3d(SOUNDS.caught, v.body.x, v.body.y + 0.5, v.body.z);
      this.ctx.time.hitstop(0.06);
      if (rig) rig.outT = 1.3;
      this.hud.feed(`<b>${esc(this.name(c.a))}</b> tog <b>${esc(this.name(c.v))}</b>${v.form >= 0 ? ` (en ${FORMS[v.form].name})` : ''}`);
      if (c.a === you) {
        this.sfx.play(SOUNDS.gotcha);
        this.hud.center(`Du tog <b>${esc(this.name(c.v))}</b>!`);
      }
    } else this.hud.feed(`<b>${esc(this.name(c.v))}</b> tappade tålamodet`);
    if (c.v === you && v) {
      this.deathAt.set(v.body.x, v.body.y, v.body.z);
      this.killer = c.a;
    }
  }

  // ------------------------------------------------------------ drawing

  private draw(dt: number, t: number) {
    const { link, flow, engine } = this.ctx, core = this.core;
    const me = core.me(), photo = this.photoAt;
    const myRole = me ? core.role(me) : 'k';
    this.firstPerson = !!me && flow.live && core.alive(me) && myRole === 'k';

    // Everyone's body: add joiners, drop leavers, the right look for their role and form.
    for (const [pid, rig] of this.rigs) {
      if (core.pawns.has(pid)) continue;
      rig.av.dispose();
      this.rigs.delete(pid);
      this.shownFrags.delete(pid);
    }
    link.players.forEach((lp, i) => {
      const p = core.pawns.get(lp.id);
      if (!p) return;
      let rig = this.rigs.get(lp.id);
      if (!rig) {
        const av = new Avatar(engine.mats.actor, kusin(this.ids, kusinLook(lookNo(lp.id))), { voxel: KUSIN_VOXEL, turn: 22 });
        av.root.traverse((o) => void (o.castShadow = true));
        this.view.scene.add(av.root);
        this.rigs.set(lp.id, (rig = { av, shown: false, walk: 0, as: 'k', outT: 0, hopT: 0 }));
        av.wear(new Mesh(this.avatarGun, engine.mats.actor), 'hand', { offset: [0, -0.02, 0.04] });
      }
      rig.outT -= dt;
      rig.hopT -= dt;
      const role = core.role(p), alive = core.alive(p);
      // A caught vätte is drawn as itself while it tumbles out.
      const as = role === 'k' ? 'k' : rig.outT > 0 ? VATTE : p.form;
      if (as !== rig.as) this.dress(rig, lp.id, as);
      // Your own body is hidden in first person, and in photos (they show the staged actors).
      const show = (alive || rig.outT > 0) && !(lp.id === link.you && (this.firstPerson || photo));
      rig.av.root.visible = show;
      if (show && !rig.shown) rig.av.teleport(p.body.x, p.body.y, p.body.z, p.body.yaw);
      rig.shown = show;
      if (show) this.pose(rig, p, dt);
      // The chip: role and points; a caught vätte's chip greys out until the next round.
      const st = core.match.stats.get(lp.id), stat = `${role === 'k' ? 'kusin' : 'vätte'} · ${st?.score ?? 0} p`;
      const out = role === 'v' && !alive && core.phase !== 'wait';
      const key = `${stat}|${out}`;
      if (key !== this.shownFrags.get(lp.id)) {
        this.shownFrags.set(lp.id, key);
        flow.hud.setStat(i, stat);
        flow.hud.setOut(i, out);
      }
    });

    this.drawDarts(dt);
    this.gun.visible = photo ? !!photo.gun : this.firstPerson;
    this.hud.hidden = !!photo;
    const st = me ? core.match.stats.get(me.pid) : undefined, playing = !!me && flow.live && core.alive(me);
    const left = Math.max(0, (core.match.until - link.now()) / 1000);
    // The last ten seconds of hiding (or seeking) tick.
    if (flow.live && core.phase !== 'wait' && core.phase !== 'end' && left < 10.5 && Math.ceil(left) !== this.lastTick) {
      this.lastTick = Math.ceil(left);
      if (this.lastTick > 0) this.sfx.play(SOUNDS.tick);
    }
    const b = me?.body;
    this.hud.update(dt, {
      playing,
      kusin: myRole === 'k',
      hp: st?.hp ?? MAX_HP,
      form: me?.form ?? VATTE,
      locked: !!me?.locked,
      aimed: me && myRole === 'v' && playing ? core.aimedForm(me) : NO_FORM,
      out: !!me && flow.live && !core.alive(me) && core.phase !== 'end',
      phase: flow.live ? core.phase : 'wait',
      left,
      blind: playing && myRole === 'k' && core.phase === 'hide',
      blend: playing && myRole === 'v' && b ? blendIn(me!.form, b.x, b.y, b.z) : null,
      list: playing && myRole === 'k' && this.ctx.input.down('list'),
      board: flow.live && core.phase === 'end'
        ? link.players.map((lp) => ({ name: lp.name, role: core.match.stats.get(lp.id)?.role ?? 'v', score: core.match.stats.get(lp.id)?.score ?? 0, me: lp.id === link.you }))
          .sort((x, y) => y.score - x.score)
        : null,
      win: this.roundWin,
    });
    this.camera(dt, t, me);
    this.kitchen.staged = !!photo || !flow.live;
    this.kitchen.kusin.root.visible &&= !photo?.noKusin;
    this.kitchen.update(dt, t);
    this.vfx.update(dt);
    this.popups.update(dt);
    this.view.update(dt, t);
  }

  /** Give a body its look: a kusin, a vätte, or the thing it has become. */
  private dress(rig: Rig, pid: string, as: 'k' | number) {
    rig.as = as;
    if (as === 'k') rig.av.setLook(kusin(this.ids, kusinLook(lookNo(pid))), KUSIN_VOXEL);
    else if (as === VATTE) rig.av.setLook(vatte(this.ids, vatteLook(lookNo(pid))), VATTE_VOXEL);
    else rig.av.setLook(this.formVols[as], this.formVoxel[as]);
    // The suction gun is a kusin's.
    if (as === 'k') rig.av.wear(new Mesh(this.avatarGun, this.ctx.engine.mats.actor), 'hand', { offset: [0, -0.02, 0.04] });
    else rig.av.unwear();
  }

  /** A body where it is: a run cycle for people, a hop for things on the move, a tumble when caught. */
  private pose(rig: Rig, p: Pawn, dt: number) {
    const b = p.body, body = rig.av.char.body, root = rig.av.char.root;
    rig.av.set(b.x, b.y, b.z, p.locked ? rig.av.shown.yaw : b.yaw);
    rig.av.update(dt);
    const ground = b.ground || this.core.arena.boxHits(b.x - 0.2, b.y - 0.1, b.z - 0.2, b.x + 0.2, b.y, b.z + 0.2);
    const thing = typeof rig.as === 'number' && rig.as >= 0;
    if (ground && rig.av.speed > 0.4) rig.walk += dt * (thing ? 9 : 6 + rig.av.speed * 1.4);
    const hop = rig.hopT > 0 ? Math.sin((rig.hopT / 0.45) * Math.PI) * 0.12 : 0;
    body.position.y = (ground ? Math.abs(Math.sin(rig.walk)) * (thing ? 0.07 : 0.1) : 0.04) + hop;
    body.rotation.x = ground ? 0 : -0.12;
    body.rotation.z = thing && ground && rig.av.speed > 0.4 ? Math.sin(rig.walk) * 0.12 : 0;
    // Caught: it spins and sinks away.
    if (rig.outT > 0) {
      const k = 1 - rig.outT / 1.3;
      root.rotation.y += dt * 9;
      body.position.y = Math.sin(Math.min(1, k * 2) * Math.PI) * 0.5;
      rig.av.opacity = Math.max(0, 1 - Math.max(0, k - 0.6) / 0.4);
    } else {
      root.rotation.y = 0;
      rig.av.opacity = 1;
    }
  }

  /** Darts: flying from the muzzle, then stuck where they hit for a while (or bouncing off a vätte to the floor). */
  private drawDarts(dt: number) {
    let n = 0;
    for (let i = this.darts.length - 1; i >= 0; i--) {
      const d = this.darts[i];
      const was = d.t;
      d.t += dt;
      if (was < d.fly && d.t >= d.fly) {
        this.landed(d, this.thingAt(d.e));
        d.y = d.e.y;
      }
      if (d.t > d.fly + DART_STAY) {
        this.darts.splice(i, 1);
        continue;
      }
      _u.subVectors(d.e, d.o).normalize();
      const k = Math.min(1, d.t / d.fly);
      _v.lerpVectors(d.o, d.e, k);
      if (d.t >= d.fly && d.falls) {
        // Off a vätte: it drops, end over end, and lies on the floor.
        d.vy -= 18 * dt;
        d.y = Math.max(0.03, d.y + d.vy * dt);
        _v.y = d.y;
        if (d.y <= 0.03) d.vy = 0;
        _u.set(_u.x, 0, _u.z).normalize();
      }
      // The cup touches what it hit: the dart's tip is at its origin, so back it out a little.
      if (d.t >= d.fly && !d.falls) _v.addScaledVector(_u, 0.01);
      _q.setFromUnitVectors(_z, _u);
      const fade = Math.min(1, (d.fly + DART_STAY - d.t) / 0.3);
      _m.compose(_v, _q, _s.set(fade, fade, fade));
      this.dartMesh.setMatrixAt(n++, _m);
    }
    this.dartMesh.count = n;
    this.dartMesh.instanceMatrix.needsUpdate = true;
  }

  /** Which real thing a point is on (for the dart's sound), -1 for none. */
  private thingAt(at: Vector3): number {
    let best = -1, bestD = 0.12;
    REAL_THINGS.forEach((th, j) => {
      const dx = Math.max(0, Math.abs(at.x - th.x) - th.r), dz = Math.max(0, Math.abs(at.z - th.z) - th.r);
      const dy = Math.max(0, th.y - at.y, at.y - (th.y + th.h));
      const d = Math.hypot(dx, dy, dz);
      if (d < bestD) [best, bestD] = [j, d];
    });
    return best;
  }

  // ------------------------------------------------------------ the camera

  private camera(dt: number, t: number, me: Pawn | undefined) {
    const cam = this.view.camera as PerspectiveCamera, core = this.core;
    if (this.photoAt) {
      const p = this.photoAt;
      cam.position.set(...p.pos);
      cam.lookAt(...p.look);
      if (cam.fov !== p.fov) {
        cam.fov = p.fov;
        cam.updateProjectionMatrix();
      }
      return;
    }
    const live = this.ctx.flow.live;
    if (this.firstPerson && me) {
      const b = me.body;
      this.fp.update(dt, b, me, this.read);
      // Footsteps: yours only, a few a second.
      const speed = Math.hypot(b.vx, b.vz);
      this.stepT -= dt * (b.ground ? speed / 6 : 0);
      if (this.stepT <= 0 && b.ground && speed > 1.5) {
        this.stepT = 0.38;
        this.sfx.play(SOUNDS.land, { vol: 0.1, pitch: 7 });
      }
      return;
    }
    this.fp.easeFov(dt);
    if (me && live && core.alive(me) && core.role(me) === 'v') {
      // A vätte: behind it, a little above. Locked, the mouse looks round it instead.
      const b = me.body, { h } = formBox(me.form);
      const yaw = me.locked ? this.orbitYaw : b.yaw, pitch = me.locked ? this.orbitPitch : Math.min(0.3, b.pitch - 0.18);
      _u.set(b.x, b.y + Math.max(0.35, h * 0.7) + TP_RISE * 0.5, b.z);
      const dx = -Math.sin(yaw) * Math.cos(pitch), dy = -Math.sin(pitch), dz = -Math.cos(yaw) * Math.cos(pitch);
      // Not through the walls: as far back as the room allows.
      const room = core.arena.ray(_u.x, _u.y, _u.z, dx, dy, dz, TP_DIST);
      const dist = Math.max(0.5, Math.min(TP_DIST, room - 0.15));
      _v.set(_u.x + dx * dist, _u.y + dy * dist + TP_RISE * 0.3, _u.z + dz * dist);
      cam.position.lerp(_v, Math.min(1, dt * 14));
      cam.lookAt(_u.x - dx, _u.y - dy * 0.6, _u.z - dz);
      return;
    }
    const outFor = me ? this.ctx.link.now() - (core.match.stats.get(me.pid)?.deadAt ?? 0) : 0;
    if (me && live && !core.alive(me) && core.role(me) === 'v' && outFor > 2500) {
      // Caught: watch the rest of the round, from up by the ceiling, slowly round the kitchen.
      const a = t * 0.12;
      _v.set(3.5 + Math.sin(a) * 2.2, 2.2, 2.6 + Math.cos(a) * 1.8);
      cam.position.lerp(_v, Math.min(1, dt * 1.5));
      cam.lookAt(3.2, 0.6, 2.4);
      return;
    }
    if (me && live && !core.alive(me)) {
      // Out: rise over where it happened and look at who did it.
      const k = this.rigs.get(this.killer);
      _v.set(this.deathAt.x, Math.max(this.deathAt.y, 0) + 1.9, this.deathAt.z + 0.8);
      cam.position.lerp(_v, Math.min(1, dt * 4));
      if (k?.shown && this.killer !== me.pid) cam.lookAt(k.av.shown.x, k.av.shown.y + 1, k.av.shown.z);
      else cam.lookAt(this.deathAt.x, this.deathAt.y, this.deathAt.z + 0.01);
      return;
    }
    // The title card, spectating: a slow sway in the kitchen doorway, looking at the table.
    _v.set(3 + Math.sin(t * 0.21) * 0.9, 1.55 + Math.sin(t * 0.13) * 0.1, 4.4);
    cam.position.lerp(_v, Math.min(1, dt * 2));
    cam.lookAt(3, 1.0, 1.2);
  }

  private name(pid: string) {
    return this.ctx.link.players.find((p) => p.id === pid)?.name ?? 'Någon';
  }

  private color(pid: string) {
    return this.ctx.players[this.ctx.link.players.findIndex((p) => p.id === pid)]?.color ?? '#ffcc33';
  }
}

// ---------------------------------------------------------------- the HUD

const CSS = `
.ia { position: fixed; inset: 0; pointer-events: none; font: 800 16px Nunito, system-ui, sans-serif; color: #fff; text-shadow: 0 2px 0 #0008; }
.ia .x { position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; margin: -7px; opacity: .9;
  background: linear-gradient(#fff, #fff) center / 2px 14px no-repeat, linear-gradient(#fff, #fff) center / 14px 2px no-repeat; }
.ia .x.v { width: 8px; height: 8px; margin: -4px; border-radius: 50%; background: #fff; opacity: .7; }
.ia .hit { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(45deg); font-size: 34px; opacity: 0; transition: opacity .15s; }
.ia .hit.on { opacity: 1; transition: none; }
.ia .hurt { position: absolute; inset: 0; box-shadow: inset 0 0 120px #ff5a36cc; opacity: 0; transition: opacity .4s; }
.ia .hurt.on { opacity: 1; transition: none; }
.ia .card { position: absolute; left: 20px; bottom: 18px; padding: 10px 14px; border: 3px solid #1d2340; border-radius: 14px;
  background: rgba(255,252,245,.86); color: #1d2340; text-shadow: none; box-shadow: 0 5px 0 #1d2340; min-width: 190px; }
.ia .card .role { font: 12px 'Press Start 2P', monospace; letter-spacing: 1px; }
.ia .card .role.k { color: #e0661a; } .ia .card .role.v { color: #a8322a; }
.ia .card .bar { margin-top: 8px; height: 12px; border: 2px solid #1d2340; border-radius: 6px; background: #e8dcc2; overflow: hidden; }
.ia .card .bar i { display: block; height: 100%; background: #7ee081; transition: width .2s; }
.ia .card .bar i.low { background: #ff5a36; }
.ia .card .line { margin-top: 6px; font-size: 14px; }
.ia .key { display: inline-block; color: #1d2340; min-width: 18px; padding: 0 4px; border: 2px solid #1d2340; border-radius: 5px; background: #fff; font: 800 12px Nunito, sans-serif; text-align: center; }
html.vp-touching .ia .card { top: 74px; bottom: auto; padding: 6px 10px; max-width: 220px; }
html.vp-touching .ia .card .hint, html:not(.vp-touching) .ia .tc, html.vp-touching .ia .kb { display: none; }
html.vp-touching .ia .blind small { max-width: 320px; }
.ia .feed { position: absolute; right: 18px; top: 90px; text-align: right; font-size: 14px; line-height: 1.6; }
.ia .mid { position: absolute; left: 0; right: 0; top: 62%; text-align: center; font-size: 22px; }
.ia .mid small { font-size: 15px; opacity: .85; }
.ia .aim { position: absolute; left: 0; right: 0; top: calc(50% + 22px); text-align: center; font-size: 15px; }
.ia .off { display: none !important; }   /* over any panel's own display (the blind screen is flex) */
.ia .timer { position: absolute; left: 18px; top: 16px; padding: 6px 12px; border: 3px solid #1d2340; border-radius: 12px; background: rgba(255,252,245,.88);
  color: #1d2340; text-shadow: none; box-shadow: 0 4px 0 #1d2340; font: 12px 'Press Start 2P', monospace; }
.ia .timer b { display: block; margin-top: 4px; font-size: 18px; }
.ia .timer.hurry b { color: #e0661a; }
.ia .blind { position: absolute; inset: 0; background: radial-gradient(#1a1d2e, #07080f); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
.ia .blind .big { font: 22px 'Press Start 2P', monospace; color: #ffd98a; }
.ia .blind .count { font: 56px 'Press Start 2P', monospace; }
.ia .blind small { font-size: 16px; opacity: .8; max-width: 460px; text-align: center; }
.ia .blind.listing { justify-content: flex-end; padding-bottom: 6vh; }
.ia .blind.listing .big, .ia .blind.listing small { display: none; }
.ia .meter { margin-top: 8px; display: flex; align-items: center; gap: 8px; font-size: 13px; }
.ia .meter i { display: inline-block; width: 14px; height: 14px; border: 2px solid #1d2340; border-radius: 4px; background: #e8dcc2; }
.ia .meter i.on.l0 { background: #ff5a36; } .ia .meter i.on.l1 { background: #f2c94c; } .ia .meter i.on.l2 { background: #7ee081; }
.ia .list { position: absolute; left: 50%; top: 14%; transform: translateX(-50%) rotate(-1.5deg); width: 300px; padding: 16px 20px 18px;
  background: repeating-linear-gradient(#fbf6e6 0 25px, #cfe0f0 25px 26px); border: 3px solid #1d2340; border-radius: 6px; color: #2a3a6a;
  text-shadow: none; box-shadow: 0 6px 0 #1d2340; font: 700 italic 16px/26px Nunito, sans-serif; }
.ia .list h3 { margin: 0 0 4px; font: 900 18px Nunito, sans-serif; color: #a8322a; }
.ia .list .room { margin-top: 6px; font-weight: 900; text-decoration: underline; }
.ia .board { position: absolute; left: 50%; top: 40%; transform: translateX(-50%); min-width: 320px; padding: 12px 16px; border: 3px solid #1d2340;
  border-radius: 14px; background: rgba(255,252,245,.92); color: #1d2340; text-shadow: none; box-shadow: 0 5px 0 #1d2340; }
.ia .board .row { display: flex; gap: 10px; padding: 3px 0; font-size: 16px; }
.ia .board .row.me { color: #a8322a; }
.ia .board .row span:first-child { flex: 1; }`;

export interface HudState {
  playing: boolean;
  phase: Phase;
  /** Seconds left in the phase. */
  left: number;
  /** A kusin waiting with eyes shut. */
  blind: boolean;
  /** A vätte's Smälter in-mätare, or null. */
  blend: { level: 0 | 1 | 2; why: string } | null;
  /** A kusin holding Tab: mormors inventarielista. */
  list: boolean;
  /** The round's end: everyone by points. */
  board: { name: string; role: 'k' | 'v'; score: number; me: boolean }[] | null;
  /** Who won the round just ended. */
  win?: 'k' | 'v';
  kusin: boolean;
  hp: number;
  form: number;
  locked: boolean;
  /** A vätte's: the thing in reach under the crosshair, or NO_FORM. */
  aimed: number;
  out: boolean;
}

/** Your card (role, patience or form, the keys), the crosshair, hit marks, a feed and a line in the middle. Plain DOM. */
class Hud {
  private readonly root = document.createElement('div');
  private readonly style = document.createElement('style');
  private readonly el: Record<'x' | 'hit' | 'hurt' | 'card' | 'feed' | 'mid' | 'aim' | 'timer' | 'blind' | 'list' | 'board', HTMLElement>;
  private hitT = 0;
  private hurtT = 0;
  private midT = 0;
  private last = '';
  private lastAim = '';
  private lastTimer = '';
  private lastBlind = '';
  private lastBoard = '';

  constructor() {
    this.style.textContent = CSS;
    this.root.className = 'ia';
    this.root.innerHTML = '<div class="hurt"></div><div class="x"></div><div class="hit">+</div><div class="card"></div><div class="feed"></div>'
      + '<div class="mid"></div><div class="aim"></div><div class="timer"></div><div class="blind off"></div><div class="list off"></div><div class="board off"></div>';
    const q = (c: string) => this.root.querySelector<HTMLElement>(`.${c}`)!;
    this.el = { x: q('x'), hit: q('hit'), hurt: q('hurt'), card: q('card'), feed: q('feed'), mid: q('mid'), aim: q('aim'), timer: q('timer'), blind: q('blind'), list: q('list'), board: q('board') };
    // Mormors inventarielista: written once, shown while a kusin holds Tab.
    this.el.list.innerHTML = '<h3>Mormors lista</h3>' + INVENTORY.map(({ room, rows }) =>
      `<div class="room">${room}</div>` + rows.map(({ f, n }) => `<div>${n} ${n > 1 ? FORMS[f].some : FORMS[f].name}</div>`).join('')).join('');
    document.head.append(this.style);
    document.body.append(this.root);
  }

  /** Photo mode: none of it shows. */
  set hidden(on: boolean) {
    this.root.style.display = on ? 'none' : '';
  }

  update(dt: number, s: HudState) {
    for (const k of ['x', 'card'] as const) this.el[k].classList.toggle('off', !s.playing);
    this.el.x.classList.toggle('v', !s.kusin);
    // The card: only rebuilt when what it says changes.
    const key = `${s.kusin}|${Math.round(s.hp)}|${s.form}|${s.locked}|${s.blend?.level}|${s.blend?.why}`;
    if (key !== this.last) {
      this.last = key;
      this.el.card.innerHTML = s.kusin
        ? `<div class="role k">KUSIN</div><div class="line">Tålamod</div><div class="bar"><i class="${s.hp < 30 ? 'low' : ''}" style="width:${Math.max(0, s.hp)}%"></i></div>`
          + `<div class="line hint">Hitta vättarna. Fel gissning kostar!</div><div class="line hint"><span class="key">Tab</span> mormors lista</div>`
        : `<div class="role v">VÄTTE</div><div class="line">${s.form >= 0 ? `Du är en <b>${FORMS[s.form].name}</b>${s.locked ? ' (låst)' : ''}` : 'Göm dig som en sak!'}</div>`
          + (s.blend && s.form >= 0 ? `<div class="meter">Smälter in ${[0, 1, 2].map((l) => `<i class="${l <= s.blend!.level ? `on l${s.blend!.level}` : ''}"></i>`).join('')}</div><div class="line"><small>${s.blend.why}</small></div>` : '')
          + `<div class="line hint"><span class="key">E</span> bli sak · <span class="key">R</span> ${s.locked ? 'lås upp' : 'lås'} · <span class="key">Q</span> taunt</div>`;
    }
    const aim = !s.kusin && s.playing && s.aimed >= 0 && s.aimed !== s.form ? `<span class="key">E</span> bli ${FORMS[s.aimed].name}` : '';
    if (aim !== this.lastAim) this.el.aim.innerHTML = this.lastAim = aim;
    // The round's clock, top left (the top centre is the platform's chips).
    const label = { wait: 'VÄNTAR', hide: 'GÖMFAS', seek: 'SÖKFAS', end: 'SLUT' }[s.phase];
    const clock = s.phase === 'wait' || s.phase === 'end' ? '' : `${Math.floor(s.left / 60)}:${String(Math.floor(s.left % 60)).padStart(2, '0')}`;
    const timer = `${label}${clock ? `<b>${clock}</b>` : ''}`;
    if (timer !== this.lastTimer) this.el.timer.innerHTML = this.lastTimer = timer;
    this.el.timer.classList.toggle('hurry', s.left < 10.5);
    // Eyes shut: the whole screen, a count.
    this.el.blind.classList.toggle('off', !s.blind);
    // Reading the list with eyes shut: just the count, under it.
    this.el.blind.classList.toggle('listing', s.list);
    if (s.blind) {
      const html = `<div class="big">DU BLUNDAR…</div><div class="count">${Math.ceil(s.left)}</div><small>Vättarna gömmer sig i köket och skafferiet. Håll in <span class="kb"><span class="key">Tab</span></span><span class="tc"><span class="key">LISTA</span></span> och lär dig mormors lista, så ser du vad som inte hör hemma.</small>`;
      if (html !== this.lastBlind) this.el.blind.innerHTML = this.lastBlind = html;
    }
    this.el.list.classList.toggle('off', !s.list);
    this.el.board.classList.toggle('off', !s.board);
    if (s.board) {
      const head = s.win === 'k' ? 'Kusinerna tog alla!' : s.win === 'v' ? 'Vättarna klarade sig!' : 'Poäng';
      const html = `<div class="row"><b>${head}</b></div>` + s.board.map((r) => `<div class="row${r.me ? ' me' : ''}"><span>${esc(r.name)}</span><span>${r.role === 'k' ? 'kusin' : 'vätte'}</span><b>${r.score} p</b></div>`).join('');
      if (html !== this.lastBoard) this.el.board.innerHTML = this.lastBoard = html;
    }
    this.el.hit.classList.toggle('on', (this.hitT -= dt) > 0);
    this.el.hurt.classList.toggle('on', (this.hurtT -= dt) > 0);
    if (s.out) this.el.mid.innerHTML = s.kusin ? 'Slut på tålamod… tillbaka strax' : 'Tagen! Tillbaka strax…';
    else if ((this.midT -= dt) <= 0) this.el.mid.textContent = '';
  }

  hitMark() {
    this.hitT = 0.15;
  }

  hurt() {
    this.hurtT = 0.12;
  }

  center(html: string) {
    this.el.mid.innerHTML = html;
    this.midT = 1.6;
  }

  /** A line in the feed (HTML: escape names). The last four stay. */
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

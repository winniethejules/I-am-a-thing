/**
 * The kitchen look slice, drawn: the house shell (house.ts) as one volume at 1/8 m, the garden
 * beyond the windows at 1/4 m, every kit model (models.ts) placed by kitchen.ts, the staged kusin
 * and vätte, the block light in dimmer groups, and the three look variants (look.ts).
 */
import { BufferGeometry, Group, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3 } from 'three';
import {
  Avatar, B, Volume, blockGeometry, meshVolume, mulberry32,
  type ArenaStage, type BlockLight, type GameContext,
} from '@voxelparty/sdk';
import { kusin, kusinLook, suctionGun, vatte, vatteLook, GUN_VOXEL, KUSIN_VOXEL, VATTE_VOXEL } from './characters';
import { HOUSE_AT, HOUSE_SIZE, HV, WINDOWS, stampHouse, type Mat } from './house';
import { KITCHEN_PROPS, STAGED, type Placed } from './kitchen';
import { CHOSEN, LOOKS, type LookName } from './look';
import { box, buildModels, type Model, type ModelKey } from './models';
import type { Ids } from './textures';

const _m = new Matrix4(), _q = new Quaternion(), _tilt = new Quaternion(), _p = new Vector3(), _s = new Vector3(1, 1, 1);
const _up = new Vector3(0, 1, 0), _x = new Vector3(1, 0, 0);
/** How long a hit thing wobbles. */
const WOBBLE_S = 0.5;

/** A model's geometry, meshed once (voxel size and origin as the model says). */
function geometry(m: Model): BufferGeometry {
  return meshVolume(m.vol, { voxel: m.voxel, origin: m.origin }).opaque!;
}

export class KitchenScene {
  readonly root = new Group();
  readonly light: BlockLight;
  readonly kusin: Avatar;
  readonly vatte: Avatar;
  private readonly geos: BufferGeometry[] = [];
  /** Where each placed thing is drawn: its instanced mesh and slot, so a hit can wobble it. */
  private readonly slots = new Map<Placed, { mesh: InstancedMesh; i: number }>();
  /** Things wobbling from a dart: how long they have left. */
  private readonly wobbles = new Map<Placed, number>();
  look: LookName = CHOSEN;

  constructor(private readonly ctx: GameContext, private readonly view: ArenaStage, private readonly ids: Ids) {
    const { engine } = ctx;
    view.scene.add(this.root);

    // The house: one volume, meshed once, lit from inside by block light.
    const house = new Volume(...HOUSE_SIZE);
    stampHouse((x, y, z, m) => house.set(x, y, z, m === 'AIR' ? 0 : ids[m as Exclude<Mat, 'AIR'>]));
    const hg = meshVolume(house, { voxel: HV }).opaque!;
    this.geos.push(hg);
    const hm = new Mesh(hg, engine.mats.solid);
    hm.position.set(...HOUSE_AT);
    hm.castShadow = hm.receiveShadow = true;
    this.root.add(hm);
    this.light = view.blockLight(house, { voxel: HV, at: { x: HOUSE_AT[0], y: HOUSE_AT[1], z: HOUSE_AT[2] } });
    this.addLights();

    this.buildGarden();
    this.buildProps();

    // The staged actors: our own characters, the kusin holding the suction gun.
    this.kusin = new Avatar(engine.mats.actor, kusin(ids, kusinLook(0)), { voxel: KUSIN_VOXEL });
    const gun = new Mesh(meshVolume(suctionGun(ids), { voxel: GUN_VOXEL, origin: [1.5, 0, 3] }).opaque!, engine.mats.actor);
    this.geos.push(gun.geometry);
    this.kusin.wear(gun, 'hand', { offset: [0, -0.02, 0.04] });
    this.kusin.teleport(STAGED.kusin.x, 0, STAGED.kusin.z, STAGED.kusin.yaw);
    this.vatte = new Avatar(engine.mats.actor, vatte(ids, vatteLook(4)), { voxel: VATTE_VOXEL });
    this.vatte.teleport(STAGED.vatte.x, 0, STAGED.vatte.z, STAGED.vatte.yaw);
    for (const av of [this.kusin, this.vatte]) {
      av.root.traverse((o) => void (o.castShadow = true));
      this.root.add(av.root);
    }
    this.setLook(CHOSEN);
    // Dust in the lamplight over the table: warm motes, drifting slowly.
    view.pollen({
      count: 90, area: [4.2, 3.2], height: [0.5, 2.3], centre: [3, 0, 2.0],
      colors: ['#ffe2a8', '#fff1d0', '#ffd27a'], size: [0.012, 0.026], speed: [0.02, 0.06], amp: [0.05, 0.15],
    }, mulberry32(0xd057));
  }

  /** The lamp, the stove, daylight and dusk through each window, the hall's lamp: four dimmer groups. */
  private addLights() {
    const L = this.light;
    L.add({ ...L.cell(3, 1.68, 1.55), color: '#ffcf8a', reach: 40, strength: 0.7, group: 1 });
    L.add({ ...L.cell(3, 2.2, 6.5), color: '#ffcf8a', reach: 22, strength: 0.6, group: 1 });
    L.add({ ...L.cell(0.98, 0.45, 1.75), color: '#ff8a3a', reach: 22, strength: 0.8, group: 2 });
    L.add({ ...L.cell(7.0, 1.95, 4.35), color: '#ffd9a0', reach: 24, strength: 0.85, group: 1 });   // the pantry's bulb: a bare bulb in a small room, bright
    for (const [x0, x1] of WINDOWS) {
      const x = (x0 + x1) / 2;
      L.add({ ...L.cell(x, 1.5, 0.35), color: '#eaf2ff', reach: 44, strength: 0.55, group: 3 });
      L.add({ ...L.cell(x, 1.5, 0.35), color: '#5b7cff', reach: 44, strength: 0.5, group: 4 });
    }
  }

  /** Every kit model in the kitchen: one instanced mesh per kind (draw calls by kind, not by thing). */
  private buildProps() {
    const { engine } = this.ctx, models = buildModels(this.ids);
    const byKey = new Map<ModelKey, typeof KITCHEN_PROPS>();
    for (const p of KITCHEN_PROPS) byKey.set(p.key, [...(byKey.get(p.key) ?? []), p]);
    for (const [key, list] of byKey) {
      const g = geometry(models[key]);
      this.geos.push(g);
      const mesh = new InstancedMesh(g, engine.mats.solid, list.length);
      list.forEach((p, i) => {
        _q.setFromAxisAngle(_up, p.yaw);
        mesh.setMatrixAt(i, _m.compose(_p.set(p.x, p.y, p.z), _q, _s));
        this.slots.set(p, { mesh, i });
      });
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.name = key;
      this.root.add(mesh);
    }
    // The washing line in the garden, with mormors mammelucker and two tea towels.
    const line = new Mesh(blockGeometry(this.ids.WHITE, [4.6, 0.025, 0.025]), engine.mats.solid);
    line.position.set(3, 1.72, -4);
    this.root.add(line);
    const hangs: [ModelKey, number, number][] = [['bloomers', 2.2, 0.05], ['towel', 3.35, -0.08], ['towel', 4.1, 0.1]];
    for (const [key, x, yaw] of hangs) {
      const m = new Mesh(geometry(models[key]), engine.mats.solid);
      this.geos.push(m.geometry);
      m.position.set(x, 1.73, -4);
      m.rotation.y = yaw;
      m.castShadow = true;
      this.root.add(m);
    }
  }

  /** The garden north of the kitchen at 1/4 m: lawn, fence, birches, the washing line's posts, the barn, the forest. */
  private buildGarden() {
    const k = this.ids, GV = 0.25, at: [number, number, number] = [-20, -1, -50];
    const v = new Volume(184, 44, 200);
    const fill = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, id: number) =>
      box(v, Math.round((x0 - at[0]) / GV), Math.round((y0 - at[1]) / GV), Math.round((z0 - at[2]) / GV),
        Math.round((x1 - at[0]) / GV), Math.round((y1 - at[1]) / GV), Math.round((z1 - at[2]) / GV), id);
    const rand = mulberry32(0x6a7d);

    fill(-20, -1, -50, 26, -0.5, -0.25, k.LAWN);
    fill(2.5, -0.75, -10.25, 3.5, -0.5, -0.25, B.PATH);   // the path to the gate, sunk into the lawn
    // Flowers along the house and the fence.
    for (let x = -20; x < 26; x += 0.25) {
      if (rand() < 0.35) fill(x, -0.5, -0.75, x + 0.25, -0.25, -0.5, [B.FLOWER_RED, B.FLOWER_YELLOW, B.FLOWER_WHITE, B.TALL_GRASS][Math.floor(rand() * 4)]);
      if (rand() < 0.3) fill(x, -0.5, -9.75, x + 0.25, -0.25, -9.5, [B.FLOWER_BLUE, B.TALL_GRASS, B.FLOWER_WHITE][Math.floor(rand() * 3)]);
    }
    for (let i = 0; i < 260; i++) {
      const x = -20 + rand() * 46, z = -45 + rand() * 44;
      if (Math.abs(x - 3) < 0.8 && z > -10.5) continue;
      fill(x, -0.5, z, x + 0.25, -0.25, z + 0.25, rand() < 0.7 ? B.TALL_GRASS : B.FLOWER_YELLOW);
    }
    // The picket fence, a gate gap on the path.
    for (let x = -20; x < 26; x += 0.5) {
      if (x >= 2.5 && x < 3.5) continue;
      fill(x, -0.5, -10.25, x + 0.25, 0.5, -10, k.FENCE);
    }
    for (const y of [-0.25, 0.25]) {
      fill(-20, y, -10.5, 2.5, y + 0.25, -10.25, k.FENCE);
      fill(3.5, y, -10.5, 26, y + 0.25, -10.25, k.FENCE);
    }
    // The washing line's posts.
    for (const x of [0.75, 5.25]) {
      fill(x - 0.125, -0.5, -4.125, x + 0.125, 1.75, -3.875, k.WOOD_DARK);
      fill(x - 0.5, 1.75, -4.125, x + 0.5, 2.0, -3.875, k.WOOD_DARK);
    }
    // Birches.
    for (const [x, z, h] of [[-1.5, -6, 6], [8.5, -8, 7], [11, -5, 5.5], [-6, -7.5, 6.5]]) {
      fill(x, -0.5, z, x + 0.25, h, z + 0.25, k.BIRCH);
      for (let i = 0; i < 90; i++) {
        const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 1.7, y = h - 2.4 + rand() * 3;
        const px = x + Math.cos(a) * r * (1 - (y - h + 2.4) / 4.5), pz = z + Math.sin(a) * r * (1 - (y - h + 2.4) / 4.5);
        fill(px, y, pz, px + 0.5, y + 0.5, pz + 0.5, k.LEAF);
      }
    }
    // The barn: falu red walls, white corners, a gable facing the house, a big double door.
    const bx0 = 5, bx1 = 15, bz0 = -31, bz1 = -25, wall = 2.75;
    fill(bx0, -0.5, bz0, bx1, wall, bz1, k.FALU);
    for (const x of [bx0, bx1 - 0.25]) fill(x, -0.5, bz1 - 0.25, x + 0.25, wall, bz1, k.WHITE);
    for (let i = 0; i * 0.25 < 2.75; i++) {
      const y = wall + i * 0.25, x0 = bx0 - 0.25 + i * 0.5, x1 = bx1 + 0.25 - i * 0.5;
      if (x1 - x0 <= 0) break;
      fill(x0, y, bz0 - 0.25, x1, y + 0.25, bz1 + 0.25, k.ROOF);
      if (x1 - x0 > 1.5) fill(x0 + 0.75, y, bz1, x1 - 0.75, y + 0.25, bz1 + 0.25, k.FALU);
      if (x1 - x0 > 1.5) {
        fill(x0 + 0.5, y, bz1, x0 + 0.75, y + 0.25, bz1 + 0.25, k.WHITE);
        fill(x1 - 0.75, y, bz1, x1 - 0.5, y + 0.25, bz1 + 0.25, k.WHITE);
      }
    }
    fill(8.5, -0.5, bz1, 11.5, 2.25, bz1 + 0.25, k.WHITE);     // the door's frame
    fill(8.75, -0.5, bz1, 11.25, 2.0, bz1 + 0.25, k.FALU);
    for (let i = 0; i < 8; i++) {                              // white cross braces
      fill(8.75 + i * 0.3125, -0.5 + i * 0.3125, bz1, 9 + i * 0.3125, -0.25 + i * 0.3125, bz1 + 0.25, k.WHITE);
      fill(11 - i * 0.3125, -0.5 + i * 0.3125, bz1, 11.25 - i * 0.3125, -0.25 + i * 0.3125, bz1 + 0.25, k.WHITE);
    }
    fill(9.75, 3.25, bz1, 10.25, 3.75, bz1 + 0.25, k.WINDOW_LIT);   // the hayloft's lit window
    fill(9.5, 3.0, bz1, 10.5, 3.25, bz1 + 0.25, k.WHITE);
    // The forest beyond: dark spruce cones.
    for (let x = -20; x < 26; x += 1.25 + rand() * 1.5) {
      const z = -47 + rand() * 3, h = 4 + rand() * 3.5;
      fill(x, -0.5, z, x + 0.25, 1, z + 0.25, k.TRUNK);
      for (let y = 0.5; y < h; y += 0.25) {
        const r = (1 - (y - 0.5) / h) * 1.6;
        fill(x - r, y, z - r, x + r + 0.25, y + 0.25, z + r + 0.25, k.PINE_TREE);
      }
    }
    const data = meshVolume(v, { voxel: GV });
    for (const g of [data.opaque, data.cross]) {
      if (!g) continue;
      this.geos.push(g);
      const m = new Mesh(g, g === data.cross ? this.ctx.engine.mats.cross : this.ctx.engine.mats.solid);
      m.position.set(...at);
      m.castShadow = g !== data.cross;
      m.receiveShadow = true;
      this.root.add(m);
    }
  }

  /** Switch the look: sky, grade and the dimmer groups. */
  setLook(name: LookName) {
    const v = LOOKS[name];
    this.look = name;
    this.view.sky.set(v.sky);
    const g = this.view.grade as Record<string, unknown>;
    for (const k of ['exposure', 'vignette', 'saturation', 'contrast', 'shadows', 'highlights', 'split', 'tint']) delete g[k];
    Object.assign(this.view.grade, v.grade);
    this.light.dim(1, v.lamp);
    this.light.dim(2, v.stove);
    this.light.dim(3, v.day);
    this.light.dim(4, v.dusk);
    for (const name of ['lampGlow', 'bulbGlow']) {
      const glow = this.root.getObjectByName(name);
      if (glow) glow.visible = v.lamp > 0;
    }
  }

  /** A dart hit this real thing: it wobbles on its base for a moment. */
  wobble(p: Placed) {
    if (this.slots.has(p)) this.wobbles.set(p, WOBBLE_S);
  }

  /** Every frame: the actors stand and breathe, the stove flickers, hit things wobble. */
  update(dt: number, t: number) {
    for (const [p, left] of this.wobbles) {
      const slot = this.slots.get(p)!, k = Math.max(0, left - dt);
      const tilt = k > 0 ? Math.sin((WOBBLE_S - k) * 34) * 0.16 * (k / WOBBLE_S) : 0;
      _q.setFromAxisAngle(_up, p.yaw).multiply(_tilt.setFromAxisAngle(_x, tilt));
      const hop = k > 0 ? Math.abs(Math.sin((WOBBLE_S - k) * 17)) * 0.03 * (k / WOBBLE_S) : 0;
      slot.mesh.setMatrixAt(slot.i, _m.compose(_p.set(p.x, p.y + hop, p.z), _q, _s));
      slot.mesh.instanceMatrix.needsUpdate = true;
      if (k > 0) this.wobbles.set(p, k);
      else this.wobbles.delete(p);
    }
    for (const av of [this.kusin, this.vatte]) av.update(dt);
    this.vatte.char.body.scale.y = 1 + Math.sin(t * 2.2) * 0.025;
    this.kusin.char.body.scale.y = 1 + Math.sin(t * 1.7 + 1) * 0.015;
    const v = LOOKS[this.look];
    this.light.dim(2, v.stove * (0.85 + 0.15 * Math.sin(t * 9.3) * Math.sin(t * 3.1)));
  }

  /** Show or hide the staged actors (only the look slice's photos have them). */
  set staged(on: boolean) {
    this.kusin.root.visible = this.vatte.root.visible = on;
  }

  dispose() {
    for (const g of this.geos) g.dispose();
    this.kusin.dispose();
    this.vatte.dispose();
  }
}


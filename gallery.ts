/**
 * Every model this game makes, for `bunx vp gallery`: numbered pages you can read at a glance, and
 * checks for broken models, look-alikes and more (`bunx vp docs gallery`). It isn't part of the
 * game's package. Each builder calls the game's own model code.
 */
import { Group, Mesh } from 'three';
import { Avatar, meshVolume, useGameAssets } from '@voxelparty/sdk';
import type { Gallery } from '@voxelparty/sdk/test';
import { GUN_VOXEL, KUSIN_VOXEL, VATTE_VOXEL, dart, kusin, kusinLook, suctionGun, suctionGunFp, vatte, vatteLook } from './characters';
import { MODELS, buildModels, type ModelKey } from './models';
import { BLOCKS, TEXTURES } from './textures';

const FURNITURE: ModelKey[] = ['table', 'chair', 'sofa', 'stove', 'counter', 'fridge', 'vitrine'];
const THINGS: ModelKey[] = ['cup', 'biscuits', 'coffeePot', 'breadBasket', 'logBasket', 'geranium', 'crossword', 'cloth', 'ragRug'];
const WALL: ModelKey[] = ['upper', 'curtains', 'lamp', 'potholder', 'clock', 'sampler', 'note', 'bloomers', 'towel'];

export default (g: Gallery) => {
  const ids = useGameAssets(TEXTURES, BLOCKS);
  const models = buildModels(ids);
  const mat = g.engine.mats.actor;
  const mesh = (key: ModelKey) => () => {
    const m = models[key];
    return new Mesh(meshVolume(m.vol, { voxel: m.voxel, origin: m.origin }).opaque!, mat);
  };
  // Every key in MODELS is in one group below.
  const listed = new Set<ModelKey>([...FURNITURE, ...THINGS, ...WALL, 'lampGlow']);   // the glow is the lamp's 'tänd' variant
  for (const key of Object.keys(MODELS) as ModelKey[]) if (!listed.has(key)) throw new Error(`gallery.ts: ${key} isn't in a group`);

  g.group('Möbler i köket', { scale: 'shared', ghost: false });
  for (const key of FURNITURE) g.add(key, mesh(key));

  g.group('Saker en vätte kan bli', { scale: 'shared', ghost: false });
  for (const key of THINGS) g.add(key, mesh(key));

  g.group('På väggar och i taket', { ground: false });
  const signs: Partial<Record<ModelKey, number>> = { sampler: 3000, note: 2600 };   // letters cost voxels
  for (const key of WALL) {
    if (key === 'lamp') {
      g.add(key, mesh(key), { variants: { tänd: () => new Group().add(mesh('lamp')(), mesh('lampGlow')()) } });
      continue;
    }
    g.add(key, mesh(key), signs[key] ? { budget: signs[key] } : {});
  }

  g.group('Kusiner och vättar', { scale: 'shared', ghost: false });
  // Four kusiner that differ in shape as well as colour: bobble hat or cap, pigtails or not.
  for (const [i, n] of [0, 13, 6, 11].entries()) g.add(`Kusin ${i + 1}`, () => new Avatar(mat, kusin(ids, kusinLook(n)), { voxel: KUSIN_VOXEL }).root);
  for (const [i, n] of [0, 5, 10, 31].entries()) g.add(`Vätte ${i + 1}`, () => new Avatar(mat, vatte(ids, vatteLook(n)), { voxel: VATTE_VOXEL }).root);

  g.group('Sugkoppspistolen', { ground: false });
  g.add('I handen (andra ser)', () => new Mesh(meshVolume(suctionGun(ids), { voxel: GUN_VOXEL, origin: [1.5, 0, 6] }).opaque!, mat));
  g.add('I första person', () => new Mesh(meshVolume(suctionGunFp(ids), { voxel: 1 / 48, origin: [3.5, 6, 12] }).opaque!, mat));
  g.add('Sugkoppspil', () => new Mesh(meshVolume(dart(ids), { voxel: 1 / 32, origin: [1.5, 1.5, 4] }).opaque!, mat), { tiny: 10 });

  g.textures('Texturer', TEXTURES);
};

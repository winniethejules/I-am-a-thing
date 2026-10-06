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
const FURNITURE_PANTRY: ModelKey[] = ['shelf', 'broom'];
const THINGS: ModelKey[] = ['cup', 'biscuits', 'coffeePot', 'breadBasket', 'logBasket', 'geranium', 'crossword', 'cloth', 'ragRug', 'jarLingon', 'jarBlueberry', 'sack', 'tin'];
const WALL: ModelKey[] = ['upper', 'curtains', 'lamp', 'bulb', 'potholder', 'clock', 'sampler', 'note', 'bloomers', 'towel'];
/** The rest of the house, room by room: furniture first, then what a vätte can be. */
const ROOMS_GALLERY: [string, ModelKey[]][] = [
  ['Vardagsrummet', ['kakelugn', 'plasticSofa', 'coffeeTable', 'bookcase', 'sideTable', 'rya', 'armchair', 'rockingChair', 'tv', 'floorLamp', 'palm', 'footstool', 'radio', 'cat', 'bookStack', 'album', 'doily', 'dalahorse', 'dalahorseBlue']],
  ['Hallen och farstun', ['phoneTable', 'shoeRack', 'umbrellaStand', 'runner', 'doormat', 'stool', 'boots', 'umbrella', 'phone', 'hat', 'handbag']],
  ['Sovrummet', ['bed', 'wardrobe', 'nightstand', 'dresser', 'pillow', 'hatbox', 'slippers', 'alarmClock', 'teeth', 'tableLamp']],
  ['Badrummet', ['bathtub', 'washbasin', 'toilet', 'bathMat', 'laundryBasket', 'foldedTowel', 'soapDish', 'duck', 'rollDoll', 'chamberPot']],
  ['Syrummet', ['workTable', 'ironingBoard', 'yarnBasket', 'sewingMachine', 'chest', 'dressForm', 'fabricBolt', 'sewingTin', 'iron', 'yarnRed', 'yarnBlue', 'yarnYellow']],
];
/** Pairs (boots, slippers): two pieces on purpose. */
const PAIRS: ModelKey[] = ['boots', 'slippers'];
const WALL_ROOMS: ModelKey[] = ['cuckooClock', 'portrait', 'laceCurtains', 'chandelier', 'hatRack', 'mirror', 'frontDoor', 'globeLamp', 'painting', 'mirrorCabinet', 'towelRail'];
const GLOW_OF: Partial<Record<ModelKey, ModelKey>> = { lamp: 'lampGlow', bulb: 'bulbGlow', chandelier: 'chandelierGlow', globeLamp: 'globeGlow', floorLamp: 'floorLampGlow', tableLamp: 'tableLampGlow' };

export default (g: Gallery) => {
  const ids = useGameAssets(TEXTURES, BLOCKS);
  const models = buildModels(ids);
  const mat = g.engine.mats.actor;
  const mesh = (key: ModelKey) => () => {
    const m = models[key];
    return new Mesh(meshVolume(m.vol, { voxel: m.voxel, origin: m.origin }).opaque!, mat);
  };
  // Every key in MODELS is in one group below.
  const listed = new Set<ModelKey>([...FURNITURE, ...FURNITURE_PANTRY, ...THINGS, ...WALL, ...ROOMS_GALLERY.flatMap(([, keys]) => keys), ...WALL_ROOMS, ...(Object.values(GLOW_OF) as ModelKey[])]);   // the glows are the lamps' 'tänd' variants
  for (const key of Object.keys(MODELS) as ModelKey[]) if (!listed.has(key)) throw new Error(`gallery.ts: ${key} isn't in a group`);

  g.group('Möbler i köket', { scale: 'shared', ghost: false });
  for (const key of [...FURNITURE, ...FURNITURE_PANTRY]) g.add(key, mesh(key));

  g.group('Saker en vätte kan bli', { scale: 'shared', ghost: false });
  for (const key of THINGS) g.add(key, mesh(key));

  const withGlow = (key: ModelKey) => {
    const glow = GLOW_OF[key];
    return glow ? { variants: { tänd: () => new Group().add(mesh(key)(), mesh(glow)()) } } : {};
  };
  for (const [name, keys] of ROOMS_GALLERY) {
    g.group(name, { scale: 'shared', ghost: false });
    for (const key of keys) g.add(key, mesh(key), { ...withGlow(key), ...(PAIRS.includes(key) ? { pieces: 2 } : {}) });
  }

  g.group('På väggar och i taket', { ground: false });
  const signs: Partial<Record<ModelKey, number>> = { sampler: 3000, note: 2600 };   // letters cost voxels
  for (const key of [...WALL, ...WALL_ROOMS]) g.add(key, mesh(key), { ...withGlow(key), ...(signs[key] ? { budget: signs[key] } : {}) });

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

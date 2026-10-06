/**
 * Where everything stands in the rest of the house, three-free: the living room, the hall and
 * farstu, the bedroom, the bathroom and the sewing room (kitchen.ts has the kitchen and pantry).
 * The same lists draw the props (scene.ts), fill the collision grid (map.ts) and count mormors
 * lista (things.ts). Positions are world metres; yaw turns a model's front (+z) to face
 * (sin yaw, cos yaw): 0 south, π north, π/2 east, −π/2 west. A wall piece's yaw points it into the room.
 */
import { GROUND } from './garden';
import { SILL } from './house';
import { KITCHEN_PROPS, type Placed } from './kitchen';

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;
const p = (key: Placed['key'], x: number, y: number, z: number, yaw: number, more: Partial<Placed> = {}): Placed => ({ key, x, y, z, yaw, ...more });
/** Something a vätte can become. */
const t = (key: Placed['key'], x: number, y: number, z: number, yaw: number, more: Partial<Placed> = {}) => p(key, x, y, z, yaw, { thing: true, ...more });
/** Furniture you bump into. */
const f = (key: Placed['key'], x: number, y: number, z: number, yaw: number) => p(key, x, y, z, yaw, { solid: true });

/** Heights of the things other things stand on. */
const COFFEE_TABLE = 0.5, SIDE_TABLE = 0.6875, TV_TOP = 0.8125, NIGHTSTAND = 0.625, ARMCHAIR_SEAT = 0.44, WORK_TABLE = 0.8125, CHEST = 0.6875;

/** Vardagsrummet: the kakelugn in the corner, the best sofa, armchairs round the coffee table, the TV under the cuckoo clock. */
export const LIVING_PROPS: Placed[] = [
  f('kakelugn', -0.8, 0, 0.6, 0),
  f('plasticSofa', -6.55, 0, 2.5, E),
  f('coffeeTable', -5.3, 0, 2.5, E),
  f('bookcase', -5.9, 0, 4.84, N),
  f('sideTable', -0.85, 0, 4.6, 0),
  p('rya', -5.0, 0, 2.5, E),
  p('cuckooClock', -4.0, 1.22, 0, 0),
  p('portrait', -7, 1.3, 2.5, E),
  p('chandelier', -3.6, 2.5, 2.5, 0),
  p('chandelierGlow', -3.6, 2.5, 2.5, 0),
  p('laceCurtains', -5.4375, SILL, 0, 0),
  p('laceCurtains', -2.5625, SILL, 0, 0),
  p('floorLampGlow', -6.6, 0, 4.05, 0),
  t('floorLamp', -6.6, 0, 4.05, 0, { solid: true }),
  t('armchair', -4.15, 0, 1.55, W + 0.4, { solid: true }),
  t('armchair', -4.15, 0, 3.45, W - 0.4, { solid: true }),
  t('rockingChair', -1.7, 0, 2.2, W - 0.7, { solid: true }),
  t('tv', -4.0, 0, 0.4, 0, { solid: true }),
  t('footstool', -3.35, 0, 2.5, W),
  t('cat', -4.15, ARMCHAIR_SEAT, 1.55, W + 1.2),
  t('palm', -6.55, 0, 0.5, 0.3),
  t('radio', -0.85, SIDE_TABLE, 4.6, N + 0.6),
  t('doily', -5.3, COFFEE_TABLE, 2.75, 0),
  t('doily', -4.0, TV_TOP, 0.42, 0),
  t('doily', -0.85, SIDE_TABLE - 0.01, 4.6, 0.4),
  t('album', -5.25, COFFEE_TABLE, 2.2, E + 0.2),
  t('cup', -5.45, COFFEE_TABLE, 2.95, 0.6),
  t('cup', -5.1, COFFEE_TABLE, 2.85, 2.1),
  t('biscuits', -5.35, COFFEE_TABLE, 2.65, 0.3),
  t('bookStack', -4.95, 0, 4.55, 0.2),
  t('bookStack', -1.3, 0, 3.05, 1.1),
  t('bookStack', -6.4, 0, 4.6, 2.6),
  t('dalahorse', -5.45, SILL, 0.07, 0.2),
  t('dalahorse', -1.35, 0, 1.45, 1.9),
  t('dalahorse', -5.6, 2.0, 4.85, N),
  t('dalahorse', -5.55, COFFEE_TABLE, 2.35, E + 0.3),
  t('dalahorseBlue', -2.55, SILL, 0.07, -0.3),
  t('dalahorseBlue', -3.0, 0, 4.4, 2.4),
  t('geranium', -5.8, SILL, 0.07, 0.4),
  t('geranium', -5.1, SILL, 0.08, 1.7),
  t('geranium', -2.9, SILL, 0.07, 2.6),
  t('geranium', -2.2, SILL, 0.06, 0.9),
];

/** Hallen: a long runner, the hat shelf and its coats, the phone table, the mirror, three milk-glass lamps. */
export const HALL_PROPS: Placed[] = [
  ...[-5.5, -1.75, 5.25, 8.6].map((x) => p('runner', x, 0, 6.375, E)),
  p('hatRack', 0.5, 0.75, 5.25, 0),
  p('mirror', 5.0, 1.0, 5.25, 0),
  p('painting', -6.0, 1.3, 7.5, N),
  f('phoneTable', 1.25, 0, 7.28, N),
  ...[-4.5, 1.5, 7.5].flatMap((x) => [p('globeLamp', x, 2.5, 6.375, 0), p('globeGlow', x, 2.5, 6.375, 0)]),
  p('laceCurtains', -7, SILL, 6.3125, E),
  p('laceCurtains', 10, SILL, 6.3125, W),
  t('hat', 0.1, 1.875, 5.45, 0.3),
  t('hat', 0.9, 1.875, 5.45, 2.0),
  t('phone', 0.9, 0.75, 7.25, N),
  t('stool', -6.5, 0, 5.7, 0.4),
  t('hat', -6.5, 0.4375, 5.7, 1.1),
  t('boots', 8.9, 0, 5.62, 0.2),
  t('umbrella', 9.75, 0, 7.25, 0),
  t('handbag', -6.75, 0, 7.2, 0.5),
  t('bookStack', 9.6, 0, 5.6, 0.8),
  t('moraClock', -2.0, 0, 7.3, N, { solid: true }),
  f('hallBench', 6.5, 0, 5.47, 0),
  t('plantStand', 4.2, 0, 5.5, 0.3),
  t('plantStand', -6.65, 0, 7.15, 1.2),
  t('shoes', 5.6, 0, 7.2, 0.3),
  t('handbag', 6.9, 0.53, 5.5, 0.2),
];

/** Farstun: the front door (closed: the kusiner start here), the mat, shoes, boots, umbrellas, coats on hooks. */
export const ENTRY_PROPS: Placed[] = [
  p('frontDoor', 3.0, 0, 10, N),
  p('frontDoor', 3.0, 0, 10.25, 0),   // the same door seen from the front path
  p('doormat', 3.0, 0, 9.55, 0),
  f('shoeRack', 1.92, 0, 8.9, E),
  p('hatRack', 4.25, 0.75, 8.9, W),
  f('umbrellaStand', 3.95, 0, 9.7, 0),
  p('globeLamp', 3.0, 2.5, 8.9, 0),
  p('globeGlow', 3.0, 2.5, 8.9, 0),
  t('umbrella', 3.95, 0.05, 9.7, 0.4),
  t('boots', 2.05, 0, 9.72, 0.1),
  t('boots', 3.75, 0, 8.1, 1.4),
  t('stool', 2.35, 0, 8.05, 0.9),
  t('hat', 2.35, 0.4375, 8.05, 0.2),
  t('handbag', 2.0, 0.375, 8.45, E),
  t('shoes', 2.1, 0, 7.95, 0.2),
  t('shoes', 3.3, 0, 9.6, 2.9),
];

/** Badrummet: the clawfoot tub, the basin under its mirror cabinet, the toilet, towels, a duck in the bath. */
export const BATH_PROPS: Placed[] = [
  f('bathtub', -1.36, 0, 9.4, 0),
  f('washbasin', 1.2, 0, 8.4, W),
  f('toilet', 1.15, 0, 9.6, W),
  p('mirrorCabinet', 1.5, 1.0, 8.4, W),
  p('towelRail', -1.1, 0.9, 7.75, 0),
  p('bathMat', -0.5, 0, 9.4, E),
  p('globeLamp', 0, 2.5, 9.1, 0),
  p('globeGlow', 0, 2.5, 9.1, 0),
  t('foldedTowel', -0.7, 0, 10.25, 0.1),
  t('foldedTowel', 0.35, 0, 7.97, 0),
  t('stool', 0.3, 0, 10.2, 0.6),
  t('foldedTowel', 0.3, 0.4375, 10.2, 0.6),
  t('soapDish', 1.22, 0.84, 8.2, W),
  t('duck', -1.35, 0.44, 9.0, 0.7),
  t('duck', 0, 1.25, 10.42, N + 0.4),
  t('laundryBasket', -1.45, 0, 8.05, 0),
  t('rollDoll', 1.3, 0, 10.25, W),
  t('chamberPot', -0.05, 0, 10.25, 0.5),
  t('scale', 0.75, 0, 9.95, W + 0.3),
];

/** Sovrummet: the bed against the east wall between two nightstands, the dresser, the wardrobe with hat boxes on top. */
export const BEDROOM_PROPS: Placed[] = [
  f('bed', -3.0, 0, 10.0, W),
  f('nightstand', -2.25, 0, 8.95, W),
  f('nightstand', -2.25, 0, 11.05, W),
  f('wardrobe', -6.0, 0, 8.07, 0),
  p('ragRug', -4.5, 0, 10.0, 0),
  p('painting', -7, 1.45, 11.6, E),
  p('mirror', -2.6, 1.0, 7.75, 0),
  p('lamp', -4.5, 2.5, 10.1, 0),
  p('lampGlow', -4.5, 2.5, 10.1, 0),
  p('tableLampGlow', -2.25, NIGHTSTAND, 11.17, 0),
  p('laceCurtains', -5.6875, SILL, 12.5, N),
  p('laceCurtains', -3.3125, SILL, 12.5, N),
  p('laceCurtains', -7, SILL, 10.0625, E),
  t('tableLamp', -2.25, NIGHTSTAND, 11.17, 0),
  t('dresser', -6.75, 0, 11.6, E, { solid: true }),
  t('alarmClock', -2.25, NIGHTSTAND, 8.95, W + 0.3),
  t('teeth', -2.3, NIGHTSTAND, 10.9, 0),
  t('pillow', -2.5, 0.47, 9.68, W),
  t('pillow', -2.5, 0.47, 10.32, W),
  t('pillow', -6.55, 0, 9.4, 0.4),
  t('pillow', -4.3, 0, 12.15, 2.9),
  t('hatbox', -6.3, 2.25, 8.07, 0.3),
  t('hatbox', -5.7, 2.25, 8.07, 1.2),
  t('hatbox', -4.95, 0, 8.0, 0.5),
  t('slippers', -4.25, 0, 9.2, W),
  t('slippers', -4.3, 0, 10.85, W + 0.4),
  t('stool', -6.55, 0, 10.4, 0.8),
  t('geranium', -5.4, SILL, 12.43, 0.6),
  t('geranium', -3.0, SILL, 12.43, 2.2),
];

/** Syrummet: the sewing machine under a window, the work table, chests, the dress form, bolts of fabric, yarn everywhere. */
export const SEWING_PROPS: Placed[] = [
  f('workTable', 7.2, 0, 10.0, 0),
  f('ironingBoard', 9.5, 0, 8.6, E),
  p('painting', 5.5, 1.4, 7.75, 0),
  p('lamp', 7.2, 2.5, 10.1, 0),
  p('lampGlow', 7.2, 2.5, 10.1, 0),
  p('laceCurtains', 5.9375, SILL, 12.5, N),
  p('laceCurtains', 8.5625, SILL, 12.5, N),
  p('laceCurtains', 10, SILL, 10.0625, W),
  p('yarnBasket', 6.95, 0, 12.1, 0.2),
  t('sewingMachine', 5.9, 0, 12.25, N, { solid: true }),
  t('chest', 4.8, 0, 9.0, E, { solid: true }),
  t('chest', 9.45, 0, 12.2, N, { solid: true }),
  t('dressForm', 5.2, 0, 11.0, E + 0.4),
  t('iron', 9.5, 0.94, 8.3, E),
  t('iron', 8.6, 0, 12.15, 2.4),
  t('fabricBolt', 6.0, 0, 8.2, 0),
  t('fabricBolt', 6.0, 0.3125, 8.22, 0.1),
  t('fabricBolt', 8.6, 0, 11.2, 0.5),
  t('fabricBolt', 7.0, WORK_TABLE, 10.25, 0.2),
  t('yarnRed', 7.3, 0, 11.55, 0.3),
  t('yarnRed', 7.75, WORK_TABLE, 9.75, 2.0),
  t('yarnRed', 9.6, 0, 10.9, 1.2),
  t('yarnBlue', 8.0, 0, 9.05, 0.8),
  t('yarnBlue', 6.4, WORK_TABLE, 9.7, 0.1),
  t('yarnBlue', 5.6, 0, 12.15, 2.6),
  t('yarnYellow', 5.3, 0, 9.95, 1.7),
  t('yarnYellow', 4.85, CHEST, 9.25, 0.4),
  t('yarnYellow', 8.15, 0, 12.2, 0.9),
  t('sewingTin', 9.4, CHEST, 12.2, 0.3),
  t('sewingTin', 5.6, 0, 8.05, 1.0),
  t('geranium', 9.88, SILL, 9.9, 0.5),
];

const G = GROUND;
/** Trädgården: the patio north of the living room, gnomes, pots along the walls, the woodpile, kubb on the lawn, the currant bushes. */
export const GARDEN_PROPS: Placed[] = [
  f('gardenTable', -4.0, G, -2.5, 0),
  f('woodpile', -7.55, G, 2.5, W),
  f('birdBath', 2.0, G, -6.0, 0),
  ...[[-11, -4], [-9.5, -5.6], [14, -2], [14.6, 0.6], [-11.5, 13], [15, 12]].map(([x, z]) => f('currantBush', x, G, z, x)),
  p('rake', -7.45, G, 4.2, W),
  t('gardenChair', -4.9, G, -2.3, E, { solid: true }),
  t('gardenChair', -3.1, G, -2.7, W, { solid: true }),
  t('gardenChair', -4.0, G, -1.55, N, { solid: true }),
  t('wheelbarrow', 9.5, G, -3.0, 0.6, { solid: true }),
  t('rainBarrel', 8.65, G, 3.0, 0.2, { solid: true }),
  ...[[-1.0, -1.0, 2.6], [1.8, -2.2, 0.4], [6.8, -1.5, -0.5], [-8.6, -3.0, 1.2], [12, -6, 2.0], [4.6, 14.5, 3.6], [-6.0, 13.6, 2.8]].map(([x, z, yaw]) => t('gnome', x, G, z, yaw)),
  t('wateringCan', 0.3, G, -0.85, 0.3),
  t('wateringCan', 9.2, G, 4.4, 1.9),
  t('wateringCan', -3.4, G, 13.4, 0.8),
  t('flowerPotRed', -6.5, G, -0.6, 0.2),
  t('flowerPotYellow', -2.6, G, -0.55, 1.1),
  t('flowerPotRed', 5.5, G, -0.6, 2.0),
  t('flowerPotYellow', 6.6, G, 0.5, 0.7),
  t('flowerPotYellow', 2.1, G, 11.0, 0.4),
  t('flowerPotRed', 3.9, G, 11.0, 1.5),
  t('flowerPotRed', -7.7, G, 7.4, 0.9),
  ...[[-8.4, 1.2], [-8.6, 3.9], [-9.0, 2.6], [-8.2, 0.4], [-8.8, 4.6], [-9.3, 1.8], [-8.0, 3.3], [-9.6, 3.2]].map(([x, z], i) => t('log', x, G, z, i * 0.9)),
  ...[9.5, 10.25, 11, 11.75, 12.5].flatMap((x) => [t('kubb', x, G, -7.5, 0), t('kubb', x, G, -3.2, 0.1)]),
  t('kubbKing', 11, G, -5.35, 0.3),
];

/** Everything in the house and garden, the kitchen and pantry first. */
export const ALL_PROPS: Placed[] = [...KITCHEN_PROPS, ...LIVING_PROPS, ...HALL_PROPS, ...ENTRY_PROPS, ...BATH_PROPS, ...BEDROOM_PROPS, ...SEWING_PROPS, ...GARDEN_PROPS];

/**
 * Spawn spots. `hall` ones are where the kusiner wait while the vättar hide: farstun, by the front
 * door (they've just come in from the bus). The rest spread the vättar through the house.
 */
export const SPAWNS: { x: number; y?: number; z: number; hall: boolean }[] = [
  { x: -4.0, y: GROUND, z: -4.5, hall: false }, { x: 7.0, y: GROUND, z: -5.0, hall: false }, { x: -10.5, y: GROUND, z: 2.0, hall: false },
  { x: 3, z: 3.4, hall: false }, { x: 1.9, z: 4.1, hall: false }, { x: 3.55, z: 3.6, hall: false }, { x: 4.6, z: 2.9, hall: false },
  { x: -2.6, z: 3.4, hall: false }, { x: -3.2, z: 1.3, hall: false }, { x: -1.0, z: 6.4, hall: false }, { x: 5.5, z: 6.4, hall: false },
  { x: -4.5, z: 9.0, hall: false }, { x: 7.0, z: 8.6, hall: false }, { x: -5.0, z: 6.4, hall: false }, { x: 8.5, z: 10.3, hall: false },
  { x: 2.6, z: 8.7, hall: true }, { x: 3.4, z: 8.7, hall: true }, { x: 3.0, z: 9.25, hall: true }, { x: 2.6, z: 9.25, hall: true },
];

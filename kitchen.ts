/**
 * Where everything in the kitchen stands, three-free: one list the drawing (scene.ts), the collision
 * (map.ts) and later the inventory list all read. Positions are world metres (the floor at y 0);
 * yaw turns a model's front (+z) to face (sin yaw, cos yaw): 0 faces the door (south, +z), π the
 * windows (north), π/2 east (+x), −π/2 west.
 *
 * Kitchen layout (north up, the garden beyond the windows):
 *
 *        window          window
 *   ┌──────[  ]──sofa──[  ]──────┐
 *   │ tiles     ┌──table──┐  upper cabinets
 *   │ STOVE   chair  cups  chair  COUNTER (sink)
 *   │           └─────────┘     │
 *   │  basket  chair  chair    rug  FRIDGE + sampler
 *   │ VITRINE      door      clock│
 *   └────────────[    ]─────────┘
 *                  hall
 */
import { SILL } from './house';
import type { ModelKey } from './models';

export interface Placed {
  key: ModelKey;
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** Bumped into: its footprint goes in the collision grid. */
  solid?: boolean;
  /** Something a vätte can become (Phase 1). */
  thing?: boolean;
}

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;
/** The table top, and the cloth on it. */
export const TABLE_Y = 0.75, CLOTH_Y = TABLE_Y + 1 / 16;

export const KITCHEN_PROPS: Placed[] = [
  // Furniture.
  { key: 'sofa', x: 3, y: 0, z: 0.55, yaw: 0, solid: true },
  { key: 'table', x: 3, y: 0, z: 1.55, yaw: 0, solid: true },
  { key: 'cloth', x: 3, y: TABLE_Y, z: 1.55, yaw: 0 },
  { key: 'chair', x: 2.45, y: 0, z: 2.35, yaw: N, solid: true, thing: true },
  { key: 'chair', x: 3.55, y: 0, z: 2.4, yaw: N + 0.12, solid: true, thing: true },
  { key: 'chair', x: 1.62, y: 0, z: 1.55, yaw: E, solid: true, thing: true },
  { key: 'chair', x: 4.38, y: 0, z: 1.5, yaw: W, solid: true, thing: true },
  { key: 'chair', x: 4.4, y: 0, z: 4.55, yaw: N + 0.6, solid: true, thing: true },
  { key: 'chair', x: 1.5, y: 0, z: 2.95, yaw: E + 0.35, solid: true, thing: true },
  { key: 'stove', x: 0.52, y: 0, z: 2.0, yaw: E, solid: true },
  { key: 'counter', x: 5.53, y: 0, z: 1.6, yaw: W, solid: true },
  { key: 'upper', x: 6, y: 1.55, z: 1.6, yaw: W },
  { key: 'fridge', x: 5.5, y: 0, z: 3.4, yaw: W, solid: true },
  { key: 'vitrine', x: 1.1, y: 0, z: 4.65, yaw: N, solid: true },
  { key: 'lamp', x: 3, y: 2.5, z: 1.55, yaw: 0 },
  { key: 'lampGlow', x: 3, y: 2.5, z: 1.55, yaw: 0 },
  { key: 'curtains', x: 1.8125, y: SILL, z: 0, yaw: 0 },
  { key: 'curtains', x: 4.1875, y: SILL, z: 0, yaw: 0 },
  { key: 'ragRug', x: 4.75, y: 0, z: 1.65, yaw: 0 },
  // The story: what you can read and what's been left lying.
  { key: 'sampler', x: 6, y: 1.66, z: 3.2, yaw: W },
  { key: 'note', x: 5.18, y: 1.06, z: 3.4, yaw: W },
  { key: 'clock', x: 4.85, y: 1.6, z: 5, yaw: N },
  { key: 'crossword', x: 2.75, y: CLOTH_Y, z: 1.62, yaw: 0.35 },
  // Things a vätte can become.
  { key: 'cup', x: 2.48, y: CLOTH_Y, z: 1.32, yaw: 0.4, thing: true },
  { key: 'cup', x: 3.52, y: CLOTH_Y, z: 1.3, yaw: -0.3, thing: true },
  { key: 'cup', x: 3.5, y: CLOTH_Y, z: 1.8, yaw: 2.6, thing: true },
  { key: 'cup', x: 2.45, y: CLOTH_Y, z: 1.82, yaw: 3.4, thing: true },
  { key: 'biscuits', x: 3.15, y: CLOTH_Y, z: 1.55, yaw: 0.2, thing: true },
  { key: 'coffeePot', x: 0.46, y: 0.875, z: 2.25, yaw: E, thing: true },
  { key: 'breadBasket', x: 5.5, y: 1.5, z: 3.4, yaw: W + 0.2, thing: true },
  { key: 'coffeeGrinder', x: 5.55, y: 0.875, z: 1.47, yaw: W, thing: true },
  { key: 'milkCan', x: 4.95, y: 0, z: 4.35, yaw: 0.4, thing: true },
  { key: 'cup', x: 3.0, y: 0.5, z: 0.62, yaw: 1.1, thing: true },
  { key: 'cup', x: 1.45, y: 0.5, z: 0.62, yaw: 2.5, thing: true },
  { key: 'biscuits', x: 4.4, y: 0.5, z: 0.6, yaw: 0.6, thing: true },
  { key: 'logBasket', x: 0.4, y: 0, z: 2.85, yaw: E, thing: true },
  { key: 'potholder', x: 0.9, y: 0.72, z: 1.72, yaw: E, thing: true },
  { key: 'potholder', x: 0.9, y: 0.72, z: 2.1, yaw: E, thing: true },
  { key: 'geranium', x: 1.55, y: SILL, z: 0.06, yaw: 0, thing: true },
  { key: 'geranium', x: 2.07, y: SILL, z: 0.08, yaw: 1.2, thing: true },
  { key: 'geranium', x: 3.93, y: SILL, z: 0.07, yaw: 2.1, thing: true },
  { key: 'geranium', x: 4.45, y: SILL, z: 0.06, yaw: 0.5, thing: true },
];

/**
 * Skafferiet: shelves on the east and north walls, jars of lingon and blueberry jam, flour sacks,
 * gingerbread tins, a bare bulb, a broom in the corner. (The plan's inventory: 10 jars, 3 sacks, 2 tins.)
 */
const SHELF_Y = [0.125, 0.5625, 1.0, 1.4375];
export const PANTRY_PROPS: Placed[] = [
  { key: 'shelf', x: 7.8125, y: 0, z: 4.25, yaw: W, solid: true },
  { key: 'shelf', x: 6.95, y: 0, z: 3.6875, yaw: 0, solid: true },
  ...[3.78, 4.05, 4.32, 4.6].map((z, i): Placed => ({ key: 'jarLingon', x: 7.8, y: SHELF_Y[1], z, yaw: i * 0.7, thing: true })),
  ...[3.85, 4.2, 4.55].map((z, i): Placed => ({ key: 'jarBlueberry', x: 7.8, y: SHELF_Y[2], z, yaw: i * 1.1, thing: true })),
  { key: 'jarLingon', x: 7.8, y: SHELF_Y[3], z: 4.0, yaw: 0.3, thing: true },
  { key: 'jarLingon', x: 7.35, y: 0, z: 4.72, yaw: 0.9, thing: true },
  { key: 'jarBlueberry', x: 7.18, y: 0, z: 4.55, yaw: 2.2, thing: true },
  { key: 'sack', x: 6.62, y: SHELF_Y[0], z: 3.68, yaw: 0, thing: true },
  { key: 'sack', x: 7.05, y: SHELF_Y[0], z: 3.68, yaw: 0, thing: true },
  { key: 'sack', x: 6.62, y: 0, z: 4.68, yaw: 0.5, thing: true },
  { key: 'tin', x: 6.65, y: SHELF_Y[2], z: 3.66, yaw: 0, thing: true },
  { key: 'tin', x: 7.25, y: SHELF_Y[2], z: 3.66, yaw: 0.6, thing: true },
  ...[3.72, 3.84, 3.96, 4.5, 4.62].map((z, i): Placed => ({ key: 'juiceBottle', x: 7.82, y: SHELF_Y[0], z, yaw: i, thing: true })),
  { key: 'juiceBottle', x: 7.75, y: 0, z: 4.88, yaw: 0.5, thing: true },
  { key: 'potatoSack', x: 7.6, y: 0, z: 3.85, yaw: 0.3, thing: true },
  { key: 'potatoSack', x: 6.95, y: 0, z: 4.75, yaw: 1.9, thing: true },
  { key: 'milkCan', x: 6.55, y: 0, z: 4.25, yaw: 1.0, thing: true },
  { key: 'bulb', x: 7.0, y: 2.5, z: 4.35, yaw: 0 },
  { key: 'bulbGlow', x: 7.0, y: 2.5, z: 4.35, yaw: 0 },
  { key: 'broom', x: 6.42, y: 0, z: 4.86, yaw: 0.4 },
];
KITCHEN_PROPS.push(...PANTRY_PROPS);

/** The look slice's two actors, posed (Phase 0 only: in play they are the players). */
export const STAGED = {
  /** A kusin who has just come in, gun up, turning to the table. */
  kusin: { x: 4.3, z: 3.2, yaw: N + 0.67 },
  /** A vätte sneaking past the chair by the stove. */
  vatte: { x: 1.55, z: 3.05, yaw: 0.9 },
};

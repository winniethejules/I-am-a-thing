/**
 * Jordkällaren, three-free: a root cellar dug into a grassy mound in the garden's north-west corner.
 * A stone front with a doorway, a trench of steps down from the lawn, a stone vault below with a
 * dirt floor and beams. Like house.ts, its shell is boxes in metres that both the drawn cellar
 * (scene.ts) and the collision grid (map.ts) are built from. Dark: one lantern.
 */
import type { HouseBox, Mat } from './house';
import { GROUND } from './garden';

/** The vault's inside. */
export const CELLAR = { x0: -11, x1: -8.5, z0: -8.75, z1: -5.75, y0: -2.25, h: 1.75 };
/** The trench with the steps: from the lawn at its south end down to the doorway. */
export const TRENCH = { x0: -10, x1: -9, z0: -5.5, z1: -3.5 };
/** The volume the cellar is drawn in: its low corner and size in 1/8 m voxels. */
export const CELLAR_AT: [number, number, number] = [-11.5, -2.5, -9.25];
export const CELLAR_SIZE: [number, number, number] = [28, 30, 50];
export const CV = 1 / 8;

const W = 0.25;

function shell(): HouseBox[] {
  const c = CELLAR, t = TRENCH, out: HouseBox[] = [];
  const add = (b: HouseBox['b'], m: Mat, solid?: boolean) => out.push({ b, m, solid });
  const top = c.y0 + c.h;   // the vault's ceiling: the lawn's level
  // The vault: stone all round, a dirt floor, a beamed ceiling.
  add([c.x0 - W, c.y0 - W, c.z0 - W, c.x1 + W, top + W, c.z1 + W], 'STONE');
  add([c.x0, c.y0, c.z0, c.x1, top, c.z1], 'AIR');
  add([c.x0, c.y0 - 0.125, c.z0, c.x1, c.y0, c.z1], 'DIRT');
  for (let z = c.z0 + 0.375; z < c.z1; z += 0.75) add([c.x0, top - 0.125, z, c.x1, top, z + 0.125], 'WOOD_DEEP', false);
  // The trench: stone walls standing a little proud of the lawn, steps down, the doorway into the vault.
  add([t.x0 - W, c.y0 - W, t.z0, t.x0, GROUND + 0.25, t.z1], 'STONE');
  add([t.x1, c.y0 - W, t.z0, t.x1 + W, GROUND + 0.25, t.z1], 'STONE');
  add([t.x0, c.y0 - W, t.z0, t.x1, GROUND, t.z1], 'STONE');
  add([t.x0, c.y0, t.z0, t.x1, GROUND, t.z1], 'AIR');
  const steps = Math.round((GROUND - c.y0) / 0.25);   // seven steps of a quarter metre
  for (let i = 1; i < steps; i++) {
    const z0 = t.z0 + (i / steps) * (t.z1 - t.z0);
    add([t.x0, c.y0, z0, t.x1, c.y0 + i * 0.25, t.z1], 'STONE');
  }
  add([t.x0, c.y0, c.z1, t.x1, top, t.z0], 'AIR');   // the doorway, the vault's full height
  // The front above the lawn: a stone face round the doorway's top, a beam over it, the mound behind.
  add([t.x0 - 0.5, GROUND, c.z1, t.x1 + 0.5, GROUND + 0.75, t.z0], 'STONE');
  add([t.x0 - 0.125, GROUND, t.z0 - 0.125, t.x1 + 0.125, GROUND + 0.25, t.z0 + 0.125], 'WOOD_DEEP');
  return out;
}

export const CELLAR_BOXES: readonly HouseBox[] = shell();

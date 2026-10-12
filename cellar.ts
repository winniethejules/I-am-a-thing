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
export const TRENCH = { x0: -10.25, x1: -8.75, z0: -5.5, z1: -3.5 };   // on the grid's quarter-metre lines
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
  // Three steps down, half a metre deep each, a half metre drop per step: the kusin's body is 0.6 m
  // long, so a shallower stair keeps catching its back edge. The last drop is a quarter metre to the floor.
  const tops = [-1.0, -1.5, -2.0];
  for (let k = 0; k < 3; k++) {
    const zs = t.z1 - (k + 1) * 0.5, ze = t.z1 - k * 0.5;
    add([t.x0, c.y0, zs, t.x1, tops[k], ze], 'STONE');
  }
  add([t.x0, c.y0, c.z1, t.x1, top, t.z0], 'AIR');   // the doorway, the vault's full height
  // The front above the lawn: a stone face round the doorway's top, a beam over it, the mound behind.
  add([t.x0 - 0.5, GROUND, c.z1, t.x1 + 0.5, GROUND + 0.75, t.z0], 'STONE');
  add([t.x0 - 0.125, GROUND, t.z0 - 0.125, t.x1 + 0.125, GROUND + 0.25, t.z0 + 0.125], 'WOOD_DEEP');
  return out;
}

export const CELLAR_BOXES: readonly HouseBox[] = shell();

/**
 * The grassy mound over the vault, in quarter-metre columns that rise in quarter-metre steps (so you
 * can climb it): drawn as lawn (scene.ts) and bumped into (map.ts). Open over the trench.
 */
function mound(): [number, number, number, number, number, number][] {
  const c = CELLAR, t = TRENCH, out: [number, number, number, number, number, number][] = [];
  for (let x = c.x0 - 0.5; x < c.x1 + 0.5; x += 0.25) for (let z = c.z0 - 0.5; z < c.z1; z += 0.25) {
    const dx = (x + 0.125 - (c.x0 + c.x1) / 2) / 1.9, dz = (z + 0.125 - (c.z0 + c.z1) / 2) / 2.1, d = dx * dx + dz * dz;
    const h = Math.round((1 - d) * 5) * 0.25;
    if (d >= 1 || h <= 0) continue;
    if (x >= t.x0 - 0.25 && x < t.x1 + 0.25 && z >= c.z1 - 0.25) continue;   // the trench's mouth
    out.push([x, GROUND, z, x + 0.25, GROUND + h, z + 0.25]);
  }
  return out;
}
export const MOUND = mound();

/**
 * Mormors hus as data, three-free: the shell (floors, walls, ceilings, openings, trim) as boxes in
 * metres, applied in order. The same list builds the collision grid (map.ts) and the drawn house
 * (scene.ts), so what you see is what you bump into.
 *
 * Phase 0 is the kitchen and a stub of the hall. World: 1 unit = 1 m, kitchen floor at y 0, the
 * kitchen's inside from (0, 0) to (6, 5) in x and z, north (−z) is the garden with the barn.
 */
import type { BLOCKS } from './textures';

export type Mat = keyof typeof BLOCKS | 'AIR';

export interface HouseBox {
  /** [x0, y0, z0, x1, y1, z1] in metres; the high corner is not included. */
  b: [number, number, number, number, number, number];
  m: Mat;
  /** Bumped into (walls, floors). Trim, sills and lists are only drawn. Default true unless AIR. */
  solid?: boolean;
  /** An opening you see through but can't walk through (a window): carved when drawn, glass in the grid. */
  glass?: boolean;
}

/** The house volume's voxel: 12.5 cm. */
export const HV = 1 / 8;
/** The house volume's low corner in the world, and its size in voxels. */
export const HOUSE_AT: [number, number, number] = [-0.5, -0.5, -0.5];
export const HOUSE_SIZE: [number, number, number] = [72, 28, 66];

/** The kitchen's inside. */
export const KITCHEN = { x0: 0, x1: 6, z0: 0, z1: 5, h: 2.5 };
/** Window openings in the north wall: [x0, x1], the sill at 0.875 m, the top at 2.125 m. */
export const WINDOWS: [number, number][] = [[1.25, 2.375], [3.625, 4.75]];
export const SILL = 0.875, WIN_TOP = 2.125;
/** The door from the hall, in the kitchen's south wall. */
export const DOOR = { x0: 2.5, x1: 3.5, h: 2.125 };
/** Skafferiet: the pantry east of the kitchen, its door in the kitchen's east wall (z from z0 to z1). */
export const PANTRY = { x0: 6.25, x1: 8, z0: 3.5, z1: 5, door: { z0: 3.85, z1: 4.85 } };

const T = HV; // one voxel: a lip, a list

function shell(): HouseBox[] {
  const k = KITCHEN, out: HouseBox[] = [];
  const add = (b: HouseBox['b'], m: Mat, solid?: boolean, glass?: boolean) => out.push({ b, m, solid, glass });

  // Plinth and floors: the kitchen on linoleum, the hall on pine.
  add([-0.25, -0.5, -0.25, 6.25, -0.125, 5.25], 'GREY');
  add([-0.25, -0.125, -0.25, 6.25, 0, 5.25], 'LINO');
  add([1.5, -0.5, 5.25, 4.5, -0.125, 7.75], 'GREY');
  add([1.5, -0.125, 5.25, 4.5, 0, 7.75], 'PINE');

  // The kitchen's walls: falu red outside, mint paper inside (the inner voxel).
  add([-0.25, 0, -0.25, 6.25, k.h, 0], 'FALU');          // north
  add([-0.25, 0, 5, 6.25, k.h, 5.25], 'ROSE');           // south: the hall's side is rose
  add([-0.25, 0, -0.25, 0, k.h, 5.25], 'FALU');          // west
  add([6, 0, -0.25, 6.25, k.h, 5.25], 'FALU');           // east
  add([0, 0, -T, 6, k.h, 0], 'MINT', false);
  add([0, 0, 5, 6, k.h, 5 + T], 'MINT', false);
  add([-T, 0, 0, 0, k.h, 5], 'MINT', false);
  add([6, 0, 0, 6 + T, k.h, 5], 'MINT', false);
  // Ceilings.
  add([-0.25, k.h, -0.25, 6.25, k.h + 0.25, 5.25], 'CEILING');
  add([1.5, k.h, 5.25, 4.5, k.h + 0.25, 7.75], 'CEILING');

  // The hall stub: rose walls, a closed end.
  add([1.5, 0, 5.25, 1.75, k.h, 7.75], 'ROSE');
  add([4.25, 0, 5.25, 4.5, k.h, 7.75], 'ROSE');
  add([1.5, 0, 7.5, 4.5, k.h, 7.75], 'ROSE');

  // Skafferiet: pine floor, cream-painted walls, its own ceiling. A mouse hole by the floor.
  const p = PANTRY;
  add([p.x0, -0.5, p.z0 - 0.25, p.x1 + 0.25, -0.125, p.z1 + 0.25], 'GREY');
  add([p.x0, -0.125, p.z0 - 0.25, p.x1 + 0.25, 0, p.z1 + 0.25], 'PINE');
  add([p.x0, 0, p.z0 - 0.25, p.x1 + 0.25, k.h, p.z0], 'FALU');
  add([p.x1, 0, p.z0 - 0.25, p.x1 + 0.25, k.h, p.z1 + 0.25], 'FALU');
  add([p.x0, 0, p.z1, p.x1 + 0.25, k.h, p.z1 + 0.25], 'FALU');
  add([p.x0, 0, p.z0 - T, p.x1, k.h, p.z0], 'CREAM', false);
  add([p.x1, 0, p.z0, p.x1 + T, k.h, p.z1], 'CREAM', false);
  add([p.x0, 0, p.z1, p.x1, k.h, p.z1 + T], 'CREAM', false);
  add([6.25 - T, 0, p.z0, 6.25, k.h, p.z1], 'CREAM', false);
  add([p.x0, k.h, p.z0 - 0.25, p.x1 + 0.25, k.h + 0.25, p.z1 + 0.25], 'CEILING');
  add([7.4, 0, p.z1, 7.4 + T, T, p.z1 + T], 'INK', false);   // the mouse hole

  // (The inner skins are drawn only: the walls behind them are what you bump into.)
  // Tiles behind the stove (west wall) and over the counter (east wall).
  add([-T, 0, 1.25, 0, 1.5, 2.75], 'TILE', false);
  add([6, 0.875, 0.5, 6 + T, 1.5, 2.75], 'TILE', false);

  // Openings: two windows north, the door south.
  for (const [x0, x1] of WINDOWS) add([x0, SILL, -0.25, x1, WIN_TOP, 0], 'AIR', false, true);
  add([DOOR.x0, 0, 5, DOOR.x1, DOOR.h, 5.25], 'AIR');
  add([6, 0, PANTRY.door.z0, 6.25, DOOR.h, PANTRY.door.z1], 'AIR');

  // Window frames and bars (in the outer half of the wall, so the inside has a recess), and sills.
  for (const [x0, x1] of WINDOWS) {
    const mid = (x0 + x1) / 2 - T / 2, bar = SILL + 0.625;
    add([x0, SILL, -0.25, x1, SILL + T, -T], 'WHITE', false);
    add([x0, WIN_TOP - T, -0.25, x1, WIN_TOP, -T], 'WHITE', false);
    add([x0, SILL, -0.25, x0 + T, WIN_TOP, -T], 'WHITE', false);
    add([x1 - T, SILL, -0.25, x1, WIN_TOP, -T], 'WHITE', false);
    add([mid, SILL, -0.25, mid + T, WIN_TOP, -T], 'WHITE', false);
    add([x0, bar, -0.25, x1, bar + T, -T], 'WHITE', false);
    add([x0 - T, SILL - T, -T, x1 + T, SILL, 0.25], 'WHITE', false);   // the sill, into the room
  }

  // Skirting and a cornice round the kitchen, a frame round the door.
  add([0, 0, 0, 6, T, T], 'WHITE', false);
  add([0, 0, 5 - T, DOOR.x0 - T, T, 5], 'WHITE', false);
  add([DOOR.x1 + T, 0, 5 - T, 6, T, 5], 'WHITE', false);
  add([0, 0, T, T, T, 5 - T], 'WHITE', false);
  add([6 - T, 0, T, 6, T, PANTRY.door.z0 - T], 'WHITE', false);
  add([6 - T, 0, PANTRY.door.z1 + T, 6, T, 5 - T], 'WHITE', false);
  // The pantry door's frame on the kitchen side, and the pantry's own skirting.
  add([6 - T, 0, PANTRY.door.z0 - T, 6, DOOR.h + T, PANTRY.door.z0], 'WHITE', false);
  add([6 - T, 0, PANTRY.door.z1, 6, DOOR.h + T, PANTRY.door.z1 + T], 'WHITE', false);
  add([6 - T, DOOR.h, PANTRY.door.z0, 6, DOOR.h + T, PANTRY.door.z1], 'WHITE', false);
  add([PANTRY.x0, 0, PANTRY.z0, PANTRY.x1, T, PANTRY.z0 + T], 'WHITE', false);
  add([PANTRY.x1 - T, 0, PANTRY.z0 + T, PANTRY.x1, T, PANTRY.z1 - T], 'WHITE', false);
  add([PANTRY.x0, 0, PANTRY.z1 - T, 7.4, T, PANTRY.z1], 'WHITE', false);
  add([7.4 + T, 0, PANTRY.z1 - T, PANTRY.x1, T, PANTRY.z1], 'WHITE', false);
  add([0, k.h - T, 0, 6, k.h, T], 'WHITE', false);
  add([0, k.h - T, 5 - T, 6, k.h, 5], 'WHITE', false);
  add([0, k.h - T, T, T, k.h, 5 - T], 'WHITE', false);
  add([6 - T, k.h - T, T, 6, k.h, 5 - T], 'WHITE', false);
  add([DOOR.x0 - T, 0, 5 - T, DOOR.x0, DOOR.h + T, 5], 'WHITE', false);
  add([DOOR.x1, 0, 5 - T, DOOR.x1 + T, DOOR.h + T, 5], 'WHITE', false);
  add([DOOR.x0, DOOR.h, 5 - T, DOOR.x1, DOOR.h + T, 5], 'WHITE', false);
  return out;
}

export const HOUSE: readonly HouseBox[] = shell();

/** Voxel index range [i0, i1) of a box along one axis. */
export const vox = (a0: number, a1: number, axis: 0 | 1 | 2) =>
  [Math.round((a0 - HOUSE_AT[axis]) / HV), Math.round((a1 - HOUSE_AT[axis]) / HV)] as const;

/**
 * Fill a volume-like grid with the house: `set(x, y, z, mat)` per voxel, boxes in order (AIR
 * carves). Used by the drawn house; map.ts fills its own coarser grid from the solid boxes.
 */
export function stampHouse(set: (x: number, y: number, z: number, m: Mat) => void) {
  for (const { b, m } of HOUSE) {
    const [x0, x1] = vox(b[0], b[3], 0), [y0, y1] = vox(b[1], b[4], 1), [z0, z1] = vox(b[2], b[5], 2);
    for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) set(x, y, z, m);
  }
}

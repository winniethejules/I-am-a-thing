/**
 * Mormors hus as data, three-free: the shell (floors, walls, ceilings, openings, trim) as boxes in
 * metres, applied in order. The same list builds the collision grid (map.ts) and the drawn house
 * (scene.ts), so what you see is what you bump into.
 *
 * World: 1 unit = 1 m, the floors at y 0, north (−z) is the garden with the barn. The kitchen's
 * inside runs from (0, 0) to (6, 5); every room is a rectangle in ROOMS, walls a quarter metre thick
 * between them, falu red outside. Plan (north up):
 *
 *        garden                    garden
 *   ┌──────────────────┬───────────────┐
 *   │  VARDAGSRUMMET   │    KÖKET      ├─────┐
 *   │                  ↔               │SKAFF│
 *   ├────────↕─────────┴──────↕────────┴─────┴─────┐
 *   │                    HALLEN                    │
 *   ├─────────↕──────┬──↕───┬──↕↕──┬───────↕───────┤
 *   │   SOVRUMMET    │BADRUM│FARSTU│   SYRUMMET    │
 *   │                │      └─dörr─┘               │
 *   └────────────────┘             └───────────────┘
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
export const HOUSE_AT: [number, number, number] = [-7.5, -0.5, -0.5];
export const HOUSE_SIZE: [number, number, number] = [144, 28, 108];
/** Ceiling height everywhere. */
export const CEIL = 2.5;

export interface Room {
  name: string;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  floor: Mat;
  paper: Mat;
}

/** Every room's inside. The names are what mormors lista and the meter say ("i köket"). */
export const ROOMS: readonly Room[] = [
  { name: 'Köket', x0: 0, x1: 6, z0: 0, z1: 5, floor: 'LINO', paper: 'MINT' },
  { name: 'Skafferiet', x0: 6.25, x1: 8, z0: 3.5, z1: 5, floor: 'PINE', paper: 'CREAM' },
  { name: 'Vardagsrummet', x0: -7, x1: -0.25, z0: 0, z1: 5, floor: 'PINE', paper: 'MEDALLION' },
  { name: 'Hallen', x0: -7, x1: 10, z0: 5.25, z1: 7.5, floor: 'PINE', paper: 'ROSE' },
  { name: 'Farstun', x0: 1.75, x1: 4.25, z0: 7.75, z1: 10, floor: 'PINE', paper: 'ROSE' },
  { name: 'Badrummet', x0: -1.75, x1: 1.5, z0: 7.75, z1: 10.5, floor: 'BATHFLOOR', paper: 'BATHTILE' },
  { name: 'Sovrummet', x0: -7, x1: -2, z0: 7.75, z1: 12.5, floor: 'PINE', paper: 'BLUEPAPER' },
  { name: 'Syrummet', x0: 4.5, x1: 10, z0: 7.75, z1: 12.5, floor: 'PINE', paper: 'YELLOWPAPER' },
];
export const room = (name: string) => ROOMS.find((r) => r.name === name)!;
/** The room a spot is in (the hall when it's in none: a doorway). */
export const roomAt = (x: number, z: number) =>
  (ROOMS.find((r) => x >= r.x0 - 0.05 && x <= r.x1 + 0.05 && z >= r.z0 - 0.05 && z <= r.z1 + 0.05) ?? ROOMS[3]).name;

/** The kitchen's inside (the look slice's room). */
export const KITCHEN = { x0: 0, x1: 6, z0: 0, z1: 5, h: CEIL };
export const SILL = 0.875, WIN_TOP = 2.125;
/** The door from the kitchen to the hall. */
export const DOOR = { x0: 2.5, x1: 3.5, h: 2.125 };
/** Skafferiet, and its door in the kitchen's east wall (z from z0 to z1). */
export const PANTRY = { x0: 6.25, x1: 8, z0: 3.5, z1: 5, door: { z0: 3.85, z1: 4.85 } };

/**
 * A door or opening: through a wall across z (`along: 'x'`, the wall at z..z+0.25, open from a0 to
 * a1 in x) or across x (`along: 'z'`, the wall at x..x+0.25, open from a0 to a1 in z).
 */
export interface Opening {
  along: 'x' | 'z';
  /** The wall's low side (z for an 'x' door, x for a 'z' door). */
  at: number;
  a0: number;
  a1: number;
  h: number;
}
export const DOORS: readonly Opening[] = [
  { along: 'x', at: 5, a0: 2.5, a1: 3.5, h: DOOR.h },          // köket ↔ hallen
  { along: 'z', at: 6, a0: 3.85, a1: 4.85, h: DOOR.h },        // köket ↔ skafferiet
  { along: 'z', at: -0.25, a0: 3.25, a1: 4.25, h: DOOR.h },    // köket ↔ vardagsrummet
  { along: 'x', at: 5, a0: -4.5, a1: -2.5, h: DOOR.h },        // vardagsrummet ↔ hallen: a double door
  { along: 'x', at: 7.5, a0: 2, a1: 4, h: DOOR.h },            // hallen ↔ farstun, wide open
  { along: 'x', at: 7.5, a0: -0.5, a1: 0.5, h: DOOR.h },       // hallen ↔ badrummet
  { along: 'x', at: 7.5, a0: -4, a1: -3, h: DOOR.h },          // hallen ↔ sovrummet
  { along: 'x', at: 7.5, a0: 6.5, a1: 7.5, h: DOOR.h },        // hallen ↔ syrummet
];

/** A window: in a wall like a door, its sill and top heights; `out` is the side the garden is on (−1 or +1). */
export interface Window extends Opening {
  sill: number;
  out: -1 | 1;
}
export const WINDOW_LIST: readonly Window[] = [
  { along: 'x', at: -0.25, a0: 1.25, a1: 2.375, h: WIN_TOP, sill: SILL, out: -1 },     // the kitchen, north
  { along: 'x', at: -0.25, a0: 3.625, a1: 4.75, h: WIN_TOP, sill: SILL, out: -1 },
  { along: 'x', at: -0.25, a0: -6, a1: -4.875, h: WIN_TOP, sill: SILL, out: -1 },      // the living room, north
  { along: 'x', at: -0.25, a0: -3.125, a1: -2, h: WIN_TOP, sill: SILL, out: -1 },
  { along: 'z', at: -7.25, a0: 5.75, a1: 6.875, h: WIN_TOP, sill: SILL, out: -1 },     // the hall's west end
  { along: 'z', at: 10, a0: 5.75, a1: 6.875, h: WIN_TOP, sill: SILL, out: 1 },         // the hall's east end
  { along: 'x', at: 12.5, a0: -6.25, a1: -5.125, h: WIN_TOP, sill: SILL, out: 1 },     // the bedroom, south
  { along: 'x', at: 12.5, a0: -3.875, a1: -2.75, h: WIN_TOP, sill: SILL, out: 1 },
  { along: 'z', at: -7.25, a0: 9.5, a1: 10.625, h: WIN_TOP, sill: SILL, out: -1 },     // the bedroom, west
  { along: 'x', at: 10.5, a0: -0.5, a1: 0.5, h: WIN_TOP, sill: 1.25, out: 1 },         // the bathroom, high and small
  { along: 'x', at: 12.5, a0: 5.375, a1: 6.5, h: WIN_TOP, sill: SILL, out: 1 },        // the sewing room, south
  { along: 'x', at: 12.5, a0: 8, a1: 9.125, h: WIN_TOP, sill: SILL, out: 1 },
  { along: 'z', at: 10, a0: 9.5, a1: 10.625, h: WIN_TOP, sill: SILL, out: 1 },         // the sewing room, east
];
/** The kitchen's two windows as [x0, x1] (the look slice's lights and curtains). */
export const WINDOWS: [number, number][] = WINDOW_LIST.slice(0, 2).map((w) => [w.a0, w.a1]);

const T = HV; // one voxel: a lip, a list
const W = 0.25; // a wall

/** A box across a wall: `along` x it spans a0..a1 in x and at..at+W in z (widened by `pad` into the rooms), y from y0 to y1. */
function across(o: { along: 'x' | 'z'; at: number }, a0: number, a1: number, y0: number, y1: number, pad = 0): HouseBox['b'] {
  return o.along === 'x' ? [a0, y0, o.at - pad, a1, y1, o.at + W + pad] : [o.at - pad, y0, a0, o.at + W + pad, y1, a1];
}

function shell(): HouseBox[] {
  const out: HouseBox[] = [];
  const add = (b: HouseBox['b'], m: Mat, solid?: boolean, glass?: boolean) => out.push({ b, m, solid, glass });

  // Plinths and floors, under the walls too (so a doorway has its threshold).
  for (const r of ROOMS) {
    add([r.x0 - W, -0.5, r.z0 - W, r.x1 + W, -0.125, r.z1 + W], 'GREY');
    add([r.x0 - W, -0.125, r.z0 - W, r.x1 + W, 0, r.z1 + W], r.floor);
  }
  // The walls round every room, falu red; the ceilings.
  for (const r of ROOMS) {
    add([r.x0 - W, 0, r.z0 - W, r.x1 + W, CEIL, r.z0], 'FALU');
    add([r.x0 - W, 0, r.z1, r.x1 + W, CEIL, r.z1 + W], 'FALU');
    add([r.x0 - W, 0, r.z0, r.x0, CEIL, r.z1], 'FALU');
    add([r.x1, 0, r.z0, r.x1 + W, CEIL, r.z1], 'FALU');
    add([r.x0 - W, CEIL, r.z0 - W, r.x1 + W, CEIL + W, r.z1 + W], 'CEILING');
  }
  // Each room's paper: the wall's inner voxel (drawn only: the wall behind it is what you bump into).
  for (const r of ROOMS) {
    add([r.x0, 0, r.z0 - T, r.x1, CEIL, r.z0], r.paper, false);
    add([r.x0, 0, r.z1, r.x1, CEIL, r.z1 + T], r.paper, false);
    add([r.x0 - T, 0, r.z0, r.x0, CEIL, r.z1], r.paper, false);
    add([r.x1, 0, r.z0, r.x1 + T, CEIL, r.z1], r.paper, false);
  }
  // Tiles behind the stove (west wall) and over the counter (east wall); the pantry's mouse hole.
  add([-T, 0, 1.25, 0, 1.5, 2.75], 'TILE', false);
  add([6, 0.875, 0.5, 6 + T, 1.5, 2.75], 'TILE', false);
  add([7.4, 0, PANTRY.z1, 7.4 + T, T, PANTRY.z1 + T], 'INK', false);
  // The bathroom: tiles to 1.5 m, paper above would be damp, so it's tiled all the way.
  // Skirting and a cornice round every room (the bathroom has none: its tiles meet the floor).
  for (const r of ROOMS) {
    if (r.name === 'Badrummet') continue;
    for (const [y0, y1] of [[0, T], [CEIL - T, CEIL]]) {
      add([r.x0, y0, r.z0, r.x1, y1, r.z0 + T], 'WHITE', false);
      add([r.x0, y0, r.z1 - T, r.x1, y1, r.z1], 'WHITE', false);
      add([r.x0, y0, r.z0, r.x0 + T, y1, r.z1], 'WHITE', false);
      add([r.x1 - T, y0, r.z0, r.x1, y1, r.z1], 'WHITE', false);
    }
  }
  // Doors: carved through the wall and the skirting either side, then a white frame both sides.
  for (const d of DOORS) {
    add(across(d, d.a0, d.a1, 0, d.h, T), 'AIR');
    for (const side of [-1, 1]) {
      const face = side < 0 ? d.at - T : d.at + W;
      const f = (a0: number, a1: number, y0: number, y1: number): HouseBox['b'] =>
        d.along === 'x' ? [a0, y0, face, a1, y1, face + T] : [face, y0, a0, face + T, y1, a1];
      add(f(d.a0 - T, d.a0, 0, d.h + T), 'WHITE', false);
      add(f(d.a1, d.a1 + T, 0, d.h + T), 'WHITE', false);
      add(f(d.a0, d.a1, d.h, d.h + T), 'WHITE', false);
    }
  }
  // Windows: glass in the grid, open when drawn; a white frame and bars in the outer half of the
  // wall (so the inside has a recess), and a sill into the room.
  for (const w of WINDOW_LIST) {
    add(across(w, w.a0, w.a1, w.sill, w.h), 'AIR', false, true);
    const outer = w.out < 0 ? w.at : w.at + W - (W - T), inner = w.out < 0 ? w.at + W : w.at;
    const o0 = Math.min(outer, outer + (W - T)), o1 = o0 + (W - T);
    const f = (a0: number, a1: number, y0: number, y1: number): HouseBox['b'] => (w.along === 'x' ? [a0, y0, o0, a1, y1, o1] : [o0, y0, a0, o1, y1, a1]);
    const mid = (w.a0 + w.a1) / 2 - T / 2, bar = w.sill + (w.h - w.sill) / 2;
    add(f(w.a0, w.a1, w.sill, w.sill + T), 'WHITE', false);
    add(f(w.a0, w.a1, w.h - T, w.h), 'WHITE', false);
    add(f(w.a0, w.a0 + T, w.sill, w.h), 'WHITE', false);
    add(f(w.a1 - T, w.a1, w.sill, w.h), 'WHITE', false);
    add(f(mid, mid + T, w.sill, w.h), 'WHITE', false);
    add(f(w.a0, w.a1, bar, bar + T), 'WHITE', false);
    // The sill: through the inner half and a quarter metre into the room.
    const s0 = w.out < 0 ? inner - T : inner - W, s1 = w.out < 0 ? inner + W : inner + T;
    add(w.along === 'x' ? [w.a0 - T, w.sill - T, s0, w.a1 + T, w.sill, s1] : [s0, w.sill - T, w.a0 - T, s1, w.sill, w.a1 + T], 'WHITE', false);
  }
  // Corner boards: white knutar where the outside walls meet, as on every falu red house.
  for (const [x, z] of [[-7.25, -0.25], [6, -0.25], [-7.25, 12.5], [-2, 12.5], [4.25, 12.5], [10, 12.5], [10, 5], [8, 3.25], [6, 3.25]] as const)
    add([x, 0, z, x + W, CEIL, z + W], 'WHITE');
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

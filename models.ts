/**
 * The kit models of Mormors hus, three-free: each is a `Volume` and its voxel size, built once by key.
 * Conventions (voxelparty-kvalitet §5): free-standing props have their origin in the middle of their
 * footprint on the ground and face +z; wall pieces have x along the wall and z out of it, with the
 * origin on the wall's face. Most props are at 1/16 m, the characters at 1/12 and 1/16, signs finer.
 */
import { Volume } from '@voxelparty/sdk/core';
import type { Ids } from './textures';

export interface Model {
  vol: Volume;
  /** World size of a voxel. */
  voxel: number;
  /** Voxel-space point that becomes the origin. */
  origin: [number, number, number];
  /** Stands on the ground (false: hangs on a wall or from the ceiling). */
  ground: boolean;
}

const P = 1 / 16;

/** Fill [x0, x1) × [y0, y1) × [z0, z1) with `id` (0 carves). */
export function box(v: Volume, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, id: number) {
  for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) v.set(x, y, z, id);
}

const prop = (vol: Volume, voxel = P): Model => ({ vol, voxel, origin: [vol.sx / 2, 0, vol.sz / 2], ground: true });
const wall = (vol: Volume, voxel = P): Model => ({ vol, voxel, origin: [vol.sx / 2, 0, 0], ground: false });
const hang = (vol: Volume, voxel = P): Model => ({ vol, voxel, origin: [vol.sx / 2, vol.sy, vol.sz / 2], ground: false });

// ------------------------------------------------------------ furniture

/** Köksbordet: 2 × 1 m, white turned legs, a scrubbed pine top. */
function table(k: Ids) {
  const v = new Volume(32, 12, 16);
  box(v, 0, 10, 0, 32, 12, 16, k.WOOD);
  box(v, 1, 9, 1, 31, 10, 15, k.WHITE);          // the apron
  for (const [x, z] of [[1, 1], [29, 1], [1, 13], [29, 13]]) {
    box(v, x, 0, z, x + 2, 9, z + 2, k.WHITE);
    box(v, x - (x > 16 ? 0 : 0), 6, z, x + 2, 7, z + 2, k.CREAM); // a turned ring
  }
  return prop(v);
}

/** Den virkade duken: thin, with a holed border. */
function cloth(k: Ids) {
  const v = new Volume(22, 1, 12);
  for (let z = 0; z < 12; z++) for (let x = 0; x < 22; x++) {
    const edge = x === 0 || z === 0 || x === 21 || z === 11;
    if (edge && (x + z) % 2) continue;             // the lace holes
    v.set(x, 0, z, edge || (x % 4 === 0 && z % 4 === 0) ? k.CREAM : k.WHITE);
  }
  return prop(v);
}

/** En pinnstol: pine, a spindle back (at −z), the seat facing +z. */
function chair(k: Ids) {
  const v = new Volume(7, 15, 7);
  for (const [x, z] of [[0, 0], [6, 0], [0, 6], [6, 6]]) box(v, x, 0, z, x + 1, 7, z + 1, k.WOOD_DARK);
  box(v, 0, 7, 0, 7, 8, 7, k.WOOD);
  box(v, 0, 8, 0, 1, 15, 1, k.WOOD_DARK);
  box(v, 6, 8, 0, 7, 15, 1, k.WOOD_DARK);
  box(v, 0, 13, 0, 7, 15, 1, k.WOOD);
  for (const x of [2, 4]) box(v, x, 8, 0, x + 1, 13, 1, k.WOOD);
  return prop(v);
}

/** Kökssoffan under fönstren: cream paint, a gingham cushion, a high back at −z. */
function sofa(k: Ids) {
  const v = new Volume(28, 15, 9);
  box(v, 0, 0, 0, 28, 6, 9, k.CREAM);
  box(v, 1, 0, 8, 27, 1, 9, k.WOOD_DEEP);        // the kick plate, shadowed
  for (const x of [9, 18]) box(v, x, 1, 8, x + 1, 6, 9, k.WHITE);   // the pull-out's panels
  box(v, 1, 6, 2, 27, 8, 9, k.GINGHAM);
  box(v, 0, 6, 0, 28, 14, 2, k.CREAM);
  box(v, 0, 14, 0, 28, 15, 3, k.WHITE);          // the top rail
  box(v, 0, 6, 2, 1, 11, 9, k.CREAM);
  box(v, 27, 6, 2, 28, 11, 9, k.CREAM);
  return prop(v);
}

/** Vedspisen: cast iron, a glowing firebox, brass rail, the pipe up to the ceiling (front +z). */
function stove(k: Ids) {
  const v = new Volume(16, 40, 12);
  for (const [x, z] of [[0, 0], [14, 0], [0, 9], [14, 9]]) box(v, x, 0, z, x + 2, 2, z + 2, k.IRON);
  box(v, 0, 2, 0, 16, 12, 11, k.IRON);
  box(v, 0, 12, 0, 16, 13, 11, k.GREY);         // the top, worn lighter
  for (const [cx, cz] of [[4, 5], [11, 5]]) box(v, cx - 2, 13, cz - 2, cx + 2, 14, cz + 2, k.IRON);   // the rings
  box(v, 1, 5, 11, 6, 10, 12, k.IRON);          // the firebox door
  box(v, 2, 6, 11, 5, 9, 12, k.EMBER);
  box(v, 8, 3, 11, 15, 10, 12, k.IRON);         // the oven door
  box(v, 9, 8, 11, 14, 9, 12, k.BRASS);
  box(v, 0, 11, 11, 16, 12, 12, k.BRASS);       // the towel rail
  box(v, 6, 13, 1, 10, 40, 5, k.IRON);          // the pipe
  box(v, 5, 22, 0, 11, 23, 6, k.GREY);          // the damper collar
  return prop(v);
}

/** Diskbänken: cream doors, brass knobs, a steel basin and tap (front +z, against a wall at −z). */
function counter(k: Ids) {
  const v = new Volume(32, 19, 11);
  box(v, 0, 0, 0, 32, 1, 9, k.WOOD_DEEP);
  box(v, 0, 1, 0, 32, 13, 10, k.CREAM);
  for (const x of [8, 16, 24]) box(v, x, 1, 9, x + 1, 13, 10, k.WHITE);
  for (const x of [6, 10, 22, 26]) box(v, x, 10, 10, x + 1, 11, 11, k.BRASS);
  box(v, 0, 13, 0, 32, 14, 10, k.WOOD_DARK);
  box(v, 18, 11, 2, 29, 14, 9, k.STEEL);
  box(v, 19, 12, 3, 28, 14, 8, 0);              // the basin
  box(v, 22, 14, 0, 24, 18, 2, k.STEEL);        // the tap
  box(v, 22, 17, 2, 24, 18, 5, k.STEEL);
  return prop(v);
}

/** Överskåpen: a wall piece, hung with its back on the wall. */
function upper(k: Ids) {
  const v = new Volume(32, 10, 6);
  box(v, 0, 0, 0, 32, 10, 6, k.CREAM);
  for (const x of [8, 16, 24]) box(v, x, 0, 5, x + 1, 10, 6, k.WHITE);
  box(v, 0, 9, 0, 32, 10, 6, k.WHITE);
  for (const x of [6, 10, 22, 26]) box(v, x, 1, 6 - 1, x + 1, 2, 6, k.BRASS);
  return wall(v);
}

/** Kylskåpet: a rounded 50s fridge, drawings and a postcard on the door (front +z). */
function fridge(k: Ids) {
  const v = new Volume(11, 24, 12);
  box(v, 0, 1, 0, 11, 24, 11, k.WHITE);
  box(v, 1, 0, 1, 10, 1, 10, k.GREY);
  for (const x of [0, 10]) for (const z of [0, 10]) v.set(x, 23, z, 0);   // the rounded top
  box(v, 1, 23, 0, 10, 24, 1, 0);
  box(v, 0, 19, 10, 11, 20, 11, k.GREY);        // the freezer's seam
  box(v, 9, 13, 11, 10, 18, 12, k.STEEL);       // the handle
  // Barnbarnens teckningar and the card from the castle.
  box(v, 1, 12, 11, 4, 16, 12, k.PAPER);
  v.set(2, 13, 11, k.RED); v.set(2, 14, 11, k.YELLOW); v.set(3, 14, 11, k.BLUE);
  box(v, 5, 10, 11, 8, 13, 12, k.PAPER);
  v.set(6, 11, 11, k.GREEN); v.set(7, 12, 11, k.YELLOW);
  box(v, 2, 20, 11, 6, 22, 12, k.FALU_FLAT);    // vykortet: a red castle card
  v.set(3, 21, 11, k.WHITE);
  return prop(v);
}

/** Vitrinskåpet: dark wood, closed below, open shelves of porcelain above (front +z). */
function vitrine(k: Ids) {
  const v = new Volume(19, 30, 7);
  box(v, 0, 0, 0, 19, 30, 7, k.WOOD_DARK);
  box(v, 1, 12, 1, 18, 29, 7, 0);               // the open top
  box(v, 1, 12, 0, 18, 29, 1, k.MINT_FLAT);     // its painted back
  for (const y of [12, 18, 24]) box(v, 1, y, 1, 18, y + 1, 7, k.WOOD_DARK);
  box(v, 9, 1, 6, 10, 11, 7, k.WOOD_DEEP);      // the doors' seam
  for (const x of [7, 11]) v.set(x, 7, 6, k.BRASS);
  box(v, 0, 29, 0, 19, 30, 7, k.WOOD_DEEP);
  // Porcelain: plates on edge at the back, cups in front, on two shelves.
  for (const y of [13, 19]) {
    for (let x = 2; x < 17; x += 3) {
      box(v, x, y, 1, x + 2, y + 4, 2, k.PORC);
      v.set(x, y + 3, 1, k.PORC_BLUE); v.set(x + 1, y + 3, 1, k.PORC_BLUE);
    }
    for (let x = 2; x < 17; x += 4) {
      box(v, x, y, 3, x + 2, y + 2, 5, k.PORC);
      v.set(x, y + 1, 4, k.PORC_BLUE);
    }
  }
  box(v, 3, 25, 2, 7, 28, 5, k.BRASS);          // the best coffee pot, on top shelf
  box(v, 11, 25, 2, 16, 26, 5, k.PORC);
  return prop(v);
}

/** Taklampan: a cream enamel shade on a thin cord, glowing underneath (hangs from its top). */
function lamp(k: Ids) {
  const v = new Volume(11, 16, 11);
  box(v, 5, 5, 5, 6, 16, 6, k.IRON);
  box(v, 4, 4, 4, 7, 5, 7, k.BRASS);
  box(v, 3, 3, 3, 8, 4, 8, k.CREAM);
  box(v, 2, 2, 2, 9, 3, 9, k.CREAM);
  box(v, 1, 1, 1, 10, 2, 10, k.CREAM);
  box(v, 0, 0, 0, 11, 1, 11, k.CREAM);
  box(v, 1, 0, 1, 10, 1, 10, 0);
  box(v, 2, 1, 2, 9, 2, 9, k.WHITE);           // the inside of the shade (lit: lampGlow)
  return hang(v, 1 / 20);
}

/** The lamp's glowing bulb and inner shade, its own mesh so it can go out (look.ts: lamp 0). */
function lampGlow(k: Ids) {
  const v = new Volume(11, 16, 11);
  box(v, 2, 1, 2, 9, 2, 9, k.LAMP);
  box(v, 4, 0, 4, 7, 1, 7, k.LAMP);
  return hang(v, 1 / 20);
}

/** Gardinerna for one window: gingham panels with folds, a valance and a brass rod (a wall piece). */
function curtains(k: Ids) {
  const v = new Volume(26, 19, 3);
  for (let x = 0; x < 26; x++) {
    if (x >= 5 && x < 21) continue;
    const fold = (x >> 1) & 1;
    box(v, x, 3, fold, x + 1, 16, fold + 1, k.GINGHAM);
  }
  box(v, 0, 15, 1, 26, 18, 2, k.GINGHAM);
  for (let x = 1; x < 26; x += 3) v.set(x, 15, 1, k.RED);   // the scalloped hem
  box(v, 0, 18, 0, 26, 19, 1, k.BRASS);
  return wall(v);
}

// ------------------------------------------------------------ things (what a vätte becomes)

/**
 * En kaffekopp på fat, mormors finservis: a round saucer with a blue rim, a rounded cup with a
 * blue band, pink roses and a looped handle, coffee inside. Slightly oversized (PLAN.md risks).
 */
function cup(k: Ids) {
  const v = new Volume(12, 7, 9);
  const round = (x: number, z: number, c: number, r: number) => (x - c) ** 2 + (z - c) ** 2 <= r * r;
  for (let z = 0; z < 9; z++) for (let x = 0; x < 9; x++) {
    if (!round(x, z, 4, 4.4)) continue;
    v.set(x, 0, z, round(x, z, 4, 3.4) ? k.PORC : k.PORC_BLUE);
  }
  for (let y = 1; y < 7; y++) for (let z = 1; z < 8; z++) for (let x = 1; x < 8; x++) {
    const r = y === 1 ? 2.4 : 3.2;
    if (!round(x, z, 4, r)) continue;
    const rim = !round(x, z, 4, r - 1);
    if (y >= 5 && !rim) { if (y === 5) v.set(x, y, z, k.COFFEE); continue; }   // the inside
    v.set(x, y, z, y === 6 ? k.PORC_BLUE : k.PORC);
  }
  for (const [x, y, z] of [[1, 3, 4], [4, 3, 7], [6, 4, 6], [2, 4, 2], [7, 3, 3]]) v.set(x, y, z, k.ROSEPINK);   // roses
  for (const [x, y, z] of [[1, 2, 5], [5, 3, 7]]) v.set(x, y, z, k.GREEN);
  box(v, 8, 2, 4, 11, 3, 5, k.PORC);              // the handle's loop
  box(v, 8, 5, 4, 11, 6, 5, k.PORC);
  box(v, 10, 2, 4, 11, 6, 5, k.PORC);
  return { vol: v, voxel: 1 / 40, origin: [4.5, 0, 4.5] as [number, number, number], ground: true };
}

/** Ett kakfat med kakor: a plate with two kinds of biscuits. */
function biscuits(k: Ids) {
  const v = new Volume(9, 3, 9);
  box(v, 0, 0, 0, 9, 1, 9, k.PORC);
  for (let i = 0; i < 9; i++) for (const j of [0, 8]) { v.set(i, 0, j, k.PORC_BLUE); v.set(j, 0, i, k.PORC_BLUE); }
  for (const [x, z, id] of [[1, 1, k.COOKIE], [4, 1, k.CHOC], [1, 4, k.CHOC], [4, 4, k.COOKIE], [2, 2, k.COOKIE]] as const) {
    const y = x === 2 ? 2 : 1;
    box(v, x + 1, y, z + 1, x + 3, y + 1, z + 3, id);
  }
  box(v, 6, 1, 6, 8, 2, 8, k.YELLOW);           // a slice of sockerkaka
  return prop(v, 1 / 24);
}

/** Kaffepannan: brass, a spout, a dark knob. */
function coffeePot(k: Ids) {
  const v = new Volume(10, 9, 6);
  box(v, 2, 0, 0, 8, 6, 6, k.BRASS);
  box(v, 3, 6, 1, 7, 7, 5, k.BRASS);
  box(v, 4, 7, 2, 6, 8, 4, k.IRON);
  box(v, 8, 3, 2, 9, 5, 4, k.BRASS);
  box(v, 9, 5, 2, 10, 6, 4, k.BRASS);           // the spout
  box(v, 0, 2, 2, 1, 6, 4, k.IRON);             // the handle
  box(v, 1, 5, 2, 2, 6, 4, k.IRON);
  return prop(v, 1 / 22);
}

/** Brödkorgen: a wicker basket, a loaf, a gingham cloth. */
function breadBasket(k: Ids) {
  const v = new Volume(8, 4, 6);
  box(v, 0, 0, 0, 8, 2, 6, k.WOOD_DARK);
  box(v, 1, 1, 1, 7, 2, 5, 0);
  box(v, 1, 1, 1, 6, 3, 4, k.BREAD);
  box(v, 5, 1, 2, 8, 3, 6, k.GINGHAM);
  return prop(v, 1 / 20);
}

/** Vedkorgen: birch logs in a basket. */
function logBasket(k: Ids) {
  const v = new Volume(9, 8, 7);
  box(v, 0, 0, 0, 9, 5, 7, k.WOOD_DEEP);
  box(v, 1, 1, 1, 8, 5, 6, 0);
  for (const [x, y] of [[1, 2], [4, 2], [2, 4], [5, 4], [3, 6]]) {
    box(v, x, y, 1, x + 3, y + 2, 6, k.WHITE);
    box(v, x + 1, y, 6, x + 2, y + 2, 7, k.CREAM);   // the cut ends
  }
  return prop(v);
}

/** En pelargon i kruka. */
function geranium(k: Ids) {
  const v = new Volume(6, 9, 6);
  box(v, 1, 0, 1, 5, 4, 5, k.POT);
  box(v, 0, 3, 0, 6, 4, 6, k.POT);
  box(v, 0, 4, 1, 6, 7, 5, k.GREEN);
  box(v, 1, 4, 0, 5, 7, 6, k.GREEN);
  box(v, 1, 7, 1, 5, 8, 5, k.GREEN);
  for (const [x, y, z] of [[1, 8, 1], [4, 8, 3], [2, 7, 0], [5, 6, 2], [0, 6, 4], [3, 8, 4]]) v.set(x, y, z, k.RED);
  return prop(v, 1 / 20);
}

/** Korsordet: a folded paper with a grid and a pencil. */
function crossword(k: Ids) {
  const v = new Volume(8, 1, 10);
  box(v, 0, 0, 0, 8, 1, 10, k.PAPER);
  for (let z = 1; z < 9; z++) for (let x = 1; x < 7; x++) if ((x * 3 + z * 5) % 7 === 0) v.set(x, 0, z, k.INK);
  return prop(v, 1 / 20);
}

/** Trasmattan: a striped rag rug. */
function ragRug(k: Ids) {
  const v = new Volume(12, 1, 28);
  const stripes = [k.FALU_FLAT, k.CREAM, k.WOOD_DARK, k.CREAM, k.MINT_FLAT, k.CREAM, k.GREY, k.CREAM];   // the house's own colours: no new signal colour
  for (let z = 0; z < 28; z++) for (let x = 0; x < 12; x++) v.set(x, 0, z, stripes[Math.floor(z / 2) % stripes.length]);
  return prop(v);
}

/** Grytlappar on the rail: a wall piece (hangs from its top). */
function potholder(k: Ids) {
  const v = new Volume(4, 5, 1);
  box(v, 0, 0, 0, 4, 4, 1, k.GINGHAM);
  v.set(1, 4, 0, k.RED); v.set(2, 4, 0, k.RED);
  return hang(v, 1 / 20);
}

/** Köksklockan: a round white face, black hands (a wall piece). */
function clock(k: Ids) {
  const v = new Volume(7, 7, 1);
  box(v, 0, 0, 0, 7, 7, 1, k.WHITE);
  for (const [x, y] of [[0, 0], [6, 0], [0, 6], [6, 6]]) v.set(x, y, 0, 0);
  v.set(3, 3, 0, k.INK); v.set(3, 4, 0, k.INK); v.set(3, 5, 0, k.INK); v.set(4, 3, 0, k.INK);
  return wall(v);
}

// ------------------------------------------------------------ text: 3×5 letters (voxelparty-kvalitet §5)

const FONT: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  Ö: ['#.#', '.#.', '#.#', '#.#', '.#.'], Å: ['.#.', '...', '###', '#.#', '#.#'],
  Ä: ['#.#', '...', '###', '#.#', '#.#'], '!': ['.#.', '.#.', '.#.', '...', '.#.'], ' ': ['...', '...', '...', '...', '...'],
};

/** Write `text` into a volume's face at z, from (x, y) as the top-left, in `id`. */
function write(v: Volume, text: string, x: number, y: number, z: number, id: number) {
  for (const ch of text) {
    const g = FONT[ch] ?? FONT[' '];
    g.forEach((row, r) => [...row].forEach((c, cx) => c === '#' && v.set(x + cx, y - r, z, id)));
    x += 4;
  }
}

/** Bonaden "MORMORS KÖK": a cross-stitched panel with a red border, the letters standing out. */
function sampler(k: Ids) {
  const text = 'MORMORS KÖK', w = text.length * 4 + 5, h = 11;
  const v = new Volume(w, h, 2);
  box(v, 0, 0, 0, w, h, 1, k.CREAM);
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) v.set(x, y, 0, x % 2 ? k.RED : k.GREEN);
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) v.set(x, y, 0, y % 2 ? k.RED : k.GREEN);
  write(v, text, 3, h - 3, 1, k.FALU_FLAT);
  return wall(v, 1 / 48);   // narrow enough to fit between the cabinets and the pantry door
}

/** Lappen på kylen: "GLÖM EJ KAFFET!" in pencil on yellow paper. */
function note(k: Ids) {
  const text = 'GLÖM EJ KAFFET!', w = text.length * 4 + 1, h = 7;
  const v = new Volume(w, h, 2);
  box(v, 0, 0, 0, w, h, 1, k.YELLOW);
  write(v, text, 1, h - 2, 1, k.INK);
  return wall(v, 1 / 96);
}

// ------------------------------------------------------------ skafferiet (finer: 1/32 m, the detail to come)

const F = 1 / 32;
const round2 = (x: number, z: number, cx: number, cz: number, r: number) => (x - cx) ** 2 + (z - cz) ** 2 <= r * r;

/** En skafferihylla: pine boards on dark uprights, a lip on each shelf (a wall piece's depth, standing). */
function shelf(k: Ids) {
  const v = new Volume(21, 32, 6);
  box(v, 0, 0, 0, 1, 32, 6, k.WOOD_DARK);
  box(v, 20, 0, 0, 21, 32, 6, k.WOOD_DARK);
  for (const y of [1, 8, 15, 22, 29]) {
    box(v, 1, y, 0, 20, y + 1, 6, k.WOOD);
    box(v, 1, y + 1, 5, 20, y + 2, 6, k.WOOD_DARK);   // the lip
  }
  box(v, 0, 31, 0, 21, 32, 6, k.WOOD_DARK);
  return prop(v);
}

/** En syltburk: glass, jam inside, a gingham cloth tied over the top with string, a paper label. */
function jar(k: Ids, jam: number) {
  const v = new Volume(7, 10, 7);
  for (let y = 0; y < 8; y++) for (let z = 0; z < 7; z++) for (let x = 0; x < 7; x++) {
    if (!round2(x, z, 3, 3, 3.2)) continue;
    const rim = !round2(x, z, 3, 3, 2.2);
    v.set(x, y, z, y === 0 ? k.GLASS : rim ? (y >= 2 && y <= 4 ? k.PAPER : y > 6 ? k.GLASS : jam) : y < 7 ? jam : k.GLASS);
  }
  for (const [x, z] of [[1, 3], [5, 3], [3, 1], [3, 5]]) v.set(x, 3, z, k.INK);   // the label's handwriting
  for (let z = 0; z < 7; z++) for (let x = 0; x < 7; x++) if (round2(x, z, 3, 3, 3.6)) v.set(x, 8, z, k.GINGHAM);
  for (let z = 1; z < 6; z++) for (let x = 1; x < 6; x++) if (round2(x, z, 3, 3, 2.4)) v.set(x, 9, z, k.GINGHAM);
  for (let z = 0; z < 7; z++) for (let x = 0; x < 7; x++) if (round2(x, z, 3, 3, 3.3) && !round2(x, z, 3, 3, 2.5)) v.set(x, 7, z, k.WHITE);   // the string
  return { vol: v, voxel: F, origin: [3.5, 0, 3.5] as [number, number, number], ground: true };
}
const jarLingon = (k: Ids) => jar(k, k.RED);
const jarBlueberry = (k: Ids) => jar(k, k.INK);

/** En mjölpåse: a paper sack with a blue print, bulging at the bottom, its top folded over. */
function sack(k: Ids) {
  // 11 voxels tall: it fits a shelf's 12 with a hair to spare.
  const v = new Volume(10, 11, 8);
  for (let y = 0; y < 9; y++) {
    const inset = y < 7 ? 0 : 1;
    box(v, inset, y, inset, 10 - inset, y + 1, 8 - inset, k.PAPER);
  }
  box(v, 1, 9, 1, 9, 10, 7, k.CREAM);    // the fold
  box(v, 1, 10, 3, 9, 11, 6, k.CREAM);
  box(v, 0, 3, 7, 10, 4, 8, k.BLUE);     // the print: a band and a wheat sheaf
  box(v, 4, 4, 7, 6, 8, 8, k.BLUE);
  v.set(3, 7, 7, k.BLUE); v.set(6, 7, 7, k.BLUE);
  box(v, 0, 0, 0, 10, 1, 8, k.CREAM);    // flour dust round its foot
  return { vol: v, voxel: F, origin: [5, 0, 4] as [number, number, number], ground: true };
}

/** En pepparkaksburk: a round red tin with brass bands and a star on its lid. */
function tin(k: Ids) {
  const v = new Volume(9, 9, 9);
  for (let y = 0; y < 9; y++) for (let z = 0; z < 9; z++) for (let x = 0; x < 9; x++) {
    if (!round2(x, z, 4, 4, y >= 7 ? 4.4 : 4)) continue;
    v.set(x, y, z, y === 1 || y === 6 ? k.BRASS : y >= 7 ? (y === 8 && round2(x, z, 4, 4, 1.6) ? k.YELLOW : k.RED) : k.RED);
  }
  for (const [x, z] of [[4, 0], [0, 4], [8, 4], [4, 8]]) v.set(x, 3, z, k.WHITE);   // little hearts
  return { vol: v, voxel: F, origin: [4.5, 0, 4.5] as [number, number, number], ground: true };
}

/** Skafferiets glödlampa: a bare bulb on a cord (hangs from its top). */
function bulb(k: Ids) {
  const v = new Volume(5, 18, 5);
  box(v, 2, 6, 2, 3, 18, 3, k.IRON);
  box(v, 1, 5, 1, 4, 6, 4, k.BRASS);
  return { vol: v, voxel: F, origin: [2.5, 18, 2.5] as [number, number, number], ground: false };
}

/** The bulb's glass, its own mesh so it can go out. */
function bulbGlow(k: Ids) {
  const v = new Volume(5, 18, 5);
  box(v, 1, 1, 1, 4, 5, 4, k.LAMP);
  box(v, 2, 0, 2, 3, 1, 3, k.LAMP);
  return { vol: v, voxel: F, origin: [2.5, 18, 2.5] as [number, number, number], ground: false };
}

/** En kvast: a long handle and a fan of straw, standing in the corner. */
function broom(k: Ids) {
  const v = new Volume(9, 42, 3);
  box(v, 4, 10, 1, 5, 42, 2, k.WOOD);
  box(v, 2, 8, 0, 7, 10, 3, k.RED);       // the binding
  for (let y = 0; y < 8; y++) box(v, 1 - (y < 3 ? 1 : 0), y, 0, 8 + (y < 3 ? 1 : 0), y + 1, 3, (y + 1) % 3 ? k.YELLOW : k.COOKIE);
  return { vol: v, voxel: 1 / 24, origin: [4.5, 0, 1.5] as [number, number, number], ground: true };
}

// ------------------------------------------------------------ the garden's small things

/** Mormors mammelucker: long white bloomers with lace and red ribbons, pegged on the line. */
function bloomers(k: Ids) {
  const v = new Volume(12, 16, 1);
  box(v, 0, 13, 0, 12, 16, 0 + 1, k.WHITE);
  box(v, 0, 0, 0, 5, 13, 1, k.WHITE);
  box(v, 7, 0, 0, 12, 13, 1, k.WHITE);
  box(v, 5, 9, 0, 7, 13, 1, k.WHITE);
  for (let x = 0; x < 12; x++) if (x < 5 || x > 6) v.set(x, 0, 0, x % 2 ? k.CREAM : 0);   // the lace
  for (const x of [2, 9]) v.set(x, 2, 0, k.RED);
  v.set(1, 15, 0, k.WOOD); v.set(10, 15, 0, k.WOOD);   // the pegs
  return hang(v);
}

/** A gingham tea towel on the line. */
function towel(k: Ids) {
  const v = new Volume(7, 10, 1);
  box(v, 0, 0, 0, 7, 10, 1, k.GINGHAM);
  v.set(1, 9, 0, k.WOOD); v.set(5, 9, 0, k.WOOD);
  return hang(v);
}

export const MODELS = {
  table, cloth, chair, sofa, stove, counter, upper, fridge, vitrine, lamp, lampGlow, curtains,
  cup, biscuits, coffeePot, breadBasket, logBasket, geranium, crossword, ragRug, potholder, clock,
  sampler, note, bloomers, towel,
  shelf, jarLingon, jarBlueberry, sack, tin, bulb, bulbGlow, broom,
};
export type ModelKey = keyof typeof MODELS;

/** Every model, built once. */
export function buildModels(k: Ids): Record<ModelKey, Model> {
  const out = {} as Record<ModelKey, Model>;
  for (const key of Object.keys(MODELS) as ModelKey[]) out[key] = MODELS[key](k);
  return out;
}

/** A model's size in metres: [width x, height y, depth z]. */
export const sizeOf = (m: Model): [number, number, number] => [m.vol.sx * m.voxel, m.vol.sy * m.voxel, m.vol.sz * m.voxel];

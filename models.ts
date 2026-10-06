/**
 * The kit models of Mormors hus, three-free: each is a `Volume` and its voxel size, built once by
 * key. Conventions (voxelparty-kvalitet §5): free-standing props have their origin in the middle of
 * their footprint on the ground and face +z; wall pieces have x along the wall and z out of it, with
 * the origin on the wall's face.
 *
 * The detail pass (PLAN.md): furniture at 1/32 m, small things at 1/48–1/64 m, every model the
 * same size in the world as before so placements, collision and forms stay put. This file is the
 * kitchen, the pantry and the garden; each other room has its own file (models-*.ts).
 */
import { Volume } from '@voxelparty/sdk/core';
import {
  angleOf, blob, box, checks, cylZ, dot, grain, hang, hash, lathe, line, prop, roundBox, speckle, stripes, wall, write,
  type Model, type Pick,
} from './kit';
import { LIVING_MODELS } from './models-vardagsrum';
import { HALL_MODELS } from './models-hall';
import { BEDROOM_MODELS } from './models-sovrum';
import { BATH_MODELS } from './models-badrum';
import { SEWING_MODELS } from './models-syrum';
import type { Ids } from './textures';

export { box, type Model } from './kit';

const H = 1 / 32, Q = 1 / 48, S = 1 / 64;
/** Distance of a voxel's centre from (cx, cz). */
const dist = (x: number, z: number, cx: number, cz: number) => Math.hypot(x + 0.5 - cx, z + 0.5 - cz);

// ------------------------------------------------------------ furniture

/** Köksbordet: 2 × 1 m, white turned legs, a drawer, a scrubbed pine top. */
function table(k: Ids) {
  const v = new Volume(64, 24, 32);
  box(v, 0, 22, 0, 64, 24, 32, grain(k, 'x', k.WOOD, 1));
  box(v, 0, 22, 0, 64, 23, 32, k.WOOD_DARK);                  // the top's edge, in shadow underneath
  box(v, 1, 22, 1, 63, 23, 31, grain(k, 'x', k.WOOD, 1));
  box(v, 3, 18, 3, 61, 22, 29, k.WHITE);                      // the apron
  box(v, 22, 18, 28, 42, 22, 29, k.CREAM);                    // the drawer
  box(v, 23, 19, 28, 41, 21, 29, k.WHITE);
  dot(v, 32, 20, 29, k.BRASS);
  for (const [cx, cz] of [[5, 5], [59, 5], [5, 27], [59, 27]]) {
    lathe(v, cx, cz, 0, 14, (y) => (y < 2 ? 2.2 : y < 4 ? 1.5 : y < 7 ? 2.3 : y === 9 ? 2.1 : 1.5), (_x, y) => (y < 2 || y === 9 ? k.CREAM : k.WHITE));
    box(v, cx - 2, 14, cz - 2, cx + 2, 18, cz + 2, k.WHITE);  // the square block under the apron
  }
  return prop(v, H);
}

/** Den virkade duken: lace, holes in rosettes and a scalloped border. */
function cloth(k: Ids) {
  const v = new Volume(44, 1, 24);
  for (let z = 0; z < 24; z++) for (let x = 0; x < 44; x++) {
    const edge = Math.min(x, z, 43 - x, 23 - z);
    if (edge === 0 && (x + z) % 3 === 0) continue;                       // the scallops
    if (edge === 1 && (x + z) % 2) continue;                             // a row of holes
    const rx = ((x - 2) % 10) - 5, rz = ((z - 2) % 10) - 5, r = Math.hypot(rx + 0.5, rz + 0.5);
    if (edge > 2 && r > 2.2 && r < 3.2 && (x * 7 + z * 3) % 2) continue; // the rosettes' rings
    v.set(x, 0, z, edge <= 1 || r < 1.2 ? k.CREAM : k.WHITE);
  }
  return prop(v, H);
}

/** En pinnstol: turned legs, stretchers, a spindle back with a heart in the top rail, a gingham cushion. */
function chair(k: Ids) {
  const v = new Volume(14, 30, 14), g = grain(k, 'x', k.WOOD, 2);
  const leg = (y: number) => (y === 4 || y === 10 ? 1.45 : 1.0);
  for (const [cx, cz] of [[2, 12], [12, 12]]) lathe(v, cx, cz, 0, 14, leg, k.WOOD_DARK);
  for (const cx of [2, 12]) lathe(v, cx, 2, 0, 30, leg, k.WOOD_DARK);   // the back legs run up as posts
  box(v, 1, 5, 2, 3, 6, 12, k.WOOD_DARK);
  box(v, 11, 5, 2, 13, 6, 12, k.WOOD_DARK);
  box(v, 2, 7, 11, 12, 8, 13, k.WOOD_DARK);
  roundBox(v, 0, 14, 0, 14, 16, 14, 2, g);
  box(v, 0, 14, 0, 14, 15, 14, k.WOOD_DARK);
  roundBox(v, 0, 15, 0, 14, 16, 14, 2, g);
  roundBox(v, 1, 16, 3, 13, 17, 14, 2, k.GINGHAM);             // the cushion
  dot(v, 2, 16, 3, k.RED); dot(v, 11, 16, 3, k.RED);           // its ties
  box(v, 1, 21, 1, 13, 22, 3, k.WOOD);
  for (const x of [4, 7, 9]) box(v, x, 17, 1, x + 1, 26, 2, k.WOOD_DARK);
  box(v, 0, 26, 0, 14, 29, 3, g);
  box(v, 3, 29, 0, 11, 30, 3, g);
  dot(v, 0, 28, 0, 0); dot(v, 0, 28, 1, 0); dot(v, 0, 28, 2, 0); dot(v, 13, 28, 0, 0); dot(v, 13, 28, 1, 0); dot(v, 13, 28, 2, 0);
  for (const [x, y] of [[5, 28], [6, 28], [8, 28], [9, 28], [5, 27], [6, 27], [7, 27], [8, 27], [9, 27], [6, 26], [7, 26], [8, 26]]) dot(v, x, y, 2, k.WOOD_DEEP);   // the heart
  return prop(v, H);
}

/** Kökssoffan under fönstren: panelled front, beadboard back, a buttoned gingham cushion, two pillows. */
function sofa(k: Ids) {
  const v = new Volume(56, 30, 18);
  box(v, 1, 0, 1, 55, 2, 17, k.WOOD_DEEP);
  box(v, 0, 2, 0, 56, 12, 18, k.CREAM);
  for (const [x0, x1] of [[2, 18], [20, 36], [38, 54]]) {
    box(v, x0, 3, 17, x1, 11, 18, k.WHITE);
    box(v, x0 + 2, 5, 17, x1 - 2, 9, 18, 0);
  }
  dot(v, 28, 7, 17, k.BRASS);
  box(v, 0, 12, 0, 56, 28, 3, (x) => (x % 4 === 0 ? k.WHITE : k.CREAM));
  box(v, 0, 28, 0, 56, 30, 5, k.WHITE);
  for (const x0 of [0, 54]) {
    box(v, x0, 12, 3, x0 + 2, 21, 18, k.CREAM);
    box(v, x0, 21, 3, x0 + 2, 23, 18, k.WHITE);
  }
  roundBox(v, 2, 12, 3, 54, 16, 18, 2, k.GINGHAM);
  for (let x = 6; x < 54; x += 9) dot(v, x, 15, 10, k.RED);   // the buttons
  roundBox(v, 6, 16, 3, 18, 26, 7, 2, k.WHITE);
  for (const [x, y] of [[11, 22], [13, 22], [10, 21], [11, 21], [12, 21], [13, 21], [14, 21], [11, 20], [12, 20], [13, 20], [12, 19]]) dot(v, x, y, 6, k.RED);
  roundBox(v, 38, 16, 3, 50, 25, 7, 2, k.CREAM);
  for (const [x, y] of [[44, 21], [43, 20], [45, 20], [43, 22], [45, 22]]) dot(v, x, y, 6, k.PORC_BLUE);
  dot(v, 44, 20, 6, k.YELLOW);
  return prop(v, H);
}

/** Vedspisen: cast iron with raised borders, a glowing grate, brass rail and handles, two rings, the pipe. */
function stove(k: Ids) {
  const v = new Volume(32, 80, 24);
  for (const [x, z] of [[0, 0], [29, 0], [0, 19], [29, 19]]) {
    box(v, x, 0, z, x + 3, 2, z + 3, k.IRON);
    box(v, x + (x ? 0 : 1), 2, z + (z ? 0 : 1), x + (x ? 2 : 3), 4, z + (z ? 2 : 3), k.IRON);
  }
  box(v, 0, 4, 0, 32, 24, 22, k.IRON);
  for (const y of [4, 23]) box(v, 0, y, 0, 32, y + 1, 22, k.SOOT);
  box(v, 0, 4, 21, 32, 24, 22, k.SOOT);
  box(v, 1, 5, 21, 31, 23, 22, k.IRON);
  // The firebox: a door with a grate that glows, an ash door under it.
  box(v, 2, 10, 22, 14, 21, 23, k.IRON);
  for (let y = 11; y < 20; y++) for (let x = 3; x < 13; x++) dot(v, x, y, 22, x % 2 ? k.EMBER : k.SOOT);
  dot(v, 13, 15, 23, k.BRASS);
  box(v, 2, 5, 22, 14, 9, 23, k.SOOT);
  box(v, 3, 6, 22, 13, 8, 23, k.IRON);
  dot(v, 8, 7, 23, k.BRASS);
  // The oven door: a raised border, a maker's plate, a brass bar.
  box(v, 16, 6, 22, 30, 21, 23, k.GREY);
  box(v, 17, 7, 22, 29, 20, 23, k.IRON);
  box(v, 20, 10, 22, 26, 12, 23, k.BRASS);
  box(v, 18, 18, 23, 28, 19, 24, k.BRASS);
  // The top: worn grey, two rings with their lids.
  box(v, 0, 24, 0, 32, 26, 22, k.GREY);
  for (const cx of [8, 22]) {
    lathe(v, cx, 11, 25, 26, () => 5.5, k.IRON, () => 4.5);
    lathe(v, cx, 11, 25, 26, () => 2.5, k.IRON, () => 1.5);
    dot(v, cx, 25, 11, k.SOOT);
  }
  box(v, 0, 21, 23, 32, 22, 24, k.BRASS);                    // the towel rail
  for (const x of [0, 31]) box(v, x, 21, 22, x + 1, 23, 24, k.BRASS);
  // The pipe up through the ceiling, its collar and damper knob.
  lathe(v, 16, 6, 26, 80, () => 3.6, k.IRON);
  lathe(v, 16, 6, 26, 28, () => 5, k.SOOT);
  lathe(v, 16, 6, 44, 46, () => 4.6, k.GREY);
  dot(v, 20, 52, 6, k.BRASS); dot(v, 21, 52, 6, k.BRASS);
  return prop(v, H);
}

/** Diskbänken: framed doors and drawers, brass knobs, a steel basin and tap, a dish rack with plates. */
function counter(k: Ids) {
  const v = new Volume(64, 38, 22);
  box(v, 0, 0, 0, 64, 2, 19, k.WOOD_DEEP);
  box(v, 0, 2, 0, 64, 26, 20, k.CREAM);
  for (let i = 0; i < 4; i++) {
    const x0 = i * 16, mid = x0 + 8;
    box(v, x0 + 1, 3, 20, x0 + 15, 18, 21, k.WHITE);
    box(v, x0 + 3, 5, 20, x0 + 13, 16, 21, 0);
    dot(v, i % 2 ? x0 + 3 : x0 + 12, 15, 21, k.BRASS);
    box(v, x0 + 1, 19, 20, x0 + 15, 25, 21, k.WHITE);
    box(v, x0 + 2, 20, 20, x0 + 14, 24, 21, 0);
    box(v, mid - 2, 22, 21, mid + 2, 23, 22, k.BRASS);
  }
  box(v, 0, 26, 0, 64, 28, 22, grain(k, 'x', k.WOOD_DARK, 3));
  // The basin, sunk into the top, a drain in its floor.
  box(v, 35, 20, 3, 59, 28, 18, k.STEEL);
  box(v, 37, 21, 5, 57, 28, 16, 0);
  box(v, 35, 27, 3, 59, 28, 18, k.STEEL_LIGHT);
  box(v, 37, 27, 5, 57, 28, 16, 0);
  dot(v, 47, 21, 10, k.SOOT);
  // The tap: a pillar, a swan neck, a red and a blue handle.
  lathe(v, 47, 2, 28, 35, () => 1.2, k.STEEL_LIGHT);
  box(v, 46, 34, 2, 48, 35, 8, k.STEEL_LIGHT);
  box(v, 46, 33, 7, 48, 34, 8, k.STEEL_LIGHT);
  for (const [x, c] of [[43, k.RED], [51, k.BLUE]] as const) { dot(v, x, 30, 2, k.STEEL_LIGHT); dot(v, x, 31, 2, c); dot(v, x + (x < 47 ? 1 : -1), 30, 2, k.STEEL_LIGHT); }
  // The dish rack: plates on edge, a cup upside down, a brush.
  box(v, 4, 28, 6, 22, 29, 16, k.STEEL);
  for (const x of [6, 9, 12]) for (let y = 29; y < 37; y++) for (let z = 7; z < 15; z++) {
    const r = Math.hypot(y + 0.5 - 33, z + 0.5 - 11);
    if (r < 4) dot(v, x, y, z, r > 3 ? k.PORC_BLUE : r < 1 ? k.GOLD : k.PORC);
  }
  lathe(v, 17.5, 11, 29, 33, (y) => 2.4 - (y - 29) * 0.15, k.PORC);
  box(v, 25, 28, 15, 31, 29, 16, k.WOOD_LIGHT);
  box(v, 23, 28, 14, 25, 30, 17, k.STRAW);
  return prop(v, H);
}

/** Överskåpen: four framed doors, the middle two glazed with plates behind, a crown and brass knobs. */
function upper(k: Ids) {
  const v = new Volume(64, 20, 12);
  box(v, 0, 0, 0, 64, 20, 11, k.CREAM);
  for (let i = 0; i < 4; i++) {
    const x0 = i * 16;
    box(v, x0 + 1, 1, 11, x0 + 15, 18, 12, k.WHITE);
    if (i === 1 || i === 2) {
      box(v, x0 + 3, 3, 11, x0 + 13, 16, 12, k.GLASS);
      for (const cx of [x0 + 5.5, x0 + 10.5]) for (let y = 4; y < 15; y++) for (let x = x0 + 3; x < x0 + 13; x++) {
        const r = Math.hypot(x + 0.5 - cx, y + 0.5 - 9.5);
        if (r < 2.6) dot(v, x, y, 11, r > 1.8 ? k.PORC_BLUE : k.PORC);
      }
      box(v, x0 + 3, 9, 11, x0 + 13, 10, 12, k.WHITE);       // the glazing bar
    } else box(v, x0 + 3, 3, 11, x0 + 13, 16, 12, 0);
    dot(v, i % 2 ? x0 + 3 : x0 + 12, 3, 11, k.BRASS);
  }
  box(v, 0, 18, 0, 64, 20, 12, k.WHITE);
  box(v, 0, 0, 0, 64, 1, 12, k.WHITE);
  return wall(v, H);
}

/** Kylskåpet: a rounded 50s fridge, a chrome lever, the grandchildren's drawings, magnets, the castle card. */
function fridge(k: Ids) {
  const v = new Volume(22, 48, 24);
  box(v, 2, 0, 2, 20, 2, 20, k.GREY);
  roundBox(v, 0, 2, 0, 22, 46, 22, 3, k.WHITE);
  roundBox(v, 1, 46, 1, 21, 47, 21, 3, k.WHITE);
  roundBox(v, 2, 47, 2, 20, 48, 20, 3, k.WHITE);
  box(v, 1, 3, 22, 21, 37, 23, k.WHITE);                      // the doors
  box(v, 1, 38, 22, 21, 45, 23, k.WHITE);
  box(v, 18, 28, 23, 20, 35, 24, k.STEEL_LIGHT);              // the lever
  box(v, 6, 43, 23, 16, 44, 24, k.STEEL_LIGHT);               // the badge
  // A drawing of a house, a sun and mormor; a drawing of Misse; magnets holding them.
  box(v, 2, 21, 23, 10, 31, 24, k.PAPER);
  for (const [x, y, c] of [[8, 29, k.YELLOW], [9, 29, k.YELLOW], [8, 30, k.YELLOW], [3, 24, k.RED], [4, 24, k.RED], [5, 24, k.RED], [3, 25, k.RED], [4, 26, k.RED], [5, 25, k.RED], [4, 25, k.RED],
    [7, 24, k.INK], [7, 25, k.INK], [6, 25, k.INK], [8, 25, k.INK], [7, 26, k.SKIN]] as const) dot(v, x, y, 23, c);
  box(v, 2, 22, 23, 10, 23, 24, k.GREEN);
  box(v, 11, 13, 23, 18, 21, 24, k.PAPER);
  for (const [x, y] of [[13, 15], [14, 15], [15, 15], [13, 16], [14, 16], [15, 16], [16, 16], [13, 17], [15, 17], [16, 14]]) dot(v, x, y, 23, k.CAT);
  for (const [x, y, c] of [[5, 31, k.RED], [14, 21, k.BLUE], [3, 41, k.YELLOW]] as const) dot(v, x, y, 23, c);
  box(v, 3, 39, 23, 11, 44, 24, k.FALU_FLAT);                 // vykortet från slottet
  for (const [x, y] of [[5, 40], [6, 40], [7, 40], [8, 40], [9, 40], [5, 41], [7, 41], [9, 41], [5, 42], [9, 42]]) dot(v, x, y, 23, k.WHITE);
  return prop(v, H);
}

/** Vitrinskåpet: a panelled base with keyholes, open shelves of mormors finservis, a stepped crown. */
function vitrine(k: Ids) {
  const v = new Volume(38, 60, 14);
  box(v, 0, 0, 0, 38, 24, 13, grain(k, 'y', k.WOOD_DARK, 4));
  box(v, 0, 0, 0, 38, 2, 13, k.WOOD_DEEP);
  for (const [x0, x1] of [[1, 19], [19, 37]]) {
    box(v, x0, 3, 13, x1, 22, 14, k.WOOD_DARK);
    box(v, x0 + 3, 6, 13, x1 - 3, 19, 14, 0);
  }
  dot(v, 17, 14, 13, k.BRASS); dot(v, 21, 14, 13, k.BRASS);
  box(v, 0, 24, 0, 38, 26, 14, grain(k, 'x', k.WOOD, 4));
  box(v, 0, 26, 0, 2, 58, 12, k.WOOD_DARK);
  box(v, 36, 26, 0, 38, 58, 12, k.WOOD_DARK);
  box(v, 2, 26, 0, 36, 58, 1, k.MINT_FLAT);
  for (const y of [36, 46]) box(v, 2, y, 1, 36, y + 1, 12, k.WOOD_DARK);
  box(v, 0, 56, 0, 38, 58, 13, k.WOOD_DARK);
  box(v, 1, 58, 0, 37, 60, 14, k.WOOD_DEEP);
  for (const y0 of [26, 37, 47]) {
    // Plates on edge at the back, gold-centred; cups with blue bands in front.
    for (let cx = 6; cx < 34; cx += 7) for (let y = y0; y < y0 + 8; y++) for (let x = cx - 4; x < cx + 4; x++) {
      const r = Math.hypot(x + 0.5 - cx, y + 0.5 - (y0 + 4));
      if (r < 3.8) dot(v, x, y, 1, r > 3 ? k.PORC_BLUE : r < 1 ? k.GOLD : k.PORC);
    }
    if (y0 === 47) continue;
    for (let cx = 7; cx < 34; cx += 8) {
      lathe(v, cx, 8, y0, y0 + 4, () => 1.8, (_x, y) => (y === y0 + 3 ? k.GOLD : y === y0 + 2 ? k.PORC_BLUE : k.PORC));
      dot(v, cx + 2, y0 + 2, 8, k.PORC);
    }
  }
  // The best coffee pot and a vase on the top shelf.
  lathe(v, 10, 7, 47, 55, (y) => 3.2 - Math.abs(y - 50) * 0.3, (_x, y) => (y === 53 ? k.GOLD : k.PORC));
  line(v, [13, 50, 7], [16, 53, 7], k.PORC);
  lathe(v, 28, 7, 47, 54, (y) => (y < 51 ? 2.4 : 1.4), k.PORC_BLUE);
  for (const [x, z] of [[27, 6], [29, 8], [28, 7]]) dot(v, x, 55, z, k.RED);
  return prop(v, H);
}

/** Taklampan: a cream enamel shade with a red line, a brass socket and canopy (hangs from its top). */
function lamp(k: Ids) {
  const v = new Volume(22, 32, 22), r = (y: number) => 3 + (19 - y) * 0.62;
  box(v, 10, 22, 10, 12, 31, 12, k.IRON);
  lathe(v, 11, 11, 31, 32, () => 3, k.BRASS);
  lathe(v, 11, 11, 19, 23, () => 2, k.BRASS);
  lathe(v, 11, 11, 8, 20, r, (_x, y) => (y === 8 ? k.WHITE : y === 10 ? k.RED : k.CREAM), (y) => (y >= 18 ? 0 : r(y) - 1.2));
  return hang(v, 1 / 40);
}

/** The lamp's lit inside and bulb, its own mesh so it can go out. */
function lampGlow(k: Ids) {
  const v = new Volume(22, 32, 22), r = (y: number) => 3 + (19 - y) * 0.62;
  lathe(v, 11, 11, 9, 18, (y) => r(y) - 1.2, k.LAMP, (y) => r(y) - 2.2);
  blob(v, 11, 15, 11, 2, 2.4, 2, k.LAMP);
  return hang(v, 1 / 40);
}

/** Gardinerna for one window: folded gingham panels, red tie-backs, a scalloped valance, a brass rod. */
function curtains(k: Ids) {
  const v = new Volume(52, 38, 6);
  for (let x = 0; x < 52; x++) {
    if (x >= 10 && x < 42) continue;
    const zf = 1 + Math.round(Math.sin(x * 0.9));
    box(v, x, 4, zf, x + 1, 31, zf + 1, k.GINGHAM);
    dot(v, x, 13, zf + 1, k.RED);
    dot(v, x, 14, zf + 1, k.RED);
  }
  box(v, 0, 30, 2, 52, 36, 3, k.GINGHAM);
  for (let x = 0; x < 52; x++) if (x % 6 < 3) dot(v, x, 29, 2, k.GINGHAM);
  for (let x = 0; x < 52; x += 2) dot(v, x, 35, 3, k.WHITE);
  box(v, 0, 36, 0, 52, 37, 1, k.BRASS);
  for (const x of [0, 51]) box(v, x, 35, 0, x + 1, 38, 2, k.BRASS);
  return wall(v, H);
}

// ------------------------------------------------------------ things (what a vätte becomes)

/** En kaffekopp på fat, mormors finservis: gold rims, a blue band, pink roses with leaves, coffee inside. */
function cup(k: Ids) {
  const v = new Volume(19, 11, 15), cx = 7.5, cz = 7.5;
  lathe(v, cx, cz, 0, 1, () => 7.4, (x, _y, z) => { const d = dist(x, z, cx, cz); return d > 6.6 ? k.PORC_BLUE : d > 6 ? k.GOLD : k.PORC; });
  lathe(v, cx, cz, 1, 2, () => 7.4, (x, _y, z) => (dist(x, z, cx, cz) > 6.8 ? k.GOLD : k.PORC), () => 5.6);
  const r = (y: number) => (y < 2 ? 3 : 3.7 + (y - 2) * 0.13);
  const roses = [0.5, 2.1, 3.7, 5.2];
  lathe(v, cx, cz, 1, 11, r, (x, y, z) => {
    if (y === 10) return k.GOLD;
    if (y === 9) return k.PORC_BLUE;
    const a = angleOf(x, z, cx, cz), near = roses.some((ra) => Math.abs(a - ra) < 0.32);
    if (near && y >= 5 && y <= 7) return y === 6 && roses.some((ra) => Math.abs(a - ra) < 0.12) ? k.RED : k.ROSEPINK;
    if (roses.some((ra) => Math.abs(a - ra - 0.45) < 0.15) && y === 5) return k.GREEN;
    return k.PORC;
  }, (y) => (y < 3 ? 0 : r(y) - 1));
  lathe(v, cx, cz, 7, 8, () => r(7) - 1, k.COFFEE);
  line(v, [12.4, 8.5, 7.5], [16.2, 8.5, 7.5], k.PORC);
  line(v, [16.2, 8.5, 7.5], [16.6, 5.5, 7.5], k.PORC);
  line(v, [16.6, 5.5, 7.5], [12.4, 3.8, 7.5], k.PORC);
  return { vol: v, voxel: S, origin: [cx, 0, cz] as [number, number, number], ground: true };
}

/** Ett kakfat med sju sorters kakor (well, five): drömmar, chokladbollar, hallongrottor, a slice of sockerkaka. */
function biscuits(k: Ids) {
  const v = new Volume(24, 8, 24);
  lathe(v, 12, 12, 0, 1, () => 11.6, (x, _y, z) => { const d = dist(x, z, 12, 12); return d > 10.8 ? k.PORC_BLUE : d > 10 ? k.GOLD : k.PORC; });
  lathe(v, 12, 12, 1, 2, () => 11.6, (x, _y, z) => (dist(x, z, 12, 12) > 10.8 ? k.PORC_BLUE : k.PORC), () => 9.8);
  for (const [x, z] of [[6, 7], [11, 5], [6, 13]]) blob(v, x, 2.2, z, 2.6, 1.2, 2.6, speckle(k.COOKIE, k.PAPER, 0.22, x));        // drömmar, cracked on top
  for (const [x, z] of [[12, 11], [16, 7]]) blob(v, x, 3, z, 2.1, 2, 2.1, speckle(k.CHOC, k.WHITE, 0.35, z));                      // chokladbollar in coconut
  for (const [x, z] of [[17, 13], [11, 17]]) {
    lathe(v, x, z, 1, 4, (y) => 2.4 - (y - 1) * 0.2, k.COOKIE);
    dot(v, Math.floor(x), 4, Math.floor(z), k.JAM);                                                                                    // hallongrottor
  }
  box(v, 15, 2, 16, 21, 6, 20, k.YELLOW);                    // sockerkaka, its crust and a sprinkle of sugar
  box(v, 15, 6, 16, 21, 7, 20, speckle(k.COOKIE, k.WHITE, 0.3, 5));
  box(v, 20, 2, 16, 21, 6, 20, k.COOKIE);
  return prop(v, S);
}

/** Kaffepannan: a brass pot flaring at the foot, a lid with a wooden knob, a long spout, a wooden handle. */
function coffeePot(k: Ids) {
  const v = new Volume(22, 20, 13), cx = 9.5, cz = 6.5;
  lathe(v, cx, cz, 0, 14, (y) => (y < 1 ? 5.4 : y < 2 ? 6.2 : 6.2 - (y - 2) * 0.2), (_x, y) => (y === 2 || y === 12 ? k.GOLD : y === 0 ? k.WOOD_DEEP : k.BRASS));
  lathe(v, cx, cz, 14, 16, (y) => (y === 14 ? 4 : 3), k.BRASS);
  lathe(v, cx, cz, 16, 18, () => 1.5, k.WOOD_DEEP);
  line(v, [14.5, 4, 6.5], [20.5, 12.5, 6.5], k.BRASS, 1.1);
  box(v, 0, 4, 6, 2, 13, 8, k.WOOD_DEEP);
  box(v, 2, 12, 6, 5, 13, 8, k.BRASS);
  box(v, 2, 4, 6, 5, 5, 8, k.BRASS);
  return prop(v, Q);
}

/** Brödkorgen: a woven basket with a braided rim, a scored loaf, two kanelbullar, a gingham cloth over the side. */
function breadBasket(k: Ids) {
  const v = new Volume(19, 10, 14), weave: Pick = (x, y, z) => ((x + y + z) % 2 ? k.WICKER : k.WICKER_DARK);
  roundBox(v, 0, 0, 0, 19, 6, 14, 5, weave);
  roundBox(v, 1, 1, 1, 18, 6, 13, 4, 0);
  roundBox(v, 0, 6, 0, 19, 7, 14, 5, (x) => (x % 2 ? k.WICKER_DARK : k.WOOD_DARK));
  roundBox(v, 1, 6, 1, 18, 7, 13, 4, 0);
  blob(v, 12, 6, 7, 4.6, 2.4, 3.2, (x, y) => (y > 6 && x % 3 === 0 ? k.COOKIE : k.BREAD));
  for (const [x, z] of [[5, 4], [5, 10]]) blob(v, x, 6.3, z, 2.3, 1.3, 2.3, (xx, y, zz) => (y > 6 && hash(xx, y, zz) < 0.3 ? k.WHITE : (Math.round(Math.hypot(xx - x, zz - z) * 1.6) % 2 ? k.CHOC : k.BREAD)));
  box(v, 1, 6, 9, 9, 7, 14, k.GINGHAM);
  box(v, 2, 2, 13, 8, 6, 14, k.GINGHAM);
  return prop(v, Q);
}

/** Vedkorgen: a woven basket with handles, birch logs with bark and pale cut ends. */
function logBasket(k: Ids) {
  const v = new Volume(18, 16, 14);
  box(v, 0, 0, 0, 18, 10, 14, (x, y, z) => ((x + z + y) % 3 === 0 ? k.WOOD_DEEP : k.WICKER_DARK));
  box(v, 1, 1, 1, 17, 10, 13, 0);
  box(v, 0, 9, 0, 18, 10, 14, k.WOOD_DEEP);
  box(v, 1, 9, 1, 17, 10, 13, 0);
  for (const x of [0, 17]) {
    box(v, x, 10, 4, x + 1, 13, 5, k.WOOD_DEEP);
    box(v, x, 10, 9, x + 1, 13, 10, k.WOOD_DEEP);
    box(v, x, 12, 5, x + 1, 13, 9, k.WOOD_DEEP);
  }
  const bark = speckle(k.WHITE, k.SOOT, 0.13, 9);
  for (const [x, y] of [[4.5, 8], [9, 8], [13.5, 8], [6.8, 11.6], [11.2, 11.6], [9, 13.6]]) {
    cylZ(v, x, y, 2.3, 1, 13, bark);
    cylZ(v, x, y, 1.6, 12, 13, k.WOOD_LIGHT);
    cylZ(v, x, y, 1.6, 1, 2, k.WOOD_LIGHT);
    dot(v, Math.floor(x), Math.floor(y), 12, k.WOOD);
  }
  return prop(v, H);
}

/** En pelargon i kruka: a terracotta pot on a saucer, round leaves with a dark zone, three red umbels. */
function geranium(k: Ids) {
  const v = new Volume(14, 22, 14);
  lathe(v, 7, 7, 0, 1, () => 5.6, k.POT);
  lathe(v, 7, 7, 1, 9, (y) => (y >= 7 ? 5.4 : 4 + y * 0.17), (_x, y) => (y === 7 ? k.COOKIE : k.POT));
  lathe(v, 7, 7, 8, 9, () => 4.6, k.WOOD_DEEP);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3, r = 3.4;
    blob(v, 7 + Math.cos(a) * r, 10.5 + (i % 3) * 0.9, 7 + Math.sin(a) * r, 2.3, 0.9, 2.3, speckle(k.GREEN, k.LEAF_DARK, 0.3, i));
  }
  for (const [fx, fy, fz] of [[5, 18.5, 5], [9.5, 19.5, 8], [5.5, 17.5, 10]]) {
    line(v, [7, 9, 7], [fx, fy - 1.5, fz], k.GREEN);
    blob(v, fx, fy, fz, 2.2, 1.7, 2.2, speckle(k.RED, k.ROSEPINK, 0.28, fx));
  }
  return prop(v, Q);
}

/** Korsordet: yesterday's paper folded open, a half-solved crossword, a pencil. */
function crossword(k: Ids) {
  const v = new Volume(19, 2, 24);
  box(v, 0, 0, 0, 19, 1, 24, k.PAPER);
  box(v, 0, 0, 12, 19, 1, 13, k.PORC_SHADE);
  for (let z = 2; z < 11; z++) for (let x = 2; x < 17; x++) dot(v, x, 0, z, hash(x, 0, z, 3) < 0.22 ? k.INK : hash(x, 1, z) < 0.35 ? k.PORC_SHADE : k.WHITE);
  for (let z = 14; z < 23; z += 2) for (let x = 2; x < 17; x++) if (hash(x, 2, z) < 0.7) dot(v, x, 0, z, k.GREY);
  line(v, [11.5, 1.5, 14.5], [16.5, 1.5, 21.5], k.YELLOW);
  dot(v, 11, 1, 14, k.INK);
  dot(v, 16, 1, 21, k.PINK);
  return prop(v, Q);
}

/** Trasmattan: a woven rag rug in the house's colours, with fringes. */
function ragRug(k: Ids) {
  const v = new Volume(24, 1, 56);
  const colours = [k.FALU_FLAT, k.CREAM, k.WOOD_DARK, k.CREAM, k.MINT_FLAT, k.CREAM, k.GREY, k.CREAM, k.QUILT_BLUE, k.CREAM];
  for (let z = 0; z < 56; z++) for (let x = 0; x < 24; x++) {
    if (z === 0 || z === 55) { if (x % 2) v.set(x, 0, z, k.CREAM); continue; }
    const c = colours[Math.floor((z - 1) / 3) % colours.length];
    v.set(x, 0, z, hash(x, 0, z, 11) < 0.12 ? k.CREAM : c);
  }
  return prop(v, H);
}

/** Grytlappar on the rail: a crocheted square with a loop (hangs from its top). */
function potholder(k: Ids) {
  const v = new Volume(8, 10, 1);
  box(v, 0, 0, 0, 8, 8, 1, checks(k.WHITE, k.RED, 2));
  box(v, 0, 0, 0, 8, 1, 1, k.RED); box(v, 0, 7, 0, 8, 8, 1, k.RED); box(v, 0, 0, 0, 1, 8, 1, k.RED); box(v, 7, 0, 0, 8, 8, 1, k.RED);
  dot(v, 3, 8, 0, k.RED); dot(v, 4, 8, 0, k.RED); dot(v, 2, 9, 0, k.RED); dot(v, 5, 9, 0, k.RED); dot(v, 3, 9, 0, k.RED); dot(v, 4, 9, 0, k.RED);
  return hang(v, 1 / 40);
}

/** Köksklockan: a brass rim, a white face with hour marks, black hands (a wall piece). */
function clock(k: Ids) {
  const v = new Volume(14, 14, 2);
  for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
    const d = Math.hypot(x + 0.5 - 7, y + 0.5 - 7);
    if (d > 6.9) continue;
    dot(v, x, y, 0, d > 5.9 ? k.BRASS : k.WHITE);
    if (d > 5.9) dot(v, x, y, 1, k.BRASS);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dot(v, Math.floor(7 + Math.sin(a) * 5), Math.floor(7 + Math.cos(a) * 5), 0, i % 3 ? k.GREY : k.INK);
  }
  line(v, [7, 7, 0.5], [7, 11, 0.5], k.INK);
  line(v, [7, 7, 0.5], [9.6, 6.2, 0.5], k.INK);
  dot(v, 7, 7, 1, k.BRASS);
  return wall(v, H);
}

/** Bonaden "MORMORS KÖK": a cross-stitched panel with a red and green border. */
function sampler(k: Ids) {
  const text = 'MORMORS KÖK', w = text.length * 4 + 5, h = 11;
  const v = new Volume(w, h, 2);
  box(v, 0, 0, 0, w, h, 1, k.CREAM);
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) v.set(x, y, 0, x % 2 ? k.RED : k.GREEN);
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) v.set(x, y, 0, y % 2 ? k.RED : k.GREEN);
  write(v, text, 3, h - 3, 1, k.FALU_FLAT);
  return wall(v, 1 / 48);
}

/** Lappen på kylen: "GLÖM EJ KAFFET!" in pencil on yellow paper. */
function note(k: Ids) {
  const text = 'GLÖM EJ KAFFET!', w = text.length * 4 + 1, h = 7;
  const v = new Volume(w, h, 2);
  box(v, 0, 0, 0, w, h, 1, k.YELLOW);
  write(v, text, 1, h - 2, 1, k.INK);
  return wall(v, 1 / 96);
}

// ------------------------------------------------------------ skafferiet

/** En skafferihylla: grained uprights and boards, a lip on each, scalloped shelf paper with a red edge. */
function shelf(k: Ids) {
  const v = new Volume(42, 64, 12);
  box(v, 0, 0, 0, 2, 64, 12, grain(k, 'y', k.WOOD_DARK, 5));
  box(v, 40, 0, 0, 42, 64, 12, grain(k, 'y', k.WOOD_DARK, 6));
  for (const y of [2, 16, 30, 44, 58]) {
    box(v, 2, y, 0, 40, y + 2, 12, grain(k, 'x', k.WOOD, y));
    box(v, 2, y + 2, 11, 40, y + 3, 12, k.WOOD_DARK);
    if (y > 2) for (let x = 2; x < 40; x++) {
      if (x % 4 < 3) dot(v, x, y - 1, 11, k.PAPER);
      if (x % 4 === 1) dot(v, x, y - 2, 11, k.RED);
    }
  }
  box(v, 0, 62, 0, 42, 64, 12, k.WOOD_DARK);
  return prop(v, H);
}

/** A jam jar: the jam's colour through the glass with glints, a label with a coloured border and handwriting, a gingham cloth tied on. */
function jar(k: Ids, jam: number, h: number, w: number) {
  const c = w / 2, v = new Volume(w, h + 3, w);
  const r = (y: number) => (y < h - 2 ? c - 0.3 : c - 1.3);
  lathe(v, c, c, 0, h, r, (x, y, z) => {
    const a = angleOf(x, z, c, c);
    if (y === 0) return k.GLASS;
    if (y >= h - 3) return k.GLASS;
    if (a > 0.3 && a < 2.6 && y >= 3 && y <= h - 6) return y === 3 || y === h - 6 ? (jam === k.BERRY ? k.BLUE : k.RED) : hash(x, y, z) < 0.25 && y > 4 && y < h - 7 ? k.INK : k.PAPER;
    if (Math.abs(a - 4.2) < 0.25) return k.GLASS;     // a glint down the side
    return hash(x, y, z, 2) < 0.12 ? k.JAM : jam;
  });
  const cloth = checks(k.RED, k.WHITE);
  lathe(v, c, c, h, h + 1, () => c + 0.5, cloth);
  lathe(v, c, c, h + 1, h + 2, () => c - 1.2, cloth);
  lathe(v, c, c, h - 1, h, () => c + 0.4, cloth, () => c - 0.9);
  lathe(v, c, c, h - 2, h - 1, () => c - 0.5, k.WHITE, () => c - 1.4);   // the string round the neck
  dot(v, Math.floor(c), h + 2, Math.floor(c), k.RED);
  return { vol: v, voxel: S, origin: [c, 0, c] as [number, number, number], ground: true };
}
/** Lingon in a tall jar; blueberries in a low, wide one. */
const jarLingon = (k: Ids) => jar(k, k.RED, 17, 14);
const jarBlueberry = (k: Ids) => jar(k, k.BERRY, 13, 18);

/** En mjölpåse: a paper sack bulging at the foot, a folded top, "MJÖL" and a wheat sheaf in blue, flour round it. */
function sack(k: Ids) {
  const v = new Volume(20, 22, 16), paper = speckle(k.PAPER, k.KRAFT, 0.15, 4);
  for (let y = 0; y < 17; y++) {
    const inset = y < 1 ? 1 : y > 13 ? y - 13 : 0;
    roundBox(v, inset, y, inset, 20 - inset, y + 1, 16 - inset, 3, paper);
  }
  box(v, 3, 17, 4, 17, 19, 12, k.KRAFT);
  box(v, 3, 19, 6, 17, 21, 10, paper);
  box(v, 3, 20, 7, 17, 21, 8, k.KRAFT);
  box(v, 1, 3, 15, 19, 5, 16, k.BLUE);
  write(v, 'MJÖL', 3, 13, 15, k.BLUE);
  for (const [x, y] of [[9, 7], [10, 7], [11, 7], [8, 8], [10, 8], [12, 8], [10, 6], [10, 5]]) dot(v, x, y, 15, k.STRAW);
  for (let x = 0; x < 20; x++) for (const z of [0, 15]) if (hash(x, 0, z) < 0.5) dot(v, x, 0, z, k.WHITE);
  return { vol: v, voxel: S, origin: [10, 0, 8] as [number, number, number], ground: true };
}

/** En pepparkaksburk: a round red tin, gold bands, white hearts and a gingerbread man, a star on the lid. */
function tin(k: Ids) {
  const v = new Volume(18, 18, 18), c = 9;
  const man = ['.###.', '.###.', '#####', '.###.', '.###.', '.#.#.', '#...#'];
  lathe(v, c, c, 0, 15, () => 8.4, (x, y, z) => {
    if (y === 1 || y === 13) return k.GOLD;
    const a = angleOf(x, z, c, c), u = Math.round((a - Math.PI / 2) * 8.4) + 2, row = 11 - y;
    if (u >= 0 && u < 5 && row >= 0 && row < 7 && man[row][u] === '#') return k.COOKIE;
    if ((Math.floor(a * 3) + y) % 4 === 0 && y > 2 && y < 12 && Math.abs(a - Math.PI / 2) > 0.5) return k.WHITE;
    return k.RED;
  });
  lathe(v, c, c, 15, 17, (y) => (y === 15 ? 8.8 : 8.2), (_x, y) => (y === 15 ? k.GOLD : k.RED));
  for (const [x, z] of [[9, 9], [8, 9], [10, 9], [9, 8], [9, 10], [7, 9], [11, 9], [9, 7], [9, 11], [8, 8], [10, 10], [8, 10], [10, 8]]) dot(v, x, 17, z, k.YELLOW);
  return { vol: v, voxel: S, origin: [c, 0, c] as [number, number, number], ground: true };
}

/** Skafferiets glödlampa: a cord and a brass socket (hangs from its top). */
function bulb(k: Ids) {
  const v = new Volume(10, 36, 10);
  box(v, 4, 14, 4, 6, 36, 6, k.IRON);
  lathe(v, 5, 5, 10, 14, () => 2, (_x, y) => (y === 12 ? k.GOLD : k.BRASS));
  return { vol: v, voxel: S, origin: [5, 36, 5] as [number, number, number], ground: false };
}

/** The bulb's pear-shaped glass, its own mesh so it can go out. */
function bulbGlow(k: Ids) {
  const v = new Volume(10, 36, 10);
  lathe(v, 5, 5, 0, 10, (y) => (y < 1 ? 1.5 : y < 7 ? 3.2 : 3.2 - (y - 6) * 0.45), k.LAMP);
  return { vol: v, voxel: S, origin: [5, 36, 5] as [number, number, number], ground: false };
}

/** En kvast: a grained handle with a hanging hole, a red binding and wire, a fan of straw. */
function broom(k: Ids) {
  const v = new Volume(18, 84, 6);
  lathe(v, 9, 3, 18, 84, () => 1.2, grain(k, 'y', k.WOOD, 7));
  dot(v, 8, 80, 2, 0); dot(v, 9, 80, 2, 0);
  lathe(v, 9, 3, 14, 18, () => 3.2, (_x, y) => (y === 16 ? k.STEEL : k.RED));
  for (let y = 0; y < 14; y++) {
    const hw = 3.5 + (14 - y) * 0.33;
    box(v, Math.round(9 - hw), y, 0, Math.round(9 + hw), y + 1, 6, (x, yy, z) => (yy < 2 && hash(x, yy, z) < 0.3 ? 0 : hash(x, 0, z, 8) < 0.3 ? k.COOKIE : k.STRAW));
  }
  return { vol: v, voxel: Q, origin: [9, 0, 3] as [number, number, number], ground: true };
}

// ------------------------------------------------------------ the garden's small things

/** Mormors mammelucker: long white bloomers with lace and red ribbons, pegged on the line. */
function bloomers(k: Ids) {
  const v = new Volume(24, 32, 2);
  box(v, 0, 26, 0, 24, 32, 1, k.WHITE);
  box(v, 0, 0, 0, 10, 26, 1, k.WHITE);
  box(v, 14, 0, 0, 24, 26, 1, k.WHITE);
  box(v, 10, 18, 0, 14, 26, 1, k.WHITE);
  for (let x = 0; x < 24; x++) if (x < 10 || x > 13) { dot(v, x, 0, 0, x % 2 ? k.CREAM : 0); dot(v, x, 1, 0, x % 3 ? k.WHITE : k.CREAM); }
  for (const x of [4, 19]) { dot(v, x, 4, 1, k.RED); dot(v, x - 1, 5, 1, k.RED); dot(v, x + 1, 5, 1, k.RED); }
  box(v, 0, 31, 0, 24, 32, 1, k.CREAM);
  for (const x of [2, 21]) box(v, x, 30, 1, x + 1, 32, 2, k.WOOD);
  return hang(v, H);
}

/** A gingham tea towel on the line. */
function towel(k: Ids) {
  const v = new Volume(14, 20, 2);
  box(v, 0, 0, 0, 14, 20, 1, k.GINGHAM);
  box(v, 0, 2, 0, 14, 3, 1, k.RED);
  for (const x of [2, 11]) box(v, x, 18, 1, x + 1, 20, 2, k.WOOD);
  return hang(v, H);
}

const KITCHEN_MODELS = {
  table, cloth, chair, sofa, stove, counter, upper, fridge, vitrine, lamp, lampGlow, curtains,
  cup, biscuits, coffeePot, breadBasket, logBasket, geranium, crossword, ragRug, potholder, clock,
  sampler, note, bloomers, towel,
  shelf, jarLingon, jarBlueberry, sack, tin, bulb, bulbGlow, broom,
};

export const MODELS = { ...KITCHEN_MODELS, ...LIVING_MODELS, ...HALL_MODELS, ...BEDROOM_MODELS, ...BATH_MODELS, ...SEWING_MODELS };
export type ModelKey = keyof typeof MODELS;

/** Every model, built once. */
export function buildModels(k: Ids): Record<ModelKey, Model> {
  const out = {} as Record<ModelKey, Model>;
  for (const key of Object.keys(MODELS) as ModelKey[]) out[key] = (MODELS[key] as (k: Ids) => Model)(k);
  return out;
}

/** A model's size in metres: [width x, height y, depth z]. */
export const sizeOf = (m: Model): [number, number, number] => [m.vol.sx * m.voxel, m.vol.sy * m.voxel, m.vol.sz * m.voxel];

// Kept for the files that still use them.
export { stripes };

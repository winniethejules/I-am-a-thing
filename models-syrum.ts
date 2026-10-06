/**
 * Syrummet (three-free): the treadle sewing machine, balls of yarn in three colours and their
 * basket, the painted chests, the dress form with a dress half pinned, fabric bolts, the cookie tin
 * full of buttons, the ironing board and iron, the work table. Furniture at 1/32 m, small things finer.
 */
import { Volume } from '@voxelparty/sdk/core';
import { angleOf, blob, box, cylX, dot, grain, hash, lathe, line, prop, roundBox, write, type Paint } from './kit';
import type { Ids } from './textures';

const H = 1 / 32, Q = 1 / 48, S = 1 / 64;

/** Symaskinen: a black machine with gold decals on a wooden table, an iron treadle frame with a wheel, a red spool, fabric under the foot. */
function sewingMachine(k: Ids) {
  const v = new Volume(30, 34, 16);
  // The iron frame: two lattice sides, the treadle, the big wheel.
  for (const x0 of [1, 26]) for (let y = 0; y < 22; y++) for (let z = 1; z < 15; z++) {
    const edge = y < 2 || y > 19 || z < 3 || z > 12;
    if (edge || (y + z) % 5 === 0 || (y - z + 40) % 5 === 0) box(v, x0, y, z, x0 + 3, y + 1, z + 1, k.IRON);
  }
  box(v, 4, 3, 4, 26, 4, 12, k.IRON);
  for (let x = 6; x < 24; x += 2) dot(v, x, 4, 8, k.SOOT);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    dot(v, 25, Math.floor(12 + Math.sin(a) * 6), Math.floor(8 + Math.cos(a) * 6), k.IRON);
  }
  box(v, 0, 22, 0, 30, 24, 16, grain(k, 'x', k.WOOD, 100));
  box(v, 6, 24, 4, 26, 26, 12, k.SOOT);                     // the bed
  box(v, 20, 26, 5, 25, 33, 11, k.SOOT);                    // the column
  box(v, 9, 30, 6, 25, 34, 10, k.SOOT);                     // the arm
  box(v, 7, 26, 6, 10, 34, 10, k.SOOT);                     // the head
  for (const [x, y] of [[12, 32], [14, 33], [16, 32], [18, 33], [21, 30], [22, 28]]) dot(v, x, y, 10, k.GOLD);
  write(v, 'SVEA', 11, 33, 10, k.GOLD);
  box(v, 8, 24, 7, 9, 26, 9, k.STEEL_LIGHT);                // the needle
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; dot(v, 26, Math.floor(30 + Math.sin(a) * 3), Math.floor(8 + Math.cos(a) * 3), k.STEEL_LIGHT); }
  lathe(v, 16, 8, 34, 34, () => 1, k.RED);
  box(v, 15, 33, 7, 17, 34, 9, k.RED);                       // the spool on its pin
  box(v, 3, 24, 2, 12, 25, 14, k.PINK);                      // the fabric being sewn
  return prop(v, H);
}

/** Ett garnnystan: a ball of wool wound round and round, a loose end. */
function yarn(k: Ids, a: number, b: number) {
  const v = new Volume(14, 13, 16);
  const wound: Paint = (x, y, z) => (Math.floor((x * 0.7 + y * 1.1 - z * 0.5) / 1.5) % 2 ? a : b);
  blob(v, 7, 6.2, 7, 6, 6, 6, wound);
  line(v, [7, 1, 12], [6, 0.5, 15.5], a);
  return prop(v, S);
}

/** Garnkorgen: a low basket of yarn with knitting needles and a half-knitted sock. */
function yarnBasket(k: Ids) {
  const v = new Volume(20, 14, 16);
  roundBox(v, 0, 0, 0, 20, 7, 16, 5, (x, y, z) => ((x + y + z) % 2 ? k.WICKER : k.WICKER_DARK));
  roundBox(v, 1, 1, 1, 19, 7, 15, 4, 0);
  for (const [x, z, c1, c2] of [[6, 6, k.ALLMOGE_RED, k.RED], [13, 6, k.ALLMOGE, k.QUILT_BLUE], [9, 11, k.STRAW, k.YELLOW]] as const)
    blob(v, x, 6, z, 3.6, 3.4, 3.6, (xx, y, zz) => (Math.floor((xx + y * 1.4 - zz) / 1.4) % 2 ? c1 : c2));
  line(v, [4, 8, 3], [17, 13, 12], k.STEEL_LIGHT);
  line(v, [5, 8, 12], [16, 13, 3], k.STEEL_LIGHT);
  box(v, 13, 9, 9, 17, 11, 13, k.CREAM);
  return prop(v, H);
}

/** En kista: an allmoge chest painted blue with kurbits and the year, iron bands, a curved lid, handles. */
function chest(k: Ids) {
  const v = new Volume(34, 22, 18);
  box(v, 0, 0, 0, 34, 2, 18, k.WOOD_DEEP);
  box(v, 1, 2, 1, 33, 15, 17, k.ALLMOGE);
  for (let x = 1; x < 33; x++) { const top = 15 + Math.round(5 * Math.sin(((x - 1) / 31) * Math.PI) ** 0.5); box(v, x, 15, 1, x + 1, top, 17, k.ALLMOGE); }
  for (const x of [3, 30]) for (let y = 2; y < 21; y++) for (const z of [0, 17]) dot(v, x, y, z, k.IRON);
  box(v, 4, 4, 17, 30, 13, 18, k.CREAM);
  for (const [cx, cy] of [[9, 9], [25, 9]]) for (const [dx, dy, c] of [[0, 0, k.YELLOW], [-1, 0, k.ALLMOGE_RED], [1, 0, k.ALLMOGE_RED], [0, 1, k.ALLMOGE_RED], [0, -1, k.ALLMOGE_RED], [-2, -1, k.GREEN], [2, -1, k.GREEN], [-2, 2, k.WHITE], [2, 2, k.WHITE]] as const) dot(v, cx + dx, cy + dy, 17, c);
  write(v, '1896', 10, 11, 17, k.ALLMOGE_RED);
  box(v, 15, 13, 17, 19, 15, 18, k.IRON);
  dot(v, 17, 13, 17, k.SOOT);
  for (const x of [0, 33]) box(v, x, 9, 7, x + 1, 10, 11, k.IRON);
  return prop(v, H);
}

/** Provdockan: a linen torso on a turned stand and tripod, a pink dress pinned on, a yellow tape measure round the neck. */
function dressForm(k: Ids) {
  const v = new Volume(18, 54, 16);
  for (const a of [0.5, 2.6, 4.7]) line(v, [9, 2, 8], [9 + Math.cos(a) * 8, 0, 8 + Math.sin(a) * 7], k.WOOD_DARK, 0.7);
  lathe(v, 9, 8, 2, 26, (y) => (y % 8 === 0 ? 1.6 : 0.9), k.WOOD_DARK);
  const r = (y: number) => {
    const t = (y - 24) / 26;
    return 5.8 - 2.2 * Math.sin(t * Math.PI * 1.6) + (t > 0.85 ? -(t - 0.85) * 22 : 0);
  };
  lathe(v, 9, 8, 24, 50, r, (x, y, z) => {
    const a = angleOf(x, z, 9, 8), front = Math.abs(a - Math.PI / 2) < 1.6;
    if (y === 44) return k.YELLOW;
    if (front && y < 42) return hash(x, y, z, 101) < 0.04 ? k.STEEL_LIGHT : k.PINK;
    return k.KRAFT;
  });
  lathe(v, 9, 8, 50, 54, () => 1.2, k.WOOD_DARK);
  lathe(v, 9, 8, 24, 27, () => 7, k.PINK, () => 5.4);         // the hem of the skirt, flared
  line(v, [13, 44, 12], [14, 36, 14], k.YELLOW);
  return prop(v, H);
}

/** En tygbal: a bolt of floral cotton on a card core, a loose end of fabric. */
function fabricBolt(k: Ids) {
  const v = new Volume(30, 10, 10);
  const floral: Paint = (x, y, z) => { const h = hash(x, y, z, 102); return h < 0.08 ? k.PINK : h < 0.12 ? k.GREEN : h < 0.14 ? k.ALLMOGE_RED : k.CREAM; };
  cylX(v, 5, 5, 4.6, 0, 28, floral);
  cylX(v, 5, 5, 1.6, 28, 30, k.KRAFT);
  cylX(v, 5, 5, 1.6, 0, 1, k.KRAFT);
  for (let x = 2; x < 26; x += 6) for (let y = 0; y < 10; y++) dot(v, x, y, 9, k.WOOD_LIGHT);
  box(v, 4, 0, 9, 24, 1, 10, floral);
  return prop(v, H);
}

/** Sybehörsburken: a blue cookie tin that says KAKOR (it's full of buttons), its lid a little loose. */
function sewingTin(k: Ids) {
  const v = new Volume(18, 16, 18), c = 9;
  lathe(v, c, c, 0, 12, () => 8.4, (x, y, z) => (y === 1 || y === 10 ? k.GOLD : k.ALLMOGE));
  write(v, 'KAKOR', 0, 8, 17, k.WHITE);
  lathe(v, c, c, 12, 14, () => 8.8, (_x, y) => (y === 12 ? k.GOLD : k.ALLMOGE));
  for (const [x, z, col] of [[3, 7, k.RED], [4, 11, k.YELLOW], [14, 8, k.WHITE]] as const) dot(v, x, 12, z, col);   // buttons spilling from under the lid
  return prop(v, S);
}

/** Strykbrädan: a padded board on crossed legs with an iron standing on its end. */
function ironingBoard(k: Ids) {
  const v = new Volume(48, 30, 14);
  for (let x = 0; x < 48; x++) {
    const w = x < 10 ? Math.round(3 + x * 0.4) : 7;
    box(v, x, 27, 7 - w, x + 1, 29, 7 + w, x % 3 === 0 ? k.QUILT_BLUE : k.CREAM);
  }
  line(v, [10, 27, 7], [36, 0, 7], k.STEEL, 1);
  line(v, [36, 27, 7], [10, 0, 7], k.STEEL, 1);
  box(v, 38, 29, 4, 44, 30, 10, k.STEEL_LIGHT);
  return prop(v, H);
}

/** Strykjärnet: an old iron with a chrome sole, a black handle and a cloth cord. */
function iron(k: Ids) {
  const v = new Volume(10, 12, 18);
  for (let z = 0; z < 18; z++) {
    const w = z > 11 ? Math.round(5 - (z - 11) * 0.7) : 5;
    if (w <= 0) continue;
    box(v, 5 - w, 0, z, 5 + w, 1, z + 1, k.STEEL_LIGHT);
    box(v, 5 - w + 1, 1, z, 5 + w - 1, 4, z + 1, k.STEEL_LIGHT);
  }
  box(v, 4, 4, 3, 6, 9, 5, k.SOOT);
  box(v, 4, 9, 3, 6, 11, 15, k.SOOT);
  box(v, 4, 4, 13, 6, 9, 15, k.SOOT);
  for (let z = 0; z < 4; z++) dot(v, 5, 6 - z % 2, z, k.STRAW);
  return prop(v, S);
}

/** Arbetsbordet: a sturdy table with cut-out pattern pieces, big scissors, a tomato pin cushion and a tape measure. */
function workTable(k: Ids) {
  const v = new Volume(48, 26, 28);
  box(v, 0, 22, 0, 48, 24, 28, grain(k, 'x', k.WOOD, 103));
  for (const [x, z] of [[1, 1], [45, 1], [1, 25], [45, 25]]) box(v, x, 0, z, x + 2, 22, z + 2, k.WOOD_DARK);
  box(v, 2, 6, 2, 46, 7, 26, k.WOOD_DARK);
  box(v, 4, 7, 4, 18, 9, 20, k.FELT);                        // folded fabric on the shelf
  box(v, 20, 7, 4, 32, 10, 18, k.MOSS_VELVET);
  box(v, 4, 24, 4, 22, 25, 18, k.KRAFT);                     // a paper pattern, pinned
  for (const [x, z] of [[5, 5], [21, 5], [5, 17], [21, 17]]) dot(v, x, 25, z, k.STEEL_LIGHT);
  line(v, [26, 24.5, 8], [36, 24.5, 14], k.STEEL_LIGHT);     // the scissors
  line(v, [26, 24.5, 14], [36, 24.5, 8], k.STEEL_LIGHT);
  for (const [x, z] of [[24, 7], [24, 15]]) dot(v, x, 24, z, k.SOOT);
  blob(v, 40, 25.5, 20, 2.6, 1.8, 2.6, k.RED);              // the tomato pin cushion
  dot(v, 40, 26, 20, k.GREEN); dot(v, 39, 26, 19, k.STEEL_LIGHT); dot(v, 41, 26, 21, k.STEEL_LIGHT);
  for (let x = 30; x < 44; x++) dot(v, x, 24, 24, x % 2 ? k.YELLOW : k.INK);
  return prop(v, H);
}

export const SEWING_MODELS = {
  sewingMachine, yarnRed: (k: Ids) => yarn(k, k.ALLMOGE_RED, k.RED), yarnBlue: (k: Ids) => yarn(k, k.ALLMOGE, k.QUILT_BLUE),
  yarnYellow: (k: Ids) => yarn(k, k.STRAW, k.YELLOW), yarnBasket, chest, dressForm, fabricBolt, sewingTin, ironingBoard, iron, workTable,
};
export { roundBox };

/**
 * Sovrummet (three-free): the bed with its patchwork quilt and painted headboard, pillows, the
 * nightstand, the alarm clock, the false teeth in their glass, the painted dresser, slippers, hat
 * boxes, the wardrobe, a painting, a bedside lamp. Furniture at 1/32 m, small things finer.
 */
import { Volume } from '@voxelparty/sdk/core';
import { angleOf, blob, box, cylZ, dot, grain, hash, lathe, line, prop, roundBox, wall, type Paint } from './kit';
import type { Ids } from './textures';

const H = 1 / 32, Q = 1 / 48, S = 1 / 64;

/** Kurbits: allmoge flowers painted on a flat face — a red bloom, yellow heart, green leaves, white curls. */
function kurbits(k: Ids, cx: number, cy: number, set: (x: number, y: number, c: number) => void) {
  for (const [dx, dy, c] of [
    [0, 0, k.YELLOW], [-1, 0, k.ALLMOGE_RED], [1, 0, k.ALLMOGE_RED], [0, 1, k.ALLMOGE_RED], [0, -1, k.ALLMOGE_RED], [-1, 1, k.RED], [1, 1, k.RED],
    [-2, -1, k.GREEN], [2, -1, k.GREEN], [-3, -2, k.GREEN], [3, -2, k.GREEN], [-2, 2, k.WHITE], [2, 2, k.WHITE], [0, 3, k.WHITE], [0, -2, k.GREEN],
  ] as const) set(cx + dx, cy + dy, c);
}

/** Sängen: a painted allmoge headboard with kurbits, a lower footboard, a patchwork quilt, a crocheted edge. */
function bed(k: Ids) {
  const v = new Volume(40, 36, 64);
  const patches = [k.QUILT_BLUE, k.PINK, k.CREAM, k.MOSS_VELVET, k.ALLMOGE_RED, k.STRAW, k.LILAC];
  const quilt: Paint = (x, y, z) => {
    const p = patches[Math.floor(hash(Math.floor(x / 5), Math.floor(z / 5), 0, 80) * patches.length)];
    return x % 5 === 0 || z % 5 === 0 ? k.CREAM : hash(x, y, z, 81) < 0.08 ? k.WHITE : p;
  };
  for (const [x, z] of [[0, 0], [37, 0], [0, 61], [37, 61]]) box(v, x, 0, z, x + 3, 8, z + 3, k.WOOD_DARK);
  box(v, 1, 6, 1, 39, 10, 63, k.WOOD_DARK);
  roundBox(v, 2, 10, 3, 38, 15, 62, 2, k.WHITE);              // the mattress and sheet
  roundBox(v, 1, 14, 18, 39, 17, 63, 2, quilt);              // the quilt, turned down at the pillows
  for (let z = 18; z < 63; z++) for (const x of [1, 38]) for (let y = 11; y < 15; y++) dot(v, x, y, z, quilt(x, y, z));
  box(v, 1, 16, 18, 39, 17, 21, k.WHITE);
  for (let x = 1; x < 39; x += 2) dot(v, x, 11, 63, k.WHITE);   // the crocheted edge
  // The headboard: a painted panel with a kurbits bloom, an arched top.
  box(v, 0, 0, 0, 40, 34, 3, k.ALLMOGE);
  box(v, 3, 14, 2, 37, 30, 3, k.CREAM);
  for (let x = 0; x < 40; x++) { const top = 34 + Math.round(2 * Math.sin((x / 39) * Math.PI)); box(v, x, 34, 0, x + 1, top, 3, k.ALLMOGE); }
  kurbits(k, 20, 22, (x, y, c) => dot(v, x, y, 2, c));
  kurbits(k, 10, 21, (x, y, c) => dot(v, x, y, 2, c));
  kurbits(k, 30, 21, (x, y, c) => dot(v, x, y, 2, c));
  box(v, 0, 0, 61, 40, 20, 64, k.ALLMOGE);
  box(v, 3, 10, 63, 37, 18, 64, k.CREAM);
  kurbits(k, 20, 14, (x, y, c) => dot(v, x, y, 63, c));
  return prop(v, H);
}

/** En kudde: a white pillowcase with a lace edge and an embroidered rose. */
function pillow(k: Ids) {
  const v = new Volume(28, 8, 18);
  for (let y = 0; y < 7; y++) {
    const inset = Math.abs(y - 3) > 1 ? Math.abs(y - 3) - 1 : 0;
    roundBox(v, inset, y, inset, 28 - inset, y + 1, 18 - inset, 4, k.WHITE);
  }
  for (let x = 0; x < 28; x++) if (x % 2) { dot(v, x, 3, 0, k.CREAM); dot(v, x, 3, 17, k.CREAM); }
  for (const [x, z, c] of [[13, 8, k.RED], [14, 8, k.RED], [13, 9, k.RED], [14, 9, k.ROSEPINK], [12, 10, k.GREEN], [15, 7, k.GREEN]] as const) dot(v, x, 6, z, c);
  return prop(v, Q);
}

/** Nattduksbordet: a small painted table with a drawer and a lower shelf, a doily on top. */
function nightstand(k: Ids) {
  const v = new Volume(16, 20, 14);
  for (const [x, z] of [[0, 0], [14, 0], [0, 12], [14, 12]]) box(v, x, 0, z, x + 2, 18, z + 2, k.ALLMOGE);
  box(v, 0, 4, 0, 16, 5, 14, k.ALLMOGE);
  box(v, 0, 12, 0, 16, 18, 14, k.ALLMOGE);
  box(v, 2, 13, 13, 14, 17, 14, k.CREAM);
  dot(v, 8, 15, 14 - 1, k.BRASS);
  box(v, -1, 18, -1, 17, 20, 15, grain(k, 'x', k.WOOD, 82));
  for (let x = 3; x < 13; x++) dot(v, x, 19, 13, x % 2 ? k.WHITE : k.CREAM);
  return prop(v, H);
}

/** Väckarklockan: a round red alarm clock on little legs, a cream face with numbers, two chrome bells and a hammer. */
function alarmClock(k: Ids) {
  const v = new Volume(14, 16, 8);
  cylZ(v, 7, 7, 5.6, 1, 7, k.RED);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 14; x++) {
    const d = Math.hypot(x + 0.5 - 7, y + 0.5 - 7);
    if (d < 4.6) dot(v, x, y, 7, d > 4 ? k.STEEL_LIGHT : k.CREAM);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dot(v, Math.floor(7 + Math.sin(a) * 3.3), Math.floor(7 + Math.cos(a) * 3.3), 7, k.INK);
  }
  line(v, [7, 7, 7.5], [7, 9.5, 7.5], k.INK);
  line(v, [7, 7, 7.5], [8.8, 6, 7.5], k.RED);
  for (const x of [3.5, 10.5]) blob(v, x, 13, 4, 2.2, 1.8, 2.2, k.STEEL_LIGHT);
  box(v, 6, 12, 3, 8, 14, 5, k.STEEL);
  for (const x of [3, 10]) box(v, x, 0, 3, x + 1, 3, 5, k.STEEL);
  return prop(v, S);
}

/** Löständerna: a water glass with mormor's false teeth grinning through it. */
function teeth(k: Ids) {
  const v = new Volume(10, 13, 10);
  lathe(v, 5, 5, 0, 13, (y) => 3.6 + y * 0.08, (x, y, z) => {
    const a = angleOf(x, z, 5, 5), front = Math.abs(a - Math.PI / 2) < 1;
    if (y === 0) return k.GLASS;
    if (y > 9) return k.GLASS;
    if (y === 9) return k.WATER;
    if (front && (y === 3 || y === 6)) return k.GUM;
    if (front && (y === 4 || y === 5)) return hash(x, y, z) < 0.15 ? k.GUM : k.TEETH;
    return hash(x, y, z, 3) < 0.15 ? k.GLASS : k.WATER;
  }, (y) => (y > 10 ? 3.6 + y * 0.08 - 1.3 : 0));
  return prop(v, S);
}

/** Byrån: a painted allmoge dresser, three drawers with kurbits and brass bail handles, bun feet, things on top. */
function dresser(k: Ids) {
  const v = new Volume(34, 32, 16);
  for (const [x, z] of [[2, 2], [32, 2], [2, 14], [32, 14]]) blob(v, x, 1.5, z, 1.8, 1.5, 1.8, k.WOOD_DARK);
  box(v, 0, 3, 0, 34, 27, 15, k.ALLMOGE);
  for (const [y0, y1] of [[4, 11], [12, 19], [20, 26]]) {
    box(v, 1, y0, 15, 33, y1, 16, k.ALLMOGE);
    box(v, 2, y0 + 1, 15, 32, y1 - 1, 16, k.CREAM);
    kurbits(k, 17, Math.floor((y0 + y1) / 2), (x, y, c) => dot(v, x, y, 15, c));
    for (const x of [6, 27]) { box(v, x - 1, y1 - 3, 15, x + 2, y1 - 2, 16, k.BRASS); dot(v, x - 1, y1 - 4, 15, k.BRASS); dot(v, x + 1, y1 - 4, 15, k.BRASS); }
  }
  box(v, 0, 27, 0, 34, 29, 16, grain(k, 'x', k.WOOD_DARK, 83));
  box(v, 3, 29, 4, 10, 32, 9, k.MAHOGANY);                   // a jewellery box
  dot(v, 6, 31, 9 - 1, k.GOLD);
  box(v, 24, 29, 6, 30, 32, 7, k.GOLD);                      // a framed photo
  box(v, 25, 30, 6, 29, 31, 7, k.PAPER);
  return prop(v, H);
}

/** Ett par tofflor: plush slippers with pink pompoms and white fluffy trim. */
function slippers(k: Ids) {
  const v = new Volume(14, 6, 14);
  for (const x0 of [0, 8]) {
    roundBox(v, x0, 0, 0, x0 + 6, 1, 14, 2, k.WOOD_DEEP);
    roundBox(v, x0, 1, 0, x0 + 6, 2, 14, 2, k.PLUSH);
    roundBox(v, x0, 2, 6, x0 + 6, 4, 14, 2, k.PLUSH);
    for (let x = x0; x < x0 + 6; x++) dot(v, x, 4, 7, k.WHITE);
    blob(v, x0 + 3, 4.5, 11, 1.4, 1.2, 1.4, k.PINK);
  }
  return prop(v, Q);
}

/** En hattask: a round box in pink and cream stripes, a lid with a red ribbon tied in a bow. */
function hatbox(k: Ids) {
  const v = new Volume(18, 14, 18);
  lathe(v, 9, 9, 0, 10, () => 8.6, (x, _y, z) => (Math.floor(angleOf(x, z, 9, 9) * 4) % 2 ? k.PINK : k.CREAM));
  lathe(v, 9, 9, 10, 12, () => 9, k.CREAM);
  for (let i = 0; i < 18; i++) { dot(v, i, 12, 9, k.RED); dot(v, 9, 12, i, k.RED); }
  for (const z of [0, 17]) for (let y = 0; y < 12; y++) dot(v, 9, y, z, k.RED);
  for (const x of [0, 17]) for (let y = 0; y < 12; y++) dot(v, x, y, 9, k.RED);
  blob(v, 7, 12.5, 9, 1.6, 1, 1.2, k.RED);
  blob(v, 11, 12.5, 9, 1.6, 1, 1.2, k.RED);
  return prop(v, Q);
}

/** Garderoben: a tall wardrobe, two panelled doors, a carved crown, a key in the lock. */
function wardrobe(k: Ids) {
  const v = new Volume(40, 72, 20);
  box(v, 0, 0, 0, 40, 3, 19, k.WOOD_DEEP);
  box(v, 0, 3, 0, 40, 66, 19, grain(k, 'y', k.WOOD_DARK, 84));
  for (const [x0, x1] of [[1, 20], [20, 39]]) {
    box(v, x0, 4, 19, x1, 65, 20, k.WOOD_DARK);
    box(v, x0 + 3, 8, 19, x1 - 3, 33, 20, 0);
    box(v, x0 + 3, 37, 19, x1 - 3, 61, 20, 0);
  }
  dot(v, 19, 36, 19, k.BRASS); dot(v, 20, 36, 19, k.BRASS); dot(v, 19, 35, 19, k.GOLD);
  box(v, 0, 66, 0, 40, 69, 20, k.WOOD_DEEP);
  for (let x = 0; x < 40; x++) { const h = 69 + Math.round(2.5 * Math.sin((x / 39) * Math.PI)); box(v, x, 69, 2, x + 1, h, 18, k.WOOD_DARK); }
  return prop(v, H);
}

/** En tavla: a gilt frame round a lake at sunset, birches on the shore (a wall piece). */
function painting(k: Ids) {
  const v = new Volume(28, 20, 2);
  box(v, 0, 0, 0, 28, 20, 2, k.GOLD);
  box(v, 2, 2, 1, 26, 18, 2, 0);
  for (let y = 2; y < 18; y++) for (let x = 2; x < 26; x++) {
    let c = y > 11 ? (y > 14 ? k.PINK : k.STRAW) : y > 8 ? k.ALLMOGE : k.MOSS_VELVET;
    if (y >= 9 && y <= 11 && x % 5 === 0) c = k.WHITE;
    if ((x === 6 || x === 21) && y < 15) c = hash(x, y, 0) < 0.3 ? k.SOOT : k.WHITE;
    if ((Math.abs(x - 6) <= 2 || Math.abs(x - 21) <= 2) && y >= 12 && y < 15) c = k.GREEN;
    dot(v, x, y, 0, c);
  }
  return wall(v, H);
}

/** Sänglampan: a small brass lamp with a pleated cream shade. */
function tableLamp(k: Ids) {
  const v = new Volume(12, 20, 12);
  lathe(v, 6, 6, 0, 1, () => 4, k.BRASS);
  lathe(v, 6, 6, 1, 14, (y) => (y < 4 ? 2 - y * 0.25 : 1), k.BRASS);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) line(v, [6, 13, 6], [6 + dx * 4.6, 13, 6 + dz * 4.6], k.BRASS);
  lathe(v, 6, 6, 10, 19, (y) => 5.6 - (y - 10) * 0.25, (x, _y, z) => (Math.floor(angleOf(x, z, 6, 6) * 4) % 2 ? k.CREAM : k.WHITE), (y) => 4.6 - (y - 10) * 0.25);
  return prop(v, Q);
}

/** The bedside lamp's lit shade, its own mesh. */
function tableLampGlow(k: Ids) {
  const v = new Volume(12, 20, 12);
  lathe(v, 6, 6, 11, 18, (y) => 4.6 - (y - 10) * 0.25, k.LAMP, (y) => 3.6 - (y - 10) * 0.25);
  blob(v, 6, 13, 6, 1.4, 1.8, 1.4, k.LAMP);
  return prop(v, Q);
}

export const BEDROOM_MODELS = {
  bed, pillow, nightstand, alarmClock, teeth, dresser, slippers, hatbox, wardrobe, painting, tableLamp, tableLampGlow,
};

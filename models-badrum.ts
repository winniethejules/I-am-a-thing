/**
 * Badrummet (three-free): the clawfoot tub with bubbles, the pedestal basin, the toilet with its
 * high tank and pull chain, the mirror cabinet, folded towels, the soap dish, the rubber duck, the
 * laundry basket, the crocheted toilet roll lady, the chamber pot, a towel rail and a bath mat.
 */
import { Volume } from '@voxelparty/sdk/core';
import { angleOf, blob, box, dot, hash, lathe, line, prop, roundBox, speckle, wall } from './kit';
import type { Ids } from './textures';

const H = 1 / 32, Q = 1 / 48, S = 1 / 64;

/** Badkaret: a white tub on gold claw feet, a rolled rim, water with bubbles, brass taps at the foot. */
function bathtub(k: Ids) {
  const v = new Volume(24, 22, 56);
  for (const [x, z] of [[3, 6], [20, 6], [3, 49], [20, 49]]) {
    blob(v, x, 1.5, z, 2, 1.5, 2, k.GOLD);
    box(v, x - 1, 2, z - 1, x + 1, 5, z + 1, k.GOLD);
  }
  roundBox(v, 0, 4, 0, 24, 20, 56, 10, k.CERAMIC);
  roundBox(v, 2, 7, 2, 22, 20, 54, 9, 0);
  roundBox(v, 0, 19, 0, 24, 21, 56, 10, k.WHITE);
  roundBox(v, 2, 19, 2, 22, 21, 54, 9, 0);
  roundBox(v, 2, 13, 2, 22, 14, 54, 9, k.WATER);
  for (let i = 0; i < 26; i++) blob(v, 4 + hash(i, 0, 0, 90) * 16, 14.5, 18 + hash(i, 1, 0, 90) * 34, 1.6, 1, 1.6, k.WHITE);   // bubbles
  for (const x of [8, 15]) { box(v, x, 21, 1, x + 2, 22, 3, k.BRASS); dot(v, x, 22 - 1, 3, k.BRASS); }
  line(v, [12, 21, 2], [12, 19, 6], k.BRASS);
  return prop(v, H);
}

/** Handfatet: a pedestal basin, two brass taps, a bar of soap waiting. */
function washbasin(k: Ids) {
  const v = new Volume(20, 30, 16);
  lathe(v, 10, 7, 0, 22, (y) => (y < 2 ? 4 : 2.6 + Math.max(0, y - 16) * 0.5), k.CERAMIC);
  roundBox(v, 0, 22, 0, 20, 27, 16, 5, k.CERAMIC);
  roundBox(v, 2, 24, 2, 18, 27, 14, 4, 0);
  roundBox(v, 0, 26, 0, 20, 27, 16, 5, k.WHITE);
  roundBox(v, 2, 26, 2, 18, 27, 14, 4, 0);
  dot(v, 10, 24, 8, k.STEEL);
  for (const [x, c] of [[6, k.RED], [14, k.BLUE]] as const) { box(v, x, 27, 1, x + 1, 29, 2, k.BRASS); dot(v, x, 29, 1, c); }
  box(v, 9, 27, 1, 11, 28, 5, k.BRASS);
  return prop(v, H);
}

/** Toaletten: an old white bowl with a wooden seat, the tank high on the wall, a pipe and a pull chain. */
function toilet(k: Ids) {
  const v = new Volume(16, 64, 22);
  lathe(v, 8, 13, 0, 12, (y) => (y < 3 ? 3.2 : 3.2 + (y - 3) * 0.45), k.CERAMIC, (y) => (y < 8 ? 0 : 2.6 + (y - 3) * 0.45));
  lathe(v, 8, 13, 12, 13, () => 7.4, k.WOOD, () => 4.2);
  box(v, 2, 13, 4, 14, 22, 6, k.WOOD);                       // the lid, raised
  box(v, 7, 13, 2, 9, 54, 4, k.STEEL);                      // the pipe up the wall
  roundBox(v, 1, 54, 0, 15, 62, 7, 2, k.CERAMIC);           // the tank
  box(v, 1, 62, 0, 15, 63, 7, k.WHITE);
  for (let y = 38; y < 54; y += 1) dot(v, 13, y, 6, y % 2 ? k.STEEL : k.STEEL_LIGHT);
  lathe(v, 13.5, 6.5, 35, 38, () => 1.2, k.WOOD_DARK);
  return prop(v, H);
}

/** Spegelskåpet: a mirror door in a white frame, a little shelf under with a tooth mug (a wall piece). */
function mirrorCabinet(k: Ids) {
  const v = new Volume(22, 26, 6);
  box(v, 0, 4, 0, 22, 26, 5, k.WHITE);
  box(v, 2, 6, 5, 20, 24, 6, k.GLASS);
  for (let i = 0; i < 6; i++) dot(v, 5 + i, 18 - i, 5, k.WHITE);
  dot(v, 18, 15, 5, k.BRASS);
  box(v, 0, 2, 0, 22, 3, 6, k.WHITE);
  lathe(v, 6, 3, 3, 7, () => 1.6, k.PINK);
  line(v, [6, 6, 3], [7, 9, 3], k.ALLMOGE_RED);
  line(v, [6.5, 6, 3.5], [5, 9, 3.5], k.QUILT_BLUE);
  return wall(v, H);
}

/** En vikt handduk: two folded towels stacked, a striped hem on each. */
function foldedTowel(k: Ids) {
  const v = new Volume(16, 7, 12);
  for (const [y0, c] of [[0, k.QUILT_BLUE], [3, k.PINK]] as const) {
    roundBox(v, 0, y0, 0, 16, y0 + 3, 12, 1, c);
    for (let x = 0; x < 16; x++) dot(v, x, y0 + 1, 11, k.WHITE);
    roundBox(v, 0, y0 + 2, 0, 16, y0 + 3, 12, 1, speckle(c, k.WHITE, 0.08, y0));
  }
  return prop(v, Q);
}

/** Tvålkoppen: a scalloped ceramic dish with a pink bar of soap and a few bubbles. */
function soapDish(k: Ids) {
  const v = new Volume(14, 6, 10);
  roundBox(v, 0, 0, 0, 14, 2, 10, 3, k.CERAMIC);
  roundBox(v, 1, 1, 1, 13, 2, 9, 2, 0);
  for (let x = 0; x < 14; x += 2) { dot(v, x, 2, 1, k.CERAMIC); dot(v, x, 2, 8, k.CERAMIC); }
  roundBox(v, 3, 1, 2, 11, 4, 8, 2, k.PINK);
  for (const [x, z] of [[4, 3], [9, 6], [6, 5]]) dot(v, x, 4, z, k.WHITE);
  dot(v, 10, 5, 3, k.WHITE);
  return prop(v, S);
}

/** Badankan: yellow, an orange beak, black eyes with a white glint, a little tail. */
function duck(k: Ids) {
  const v = new Volume(12, 13, 15);
  blob(v, 6, 3.5, 7, 5.4, 3.5, 6.8, k.YELLOW);
  blob(v, 6, 9, 9.5, 3.4, 3.4, 3.2, k.YELLOW);
  blob(v, 6, 8.2, 13.2, 1.8, 0.9, 1.6, k.ORANGE);
  for (const x of [4, 8]) { dot(v, x, 10, 12, k.INK); dot(v, x, 11, 12, k.WHITE); }
  blob(v, 6, 5, 1, 1.6, 1.4, 1, k.YELLOW);
  for (const x of [1, 10]) blob(v, x, 4, 7, 0.8, 1.8, 3, k.STRAW);
  return prop(v, S);
}

/** Tvättkorgen: a wicker basket with a lid ajar, a sock and a lace edge peeking out. */
function laundryBasket(k: Ids) {
  const v = new Volume(16, 20, 12);
  roundBox(v, 0, 0, 0, 16, 16, 12, 3, (x, y, z) => ((x + y + z) % 2 ? k.WICKER : k.WICKER_DARK));
  roundBox(v, 1, 1, 1, 15, 16, 11, 2, k.WHITE);
  for (const y of [5, 11]) roundBox(v, 0, y, 0, 16, y + 1, 12, 3, k.WICKER_DARK);
  roundBox(v, 1, 16, 1, 15, 17, 11, 2, k.WHITE);
  for (let x = 2; x < 14; x += 2) dot(v, x, 17, 6, k.CREAM);
  box(v, 9, 16, 3, 13, 19, 5, k.ALLMOGE_RED);               // a sock
  roundBox(v, 0, 17, 3, 16, 18, 12, 3, (x, y, z) => ((x + y + z) % 2 ? k.WICKER : k.WICKER_DARK));   // the lid, pushed back
  return prop(v, H);
}

/** Toarullsdockan: a crocheted lady whose skirt hides the spare roll: a lilac flounced skirt, a blonde head, a little hat. */
function rollDoll(k: Ids) {
  const v = new Volume(12, 20, 12);
  lathe(v, 6, 6, 0, 10, (y) => 5.6 - y * 0.12 + (y % 3 === 0 ? 0.4 : 0), (x, y, z) => (y % 3 === 0 ? k.WHITE : hash(x, y, z, 91) < 0.2 ? k.PINK : k.LILAC));
  lathe(v, 6, 6, 10, 14, (y) => 2.4 - (y - 10) * 0.15, k.LILAC);
  blob(v, 6, 15.5, 6, 2.2, 2.2, 2.2, k.SKIN);
  blob(v, 6, 16.5, 5.4, 2.4, 1.8, 2.2, k.HAIR_LIGHT);
  dot(v, 5, 15, 8, k.INK); dot(v, 7, 15, 8, k.INK); dot(v, 6, 14, 8, k.ROSEPINK);
  lathe(v, 6, 5.6, 18, 20, (y) => (y === 18 ? 3.2 : 1.8), k.LILAC);
  dot(v, 8, 19, 6, k.PINK);
  return prop(v, S);
}

/** Pottan: a white enamel chamber pot with a blue rim and a handle. */
function chamberPot(k: Ids) {
  const v = new Volume(18, 10, 14);
  lathe(v, 7, 7, 0, 9, (y) => (y < 1 ? 4.6 : y > 7 ? 6.6 : 5 + y * 0.18), (_x, y) => (y === 8 ? k.PORC_BLUE : k.WHITE), (y) => (y < 2 ? 0 : 4.4 + y * 0.15));
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (i / 8) - Math.PI / 2;
    dot(v, Math.floor(13 + Math.cos(a) * 2.6), Math.floor(5 + Math.sin(a) * 2.6), 7, k.WHITE);
  }
  return prop(v, Q);
}

/** Handdukstorken: a brass rail with a towel hanging over it (a wall piece). */
function towelRail(k: Ids) {
  const v = new Volume(26, 22, 5);
  box(v, 0, 18, 3, 26, 19, 4, k.BRASS);
  for (const x of [0, 25]) box(v, x, 16, 0, x + 1, 20, 4, k.BRASS);
  box(v, 4, 19, 2, 20, 20, 5, k.PINK);
  for (const z of [1, 4]) box(v, 4, 4, z, 20, 19, z + 1, (x, y) => (y === 6 ? k.WHITE : k.PINK));
  return wall(v, H);
}

/** Badrumsmattan: a fluffy oval mat. */
function bathMat(k: Ids) {
  const v = new Volume(28, 1, 18);
  for (let z = 0; z < 18; z++) for (let x = 0; x < 28; x++) {
    if (((x + 0.5 - 14) / 14) ** 2 + ((z + 0.5 - 9) / 9) ** 2 > 1) continue;
    v.set(x, 0, z, hash(x, 0, z, 92) < 0.2 ? k.WHITE : k.QUILT_BLUE);
  }
  return prop(v, H);
}

/** Badrumsvågen: an old white scale with a round dial and a ribbed rubber mat. */
function scale(k: Ids) {
  const v = new Volume(18, 5, 22);
  roundBox(v, 0, 0, 0, 18, 3, 22, 3, k.CERAMIC);
  for (let z = 7; z < 20; z++) for (let x = 2; x < 16; x++) if (z % 2) dot(v, x, 3, z, k.GREY);
  for (let x = 4; x < 14; x++) for (let z = 1; z < 7; z++) {
    const d = Math.hypot(x + 0.5 - 9, z + 0.5 - 4);
    if (d < 3) dot(v, x, 3, z, d > 2.3 ? k.STEEL_LIGHT : d < 0.6 ? k.RED : k.PAPER);
  }
  line(v, [9, 3.5, 4], [10.5, 3.5, 2.6], k.RED);
  return prop(v, Q);
}

export const BATH_MODELS = {
  scale,
  bathtub, washbasin, toilet, mirrorCabinet, foldedTowel, soapDish, duck, laundryBasket, rollDoll, chamberPot, towelRail, bathMat,
};
export { angleOf };

/**
 * Trädgården (three-free): garden gnomes, watering cans, flower pots, the wheelbarrow, the woodpile
 * and loose logs, currant bushes, kubb blocks and the king, the rain barrel, a bird bath, the
 * patio's white chairs and table, a rake. Furniture at 1/32 m, small things finer.
 */
import { Volume } from '@voxelparty/sdk/core';
import { angleOf, blob, box, cylX, cylZ, dot, grain, hash, lathe, line, prop, roundBox, speckle } from './kit';
import type { Ids } from './textures';

const H = 1 / 32, Q = 1 / 48;

/** En trädgårdstomte: a red pointed hat, a long white beard, a blue coat with a belt, a little spade. */
function gnome(k: Ids) {
  const v = new Volume(14, 28, 12);
  for (const x of [4, 8]) box(v, x, 0, 4, x + 2, 3, 9, k.WOOD_DEEP);
  lathe(v, 7, 6, 3, 13, (y) => 4.6 - (y - 3) * 0.12, (_x, y) => (y === 7 ? k.WOOD_DEEP : k.ALLMOGE));
  dot(v, 7, 7, 10, k.GOLD);
  blob(v, 7, 15, 6, 3.2, 3, 3, k.SKIN);
  dot(v, 7, 15, 9, k.ROSEPINK);
  dot(v, 6, 16, 9, k.INK); dot(v, 8, 16, 9, k.INK);
  for (let y = 8; y < 15; y++) { const w = 3 - (14 - y) * 0.35; box(v, Math.round(7 - w), y, 8, Math.round(7 + w), y + 1, 10, k.WHITE); }
  lathe(v, 7, 6, 17, 28, (y) => 3.6 - (y - 17) * 0.33, k.RED);
  lathe(v, 7, 6, 17, 18, () => 3.8, k.RED);
  for (const x of [2, 12]) blob(v, x, 10, 6, 1.4, 2.4, 1.4, k.ALLMOGE);
  line(v, [12, 2, 9], [12, 12, 9], k.WOOD_DARK);
  box(v, 11, 0, 8, 14, 3, 10, k.STEEL);
  return prop(v, Q);
}

/** En vattenkanna: a green tin can with a long spout and a sprinkler rose, a hooped handle. */
function wateringCan(k: Ids) {
  const v = new Volume(24, 18, 12);
  lathe(v, 9, 6, 0, 11, () => 5.4, (_x, y) => (y === 0 || y === 10 ? k.MOSS : k.GREEN));
  line(v, [13, 3, 6], [21, 12, 6], k.GREEN, 0.9);
  lathe(v, 21.5, 6, 12, 14, () => 1.6, k.MOSS);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (i / 8), b = Math.PI * ((i + 1) / 8);
    if (i < 8) line(v, [9 - Math.cos(a) * 4, 10.5 + Math.sin(a) * 6, 6], [9 - Math.cos(b) * 4, 10.5 + Math.sin(b) * 6, 6], k.GREEN);
  }
  return prop(v, Q);
}

/** En blomkruka: terracotta with flowers in it, yellow or red (the colour comes from the key). */
function flowerPot(k: Ids, petal: number) {
  const v = new Volume(14, 18, 14);
  lathe(v, 7, 7, 0, 9, (y) => 4.2 + y * 0.2 + (y >= 7 ? 0.5 : 0), (_x, y) => (y === 7 || y === 8 ? k.COOKIE : k.POT));
  lathe(v, 7, 7, 8, 9, () => 5, k.WOOD_DEEP);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = 1.5 + (i % 3) * 1.2, x = 7 + Math.cos(a) * r, z = 7 + Math.sin(a) * r, h = 12 + (i % 4) * 1.4;
    line(v, [7, 8.5, 7], [x, h, z], k.GREEN);
    blob(v, x, h + 0.8, z, 1.4, 0.9, 1.4, (xx, y, zz) => (Math.hypot(xx + 0.5 - x, zz + 0.5 - z) < 0.6 ? k.WOOD_DEEP : petal));
    blob(v, x + 0.5, h - 2, z, 1, 0.5, 1, k.LEAF_DARK);
  }
  return prop(v, Q);
}

/** Skottkärran: a wooden barrow with red sides, an iron-rimmed wheel, two long handles, a bit of soil in it. */
function wheelbarrow(k: Ids) {
  const v = new Volume(22, 22, 52);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    for (const x of [10, 11]) dot(v, x, Math.floor(6 + Math.sin(a) * 5.4), Math.floor(45 + Math.cos(a) * 5.4), k.IRON);
  }
  cylX(v, 6, 45, 4.6, 10, 12, k.WOOD);
  cylX(v, 6, 45, 1, 9, 13, k.IRON);
  for (const x of [2, 18]) {
    line(v, [x + 0.5, 6.5, 45], [x + 0.5, 15, 2], k.WOOD_DARK, 0.9);
    line(v, [x + 0.5, 12, 14], [x + 0.5, 0.5, 16], k.WOOD_DARK, 0.8);
  }
  for (let z = 14; z < 42; z++) {
    const lift = Math.round((z - 14) * 0.18);
    box(v, 1, 9 + lift, z, 21, 10 + lift, z + 1, grain(k, 'z', k.WOOD, 120));
    box(v, 1, 10 + lift, z, 2, 18 + lift - Math.round((z - 14) * 0.1), z + 1, k.ALLMOGE_RED);
    box(v, 20, 10 + lift, z, 21, 18 + lift - Math.round((z - 14) * 0.1), z + 1, k.ALLMOGE_RED);
  }
  box(v, 1, 9, 14, 21, 18, 15, k.ALLMOGE_RED);
  box(v, 2, 11, 18, 20, 13, 34, speckle(k.WOOD_DEEP, k.GREEN, 0.08, 121));
  return prop(v, H);
}

/** Vedtraven: split birch stacked between two posts under a little roof (against a wall). */
function woodpile(k: Ids) {
  const v = new Volume(64, 50, 16);
  for (const x of [0, 62]) box(v, x, 0, 0, x + 2, 46, 16, k.WOOD_DARK);
  for (let x = -2; x < 66; x++) box(v, x, 46 + (x % 2), 0, x + 1, 48 + (x % 2), 16, k.FALU_FLAT);
  for (let row = 0; row < 9; row++) for (let i = 0; i < 12; i++) {
    const cx = 4 + i * 5 + (row % 2) * 2.5, cy = 2.5 + row * 4.8;
    if (cx > 60) continue;
    cylZ(v, cx, cy, 2.4, 0, 15, speckle(k.WHITE, k.SOOT, 0.12, row * 13 + i));
    cylZ(v, cx, cy, 1.7, 15, 16, (x, y) => (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < 0.8 ? k.WOOD : k.WOOD_LIGHT));
  }
  return prop(v, H);
}

/** En vedklabbe: one split birch log lying in the grass. */
function log(k: Ids) {
  const v = new Volume(10, 7, 20);
  cylZ(v, 5, 3.5, 3.4, 0, 20, speckle(k.WHITE, k.SOOT, 0.12, 122));
  cylZ(v, 5, 3.5, 2.6, 19, 20, k.WOOD_LIGHT);
  cylZ(v, 5, 3.5, 2.6, 0, 1, k.WOOD_LIGHT);
  for (let x = 2; x < 8; x++) dot(v, x, 6, 19, k.WOOD);
  return prop(v, H);
}

/** En vinbärsbuske: a round bush, leaves in two greens, red currants hanging in strings. */
function currantBush(k: Ids) {
  const v = new Volume(30, 30, 30);
  for (let i = 0; i < 14; i++) {
    const a = hash(i, 0, 0, 123) * Math.PI * 2, r = hash(i, 1, 0, 123) * 7, y = 10 + hash(i, 2, 0, 123) * 12;
    line(v, [15, 0, 15], [15 + Math.cos(a) * r, y, 15 + Math.sin(a) * r], k.WOOD_DARK);
    blob(v, 15 + Math.cos(a) * r, y + 1, 15 + Math.sin(a) * r, 6, 5, 6, (x, yy, z) => { const h = hash(x, yy, z, 124); return h < 0.05 ? k.RED : h < 0.07 ? k.JAM : h < 0.4 ? k.LEAF_DARK : k.GREEN; });
  }
  return prop(v, H);
}

/** En kubbpinne and the king: pale wooden blocks for the lawn game (the king has a crown). */
function kubb(k: Ids) {
  const v = new Volume(5, 10, 5);
  box(v, 0, 0, 0, 5, 10, 5, grain(k, 'y', k.WOOD_LIGHT, 125));
  return prop(v, H);
}
function kubbKing(k: Ids) {
  const v = new Volume(6, 16, 6);
  box(v, 0, 0, 0, 6, 13, 6, grain(k, 'y', k.WOOD_LIGHT, 126));
  for (const [x, z] of [[0, 0], [5, 0], [0, 5], [5, 5], [2, 0], [0, 2], [5, 3], [3, 5]]) box(v, x, 13, z, x + 1, 16, z + 1, k.WOOD_LIGHT);
  box(v, 0, 12, 0, 6, 13, 6, k.RED);
  return prop(v, H);
}

/** Regntunnan: a wooden rain barrel with iron hoops, water at the top, a tap. */
function rainBarrel(k: Ids) {
  const v = new Volume(20, 30, 20);
  lathe(v, 10, 10, 0, 30, (y) => 8 + Math.sin((y / 29) * Math.PI) * 1.4, (x, y, z) => (y === 3 || y === 26 || y === 15 ? k.IRON : Math.floor(angleOf(x, z, 10, 10) * 6) % 2 ? k.WOOD : k.WOOD_DARK), (y) => (y < 2 ? 0 : 7 + Math.sin((y / 29) * Math.PI) * 1.4));
  lathe(v, 10, 10, 26, 27, () => 8, k.WATER);
  box(v, 9, 4, 19, 11, 6, 20, k.BRASS);
  return prop(v, H);
}

/** Ett fågelbad: a stone bowl on a pillar, water in it, a sparrow on the rim. */
function birdBath(k: Ids) {
  const v = new Volume(20, 30, 20);
  lathe(v, 10, 10, 0, 3, () => 6, speckle(k.GREY, k.PORC_SHADE, 0.3, 127));
  lathe(v, 10, 10, 3, 22, (y) => 2.4 + (y > 18 ? (y - 18) * 0.6 : 0), speckle(k.GREY, k.PORC_SHADE, 0.3, 128));
  lathe(v, 10, 10, 22, 26, (y) => 9 + (y - 22) * 0.2, speckle(k.GREY, k.PORC_SHADE, 0.3, 129), (y) => (y < 23 ? 0 : 7.6));
  lathe(v, 10, 10, 24, 25, () => 7.6, k.WATER);
  blob(v, 17, 27.5, 10, 1.6, 1.2, 1.2, k.WOOD_DARK);
  blob(v, 18.2, 28.6, 10, 1, 1, 1, k.WOOD_DARK);
  dot(v, 19, 28, 10, k.YELLOW);
  return prop(v, H);
}

/** En trädgårdsstol: white painted iron and wood, a curved back. */
function gardenChair(k: Ids) {
  const v = new Volume(16, 30, 16);
  for (const [x, z] of [[1, 1], [14, 1], [1, 14], [14, 14]]) box(v, x, 0, z, x + 1, 14, z + 1, k.WHITE);
  for (let x = 1; x < 15; x++) for (let z = 1; z < 15; z += 2) dot(v, x, 14, z, k.WHITE);
  box(v, 1, 14, 1, 15, 15, 2, k.WHITE);
  for (let y = 15; y < 30; y++) for (const x of [1, 14]) dot(v, x, y, 1, k.WHITE);
  for (let x = 1; x < 15; x++) { box(v, x, 26 + Math.round(Math.sin((x / 14) * Math.PI) * 3), 1, x + 1, 27 + Math.round(Math.sin((x / 14) * Math.PI) * 3), 2, k.WHITE); }
  for (const x of [4, 7, 10, 13]) box(v, x, 15, 1, x + 1, 26, 2, k.WHITE);
  roundBox(v, 2, 15, 2, 14, 16, 14, 2, k.GINGHAM);
  return prop(v, H);
}

/** Ett trädgårdsbord: a round white table on a turned foot, a jug of saft and a glass on it. */
function gardenTable(k: Ids) {
  const v = new Volume(28, 34, 28);
  lathe(v, 14, 14, 22, 24, () => 13.6, k.WHITE);
  lathe(v, 14, 14, 2, 22, (y) => (y % 6 === 0 ? 2.2 : 1.4), k.WHITE);
  for (const a of [0.4, 2.5, 4.6]) line(v, [14, 3, 14], [14 + Math.cos(a) * 10, 0.5, 14 + Math.sin(a) * 10], k.WHITE, 0.8);
  lathe(v, 10, 12, 24, 32, (y) => (y < 30 ? 2.8 : 2), (_x, y) => (y > 29 ? k.GLASS : k.JAM));
  lathe(v, 17, 15, 24, 28, () => 1.6, (_x, y) => (y > 26 ? k.GLASS : k.JAM));
  return prop(v, H);
}

/** En kratta: a rake leaning, wooden handle, iron teeth. */
function rake(k: Ids) {
  const v = new Volume(18, 54, 6);
  box(v, 8, 6, 2, 10, 54, 4, grain(k, 'y', k.WOOD, 130));
  box(v, 1, 4, 2, 17, 6, 4, k.IRON);
  for (let x = 1; x < 17; x += 2) box(v, x, 0, 2, x + 1, 4, 3, k.IRON);
  return prop(v, H);
}

export const GARDEN_MODELS = {
  gnome, wateringCan, flowerPotYellow: (k: Ids) => flowerPot(k, k.YELLOW), flowerPotRed: (k: Ids) => flowerPot(k, k.RED),
  wheelbarrow, woodpile, log, currantBush, kubb, kubbKing, rainBarrel, birdBath, gardenChair, gardenTable, rake,
};

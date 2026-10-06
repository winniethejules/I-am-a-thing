/**
 * Hallen and farstun (three-free): the hat shelf with coats, rubber boots, umbrellas in their stand,
 * stools, the rotary phone on its table, the mirror, the runner, the front door and its mat, the
 * shoe rack, hats and a handbag. Furniture at 1/32 m, small things at 1/48–1/64 m.
 */
import { Volume } from '@voxelparty/sdk/core';
import { angleOf, blob, box, cylX, dot, grain, hang, hash, lathe, line, prop, roundBox, speckle, wall, write } from './kit';
import type { Ids } from './textures';

const H = 1 / 32, Q = 1 / 48, S = 1 / 64;

/** Hatthyllan: a shelf on carved brackets, a rail of brass hooks below with two coats and a scarf (a wall piece; origin at the coats' hems). */
function hatRack(k: Ids) {
  const v = new Volume(40, 40, 12);
  box(v, 0, 34, 0, 40, 36, 12, grain(k, 'x', k.WOOD_DARK, 70));
  box(v, 0, 33, 0, 40, 34, 2, k.WOOD_DARK);
  for (const x of [2, 36]) for (let y = 26; y < 34; y++) box(v, x, y, 0, x + 2, y + 1, Math.max(1, Math.round((y - 25) * 1.2)), k.WOOD_DARK);
  box(v, 0, 26, 0, 40, 28, 2, k.WOOD_DARK);
  for (let x = 4; x < 40; x += 8) { dot(v, x, 27, 2, k.BRASS); dot(v, x, 26, 3, k.BRASS); dot(v, x, 27, 3, k.BRASS); }
  // A long felt coat and mormor's blue coat with buttons, hanging from the hooks; a striped scarf.
  const coat = (x0: number, w: number, len: number, c: number, buttons: number) => {
    for (let y = 26 - len; y < 26; y++) {
      const flare = Math.round((26 - y) / 8);
      box(v, x0 - flare, y, 2, x0 + w + flare, y + 1, 6 - (y > 22 ? 1 : 0), c);
    }
    box(v, x0 + 1, 22, 5, x0 + w - 1, 26, 7, c);         // the collar
    for (let y = 24 - len + 4; y < 22; y += 4) dot(v, x0 + Math.floor(w / 2), y, 6, buttons);
  };
  coat(5, 8, 22, k.FELT, k.WOOD_LIGHT);
  coat(21, 8, 18, k.ALLMOGE, k.BRASS);
  for (let y = 12; y < 26; y++) box(v, 33, y, 2, 36, y + 1, 4, Math.floor(y / 2) % 2 ? k.RED : k.CREAM);
  return wall(v, H);
}

/** Ett par gummistövlar: green rubber, cream tops, treads, a little mud on the toes. */
function boots(k: Ids) {
  const v = new Volume(14, 18, 14);
  for (const x0 of [0, 8]) {
    box(v, x0, 0, 0, x0 + 6, 1, 14, k.SOOT);
    box(v, x0, 1, 0, x0 + 6, 4, 14, (x, y, z) => (z > 9 && hash(x, y, z) < 0.3 ? k.WOOD_DEEP : k.RUBBER));
    roundBox(v, x0, 4, 0, x0 + 6, 17, 6, 2, k.RUBBER);
    roundBox(v, x0, 16, 0, x0 + 6, 18, 6, 2, k.CREAM);
    roundBox(v, x0 + 1, 17, 1, x0 + 5, 18, 5, 1, k.SOOT);
    for (let z = 1; z < 14; z += 2) dot(v, x0 + 2, 0, z, k.RUBBER);
  }
  return prop(v, Q);
}

/** Ett paraply: a closed navy umbrella with white dots, its strap, a crook handle. */
function umbrella(k: Ids) {
  const v = new Volume(10, 44, 10);
  lathe(v, 5, 5, 0, 2, () => 1, k.BRASS);
  lathe(v, 5, 5, 2, 32, (y) => 1 + (y - 2) * 0.09, (x, y, z) => (y === 20 ? k.RED : (Math.floor(angleOf(x, z, 5, 5) * 2) + Math.floor(y / 3)) % 4 === 0 ? k.WHITE : k.INK));
  lathe(v, 5, 5, 32, 37, () => 1, k.WOOD_DEEP);
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (i / 8), b = Math.PI * ((i + 1) / 8);
    // The crook: from the shaft's top, over and down the far side.
    line(v, [7.3 - Math.cos(a) * 2.3, 37 + Math.sin(a) * 2.3, 5.5], [7.3 - Math.cos(b) * 2.3, 37 + Math.sin(b) * 2.3, 5.5], k.WOOD_DEEP);
  }
  return prop(v, Q);
}

/** Paraplyställ: a glazed ceramic cylinder with a blue band. */
function umbrellaStand(k: Ids) {
  const v = new Volume(12, 18, 12);
  lathe(v, 6, 6, 0, 18, () => 5.6, (_x, y) => (y === 3 || y === 14 ? k.KAKEL_BLUE : k.CERAMIC), (y) => (y < 1 ? 0 : 4.6));
  return prop(v, H);
}

/** En pall: a round seat with a worn middle, three splayed legs and a ring. */
function stool(k: Ids) {
  const v = new Volume(12, 14, 12);
  lathe(v, 6, 6, 12, 14, () => 5.8, (x, y, z) => (y === 13 && Math.hypot(x + 0.5 - 6, z + 0.5 - 6) < 2.5 ? k.WOOD_LIGHT : y === 12 ? k.WOOD_DARK : k.WOOD));
  for (const a of [0.4, 2.5, 4.6]) line(v, [6 + Math.cos(a) * 3.5, 12, 6 + Math.sin(a) * 3.5], [6 + Math.cos(a) * 5.2, 0, 6 + Math.sin(a) * 5.2], k.WOOD_DARK, 0.6);
  lathe(v, 6, 6, 4, 5, () => 4.6, k.WOOD_DARK, () => 3.8);
  return prop(v, H);
}

/** Telefonen: a red dial phone, the handset on its cradle, a rotary dial with holes, a curly cord. */
function phone(k: Ids) {
  const v = new Volume(14, 10, 16);
  roundBox(v, 0, 0, 2, 14, 2, 16, 3, k.ALLMOGE_RED);
  for (let y = 2; y < 6; y++) roundBox(v, y - 2, y, 2 + (y - 2), 14 - (y - 2), y + 1, 16, 3, k.ALLMOGE_RED);
  for (let y = 2; y < 6; y++) for (let x = 3; x < 11; x++) {
    const d = Math.hypot(x + 0.5 - 7, y + 0.5 - 4);
    if (d < 3.2) dot(v, x, y, 15, d < 1 ? k.WHITE : d > 1.8 && Math.floor(angleOf(x, y, 7, 4) * 2) % 2 ? k.INK : k.CREAM);
  }
  cylX(v, 7.5, 6, 1.5, 1, 13, k.ALLMOGE_RED);
  for (const x of [1, 11]) roundBox(v, x, 6, 4, x + 2, 9, 9, 1, k.ALLMOGE_RED);
  for (let z = 0; z < 4; z++) dot(v, 13, 1 + (z % 2), z, k.SOOT);
  return prop(v, S);
}

/** Telefonbordet: a little table with a seat beside it and the phone book on a shelf. */
function phoneTable(k: Ids) {
  const v = new Volume(30, 24, 14);
  box(v, 0, 22, 0, 16, 24, 14, grain(k, 'x', k.WOOD, 71));
  for (const [x, z] of [[1, 1], [14, 1], [1, 12], [14, 12]]) box(v, x, 0, z, x + 1, 22, z + 1, k.WOOD_DARK);
  box(v, 1, 8, 1, 15, 9, 13, k.WOOD_DARK);
  box(v, 3, 9, 3, 12, 11, 11, k.STRAW);                       // the phone book
  box(v, 3, 11, 3, 12, 12, 11, k.YELLOW);
  roundBox(v, 16, 13, 1, 30, 16, 13, 2, k.PLUSH);
  for (const [x, z] of [[17, 2], [28, 2], [17, 11], [28, 11]]) box(v, x, 0, z, x + 1, 13, z + 1, k.WOOD_DARK);
  box(v, 16, 13, 0, 30, 22, 2, k.WOOD_DARK);
  return prop(v, H);
}

/** Hallspegeln: an oval mirror in a gilt frame with a little shelf under it (a wall piece). */
function mirror(k: Ids) {
  const v = new Volume(20, 30, 4);
  for (let y = 4; y < 30; y++) for (let x = 0; x < 20; x++) {
    const d = ((x + 0.5 - 10) / 9.5) ** 2 + ((y + 0.5 - 17) / 12.5) ** 2;
    if (d > 1) continue;
    dot(v, x, y, 0, d > 0.78 ? k.GOLD : Math.abs(x - y + 6) < 2 ? k.WHITE : k.GLASS);
    if (d > 0.78) dot(v, x, y, 1, k.GOLD);
  }
  box(v, 3, 3, 0, 17, 4, 4, k.WOOD_DARK);
  for (const x of [5, 14]) box(v, x, 0, 0, x + 1, 3, 2, k.WOOD_DARK);
  dot(v, 10, 4, 2, k.BRASS);                                  // a key left on the shelf
  return wall(v, H);
}

/** The hall's runner: a long rag rug in blue, cream and red. */
function runner(k: Ids) {
  const v = new Volume(24, 1, 96), colours = [k.QUILT_BLUE, k.CREAM, k.ALLMOGE, k.CREAM, k.ALLMOGE_RED, k.CREAM];
  for (let z = 0; z < 96; z++) for (let x = 0; x < 24; x++) {
    if (z === 0 || z === 95) { if (x % 2) v.set(x, 0, z, k.CREAM); continue; }
    v.set(x, 0, z, x < 2 || x > 21 ? k.INK : hash(x, 0, z, 72) < 0.1 ? k.CREAM : colours[Math.floor((z - 1) / 4) % colours.length]);
  }
  return prop(v, H);
}

/** Ytterdörren: a panelled door in allmoge blue, a glazed top with bars, a brass handle, keyhole and letterbox, a white frame (a wall piece). */
function frontDoor(k: Ids) {
  const v = new Volume(36, 72, 3);
  box(v, 0, 0, 0, 36, 72, 2, k.WHITE);
  box(v, 3, 0, 0, 33, 68, 1, k.ALLMOGE);
  box(v, 3, 0, 1, 33, 68, 2, 0);
  for (const [x0, x1, y0, y1] of [[6, 16, 6, 30], [20, 30, 6, 30], [6, 30, 34, 42]]) {
    box(v, x0, y0, 1, x1, y1, 2, k.ALLMOGE);
    box(v, x0 + 1, y0 + 1, 1, x1 - 1, y1 - 1, 2, 0);
  }
  box(v, 6, 46, 0, 30, 64, 1, k.GLASS);
  box(v, 6, 54, 0, 30, 55, 2, k.WHITE);
  box(v, 17, 46, 0, 19, 64, 2, k.WHITE);
  box(v, 26, 34, 1, 29, 35, 3, k.BRASS);                     // the handle
  dot(v, 27, 31, 1, k.SOOT);
  box(v, 12, 37, 1, 24, 39, 2, k.BRASS);                     // the letterbox
  return wall(v, H);
}

/** Dörrmattan: coir with "VÄLKOMMEN" woven in. */
function doormat(k: Ids) {
  const v = new Volume(40, 1, 26);
  box(v, 0, 0, 0, 40, 1, 26, speckle(k.KRAFT, k.WICKER, 0.3, 73));
  for (let x = 0; x < 40; x++) for (const z of [0, 25]) v.set(x, 0, z, k.WICKER_DARK);
  const text = 'VÄLKOMMEN', tw = text.length * 4 - 1, x0 = Math.floor((40 - tw) / 2);
  const m = new Volume(40, 7, 1);
  write(m, text, x0, 5, 0, k.WOOD_DEEP);
  for (let y = 0; y < 7; y++) for (let x = 0; x < 40; x++) if (m.get(x, y, 0)) v.set(x, 0, 16 - y, k.WOOD_DEEP);
  return prop(v, Q);
}

/** Skohyllan: a low rack with shoes in pairs, mormor's Sunday shoes and a pair of sneakers. */
function shoeRack(k: Ids) {
  const v = new Volume(32, 12, 10);
  for (const y of [0, 6]) box(v, 0, y, 0, 32, y + 1, 10, (x) => (x % 3 === 0 ? k.WOOD_DARK : 0));
  for (const x of [0, 31]) box(v, x, 0, 0, x + 1, 11, 10, k.WOOD_DARK);
  box(v, 0, 11, 0, 32, 12, 10, grain(k, 'x', k.WOOD, 74));
  const shoe = (x0: number, y0: number, c: number, sole: number) => {
    for (const dx of [0, 3]) {
      box(v, x0 + dx, y0 + 1, 1, x0 + dx + 2, y0 + 2, 9, sole);
      box(v, x0 + dx, y0 + 2, 1, x0 + dx + 2, y0 + 3, 9, c);
      box(v, x0 + dx, y0 + 3, 1, x0 + dx + 2, y0 + 5, 4, c);
    }
  };
  shoe(2, 0, k.MAHOGANY, k.SOOT);
  shoe(10, 0, k.INK, k.SOOT);
  shoe(19, 0, k.WHITE, k.CREAM);
  shoe(4, 6, k.FELT, k.SOOT);
  shoe(14, 6, k.PLUSH_DARK, k.WOOD_DEEP);
  return prop(v, H);
}

/** En hatt: mormor's Sunday hat, felt with a wide brim, a ribbon and a feather. */
function hat(k: Ids) {
  const v = new Volume(16, 8, 16);
  lathe(v, 8, 8, 0, 1, () => 7.8, k.FELT);
  lathe(v, 8, 8, 1, 7, (y) => 4.6 - (y > 5 ? (y - 5) * 0.8 : 0), (_x, y) => (y === 1 || y === 2 ? k.ALLMOGE_RED : k.FELT));
  line(v, [10.5, 3, 11], [14, 7, 12], k.CREAM);
  dot(v, 13, 7, 12, k.WHITE);
  return prop(v, Q);
}

/** En handväska: mormor's black handbag with a brass clasp and a round handle. */
function handbag(k: Ids) {
  const v = new Volume(14, 16, 8);
  for (let y = 0; y < 10; y++) {
    const inset = y > 6 ? y - 6 : 0;
    roundBox(v, inset, y, 0, 14 - inset, y + 1, 8, 2, k.SOOT);
  }
  box(v, 4, 9, 3, 10, 10, 5, k.GOLD);
  dot(v, 6, 10, 4, k.GOLD); dot(v, 7, 10, 4, k.GOLD);
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * (i / 10), b = Math.PI * ((i + 1) / 10);
    line(v, [7.5 + Math.cos(a) * 4.5, 9.5 + Math.sin(a) * 5, 4.5], [7.5 + Math.cos(b) * 4.5, 9.5 + Math.sin(b) * 5, 4.5], k.SOOT);
  }
  return prop(v, S);
}

/** Hallens taklampa: a milk-glass globe on a brass rose (hangs from its top). */
function globeLamp(k: Ids) {
  const v = new Volume(14, 20, 14);
  lathe(v, 7, 7, 19, 20, () => 3, k.BRASS);
  box(v, 6, 13, 6, 8, 19, 8, k.BRASS);
  lathe(v, 7, 7, 11, 13, () => 2.6, k.GOLD);
  return hang(v, 1 / 40);
}

/** The globe's milk glass, lit: its own mesh. */
function globeGlow(k: Ids) {
  const v = new Volume(14, 20, 14);
  blob(v, 7, 6, 7, 6, 5.6, 6, k.LAMP);
  return hang(v, 1 / 40);
}

export const HALL_MODELS = {
  hatRack, boots, umbrella, umbrellaStand, stool, phone, phoneTable, mirror, runner, frontDoor, doormat, shoeRack,
  hat, handbag, globeLamp, globeGlow,
};

/**
 * Vardagsrummet's models (three-free): the kakelugn, gökuren, the rocking chair and armchairs, the
 * best sofa under its plastic, the fat TV, the radio, the bookcase, dala horses, Misse asleep.
 * Furniture at 1/32 m, small things at 1/48–1/64 m (models.ts has the conventions).
 */
import { Volume } from '@voxelparty/sdk/core';
import { angleOf, blob, box, checks, cylX, cylZ, dot, grain, hang, hash, lathe, line, prop, roundBox, speckle, wall, type Paint, type Pick } from './kit';
import type { Ids } from './textures';

const H = 1 / 32, Q = 1 / 48, S = 1 / 64;

/** Kakelugnen: a round tiled stove, white tiles with a blue flower each, brass doors, a crowned top. */
function kakelugn(k: Ids) {
  const v = new Volume(30, 78, 30), c = 15;
  box(v, 0, 0, 0, 30, 2, 30, k.GREY);
  box(v, 1, 2, 1, 29, 4, 29, k.KAKEL);
  const tiles: Pick = (x, y, z) => {
    const a = angleOf(x, z, c, c), front = Math.abs(a - Math.PI / 2);
    if (y >= 12 && y < 24 && front < 0.5) return Math.abs(a - Math.PI / 2) < 0.05 ? k.SOOT : y === 17 && front > 0.3 && front < 0.4 ? k.GOLD : k.BRASS;
    if (y >= 52 && y < 54 && front < 0.1) return k.BRASS;   // the damper's knob
    // Tiles 8 voxels tall, a pale seam between them, a small blue flower in the middle of every other one.
    const u = a * 13, row = (y - 4) % 8, col = u % 7, odd = (Math.floor((y - 4) / 8) + Math.floor(u / 7)) % 2;
    if (row === 0 || col < 0.6) return k.PORC;
    if (odd && Math.abs(row - 4) <= 1 && Math.abs(col - 3.5) <= 0.8) return row === 4 && Math.abs(col - 3.5) < 0.4 ? k.YELLOW : k.KAKEL_BLUE;
    return hash(x, y, z, 70) < 0.06 ? k.PORC_SHADE : k.KAKEL;
  };
  lathe(v, c, c, 4, 62, () => 13, tiles);
  lathe(v, c, c, 38, 40, () => 14, (_x, y) => (y === 38 ? k.KAKEL_BLUE : k.KAKEL));
  lathe(v, c, c, 62, 66, (y) => 14.5 - (y - 62) * 0.2, (_x, y) => (y === 63 ? k.KAKEL_BLUE : k.KAKEL));
  lathe(v, c, c, 66, 72, (y) => 13 - (y - 66) * 0.7, k.KAKEL);
  lathe(v, c, c, 72, 78, (y) => 3.5 - Math.abs(y - 74.5) * 0.6, (_x, y) => (y === 74 ? k.GOLD : k.KAKEL_BLUE));
  // The knobs on the doors.
  dot(v, 13, 18, 28, k.GOLD); dot(v, 16, 18, 28, k.GOLD);
  return prop(v, H);
}

/** Gökuren: a carved Black Forest house with a dial, the cuckoo peeking out, a pendulum and two pinecone weights on chains (a wall piece; its origin is at the weights' feet). */
function cuckooClock(k: Ids) {
  const v = new Volume(24, 54, 10);
  for (const x of [8, 15]) {
    blob(v, x + 0.5, 4.5, 4.5, 1.9, 4.6, 1.9, (_x, y) => (y % 2 ? k.WOOD_DEEP : k.WOOD_DARK));
    dot(v, x, 9, 4, k.BRASS);
    for (let y = 10; y < 30; y += 1) dot(v, x, y, 4, y % 2 ? k.STEEL : k.STEEL_LIGHT);
  }
  box(v, 12, 15, 3, 13, 30, 4, k.WOOD_DARK);           // the pendulum's rod and its leaf
  blob(v, 12.5, 14, 3.5, 2.6, 2.6, 0.6, k.GOLD);
  dot(v, 12, 14, 4, k.WOOD_DEEP);
  box(v, 3, 30, 0, 21, 46, 8, grain(k, 'y', k.WOOD_DARK, 9));
  for (let x = 3; x < 21; x++) dot(v, x, 29, 4, x % 2 ? k.WOOD_DEEP : 0);   // the scalloped foot
  for (let y = 31; y < 45; y++) for (let x = 6; x < 18; x++) {
    const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 37.5);
    if (d < 5.6) dot(v, x, y, 8, d > 4.9 ? k.GOLD : k.PORC);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dot(v, Math.floor(12 + Math.sin(a) * 4.2), Math.floor(37.5 + Math.cos(a) * 4.2), 8, k.INK);
  }
  line(v, [12, 37.5, 8.5], [12, 41, 8.5], k.INK);
  line(v, [12, 37.5, 8.5], [14.6, 36.6, 8.5], k.INK);
  dot(v, 11, 37, 9, k.BRASS);
  // The roof, with carved leaves along its eaves.
  for (let y = 46; y < 54; y++) {
    const hw = 12 - (y - 46) * 1.5;
    if (hw <= 0) break;
    box(v, Math.round(12 - hw), y, 0, Math.round(12 + hw), y + 1, 10, y === 46 ? k.WOOD_DARK : k.WOOD_DEEP);
    for (const x of [Math.round(12 - hw), Math.round(12 + hw) - 1]) dot(v, x, y, 9, hash(x, y, 9) < 0.5 ? k.WOOD : k.WOOD_DARK);
  }
  box(v, 10, 43, 8, 14, 46, 9, k.WOOD_DEEP);           // the cuckoo's doors, ajar
  blob(v, 12, 44.5, 9, 1.2, 1, 1, k.WOOD_LIGHT);
  dot(v, 12, 44, 9, k.YELLOW);
  for (const x of [4, 20]) for (const y of [33, 39]) blob(v, x, y, 8, 1.3, 1.6, 0.8, k.WOOD);   // carved leaves on the sides
  blob(v, 12, 52, 5, 1.6, 1, 1.4, k.WOOD_LIGHT);       // a little bird on the ridge
  return wall(v, Q);
}

/** Gungstolen: grained rockers, a cushion, a leaning spindle back with a crocheted blanket over it. */
function rockingChair(k: Ids) {
  const v = new Volume(20, 34, 30), g = grain(k, 'z', k.WOOD_DARK, 10);
  for (let z = 0; z < 30; z++) {
    const yb = Math.round(((z - 14.5) / 14.5) ** 2 * 4);
    for (const x of [1, 17]) box(v, x, yb, z, x + 2, yb + 2, z + 1, k.WOOD_DARK);
  }
  for (const x of [1, 17]) {
    box(v, x, 2, 21, x + 2, 13, 23, k.WOOD_DARK);
    box(v, x, 2, 7, x + 2, 13, 9, k.WOOD_DARK);
    box(v, x, 13, 22, x + 2, 20, 24, k.WOOD_DARK);
    box(v, x - (x === 1 ? 1 : 0), 20, 8, x + 2 + (x === 17 ? 1 : 0), 21, 26, k.WOOD);   // the arms
  }
  roundBox(v, 0, 12, 4, 20, 14, 26, 2, g);
  roundBox(v, 1, 14, 6, 19, 15, 25, 2, k.GINGHAM);
  for (let y = 14; y < 34; y++) {
    const zb = Math.round(5 - (y - 14) * 0.2);
    for (const x of [1, 17]) box(v, x, y, zb, x + 2, y + 1, zb + 2, k.WOOD_DARK);
    if (y < 30) for (const x of [5, 8, 11, 14]) dot(v, x, y, zb, k.WOOD);
    if (y >= 30 && y < 33) box(v, 1, y, zb, 19, y + 1, zb + 2, g);
    if (y === 33) box(v, 6, y, zb, 14, y + 1, zb + 2, g);
    if (y >= 17 && y < 30) box(v, 3, y, zb + 1, 17, y + 1, zb + 2, (x, yy) => (hash(x, yy, 3) < 0.12 ? k.LILAC : ((Math.floor(x / 3) + Math.floor(yy / 3)) & 1 ? k.PINK : k.CREAM)));
  }
  for (let x = 3; x < 17; x += 2) dot(v, x, 16, 3, k.PINK);   // the blanket's fringe
  return prop(v, H);
}

/** The rose plush with cream flowers that the armchairs and the footstool share. */
const plush = (k: Ids): Pick => (x, y, z) => {
  // Small cream roses in a loose grid (every 6 voxels, nudged), each with a green leaf: a pattern, not noise.
  const cx = Math.floor((x + 3) / 6), cy = Math.floor((y + 3 + (cx % 2) * 3) / 6), cz = Math.floor((z + 3) / 6);
  const rx = (x + 3) % 6, ry = (y + 3 + (cx % 2) * 3) % 6, rz = (z + 3) % 6;
  if (hash(cx, cy, cz, 21) < 0.55 && Math.abs(rx - 3) + Math.abs(ry - 3) + Math.abs(rz - 3) <= 1) return k.CREAM;
  if (hash(cx, cy, cz, 21) < 0.55 && rx === 4 && ry === 2) return k.MOSS_VELVET;
  return k.PLUSH;
};

/** En fåtölj: rolled arms, a deep cushion with piping, plush with flowers, a lace cover on the back. */
function armchair(k: Ids) {
  const v = new Volume(26, 30, 26), f = plush(k);
  for (const [cx, cz] of [[3, 3], [23, 3], [3, 23], [23, 23]]) lathe(v, cx, cz, 0, 3, (y) => 1.6 - y * 0.2, k.WOOD_DARK);
  roundBox(v, 1, 3, 1, 25, 11, 25, 3, f);
  for (let x = 1; x < 25; x++) for (const z of [24]) dot(v, x, 3, z, x % 2 ? k.PLUSH_DARK : k.GOLD);
  roundBox(v, 4, 11, 6, 22, 14, 25, 3, f);
  roundBox(v, 4, 13, 6, 22, 14, 25, 3, k.PLUSH_DARK);
  roundBox(v, 5, 13, 7, 21, 14, 24, 3, f);
  roundBox(v, 2, 11, 1, 24, 27, 7, 3, f);
  cylX(v, 27, 4, 3, 2, 24, f);
  for (const cx of [3, 23]) {
    cylZ(v, cx, 16, 3, 3, 25, f);
    for (let y = 13; y < 20; y++) for (let x = cx - 3; x < cx + 3; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - 16) > 2.2 && Math.hypot(x + 0.5 - cx, y + 0.5 - 16) < 3.1) dot(v, x, y, 25, k.PLUSH_DARK);
  }
  box(v, 7, 19, 7, 19, 29, 8, (x, y) => ((x + y) % 3 === 0 ? k.CREAM : k.WHITE));   // the lace on the back
  for (let x = 7; x < 19; x += 2) dot(v, x, 18, 7, k.WHITE);
  return prop(v, H);
}

/** Finsoffan under its plastic: green velvet, buttoned back, a carved top rail, tasselled pillows, the plastic's shine. */
function plasticSofa(k: Ids) {
  const v = new Volume(60, 30, 26);
  const velvet: Pick = (x, y, z) => (hash(x, y, z, 31) < 0.07 ? k.GLASS : k.MOSS_VELVET);
  for (const [cx, cz] of [[3, 3], [57, 3], [3, 23], [57, 23]]) lathe(v, cx, cz, 0, 4, (y) => (y === 1 ? 2 : 1.5), k.WOOD_DARK);
  roundBox(v, 1, 4, 1, 59, 11, 25, 2, velvet);
  for (let x = 2; x < 58; x++) dot(v, x, 4, 24, x % 2 ? k.WOOD_DARK : k.MOSS_VELVET);
  for (const [x0, x1] of [[5, 22], [22, 38], [38, 55]]) {
    roundBox(v, x0, 11, 7, x1, 15, 25, 2, velvet);
    box(v, x0, 14, 24, x1, 15, 25, k.GLASS);
  }
  roundBox(v, 3, 11, 1, 57, 26, 7, 2, velvet);
  for (let x = 8; x < 56; x += 8) for (const y of [16, 21]) dot(v, x + (y === 21 ? 4 : 0), y, 7, k.LEAF_DARK);   // the buttons
  box(v, 2, 26, 1, 58, 28, 6, grain(k, 'x', k.WOOD_DARK, 32));
  box(v, 22, 28, 2, 38, 30, 5, k.WOOD_DARK);           // the carved crest
  box(v, 26, 29, 2, 34, 30, 5, k.WOOD_DEEP);
  for (const cx of [3, 57]) cylZ(v, cx, 15, 3.2, 3, 25, velvet);
  for (const [x0, c] of [[7, k.PLUSH], [44, k.CREAM]] as const) {
    roundBox(v, x0, 15, 7, x0 + 10, 23, 10, 2, c);
    for (const [x, y] of [[x0, 15], [x0 + 9, 15], [x0, 22], [x0 + 9, 22]]) dot(v, x, y, 10, k.GOLD);
  }
  return prop(v, H);
}

/** Soffbordet: an oval top, four turned legs, a shelf below with magazines. */
function coffeeTable(k: Ids) {
  const v = new Volume(40, 16, 24);
  const oval = (x: number, z: number, rx: number, rz: number) => ((x + 0.5 - 20) / rx) ** 2 + ((z + 0.5 - 12) / rz) ** 2 <= 1;
  const top = grain(k, 'x', k.WOOD_DARK, 33);
  for (let z = 0; z < 24; z++) for (let x = 0; x < 40; x++) {
    if (oval(x, z, 20, 12)) {
      v.set(x, 14, z, k.WOOD_DEEP);
      v.set(x, 15, z, oval(x, z, 19, 11) ? top(x, 15, z) : k.WOOD_DEEP);
    }
    if (oval(x, z, 15, 8)) v.set(x, 4, z, k.WOOD_DARK);
  }
  for (const [cx, cz] of [[9, 6], [31, 6], [9, 18], [31, 18]]) lathe(v, cx, cz, 0, 14, (y) => (y === 3 || y === 10 ? 1.7 : 1.1), k.WOOD_DARK);
  box(v, 12, 5, 8, 22, 6, 15, k.PAPER);
  box(v, 13, 6, 9, 23, 7, 16, k.ALLMOGE);
  box(v, 25, 5, 9, 31, 6, 15, k.PINK);
  return prop(v, H);
}

/** Bokhyllan: shelves of books in many colours and sizes, gold on some spines, one red book a little pulled out, a photo and a vase. */
function bookcase(k: Ids) {
  const v = new Volume(36, 64, 10);
  box(v, 0, 0, 0, 2, 64, 10, grain(k, 'y', k.WOOD_DARK, 40));
  box(v, 34, 0, 0, 36, 64, 10, grain(k, 'y', k.WOOD_DARK, 41));
  box(v, 2, 0, 0, 34, 64, 1, k.WOOD_DEEP);
  box(v, 0, 60, 0, 36, 64, 10, k.WOOD_DARK);
  box(v, 0, 63, 0, 36, 64, 10, k.WOOD_DEEP);
  const colours = [k.FALU_FLAT, k.ALLMOGE, k.MOSS_VELVET, k.WOOD_DEEP, k.PLUSH_DARK, k.INK, k.CREAM, k.KRAFT, k.MAHOGANY, k.QUILT_BLUE];
  const shelves = [0, 14, 28, 42];
  for (const [si, y0] of shelves.entries()) {
    box(v, 2, y0, 1, 34, y0 + 2, 10, grain(k, 'x', k.WOOD_DARK, y0));
    if (si === 3) {
      // The top shelf: a framed photo and a vase.
      box(v, 6, y0 + 2, 4, 13, y0 + 11, 5, k.GOLD);
      box(v, 7, y0 + 3, 4, 12, y0 + 10, 5, k.PAPER);
      blob(v, 9.5, y0 + 7, 4, 1.6, 2, 0.6, k.SKIN);
      lathe(v, 25, 5, y0 + 2, y0 + 10, (y) => 2.4 - Math.abs(y - y0 - 5) * 0.25, k.KAKEL_BLUE);
      for (const [x, z] of [[24, 4], [26, 6], [25, 5]]) dot(v, x, y0 + 11, z, k.RED);
      continue;
    }
    let x = 2;
    while (x < 33) {
      const h1 = hash(x, y0, 0, 43), w = h1 < 0.6 ? 1 : 2, hgt = 8 + Math.floor(hash(x, y0, 1, 44) * 4);
      if (hash(x, y0, 2, 45) < 0.06) { x += 2; continue; }
      const c = colours[Math.floor(hash(x, y0, 3, 46) * colours.length)];
      const secret = si === 1 && x >= 15 && x <= 16;
      box(v, x, y0 + 2, 2, Math.min(34, x + w), y0 + 2 + hgt, secret ? 10 : 9, secret ? k.FALU_FLAT : c);
      if (hash(x, y0, 4, 47) < 0.4) box(v, x, y0 + hgt - 1, secret ? 9 : 8, Math.min(34, x + w), y0 + hgt, secret ? 10 : 9, k.GOLD);
      x += w;
    }
  }
  return prop(v, H);
}

/** En dalahäst: the red horse with a white and yellow harness, kurbits flowers on its flanks, a painted face. */
function dalahorse(k: Ids, body: number) {
  const v = new Volume(8, 20, 18);
  box(v, 1, 0, 2, 7, 7, 16, body);
  box(v, 1, 0, 6, 7, 5, 12, 0);                        // the arch between the legs
  box(v, 1, 7, 1, 7, 13, 16, body);
  for (const [y, z] of [[12, 1], [7, 1]]) box(v, 1, y, z, 7, y + 1, z + 1, 0);
  for (let y = 13; y < 18; y++) box(v, 1, y, Math.round(11 + (y - 13) * 0.6), 7, y + 1, 17, body);
  box(v, 1, 15, 14, 7, 19, 18, body);
  box(v, 1, 13, 16, 7, 15, 18, body);
  for (const x of [2, 5]) box(v, x, 19, 14, x + 1, 20, 16, body);
  // Paint, both flanks: a harness and saddle, flowers, the face.
  for (const x of [1, 6]) {
    for (let z = 5; z < 13; z++) dot(v, x, 13, z, k.WHITE);
    for (let y = 8; y < 13; y++) dot(v, x, y, 5, k.YELLOW);
    for (let y = 8; y < 13; y++) dot(v, x, y, 12, k.YELLOW);
    for (const [y, z, c] of [[10, 8, k.WHITE], [10, 9, k.YELLOW], [9, 9, k.GREEN], [11, 9, k.GREEN], [10, 10, k.WHITE], [9, 7, k.BLUE], [11, 10, k.BLUE], [8, 10, k.WHITE]] as const) dot(v, x, y, z, c);
    for (let y = 13; y < 17; y++) dot(v, x, y, Math.round(12 + (y - 13) * 0.6), k.WHITE);   // the bridle down the neck
    dot(v, x, 17, 16, k.WHITE); dot(v, x, 17, 15, k.INK);
    dot(v, x, 14, 17, k.YELLOW);
  }
  return prop(v, S);
}

/** Tjock-TV:n: a wooden cabinet on legs, a bulging grey screen with a glint, a speaker grille, knobs, rabbit ears. */
function tv(k: Ids) {
  const v = new Volume(24, 34, 20);
  for (const [cx, cz] of [[3, 3], [21, 3], [3, 16], [21, 16]]) lathe(v, cx, cz, 0, 8, (y) => 0.9 + y * 0.08, k.WOOD_DARK);
  roundBox(v, 0, 8, 0, 24, 26, 18, 2, grain(k, 'x', k.WOOD_DARK, 50));
  box(v, 2, 10, 18, 18, 25, 19, k.WOOD_LIGHT);
  for (let y = 11; y < 24; y++) for (let x = 3; x < 17; x++) {
    const corner = Math.min(x - 3, 16 - x) + Math.min(y - 11, 23 - y);
    if (corner < 2) continue;
    dot(v, x, y, 18, Math.abs(x - y + 6) < 1 && y > 17 ? k.GLASS : k.SCREEN);
    if (corner > 4) dot(v, x, y, 19, Math.abs(x - y + 6) < 1 && y > 17 ? k.GLASS : k.SCREEN);
  }
  box(v, 19, 11, 18, 23, 19, 19, (x, y) => (y % 2 ? k.WOOD_DARK : k.KRAFT));
  dot(v, 20, 21, 19, k.STEEL_LIGHT); dot(v, 20, 23, 19, k.STEEL_LIGHT); dot(v, 22, 21, 19, k.STEEL_LIGHT);
  box(v, 10, 26, 7, 14, 27, 11, k.SOOT);
  line(v, [11, 27, 9], [4, 33, 9], k.STEEL_LIGHT);
  line(v, [13, 27, 9], [20, 33, 9], k.STEEL_LIGHT);
  return prop(v, H);
}

/** Radion: a rounded wooden set, a cloth grille with slats, a lit dial with a red needle, the magic eye, two knobs. */
function radio(k: Ids) {
  const v = new Volume(24, 16, 12);
  box(v, 0, 0, 0, 24, 1, 11, k.WOOD_DEEP);
  box(v, 0, 1, 0, 24, 14, 11, grain(k, 'x', k.WOOD_DARK, 51));
  box(v, 2, 14, 0, 22, 16, 11, grain(k, 'x', k.WOOD_DARK, 51));
  box(v, 0, 14, 0, 2, 15, 11, k.WOOD_DARK);
  box(v, 22, 14, 0, 24, 15, 11, k.WOOD_DARK);
  box(v, 2, 3, 11, 13, 13, 12, (x) => (x % 3 === 0 ? k.WOOD_DARK : k.KRAFT));
  box(v, 15, 9, 11, 22, 14, 12, k.CREAM);
  for (let x = 15; x < 22; x++) if (x % 2) dot(v, x, 12, 11, k.INK);
  dot(v, 18, 10, 11, k.RED); dot(v, 18, 11, 11, k.RED); dot(v, 18, 12, 11, k.RED);
  dot(v, 18, 6, 11, k.GREEN);
  for (const x0 of [15, 20]) box(v, x0, 2, 11, x0 + 2, 4, 12, k.WOOD_DEEP);
  return prop(v, Q);
}

/** Ett runt sidobord: a grained top, a turned pedestal on three feet. */
function sideTable(k: Ids) {
  const v = new Volume(20, 22, 20);
  const top = grain(k, 'x', k.WOOD_DARK, 52);
  lathe(v, 10, 10, 20, 22, (y) => (y === 20 ? 9.2 : 9.8), (x, y, z) => (y === 20 ? k.WOOD_DEEP : top(x, y, z)));
  lathe(v, 10, 10, 2, 20, (y) => (y % 6 === 0 ? 2.3 : 1.5), k.WOOD_DARK);
  for (const a of [0.3, 2.4, 4.5]) line(v, [10, 3, 10], [10 + Math.cos(a) * 8, 0.5, 10 + Math.sin(a) * 8], k.WOOD_DARK, 0.8);
  return prop(v, H);
}

/** Fotpallen: a buttoned plush top, a gold fringe, turned legs. */
function footstool(k: Ids) {
  const v = new Volume(14, 10, 12), f = plush(k);
  for (const [cx, cz] of [[2, 2], [12, 2], [2, 10], [12, 10]]) lathe(v, cx, cz, 0, 4, (y) => (y === 1 ? 1.5 : 1), k.WOOD_DARK);
  roundBox(v, 0, 4, 0, 14, 9, 12, 3, f);
  roundBox(v, 1, 9, 1, 13, 10, 11, 3, f);
  for (const [x, z] of [[4, 4], [9, 4], [4, 8], [9, 8], [7, 6]]) dot(v, x, 9, z, k.PLUSH_DARK);
  for (let x = 0; x < 14; x++) { if (x % 2) { dot(v, x, 4, 0, k.GOLD); dot(v, x, 4, 11, k.GOLD); } }
  return prop(v, H);
}

/** Golvlampan: a brass foot and pole, a pink pleated shade with a cream trim and a gold fringe. */
function floorLamp(k: Ids) {
  const v = new Volume(16, 52, 16), r = (y: number) => 7.6 - (y - 38) * 0.3;
  lathe(v, 8, 8, 0, 2, (y) => (y ? 5 : 6), k.BRASS);
  lathe(v, 8, 8, 2, 48, (y) => (y === 14 || y === 28 ? 1.4 : 0.8), (_x, y) => (y === 14 || y === 28 ? k.GOLD : k.BRASS));
  lathe(v, 8, 8, 38, 50, r, (x, y, z) => (y === 38 || y === 49 ? k.CREAM : Math.floor(angleOf(x, z, 8, 8) * 5) % 2 ? k.PINK : k.ROSEPINK), (y) => r(y) - 1);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    if (i % 2) for (const y of [36, 37]) dot(v, Math.floor(8 + Math.cos(a) * 7.2), y, Math.floor(8 + Math.sin(a) * 7.2), k.GOLD);
  }
  dot(v, 10, 36, 8, k.GOLD); dot(v, 10, 35, 8, k.BRASS);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) line(v, [8, 47, 8], [8 + dx * r(47), 47, 8 + dz * r(47)], k.BRASS);   // the shade's spokes
  return prop(v, H);
}

/** The floor lamp's lit shade and bulb, its own mesh. */
function floorLampGlow(k: Ids) {
  const v = new Volume(16, 52, 16), r = (y: number) => 7.6 - (y - 38) * 0.3;
  lathe(v, 8, 8, 39, 49, (y) => r(y) - 1, k.LAMP, (y) => r(y) - 2);
  blob(v, 8, 42, 8, 1.8, 2.2, 1.8, k.LAMP);
  return prop(v, H);
}

/** Morfars porträtt: a gilt frame, morfar in his Sunday suit, a magnificent moustache. */
function portrait(k: Ids) {
  const v = new Volume(18, 22, 2);
  box(v, 0, 0, 0, 18, 22, 2, k.GOLD);
  box(v, 2, 2, 1, 16, 20, 2, 0);
  box(v, 2, 2, 0, 16, 20, 1, (x, y) => (hash(x, y, 0, 60) < 0.2 ? k.WOOD_DARK : k.WOOD_DEEP));
  for (let y = 2; y < 8; y++) box(v, 4 - (y < 6 ? 1 : 0), y, 0, 14 + (y < 6 ? 1 : 0), y + 1, 1, k.INK);
  box(v, 8, 6, 0, 10, 8, 1, k.WHITE);
  dot(v, 9, 6, 0, k.RED); dot(v, 9, 7, 0, k.RED);
  for (let y = 8; y < 17; y++) for (let x = 5; x < 13; x++) if (((x + 0.5 - 9) / 3.4) ** 2 + ((y + 0.5 - 12.5) / 4.4) ** 2 <= 1) dot(v, x, y, 0, k.SKIN);
  box(v, 6, 16, 0, 12, 18, 1, k.GREY);
  dot(v, 7, 13, 0, k.INK); dot(v, 10, 13, 0, k.INK);
  for (const [x, y] of [[6, 11], [7, 11], [8, 11], [9, 11], [10, 11], [11, 11], [5, 12], [12, 12], [4, 13], [13, 13]]) dot(v, x, y, 0, k.HAIR);
  return wall(v, H);
}

/** Misse: an orange tabby curled up asleep, tail round her paws, ears up, eyes shut. */
function cat(k: Ids) {
  const v = new Volume(24, 10, 18);
  const tabby: Pick = (x, y, z) => (y < 2 ? k.CAT_LIGHT : Math.floor((x + z * 0.4) / 2.5) % 2 ? k.CAT : k.BREAD);
  blob(v, 11, 4, 8.5, 9.5, 4.2, 7, tabby);
  blob(v, 18, 4.5, 12.5, 3.6, 3.2, 3.4, (_x, y) => (y < 3 ? k.CAT_LIGHT : k.CAT));
  for (const x of [16, 20]) { dot(v, x, 8, 12, k.CAT); dot(v, x, 7, 12, k.CAT); dot(v, x, 7, 13, k.PINK); }
  dot(v, 16, 5, 15, k.INK); dot(v, 17, 5, 15, k.INK); dot(v, 19, 5, 15, k.INK); dot(v, 20, 5, 15, k.INK);
  dot(v, 18, 4, 16, k.PINK);
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, a = Math.PI * (1 - t);
    blob(v, 11 + Math.cos(a) * 9, 1.5, 9 + Math.sin(a) * 7.5, 1.2, 1.2, 1.2, i > 10 ? k.CAT_LIGHT : k.CAT);
  }
  blob(v, 15.5, 1.5, 15.5, 1.4, 1, 1.2, k.CAT_LIGHT);
  return prop(v, S);
}

/** En fönsterpalm: a glazed pot, a fibrous trunk, arching fronds with leaflets. */
function palm(k: Ids) {
  const v = new Volume(24, 48, 24);
  lathe(v, 12, 12, 0, 10, (y) => 4.6 + y * 0.18, (_x, y) => (y === 8 ? k.WHITE : k.KAKEL_BLUE));
  lathe(v, 12, 12, 9, 10, () => 5.6, k.WOOD_DEEP);
  lathe(v, 12, 12, 10, 26, () => 1.5, speckle(k.WOOD_DARK, k.WOOD_DEEP, 0.4, 61));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2, len = 9 + (i % 3);
    for (let s = 0; s <= 14; s++) {
      const t = s / 14, x = 12 + Math.cos(a) * t * len, z = 12 + Math.sin(a) * t * len, y = 26 + t * 12 - t * t * 16;
      dot(v, Math.floor(x), Math.floor(y), Math.floor(z), k.GREEN);
      if (s > 2) for (const side of [-1, 1]) dot(v, Math.floor(x - Math.sin(a) * side * 1.6), Math.floor(y - 1), Math.floor(z + Math.cos(a) * side * 1.6), s % 2 ? k.LEAF_DARK : k.GREEN);
    }
  }
  return prop(v, H);
}

/** Ryan: a shaggy rug in an allmoge diamond pattern, a border, fringes. */
function rya(k: Ids) {
  const v = new Volume(48, 1, 64), ring = [k.ALLMOGE_RED, k.CREAM, k.WOOD_DEEP, k.STRAW, k.CREAM];
  for (let z = 0; z < 64; z++) for (let x = 0; x < 48; x++) {
    if (z === 0 || z === 63) { if (x % 2) v.set(x, 0, z, k.CREAM); continue; }
    const edge = Math.min(x, 47 - x, z - 1, 62 - z);
    const d = Math.abs(x + 0.5 - 24) + Math.abs(z + 0.5 - 32);
    const c = edge < 3 ? k.FALU_FLAT : ring[Math.floor(d / 4) % ring.length];
    v.set(x, 0, z, hash(x, 0, z, 62) < 0.1 ? k.WOOD_DEEP : c);
  }
  return prop(v, H);
}

/** En virkad duk: round lace with rings of holes and a scalloped edge. */
function doily(k: Ids) {
  const v = new Volume(16, 1, 16);
  for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x + 0.5 - 8, z + 0.5 - 8), a = angleOf(x, z, 8, 8);
    if (d > 7.9 || (d > 7 && Math.floor(a * 4) % 2)) continue;
    if ((d > 2.6 && d < 3.6 && Math.floor(a * 3) % 2) || (d > 5.1 && d < 6 && Math.floor(a * 5) % 2)) continue;
    v.set(x, 0, z, d < 1.5 ? k.CREAM : k.WHITE);
  }
  return prop(v, Q);
}

/** Fotoalbumet: a leather album with gold corners and lines, pages showing at the edge. */
function album(k: Ids) {
  const v = new Volume(14, 3, 18);
  box(v, 0, 0, 0, 14, 3, 18, k.MAHOGANY);
  box(v, 1, 1, 0, 14, 2, 17, k.PAPER);
  box(v, 0, 0, 0, 13, 1, 18, k.MAHOGANY);
  box(v, 0, 2, 0, 13, 3, 18, k.MAHOGANY);
  for (const [x, z] of [[11, 0], [12, 0], [12, 1], [11, 17], [12, 17], [12, 16]]) dot(v, x, 2, z, k.GOLD);
  for (let z = 5; z < 13; z++) dot(v, 6, 2, z, k.GOLD);
  for (let x = 3; x < 10; x++) { dot(v, x, 2, 4, k.GOLD); dot(v, x, 2, 13, k.GOLD); }
  return prop(v, Q);
}

/** En bokhög: three books stacked, a little askew, gold on the spines. */
function bookStack(k: Ids) {
  const v = new Volume(16, 10, 20);
  const book = (x0: number, y0: number, z0: number, w: number, d: number, h: number, c: number) => {
    box(v, x0, y0, z0, x0 + w, y0 + h, z0 + d, c);
    box(v, x0 + 1, y0 + 1, z0 + 1, x0 + w, y0 + h - 1, z0 + d - 1, k.PAPER);
    box(v, x0, y0 + 1, z0 + 2, x0 + 1, y0 + h - 1, z0 + 3, k.GOLD);
    box(v, x0, y0 + 1, z0 + d - 3, x0 + 1, y0 + h - 1, z0 + d - 2, k.GOLD);
  };
  book(0, 0, 0, 15, 20, 4, k.MOSS_VELVET);
  book(1, 4, 2, 13, 16, 3, k.FALU_FLAT);
  book(2, 7, 3, 11, 13, 3, k.ALLMOGE);
  return prop(v, Q);
}

/** Kristallkronan: a brass stem, six curved arms with candle bulbs, crystal drops (hangs from its top). */
function chandelier(k: Ids) {
  const v = new Volume(28, 32, 28);
  lathe(v, 14, 14, 31, 32, () => 3, k.BRASS);
  box(v, 13, 18, 13, 15, 31, 15, k.BRASS);
  lathe(v, 14, 14, 8, 18, (y) => 2.5 - Math.abs(y - 13) * 0.25, (_x, y) => (y === 13 ? k.GOLD : k.BRASS));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, ex = 14 + Math.cos(a) * 11, ez = 14 + Math.sin(a) * 11;
    line(v, [14, 12, 14], [14 + Math.cos(a) * 7, 10, 14 + Math.sin(a) * 7], k.BRASS);
    line(v, [14 + Math.cos(a) * 7, 10, 14 + Math.sin(a) * 7], [ex, 14, ez], k.BRASS);
    lathe(v, ex, ez, 14, 15, () => 1.6, k.GOLD);
    lathe(v, ex, ez, 15, 18, () => 0.8, k.WHITE);
    for (const y of [9, 7]) dot(v, Math.floor(14 + Math.cos(a) * 8), y, Math.floor(14 + Math.sin(a) * 8), k.GLASS);
  }
  for (const y of [5, 6, 7]) dot(v, 14, y, 14, k.GLASS);
  return hang(v, 1 / 40);
}

/** The chandelier's candle flames, its own mesh. */
function chandelierGlow(k: Ids) {
  const v = new Volume(28, 32, 28);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    blob(v, 14 + Math.cos(a) * 11, 19, 14 + Math.sin(a) * 11, 0.9, 1.4, 0.9, k.LAMP);
  }
  return hang(v, 1 / 40);
}

/** Spetsgardiner for a living room window: white lace panels, a gathered valance, a brass rod. */
function laceCurtains(k: Ids) {
  const v = new Volume(52, 38, 6), lace: Paint = (x, y) => ((x + y) % 4 === 0 ? 0 : (x * 3 + y) % 7 === 0 ? k.CREAM : k.WHITE);
  for (let x = 0; x < 52; x++) {
    if (x >= 11 && x < 41) continue;
    const zf = 1 + Math.round(Math.sin(x * 0.8));
    for (let y = 2; y < 31; y++) { const c = lace(x, y, 0); if (c) dot(v, x, y, zf, c); }
  }
  box(v, 0, 30, 2, 52, 35, 3, (x, y) => ((x + y) % 3 === 0 ? k.CREAM : k.WHITE));
  for (let x = 0; x < 52; x++) if (x % 4 < 2) dot(v, x, 29, 2, k.WHITE);
  box(v, 0, 36, 0, 52, 37, 1, k.BRASS);
  for (const x of [0, 51]) box(v, x, 35, 0, x + 1, 38, 2, k.GOLD);
  return wall(v, H);
}

export const LIVING_MODELS = {
  kakelugn, cuckooClock, rockingChair, armchair, plasticSofa, coffeeTable, bookcase,
  dalahorse: (k: Ids) => dalahorse(k, k.ALLMOGE_RED), dalahorseBlue: (k: Ids) => dalahorse(k, k.ALLMOGE),
  tv, radio, sideTable, footstool, floorLamp, floorLampGlow, portrait, cat, palm, rya, doily, album, bookStack,
  chandelier, chandelierGlow, laceCurtains,
};
export { checks };

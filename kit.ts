/**
 * The modelling kit, three-free: what every model file (models*.ts) builds with. Boxes, turned
 * (lathed) shapes, cylinders and blobs, plus "pickers" that paint a voxel by where it is: wood
 * grain, checks, stripes, a touch of wear. The detail pass (PLAN.md) builds props at 1/32–1/64 m
 * with these, so a cup has a gold rim and roses and a chair has turned legs.
 *
 * Coordinates are voxel indices; a voxel's centre is at index + 0.5, so a shape centred on a
 * volume of width w uses cx = w / 2.
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

/** A block id, or a function of where the voxel is. */
export type Pick = number | Paint;
/** Paints a voxel by where it is. */
export type Paint = (x: number, y: number, z: number) => number;
export const pick = (id: Pick, x: number, y: number, z: number) => (typeof id === 'number' ? id : id(x, y, z));

/** A steady 0..1 noise per voxel (the same model always comes out the same). */
export function hash(x: number, y: number, z: number, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Fill [x0, x1) × [y0, y1) × [z0, z1) (0 carves). */
export function box(v: Volume, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, id: Pick) {
  for (let y = Math.max(0, y0); y < Math.min(v.sy, y1); y++)
    for (let z = Math.max(0, z0); z < Math.min(v.sz, z1); z++)
      for (let x = Math.max(0, x0); x < Math.min(v.sx, x1); x++) v.set(x, y, z, pick(id, x, y, z));
}

/** Set one voxel if it's inside the volume. */
export function dot(v: Volume, x: number, y: number, z: number, id: Pick) {
  if (x >= 0 && y >= 0 && z >= 0 && x < v.sx && y < v.sy && z < v.sz) v.set(x, y, z, pick(id, x, y, z));
}

const inDisc = (x: number, z: number, cx: number, cz: number, r: number) => (x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2 <= r * r;

/**
 * A turned shape round the vertical line through (cx, cz): at height y it's a disc of radius r(y),
 * hollowed out to rIn(y) if given (a cup's wall, a pot). `id` may paint by height or angle.
 */
export function lathe(v: Volume, cx: number, cz: number, y0: number, y1: number, r: (y: number) => number, id: Pick, rIn?: (y: number) => number) {
  for (let y = Math.max(0, y0); y < Math.min(v.sy, y1); y++) {
    const ro = r(y), ri = rIn ? rIn(y) : -1;
    if (ro <= 0) continue;
    for (let z = Math.floor(cz - ro - 1); z <= cz + ro + 1; z++)
      for (let x = Math.floor(cx - ro - 1); x <= cx + ro + 1; x++) {
        if (!inDisc(x, z, cx, cz, ro) || (ri > 0 && inDisc(x, z, cx, cz, ri))) continue;
        dot(v, x, y, z, id);
      }
  }
}

/** The angle of a voxel round (cx, cz), 0..2π (for painting a band of roses, a label). */
export const angleOf = (x: number, z: number, cx: number, cz: number) => (Math.atan2(z + 0.5 - cz, x + 0.5 - cx) + Math.PI * 2) % (Math.PI * 2);

/** A cylinder lying along x, round (cy, cz). */
export function cylX(v: Volume, cy: number, cz: number, r: number, x0: number, x1: number, id: Pick) {
  for (let x = x0; x < x1; x++) for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let z = Math.floor(cz - r - 1); z <= cz + r + 1; z++)
    if ((y + 0.5 - cy) ** 2 + (z + 0.5 - cz) ** 2 <= r * r) dot(v, x, y, z, id);
}

/** A cylinder lying along z, round (cx, cy). */
export function cylZ(v: Volume, cx: number, cy: number, r: number, z0: number, z1: number, id: Pick) {
  for (let z = z0; z < z1; z++) for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++)
    if ((y + 0.5 - cy) ** 2 + (x + 0.5 - cx) ** 2 <= r * r) dot(v, x, y, z, id);
}

/** A blob: an ellipsoid round (cx, cy, cz). */
export function blob(v: Volume, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, id: Pick) {
  for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let z = Math.floor(cz - rz - 1); z <= cz + rz + 1; z++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++)
    if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + ((z + 0.5 - cz) / rz) ** 2 <= 1) dot(v, x, y, z, id);
}

/** A box with its vertical edges rounded off by `r` voxels (a fridge, a cushion seen from above). */
export function roundBox(v: Volume, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r: number, id: Pick) {
  for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
    const dx = Math.max(0, x0 + r - (x + 0.5), x + 0.5 - (x1 - r)), dz = Math.max(0, z0 + r - (z + 0.5), z + 0.5 - (z1 - r));
    if (dx * dx + dz * dz > r * r) continue;
    for (let y = y0; y < y1; y++) dot(v, x, y, z, id);
  }
}

/** A line of voxels from a to b (a spout, a handle's arm, a hand on a clock). */
export function line(v: Volume, a: [number, number, number], b: [number, number, number], id: Pick, thick = 0) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2])) * 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t;
    if (thick <= 0) dot(v, Math.floor(x), Math.floor(y), Math.floor(z), id);
    else blob(v, x, y, z, thick, thick, thick, id);
  }
}

// ------------------------------------------------------------ pickers

/** Wood grain: boards running along `axis`, light and dark streaks, now and then a knot. */
export function grain(k: Ids, axis: 'x' | 'y' | 'z', base = k.WOOD, seed = 0): Paint {
  const light = base === k.WOOD ? k.WOOD_LIGHT : base === k.WOOD_DARK ? k.WOOD : base;
  const dark = base === k.WOOD ? k.WOOD_DARK : base === k.WOOD_DARK ? k.WOOD_DEEP : base;
  return (x, y, z) => {
    // The streak a voxel is on: across the grain, so a streak runs the board's length.
    const [a, b, along] = axis === 'x' ? [y, z, x] : axis === 'y' ? [x, z, y] : [x, y, z];
    const h = hash(a, b, 0, seed);
    if (hash(Math.floor(along / 5), a, b, seed + 7) < 0.015) return dark;   // a knot
    return h < 0.18 ? light : h > 0.86 ? dark : base;
  };
}

/** Checks of size s (gingham drawn in voxels, a chessboard). */
export const checks = (a: number, b: number, s = 1): Paint => (x, y, z) => ((Math.floor(x / s) + Math.floor(z / s) + Math.floor(y / s)) & 1 ? b : a);

/** Stripes across an axis, a list of ids each `w` voxels wide. */
export const stripes = (ids: number[], axis: 'x' | 'y' | 'z', w = 1): Paint => (x, y, z) => ids[Math.floor((axis === 'x' ? x : axis === 'y' ? y : z) / w) % ids.length];

/** Mostly `a`, a sprinkle of `b` (wear, flour dust, a speckled glaze). */
export const speckle = (a: number, b: number, share = 0.12, seed = 0): Paint => (x, y, z) => (hash(x, y, z, seed) < share ? b : a);

// ------------------------------------------------------------ model shapes

export const prop = (vol: Volume, voxel: number): Model => ({ vol, voxel, origin: [vol.sx / 2, 0, vol.sz / 2], ground: true });
export const wall = (vol: Volume, voxel: number): Model => ({ vol, voxel, origin: [vol.sx / 2, 0, 0], ground: false });
export const hang = (vol: Volume, voxel: number): Model => ({ vol, voxel, origin: [vol.sx / 2, vol.sy, vol.sz / 2], ground: false });

// ------------------------------------------------------------ text: 3×5 letters (voxelparty-kvalitet §5)

const FONT: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Ö: ['#.#', '.#.', '#.#', '#.#', '.#.'], Å: ['.#.', '...', '###', '#.#', '#.#'],
  Ä: ['#.#', '...', '###', '#.#', '#.#'], '!': ['.#.', '.#.', '.#.', '...', '.#.'], ' ': ['...', '...', '...', '...', '...'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['##.', '..#', '.#.', '#..', '###'], '3': ['##.', '..#', '.#.', '..#', '##.'],
  '9': ['.#.', '#.#', '.##', '..#', '.#.'], '6': ['.#.', '#..', '##.', '#.#', '.#.'], '8': ['.#.', '#.#', '.#.', '#.#', '.#.'],
};

/** Write `text` into a volume's face at z, from (x, y) as the top-left, in `id`. */
export function write(v: Volume, text: string, x: number, y: number, z: number, id: number) {
  for (const ch of text) {
    const g = FONT[ch] ?? FONT[' '];
    g.forEach((row, r) => [...row].forEach((c, cx) => c === '#' && dot(v, x + cx, y - r, z, id)));
    x += 4;
  }
}

export { Volume };

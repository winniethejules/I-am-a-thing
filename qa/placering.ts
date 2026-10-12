/**
 * `bun qa/placering.ts [out.json]`: does everything stand where it makes sense? For every placed
 * prop, from the real voxel models: what holds it up (the floor, a sill, which piece of furniture),
 * whether it floats, sinks into something or into a wall, blocks a doorway or stands in another
 * room than its list says. Prints the problems and a room-by-room list of what stands on what;
 * with a path, also writes the plan's data for tools/plan.py.
 */
import { CELLAR_BOXES, MOUND } from '../cellar';
import { FRONT_STEP, GARDEN_SOLIDS, GROUND } from '../garden';
import { DOORS, HOUSE, ROOMS, roomAt, type HouseBox } from '../house';
import { KITCHEN_PROPS, PANTRY_PROPS, type Placed } from '../kitchen';
import { buildModels, sizeOf, type ModelKey } from '../models';
import { BATH_PROPS, BEDROOM_PROPS, CELLAR_PROPS, ENTRY_PROPS, GARDEN_PROPS, HALL_PROPS, LIVING_PROPS, SEWING_PROPS } from '../props';
import type { Ids } from '../textures';

// Run by bun, outside the game's types.
declare const process: { argv: string[]; exit(code: number): never };
declare const Bun: { write(path: string, data: string): Promise<number> };

const MODELS = buildModels(new Proxy({}, { get: () => 1 }) as Ids);

/** Light shells and flat cloths: not furniture, nothing to bump or stand on. */
const GHOST = (k: string) => k.endsWith('Glow');
/** Soft things settle into what they lie on (a pillow on a bed). */
const SOFT = new Set<string>(['pillow']);
const FLAT = new Set<string>(['rya', 'ragRug', 'runner', 'doormat', 'bathMat', 'cloth', 'doily', 'crossword']);

interface Item extends Placed {
  i: number;
  list: string;
}
const LISTS: [string, Placed[]][] = [
  ['Köket', KITCHEN_PROPS.filter((p) => !PANTRY_PROPS.includes(p))], ['Skafferiet', PANTRY_PROPS], ['Vardagsrummet', LIVING_PROPS],
  ['Hallen', HALL_PROPS], ['Farstun', ENTRY_PROPS], ['Badrummet', BATH_PROPS], ['Sovrummet', BEDROOM_PROPS],
  ['Syrummet', SEWING_PROPS], ['Trädgården', GARDEN_PROPS], ['Jordkällaren', CELLAR_PROPS],
];
const ITEMS: Item[] = LISTS.flatMap(([list, ps]) => ps.map((p) => ({ ...p, list, i: 0 })));
ITEMS.forEach((it, i) => (it.i = i));

/** Is this world point inside the prop's voxels? */
function solidAt(p: Placed, x: number, y: number, z: number) {
  const m = MODELS[p.key], v = m.voxel, c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  const dx = x - p.x, dz = z - p.z;
  const lx = dx * c - dz * s, lz = dx * s + dz * c, ly = y - p.y;
  const i = Math.floor(lx / v + m.origin[0]), j = Math.floor(ly / v + m.origin[1]), k = Math.floor(lz / v + m.origin[2]);
  if (i < 0 || j < 0 || k < 0 || i >= m.vol.sx || j >= m.vol.sy || k >= m.vol.sz) return false;
  return m.vol.get(i, j, k) !== 0;
}

/** The prop's solid voxels as world points (every `step`th voxel), and its bottom layer. */
function points(p: Placed, step = 1) {
  const m = MODELS[p.key], v = m.voxel, c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  const all: [number, number, number][] = [], bottom: [number, number, number][] = [];
  let lowest = Infinity;
  for (let j = 0; j < m.vol.sy; j++) for (let k = 0; k < m.vol.sz; k++) for (let i = 0; i < m.vol.sx; i++) {
    if (!m.vol.get(i, j, k)) continue;
    lowest = Math.min(lowest, j);
  }
  for (let j = 0; j < m.vol.sy; j++) for (let k = 0; k < m.vol.sz; k++) for (let i = 0; i < m.vol.sx; i++) {
    if (!m.vol.get(i, j, k)) continue;
    const lx = (i + 0.5 - m.origin[0]) * v, ly = (j + 0.5 - m.origin[1]) * v, lz = (k + 0.5 - m.origin[2]) * v;
    const w: [number, number, number] = [p.x + lx * c + lz * s, p.y + ly, p.z - lx * s + lz * c];
    if (j === lowest) bottom.push(w);
    if ((i + j + k) % step === 0) all.push(w);
  }
  return { all, bottom, lowY: p.y + lowest * v - m.origin[1] * v };
}

/** The last box containing the point decides (the shell is built in order: carved openings come after walls). */
function inBoxes(boxes: readonly HouseBox[], x: number, y: number, z: number, drawn: boolean): boolean | null {
  for (let n = boxes.length - 1; n >= 0; n--) {
    const { b, m, solid } = boxes[n];
    if (x < b[0] || y < b[1] || z < b[2] || x >= b[3] || y >= b[4] || z >= b[5]) continue;
    if (m === 'AIR') return false;
    if (!drawn && solid === false) continue;
    return true;
  }
  return null;
}
/** The house, the cellar and the ground: drawn (sills and lists count) or only what you bump into. */
function shellAt(x: number, y: number, z: number, drawn: boolean): string | null {
  const h = inBoxes(HOUSE, x, y, z, drawn);
  if (h !== null) return h ? 'huset' : null;
  const c = inBoxes(CELLAR_BOXES, x, y, z, drawn);
  if (c !== null) return c ? 'källaren' : null;
  for (const b of [...GARDEN_SOLIDS, ...MOUND, FRONT_STEP]) if (x >= b[0] && y >= b[1] && z >= b[2] && x < b[3] && y < b[4] && z < b[5]) return 'trädgården';
  return y < GROUND ? 'marken' : null;
}

/** What it stands on: the ground or floor, a sill, or a piece of furniture. */
function support(it: Item, bottom: [number, number, number][], lowY: number) {
  const tally = new Map<string, number>();
  for (const [x, , z] of bottom) {
    const y = lowY - 0.03;
    let what: string | null = null;
    for (const o of ITEMS) {
      if (o === it || GHOST(o.key) || Math.hypot(o.x - x, o.z - z) > 3) continue;
      if (solidAt(o, x, y, z)) {
        what = `${o.key}#${o.i}`;
        break;
      }
    }
    what ??= shellAt(x, y, z, true);
    if (what === 'huset') what = lowY < 0.05 ? 'golvet' : 'huset (list/fönsterbräda)';
    if (what === 'marken' || what === 'källaren') what = lowY < GROUND + 0.05 || what === 'källaren' ? what : what;
    tally.set(what ?? '-', (tally.get(what ?? '-') ?? 0) + 1);
  }
  const held = bottom.length - (tally.get('-') ?? 0);
  const on = [...tally].filter(([k]) => k !== '-').sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return { share: held / Math.max(1, bottom.length), on };
}

/** How far it would fall: the gap under its middle to the first thing below. */
function gap(it: Item, lowY: number) {
  for (let d = 0.03; d < 3; d += 0.03) {
    const y = lowY - d;
    if (shellAt(it.x, y, it.z, true)) return d;
    for (const o of ITEMS) if (o !== it && !GHOST(o.key) && solidAt(o, it.x, y, it.z)) return d;
  }
  return 3;
}

/** `--col x z`: every surface in the column, bottom up (shelves: where something could stand). */
if (process.argv[2] === '--col') {
  const [x, z] = process.argv.slice(3).map(Number);
  let was = '';
  for (let y = -2.4; y < 2.45; y += 1 / 128) {
    const o = ITEMS.find((o) => !GHOST(o.key) && MODELS[o.key].ground && !(o.thing && !o.solid) && Math.hypot(o.x - x, o.z - z) < 3 && solidAt(o, x, y, z));
    const now = o ? `${o.key}#${o.i}` : shellAt(x, y, z, true) ?? '';
    if (was && !now) console.log(`  yta ${y.toFixed(3)} (${was})`);
    was = now;
  }
  process.exit(0);
}

/** `--top x z …`: the highest surface under each point (what something put there would stand on). */
if (process.argv[2] === '--top') {
  const args = process.argv.slice(3).map(Number);
  for (let n = 0; n + 1 < args.length; n += 2) {
    const [x, z] = [args[n], args[n + 1]];
    let found = '';
    for (let y = 2.45; y > -2.5; y -= 1 / 128) {
      // Furniture and cloths only: not the small things (one may stand there now) or what hangs.
      const o = ITEMS.find((o) => !GHOST(o.key) && MODELS[o.key].ground && !(o.thing && !o.solid) && Math.hypot(o.x - x, o.z - z) < 3 && solidAt(o, x, y, z));
      const sh = o ? null : shellAt(x, y, z, true);
      if (o || sh) {
        found = `${(y + 1 / 256).toFixed(3)} på ${o ? `${o.key}#${o.i}` : sh}`;
        break;
      }
    }
    console.log(`(${x}, ${z}): ${found}`);
  }
  process.exit(0);
}

const problems: string[] = [];
const where: Map<string, string[]> = new Map();
const plan: { key: string; i: number; list: string; x: number; z: number; y: number; h: number; on: string; cells: [number, number][]; flag: string; thing: boolean }[] = [];
const name = (it: Item) => `${it.key}#${it.i} (${it.x.toFixed(2)}, ${it.y.toFixed(2)}, ${it.z.toFixed(2)})`;

for (const it of ITEMS) {
  if (GHOST(it.key)) continue;
  const m = MODELS[it.key as ModelKey];
  const { all, bottom, lowY } = points(it, 3);
  const flags: string[] = [];
  // Held up?
  let on = 'hänger';
  if (m.ground) {
    const s = support(it, bottom, lowY);
    on = s.on.join(' + ') || 'inget';
    if (s.share < 0.3) {
      const g = gap(it, lowY);
      flags.push(`SVÄVAR ${(g * 100).toFixed(0)} cm (bara ${(s.share * 100).toFixed(0)} % av botten vilar på något): y ${(it.y - g + 0.015).toFixed(3)}?`);
    }
  }
  // Sunk into something?
  if (!FLAT.has(it.key)) {
    const into = new Map<string, number>();
    for (const [x, y, z] of all) {
      let what: string | null = null;
      for (const o of ITEMS) {
        if (o === it || GHOST(o.key) || FLAT.has(o.key) || Math.hypot(o.x - x, o.z - z) > 3) continue;
        if (solidAt(o, x, y, z)) {
          what = `${o.key}#${o.i}`;
          break;
        }
      }
      what ??= shellAt(x, y, z, false);
      if (what) into.set(what, (into.get(what) ?? 0) + 1);
    }
    for (const [what, n] of into) {
      const share = n / all.length;
      if (share > (SOFT.has(it.key) ? 0.12 : 0.06)) flags.push(`INNE I ${what}: ${(share * 100).toFixed(0)} %`);
    }
  }
  // In a doorway: any of it in the passage, below head height (a doormat or a rug is fine).
  const [, h] = sizeOf(m);
  if (!FLAT.has(it.key) && m.ground) {
    for (const door of DOORS) {
      let n = 0;
      for (const [x, y, z] of all) {
        const [a, b] = door.along === 'x' ? [x, z] : [z, x];
        if (y < 1.8 && a > door.a0 + 0.05 && a < door.a1 - 0.05 && Math.abs(b - (door.at + 0.125)) < 0.55) n++;
      }
      if (n / all.length > 0.06) flags.push(`I DÖRRÖPPNINGEN (${door.along} ${door.at}, ${door.a0}–${door.a1}): ${((n / all.length) * 100).toFixed(0)} %`);
    }
  }
  // In its own room?
  const room = it.list === 'Jordkällaren' ? 'Jordkällaren' : roomAt(it.x, it.z);
  if (room !== it.list && !(it.list === 'Skafferiet' && room === 'Köket') && m.ground) flags.push(`I FEL RUM: ${room}`);
  for (const f of flags) problems.push(`${it.list}: ${name(it)}: ${f}`);
  const list = where.get(it.list) ?? [];
  list.push(`${flags.length ? '⚠ ' : '  '}${it.key.padEnd(15)} (${it.x.toFixed(2)}, ${it.z.toFixed(2)}) y ${it.y.toFixed(2)} på ${on}${it.thing ? '' : '  [dekor]'}`);
  where.set(it.list, list);
  // The plan: its silhouette from above, on a 5 cm grid.
  const cells = new Set<string>();
  for (const [x, , z] of points(it, 1).all) cells.add(`${Math.floor(x * 20)},${Math.floor(z * 20)}`);
  plan.push({ key: it.key, i: it.i, list: it.list, x: it.x, z: it.z, y: it.y, h, on, cells: [...cells].map((c) => c.split(',').map(Number) as [number, number]), flag: flags.join("; "), thing: !!it.thing });
}

for (const [list, rows] of where) console.log(`\n== ${list}\n${rows.join('\n')}`);
console.log(`\n== ${problems.length} problem\n${problems.join('\n')}`);
const out = process.argv[2];
if (out) {
  const walls: [number, number, number, number][] = [];
  for (const { b, m, solid } of HOUSE) if (m !== 'AIR' && solid !== false && b[1] < 1 && b[4] > 1) walls.push([b[0], b[2], b[3], b[5]]);
  const doors = DOORS.map((d) => (d.along === 'x' ? [d.a0, d.at, d.a1, d.at + 0.25] : [d.at, d.a0, d.at + 0.25, d.a1]));
  await Bun.write(out, JSON.stringify({ rooms: ROOMS, walls, doors, plan }));
}

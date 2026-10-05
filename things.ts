/**
 * What a vätte can become, and how each form moves and how much it takes, three-free (rules, bots
 * and tests use it). The numbers are docs/maps/mormors-hus.md's prop table, as starting values.
 * A form is an index into FORMS; -1 is the vätte itself.
 */
import { FPS_ARENA, type FpsTuning } from '@voxelparty/sdk/core';
import { KITCHEN_PROPS, roomOf, type Placed } from './kitchen';
import { buildModels, sizeOf, type ModelKey } from './models';
import type { Ids } from './textures';

export interface FormDef {
  key: ModelKey;
  /** What it's called, for the HUD: one, some, all of them. */
  name: string;
  some: string;
  the: string;
  /** Darts it takes. */
  hp: number;
  /** Speed, as a share of a vätte's. */
  speed: number;
}

/** Things you can be (ground props: nothing that hangs on a wall). */
export const FORMS: readonly FormDef[] = [
  { key: 'cup', name: 'kaffekopp', some: 'kaffekoppar', the: 'kaffekopparna', hp: 1, speed: 1 },
  { key: 'biscuits', name: 'kakfat', some: 'kakfat', the: 'kakfaten', hp: 1, speed: 0.95 },
  { key: 'coffeePot', name: 'kaffepanna', some: 'kaffepannor', the: 'kaffepannorna', hp: 1, speed: 0.85 },
  { key: 'breadBasket', name: 'brödkorg', some: 'brödkorgar', the: 'brödkorgarna', hp: 1, speed: 0.9 },
  { key: 'geranium', name: 'pelargon', some: 'pelargoner', the: 'pelargonerna', hp: 1, speed: 0.8 },
  { key: 'logBasket', name: 'vedkorg', some: 'vedkorgar', the: 'vedkorgarna', hp: 2, speed: 0.55 },
  { key: 'chair', name: 'köksstol', some: 'köksstolar', the: 'köksstolarna', hp: 2, speed: 0.6 },
  { key: 'jarLingon', name: 'syltburk', some: 'syltburkar', the: 'syltburkarna', hp: 1, speed: 0.9 },
  { key: 'sack', name: 'mjölpåse', some: 'mjölpåsar', the: 'mjölpåsarna', hp: 1, speed: 0.7 },
  { key: 'tin', name: 'pepparkaksburk', some: 'pepparkaksburkar', the: 'pepparkaksburkarna', hp: 1, speed: 0.85 },
];
export const VATTE = -1;
export const formOf = (key: ModelKey) => FORMS.findIndex((f) => f.key === key);
export const formHp = (f: number) => FORMS[f]?.hp ?? 1;

/** Model sizes don't depend on block ids: measure them with any id. */
const MEASURE = buildModels(new Proxy({}, { get: () => 1 }) as Ids);

/** A body's box for a form: half its width, its height. */
export function formBox(f: number): { r: number; h: number } {
  if (f < 0) return VATTE_BOX;
  const [w, h, d] = sizeOf(MEASURE[FORMS[f].key]);
  return { r: Math.max(0.1, Math.max(w, d) / 2), h: Math.max(0.12, h) };
}
export const VATTE_BOX = { r: 0.22, h: 0.95 };
export const KUSIN_BOX = { r: 0.3, h: 1.45 };

/** How each body moves: the kusin a child's height and pace, a vätte quick and small, a thing as its form says. */
export const KUSIN_MOVE: FpsTuning = { ...FPS_ARENA, radius: 0.3, height: 1.45, eye: 1.3, run: 5.2, accel: 9, jump: 6.5, airCap: 0.4, autoHop: false };
const VATTE_MOVE: FpsTuning = { ...FPS_ARENA, radius: 0.22, height: 0.95, eye: 0.8, step: 0.3, run: 5.6, accel: 11, jump: 6.2, airCap: 0.5, autoHop: false };
const MOVES = FORMS.map((f, i): FpsTuning => {
  const { r, h } = formBox(i);
  return { ...VATTE_MOVE, radius: Math.min(r, 0.3), height: h, eye: h * 0.8, step: Math.min(0.3, h * 0.6), run: VATTE_MOVE.run * f.speed, jump: VATTE_MOVE.jump * (0.6 + 0.4 * f.speed) };
});
export const moveOf = (kusin: boolean, f: number): FpsTuning => (kusin ? KUSIN_MOVE : f < 0 ? VATTE_MOVE : MOVES[f]);

/** The real things in the kitchen a dart can hit: their placement, form and box (as map.ts fills the grid). */
export interface RealThing {
  p: Placed;
  /** Its form, or -1 for things you can't be (but can still hit: a pot holder, a crossword). */
  f: number;
  x: number;
  y: number;
  z: number;
  r: number;
  h: number;
}

export const REAL_THINGS: readonly RealThing[] = KITCHEN_PROPS.flatMap((p) => {
  if (!p.thing) return [];
  const m = MEASURE[p.key];
  const [w, h, d] = sizeOf(m);
  const c = Math.abs(Math.cos(p.yaw)), s = Math.abs(Math.sin(p.yaw));
  const r = Math.max(w * c + d * s, w * s + d * c) / 2;
  // Hanging things hang from their placement: their box is below it.
  const y = m.ground ? p.y : p.y - h;
  return [{ p, f: formOf(p.key), x: p.x, y, z: p.z, r, h }];
});

/** Which room a spot is in. */
export const roomAt = (x: number, z: number) => (z > 5 ? 'Hallen' : roomOf(x));

/**
 * Mormors inventarielista: what each room should hold of the things a vätte can be (PLAN.md: the
 * kusin's best tool). Counted from the same placements the rooms are built from, so it's always right.
 */
export const INVENTORY: { room: string; rows: { f: number; n: number }[] }[] = (() => {
  const rooms = new Map<string, Map<number, number>>();
  for (const th of REAL_THINGS) {
    if (th.f < 0) continue;
    const room = roomAt(th.x, th.z), m = rooms.get(room) ?? new Map<number, number>();
    m.set(th.f, (m.get(th.f) ?? 0) + 1);
    rooms.set(room, m);
  }
  return [...rooms].map(([room, m]) => ({ room, rows: [...m].map(([f, n]) => ({ f, n })).sort((a, b) => b.n - a.n) }));
})();

/**
 * How well a vätte as form `f` blends in where it stands (the Smälter in-mätare): 2 among its own
 * kind, 1 in a room that has its kind but not just here, 0 where no such thing belongs.
 */
export function blendIn(f: number, x: number, y: number, z: number): { level: 0 | 1 | 2; why: string } {
  if (f < 0) return { level: 0, why: 'Göm dig som en sak!' };
  const room = roomAt(x, z), { name, some, the } = FORMS[f];
  const same = REAL_THINGS.filter((th) => th.f === f && roomAt(th.x, th.z) === room);
  if (!same.length) return { level: 0, why: `Ingen ${name} hör hemma i ${room.toLowerCase()}!` };
  const near = same.some((th) => Math.hypot(th.x - x, th.z - z) < 1.4 && Math.abs(th.y - y) < 0.3);
  return near ? { level: 2, why: `Du smälter in bland ${the}` } : { level: 1, why: `${room} har ${some}, men inte just här` };
}

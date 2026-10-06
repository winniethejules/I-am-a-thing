/**
 * What a vätte can become, and how each form moves and how much it takes, three-free (rules, bots
 * and tests use it). The numbers are docs/maps/mormors-hus.md's prop table, as starting values.
 * A form is an index into FORMS; -1 is the vätte itself.
 */
import { FPS_ARENA, type FpsTuning } from '@voxelparty/sdk/core';
import { roomAt as roomOf } from './house';
import type { Placed } from './kitchen';
import { ALL_PROPS } from './props';
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
  /** An ett-word ("inget paraply", not "ingen"). */
  ett?: boolean;
}

/** Things you can be (ground props: nothing that hangs on a wall), room by room. */
export const FORMS: readonly FormDef[] = [
  // Köket och skafferiet.
  { key: 'cup', name: 'kaffekopp', some: 'kaffekoppar', the: 'kaffekopparna', hp: 1, speed: 1 },
  { key: 'biscuits', name: 'kakfat', some: 'kakfat', the: 'kakfaten', hp: 1, speed: 0.95, ett: true },
  { key: 'coffeePot', name: 'kaffepanna', some: 'kaffepannor', the: 'kaffepannorna', hp: 1, speed: 0.85 },
  { key: 'breadBasket', name: 'brödkorg', some: 'brödkorgar', the: 'brödkorgarna', hp: 1, speed: 0.9 },
  { key: 'geranium', name: 'pelargon', some: 'pelargoner', the: 'pelargonerna', hp: 1, speed: 0.8 },
  { key: 'logBasket', name: 'vedkorg', some: 'vedkorgar', the: 'vedkorgarna', hp: 2, speed: 0.55 },
  { key: 'chair', name: 'köksstol', some: 'köksstolar', the: 'köksstolarna', hp: 2, speed: 0.6 },
  { key: 'jarLingon', name: 'syltburk', some: 'syltburkar', the: 'syltburkarna', hp: 1, speed: 0.9 },
  { key: 'sack', name: 'mjölpåse', some: 'mjölpåsar', the: 'mjölpåsarna', hp: 1, speed: 0.7 },
  { key: 'tin', name: 'pepparkaksburk', some: 'pepparkaksburkar', the: 'pepparkaksburkarna', hp: 1, speed: 0.85 },
  { key: 'jarBlueberry', name: 'blåbärsburk', some: 'blåbärsburkar', the: 'blåbärsburkarna', hp: 1, speed: 0.9 },
  { key: 'coffeeGrinder', name: 'kaffekvarn', some: 'kaffekvarnar', the: 'kaffekvarnarna', hp: 1, speed: 0.9 },
  { key: 'milkCan', name: 'mjölkkanna', some: 'mjölkkannor', the: 'mjölkkannorna', hp: 2, speed: 0.7 },
  { key: 'juiceBottle', name: 'saftflaska', some: 'saftflaskor', the: 'saftflaskorna', hp: 1, speed: 0.95 },
  { key: 'potatoSack', name: 'potatissäck', some: 'potatissäckar', the: 'potatissäckarna', hp: 2, speed: 0.55 },
  // Vardagsrummet.
  { key: 'rockingChair', name: 'gungstol', some: 'gungstolar', the: 'gungstolarna', hp: 3, speed: 0.5 },
  { key: 'armchair', name: 'fåtölj', some: 'fåtöljer', the: 'fåtöljerna', hp: 3, speed: 0.45 },
  { key: 'footstool', name: 'fotpall', some: 'fotpallar', the: 'fotpallarna', hp: 2, speed: 0.75 },
  { key: 'tv', name: 'tjock-tv', some: 'tjock-tv-apparater', the: 'tjock-tv-apparaterna', hp: 3, speed: 0.4 },
  { key: 'radio', name: 'radio', some: 'radioapparater', the: 'radioapparaterna', hp: 2, speed: 0.75 },
  { key: 'floorLamp', name: 'golvlampa', some: 'golvlampor', the: 'golvlamporna', hp: 2, speed: 0.6 },
  { key: 'cat', name: 'katt', some: 'katter', the: 'katterna', hp: 1, speed: 1.1 },
  { key: 'palm', name: 'palm', some: 'palmer', the: 'palmerna', hp: 2, speed: 0.6 },
  { key: 'bookStack', name: 'bokhög', some: 'bokhögar', the: 'bokhögarna', hp: 1, speed: 0.8 },
  { key: 'doily', name: 'virkad duk', some: 'virkade dukar', the: 'de virkade dukarna', hp: 1, speed: 1 },
  { key: 'album', name: 'fotoalbum', some: 'fotoalbum', the: 'fotoalbumen', hp: 1, speed: 0.9, ett: true },
  { key: 'dalahorse', name: 'dalahäst', some: 'dalahästar', the: 'dalahästarna', hp: 1, speed: 1 },
  { key: 'dalahorseBlue', name: 'blå dalahäst', some: 'blå dalahästar', the: 'de blå dalahästarna', hp: 1, speed: 1 },
  // Hallen och farstun.
  { key: 'boots', name: 'par stövlar', some: 'par stövlar', the: 'stövlarna', hp: 1, speed: 0.9, ett: true },
  { key: 'umbrella', name: 'paraply', some: 'paraplyer', the: 'paraplyerna', hp: 1, speed: 1, ett: true },
  { key: 'stool', name: 'pall', some: 'pallar', the: 'pallarna', hp: 2, speed: 0.75 },
  { key: 'phone', name: 'telefon', some: 'telefoner', the: 'telefonerna', hp: 1, speed: 0.95 },
  { key: 'hat', name: 'hatt', some: 'hattar', the: 'hattarna', hp: 1, speed: 1 },
  { key: 'handbag', name: 'handväska', some: 'handväskor', the: 'handväskorna', hp: 1, speed: 0.95 },
  // Sovrummet.
  { key: 'pillow', name: 'kudde', some: 'kuddar', the: 'kuddarna', hp: 1, speed: 0.95 },
  { key: 'alarmClock', name: 'väckarklocka', some: 'väckarklockor', the: 'väckarklockorna', hp: 1, speed: 1 },
  { key: 'teeth', name: 'glas med löständer', some: 'glas med löständer', the: 'löständerna', hp: 1, speed: 1, ett: true },
  { key: 'dresser', name: 'byrå', some: 'byråar', the: 'byråarna', hp: 4, speed: 0.35 },
  { key: 'slippers', name: 'par tofflor', some: 'par tofflor', the: 'tofflorna', hp: 1, speed: 1.05, ett: true },
  { key: 'hatbox', name: 'hattask', some: 'hattaskar', the: 'hattaskarna', hp: 2, speed: 0.8 },
  { key: 'tableLamp', name: 'sänglampa', some: 'sänglampor', the: 'sänglamporna', hp: 1, speed: 0.9 },
  // Badrummet.
  { key: 'foldedTowel', name: 'handduk', some: 'handdukar', the: 'handdukarna', hp: 1, speed: 0.95 },
  { key: 'soapDish', name: 'tvålkopp', some: 'tvålkoppar', the: 'tvålkopparna', hp: 1, speed: 1 },
  { key: 'duck', name: 'badanka', some: 'badankor', the: 'badankorna', hp: 1, speed: 1.1 },
  { key: 'laundryBasket', name: 'tvättkorg', some: 'tvättkorgar', the: 'tvättkorgarna', hp: 2, speed: 0.75 },
  { key: 'rollDoll', name: 'toarullsdocka', some: 'toarullsdockor', the: 'toarullsdockorna', hp: 1, speed: 1 },
  { key: 'chamberPot', name: 'potta', some: 'pottor', the: 'pottorna', hp: 1, speed: 0.9 },
  // Syrummet.
  { key: 'sewingMachine', name: 'symaskin', some: 'symaskiner', the: 'symaskinerna', hp: 2, speed: 0.6 },
  { key: 'yarnRed', name: 'rött garnnystan', some: 'röda garnnystan', the: 'de röda garnnystanen', hp: 1, speed: 1.15, ett: true },
  { key: 'yarnBlue', name: 'blått garnnystan', some: 'blå garnnystan', the: 'de blå garnnystanen', hp: 1, speed: 1.15, ett: true },
  { key: 'yarnYellow', name: 'gult garnnystan', some: 'gula garnnystan', the: 'de gula garnnystanen', hp: 1, speed: 1.15, ett: true },
  { key: 'chest', name: 'kista', some: 'kistor', the: 'kistorna', hp: 3, speed: 0.4 },
  { key: 'dressForm', name: 'provdocka', some: 'provdockor', the: 'provdockorna', hp: 2, speed: 0.6 },
  { key: 'fabricBolt', name: 'tygbal', some: 'tygbalar', the: 'tygbalarna', hp: 2, speed: 0.7 },
  { key: 'sewingTin', name: 'knappburk', some: 'knappburkar', the: 'knappburkarna', hp: 1, speed: 0.85 },
  // Trädgården.
  { key: 'gnome', name: 'trädgårdstomte', some: 'trädgårdstomtar', the: 'trädgårdstomtarna', hp: 2, speed: 0.75 },
  { key: 'wateringCan', name: 'vattenkanna', some: 'vattenkannor', the: 'vattenkannorna', hp: 1, speed: 0.9 },
  { key: 'flowerPotYellow', name: 'gul blomkruka', some: 'gula blomkrukor', the: 'de gula blomkrukorna', hp: 1, speed: 0.85 },
  { key: 'flowerPotRed', name: 'röd blomkruka', some: 'röda blomkrukor', the: 'de röda blomkrukorna', hp: 1, speed: 0.85 },
  { key: 'wheelbarrow', name: 'skottkärra', some: 'skottkärror', the: 'skottkärrorna', hp: 3, speed: 0.45 },
  { key: 'log', name: 'vedklabbe', some: 'vedklabbar', the: 'vedklabbarna', hp: 1, speed: 0.9 },
  { key: 'kubb', name: 'kubbpinne', some: 'kubbpinnar', the: 'kubbpinnarna', hp: 1, speed: 1 },
  { key: 'kubbKing', name: 'kubbkung', some: 'kubbkungar', the: 'kubbkungarna', hp: 1, speed: 0.95 },
  { key: 'rainBarrel', name: 'regntunna', some: 'regntunnor', the: 'regntunnorna', hp: 3, speed: 0.4 },
  { key: 'gardenChair', name: 'trädgårdsstol', some: 'trädgårdsstolar', the: 'trädgårdsstolarna', hp: 2, speed: 0.6 },
  { key: 'iron', name: 'strykjärn', some: 'strykjärn', the: 'strykjärnen', hp: 1, speed: 0.9, ett: true },
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

export const REAL_THINGS: readonly RealThing[] = ALL_PROPS.flatMap((p) => {
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
export const roomAt = (x: number, z: number) => roomOf(x, z);

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
  const room = roomAt(x, z), { name, some, the, ett } = FORMS[f];
  const same = REAL_THINGS.filter((th) => th.f === f && roomAt(th.x, th.z) === room);
  if (!same.length) return { level: 0, why: `${ett ? 'Inget' : 'Ingen'} ${name} hör hemma i ${room.toLowerCase()}!` };
  const near = same.some((th) => Math.hypot(th.x - x, th.z - z) < 1.4 && Math.abs(th.y - y) < 0.3);
  return near ? { level: 2, why: `Du smälter in bland ${the}` } : { level: 1, why: `${room} har ${some}, men inte just här` };
}

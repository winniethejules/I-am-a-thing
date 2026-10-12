// `bunx vp shot qa/placering-scener.ts`: close-ups of where things stand (qa/placering.ts checks
// the same from the data): the coffee table, the stove, the pantry door, the farstu, the bathroom,
// the bed, the sewing table, the woodpile, the front step, the cellar, the hall, the kubb pitch.
// Copy .vp/shots out right away.
import type { Shots } from '@voxelparty/sdk/test';

const VIEWS: [string, [number, number, number], [number, number, number], number][] = [
  ['kaffebordet', [3.0, 1.35, 2.75], [3.0, 0.78, 1.45], 58],
  ['spisen', [2.3, 1.45, 2.7], [0.5, 0.85, 2.0], 60],
  ['skafferidorren', [4.6, 1.45, 4.35], [7.4, 0.5, 4.3], 62],
  ['farstun', [3.0, 1.5, 6.1], [3.0, 0.45, 9.2], 66],
  ['badrummet', [1.0, 1.55, 7.95], [-0.8, 0.45, 9.6], 70],
  ['sangen', [-4.7, 1.45, 8.1], [-2.6, 0.45, 10.0], 66],
  ['sybordet', [5.0, 1.55, 8.2], [7.0, 0.55, 10.9], 66],
  ['hallen', [-1.5, 1.5, 6.3], [-7.0, 0.4, 6.1], 62],
  ['vedtraven', [-11.2, 0.9, -0.4], [-8.5, -0.4, 2.8], 62],
  ['trappan', [3.0, 0.9, 13.2], [3.5, -0.2, 10.5], 60],
  ['kallaren', [-9.5, -1.0, -5.9], [-9.7, -2.0, -7.6], 74],
  ['kubb', [11.0, 1.4, -0.8], [11.0, -0.4, -6.0], 62],
];

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while (await t.leave());
  await t.wait(1500);
  for (const [name, pos, look, fov] of VIEWS) {
    await t.eval(`game.photoAt = ${JSON.stringify({ name, pos, look, fov, noKusin: true })}`);
    await t.wait(900);
    await t.shot(name);
  }
  await t.eval('game.photo(null)');
};

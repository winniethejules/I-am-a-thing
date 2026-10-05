// `bunx vp shot qa/photos-c.ts`: every photo point in the chosen look (C), for each session's
// before/after (voxelparty-kvalitet §2). Copy .vp/shots out right after: vp shot wipes it.
import type { Shots } from '@voxelparty/sdk/test';

const POINTS = ['K1', 'K2', 'K3', 'K4'];

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while (await t.leave());
  await t.wait(1500);
  for (const p of POINTS) {
    await t.eval(`game.photo(${JSON.stringify(p)})`);
    await t.wait(900);
    await t.shot(p);
  }
  await t.eval('game.photo(null)');
};

// `bunx vp shot qa/photos-c.ts`: every photo point (look.ts) in the chosen look (C), for each
// session's before/after (voxelparty-kvalitet §2). Copy .vp/shots out right after: vp shot wipes it.
import type { Shots } from '@voxelparty/sdk/test';
import { PHOTOS } from '../look';

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while (await t.leave());
  await t.wait(1500);
  for (const { name } of PHOTOS) {
    await t.eval(`game.photo(${JSON.stringify(name)})`);
    await t.wait(900);
    await t.shot(name);
  }
  await t.eval('game.photo(null)');
};

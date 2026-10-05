// `bunx vp shot qa/photos.ts`: every photo point (look.ts) in every look variant, for the look test
// (voxelparty-kvalitet §2). Copy .vp/shots out right after: vp shot wipes it on every run.
import type { Shots } from '@voxelparty/sdk/test';

const POINTS = ['K1', 'K2', 'K3', 'K4'];
const LOOKS = ['A', 'B', 'C'];

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while (await t.leave()); // just you: no CPUs wandering into the pictures
  await t.wait(1500);
  for (const look of LOOKS) {
    await t.eval(`game.look(${JSON.stringify(look)})`);
    for (const p of POINTS) {
      await t.eval(`game.photo(${JSON.stringify(p)})`);
      await t.wait(900); // let the sky ease, the light and the shadows settle
      await t.shot(`${look}-${p}`);
    }
  }
  await t.eval('game.photo(null)');
};

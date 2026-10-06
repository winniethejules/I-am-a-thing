import type { Shots } from '@voxelparty/sdk/test';
export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while (await t.leave());
  await t.wait(1500);
  await t.eval(`game.photo("G3")`); await t.wait(900); await t.shot('G3');
};

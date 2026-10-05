// Template: a staged scene, filmed and measured (voxelparty-kvalitet §6). Adapt the eval strings to
// the game: here `game.core` holds the host's state, `me()` your body, `horde` the enemies.
//
// The pattern for each scene:
//   1. clear the area (no stray enemies in shot);
//   2. put yourself where the camera should be;
//   3. spawn or trigger what you're filming, and reset any one-shot flag so it happens in shot;
//   4. wait for the moment with `t.until` (never a fixed sleep you hope is long enough);
//   5. film a strip, then measure and `t.warn` when the number is off.
import type { Shots } from '@voxelparty/sdk/test';

const QUIET = 'game.core.horde.clear()';
/** Put yourself at (x, z), looking along yaw (0 is +z, π/2 is +x), pitch up (+) or down (-). */
const place = (x: number, z: number, yaw: number, pitch = 0) =>
  `(() => { const b = game.core.me().body; Object.assign(b, { x: ${x}, y: 0, z: ${z}, vx: 0, vy: 0, vz: 0, yaw: ${yaw}, pitch: ${pitch} }); })()`;
/** An enemy `d` m in front of you, awake or asleep. */
const ahead = (d: number, awake: boolean) => `(() => {
  const c = game.core, b = c.me().body;
  const x = b.x + Math.sin(b.yaw) * ${d}, z = b.z + Math.cos(b.yaw) * ${d};
  return c.horde.spawn(c.arena.nav.nearest(x, 0, z), ${awake})?.id ?? -1;
})()`;
/** How far the nearest enemy is. */
const NEAREST = `(() => { const b = game.core.me().body; return Math.min(99, ...game.core.zview.map((z) => Math.hypot(z.x - b.x, z.z - b.z))); })()`;

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while (await t.leave());
  // (start the run here if the game waits for you: walk out, press start, …)

  // A melee shove, measured: does it really throw a charging enemy back?
  await t.eval(QUIET);
  await t.eval(place(9, 6.5, Math.PI / 2, -0.05));
  await t.eval(ahead(5, true));
  await t.until(`${NEAREST} < 1.4`, 6000);
  const before = await t.eval<number>(NEAREST);
  await t.mouse(2, 40); // right click
  await t.wait(400);
  const after = await t.eval<number>(NEAREST);
  if (after - before < 1.5) t.warn(`the shove only threw it ${(after - before).toFixed(1)} m`);

  // ...and filmed, once it's back on you.
  await t.until(`${NEAREST} < 1.4`, 6000);
  await t.mouse(2, 40);
  await t.strip('shove', 8, 1000);
};

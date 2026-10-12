// `bunx vp shot qa/installningar-scener.ts --players 3`: the settings menu (O), a forced shift with its
// message, the kusin down in the root cellar, and spectating after being caught. Copy .vp/shots out right away.
import type { Shots } from '@voxelparty/sdk/test';

const role = `game.core.role(game.core.me())`;
const phase = `game.core.match.phase`;
const place = (x: number, y: number, z: number, yaw: number, pitch: number) =>
  `Object.assign(game.core.me().body, { x: ${x}, y: ${y}, z: ${z}, vx: 0, vy: 0, vz: 0, yaw: ${yaw}, pitch: ${pitch} })`;

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while ((await t.eval<number>('game.core.link.players.length')) < 3) await t.join();
  await t.until(`${phase} === 'hide'`, 60_000);

  // The settings: O opens them, the leader picks once a minute.
  await t.eval(`game.settingsMenu.open()`);
  await t.wait(400);
  await t.eval(`game.setup.set('shift', 60)`);
  await t.wait(600);
  await t.shot('installningar');
  await t.eval(`game.settingsMenu.close()`);

  // A vätte in the living room: forced into something new, with the message.
  await t.eval(`game.core.stage(game.core.link.you, 'v', 0)`);
  await t.until(`game.core.alive(game.core.me()) && ${role} === 'v'`, 3000);
  await t.eval(place(-3.2, 0, 2.2, Math.PI * 0.75, -0.35));
  await t.wait(800);
  await t.eval(`game.core.me().formAt = game.core.now - 61_000`);
  await t.wait(700);
  console.log(`forced into: ${await t.eval<string>('game.FORMS[game.core.me().form]?.name')}`);
  await t.shot('tvingad');

  // The kusin in the root cellar: down the steps, in the vault.
  await t.eval(`game.core.stage(game.core.link.you, 'k', 0)`);
  await t.until(`game.core.alive(game.core.me()) && ${role} === 'k'`, 3000);
  await t.eval(`game.core.match.until = game.core.now`);
  await t.until(`${phase} === 'seek'`, 5000);
  await t.eval(place(-9.5, -2.25, -6.0, Math.PI, -0.15));
  await t.wait(900);
  await t.shot('kallaren');

  // Out: fall out of the world, then watch the others.
  await t.eval(place(-9.5, -40, -6.0, 0, 0));
  await t.until(`!game.core.alive(game.core.me())`, 5000);
  await t.wait(2200);
  await t.shot('titta-pa');
};

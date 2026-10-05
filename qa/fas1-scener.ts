// `bunx vp shot qa/fas1-scener.ts --players 2`: the feel slice's staged scenes (voxelparty-kvalitet
// §6), filmed as strips, with the moment measured where it can be. You and one CPU; the roles and
// places are set by script so each moment happens in shot. Copy .vp/shots out right away.
import type { Shots } from '@voxelparty/sdk/test';

/** Put a body (yours: 'me', or a CPU's pid) at (x, z) looking along yaw, pitch. */
const place = (who: string, x: number, z: number, yaw: number, pitch = 0) =>
  `(() => { const c = game.core, p = ${who === 'me' ? 'c.me()' : `c.pawns.get(${JSON.stringify(who)})`}; Object.assign(p.body, { x: ${x}, y: 0, z: ${z}, vx: 0, vy: 0, vz: 0, yaw: ${yaw}, pitch: ${pitch} }); return p.pid; })()`;
const ME = 'game.core.link.you';
const CPU = '[...game.core.pawns.keys()].find((id) => id !== game.core.link.you)';

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  // Just you and one CPU.
  while ((await t.eval<number>('game.core.link.players.length')) > 2) await t.leave(await t.eval<string>(CPU));
  await t.wait(500);
  const cpu = await t.eval<string>(CPU);

  // 1. The vätte: become a chair beside the real ones at the table, lock, taunt.
  await t.eval(`game.core.stage(${ME}, 'v', 1)`);
  await t.eval(`game.core.stage(${JSON.stringify(cpu)}, 'k', 6, true)`);
  await t.until(`game.core.alive(game.core.me()) && game.core.role(game.core.me()) === 'v'`, 3000);
  await t.eval(place(cpu, 2.3, 7.1, 0));   // the kusin out of the way, in the hall
  await t.eval(place('me', 2.45, 3.25, Math.PI, -0.28));
  await t.wait(500);
  const aimed = await t.eval<number>('game.core.aimedForm(game.core.me())');
  if (aimed < 0) t.warn(`the vätte isn't aiming at a thing it can become (${aimed})`);
  await t.press('KeyE');
  await t.strip('forvandling', 8, 900);
  const form = await t.eval<number>('game.core.me().form');
  if (form !== aimed) t.warn(`E didn't make it the thing it looked at (${form} ≠ ${aimed})`);
  await t.press('KeyR');
  await t.strip('las', 6, 500);
  await t.shot('vatte-hud');
  await t.press('KeyQ');
  await t.strip('taunt', 8, 1200);
  await t.press('KeyR');

  // 2. The kusin: a wrong guess (a real chair).
  await t.eval(`game.core.stage(${ME}, 'k', 0)`);
  await t.eval(`game.core.stage(${JSON.stringify(cpu)}, 'v', 6, true)`);
  await t.until(`game.core.alive(game.core.me()) && game.core.role(game.core.me()) === 'k'`, 3000);
  await t.eval(place(cpu, 2.3, 7.1, 0));
  await t.eval(place('me', 3.3, 4.2, 3.0, -0.41));
  await t.wait(700);
  const hp0 = await t.eval<number>(`game.core.match.stats.get(${ME}).hp`);
  await t.mouse(0, 40);
  await t.strip('fel-gissning', 8, 1000);
  const hp1 = await t.eval<number>(`game.core.match.stats.get(${ME}).hp`);
  if (!(hp1 < hp0)) t.warn(`a wrong guess didn't cost patience (${hp0} → ${hp1})`);

  // 3. The kusin: a dart into a vätte hiding as a cup on the floor. Tagen!
  await t.eval(`(() => { const p = game.core.pawns.get(${JSON.stringify(cpu)}); p.form = 0; p.locked = true; })()`);
  await t.eval(place(cpu, 3.0, 3.0, 0.4));
  await t.eval(place('me', 3.0, 4.4, Math.PI, -0.72));
  await t.wait(1600);   // past the gun's cool-down, the cup settled
  const caught0 = await t.eval<number>(`game.core.match.stats.get(${ME}).frags`);
  await t.mouse(0, 40);
  await t.strip('tagen', 9, 1400);
  const caught1 = await t.eval<number>(`game.core.match.stats.get(${ME}).frags`);
  if (caught1 !== caught0 + 1) t.warn(`the dart didn't catch the cup-vätte (${caught0} → ${caught1})`);

  // 4. A plain dart into the wall, from the side so the stuck dart shows.
  await t.eval(place('me', 1.4, 4.2, -Math.PI / 2 - 0.75, -0.05));
  await t.wait(800);
  await t.mouse(0, 40);
  await t.strip('skott', 8, 700);
};

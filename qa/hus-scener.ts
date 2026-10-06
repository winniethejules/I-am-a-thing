// `bunx vp shot qa/hus-scener.ts --players 3`: the whole house in play (PLAN.md phase 3): mormors
// lista for every room, the CPU kusin searching the house, a vätte's meter in a new room.
// With `--touch` it also shows the phone's buttons for each role. Copy .vp/shots out right away.
import type { Shots } from '@voxelparty/sdk/test';

const tab = (on: boolean) => on
  ? `(() => { const i = game.ctx.input; i.__down ??= i.down.bind(i); i.down = (a) => a === 'list' || i.__down(a); })()`
  : `(() => { const i = game.ctx.input; if (i.__down) i.down = i.__down; })()`;
const role = `game.core.role(game.core.me())`;
const phase = `game.core.match.phase`;

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while ((await t.eval<number>('game.core.link.players.length')) < 3) await t.join();
  await t.until(`${phase} === 'hide' && ${role} === 'k'`, 60_000);
  await t.wait(1500);
  await t.eval(tab(true));
  await t.wait(300);
  await t.shot('lista');
  await t.eval(tab(false));
  await t.eval(`game.core.match.until = game.core.now`);
  await t.until(`${phase} === 'seek'`, 5000);
  const hid = await t.eval<string>(`[...game.core.pawns.values()].filter((p) => game.core.role(p) === 'v').map((p) => p.form + '@' + p.body.x.toFixed(1) + ',' + p.body.z.toFixed(1)).join(' ')`);
  console.log(`hidden: ${hid}`);
  await t.wait(800);
  await t.shot('kusin-knappar');
  await t.autopilot(true);
  await t.strip('sok-hus', 9, 36_000);
  await t.autopilot(false);
  // A vätte in the bathroom as a rubber duck: the meter says it belongs.
  await t.eval(`game.core.stage(game.core.link.you, 'v', 0)`);
  await t.until(`game.core.alive(game.core.me()) && ${role} === 'v'`, 3000);
  await t.eval(`(() => { const p = game.core.me(); Object.assign(p.body, { x: -0.6, y: 0, z: 9.9, vx: 0, vy: 0, vz: 0, yaw: Math.PI, pitch: -0.3 }); p.form = game.FORMS.findIndex((f) => f.key === 'duck'); })()`);
  await t.wait(1200);
  await t.shot('vatte-anka');
};

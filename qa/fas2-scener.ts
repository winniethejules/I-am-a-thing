// `bunx vp shot qa/fas2-scener.ts --players 3`: phase 2's round, filmed (voxelparty-kvalitet §6):
// the kusin blind in the hall while the vättar hide, mormors lista on Tab, the seeking, the end
// board, then a vätte's Smälter in-mätare at its three levels. You and two CPUs, the match's own
// turn order (you're the first kusin); only the clock is hurried. Copy .vp/shots out right away.
import type { Shots } from '@voxelparty/sdk/test';

const place = (x: number, z: number, yaw: number, pitch = 0) =>
  `(() => { const p = game.core.me(); Object.assign(p.body, { x: ${x}, y: 0, z: ${z}, vx: 0, vy: 0, vz: 0, yaw: ${yaw}, pitch: ${pitch} }); })()`;
/** Hold Tab for the next pictures (a `hold` lets go before the shot). */
const tab = (on: boolean) => on
  ? `(() => { const i = game.ctx.input; i.__down ??= i.down.bind(i); i.down = (a) => a === 'list' || i.__down(a); })()`
  : `(() => { const i = game.ctx.input; if (i.__down) i.down = i.__down; })()`;
const role = `game.core.role(game.core.me())`;
const phase = `game.core.match.phase`;

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000);
  await t.autopilot(false);
  while ((await t.eval<number>('game.core.link.players.length')) > 3) await t.leave();
  while ((await t.eval<number>('game.core.link.players.length')) < 3) await t.join();
  await t.until(`${phase} === 'hide' && ${role} === 'k'`, 60_000);

  // 1. Blind in the hall: the count, then mormors lista held up over it.
  await t.wait(4000);
  await t.shot('blunda');
  await t.eval(tab(true));
  await t.wait(300);
  await t.shot('blunda-lista');
  await t.eval(tab(false));

  // 2. The seeking: the vättar have hidden; your CPU takes the gun for a while.
  await t.eval(`game.core.match.until = game.core.now`);
  await t.until(`${phase} === 'seek'`, 5000);
  const hid = await t.eval<string>(`[...game.core.pawns.values()].filter((p) => game.core.role(p) === 'v').map((p) => (p.form < 0 ? 'vätte' : p.form) + (p.locked ? '🔒' : '')).join(', ')`);
  console.log(`hidden at the bell: ${hid}`);
  if (hid.includes('vätte')) t.warn(`a vätte was still itself when the seeking began (${hid})`);
  await t.autopilot(true);
  await t.strip('sok', 8, 16_000);
  await t.autopilot(false);
  await t.eval(tab(true));
  await t.wait(300);
  await t.shot('sok-lista');
  await t.eval(tab(false));

  // 3. The round's end: the board.
  await t.eval(`game.core.match.until = game.core.now`);
  await t.until(`${phase} === 'end'`, 5000);
  await t.wait(600);
  await t.shot('slut');

  // 4. Next round you're a vätte: the meter among the chairs, in the kitchen away from them, in the hall.
  await t.until(`${phase} === 'hide' && ${role} === 'v'`, 20_000);
  await t.eval(place(2.45, 3.25, Math.PI, -0.28));
  await t.wait(500);
  await t.press('KeyE');
  await t.wait(1200);
  const form = await t.eval<number>('game.core.me().form');
  if (form < 0) t.warn(`E didn't make the vätte a thing (${form})`);
  const level = async (name: string, want: number) => {
    await t.wait(700);
    await t.shot(name);
    const got = await t.eval<number>(`document.querySelectorAll('.ia .meter i.on').length - 1`);
    const why = await t.eval<string>(`document.querySelector('.ia .meter')?.nextElementSibling?.textContent ?? ''`);
    console.log(`${name}: level ${got} (${why})`);
    if (got !== want) t.warn(`${name}: the meter says ${got}, expected ${want} (${why})`);
  };
  await level('matare-hemma', 2);
  await t.eval(place(5.3, 1.0, -2.3, -0.2));
  await level('matare-koket', 1);
  await t.eval(place(3.0, 6.6, Math.PI, -0.2));
  await level('matare-hallen', 0);
};

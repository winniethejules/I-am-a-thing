// Template: `bunx vp shot qa/photos.ts` shoots every photo point (voxelparty-kvalitet §2).
//
// The game needs two small hooks on its stage class (vp shot reaches it as `game`):
//
//   /** Hold the camera on a photo point (by name), or let go (null). */
//   photo(name: string | null) {
//     this.photoAt = name ? PHOTOS.find((p) => p.name === name) ?? null : null;
//     return this.photoAt?.name ?? null;
//   }
//   // ...and in the camera update, before anything else:
//   if (this.photoAt) { cam.position.set(...this.photoAt.pos); cam.lookAt(...this.photoAt.look); }
//
// with the points next to the map: { name: 'F1', pos: [x, y, z], look: [x, y, z] }.
//
// Afterwards, copy the pictures out (vp shot wipes .vp/shots on every run):
//   qa/<phase>/before/  taken BEFORE the first edit
//   qa/<phase>/after/   taken at the end of the session
// then put them side by side (templates/compose/).
import type { Shots } from '@voxelparty/sdk/test';

const POINTS = ['F1', 'F2', 'F3'];

export default async (t: Shots) => {
  await t.until('game.core.me() && game.core.alive(game.core.me())', 30_000); // adapt: "the game is up"
  await t.autopilot(false);
  while (await t.leave()); // just you: no CPUs wandering into the pictures
  await t.wait(1500);
  for (const p of POINTS) {
    await t.eval(`game.photo(${JSON.stringify(p)})`);
    await t.wait(700); // let the lights, mist and effects settle
    await t.shot(p);
  }
  await t.eval('game.photo(null)');
};

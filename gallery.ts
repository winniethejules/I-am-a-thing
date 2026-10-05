/**
 * Every model this game makes, for `bunx vp gallery`: numbered pages you can read at a glance, and
 * checks for broken models, look-alikes and more (`bunx vp docs gallery`). It isn't part of the
 * game's package. When you add a model to the game, add it here with the same code, and after
 * making or changing any art run `bunx vp gallery` and read every page.
 */
import { Mesh } from 'three';
import { Avatar, B, blockGeometry } from '@voxelparty/sdk';
import type { Gallery } from '@voxelparty/sdk/test';

export default (g: Gallery) => {
  const mat = g.engine.mats.actor;

  // Held and flying things: no ground under them.
  g.group('Gun and shots', { ground: false });
  g.add('Gun on a player', () => new Mesh(blockGeometry(B.METAL_DARK, [0.1, 0.12, 0.45]), mat), { tiny: 14 });
  g.add('Muzzle flash', () => new Mesh(blockGeometry(B.LANTERN, 0.1), mat), { tiny: 8 });
  g.add('Tracer', () => new Mesh(blockGeometry(B.GOLD, [0.05, 0.05, 1]), mat), { tiny: 20 });

  // One camera for the group (true relative size). They're Avatars at 0.9 in game.ts.
  g.group('Players', { scale: 'shared', ghost: false });
  for (let char = 0; char < 4; char++) {
    g.add(`Player ${char + 1}`, () => new Avatar(mat, { shirt: B.CLOTH_RED, overalls: B.WHITE, char }, { scale: 0.9 }).root);
  }
};

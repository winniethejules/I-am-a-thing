/**
 * The garden's solid parts, three-free: what you bump into outside (fences, tree trunks, the washing
 * line's posts, the mailbox), as boxes in metres. scene.ts draws them (and everything else outside);
 * map.ts puts these in the collision grid. The ground is half a metre below the floors.
 */
export const GROUND = -0.5;
/** The garden's edge: the fences north and south, west and east. */
export const FENCE = { x0: -13.5, x1: 17, z0: -10.25, z1: 19.25 };
/** The birches: [x, z, height]. */
export const BIRCHES: [number, number, number][] = [
  [-1.5, -6, 6], [8.5, -8, 7], [11, -5, 5.5], [-6, -7.5, 6.5],
  [-10, 15, 6], [13, 16, 7], [-12, 4, 6.5], [14, 8, 5.5], [-9.5, 10, 7],
];
export const LINE_POSTS: number[] = [0.75, 5.25];

export const GARDEN_SOLIDS: [number, number, number, number, number, number][] = [
  // The fences all round (the gates at the paths are shut).
  [FENCE.x0, GROUND, FENCE.z0, FENCE.x1, 0.5, FENCE.z0 + 0.25],
  [FENCE.x0, GROUND, FENCE.z1 - 0.25, FENCE.x1, 0.5, FENCE.z1],
  [FENCE.x0, GROUND, FENCE.z0, FENCE.x0 + 0.25, 0.5, FENCE.z1], [FENCE.x1 - 0.25, GROUND, FENCE.z0, FENCE.x1, 0.5, FENCE.z1],
  ...BIRCHES.map(([x, z]): [number, number, number, number, number, number] => [x, GROUND, z, x + 0.25, 3, z + 0.25]),
  ...LINE_POSTS.map((x): [number, number, number, number, number, number] => [x - 0.125, GROUND, -4.125, x + 0.125, 2, -3.875]),
];

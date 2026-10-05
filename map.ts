/**
 * The arena, three-free: a solid grid of half-unit cells for walking, shooting and line of sight,
 * the spawn spots, a jump pad, and the CPUs' paths generated from the grid. Everything is built
 * from `fill` calls, so change the layout here and the collision, the CPUs and the drawing
 * (game.ts meshes the same cells) all follow.
 *
 * A square island (floor at y 0), a raised block in the middle with stairs up its north side and a
 * jump pad onto it from the south, two cover walls, and crates in the corners. Fall off and you die.
 */
import { NavGrid, VoxelGrid, type JumpPad } from '@voxelparty/sdk/core';

/** The grid: cells of half a unit, from (-20, -2, -20) to (20, 8, 20). */
export const CELL = 0.5;
export const GX0 = -20, GY0 = -2, GZ0 = -20;
export const NX = 80, NY = 20, NZ = 80;
/** Below this you've fallen off the island. */
export const DEATH_Y = -10;

/** What a cell is made of. game.ts maps these to blocks; FLOOR is drawn by the Island instead. */
export const M = { AIR: 0, FLOOR: 1, WALL: 2, CRATE: 3, TRIM: 4, PAD: 5 } as const;

export interface Spawn {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

/** A stable 0..1 per integer column (a ragged edge that's the same on every client). */
function hash2(x: number, z: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}

/**
 * Is the column centred at world (x, z) land? A rounded square with a ragged rim. game.ts gives
 * the Island this same function, so what you see is what you stand on.
 */
export function land(x: number, z: number) {
  const r = 5, qx = Math.abs(x) - (15 - r), qz = Math.abs(z) - (15 - r);
  const d = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
  return d <= 0 || (d < 2 && d < 0.4 + hash2(Math.floor(x) + 7, Math.floor(z) + 3) * 1.6);
}

/** The pad south of the middle block: it throws you up onto it. */
export const PAD: JumpPad = { x: 0, y: 0.5, z: 12, half: 1, to: [0, 2, 1], arc: 2.2 };

export class Arena extends VoxelGrid {
  readonly spawns: Spawn[] = [];
  readonly nav: NavGrid;

  constructor() {
    super({ size: [NX, NY, NZ], cell: CELL, origin: [GX0, GY0, GZ0] });
    const { FLOOR, WALL, CRATE, TRIM, PAD: PAD_M } = M;
    // The island: every land column solid from -2 up to the floor at 0.
    for (let z = GZ0; z < GZ0 + NZ * CELL; z++)
      for (let x = GX0; x < GX0 + NX * CELL; x++) if (land(x + 0.5, z + 0.5)) this.fill(x, -2, z, x + 1, 0, z + 1, FLOOR);

    // The middle block, 2 high, with a rim, and stairs of 1 unit × 0.5 up its north side.
    this.fill(-3, 0, -3, 3, 1.5, 3, WALL);
    this.fill(-3, 1.5, -3, 3, 2, 3, TRIM);
    for (let d = 1; d <= 3; d++) this.fill(-1.5, 0, -3 - d, 1.5, 2 - d * 0.5, -2 - d, TRIM);
    // Cover walls east and west.
    for (const s of [-1, 1]) this.fill(s * 8, 0, -3, s * 9, 2, 3, WALL);
    // Crates in two corners: a stack to hide behind and hop onto.
    for (const s of [-1, 1]) {
      this.fill(s * 6, 0, s * 6, s * 7.5, 1, s * 7.5, CRATE);
      this.fill(s * 7.5, 0, s * 6, s * 9, 1, s * 7.5, CRATE);
      this.fill(s * 6, 1, s * 6, s * 7.5, 2, s * 7.5, CRATE);
      this.fill(s * 7, 0, -s * 9, s * 8, 1, -s * 7, CRATE);
    }
    // The jump pad, half a unit tall.
    this.fill(PAD.x - PAD.half, 0, PAD.z - PAD.half, PAD.x + PAD.half, PAD.y, PAD.z + PAD.half, PAD_M);

    // Spawns, facing the middle.
    for (const [x, y, z] of [[-13, 0, -13], [13, 0, -13], [-13, 0, 13], [13, 0, 13], [-14, 0, 0], [14, 0, 0], [0, 0, -14], [0, 2, 0]])
      this.spawns.push({ x, y, z, yaw: Math.atan2(-x, -z) });

    // The CPUs' paths: standing on the pad throws you, so it's the only way off it.
    this.nav = new NavGrid(this, { links: [{ ...PAD, forced: true }] });
  }
}

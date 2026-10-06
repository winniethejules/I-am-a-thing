/**
 * The collision grid, three-free: built from the same data the house is drawn from (house.ts) and
 * the furniture's footprints (kitchen.ts + models.ts), so what you see is what you bump into. The
 * CPUs' paths come from it. `gridText(arena)` prints it back as text, for tests and stuck bots.
 */
import { NavGrid, VoxelGrid } from '@voxelparty/sdk/core';
import { CELLAR_BOXES } from './cellar';
import { GARDEN_SOLIDS, GROUND } from './garden';
import { HOUSE } from './house';
import { ALL_PROPS, SPAWNS } from './props';
import { buildModels, sizeOf } from './models';
import type { Ids } from './textures';

/** Cells of a quarter metre, the house, its garden and the root cellar, from (-14.25, -2.5, -11) to (17.5, 3, 20): the CPUs' 0.5 m columns land on the doors' middles. */
export const CELL = 0.25;
export const GX0 = -14.25, GY0 = -2.5, GZ0 = -11;
export const NX = 127, NY = 22, NZ = 124;
/** Below this you've fallen out of the world (the house has no holes: a safety net). */
export const DEATH_Y = -10;

/** What a cell is. */
export const M = { AIR: 0, WALL: 1, FURNITURE: 2, GLASS: 3 } as const;

export interface Spawn {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** In the hall (where the kusiner wait while the vättar hide), not the kitchen. */
  hall: boolean;
}

/** Model sizes don't depend on block ids: build them with any id to measure footprints. */
const MEASURE = buildModels(new Proxy({}, { get: () => 1 }) as Ids);

export class Arena extends VoxelGrid {
  readonly spawns: Spawn[] = [];
  readonly nav: NavGrid;

  constructor() {
    super({ size: [NX, NY, NZ], cell: CELL, origin: [GX0, GY0, GZ0] });
    this.opaque[M.GLASS] = 0;
    // The ground everywhere, under the garden and the house; then the garden's fences and trunks.
    this.fill(GX0, GY0, GZ0, GX0 + NX * CELL, GROUND, GZ0 + NZ * CELL, M.WALL);
    for (const b of GARDEN_SOLIDS) this.fill(b[0], b[1], b[2], b[3], b[4], b[5], M.WALL);
    // The root cellar, dug into the ground: its vault and trench carved, its walls and steps solid.
    for (const { b, m, solid } of CELLAR_BOXES) {
      if (m === 'AIR') this.fill(b[0], b[1], b[2], b[3], b[4], b[5], M.AIR);
      else if (solid !== false) this.fill(b[0], b[1], b[2], b[3], b[4], b[5], M.WALL);
    }
    for (const { b, m, solid, glass } of HOUSE) {
      if (m === 'AIR') this.fill(b[0], b[1], b[2], b[3], b[4], b[5], glass ? M.GLASS : M.AIR);
      else if (solid !== false) this.fill(b[0], b[1], b[2], b[3], b[4], b[5], M.WALL);
    }
    // Furniture: its footprint (turned by its yaw, as a box round it), from the floor to its top.
    for (const p of ALL_PROPS) {
      if (!p.solid) continue;
      const [w, h, d] = sizeOf(MEASURE[p.key]);
      const c = Math.abs(Math.cos(p.yaw)), s = Math.abs(Math.sin(p.yaw));
      const hx = (w * c + d * s) / 2, hz = (w * s + d * c) / 2;
      this.fill(p.x - hx, p.y, p.z - hz, p.x + hx, Math.min(p.y + h, 2.5), p.z + hz, M.FURNITURE);
    }
    // Kusiner face into the house from the front door; vättar face the room they're in.
    for (const { x, y = 0, z, hall } of SPAWNS) this.spawns.push({ x, y, z, yaw: hall ? Math.PI : Math.atan2(3 - x, 1.5 - z), hall });
    this.nav = new NavGrid(this, { spacing: 0.5 });
  }
}

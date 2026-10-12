import { expect, test } from 'bun:test';
import { fpsStep, newFpsBody } from '@voxelparty/sdk/core';
import { Arena } from './map';
import { IDLE } from './bot';
import { KUSIN_MOVE } from './things';
import { DOORS } from './house';

/** Walk from (x, z) with yaw, forward, for secs; true if the body got past `goal`. */
function reach(a: Arena, x: number, z: number, yaw: number, goal: (x: number, z: number) => boolean) {
  const b = newFpsBody(x, 0, z, yaw);
  const it = { ...IDLE, fwd: 1, side: 0 } as any;
  for (let i = 0; i < 180; i++) { fpsStep(a, b, it, 1 / 60, KUSIN_MOVE); if (goal(b.x, b.z)) return true; }
  return false;
}

test('every door lets the kusin through', () => {
  const a = new Arena();
  for (const d of DOORS) {
    const ok: number[] = [];
    for (let off = -0.6; off <= 0.61; off += 0.05) {
      const mid = (d.a0 + d.a1) / 2 + off;
      if (d.along === 'x') {
        // a wall at z = at..at+0.25: cross along z, both ways
        const east = reach(a, mid, d.at - 0.9, 0, (_x, z) => z > d.at + 0.3);
        const west = reach(a, mid, d.at + 0.25 + 0.9, Math.PI, (_x, z) => z < d.at - 0.05);
        if (east && west) ok.push(+off.toFixed(2));
      } else {
        const east = reach(a, d.at - 0.9, mid, Math.PI / 2, (x) => x > d.at + 0.3);
        const west = reach(a, d.at + 0.25 + 0.9, mid, -Math.PI / 2, (x) => x < d.at - 0.05);
        if (east && west) ok.push(+off.toFixed(2));
      }
    }
    const width = ok.length ? (ok[ok.length - 1] - ok[0] + 0.05) : 0;
    // A body is 0.6 m across: a door must have room for it to walk through near its middle, both ways.
    expect(width, `${d.along} wall ${d.at}, ${d.a0}–${d.a1}`).toBeGreaterThanOrEqual(0.6);
  }
}, 120000);

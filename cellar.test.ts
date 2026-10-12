import { expect, test } from 'bun:test';
import { fpsStep, newFpsBody } from '@voxelparty/sdk/core';
import { Arena } from './map';
import { IDLE } from './bot';
import { KUSIN_MOVE } from './things';
import { CELLAR } from './cellar';

/** Walk north from (x, y, z) for secs; the z reached and the height. */
function walk(a: Arena, x: number, y: number, z: number, secs: number) {
  const b = newFpsBody(x, y, z, Math.PI);
  const it = { ...IDLE, fwd: 1, side: 0 } as any;
  for (let i = 0; i < secs * 60; i++) fpsStep(a, b, it, 1 / 60, KUSIN_MOVE);
  return { z: b.z, y: b.y };
}

test('a kusin can walk down the steps from the lawn into the root cellar', () => {
  const a = new Arena();
  for (const x of [-9.5, -9.8, -9.2]) {
    const end = walk(a, x, -0.5, -3.2, 6);
    expect(end.z, `from x ${x}`).toBeLessThan(CELLAR.z1 + 0.5);   // past the doorway, into the vault
    expect(end.y, `from x ${x}`).toBeLessThan(-2);                 // and down on the floor
  }
}, 120000);

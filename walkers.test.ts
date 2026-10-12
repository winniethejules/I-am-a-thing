import { expect, test } from 'bun:test';
import { Mormor, Misse } from './walkers';

test('mormor walks her route and waits at every stop', () => {
  const m = new Mormor([{ x: 0, z: 0 }, { x: 4, z: 0 }], 1, () => 0.5);
  let moved = 0, waited = 0;
  for (let i = 0; i < 60 * 12; i++) { const p = m.step(1 / 60); if (p.moving) moved++; else waited++; }
  expect(moved).toBeGreaterThan(0);
  expect(waited).toBeGreaterThan(0);
  expect(Math.hypot(m.step(0).x, m.step(0).z)).toBeLessThanOrEqual(4.01);
});

test('misse sleeps until a moving vätte comes near, then sits beside it and goes home', () => {
  const cat = new Misse({ x: -4, z: 1.5 }, 0.44, 2);
  cat.step(1, 0);
  expect(cat.mode).toBe('sleep');
  cat.hear(-8, 1.5, 100);       // far away: she stays asleep
  cat.step(1, 100);
  expect(cat.mode).toBe('sleep');
  cat.hear(-3, 1.5, 200);       // near: she wakes and goes
  for (let i = 0; i < 120; i++) cat.step(1 / 60, 200 + i * 16);
  expect(cat.mode).toBe('sit');
  expect(Math.hypot(cat.pose.x + 3, cat.pose.z - 1.5)).toBeLessThan(0.7);
  // Nobody moves for a while: she goes home and sleeps again.
  for (let i = 0; i < 60 * 30; i++) cat.step(1 / 60, 3000 + i * 16);
  expect(cat.mode).toBe('sleep');
  expect(Math.hypot(cat.pose.x + 4, cat.pose.z - 1.5)).toBeLessThan(0.1);
});

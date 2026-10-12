import { expect, test } from 'bun:test';

// qa/placering.ts checks every placed thing against the real models: nothing floats, sinks into
// furniture or walls, stands in a doorway or in the wrong room. Moving something? Run it.
test('everything in the house and garden stands somewhere that makes sense', () => {
  const run = Bun.spawnSync(['bun', 'qa/placering.ts'], { cwd: import.meta.dir });
  const out = run.stdout.toString();
  const problems = out.slice(out.lastIndexOf('== '));
  expect(problems).toStartWith('== 0 problem');
}, 60_000);

import { describe, expect, test } from 'bun:test';
import { gridText, mulberry32 } from '@voxelparty/sdk/core';
import { FakeFlow, FakeRoom, type FakeLink } from '@voxelparty/sdk/test';
import { Bot, IDLE, type Intent } from './bot';
import { Core } from './core';
import { Arena } from './map';

describe('the arena', () => {
  const a = new Arena();
  test('the kitchen floor plan, as text', () => {
    // At knee height: walls, furniture, the door to the hall. Read it when a bot gets stuck.
    const plan = gridText(a, { view: a.cy(0.4) });
    console.log(plan);
    expect(plan.length).toBeGreaterThan(0);
  });
  test('every spawn stands on the floor, clear of walls, and the CPUs can get from each to every other', () => {
    for (const s of a.spawns) {
      expect(a.groundBelow(s.x, s.y + 0.2, s.z)).toBe(s.y);
      expect(a.boxHits(s.x - 0.35, s.y, s.z - 0.35, s.x + 0.35, s.y + 1.7, s.z + 0.35)).toBe(false);
      const from = a.nav.nearest(s.x, s.y, s.z);
      for (const t of a.spawns) expect(a.nav.path(from, a.nav.nearest(t.x, t.y, t.z))).not.toBeNull();
    }
  });
});

describe('matches', () => {
  test('CPUs alone frag each other, and someone wins a round', () => {
    const room = new FakeRoom({ mg: { id: 'test' }, seed: 5, players: ['c0', 'c1', 'c2', 'c3'].map((id) => ({ id, cpu: true })), clients: [null] });
    const core = new Core(room.links[0], new FakeFlow(room.links[0]), () => IDLE);
    let frags = 0, hits = 0, wins = 0;
    room.run((dt) => {
      core.update(dt);
      for (const c of core.cues.splice(0)) {
        if (c.k === 'frag') frags++;
        if (c.k === 'dmg') hits++;
        if (c.k === 'win') wins++;
      }
    }, { until: room.now + 240_000, done: () => wins > 0 });
    console.log(`4 CPUs: ${hits} hits, ${frags} frags, ${wins} win(s) in ${Math.round((room.now - 1_000_000) / 1000)} s`);
    expect(hits).toBeGreaterThan(40);
    expect(frags).toBeGreaterThan(9);
    expect(wins).toBe(1);
    core.dispose();
  });
});

describe('netcode, in a session', () => {
  test('joins, leaves, the host leaving and reloads: everyone agrees, and nobody is stuck dead or invisible', () => {
    const room = new FakeRoom({ mg: { id: 'test' }, seed: 7, players: [{ id: 'p0' }, { id: 'p1' }], clients: ['p0', 'p1'], latency: 80 });
    let peace = false;
    const cores: Core[] = [];
    // Drive each human with a CPU brain, so the test plays like a real match.
    const add = (link: FakeLink) => {
      let bot: Bot | undefined;
      const core: Core = new Core(link, new FakeFlow(link), (): Intent => {
        const me = core.me();
        if (!me) return IDLE;
        bot ??= new Bot(mulberry32(cores.length + 11), 1, core);
        const it = bot.update(1 / 60, me, core);
        return peace ? IDLE : it;
      });
      cores.push(core);
      return core;
    };
    const reload = (pid: string) => {
      cores.find((c) => c.link.you === pid && !(c.link as FakeLink).gone)?.dispose();
      add(room.reload(pid));
    };
    const live = () => cores.filter((c) => !(c.link as FakeLink).gone);
    const play = (ms: number) => room.run((dt) => live().forEach((c) => c.update(dt)), { until: room.now + ms });
    room.links.forEach(add);

    play(5000);
    room.join({ id: 'c2', cpu: true });
    add(room.join({ id: 'p3' })!);
    play(8000);
    reload('p1');                // a client reloads
    play(6000);
    room.leave('p0');            // the host leaves: p1 takes over, CPU included
    play(6000);
    reload('p1');                // the new host reloads (and is host again: it joined first)
    play(8000);
    expect(room.links.find((l) => !l.gone && l.isHost)?.you).toBe('p1');

    // Stop shooting and let it settle: everyone in play, on the same scores, where they are.
    peace = true;
    play(5000);
    const ids = ['p1', 'c2', 'p3'];
    const host = live().find((c) => c.link.isHost)!;
    const frags = (c: Core) => ids.map((id) => c.match.stats.get(id)!.frags);
    expect(frags(host).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    for (const c of live()) {
      expect([...c.pawns.keys()].sort()).toEqual([...ids].sort());
      expect(frags(c)).toEqual(frags(host));
      for (const id of ids) {
        const owner = live().find((o) => o.pawns.get(id)?.own)!;
        const theirs = owner.pawns.get(id)!, mine = c.pawns.get(id)!;
        expect(c.alive(mine)).toBe(true);                     // nobody stuck dead
        expect(theirs.alive).toBe(true);
        expect(mine.life).toBe(theirs.life);
        // …or invisible: drawn about where its owner has it (the CPU still runs about: a moment behind).
        expect(Math.hypot(mine.body.x - theirs.body.x, mine.body.z - theirs.body.z)).toBeLessThan(3);
      }
    }
    expect(room.stats.dropped).toBe(0);
    for (const c of cores) c.dispose();
  });
});

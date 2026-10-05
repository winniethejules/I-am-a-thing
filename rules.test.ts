import { describe, expect, test } from 'bun:test';
import { gridText, mulberry32 } from '@voxelparty/sdk/core';
import { FakeFlow, FakeRoom, type FakeLink } from '@voxelparty/sdk/test';
import { Bot, IDLE, type Intent } from './bot';
import { Core } from './core';
import { Match, WRONG, kusinerFor } from './rules';
import { REAL_THINGS, formHp, formOf } from './things';
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

describe('roles and darts', () => {
  test('one kusin for every three vättar, the earliest staying kusiner as people come and go', () => {
    expect([1, 2, 3, 4, 5, 8, 10].map(kusinerFor)).toEqual([1, 1, 1, 1, 1, 2, 3]);
    const m = new Match();
    const room = (ids: string[]) => {
      m.sync(ids);
      m.balance(ids);
      return ids.filter((id) => m.stats.get(id)!.role === 'k');
    };
    expect(room(['a'])).toEqual(['a']);
    expect(room(['a', 'b', 'c', 'd'])).toEqual(['a']);
    expect(room(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])).toEqual(['a', 'b']);
    expect(room(['b', 'c', 'd', 'e', 'f', 'g', 'h'])).toEqual(['b', 'c']);   // a left: c steps up
    expect(room(['c', 'd', 'e'])).toEqual(['c']);
  });

  test("a chair takes two darts, a cup one; a wrong guess costs patience; a caught vätte can't be caught again", () => {
    const m = new Match();
    m.sync(['k', 'v']);
    m.balance(['k', 'v']);
    m.respawn('k', 0);
    m.respawn('v', 1);
    const chair = formHp(formOf('chair')), cup = formHp(formOf('cup'));
    expect([chair, cup]).toEqual([2, 1]);
    expect(m.hit('k', 'v', 1, chair, 0).map((e) => e.k)).toEqual(['dmg']);
    expect(m.hit('k', 'v', 1, chair, 0).map((e) => e.k)).toEqual(['dmg', 'frag']);
    expect(m.hit('k', 'v', 1, chair, 0)).toEqual([]);
    expect(m.stats.get('k')!.frags).toBe(1);
    const before = m.stats.get('k')!.hp;
    expect(m.wrong('k', 0, 0)).toEqual([{ k: 'wrong', a: 'k', t: 0, hp: before - WRONG }]);
    expect(m.hit('v', 'k', 1, 1, 0)).toEqual([]);   // a vätte has no darts
  });

  test("a dart finds a vätte in its form's box, and a real thing behind the grid's coarser cells", () => {
    const room = new FakeRoom({ mg: { id: 'test' }, seed: 3, players: [{ id: 'k' }, { id: 'v', cpu: true }], clients: ['k'] });
    const core = new Core(room.links[0], new FakeFlow(room.links[0]), () => IDLE);
    room.run((dt) => core.update(dt), { until: room.now + 500 });
    const v = core.pawns.get('v')!;
    Object.assign(v.body, { x: 3, y: 0, z: 3.4 });
    v.form = formOf('chair');
    // From the door, level with a chair's seat, at the chair by the table: the vätte-chair stands in front of it.
    Object.assign(v.body, { x: 2.45, y: 0, z: 3.4 });
    let hit = core.cast(2.45, 0.5, 4.8, 0, 0, -1, 10, null);
    expect(hit.pawn?.pid).toBe('v');
    v.form = formOf('cup');
    hit = core.cast(2.45, 0.5, 4.8, 0, 0, -1, 10, null);   // a cup is lower: the dart flies over it…
    expect(hit.pawn).toBeNull();
    // …to the real chair at the table: a wrong guess, not the grid.
    expect(hit.thing).toBeGreaterThanOrEqual(0);
    expect(REAL_THINGS[hit.thing].p.key).toBe('chair');
    core.dispose();
  });
});

describe('matches', () => {
  test('CPUs alone: the vättar hide, the kusin finds some and guesses wrong now and then', () => {
    const room = new FakeRoom({ mg: { id: 'test' }, seed: 5, players: ['c0', 'c1', 'c2', 'c3'].map((id) => ({ id, cpu: true })), clients: [null] });
    const core = new Core(room.links[0], new FakeFlow(room.links[0]), () => IDLE);
    let caught = 0, darts = 0, wrong = 0, poffs = 0, locks = 0;
    room.run((dt) => {
      core.update(dt);
      for (const c of core.cues.splice(0)) {
        if (c.k === 'frag' && c.a !== c.v) caught++;
        if (c.k === 'dmg') darts++;
        if (c.k === 'wrong') wrong++;
        if (c.k === 'poff') poffs++;
        if (c.k === 'lock' && c.on) locks++;
      }
    }, { until: room.now + 180_000, done: () => caught >= 3 && wrong >= 2 });
    const kusiner = ['c0', 'c1', 'c2', 'c3'].filter((id) => core.match.stats.get(id)!.role === 'k');
    console.log(`4 CPUs, ${kusiner.length} kusin: ${poffs} transformations, ${locks} locked, ${darts} darts in vättar, ${caught} caught, ${wrong} wrong guesses in ${Math.round((room.now - 1_000_000) / 1000)} s`);
    expect(kusiner.length).toBe(1);
    expect(poffs).toBeGreaterThanOrEqual(3);
    expect(locks).toBeGreaterThanOrEqual(3);
    expect(caught).toBeGreaterThanOrEqual(3);
    expect(wrong).toBeGreaterThanOrEqual(2);
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
    const score = (c: Core) => ids.map((id) => `${c.match.stats.get(id)!.role}:${c.match.stats.get(id)!.frags}`);
    for (const c of live()) {
      expect([...c.pawns.keys()].sort()).toEqual([...ids].sort());
      expect(score(c)).toEqual(score(host));                // the same roles and catches everywhere
      for (const id of ids) {
        const owner = live().find((o) => o.pawns.get(id)?.own)!;
        const theirs = owner.pawns.get(id)!, mine = c.pawns.get(id)!;
        expect(c.alive(mine)).toBe(true);                     // nobody stuck dead
        expect(theirs.alive).toBe(true);
        expect(mine.life).toBe(theirs.life);
        expect(mine.form).toBe(theirs.form);                  // the same thing, everywhere
        // …or invisible: drawn about where its owner has it (the CPU still runs about: a moment behind).
        expect(Math.hypot(mine.body.x - theirs.body.x, mine.body.z - theirs.body.z)).toBeLessThan(3);
      }
    }
    expect(room.stats.dropped).toBe(0);
    for (const c of cores) c.dispose();
  });
});

import { KEYS, defineGame } from '@voxelparty/sdk';
import { Shooter } from './game';
import { WIN } from './rules';
import { MUSIC } from './sounds';

// A standalone first-person arena shooter: played in sessions, untimed, friends drop in and out.
// Rounds of its own (first to WIN frags) for as long as anyone's in the room.
export default defineGame({
  id: 'i-am-a-thing',
  name: 'I Am a Thing',
  // Phase 0 (PLAN.md): the kitchen's look test. Everyone is a kusin for now; the vättar come in phase 1.
  blurb: `Mormors kök, ett första smakprov. Skjut sugkoppspilar på varandra: först till ${WIN} träffar vinner rundan.`,
  controls: [
    ['WASD', 'Gå'],
    [KEYS.mouse, 'Titta'],
    [KEYS.click, 'Skjut'],
    ['SPACE', 'Hoppa'],
  ],
  music: MUSIC,
  // Lock the mouse on "Click to play" and on clicks while playing (mouse look).
  pointerLock: true,
  create: (ctx) => new Shooter(ctx),
});

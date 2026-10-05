import { KEYS, defineGame } from '@voxelparty/sdk';
import { Shooter } from './game';
import { WIN } from './rules';
import { MUSIC } from './sounds';

// A standalone first-person arena shooter: played in sessions, untimed, friends drop in and out.
// Rounds of its own (first to WIN frags) for as long as anyone's in the room.
export default defineGame({
  id: 'i-am-a-thing',
  name: 'I Am a Thing',
  blurb: `Blast your friends on a floating island! Don't fall off. First to ${WIN} frags wins the round.`,
  controls: [
    ['WASD', 'Move'],
    [KEYS.mouse, 'Look'],
    [KEYS.click, 'Fire'],
    ['SPACE', 'Jump (hold to hop)'],
  ],
  music: MUSIC,
  // Lock the mouse on "Click to play" and on clicks while playing (mouse look).
  pointerLock: true,
  create: (ctx) => new Shooter(ctx),
});

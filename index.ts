import { KEYS, defineGame } from '@voxelparty/sdk';
import { Shooter } from './game';
import { HIDE_MS, SEEK_MS } from './rules';
import { MUSIC } from './sounds';

// A standalone hide-and-seek game in mormors hus: played in sessions, untimed, friends drop in and
// out. One kusin to three vättar; rounds of its own (first kusin to WIN catches) for as long as
// anyone's in the room. The hide phase and real rounds come in phase 2 (PLAN.md).
export default defineGame({
  id: 'i-am-a-thing',
  name: 'I Am a Thing',
  // Phase 1 (PLAN.md): the feel. Kusiner hunt vättar with suction darts; vättar hide as things.
  blurb: `Vättarna har ${HIDE_MS / 1000} sekunder på sig att gömma sig som saker i mormors kök. Sedan letar kusinerna med sugkoppspistoler i ${SEEK_MS / 60_000} minuter, men fel gissning kostar tålamod. Rollerna byts varje runda.`,
  controls: [
    ['WASD', 'Gå'],
    [KEYS.mouse, 'Titta'],
    [KEYS.click, 'Skjut (kusin)'],
    ['E', 'Bli saken du tittar på (vätte)'],
    ['R', 'Lås / lås upp (vätte)'],
    ['Q', 'Taunt (vätte)'],
    ['TAB', 'Inventarielistan (kusin)'],
    ['SPACE', 'Hoppa'],
  ],
  buttons: {
    become: { keys: ['KeyE'], label: 'BLI SAK' },
    lock: { keys: ['KeyR'], label: 'LÅS' },
    taunt: { keys: ['KeyQ'], label: 'TAUNT' },
    list: { keys: ['Tab'], label: 'LISTA' },
    action: { label: 'HOPPA' },
  },
  music: MUSIC,
  // Lock the mouse on "Click to play" and on clicks while playing (mouse look).
  pointerLock: true,
  create: (ctx) => new Shooter(ctx),
});

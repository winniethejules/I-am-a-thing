import { KEYS, defineGame } from '@voxelparty/sdk';
import { Shooter } from './game';
import { WIN } from './rules';
import { MUSIC } from './sounds';

// A standalone hide-and-seek game in mormors hus: played in sessions, untimed, friends drop in and
// out. One kusin to three vättar; rounds of its own (first kusin to WIN catches) for as long as
// anyone's in the room. The hide phase and real rounds come in phase 2 (PLAN.md).
export default defineGame({
  id: 'i-am-a-thing',
  name: 'I Am a Thing',
  // Phase 1 (PLAN.md): the feel. Kusiner hunt vättar with suction darts; vättar hide as things.
  blurb: `Vättarna gömmer sig som saker i mormors kök. Kusinerna letar med sugkoppspistoler, men fel gissning kostar tålamod. Första kusin till ${WIN} tagna vinner rundan.`,
  controls: [
    ['WASD', 'Gå'],
    [KEYS.mouse, 'Titta'],
    [KEYS.click, 'Skjut (kusin)'],
    ['E', 'Bli saken du tittar på (vätte)'],
    ['R', 'Lås / lås upp (vätte)'],
    ['Q', 'Taunt (vätte)'],
    ['SPACE', 'Hoppa'],
  ],
  buttons: {
    become: { keys: ['KeyE'], label: 'BLI SAK' },
    lock: { keys: ['KeyR'], label: 'LÅS' },
    taunt: { keys: ['KeyQ'], label: 'TAUNT' },
    action: { label: 'HOPPA' },
  },
  music: MUSIC,
  // Lock the mouse on "Click to play" and on clicks while playing (mouse look).
  pointerLock: true,
  create: (ctx) => new Shooter(ctx),
});

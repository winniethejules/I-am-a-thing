/**
 * Sounds and the theme. A sound is plain data (a Patch): layers of oscillators or noise, each with
 * an envelope, pitch sweeps or arpeggio steps, a filter, drive, echo and reverb. A Song is a few
 * tracks of step patterns. Plain data from the SDK core, so `sounds.test.ts` checks the music
 * under bun. game.ts plays them: yours close and centred, everyone else's in 3D (`Sfx.at3d`).
 *
 * Levels (PLAN.md §5): the dart and "Tagen!" loudest, taunts in the middle, the kitchen's own
 * sounds lowest.
 */
import { INSTRUMENTS, type Patch, type Song } from '@voxelparty/sdk/core';

export const SOUNDS = {
  /** The suction gun: a springy pff of air and a plastic clack. */
  shot: {
    vol: 0.34,
    vary: 30,
    maxVoices: 6,
    layers: [
      { wave: 'noise', env: { a: 0.002, d: 0.09, s: 0 }, vol: 0.6, filter: { type: 'bandpass', freq: 1400, to: 500, time: 0.08, q: 1.2 } },
      { wave: 'square', freq: 520, to: 240, sweep: 0.04, env: { a: 0.001, d: 0.04, s: 0 }, vol: 0.25, filter: { type: 'lowpass', freq: 2400 } },
      { wave: 'triangle', freq: 180, to: 420, sweep: 0.12, env: { a: 0.001, d: 0.14, s: 0 }, vol: 0.35 },
    ],
  },
  /** A dart sticks in a wall or the floor: plopp. */
  plopp: {
    vol: 0.34,
    vary: 60,
    cooldown: 0.03,
    maxVoices: 4,
    layers: [
      { wave: 'sine', freq: 420, to: 140, sweep: 0.07, env: { a: 0.001, d: 0.1, s: 0 } },
      { wave: 'noise', env: { a: 0.001, d: 0.03, s: 0 }, vol: 0.3, filter: { type: 'lowpass', freq: 1200 } },
    ],
  },
  /** …on porcelain: klink. */
  klink: {
    vol: 0.3,
    vary: 80,
    cooldown: 0.03,
    maxVoices: 4,
    reverb: 0.15,
    layers: [
      { wave: 'triangle', freq: 2350, env: { a: 0.001, d: 0.22, s: 0 }, vol: 0.6 },
      { wave: 'sine', freq: 3720, env: { a: 0.001, d: 0.12, s: 0 }, vol: 0.35 },
      { wave: 'sine', freq: 420, to: 160, sweep: 0.05, env: { a: 0.001, d: 0.06, s: 0 }, vol: 0.4 },
    ],
  },
  /** …on wood: tock. */
  tock: {
    vol: 0.32,
    vary: 70,
    cooldown: 0.03,
    maxVoices: 4,
    layers: [
      { wave: 'square', freq: 640, to: 300, sweep: 0.03, env: { a: 0.001, d: 0.05, s: 0 }, vol: 0.4, filter: { type: 'lowpass', freq: 1800 } },
      { wave: 'noise', env: { a: 0.001, d: 0.04, s: 0 }, vol: 0.4, filter: { type: 'bandpass', freq: 900, q: 2 } },
    ],
  },
  /** …on cloth or a basket: a soft puff. */
  fluff: {
    vol: 0.26,
    vary: 50,
    cooldown: 0.03,
    maxVoices: 4,
    layers: [{ wave: 'noise', env: { a: 0.004, d: 0.09, s: 0 }, filter: { type: 'lowpass', freq: 700, to: 300, time: 0.08 } }],
  },
  /** A vätte becomes a thing: a puff of smoke and a magic pop. */
  poff: {
    vol: 0.36,
    vary: 40,
    reverb: 0.2,
    maxVoices: 4,
    layers: [
      { wave: 'noise', env: { a: 0.005, d: 0.22, s: 0 }, vol: 0.5, filter: { type: 'bandpass', freq: 500, to: 2600, time: 0.2, q: 0.8 } },
      { wave: 'sine', freq: 330, steps: [0, 7, 12, 19], stepTime: 0.035, env: { a: 0.001, d: 0.2, s: 0 }, dur: 0.16, vol: 0.45 },
    ],
  },
  /** Lock or unlock: a little click. */
  lock: {
    vol: 0.2,
    cooldown: 0.1,
    layers: [{ wave: 'square', freq: 1500, to: 1100, sweep: 0.01, env: { a: 0.001, d: 0.025, s: 0 }, filter: { type: 'lowpass', freq: 3000 } }],
  },
  /** A dart in a vätte that isn't caught yet (a chair takes two): a squeak. */
  squeak: {
    vol: 0.36,
    cooldown: 0.05,
    maxVoices: 3,
    layers: [{ wave: 'triangle', freq: 880, to: 1500, sweep: 0.07, env: { a: 0.002, d: 0.12, s: 0 } }],
  },
  /** Tagen! A slide whistle down and a jingle of stars. */
  caught: {
    vol: 0.44,
    reverb: 0.25,
    maxVoices: 3,
    layers: [
      { wave: 'sine', freq: 1600, to: 380, sweep: 0.45, env: { a: 0.005, d: 0.5, s: 0 }, vol: 0.55 },
      { wave: 'triangle', freq: 1568, steps: [0, 4, 7, 12, 16], stepTime: 0.05, env: { a: 0.002, d: 0.3, s: 0 }, dur: 0.3, vol: 0.35 },
    ],
  },
  /** You caught one: a bright rising ding. */
  gotcha: {
    vol: 0.38,
    reverb: 0.2,
    layers: [{ wave: 'square', freq: 784, steps: [0, 7, 12], stepTime: 0.06, env: { a: 0.002, d: 0.35, s: 0 }, dur: 0.22, vol: 0.5, filter: { type: 'lowpass', freq: 4500 } }],
  },
  /** A wrong guess: a dull bonk and a sad little drop. */
  bonk: {
    vol: 0.42,
    maxVoices: 2,
    cooldown: 0.08,
    layers: [
      { wave: 'sine', freq: 240, to: 90, sweep: 0.14, env: { a: 0.001, d: 0.18, s: 0 } },
      { wave: 'triangle', freq: 523, steps: [0, -3], stepTime: 0.12, env: { a: 0.01, d: 0.3, s: 0 }, dur: 0.25, vol: 0.3 },
    ],
  },
  /** Taunts: the thing tells on itself. A cup's tinkle, a chair's creak, a vätte's giggle. */
  tauntTink: {
    vol: 0.3,
    reverb: 0.2,
    layers: [{ wave: 'triangle', freq: 2093, steps: [0, 4, 0, 7], stepTime: 0.09, env: { a: 0.002, d: 0.4, s: 0 }, dur: 0.36 }],
  },
  tauntCreak: {
    vol: 0.3,
    layers: [{ wave: 'sawtooth', freq: 140, to: 210, sweep: 0.5, env: { a: 0.05, d: 0.5, s: 0 }, vol: 0.5, filter: { type: 'bandpass', freq: 900, q: 6 } }],
  },
  tauntGiggle: {
    vol: 0.3,
    reverb: 0.15,
    layers: [{ wave: 'sine', freq: 990, steps: [0, 5, 0, 5, 0, 7], stepTime: 0.06, env: { a: 0.002, d: 0.4, s: 0 }, dur: 0.36 }],
  },
  /** A springy hop. */
  jump: {
    vol: 0.2,
    vary: 50,
    cooldown: 0.08,
    maxVoices: 3,
    layers: [{ wave: 'triangle', freq: 330, to: 880, sweep: 0.09, env: { a: 0.002, d: 0.1, s: 0 } }],
  },
  /** Landing, and footsteps on the linoleum: a soft thud. */
  land: {
    vol: 0.36,
    cooldown: 0.1,
    maxVoices: 2,
    layers: [
      { wave: 'sine', freq: 150, to: 42, sweep: 0.14, env: { a: 0.001, d: 0.2, s: 0 } },
      { wave: 'noise', env: { a: 0.001, d: 0.06, s: 0 }, vol: 0.3, filter: { type: 'lowpass', freq: 700 } },
    ],
  },
  /** Back in: a shimmering arpeggio. */
  respawn: {
    vol: 0.28,
    reverb: 0.25,
    layers: [{ wave: 'sine', freq: 523, steps: [0, 4, 7, 12], stepTime: 0.05, env: { a: 0.002, d: 0.3, s: 0 }, dur: 0.25 }],
  },
  /** The round starts: a soft bell, the kusiner shut their eyes. */
  bell: {
    vol: 0.36,
    reverb: 0.35,
    layers: [
      { wave: 'sine', freq: 880, env: { a: 0.002, d: 1.2, s: 0 }, vol: 0.6 },
      { wave: 'sine', freq: 2213, env: { a: 0.002, d: 0.6, s: 0 }, vol: 0.25 },
    ],
  },
  /** The seeking starts: "Nu kommer jag!", a two-note whistle. */
  whistle: {
    vol: 0.38,
    reverb: 0.2,
    layers: [{ wave: 'sine', freq: 1568, steps: [0, -5], stepTime: 0.18, env: { a: 0.01, d: 0.4, s: 0 }, dur: 0.38 }],
  },
  /** Gökuren: "ko-ko" twice, a wooden whistle with a little bellows breath. */
  cuckoo: {
    vol: 0.4,
    reverb: 0.3,
    layers: [
      { wave: 'triangle', freq: 784, steps: [0, -4, -100, 0, -4], stepTime: 0.28, env: { a: 0.01, d: 0.2, s: 0.3, r: 0.08 }, dur: 1.3, vol: 0.8, filter: { type: 'lowpass', freq: 2400 } },
      { wave: 'noise', env: { a: 0.02, d: 0.12, s: 0 }, vol: 0.12, filter: { type: 'bandpass', freq: 1200 } },
    ],
  },
  /** Everything small in the house rattles on its shelf. */
  rattle: {
    vol: 0.22,
    // Many little knocks: short noise bursts stepped quickly, like china and tins on a shelf.
    layers: [
      { wave: 'noise', steps: [0, 0, 0, 0, 0, 0, 0, 0], stepTime: 0.06, env: { a: 0.002, d: 0.03, s: 0 }, dur: 0.5, vol: 0.7, filter: { type: 'bandpass', freq: 3200 } },
      { wave: 'triangle', freq: 2600, steps: [0, 3, -2, 5, 0, 4], stepTime: 0.07, env: { a: 0.001, d: 0.03, s: 0 }, dur: 0.45, vol: 0.25 },
    ],
  },
  /** A tick for the last seconds of a phase. */
  tick: {
    vol: 0.18,
    cooldown: 0.3,
    layers: [{ wave: 'triangle', freq: 1320, env: { a: 0.001, d: 0.04, s: 0 } }],
  },
  /** Someone won the round: an accordion-ish fanfare. */
  win: {
    vol: 0.4,
    reverb: 0.25,
    layers: [
      { wave: 'sawtooth', freq: 523, steps: [0, 4, 7, 12, 7, 12], stepTime: 0.09, env: { a: 0.01, d: 0.7, s: 0 }, dur: 0.6, vol: 0.35, filter: { type: 'lowpass', freq: 2600 } },
      { wave: 'triangle', freq: 261, steps: [0, 7, 12], stepTime: 0.18, env: { a: 0.002, d: 0.7, s: 0 }, dur: 0.6, vol: 0.5 },
    ],
  },
} satisfies Record<string, Patch>;

/**
 * The theme: a sneaky little waltz in A minor (3/4, 12 steps a bar), marimba plucks over an
 * oom-pah-pah, for creeping round mormors kök. 8 bars of melody, chords and bass.
 */
export const MUSIC: Song = {
  bpm: 132,
  swing: 0.04,
  tracks: [
    { patch: INSTRUMENTS.marimba, vol: 0.85, pattern:
      'E5 . . . A5 . . . C6 . B5 . | A5 . . . E5 . . . . . . . | F5 . . . A5 . . . D6 . C6 . | B5 . . . G#5 . . . . . . . | ' +
      'E5 . . . A5 . . . C6 . B5 . | A5 . . . C6 . . . E6 . D6 . | C6 . B5 . A5 . . . G#5 . B5 . | A5 . . . . . . . . . . . ' },
    { patch: INSTRUMENTS.softBass, gate: 0.6, vol: 0.8, pattern:
      'A2 . . . . . . . . . . . | A2 . . . . . . . E2 . . . | D2 . . . . . . . . . . . | E2 . . . . . . . . . . . | ' +
      'A2 . . . . . . . . . . . | F2 . . . . . . . . . . . | E2 . . . . . . . E2 . . . | A2 . . . . . . . . . . . ' },
    { patch: INSTRUMENTS.keys, gate: 0.35, vol: 0.4, pattern:
      '. . . . A3+C4+E4 . . . A3+C4+E4 . . . | . . . . A3+C4+E4 . . . A3+C4+E4 . . . | . . . . D4+F4+A4 . . . D4+F4+A4 . . . | . . . . E3+G#3+B3 . . . E3+G#3+B3 . . . | ' +
      '. . . . A3+C4+E4 . . . A3+C4+E4 . . . | . . . . F3+A3+C4 . . . F3+A3+C4 . . . | . . . . E3+G#3+B3 . . . E3+G#3+B3 . . . | . . . . A3+C4+E4 . . . . . . . ' },
    { patch: INSTRUMENTS.rim, vol: 0.32, pattern: '. . . . x . . . x . . .' },
    { patch: INSTRUMENTS.shaker, pan: 0.3, vol: 0.25, pattern: 'x . x . x . x . x . x .' },
  ],
};
/** A waltz: three beats a bar (for checkSong). */
export const MUSIC_BEATS = 3;

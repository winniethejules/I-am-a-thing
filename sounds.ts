/**
 * Sounds and the theme. A sound is plain data (a Patch): layers of oscillators or noise, each with
 * an envelope, pitch sweeps or arpeggio steps, a filter, drive, echo and reverb. A Song is a few
 * tracks of step patterns. Plain data from the SDK core, so `sounds.test.ts` checks the music
 * under bun. game.ts plays them: yours close and centred, everyone else's in 3D (`Sfx.at3d`).
 */
import { INSTRUMENTS, type Patch, type Song } from '@voxelparty/sdk/core';

export const SOUNDS = {
  /** The blaster: a snappy zap over a puff. */
  shot: {
    vol: 0.26,
    vary: 40,
    maxVoices: 8,
    layers: [
      { wave: 'square', freq: 900, to: 180, sweep: 0.09, env: { a: 0.001, d: 0.1, s: 0 }, vol: 0.5, filter: { type: 'lowpass', freq: 3500 } },
      { wave: 'noise', env: { a: 0.001, d: 0.06, s: 0 }, vol: 0.4, filter: { type: 'bandpass', freq: 2400, q: 1 } },
    ],
  },
  /** Your shot landed: a bright tick you can hear across a fight. */
  hit: {
    vol: 0.3,
    cooldown: 0.04,
    maxVoices: 3,
    layers: [{ wave: 'triangle', freq: 1760, to: 2200, sweep: 0.03, env: { a: 0.001, d: 0.06, s: 0 } }],
  },
  /** You got hit: a low thump. */
  hurt: {
    vol: 0.42,
    maxVoices: 2,
    cooldown: 0.08,
    layers: [
      { wave: 'sine', freq: 160, to: 60, sweep: 0.12, env: { a: 0.001, d: 0.16, s: 0 } },
      { wave: 'noise', env: { a: 0.001, d: 0.08, s: 0 }, vol: 0.4, filter: { type: 'lowpass', freq: 900 } },
    ],
  },
  /** A frag: a rising two-note ding. */
  frag: {
    vol: 0.36,
    reverb: 0.2,
    layers: [{ wave: 'square', freq: 784, steps: [0, 7, 12], stepTime: 0.06, env: { a: 0.002, d: 0.35, s: 0 }, dur: 0.22, vol: 0.5, filter: { type: 'lowpass', freq: 4500 } }],
  },
  /** A springy hop. */
  jump: {
    vol: 0.2,
    vary: 50,
    cooldown: 0.08,
    maxVoices: 3,
    layers: [{ wave: 'triangle', freq: 330, to: 880, sweep: 0.09, env: { a: 0.002, d: 0.1, s: 0 } }],
  },
  /** Landing from a height: a thud and a crunch. */
  land: {
    vol: 0.4,
    cooldown: 0.1,
    maxVoices: 2,
    layers: [
      { wave: 'sine', freq: 150, to: 42, sweep: 0.14, env: { a: 0.001, d: 0.2, s: 0 } },
      { wave: 'noise', env: { a: 0.001, d: 0.08, s: 0 }, vol: 0.4, filter: { type: 'lowpass', freq: 800 } },
    ],
  },
  /** The jump pad: a big rising whoosh. */
  pad: {
    vol: 0.4,
    reverb: 0.15,
    layers: [
      { wave: 'sawtooth', freq: 180, to: 720, sweep: 0.35, env: { a: 0.01, d: 0.4, s: 0 }, vol: 0.4, filter: { type: 'lowpass', freq: 2000 } },
      { wave: 'noise', env: { a: 0.02, d: 0.35, s: 0 }, vol: 0.4, filter: { type: 'bandpass', freq: 800, to: 3000, time: 0.3, q: 1 } },
    ],
  },
  /** Back in: a shimmering arpeggio. */
  respawn: {
    vol: 0.3,
    reverb: 0.25,
    layers: [{ wave: 'sine', freq: 523, steps: [0, 4, 7, 12], stepTime: 0.05, env: { a: 0.002, d: 0.3, s: 0 }, dur: 0.25 }],
  },
  /** Someone won the round: a little fanfare. */
  win: {
    vol: 0.4,
    reverb: 0.25,
    layers: [
      { wave: 'square', freq: 523, steps: [0, 4, 7, 12, 7, 12], stepTime: 0.09, env: { a: 0.002, d: 0.7, s: 0 }, dur: 0.6, vol: 0.5, filter: { type: 'lowpass', freq: 4000 } },
      { wave: 'triangle', freq: 261, steps: [0, 7, 12], stepTime: 0.18, env: { a: 0.002, d: 0.7, s: 0 }, dur: 0.6, vol: 0.5 },
    ],
  },
} satisfies Record<string, Patch>;

export const MUSIC: Song = {
  bpm: 140,
  tracks: [
    { patch: INSTRUMENTS.bass, pattern: 'E2 . E2 . G2 . E2 . A2 . A2 . G2 . D2 .', gate: 0.5, vol: 0.85 },
    { patch: INSTRUMENTS.kick, pattern: 'X . . . x . . . X . . . x . . .', vol: 0.6 },
    { patch: INSTRUMENTS.shaker, pattern: '(. x)*8', pan: 0.3, vol: 0.5 },
  ],
};

/**
 * The game's own effects, one per moment (vp docs vfx), in the house's palette: falu red, mint,
 * cream, the lamp's warm yellow. Plain data from the headless core, like sounds.ts; game.ts plays
 * them from the same cues as the sounds.
 */
import type { Effect } from '@voxelparty/sdk/core';

const FALU = '#c2402f', MINT = '#9fd3b0', CREAM = '#f6efe0', YELLOW = '#ffd34a', LAMP = '#ffd98a';

export const EFFECTS = {
  /** A vätte becomes a thing (or itself again): a cloud of smoke and the house's confetti. */
  poff: {
    layers: [
      { kind: 'particles', shape: 'smoke', count: 10, life: [0.45, 0.75], size: [0.22, 0.4], speed: [0.7, 1.4], dir: 'out', from: 'sphere', radius: 0.18, height: 0.3, drag: 3, color: ['#fffaf0e0', '#efe4cc00'], blend: 'alpha', tint: 0 },
      { kind: 'particles', shape: 'pixel', count: 9, life: [0.5, 0.9], size: [0.045, 0.07], speed: [2, 3.4], dir: 'up', spread: 75, height: 0.3, gravity: 7, drag: 1, color: FALU },
      { kind: 'particles', shape: 'pixel', count: 9, life: [0.5, 0.9], size: [0.045, 0.07], speed: [2, 3.4], dir: 'up', spread: 75, height: 0.3, gravity: 7, drag: 1, color: MINT },
      { kind: 'particles', shape: 'pixel', count: 7, life: [0.5, 0.9], size: [0.045, 0.07], speed: [2, 3.4], dir: 'up', spread: 75, height: 0.3, gravity: 7, drag: 1, color: YELLOW },
      { kind: 'particles', shape: 'star', count: 3, life: 0.35, size: [0.12, 0.18], speed: [0.5, 1], dir: 'out', height: 0.35, color: ['#ffffff', YELLOW + '00'], glow: 2 },
    ],
  },
  /** A dart sticks in a wall or the floor: a little ring of dust round the cup. */
  dartWall: {
    layers: [
      { kind: 'particles', shape: 'pixel', count: 6, life: [0.25, 0.4], size: [0.03, 0.05], speed: [0.8, 1.6], dir: 'back', spread: 60, gravity: 7, color: '#d9cfbc' },
      { kind: 'ring', style: 'ripple', life: 0.25, radius: [0.05, 0.22], width: 0.25, face: 'forward', color: ['#ffffffb0', '#ffffff00'] },
    ],
  },
  /** …in porcelain: white shards and a glint. */
  dartPorcelain: {
    layers: [
      { kind: 'particles', shape: 'shard', count: 6, life: [0.3, 0.5], size: [0.04, 0.07], speed: [1.2, 2.2], dir: 'back', spread: 70, gravity: 8, spin: 8, color: ['#ffffff', '#cfdcff'] },
      { kind: 'particles', shape: 'flare', count: 1, life: 0.18, size: 0.22, speed: 0, color: ['#ffffff', '#ffffff00'], glow: 2.2 },
    ],
  },
  /** …in wood: chips. */
  dartWood: {
    layers: [
      { kind: 'particles', shape: 'chunk', count: 6, life: [0.35, 0.55], size: [0.035, 0.06], speed: [1, 2], dir: 'back', spread: 60, gravity: 9, spin: 6, color: '#b58450' },
    ],
  },
  /** …in cloth or a basket: fluff that hangs in the air. */
  dartCloth: {
    layers: [
      { kind: 'particles', shape: 'dot', count: 7, life: [0.6, 1.1], size: [0.025, 0.045], speed: [0.4, 0.9], dir: 'back', spread: 80, gravity: -0.3, drag: 3, color: [CREAM, CREAM + '00'] },
    ],
  },
  /** A dart in a vätte that holds (a chair takes two): a squeak of yellow stars. */
  dartVatte: {
    layers: [
      { kind: 'particles', shape: 'star', count: 4, life: [0.3, 0.5], size: [0.08, 0.13], speed: [1.2, 2], dir: 'out', spread: 60, color: [YELLOW, YELLOW + '00'], glow: 1.8 },
      { kind: 'ring', style: 'burst', life: 0.18, radius: [0.1, 0.3], color: ['#ffffffd0', '#ffffff00'], face: 'forward' },
    ],
  },
  /** Tagen! Stars circle the vätte's head as it tumbles out of the thing, and the house's confetti flies. */
  caught: {
    layers: [
      { kind: 'particles', shape: 'star', count: 5, life: 1.3, size: [0.11, 0.15], speed: 0, dir: 'none', from: 'ring', radius: 0.32, height: 0.85, swirl: 5, local: true, color: [YELLOW, YELLOW, YELLOW + '00'], glow: 1.8 },
      { kind: 'ring', style: 'burst', life: 0.3, radius: [0.2, 0.8], y: 0.4, color: [YELLOW + 'e0', YELLOW + '00'] },
      { kind: 'particles', shape: 'pixel', count: 14, life: [0.6, 1], size: [0.05, 0.08], speed: [2.5, 4], dir: 'up', spread: 70, height: 0.4, gravity: 8, color: FALU },
      { kind: 'particles', shape: 'pixel', count: 14, life: [0.6, 1], size: [0.05, 0.08], speed: [2.5, 4], dir: 'up', spread: 70, height: 0.4, gravity: 8, color: MINT },
    ],
  },
  /** A wrong guess: a puff of grey dust off the thing, and a flat red bonk. */
  wrongGuess: {
    layers: [
      { kind: 'particles', shape: 'smoke', count: 6, life: [0.5, 0.8], size: [0.15, 0.28], speed: [0.4, 0.8], dir: 'up', spread: 80, drag: 2, color: ['#9a958acc', '#9a958a00'], blend: 'alpha', tint: 0 },
      { kind: 'ring', style: 'burst', life: 0.22, radius: [0.12, 0.35], color: ['#ff5a36d0', '#ff5a3600'], face: 'forward' },
    ],
  },
  /** The suction gun's puff of air at the muzzle. */
  muzzle: {
    layers: [
      { kind: 'particles', shape: 'smoke', count: 3, life: [0.12, 0.2], size: [0.015, 0.03], speed: [0.6, 1.2], dir: 'forward', spread: 25, drag: 4, color: ['#ffffff90', '#ffffff00'], blend: 'alpha', tint: 0 },
    ],
  },
  /** A taunt: notes rise from the thing. */
  taunt: {
    layers: [
      { kind: 'particles', shape: 'note', count: 4, life: [0.9, 1.3], size: [0.1, 0.15], speed: [0.5, 0.9], dir: 'up', spread: 35, height: 0.3, gravity: -0.4, color: ['#ff9fb0', '#ff9fb000'], glow: 1.4 },
      { kind: 'particles', shape: 'note', count: 2, life: [0.9, 1.3], size: [0.1, 0.14], speed: [0.5, 0.9], dir: 'up', spread: 35, height: 0.3, gravity: -0.4, color: [LAMP, LAMP + '00'], glow: 1.4 },
    ],
  },
  /** Back in play: a few warm sparkles rising. */
  spawn: {
    layers: [
      { kind: 'particles', shape: 'pixel', count: 10, life: [0.5, 0.8], size: [0.04, 0.06], speed: [0.6, 1.2], dir: 'up', from: 'ring', radius: 0.3, gravity: -1, color: [LAMP, LAMP + '00'], glow: 1.6 },
    ],
  },
} satisfies Record<string, Effect>;

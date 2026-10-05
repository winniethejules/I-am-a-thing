/**
 * The look test (PLAN.md phase 0): three lighting and grade variants, and the fixed photo points
 * (voxelparty-kvalitet §2). Three-free data; scene.ts applies a variant, game.ts holds the camera.
 */
import type { MoodSpec } from '@voxelparty/sdk';

export interface LookVariant {
  name: string;
  /** The sky, the sun's colour and strength, the bounce light (inside it's the house's ambient). */
  sky: MoodSpec;
  /** Dimmer levels: the ceiling lamps, the stove, daylight through the windows, blue dusk through them. */
  lamp: number;
  stove: number;
  day: number;
  dusk: number;
  grade: { exposure?: number; vignette?: number; saturation?: number; contrast?: number; shadows?: string; highlights?: string; split?: number; tint?: string };
}

export const LOOKS: Record<'A' | 'B' | 'C', LookVariant> = {
  /** Söndagseftermiddag: a low sun through the windows, warm highlights, the lamp off. */
  A: {
    name: 'Söndagseftermiddag',
    sky: { from: 'day', sunIntensity: 3.3, sun: '#ffe9c4', bounce: 0.26, env: 0.25, sky: '#cfe6ff', ground: '#d8c39a' },
    lamp: 0, stove: 0.35, day: 1, dusk: 0,
    grade: { exposure: 1, saturation: 1.12, contrast: 1.06, highlights: '#fff0d8', shadows: '#d6defa', vignette: 0.85 },
  },
  /** Regnig eftermiddag: grey outside, the lamp and the stove make it cosy inside. */
  B: {
    name: 'Regnig eftermiddag',
    sky: { from: 'storm', sunIntensity: 0.9, bounce: 0.3, env: 0.25, clouds: 1, cloudTint: '#b9c0c8', rain: 0 },
    lamp: 1, stove: 1, day: 0.5, dusk: 0,
    grade: { exposure: 1.05, saturation: 1.08, contrast: 1.08, highlights: '#ffdcae', shadows: '#c3cbe6', vignette: 1.0 },
  },
  /** Skymning: the blue hour outside, every lamp lit, the most contrast. */
  C: {
    name: 'Skymning',
    sky: { from: 'dusk', top: '#1f2b5c', horizon: '#c98a7a', sunIntensity: 0.8, sun: '#ff9d6a', bounce: 0.22, env: 0.2 },
    lamp: 1, stove: 1, day: 0, dusk: 0.9,
    grade: { exposure: 1.2, saturation: 1.1, contrast: 1.12, highlights: '#ffd9a8', shadows: '#a9b9ff', split: 0.06, vignette: 1.1 },
  },
};
export type LookName = keyof typeof LOOKS;

export interface PhotoPoint {
  name: string;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  /** Your own suction gun in view (a first-person point). */
  gun?: boolean;
  /** Leave the staged kusin out (you are the kusin here). */
  noKusin?: boolean;
}

/** PLAN.md §6. */
export const PHOTOS: PhotoPoint[] = [
  /** Dörröppningen: from the hall door, the whole kitchen, the table under the windows. */
  { name: 'K1', pos: [3.0, 1.5, 5.6], look: [3.0, 1.05, 0.5], fov: 62 },
  /** Hörnet: from by the vitrine, across the table to the window, the garden and the barn. */
  { name: 'K2', pos: [0.75, 1.45, 4.2], look: [3.9, 1.3, 0.2], fov: 60 },
  /** Vättens öga: low on the table among the cups, the kusin coming in behind. */
  { name: 'K3', pos: [1.75, 1.05, 1.0], look: [4.4, 0.85, 3.3], fov: 58 },
  /** Kusinens ögon: first person in the kitchen, the suction gun held. */
  { name: 'K4', pos: [2.7, 1.45, 4.4], look: [2.6, 0.9, 1.5], fov: 75, gun: true, noKusin: true },
];

/**
 * Our own characters (no party avatars, voxelparty-kvalitet §5), three-free: Volumes for `Avatar`.
 * Both face +z with their feet at y 0. Variants come from a number (a player's id hash), so the same
 * player always looks the same.
 *
 * - Kusinen (the seeker): a child of 1.3 m in a hand-knitted jumper, jeans, wellies and a bobble hat.
 * - Vätten (the hider): a small grey house spirit, 0.75 m with its big red cap, a moss-green waistcoat.
 */
import { Volume } from '@voxelparty/sdk/core';
import { box } from './models';
import type { Ids } from './textures';

export const KUSIN_VOXEL = 1 / 12;
export const VATTE_VOXEL = 1 / 16;
export const GUN_VOXEL = 1 / 16;

export interface KusinLook {
  /** 0..3: the jumper. */
  jumper: number;
  /** 0..1: brown or blond. */
  hair: number;
  /** 0..1: bobble hat or cap. */
  hat: number;
}

export const kusinLook = (n: number): KusinLook => ({ jumper: n & 3, hair: (n >> 2) & 1, hat: (n >> 3) & 1 });

export function kusin(k: Ids, look: KusinLook): Volume {
  const jumper = [k.KNIT, k.KNIT_RED, k.MOSS, k.YELLOW][look.jumper];
  const band = look.jumper === 3 ? k.KNIT : k.WHITE;
  const hair = look.hair ? k.HAIR_LIGHT : k.HAIR;
  const v = new Volume(9, 20, 6);
  // Wellies and jeans.
  box(v, 1, 0, 1, 4, 2, 5, k.BOOT);
  box(v, 5, 0, 1, 8, 2, 5, k.BOOT);
  box(v, 1, 2, 1, 4, 7, 4, k.DENIM);
  box(v, 5, 2, 1, 8, 7, 4, k.DENIM);
  box(v, 4, 6, 1, 5, 7, 4, k.DENIM);
  // The jumper, with its knitted band of dots, and sleeves.
  box(v, 1, 7, 1, 8, 12, 5, jumper);
  for (let x = 1; x < 8; x++) v.set(x, 10, 4, x % 2 ? band : jumper);
  for (let x = 1; x < 8; x++) v.set(x, 10, 1, x % 2 ? band : jumper);
  box(v, 0, 8, 2, 1, 12, 4, jumper);
  box(v, 8, 8, 2, 9, 12, 4, jumper);
  v.set(0, 7, 3, k.SKIN); v.set(8, 7, 3, k.SKIN);   // hands
  box(v, 1, 7, 1, 8, 8, 5, jumper === k.KNIT ? k.KNIT_RED : k.KNIT);   // the ribbing
  // Head: face to +z, hair round the back and top.
  box(v, 2, 12, 1, 7, 17, 5, k.SKIN);
  box(v, 2, 15, 1, 7, 17, 2, hair);
  box(v, 2, 12, 1, 7, 15, 2, hair);
  box(v, 2, 16, 2, 7, 17, 5, hair);
  if (look.hair) {
    // Pigtails: they stick out at the sides, so the blond kusiner have their own silhouette.
    box(v, 1, 13, 2, 2, 15, 3, hair);
    box(v, 7, 13, 2, 8, 15, 3, hair);
    v.set(0, 13, 2, hair); v.set(8, 13, 2, hair);
  }
  v.set(3, 14, 4, k.EYE); v.set(5, 14, 4, k.EYE);
  v.set(2, 13, 4, k.ROSEPINK); v.set(6, 13, 4, k.ROSEPINK);
  v.set(4, 12, 4, k.RED);   // a grin
  // The hat.
  if (look.hat === 0) {
    box(v, 2, 17, 1, 7, 19, 5, k.KNIT_RED);
    for (let x = 2; x < 7; x++) v.set(x, 17, 4, x % 2 ? k.WHITE : k.KNIT_RED);
    v.set(4, 19, 3, k.WHITE); v.set(4, 19, 2, k.WHITE);   // the bobble
  } else {
    box(v, 2, 17, 1, 7, 18, 5, k.BLUE);
    box(v, 2, 17, 5, 7, 18, 6, k.BLUE);   // the peak
  }
  return v;
}

export interface VatteLook {
  /** 0..3: tall pointed, bent, floppy, or a short nightcap with a bobble. */
  cap: number;
  /** 0..1: a white beard. */
  beard: number;
  /** 0..3: the waistcoat's shade. */
  vest: number;
}

export const vatteLook = (n: number): VatteLook => ({ cap: n % 4, beard: Math.floor(n / 4) % 2, vest: Math.floor(n / 8) % 4 });

export function vatte(k: Ids, look: VatteLook): Volume {
  const vest = [k.MOSS, k.GREEN, k.WOOD_DARK, k.BLUE][look.vest];
  const v = new Volume(9, 17, 9);
  // Feet, a round grey body, the waistcoat.
  box(v, 2, 0, 3, 4, 1, 7, k.WOOD_DEEP);
  box(v, 5, 0, 3, 7, 1, 7, k.WOOD_DEEP);
  box(v, 1, 1, 2, 8, 7, 7, k.FUR);
  box(v, 2, 1, 1, 7, 7, 8, k.FUR);
  box(v, 1, 2, 2, 8, 5, 7, vest);
  box(v, 2, 2, 1, 7, 5, 8, vest);
  box(v, 4, 2, 7, 5, 5, 8, k.FUR);             // the waistcoat's opening
  v.set(4, 3, 8, k.BRASS);                       // a button
  // Little arms.
  box(v, 0, 3, 4, 1, 6, 6, k.FUR);
  box(v, 8, 3, 4, 9, 6, 6, k.FUR);
  // The face: big shiny eyes, a round nose, maybe a beard.
  box(v, 2, 7, 2, 7, 10, 7, k.FUR);
  box(v, 2, 8, 7, 4, 10, 8, k.EYE_WHITE);
  box(v, 5, 8, 7, 7, 10, 8, k.EYE_WHITE);
  v.set(3, 8, 7, k.EYE); v.set(5, 8, 7, k.EYE);
  v.set(4, 7, 8, k.SKIN);
  if (look.beard) {
    box(v, 2, 5, 7, 7, 7, 8, k.WHITE);
    v.set(4, 4, 8, k.WHITE);
  }
  // The red cap: a wide brim, then a cone that bends.
  box(v, 1, 10, 1, 8, 11, 8, k.FALU_FLAT);
  box(v, 2, 11, 2, 7, 13, 7, k.FALU_FLAT);
  if (look.cap === 0) {
    box(v, 3, 13, 3, 6, 15, 6, k.FALU_FLAT);
    v.set(4, 15, 4, k.FALU_FLAT); v.set(4, 16, 4, k.FALU_FLAT);
  } else if (look.cap === 1) {
    box(v, 3, 13, 3, 6, 14, 6, k.FALU_FLAT);
    box(v, 3, 14, 4, 5, 15, 7, k.FALU_FLAT);
    v.set(4, 15, 7, k.FALU_FLAT); v.set(4, 14, 8, k.WHITE);
  } else if (look.cap === 2) {
    box(v, 3, 13, 2, 6, 14, 6, k.FALU_FLAT);
    box(v, 3, 13, 0, 5, 14, 2, k.FALU_FLAT);
    v.set(4, 12, 0, k.WHITE);
  } else {
    box(v, 1, 11, 1, 8, 12, 8, k.FALU_FLAT);     // wide and short, with a white bobble
    box(v, 3, 12, 3, 6, 13, 6, k.WHITE);
  }
  return v;
}

/**
 * Sugkoppspistolen: orange plastic, a yellow dart with its cup in the barrel. Built muzzle to +z;
 * held by its grip (the lowest voxels), as `Avatar.wear` expects.
 */
export function suctionGun(k: Ids): Volume {
  const v = new Volume(3, 7, 12);
  box(v, 0, 3, 2, 3, 6, 9, k.ORANGE);            // the body
  box(v, 1, 6, 3, 2, 7, 7, k.YELLOW);            // the sight ridge
  box(v, 0, 0, 2, 3, 3, 4, k.ORANGE);            // the grip
  box(v, 1, 2, 4, 2, 3, 6, k.ORANGE);            // the trigger guard
  box(v, 1, 4, 9, 2, 5, 11, k.ORANGE);           // the barrel
  box(v, 1, 4, 8, 2, 5, 11, k.DART);             // the dart, its shaft showing
  box(v, 0, 3, 11, 3, 6, 12, k.RED);             // the suction cup
  return v;
}

/**
 * The suction gun in first person, finer (1/48 m, about 0.5 m long): ridged grip, a sight, side
 * stripes, a dart loaded with its red cup at the muzzle. Built muzzle to +z, grip at the bottom.
 */
export function suctionGunFp(k: Ids): Volume {
  const v = new Volume(7, 12, 25);
  box(v, 1, 5, 4, 6, 10, 20, k.ORANGE);          // the body
  box(v, 1, 5, 3, 6, 10, 4, k.RED);              // the back cap
  box(v, 3, 10, 6, 4, 11, 18, k.YELLOW);         // the sight ridge
  box(v, 2, 10, 16, 5, 12, 17, k.YELLOW);        // the front sight
  for (const x of [1, 5]) box(v, x, 7, 6, x + 1, 8, 18, k.YELLOW);   // side stripes
  box(v, 2, 0, 5, 5, 5, 9, k.ORANGE);            // the grip
  for (let y = 0; y < 5; y += 2) box(v, 2, y, 5, 5, y + 1, 9, k.RED);
  box(v, 3, 2, 10, 4, 5, 13, k.ORANGE);          // the trigger guard
  v.set(3, 2, 9, k.ORANGE); v.set(3, 4, 11, k.YELLOW);
  box(v, 2, 6, 20, 5, 9, 23, k.ORANGE);          // the barrel
  box(v, 3, 7, 17, 4, 8, 24, k.DART);            // the dart's shaft
  box(v, 2, 6, 23, 5, 9, 25, k.RED);             // its suction cup
  v.set(3, 7, 24, k.CHOC);                        // the cup's dimple
  return v;
}

/** A single dart that flies and sticks: a yellow shaft and a red cup at +z. */
export function dart(k: Ids): Volume {
  const v = new Volume(3, 3, 8);
  box(v, 1, 1, 0, 2, 2, 7, k.DART);
  box(v, 0, 0, 7, 3, 3, 8, k.RED);
  return v;
}

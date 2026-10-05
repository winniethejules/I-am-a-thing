/**
 * Every texture and block of Mormors hus, painted in code (16×16, the world's 16 texels a metre).
 * Materials tile; props use near-flat colours and let their voxels draw the shape (art.md §8).
 * The palette and the role of each colour are in PLAN.md §4.
 */
import { Px, S, flat, hex, mix, pal, shade, type Rng, type TexDef } from '@voxelparty/sdk/core';
import type { GameBlockDef } from '@voxelparty/sdk';

const near = (c: string, j = 0.04) => (p: Px, r: Rng) => p.noise([hex(c)], r, j);

/** Rutigt linoleum: 25 cm rutor, grädde och salvia, slitet i kanterna. */
function lino(p: Px, r: Rng) {
  const a = hex('#ece4d2'), b = hex('#9fb8a6');
  p.each((x, y) => {
    const c = ((x >> 2) + (y >> 2)) & 1 ? b : a;
    p.set(x, y, shade(c, 0.96 + r() * 0.07));
  });
}

/** Mint tapet med små vita och rosa blomkvistar i ett förskjutet rutnät. */
function mintPaper(p: Px, r: Rng) {
  p.noise(pal('#a3d6b3', '#9fd3b0', '#a8d9b8'), r, 0.03);
  const petal = hex('#f6f1e4'), heart = hex('#e8a0a8'), leaf = hex('#7fb894');
  for (const [cx, cy] of [[3, 3], [11, 11]] as const) {
    p.set(cx, cy, heart);
    p.set(cx - 1, cy, petal); p.set(cx + 1, cy, petal); p.set(cx, cy - 1, petal); p.set(cx, cy + 1, petal);
    p.set(cx + 1, cy + 2, leaf); p.set(cx + 2, cy + 3, leaf);
  }
}

/** Rosa randig tapet (hallen). */
function rosePaper(p: Px, r: Rng) {
  const a = hex('#efc5c7'), b = hex('#e3a9ae'), line = hex('#f7e3df');
  p.each((x, y) => {
    const k = x % 8;
    const c = k < 4 ? a : k === 4 || k === 7 ? line : b;
    p.set(x, y, shade(c, 0.97 + r() * 0.05));
  });
}

/** Furugolv: breda ljusa plankor med kvistar. */
function pine(p: Px, r: Rng) {
  const base = pal('#d8ab6c', '#cf9f60', '#dcb276');
  p.each((x, y) => {
    const plank = Math.floor(y / 4);
    let c = mix(base[plank % 3], hex('#c49253'), ((x * 7 + plank * 13) % 16) / 40);
    if (y % 4 === 3) c = shade(c, 0.78);
    if ((x + plank * 5) % 16 === 0) c = shade(c, 0.86);
    p.set(x, y, shade(c, 0.97 + r() * 0.06));
  });
  p.set(5, 1, hex('#8a5a2b')); p.set(12, 9, hex('#8a5a2b'));
}

/** Vitt kakel med grå fogar: 4 px plattor (12,5 cm). */
function tile(p: Px, r: Rng) {
  const t = hex('#f4f1ea'), g = hex('#bdb6a8');
  p.each((x, y) => {
    const grout = x % 4 === 0 || y % 4 === 0;
    p.set(x, y, grout ? g : shade(t, 0.97 + r() * 0.05));
  });
}

/** Falurött panelträ med lodräta spår. */
function falu(p: Px, r: Rng) {
  p.each((x, y) => {
    let c = shade(hex('#a8322a'), 0.92 + r() * 0.12);
    if (x % 4 === 0) c = shade(c, 0.72);
    p.set(x, y, c);
  });
}

/** Rött och vitt rutigt tyg (gardiner, dukar). */
function gingham(p: Px, r: Rng) {
  const red = hex('#c8443a'), white = hex('#f5efe3'), mid = mix(red, white, 0.5);
  p.each((x, y) => {
    const a = (x >> 1) & 1, b = (y >> 1) & 1;
    const c = a && b ? red : a || b ? mid : white;
    p.set(x, y, shade(c, 0.97 + r() * 0.05));
  });
}

/** Björkstam: vit med svarta streck. */
function birch(p: Px, r: Rng) {
  p.noise(pal('#ece8de', '#e2ddd0', '#f3f0e8'), r, 0.03);
  for (let i = 0; i < 5; i++) {
    const y = Math.floor(r() * S), x = Math.floor(r() * 12), w = 2 + Math.floor(r() * 4);
    for (let k = 0; k < w; k++) p.set((x + k) % S, y, hex('#2b2a28'));
  }
}

/** Takpapp på ladan: mörkgrå med rader. */
function roof(p: Px, r: Rng) {
  p.each((x, y) => p.set(x, y, shade(hex(y % 4 === 3 ? '#2c2f33' : '#40454b'), 0.93 + r() * 0.1)));
}

/** Gräsmatta sedd ovanifrån. */
function lawn(p: Px, r: Rng) {
  p.noise(pal('#6fae4c', '#64a244', '#79b856', '#5e9a40'), r, 0.06);
}

export const TEXTURES: TexDef[] = [
  { name: 'ia_lino', paint: lino },
  { name: 'ia_mint', paint: mintPaper },
  { name: 'ia_rose', paint: rosePaper },
  { name: 'ia_pine', paint: pine },
  { name: 'ia_tile', paint: tile },
  { name: 'ia_falu', paint: falu },
  { name: 'ia_gingham', paint: gingham },
  { name: 'ia_birch', paint: birch },
  { name: 'ia_roof', paint: roof },
  { name: 'ia_lawn', paint: lawn },
  // Near-flat colours for props and trim.
  { name: 'ia_white', paint: near('#f2ebdc', 0.03) },
  { name: 'ia_cream', paint: near('#e8dcc2', 0.03) },
  { name: 'ia_wood', paint: flat('#c99a5b', '#c3945a') },
  { name: 'ia_wood_dark', paint: flat('#9a6b3a', '#946538') },
  { name: 'ia_wood_deep', paint: flat('#6e4a2a', '#68462a') },
  { name: 'ia_iron', paint: flat('#2f3236', '#34373c') },
  { name: 'ia_steel', paint: flat('#aeb4b8', '#a6acb0') },
  { name: 'ia_brass', paint: flat('#c8a24a', '#c19a42') },
  { name: 'ia_porc', paint: flat('#f7f4ee', '#f2efe8') },
  { name: 'ia_porc_blue', paint: flat('#3e63b8', '#3a5eb0') },
  { name: 'ia_rosepink', paint: flat('#e58a98', '#de8290') },
  { name: 'ia_red', paint: flat('#c8443a', '#c03e35') },
  { name: 'ia_falu_flat', paint: flat('#a8322a', '#a02e27') },
  { name: 'ia_green', paint: flat('#4f8a3c', '#4a8438') },
  { name: 'ia_leaf', paint: flat('#86c25a', '#7eba54') },
  { name: 'ia_pot', paint: flat('#b8673e', '#b0613a') },
  { name: 'ia_mint_flat', paint: flat('#9fd3b0', '#99cdaa') },
  { name: 'ia_yellow', paint: flat('#f2c94c', '#ecc246') },
  { name: 'ia_blue', paint: flat('#4f7fc4', '#4a79bc') },
  { name: 'ia_paper', paint: flat('#f6f0de', '#f0e9d6') },
  { name: 'ia_ink', paint: flat('#1d2340', '#22284a') },
  { name: 'ia_bread', paint: flat('#c8853f', '#c07d3a') },
  { name: 'ia_cookie', paint: flat('#e0b06a', '#d8a862') },
  { name: 'ia_choc', paint: flat('#5a3420', '#54301e') },
  { name: 'ia_coffee', paint: flat('#3b2416', '#382215') },
  { name: 'ia_glass', paint: flat('#bfe0ea', '#b6d8e2') },
  { name: 'ia_grey', paint: flat('#8f949b', '#888d94') },
  { name: 'ia_fur', paint: flat('#9a9a94', '#94948e') },
  { name: 'ia_skin', paint: flat('#f0c29a', '#ecbc94') },
  { name: 'ia_hair', paint: flat('#6b4326', '#653f24') },
  { name: 'ia_hair_light', paint: flat('#e3c27a', '#dcba72') },
  { name: 'ia_knit', paint: flat('#3f6fb0', '#3b6aa8') },
  { name: 'ia_knit_red', paint: flat('#c74a3c', '#bf4538') },
  { name: 'ia_denim', paint: flat('#3a4f78', '#364a72') },
  { name: 'ia_boot', paint: flat('#2f5a3a', '#2c5436') },
  { name: 'ia_moss', paint: flat('#5f7f3a', '#5a7936') },
  { name: 'ia_eye', paint: flat('#16182a', '#16182a') },
  { name: 'ia_eye_white', paint: flat('#fbfbf6', '#fbfbf6') },
  { name: 'ia_orange', paint: flat('#ff6a2e', '#f8642a') },
  { name: 'ia_dart', paint: flat('#ffd23a', '#f8cb34') },
  { name: 'ia_fence', paint: flat('#f0ece2', '#e8e4da') },
  { name: 'ia_pine_tree', paint: flat('#2f5a3e', '#2b553a') },
  { name: 'ia_trunk', paint: flat('#6a4a32', '#64462f') },
  // Glowing: the stove's fire, the lamp's shade and lit windows far away.
  { name: 'ia_ember', glow: 2, paint: flat('#ff9a3c', '#ffb85c') },
  { name: 'ia_lamp', glow: 1.4, paint: flat('#ffe2a8', '#ffd894') },
  { name: 'ia_window_lit', glow: 1.2, paint: flat('#ffd98a', '#ffcf78') },
];

export const BLOCKS = {
  LINO: 'ia_lino', MINT: 'ia_mint', ROSE: 'ia_rose', PINE: 'ia_pine', TILE: 'ia_tile', FALU: 'ia_falu',
  GINGHAM: 'ia_gingham', BIRCH: 'ia_birch', ROOF: 'ia_roof', LAWN: ['ia_lawn', 'ia_lawn'],
  WHITE: 'ia_white', CREAM: 'ia_cream', WOOD: 'ia_wood', WOOD_DARK: 'ia_wood_dark', WOOD_DEEP: 'ia_wood_deep',
  IRON: 'ia_iron', STEEL: 'ia_steel', BRASS: 'ia_brass', PORC: 'ia_porc', PORC_BLUE: 'ia_porc_blue',
  ROSEPINK: 'ia_rosepink', RED: 'ia_red', FALU_FLAT: 'ia_falu_flat', GREEN: 'ia_green', LEAF: 'ia_leaf', POT: 'ia_pot',
  MINT_FLAT: 'ia_mint_flat', YELLOW: 'ia_yellow', BLUE: 'ia_blue', PAPER: 'ia_paper', INK: 'ia_ink',
  BREAD: 'ia_bread', COOKIE: 'ia_cookie', CHOC: 'ia_choc', COFFEE: 'ia_coffee', GLASS: 'ia_glass', GREY: 'ia_grey',
  FUR: 'ia_fur', SKIN: 'ia_skin', HAIR: 'ia_hair', HAIR_LIGHT: 'ia_hair_light', KNIT: 'ia_knit', KNIT_RED: 'ia_knit_red',
  DENIM: 'ia_denim', BOOT: 'ia_boot', MOSS: 'ia_moss', EYE: 'ia_eye', EYE_WHITE: 'ia_eye_white',
  ORANGE: 'ia_orange', DART: 'ia_dart', FENCE: 'ia_fence', PINE_TREE: 'ia_pine_tree', TRUNK: 'ia_trunk',
  EMBER: { top: 'ia_ember', light: { color: '#ff8a3a', reach: 20, strength: 0.9 } },
  LAMP: 'ia_lamp',
  WINDOW_LIT: 'ia_window_lit',
} satisfies Record<string, GameBlockDef>;

export type Ids = Record<keyof typeof BLOCKS, number>;

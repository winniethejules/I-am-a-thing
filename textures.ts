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
  const a = hex('#ece4d2'), b = hex('#a9c3a2');
  p.each((x, y) => {
    const c = ((x >> 2) + (y >> 2)) & 1 ? b : a;
    p.set(x, y, shade(c, 0.96 + r() * 0.07));
  });
}

/** Mint tapet med små vita och rosa blomkvistar i ett förskjutet rutnät. */
function mintPaper(p: Px, r: Rng) {
  p.noise(pal('#a3d6b3', '#9fd3b0', '#a8d9b8'), r, 0.03);
  const petal = hex('#d9f0df'), heart = hex('#e3a3ab'), leaf = hex('#8cc39f');
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

/** Vardagsrummets tapet: varmt beige med rosa medaljonger och tunna bruna ränder. */
function medallion(p: Px, r: Rng) {
  p.noise(pal('#e9dcc2', '#e5d7bc', '#ecdfc6'), r, 0.03);
  const rose = hex('#cf9a94'), leaf = hex('#9fae84'), line = hex('#c9b38f');
  for (let y = 0; y < S; y++) p.set(0, y, line);
  for (const [cx, cy] of [[8, 4], [8, 12]] as const) {
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) p.set(cx + dx, cy + dy, rose);
    p.set(cx, cy, hex('#b97e78'));
    p.set(cx - 2, cy + 1, leaf); p.set(cx + 2, cy - 1, leaf);
  }
}

/** Sovrummets tapet: ljust gråblå med vita prickblommor (varm nog att inte bli blå i skymningen). */
function bluePaper(p: Px, r: Rng) {
  p.noise(pal('#d6d9d6', '#d2d5d2', '#dadcd9'), r, 0.03);
  const petal = hex('#f4f6f2'), heart = hex('#e3c27a');
  for (const [cx, cy] of [[4, 4], [12, 12], [12, 4], [4, 12]] as const) {
    if ((cx + cy) % 16) { p.set(cx, cy, petal); continue; }
    p.set(cx, cy, heart);
    p.set(cx - 1, cy, petal); p.set(cx + 1, cy, petal); p.set(cx, cy - 1, petal); p.set(cx, cy + 1, petal);
  }
}

/** Syrummets tapet: smörgul med gröna kvistar. */
function yellowPaper(p: Px, r: Rng) {
  p.noise(pal('#efe2b2', '#ebdeac', '#f2e6b8'), r, 0.03);
  const leaf = hex('#93a874');
  for (const [cx, cy] of [[3, 5], [11, 13]] as const) {
    p.set(cx, cy, leaf); p.set(cx + 1, cy - 1, leaf); p.set(cx + 2, cy - 2, leaf); p.set(cx, cy - 2, leaf); p.set(cx + 2, cy, leaf);
  }
}

/** Badrummets kakel: små ljust turkosa plattor med vita fogar. */
function bathTile(p: Px, r: Rng) {
  const t = hex('#cfe6e1'), g = hex('#e4efec');
  p.each((x, y) => p.set(x, y, x % 4 === 0 || y % 4 === 0 ? g : shade(t, 0.97 + r() * 0.05)));
}

/** Badrumsgolvet: svartvitt schack i små rutor. */
function bathFloor(p: Px, r: Rng) {
  p.each((x, y) => p.set(x, y, shade(hex(((x >> 1) + (y >> 1)) & 1 ? '#7f8680' : '#efe9dd'), 0.96 + r() * 0.06)));
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

/** Pärlspont i taket: white-painted boards with a faint groove. */
function ceiling(p: Px, r: Rng) {
  p.each((x, y) => p.set(x, y, shade(hex(y % 4 === 3 ? '#ddd6c6' : '#f1ebdd'), 0.98 + r() * 0.04)));
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
  { name: 'ia_ceiling', paint: ceiling },
  { name: 'ia_medallion', paint: medallion },
  { name: 'ia_bluepaper', paint: bluePaper },
  { name: 'ia_yellowpaper', paint: yellowPaper },
  { name: 'ia_bathtile', paint: bathTile },
  { name: 'ia_bathfloor', paint: bathFloor },
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
  { name: 'ia_orange', paint: flat('#ff8a1c', '#f8841a') },
  { name: 'ia_dart', paint: flat('#ffd23a', '#f8cb34') },
  { name: 'ia_fence', paint: flat('#f0ece2', '#e8e4da') },
  { name: 'ia_pine_tree', paint: flat('#2f5a3e', '#2b553a') },
  { name: 'ia_trunk', paint: flat('#6a4a32', '#64462f') },
  // The detail pass: shades and materials for finer props.
  { name: 'ia_wood_light', paint: flat('#ddb57a', '#d7ae72') },
  { name: 'ia_porc_shade', paint: flat('#e4ded2', '#dfd9cc') },
  { name: 'ia_gold', paint: flat('#d9b452', '#d2ac4a') },
  { name: 'ia_leaf_dark', paint: flat('#3b6b2e', '#37652b') },
  { name: 'ia_wicker', paint: flat('#c99d62', '#c2965c') },
  { name: 'ia_wicker_dark', paint: flat('#9a7244', '#936c40') },
  { name: 'ia_kraft', paint: flat('#e6d6b3', '#e0cfab') },
  { name: 'ia_soot', paint: flat('#1d1f22', '#1b1d20') },
  { name: 'ia_steel_light', paint: flat('#d5dade', '#cfd4d8') },
  { name: 'ia_straw', paint: flat('#e3c467', '#dcbc5f') },
  { name: 'ia_berry', paint: flat('#3a3463', '#36305d') },
  { name: 'ia_jam', paint: flat('#8e2630', '#88232d') },
  { name: 'ia_plush', paint: flat('#b9797a', '#b37374') },
  { name: 'ia_plush_dark', paint: flat('#94585c', '#8e5357') },
  { name: 'ia_moss_velvet', paint: flat('#6d8566', '#677f60') },
  { name: 'ia_mahogany', paint: flat('#7a3f2a', '#743b27') },
  { name: 'ia_allmoge', paint: flat('#6f8ea6', '#6989a1') },
  { name: 'ia_allmoge_red', paint: flat('#9c3b30', '#96372d') },
  { name: 'ia_pink', paint: flat('#efb9c0', '#e9b2b9') },
  { name: 'ia_lilac', paint: flat('#b7a4c8', '#b19ec2') },
  { name: 'ia_screen', paint: flat('#3a4a4f', '#36454a') },
  { name: 'ia_felt', paint: flat('#5d4c3e', '#57473a') },
  { name: 'ia_rubber', paint: flat('#2c4a34', '#294530') },
  { name: 'ia_quilt_blue', paint: flat('#8fb0c9', '#89aac3') },
  { name: 'ia_ceramic', paint: flat('#f4f3ee', '#efeee9') },
  { name: 'ia_tile_kakel', paint: flat('#e9e2cf', '#e3dcc9') },
  { name: 'ia_kakel_blue', paint: flat('#5f7fa8', '#5a79a1') },
  { name: 'ia_cat', paint: flat('#d9894a', '#d38445') },
  { name: 'ia_cat_light', paint: flat('#f2d3a8', '#ecccA0') },
  { name: 'ia_water', paint: flat('#9fcfd6', '#99c9d0') },
  { name: 'ia_teeth', paint: flat('#fbf6e6', '#f6f0df') },
  { name: 'ia_gum', paint: flat('#e88b97', '#e2858f') },
  // Glowing: the stove's fire, the lamp's shade and lit windows far away.
  { name: 'ia_ember', glow: 2, paint: flat('#ff9a3c', '#ffb85c') },
  { name: 'ia_lamp', glow: 1.4, paint: flat('#ffe2a8', '#ffd894') },
  { name: 'ia_window_lit', glow: 1.2, paint: flat('#ffd98a', '#ffcf78') },
];

export const BLOCKS = {
  LINO: 'ia_lino', MINT: 'ia_mint', ROSE: 'ia_rose', PINE: 'ia_pine', TILE: 'ia_tile', FALU: 'ia_falu',
  GINGHAM: 'ia_gingham', BIRCH: 'ia_birch', ROOF: 'ia_roof', LAWN: ['ia_lawn', 'ia_lawn'], CEILING: 'ia_ceiling',
  WHITE: 'ia_white', CREAM: 'ia_cream', WOOD: 'ia_wood', WOOD_DARK: 'ia_wood_dark', WOOD_DEEP: 'ia_wood_deep',
  IRON: 'ia_iron', STEEL: 'ia_steel', BRASS: 'ia_brass', PORC: 'ia_porc', PORC_BLUE: 'ia_porc_blue',
  ROSEPINK: 'ia_rosepink', RED: 'ia_red', FALU_FLAT: 'ia_falu_flat', GREEN: 'ia_green', LEAF: 'ia_leaf', POT: 'ia_pot',
  MINT_FLAT: 'ia_mint_flat', YELLOW: 'ia_yellow', BLUE: 'ia_blue', PAPER: 'ia_paper', INK: 'ia_ink',
  BREAD: 'ia_bread', COOKIE: 'ia_cookie', CHOC: 'ia_choc', COFFEE: 'ia_coffee', GLASS: 'ia_glass', GREY: 'ia_grey',
  FUR: 'ia_fur', SKIN: 'ia_skin', HAIR: 'ia_hair', HAIR_LIGHT: 'ia_hair_light', KNIT: 'ia_knit', KNIT_RED: 'ia_knit_red',
  DENIM: 'ia_denim', BOOT: 'ia_boot', MOSS: 'ia_moss', EYE: 'ia_eye', EYE_WHITE: 'ia_eye_white',
  MEDALLION: 'ia_medallion', BLUEPAPER: 'ia_bluepaper', YELLOWPAPER: 'ia_yellowpaper', BATHTILE: 'ia_bathtile', BATHFLOOR: 'ia_bathfloor',
  WOOD_LIGHT: 'ia_wood_light', PORC_SHADE: 'ia_porc_shade', GOLD: 'ia_gold', LEAF_DARK: 'ia_leaf_dark',
  WICKER: 'ia_wicker', WICKER_DARK: 'ia_wicker_dark', KRAFT: 'ia_kraft', SOOT: 'ia_soot', STEEL_LIGHT: 'ia_steel_light',
  STRAW: 'ia_straw', BERRY: 'ia_berry', JAM: 'ia_jam', PLUSH: 'ia_plush', PLUSH_DARK: 'ia_plush_dark',
  MOSS_VELVET: 'ia_moss_velvet', MAHOGANY: 'ia_mahogany', ALLMOGE: 'ia_allmoge', ALLMOGE_RED: 'ia_allmoge_red',
  PINK: 'ia_pink', LILAC: 'ia_lilac', SCREEN: 'ia_screen', FELT: 'ia_felt', RUBBER: 'ia_rubber', QUILT_BLUE: 'ia_quilt_blue',
  CERAMIC: 'ia_ceramic', KAKEL: 'ia_tile_kakel', KAKEL_BLUE: 'ia_kakel_blue', CAT: 'ia_cat', CAT_LIGHT: 'ia_cat_light',
  WATER: 'ia_water', TEETH: 'ia_teeth', GUM: 'ia_gum',
  ORANGE: 'ia_orange', DART: 'ia_dart', FENCE: 'ia_fence', PINE_TREE: 'ia_pine_tree', TRUNK: 'ia_trunk',
  EMBER: { top: 'ia_ember', light: { color: '#ff8a3a', reach: 20, strength: 0.9 } },
  LAMP: 'ia_lamp',
  WINDOW_LIT: 'ia_window_lit',
} satisfies Record<string, GameBlockDef>;

export type Ids = Record<keyof typeof BLOCKS, number>;

// Street frontage: hand-designed businesses, lived-in upper floors and base
// architecture. Everything here is background art drawn behind gameplay.
import * as A from './neon-architecture.js';
import { paintMaterial } from './world-art.js';
const {
  box, seg, poly, dot, ring, frame, hash, spill, pool, wash, tube, tubeRect, neonText, plainText, flicker,
  masonry, windowUnit, balcony, fireEscape, awningFabric, bladeSign, lightBox, windowScript, drainpipe,
  cableRun, laundryLine, parapet, rooftopKit, backdropTower, cornice, stringCourse, quoins, ghostSign,
  occupant, crowdFigure, rainStreaks, glassSheen, dishSat, antennaMast, ventStacks, acFarm, pavementLamp,
  benchProp, litterBin, planterBox, crateStack, dumpster, utilityBox, barrierProp, bollard, aBoard,
  parasolTable, bicycle, steamColumn, ventGrate, alleyMouth, pipeRunAt, exteriorStairs, fenceMesh,
  holoPanel, vehicle, wetSmear, puddle, drainGrate, manhole, doorLeaf, siteFor, tone,
  GROUND, PLINTH, KERB, WALK, PITCH
} = A;

/* ------------------------------------------------------------------ mood */
const PAL = {
  market: { wall: '#3a2b2c', brick: '#7c5647', trim: '#8d6a55', warm: '#f0b878', accent: '#ff7ab0', cold: '#6fb6c6' },
  utility: { wall: '#1f3239', brick: '#5c787e', trim: '#7fa0a4', warm: '#cfe6e2', accent: '#57e6dd', cold: '#8fd6e6' },
  crown: { wall: '#3a3126', brick: '#8a6c48', trim: '#a3825a', warm: '#ffd39a', accent: '#ffb45c', cold: '#9fc4d0' },
  bazaar: { wall: '#33243a', brick: '#7c4f6d', trim: '#9a6d84', warm: '#ffc7e0', accent: '#ff5fa8', cold: '#a98fd0' },
  stacks: { wall: '#26332a', brick: '#5d7a63', trim: '#82a184', warm: '#dff0c8', accent: '#96e0a8', cold: '#8fc0b0' },
  yards: { wall: '#3a2c22', brick: '#8a5c38', trim: '#a67a4c', warm: '#ffbf82', accent: '#ff8b3d', cold: '#c0a890' },
  spires: { wall: '#202b34', brick: '#6d8590', trim: '#9fb4bc', warm: '#dff0f6', accent: '#a8e2ee', cold: '#a8e2ee' }
};
const FLAVOR_PAL = {
  relay: PAL.utility, garrison: PAL.utility, fortress: PAL.crown, club: PAL.bazaar,
  coop: PAL.stacks, foundry: PAL.yards, executive: PAL.spires, street: PAL.market
};
const palFor = zi => [PAL.market, PAL.utility, PAL.crown, PAL.bazaar, PAL.stacks, PAL.yards, PAL.spires][zi] || PAL.market;

/* -------------------------------------------------------------- business */
const BIZ = [
  { id: 'kitchen', name: 'NIGHT KITCHEN', sub: 'HOT SOUP / 24H', hue: '#ff9774', wall: '#4a332c' },
  { id: 'clinic', name: 'WIRE CLINIC', sub: 'WALK INS WELCOME', hue: '#71f8d6', wall: '#27403f' },
  { id: 'laundry', name: 'CORNER LAUNDRY', sub: 'WASH / DRY / REPAIR', hue: '#b8a0ff', wall: '#3b3647' },
  { id: 'second', name: 'SECOND HAND', sub: 'PARTS WITH A PAST', hue: '#ffc96b', wall: '#443b2e' },
  { id: 'records', name: 'RAIN RECORDS', sub: 'LISTEN BEFORE YOU BUY', hue: '#ff83cf', wall: '#3a2c40' },
  { id: 'mart', name: 'LUCKY MART', sub: 'GROCERIES / EVERY NIGHT', hue: '#74d8ff', wall: '#2c4041' },
  { id: 'homes', name: 'LOTUS APARTMENTS', sub: 'RESIDENTS / FLOORS 02—05', hue: '#e6bf85', wall: '#3b3a34' },
  { id: 'canteen', name: 'SHIFT CANTEEN', sub: 'WORKERS / ALL SHIFTS', hue: '#ff8b3d', wall: '#4a3a2a' },
  { id: 'tea', name: 'TEA & CHAR', sub: 'ONE PRICE / NO CREDIT', hue: '#8fd6a8', wall: '#33402f' },
  { id: 'radio', name: 'RADIO REPAIR', sub: 'WE FIX WHAT THE CITY DROPS', hue: '#7fd0ff', wall: '#2b3a44' },
  { id: 'bath', name: 'BATHHOUSE NINE', sub: 'HOT WATER / LOCKERS', hue: '#ff9ad0', wall: '#40303c' }
];
const MIX = {
  street: ['kitchen', 'clinic', 'laundry', 'second', 'records', 'mart', 'homes', 'tea', 'tea', 'radio', 'bath', 'mart'],
  relay: ['clinic', 'second', 'radio', 'homes', 'canteen', 'mart'],
  garrison: ['canteen', 'clinic', 'second', 'radio', 'mart', 'homes'],
  fortress: ['radio', 'canteen', 'clinic', 'second'],
  club: ['records', 'tea', 'bath', 'laundry', 'kitchen', 'kitchen'],
  coop: ['mart', 'tea', 'laundry', 'kitchen', 'homes', 'mart'],
  foundry: ['canteen', 'second', 'bath', 'radio', 'mart', 'kitchen'],
  executive: ['homes', 'clinic', 'mart', 'tea', 'mart']
};
const bizFor = (flavor, sd) => {
  const pool_ = MIX[flavor] || MIX.street;
  return BIZ.find(b => b.id === pool_[Math.floor(hash(sd * 1.7 + 3.3) * pool_.length) % pool_.length]);
};
const mid = (a, b) => a + (b - a) * hash(a * .37 + b);

/* ------------------------------------------------------- shop interiors */
// Shared perspective shell: side walls, ceiling and floor converge on a back wall.
function shell(c, b, o = {}) {
  const { back = '#1d1610', floorCol = '#22190f', ceil = '#100c09', warm = '#ffd8a0', t = 0, sd = 0, dep = 20 } = o;
  box(c, b.x, b.y, b.w, b.h, '#05080b');
  box(c, b.x + dep, b.y + 7, b.w - dep * 2, b.h - 15, back);
  wash(c, b.x + dep, b.y + 7, b.w - dep * 2, b.h - 15, [[0, '#000000aa'], [.5, '#00000033'], [1, '#ffffff08']]);
  poly(c, [[b.x, b.y], [b.x + dep, b.y + 7], [b.x + dep, b.y + b.h - 8], [b.x, b.y + b.h]], '#141c21');
  poly(c, [[b.x + b.w, b.y], [b.x + b.w - dep, b.y + 7], [b.x + b.w - dep, b.y + b.h - 8], [b.x + b.w, b.y + b.h]], '#101820');
  poly(c, [[b.x, b.y], [b.x + dep, b.y + 7], [b.x + b.w - dep, b.y + 7], [b.x + b.w, b.y]], ceil);
  poly(c, [[b.x, b.y + b.h], [b.x + dep, b.y + b.h - 8], [b.x + b.w - dep, b.y + b.h - 8], [b.x + b.w, b.y + b.h]], floorCol);
  c.globalAlpha = .22;
  for (let i = 0; i < 4; i++) { const yy = b.y + b.h - 8 - i * 2.4; box(c, b.x + dep - i * 2, yy, b.w - dep * 2 + i * 4, 1, '#000000'); }
  c.globalAlpha = 1;
  box(c, b.x + dep + 6, b.y + 11, b.w - dep * 2 - 12, 3, warm + 'aa');   // ceiling light trough
  // Photopixel surfaces: painted back wall and boarded floor over the existing gradients.
  paintMaterial(c, 'plaster', b.x + dep, b.y + 7, b.w - dep * 2, b.h - 15, { alpha: .5, seed: sd | 0, scale: 62, bevel: false });
  paintMaterial(c, 'wood', b.x + dep, b.y + b.h - 9, b.w - dep * 2, 9, { alpha: .42, seed: (sd + 3) | 0, scale: 48, bevel: false });
  pool(c, b.x + b.w / 2, b.y + b.h * .3, b.w * .55, warm, .16, true);
  for (let i = 0; i < 3; i++) dot(c, b.x + b.w * (.3 + i * .2), b.y + b.h - 4, 1.4, warm + '77');
}
function crowd(c, b, n, t, sd, col = '#0c0f14', y = null) {
  for (let i = 0; i < n; i++) {
    const n2 = hash(sd + i * 3.7);
    const px = b.x + 10 + n2 * (b.w - 22), walk = n2 > .5 ? 1 : 0;
    const px2 = px + Math.sin(t * .32 + sd + i) * 5 * walk;
    crowdFigure(c, px2, y ?? (b.y + b.h - 6), .84 + n2 * .2, { t, sd: sd + i, walk, col, coat: 5 + n2 * 3 });
  }
}
function kitchen(c, b, p, t) {
  const sd = p.sd, warm = '#ffc98a';
  shell(c, b, { back: '#5c4436', floorCol: '#2a1d14', warm, t, sd });
  // tiled splashback, extractor hood and a shelf of stacked bowls
  for (let i = 0; i < 9; i++) box(c, b.x + 22 + i * 22, b.y + 12, 20, 22, i % 2 ? '#7d6a58' : '#6d5a4a');
  box(c, b.x + 24, b.y + 12, b.w - 48, 4, '#8a7460');
  box(c, b.x + 30, b.y + 8, 70, 12, '#39424a'); box(c, b.x + 32, b.y + 14, 66, 5, '#1c242b');
  steamColumn(c, b.x + 64, b.y + 14, t, { sd, rise: 26, r: 5, alpha: .07, n: 2 });
  // serving counter with a steel top, bowls and a soup urn
  const cx = b.x + 8, cw = b.w - 62;
  box(c, cx, b.y + b.h - 30, cw, 22, '#4a3b2e'); box(c, cx, b.y + b.h - 34, cw, 5, '#b9c2bd');
  box(c, cx, b.y + b.h - 8, cw, 8, '#2a2019');
  for (let i = 0; i < 6; i++) { dot(c, cx + 10 + i * 16, b.y + b.h - 28, 5, '#c9d2cc'); dot(c, cx + 10 + i * 16, b.y + b.h - 29, 3.4, '#8b9691'); }
  box(c, cx + 10, b.y + b.h - 52, 22, 18, '#3b4a4e'); dot(c, cx + 21, b.y + b.h - 44, 8, '#2a3539');
  dot(c, cx + 21, b.y + b.h - 45, 6, '#e0a05a');
  steamColumn(c, cx + 21, b.y + b.h - 50, t, { sd, rise: 30, r: 6, alpha: .1, n: 3 });
  box(c, cx + 38, b.y + b.h - 46, 3, 14, '#8b9691');                    // ladle
  // griddle with flickering heat and a wall menu of tickets
  box(c, b.x + b.w - 52, b.y + b.h - 44, 40, 34, '#2f3a3e');
  box(c, b.x + b.w - 48, b.y + b.h - 40, 32, 8, '#1a2226');
  for (let i = 0; i < 4; i++) {
    const f = .5 + .5 * Math.sin(t * 8 + i * 1.7 + sd);
    box(c, b.x + b.w - 46 + i * 8, b.y + b.h - 38 - f * 4, 5, 3 + f * 4, `rgba(255,150,70,${.5 + f * .4})`);
  }
  for (let i = 0; i < 3; i++) {
    box(c, b.x + 34 + i * 15, b.y + 18, 11, 15, '#d8cdb4');
    plainText(c, ['SOUP', 'NOODLE', 'COFFEE'][i], b.x + 39 + i * 15, b.y + 29, { color: '#3a2f22', size: 5.4, align: 'center' });
  }
  // cook behind the pass and a customer at the counter
  occupant(c, b.x + b.w - 34, b.y + b.h - 10, .92, { t, sd: sd + 1, task: 'cook', col: '#0d1116', rim: warm + '55' });
  occupant(c, cx + cw * .55, b.y + b.h - 2, .9, { t, sd: sd + 2, task: 'cup', col: '#0d1116', rim: warm + '44' });
  box(c, b.x + 4, b.y + b.h - 6, 16, 6, '#3a2f26');                    // cat at the baseboard
  dot(c, b.x + 9, b.y + b.h - 8, 2.4, '#3a2f26'); dot(c, b.x + 13, b.y + b.h - 12, 2, '#3a2f26');
}
function clinic(c, b, p, t) {
  const sd = p.sd, warm = '#c9f2e6';
  shell(c, b, { back: '#2c4a46', floorCol: '#182424', warm, t, sd, dep: 22 });
  for (let i = 0; i < 8; i++) box(c, b.x + 24 + i * 24, b.y + 12, 22, 16, i % 2 ? '#8fb6ac' : '#7fa79e');
  // exam bed with a sheet and a curtain track
  box(c, b.x + 12, b.y + b.h - 34, 78, 12, '#5f7d80'); box(c, b.x + 14, b.y + b.h - 40, 74, 7, '#dce8e4');
  box(c, b.x + 14, b.y + b.h - 40, 26, 6, '#cfe0dc'); box(c, b.x + 12, b.y + b.h - 22, 6, 20, '#3f565a'); box(c, b.x + 84, b.y + b.h - 22, 6, 20, '#3f565a');
  box(c, b.x + 10, b.y + 12, b.w - 20, 2, '#8fa4a8');
  for (let i = 0; i < 5; i++) box(c, b.x + 16 + i * 24, b.y + 14, 14, 22 + (i === 2 ? 0 : 6), i === 2 ? '#00000000' : '#7f9c96');
  // scanner arch with a sweeping beam
  const sx = b.x + b.w - 74;
  box(c, sx, b.y + b.h - 46, 8, 46, '#4a6468'); box(c, sx + 44, b.y + b.h - 46, 8, 46, '#4a6468');
  box(c, sx, b.y + b.h - 52, 52, 8, '#5d7c80');
  const sweep = .5 + .5 * Math.sin(t * 2 + sd);
  box(c, sx + 8, b.y + b.h - 44, 36, 3, `rgba(120,240,220,${.3 + sweep * .5})`);
  pool(c, sx + 26, b.y + b.h - 30, 34, '#7fe8dc', .12 * sweep, true);
  // monitor with an ECG trace, trolley and cabinet
  box(c, b.x + b.w - 24, b.y + b.h - 40, 20, 26, '#26343c'); box(c, b.x + b.w - 22, b.y + b.h - 37, 16, 14, '#0a1a1e');
  c.strokeStyle = '#7fe8dc'; c.lineWidth = 1; c.beginPath();
  for (let i = 0; i < 16; i++) {
    const px = b.x + b.w - 22 + i, spike = i % 6 === 3 ? -6 : i % 6 === 4 ? 4 : 0;
    i ? c.lineTo(px, b.y + b.h - 30 + spike) : c.moveTo(px, b.y + b.h - 30 + spike);
  }
  c.stroke();
  box(c, b.x + 100, b.y + b.h - 30, 26, 14, '#3f565a'); for (let i = 0; i < 3; i++) box(c, b.x + 104 + i * 7, b.y + b.h - 36, 3, 8, '#b8c8c4');
  box(c, b.x + b.w - 66, b.y + 20, 20, 22, '#d8e6e2'); box(c, b.x + b.w - 62, b.y + 26, 12, 4, '#c05252'); box(c, b.x + b.w - 62, b.y + 22, 12, 4, '#c05252');
  occupant(c, b.x + 54, b.y + b.h - 4, .92, { t, sd: sd + 1, task: 'reach', col: '#0c1014', rim: warm + '44' });
  occupant(c, b.x + 30, b.y + b.h - 12, .8, { t, sd: sd + 3, task: 'sit', col: '#0c1014', rim: warm + '33' });
}
function laundry(c, b, p, t) {
  const sd = p.sd, warm = '#d8ccff';
  shell(c, b, { back: '#3a3750', floorCol: '#22202e', warm, t, sd, dep: 18 });
  box(c, b.x + 8, b.y + 14, b.w - 16, 3, '#8f8ab0');
  for (let i = 0; i < 4; i++) {                     // washers with turning drums
    const wx = b.x + 12 + i * 34, wy = b.y + b.h - 44;
    box(c, wx, wy, 28, 34, '#a9b0ae'); box(c, wx, wy, 28, 4, '#d5dad6');
    ring(c, wx + 14, wy + 19, 11, '#2c3338', 3); ring(c, wx + 14, wy + 19, 9, '#5f7c88', 1.4);
    const a = t * (1.4 + i * .5) + sd; seg(c, wx + 14 - Math.cos(a) * 6, wy + 19 - Math.sin(a) * 6, wx + 14 + Math.cos(a) * 6, wy + 19 + Math.sin(a) * 6, '#d8e6e4', 2.4);
    box(c, wx + 3, wy + 5, 8, 3, '#7fd6c8'); dot(c, wx + 23, wy + 6, 1.4, '#ff9a9a');
  }
  box(c, b.x + b.w - 40, b.y + b.h - 40, 30, 30, '#8f9a98'); box(c, b.x + b.w - 37, b.y + b.h - 36, 24, 8, '#1f2a2e');  // dryer
  ring(c, b.x + b.w - 25, b.y + b.h - 22, 8, '#2c3338', 2.4);
  box(c, b.x + 10, b.y + 20, 60, 4, '#6f6a86');                    // detergent shelf
  for (let i = 0; i < 6; i++) { box(c, b.x + 13 + i * 9, b.y + 24, 6, 12, ['#8fd6ff', '#ffb45c', '#c9a8ff', '#8fffc9'][i % 4]); box(c, b.x + 13 + i * 9, b.y + 23, 6, 2, '#ffffff55'); }
  box(c, b.x + b.w - 84, b.y + b.h - 34, 52, 5, '#8d7f96');       // folding table
  for (const lx of [b.x + b.w - 80, b.x + b.w - 38]) box(c, lx, b.y + b.h - 29, 4, 27, '#4d4658');
  for (let i = 0; i < 3; i++) box(c, b.x + b.w - 80 + i * 16, b.y + b.h - 40 - i * 3, 14, 5, i % 2 ? '#b9c2c8' : '#8fa0a8');
  for (let i = 0; i < 4; i++) {                                    // hanging washing on a rail
    const px = b.x + 84 + i * 20, sway = Math.sin(t * 1.3 + sd + i) * 1.6;
    c.save(); c.translate(px, b.y + 18); c.rotate(sway * .05);
    poly(c, [[-7, 0], [7, 0], [8, 20], [-8, 20]], ['#9fb6c0', '#c9a48a', '#8fa8b0', '#b8c2a0'][i]); c.restore();
  }
  box(c, b.x + 78, b.y + 17, 84, 2, '#8f8ab0');
  // suds on the floor and someone waiting
  for (let i = 0; i < 5; i++) dot(c, b.x + 20 + hash(sd + i) * (b.w - 40), b.y + b.h - 5, 2 + hash(i + sd) * 3, '#cfd8dd44');
  occupant(c, b.x + 130, b.y + b.h - 3, .88, { t, sd: sd + 2, task: 'phone', col: '#10131a', rim: warm + '44' });
  box(c, b.x + 6, b.y + b.h - 18, 16, 16, '#3f6a5a');              // laundry cart
  box(c, b.x + 8, b.y + b.h - 24, 12, 7, '#b9c2c8');
}
function second(c, b, p, t) {
  const sd = p.sd, warm = '#ffd08a';
  shell(c, b, { back: '#4a4133', floorCol: '#241d14', warm, t, sd, dep: 20 });
  for (let r = 0; r < 3; r++) {                                     // parts shelving
    const sy = b.y + 20 + r * 16;
    box(c, b.x + 8, sy + 14, b.w - 20, 3, '#6f604a');
    for (let i = 0; i < 7; i++) {
      const px = b.x + 11 + i * ((b.w - 26) / 7), n = hash(sd + r * 4 + i);
      if (n > .72) { ring(c, px + 6, sy + 8, 6, '#2a2f33', 2.4); }
      else if (n > .5) { box(c, px, sy + 3, 12, 11, '#3f5a4a'); box(c, px + 2, sy + 5, 8, 3, '#a8c0b0'); }
      else if (n > .28) { box(c, px + 1, sy + 6, 10, 8, '#5a4638'); box(c, px + 3, sy + 4, 6, 3, '#8a9aa0'); }
      else { ring(c, px + 5, sy + 8, 4, '#8a6a3a', 2); box(c, px + 4, sy + 4, 2, 5, '#8a9aa0'); }
    }
  }
  // chain hoist over the bench
  box(c, b.x + 60, b.y + 8, 3, 22, '#6a6a62');
  c.strokeStyle = '#8a8a80'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(b.x + 61.5, b.y + 30); c.lineTo(b.x + 61.5, b.y + 40 + Math.sin(t * .6 + sd) * 2); c.stroke();
  ring(c, b.x + 61.5, b.y + 43 + Math.sin(t * .6 + sd) * 2, 4, '#b0a88a', 2);
  box(c, b.x + 8, b.y + b.h - 26, b.w - 20, 5, '#7a6a52');        // workbench
  for (const lx of [b.x + 12, b.x + b.w - 16]) box(c, lx, b.y + b.h - 21, 5, 19, '#4a4030');
  for (let i = 0; i < 6; i++) { box(c, b.x + 14 + i * 22, b.y + b.h - 32, 10 + hash(i + sd) * 6, 4, '#8a9aa0'); }
  dot(c, b.x + 26, b.y + b.h - 30, 4, '#c9564a');                 // warning lamp
  occupant(c, b.x + 60, b.y + b.h - 3, .9, { t, sd: sd + 1, task: 'reach', col: '#11140f', rim: warm + '44' });
  box(c, b.x + b.w - 30, b.y + b.h - 8, 20, 8, '#2a2a26');       // oil drip tray
  for (let i = 0; i < 3; i++) dot(c, b.x + b.w - 26 + i * 6, b.y + b.h - 5, 1.6, '#0d0f10');
  plainText(c, 'CASH ONLY', b.x + 90, b.y + b.h - 12, { color: '#c9a86a', size: 6, align: 'center' });
}
function records(c, b, p, t) {
  const sd = p.sd, warm = '#ffc0e8';
  shell(c, b, { back: '#3c2f44', floorCol: '#221a28', warm, t, sd, dep: 18 });
  for (let r = 0; r < 3; r++) {                                     // wall of vinyl
    const sy = b.y + 18 + r * 15;
    box(c, b.x + 8, sy + 13, 90, 3, '#5c4a60');
    for (let i = 0; i < 10; i++) {
      const px = b.x + 10 + i * 8.6, n = hash(sd + r * 7 + i);
      box(c, px, sy + 2, 6, 11, ['#c05a8a', '#5a7ac0', '#c08a4a', '#6ac07a', '#8a5ac0'][i % 5]);
      box(c, px + 1, sy + 5, 4, 4, '#f0e8d8aa');
    }
  }
  box(c, b.x + 104, b.y + 18, b.w - 112, 3, '#7a6a80');           // listening booths
  for (let i = 0; i < 2; i++) {
    const bx = b.x + 108 + i * 44;
    box(c, bx, b.y + 21, 38, b.h - 34, '#2b2233'); frame(c, bx, b.y + 21, 38, b.h - 34, '#7a6a80', 1.4);
    box(c, bx + 5, b.y + 26, 28, 22, '#6a5a70'); box(c, bx + 5, b.y + 26, 28, 2, '#c8b0d0');
    box(c, bx + 9, b.y + 50, 20, 4, '#3a2f44');
    occupant(c, bx + 19, b.y + b.h - 12, .74, { t, sd: sd + i, task: i ? 'radio' : 'sit', col: '#0e0c14', rim: warm + '40' });
  }
  box(c, b.x + 10, b.y + b.h - 24, 88, 5, '#6a5a70');             // turntable counter
  box(c, b.x + 10, b.y + b.h - 19, 88, 17, '#3c3044');
  const platter = b.x + 30, py = b.y + b.h - 30;
  dot(c, platter, py, 9, '#141018'); ring(c, platter, py, 9, '#8a7a90', 1.2); dot(c, platter, py, 2.4, '#c9a0d0');
  const spin = t * 3 + sd; seg(c, platter + Math.cos(spin) * 7, py + Math.sin(spin) * 7, platter + Math.cos(spin + .5) * 7, py + Math.sin(spin + .5) * 7, '#a89ab0', 1.2);
  seg(c, platter + 10, py - 8, platter + 12, py - 1, '#b0a2b8', 1.6);
  for (let i = 0; i < 4; i++) { box(c, b.x + 48 + i * 12, b.y + b.h - 30, 9, 9, ['#c05a8a', '#5a7ac0', '#c08a4a', '#6ac07a'][i]); }
  plainText(c, 'NOW SPINNING', b.x + 54, b.y + 26, { color: '#e0b0d8', size: 6, align: 'center' });
  occupant(c, b.x + b.w - 16, b.y + b.h - 4, .88, { t, sd: sd + 4, task: 'browse', col: '#0e0c14', rim: warm + '44' });
}
function mart(c, b, p, t) {
  const sd = p.sd, warm = '#cfeaf6';
  shell(c, b, { back: '#2e4448', floorCol: '#1c2a2c', warm, t, sd, dep: 16 });
  for (let r = 0; r < 3; r++) {                                     // aisle shelves receding
    const sy = b.y + 16 + r * 14, inset = r * 6;
    box(c, b.x + 8 + inset, sy + 12, b.w - 20 - inset * 2, 3, '#5f6f6a');
    for (let i = 0; i < 12; i++) {
      const px = b.x + 10 + inset + i * ((b.w - 24 - inset * 2) / 12), n = hash(sd + r * 5 + i);
      box(c, px, sy + 3, (b.w - 24) / 12 - 3, 9, ['#c07a5a', '#a89a5a', '#5a9a8a', '#8a6a9a', '#c0a05a'][i % 5]);
      box(c, px + 1, sy + 4, (b.w - 24) / 12 - 5, 2, '#f0e8d0aa');
      if (n > .82) box(c, px + 2, sy + 6, 3, 4, '#ff6a7a');
    }
  }
  box(c, b.x + b.w - 34, b.y + 14, 30, b.h - 30, '#1a2c34');      // drinks cooler
  box(c, b.x + b.w - 32, b.y + 17, 26, b.h - 36, '#25454f');
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) box(c, b.x + b.w - 30 + i * 6, b.y + 20 + r * 9, 4, 7, ['#7fd6c8', '#ffb45c', '#8fb4ff', '#ff8fa8'][i]);
  pool(c, b.x + b.w - 19, b.y + b.h / 2, 40, '#9fe0f0', .12, true);
  box(c, b.x + 8, b.y + b.h - 26, 62, 5, '#8a9298');               // produce crate
  for (let i = 0; i < 8; i++) {
    const px = b.x + 12 + i * 7, n = hash(sd + i * 2.3);
    dot(c, px, b.y + b.h - 30, 4, n > .5 ? '#7fa04a' : '#c8a04a');
  }
  box(c, b.x + b.w - 78, b.y + b.h - 22, 40, 4, '#5f6f6a');        // till
  box(c, b.x + b.w - 74, b.y + b.h - 32, 26, 11, '#26333a'); box(c, b.x + b.w - 70, b.y + b.h - 30, 18, 6, '#7fd6c8');
  occupant(c, b.x + b.w - 58, b.y + b.h - 3, .9, { t, sd: sd + 1, task: 'cup', col: '#0e1214', rim: warm + '44' });
  occupant(c, b.x + 84, b.y + b.h - 3, .88, { t, sd: sd + 2, task: 'browse', col: '#0e1214', rim: warm + '40' });
  box(c, b.x + b.w - 92, b.y + b.h - 20, 10, 20, '#2a3a40');       // basket stack
  box(c, b.x + b.w - 89, b.y + b.h - 26, 6, 8, '#4a6a72');
}
function homes(c, b, p, t) {
  const sd = p.sd, warm = '#ffd6a8';
  shell(c, b, { back: '#3a3a34', floorCol: '#2a2a24', warm, t, sd, dep: 14 });
  for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) {          // mailbox wall
    const px = b.x + 8 + i * 22, py = b.y + 16 + r * 15;
    box(c, px, py, 20, 13, i === 4 && r === 2 ? '#8a7a5a' : '#4a5248');
    box(c, px + 3, py + 4, 12, 2, '#20261f');
    if (!(i === 4 && r === 2)) dot(c, px + 17, py + 8, 1.2, '#c9b98f');
    else { box(c, px + 6, py + 8, 8, 6, '#d8c9a0'); }              // one door left open, letters out
  }
  // staircase rising to the right with a rail and a landing lamp
  for (let i = 0; i < 7; i++) { box(c, b.x + 122 + i * 12, b.y + b.h - 12 - i * 8, 13, 9, i % 2 ? '#5a5c52' : '#4c4e46'); }
  seg(c, b.x + 118, b.y + b.h - 34, b.x + 206, b.y + b.h - 92, '#8a8c7a', 2);
  for (let i = 0; i < 5; i++) box(c, b.x + 124 + i * 18, b.y + b.h - 32 - i * 11, 2, 12, '#7a7c6c');
  box(c, b.x + 190, b.y + 20, 20, 26, '#1d2a2e'); box(c, b.x + 192, b.y + 23, 16, 18, '#0a1418');
  dot(c, b.x + 200, b.y + 48, 2.2, '#ffcf90'); pool(c, b.x + 200, b.y + 48, 30, '#ffcf90', .16, true);
  box(c, b.x + b.w - 28, b.y + 18, 22, 40, '#3f4a44');             // intercom panel
  for (let i = 0; i < 6; i++) { box(c, b.x + b.w - 25, b.y + 22 + i * 6, 5, 4, hash(sd + i) > .5 ? '#9fd8c0' : '#2c342c'); }
  plainText(c, 'LOTUS', b.x + 60, b.y + b.h - 6, { color: '#c9b98f', size: 7, align: 'center' });
  occupant(c, b.x + 96, b.y + b.h - 3, .9, { t, sd: sd + 1, task: 'stand', col: '#12150f', rim: warm + '40' });
  box(c, b.x + 4, b.y + b.h - 14, 14, 14, '#4a3a2c');              // doormat and shoes
  box(c, b.x + 3, b.y + b.h - 16, 16, 3, '#6a5a44');
}
function canteen(c, b, p, t) {
  const sd = p.sd, warm = '#ffbe7a';
  shell(c, b, { back: '#4e4230', floorCol: '#2a2318', warm, t, sd, dep: 16 });
  box(c, b.x + 6, b.y + 12, b.w - 12, 22, '#8c7f66');              // menu clock face
  ring(c, b.x + b.w / 2, b.y + 23, 15, '#3a3226', 2);
  plainText(c, 'SHIFT 04', b.x + b.w / 2, b.y + 26, { color: '#ffe0b0', size: 7, align: 'center' });
  seg(c, b.x + b.w / 2, b.y + 23, b.x + b.w / 2 + 7, b.y + 18, '#ffd8a0', 1.2);
  seg(c, b.x + b.w / 2, b.y + 23, b.x + b.w / 2, b.y + 14, '#ffd8a0', 1.6);
  box(c, b.x + 8, b.y + b.h - 28, b.w - 20, 5, '#b9c2bd');         // steel serving line
  box(c, b.x + 8, b.y + b.h - 23, b.w - 20, 20, '#57605c');
  for (let i = 0; i < 6; i++) { box(c, b.x + 12 + i * 26, b.y + b.h - 20, 20, 12, '#8f9791'); box(c, b.x + 12 + i * 26, b.y + b.h - 21, 20, 2, '#c9d2cc'); }
  box(c, b.x + b.w - 60, b.y + b.h - 46, 18, 20, '#4a5a5e');      // soup urn
  dot(c, b.x + b.w - 51, b.y + b.h - 38, 7, '#e0a05a'); box(c, b.x + b.w - 55, b.y + b.h - 48, 8, 3, '#8b9691');
  steamColumn(c, b.x + b.w - 51, b.y + b.h - 48, t, { sd, rise: 26, r: 5, alpha: .09, n: 3 });
  box(c, b.x + 16, b.y + 42, 44, 4, '#6f604a');                    // mug shelf
  for (let i = 0; i < 5; i++) { box(c, b.x + 19 + i * 8, b.y + 46, 5, 6, '#c9c2b0'); ring(c, b.x + 21 + i * 8, b.y + 49, 1.6, '#c9c2b0', 1); }
  occupant(c, b.x + 78, b.y + b.h - 3, .9, { t, sd: sd + 1, task: 'cook', col: '#14120d', rim: warm + '44' });
  occupant(c, b.x + 34, b.y + b.h - 3, .88, { t, sd: sd + 3, task: 'cup', col: '#14120d', rim: warm + '44' });
  box(c, b.x + 100, b.y + b.h - 8, 22, 8, '#3a4a4e');             // tray stack
  for (let i = 0; i < 4; i++) box(c, b.x + 102 + i * 5, b.y + b.h - 12 - i * 2, 4, 3, '#8f9791');
}
function tea(c, b, p, t) {
  const sd = p.sd, warm = '#ffd2a0';
  shell(c, b, { back: '#3a4436', floorCol: '#241f16', warm, t, sd, dep: 16 });
  box(c, b.x + 8, b.y + 40, b.w - 16, 4, '#6a5a3a');              // brass kettle on coals
  dot(c, b.x + 30, b.y + 34, 9, '#c9a05a'); box(c, b.x + 27, b.y + 42, 6, 4, '#8a6a3a');
  box(c, b.x + 24, b.y + 40, 14, 5, '#6a4a2a'); dot(c, b.x + 28, b.y + 39, 2.4, '#ff9a4a'); dot(c, b.x + 34, b.y + 40, 2, '#ffb45c');
  steamColumn(c, b.x + 30, b.y + 32, t, { sd, rise: 30, r: 5, alpha: .08, n: 3 });
  for (let i = 0; i < 4; i++) {                                    // clay pots and steel glasses
    const px = b.x + 52 + i * 24;
    dot(c, px, b.y + b.h - 18, 7, '#8a5a3a'); box(c, px - 4, b.y + b.h - 14, 8, 3, '#a8724a');
    box(c, px + 6, b.y + b.h - 22, 6, 8, '#c8ccd0'); box(c, px + 7, b.y + b.h - 21, 4, 5, '#a8724a');
  }
  box(c, b.x + 6, b.y + b.h - 10, b.w - 14, 4, '#5a4a34');        // mosaic table edge
  for (let i = 0; i < 10; i++) box(c, b.x + 8 + i * (b.w - 16) / 10, b.y + b.h - 9, 4, 3, ['#5a8a8a', '#8a5a5a', '#8a8a5a'][i % 3]);
  for (let i = 0; i < 6; i++) {                                    // string of bulbs along the ceiling
    const px = b.x + 12 + i * (b.w - 24) / 6, yy = b.y + 12 + Math.sin(i * 1.3) * 2;
    seg(c, px, b.y + 9, px, yy, '#5a5a4a', 1); dot(c, px, yy + 2, 2.4, '#ffd8a0');
    pool(c, px, yy + 2, 16, '#ffd8a0', .12, true);
  }
  occupant(c, b.x + 46, b.y + b.h - 3, .88, { t, sd: sd + 1, task: 'cook', col: '#12150f', rim: warm + '44' });
  occupant(c, b.x + b.w - 24, b.y + b.h - 3, .88, { t, sd: sd + 2, task: 'cup', col: '#12150f', rim: warm + '44' });
  plainText(c, 'CASH / NO CREDIT', b.x + b.w / 2, b.y + b.h - 12, { color: '#c9b98f', size: 6, align: 'center' });
}
function radio(c, b, p, t) {
  const sd = p.sd, warm = '#bfe4ff';
  shell(c, b, { back: '#2e3f4a', floorCol: '#1a2228', warm, t, sd, dep: 16 });
  for (let r = 0; r < 2; r++) {                                    // shelf of radios in odd shapes
    const sy = b.y + 18 + r * 17;
    box(c, b.x + 8, sy + 14, 86, 3, '#4a5a64');
    for (let i = 0; i < 4; i++) {
      const px = b.x + 12 + i * 21, n = hash(sd + r * 3 + i);
      box(c, px, sy + 4, 16, 10, n > .6 ? '#7a6a4a' : '#3f4a52');
      dot(c, px + 5, sy + 9, 2.6, '#8a7a5a'); box(c, px + 9, sy + 6, 5, 3, '#2a3238');
      if (n > .7) seg(c, px + 14, sy + 4, px + 17, sy - 4, '#9aa8ac', 1);
    }
  }
  box(c, b.x + 8, b.y + b.h - 24, b.w - 18, 4, '#6a7a80');        // repair bench
  box(c, b.x + 14, b.y + b.h - 44, 34, 20, '#2f3a40');            // open chassis
  box(c, b.x + 17, b.y + b.h - 41, 28, 14, '#1d4a3a');
  for (let i = 0; i < 5; i++) box(c, b.x + 19 + i * 5, b.y + b.h - 40, 2, 10, '#c9b45a');
  dot(c, b.x + 30, b.y + b.h - 36, 2.4, '#ff6a5a');
  box(c, b.x + 56, b.y + b.h - 38, 26, 14, '#1a242b');            // signal generator with a needle
  const nA = Math.sin(t * 2 + sd) * .7;
  seg(c, b.x + 60, b.y + b.h - 28, b.x + 70 + nA * 8, b.y + b.h - 34, '#7fd6ff', 1.2);
  ring(c, b.x + 69 + nA * 8, b.y + b.h - 34, 6, '#5a6a72', 1);
  for (let i = 0; i < 3; i++) ring(c, b.x + 100 + i * 8, b.y + b.h - 16, 4, '#c9a05a', 1.6);
  occupant(c, b.x + 40, b.y + b.h - 3, .88, { t, sd: sd + 1, task: 'radio', col: '#0f1316', rim: warm + '44' });
  occupant(c, b.x + b.w - 30, b.y + b.h - 3, .88, { t, sd: sd + 2, task: 'stand', col: '#0f1316', rim: warm + '40' });
  plainText(c, 'WHILE YOU WAIT', b.x + b.w / 2, b.y + b.h - 10, { color: '#8fb4c0', size: 6, align: 'center' });
}
function bath(c, b, p, t) {
  const sd = p.sd, warm = '#ffc0d8';
  shell(c, b, { back: '#4a3a44', floorCol: '#2c2028', warm, t, sd, dep: 14 });
  for (let i = 0; i < 6; i++) {                                    // numbered cubicles
    const px = b.x + 6 + i * ((b.w - 12) / 6);
    box(c, px, b.y + 12, (b.w - 12) / 6 - 3, b.h - 24, '#5c4650');
    box(c, px + 3, b.y + 16, (b.w - 12) / 6 - 9, b.h - 32, '#7a6472');
    plainText(c, String(i + 1), px + (b.w - 12) / 12, b.y + 28, { color: '#e8d0d8', size: 7, align: 'center' });
    dot(c, px + (b.w - 12) / 6 - 9, b.y + b.h / 2, 1.6, '#d8b070');
    if (i === 2) {                                                 // one door ajar, a silhouette inside
      box(c, px + 3, b.y + 16, 4, b.h - 32, '#4a3a44');
      occupant(c, px + (b.w - 12) / 5, b.y + b.h - 18, .78, { t, sd, task: 'stand', col: '#2a1c26', rim: warm + '44' });
    }
  }
  box(c, b.x + 6, b.y + b.h - 16, b.w - 12, 4, '#6a5060');        // bench
  for (let i = 0; i < 4; i++) box(c, b.x + 16 + i * 40, b.y + b.h - 24, 16, 8, ['#d8c8d0', '#c0d0d8', '#e0d0c0', '#c8d8c8'][i]);
  box(c, b.x + b.w - 34, b.y + 12, 12, 16, '#8a9aa0');            // shower head
  for (let i = 0; i < 8; i++) { const px = b.x + b.w - 32 + (hash(sd + i) - .5) * 10; box(c, px, b.y + 28 + (t * 40 + i * 13) % 26, 1, 5, '#cfe8f0aa'); }
  steamColumn(c, b.x + b.w - 28, b.y + 26, t, { sd, rise: 54, r: 13, alpha: .1, n: 4 });
  dot(c, b.x + 12, b.y + b.h - 6, 3, '#c8b070');                   // wet floor sign
  plainText(c, 'LOCKERS FREE', b.x + 30, b.y + b.h - 4, { color: '#e8c0d0', size: 6 });
}
const SHOPS = { kitchen, clinic, laundry, second, records, mart, homes, canteen, tea, radio, bath };

/* ------------------------------------------------------------- shopfront */
function glassFront(c, b, hue, t, sd, warm) {
  // Mullions, condensation and the neon mirrored in the wet glass.
  const bays = Math.max(3, Math.round(b.w / 46));
  for (let i = 1; i < bays; i++) box(c, b.x + i * b.w / bays, b.y, 3, b.h, '#141c22');
  box(c, b.x, b.y + b.h * .62, b.w, 2, '#141c22');
  wetSmear(c, b.x + 4, b.w - 8, b.y + b.h, b.h * .58, hue, t, sd, .2);
  glassSheen(c, b.x, b.y, b.w, b.h, sd + b.x, .12);
  rainStreaks(c, b.x, b.y, b.w, b.h, t, sd + 17, '#d3ecf4', 10, .26);
  box(c, b.x, b.y, b.w, 3, '#1a242b');
  box(c, b.x, b.y + b.h - 4, b.w, 4, '#1a242b');
  for (let i = 0; i < 3; i++) box(c, b.x + 10 + i * b.w * .3, b.y + 6, b.w * .22, 2, '#ffffff10');
  pool(c, b.x + b.w * .3, b.y + b.h * .4, b.w * .7, warm, .07);
}

function shopFront(c, p, t) {
  const { x, W, sd, biz, hue, pal } = p;
  const b = { x: x + 9, y: GROUND + 40, w: W - 18, h: PLINTH - GROUND - 40 };
  const warm = biz.wall;
  // recess: the front plane is set back under a soffit
  box(c, x - 4, GROUND, W + 8, PLINTH - GROUND + 14, '#0b1117');
  box(c, x, GROUND, W, PLINTH - GROUND + 14, biz.wall);
  wash(c, x, GROUND, W, PLINTH - GROUND, [[0, '#00000099'], [.25, '#00000022'], [1, '#00000066']]);
  (SHOPS[biz.id] || kitchen)(c, b, p, t);
  // stall riser and wet threshold
  box(c, x, PLINTH, W, WALK - PLINTH, '#241f1c');
  for (let i = 0; i < W / 14; i++) box(c, x + i * 14, PLINTH, 12, 5, i % 2 ? '#332c26' : '#2a241f');
  box(c, x, WALK - 3, W, 3, '#4c5a60');
  wetSmear(c, x + 6, W - 12, WALK, 14, hue, t, sd, .3);
  glassFront(c, b, hue, t, sd, warm);
  // door: recessed leaf with a handle, bell and an OPEN card
  const dw = 42, dx = x + W - 54;
  box(c, dx - 4, GROUND + 36, dw + 8, PLINTH - GROUND - 30, '#0a1016');
  doorLeaf(c, dx, GROUND + 40, dw, PLINTH - GROUND - 34, { col: '#16232b', panel: '#223640', sd });
  box(c, dx + dw - 9, GROUND + 92, 3, 12, '#dab68b');
  neonText(c, p.openWord || 'OPEN', dx + dw / 2, GROUND + 54, { color: hue, size: 8, align: 'center', alpha: .9, flick: flicker(t, sd, 4) });
  // fascia: tube frame, name, sub-line, address and an awning
  box(c, x - 4, GROUND - 8, W + 8, 48, '#0c1319');
  box(c, x - 4, GROUND - 8, W + 8, 3, '#2c3a42');
  const f = flicker(t, sd, 5);
  tubeRect(c, x + 2, GROUND - 4, W - 4, 40, hue, { flick: f, width: 1.6, bloom: 1.3 });
  const nameSize = Math.min(15, (W - 24) / (biz.name.length * .62));
  neonText(c, biz.name, x + W / 2, GROUND + 16, { color: hue, size: nameSize, align: 'center', alpha: .96, flick: f, halo: 1.3 });
  plainText(c, biz.sub, x + W / 2, GROUND + 28, { color: '#c5b49a', size: 7, align: 'center', alpha: .8 });
  plainText(c, String(p.address), x + 8, GROUND + 12, { color: '#a9c0b6', size: 8 });
  pool(c, x + W / 2, GROUND + 30, W * .8, hue, .13, true);
  if (p.awning) awningFabric(c, x - 6, GROUND + 32, W + 12, { col: p.awningCol, stripe: '#e6dcc4', h: 15, sd, t });
  // projecting blade sign and window script
  if (p.blade) bladeSign(c, x + W - 2, GROUND - 44 - p.blade * 12, 34, p.blade * 22, { color: hue, t, sd, word: p.bladeWord, glyph: p.bladeWord && p.bladeWord.length <= 6 });
  if (p.script) windowScript(c, x + 14, GROUND + 62, 70, p.script, { color: hue, size: 13, t, sd });
  // practical lighting on the stall front
  for (let i = 0; i < 3; i++) { box(c, x + 18 + i * (W - 40) / 3, GROUND + 34, 14, 3, '#ffe0b0'); pool(c, x + 25 + i * (W - 40) / 3, GROUND + 40, 40, '#ffcf90', .1, true); }
}

/* ------------------------------------------------------------- base fronts */
function garrisonFront(c, p, t) {
  const { x, W, sd, pal } = p, hue = '#ff7a6a';
  box(c, x, GROUND, W, PLINTH - GROUND + 14, '#26313a');
  box(c, x, GROUND, W, PLINTH - GROUND, '#1c262e');
  for (let i = 0; i < W / 26; i++) box(c, x + i * 26, GROUND, 2, PLINTH - GROUND, '#2c3a44');
  box(c, x + 8, GROUND + 22, W * .46, 96, '#1a232a');            // blast door
  frame(c, x + 8, GROUND + 22, W * .46, 96, '#44555f', 2);
  for (let i = 0; i < 6; i++) box(c, x + 12 + i * (W * .46 - 8) / 6, GROUND + 26, 6, 88, '#141c22');
  for (let i = 0; i < 9; i++) {                                     // hazard chevrons
    poly(c, [[x + 10 + i * 14, GROUND + 26], [x + 18 + i * 14, GROUND + 26], [x + 12 + i * 14, GROUND + 40], [x + 4 + i * 14, GROUND + 40]], i % 2 ? '#d8a23c' : '#20262a');
  }
  box(c, x + 12, GROUND + 52, 26, 20, '#0a1016'); box(c, x + 14, GROUND + 54, 22, 16, '#2b4a52');
  // guard podium with a searchlight
  const px = x + W * .62;
  box(c, px, PLINTH - 60, 52, 60, '#2f3d46'); box(c, px - 4, PLINTH - 66, 60, 8, '#42525c');
  box(c, px + 8, PLINTH - 48, 36, 22, '#0d171e'); box(c, px + 10, PLINTH - 46, 32, 18, '#2f5a66');
  box(c, px + 20, PLINTH - 84, 14, 20, '#3a4a54'); dot(c, px + 27, PLINTH - 88, 6, '#dfe9ea');
  const sweep = Math.sin(t * .5 + sd) * .5;
  poly(c, [[px + 27, PLINTH - 88], [px + 27 + sweep * 90, PLINTH - 30], [px + 27 + sweep * 130, PLINTH - 6], [px + 27 + sweep * 60, PLINTH - 40]], '#e8f2f4b0');
  occupant(c, px + 26, PLINTH - 66, .92, { t, sd: sd + 2, task: 'stand', col: '#0e1418', rim: '#9fd8e0aa' });
  // fence, barriers, floodlights and a rotating beacon
  fenceMesh(c, x + W - 66, WALK, 66, 74, { barbed: true, sd });
  barrierProp(c, x + W - 130, WALK, 52, { color: '#d8a23c' });
  for (const lx of [x + 24, x + W - 24]) { box(c, lx - 4, GROUND - 2, 8, 4, '#3a4a54'); box(c, lx, GROUND + 2, 4, 30, '#3a4a54'); }
  pool(c, x + 24, GROUND + 4, 44, '#ffd39a', .12, true); pool(c, x + W - 24, GROUND + 4, 44, '#ffd39a', .12, true);
  const spin = (t * 1.6) % 1;
  box(c, x + W / 2, GROUND + 6, 26, 14, '#2a343c'); box(c, x + W / 2, GROUND + 8, 22, 10, spin < .5 ? '#ff4a5e' : '#7a2a34');
  pool(c, x + W / 2, GROUND + 12, 90, '#ff4a5e', spin < .5 ? .18 : .04, true);
  neonText(c, 'HELIX / SECURITY', x + W / 2, GROUND - 22, { color: '#ff8a7a', size: 10, align: 'center', alpha: .9, flick: flicker(t, sd, 5) });
  plainText(c, ['AUTHORIZED PERSONNEL ONLY', 'SECTOR 03 / KEEP MOVING', 'NO ENTRY WITHOUT A TOKEN'][Math.floor(hash(sd * 2.3) * 3)], x + W / 2, GROUND - 8, { color: '#c9b0a0', size: 7, align: 'center' });
  tubeRect(c, x + 2, GROUND - 32, W - 4, 30, '#ff7a6a', { flick: flicker(t, sd, 6), width: 1.4 });
  barrierProp(c, x + 6, WALK, 40, { color: '#d8a23c' });
}
function foundryFront(c, p, t) {
  const { x, W, sd } = p, hue = '#ff8b3d';
  box(c, x, GROUND, W, PLINTH - GROUND + 14, '#2a2018');
  box(c, x + 6, GROUND + 30, W - 12, 78, '#171310');
  for (let f = 0; f < 2; f++) {
    const fx = x + 18 + f * (W - 60);
    box(c, fx, GROUND + 38, 46, 62, '#3a2c22'); box(c, fx + 4, GROUND + 42, 38, 54, '#160f0c');
    const g = .55 + .45 * Math.sin(t * 2.6 + f * 2 + sd);
    wash(c, fx + 6, GROUND + 44, 34, 50, [[0, `rgba(255,150,60,${.5 * g})`], [1, '#000000']]);
    box(c, fx + 8, GROUND + 46, 30, 48, `rgba(255,168,72,${.35 + g * .3})`);
    box(c, fx + 6, GROUND + 96, 34, 6, '#ff9a4a');
    poly(c, [[fx + 4, GROUND + 38], [fx + 42, GROUND + 38], [fx + 38, GROUND + 26], [fx + 8, GROUND + 26]], '#463528');
    box(c, fx + 2, GROUND + 40, 3, 58, '#584636'); box(c, fx + 41, GROUND + 40, 3, 58, '#584636');
    // door furniture, tap and clinker teeth make the mouth read as iron
    box(c, fx + 8, GROUND + 74, 12, 4, '#7a6a52'); box(c, fx + 9, GROUND + 78, 3, 12, '#4a3f34');
    for (let k = 0; k < 4; k++) box(c, fx + 8 + k * 8, GROUND + 50, 4, 3, k % 2 ? '#ff9a4a' : '#5a3a22');
    pool(c, fx + 23, GROUND + 70, 74, '#ff8b3d', .18 * g, true);
  }
  // control panel, tool wall and pipe run fill out the shed
  box(c, x + W * .5 - 4, GROUND + 34, 40, 40, '#2f2620'); frame(c, x + W * .5 - 4, GROUND + 34, 40, 40, '#54463a', 1.4);
  for (let k = 0; k < 3; k++) {
    dot(c, x + W * .5 + 4 + k * 10, GROUND + 44, 3, hash(Math.floor(t * 3 + sd) + k) > .5 ? '#7fe0d0' : '#2a3a38');
    box(c, x + W * .5 + 1 + k * 10, GROUND + 54, 7, 9, k % 2 ? '#c9564a' : '#4a5a5e');
  }
  plainText(c, 'TAP ' + (1 + Math.floor(hash(sd) * 3)), x + W * .5 + 16, GROUND + 70, { color: '#d8a878', size: 6, align: 'center' });
  for (let k = 0; k < 4; k++) box(c, x + 12 + k * 11, GROUND + 22, 4, 12, '#6a5a4a');
  pipeRunAt(c, x + W - 12, GROUND + 8, PLINTH - GROUND - 8, sd);
  box(c, x + 6, GROUND + 108, W - 12, 8, '#1a1512');             // slag channel
  for (let i = 0; i < 10; i++) box(c, x + 10 + i * (W - 20) / 10, GROUND + 110, 6, 4, i % 2 ? '#ff9a4a' : '#3a2c22');
  fenceMesh(c, x + W - 74, WALK, 74, 58, { col: '#4a3a2a', sd });
  for (let i = 0; i < 3; i++) {                                     // cinder heaps
    const hx = x + 96 + i * 34;
    poly(c, [[hx - 16, WALK], [hx, WALK - 14 - hash(sd + i) * 8], [hx + 16, WALK]], '#1e1a18');
    poly(c, [[hx - 9, WALK - 3], [hx, WALK - 12 - hash(sd + i) * 6], [hx + 8, WALK - 2]], '#2e2824');
  }
  box(c, x + 8, GROUND + 18, W - 16, 12, '#4a3a2a');             // gantry rail
  box(c, x + W * .5 - 6, GROUND + 18, 12, 4, '#5a4a3a');
  c.strokeStyle = '#8a8a80'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + W * .5, GROUND + 22); c.lineTo(x + W * .5, GROUND + 44 + Math.sin(t * .5 + sd) * 3); c.stroke();
  box(c, x + W * .5 - 8, GROUND + 44 + Math.sin(t * .5 + sd) * 3, 16, 12, '#4a4038');
  steamColumn(c, x + 30, GROUND + 20, t, { sd, rise: 90, r: 15, alpha: .09, n: 4 });
  steamColumn(c, x + W - 40, GROUND + 24, t, { sd: sd + 3, rise: 70, r: 12, alpha: .07, n: 3 });
  neonText(c, 'CINDER CREW / FURNACE ' + (1 + Math.floor(hash(sd) * 3)), x + W / 2, GROUND - 20, { color: hue, size: 10, align: 'center', alpha: .95, flick: flicker(t, sd, 4) });
  plainText(c, ['SCRAP IN / SLAG OUT', 'TAP 2 / SHIFT BELL', 'NO FLAME BEYOND THE LINE'][Math.floor(hash(sd * 1.7) * 3)], x + W / 2, GROUND - 6, { color: '#d8a878', size: 7, align: 'center' });
  tubeRect(c, x + 2, GROUND - 30, W - 4, 28, hue, { flick: flicker(t, sd, 6), width: 1.4 });
  occupant(c, x + W * .3, PLINTH - 2, .9, { t, sd: sd + 1, task: 'stand', col: '#151008', rim: '#ff9a4aaa' });
}
function clubFront(c, p, t) {
  const { x, W, sd } = p, hue = '#ff6ad0';
  box(c, x, GROUND, W, PLINTH - GROUND + 14, '#2a1f30');
  box(c, x + 4, GROUND + 34, W - 8, PLINTH - GROUND - 40, '#160f1c');
  // noodle stall: canopy, steam, stools, a cook and a queue
  box(c, x + 8, GROUND + 40, W * .56, 6, '#4a3a44');
  awningFabric(c, x + 4, GROUND + 30, W * .6, { col: '#7a2a44', stripe: '#e0c8a0', h: 13, sd, t });
  box(c, x + 14, GROUND + 52, W * .44, 5, '#b9a68a');
  box(c, x + 14, GROUND + 57, W * .44, 20, '#3a2c30');
  for (let i = 0; i < 5; i++) {
    const px = x + 20 + i * (W * .44 - 12) / 5;
    dot(c, px, GROUND + 50, 6, '#c8ccc4'); dot(c, px, GROUND + 49, 4, '#8a5a3a');
    box(c, px - 3, GROUND + 44, 2, 6, '#9aa8ac');
  }
  steamColumn(c, x + W * .3, GROUND + 46, t, { sd, rise: 46, r: 8, alpha: .11, n: 4 });
  for (let i = 0; i < 3; i++) {
    const sx2 = x + 20 + i * 44;
    box(c, sx2, PLINTH - 4, 20, 4, '#6a4a44'); box(c, sx2 + 4, PLINTH, 3, 8, '#3a2a28'); box(c, sx2 + 14, PLINTH, 3, 8, '#3a2a28');
  }
  occupant(c, x + W * .52, PLINTH - 6, .9, { t, sd: sd + 1, task: 'cook', col: '#100a14', rim: '#ffb0e8aa' });
  occupant(c, x + W * .68, PLINTH - 2, .88, { t, sd: sd + 2, task: 'stand', col: '#100a14', rim: '#ffb0e888' });
  occupant(c, x + W * .78, PLINTH - 2, .86, { t, sd: sd + 4, task: 'cup', col: '#100a14', rim: '#ffb0e888' });
  // speaker stack, posters and cable spaghetti
  box(c, x + W - 62, GROUND + 30, 26, 60, '#241a28'); box(c, x + W - 60, GROUND + 34, 22, 24, '#3a2c3e');
  ring(c, x + W - 49, GROUND + 46, 8, '#0d0a12', 2.4); ring(c, x + W - 49, GROUND + 70, 10, '#0d0a12', 2.4);
  const pulse = .4 + .6 * Math.abs(Math.sin(t * 3.4 + sd));
  pool(c, x + W - 49, GROUND + 58, 46, hue, .12 * pulse, true);
  for (let i = 0; i < 4; i++) {
    const px = x + W - 34 + (i % 2) * 12, py = GROUND + 34 + ((i / 2) | 0) * 26;
    box(c, px, py, 11, 15, ['#c03a5a', '#3a7ac0', '#c0a03a', '#7ac03a'][i]);
    plainText(c, ['LIVE', 'NO FX', 'SET', '2 AM'][i], px + 5.5, py + 10, { color: '#f0e8d0', size: 4.6, align: 'center' });
  }
  for (let k = 0; k < 3; k++) cableRun(c, x + 4, GROUND + 24 + k * 4, x + W - 70, GROUND + 18 + k * 3, 12 + k * 4, { col: '#0d0a12', w: 1.6 });
  awningFabric(c, x + W * .6 - 8, GROUND + 26, 46, { col: '#3a2a5a', stripe: '#c8b0e0', h: 10, sd: sd + 1, t });
  neonText(c, 'WIRE SAINTS / LIVE TONIGHT', x + W / 2, GROUND - 20, { color: hue, size: 9.5, align: 'center', alpha: .95, flick: flicker(t, sd, 3) });
  plainText(c, ['NO CAMERAS. NO CREDIT.', 'SET AT MIDNIGHT', 'ALL WELCOME / NO WEAPONS'][Math.floor(hash(sd * 1.9) * 3)], x + W / 2, GROUND - 6, { color: '#e0b8e0', size: 7, align: 'center' });
  tubeRect(c, x + 2, GROUND - 32, W - 4, 30, hue, { flick: flicker(t, sd, 4), width: 1.5 });
  for (let i = 0; i < 5; i++) { const px = x + 10 + i * (W - 20) / 5; dot(c, px, GROUND + 34, 2, i % 2 ? '#ffd8a0' : '#ff9ad0'); pool(c, px, GROUND + 34, 26, '#ffd8a0', .1, true); }
}
function coopFront(c, p, t) {
  const { x, W, sd } = p, hue = '#96e0a8';
  box(c, x, GROUND, W, PLINTH - GROUND + 14, '#2a352a');
  box(c, x + 4, GROUND + 26, W - 8, PLINTH - GROUND - 32, '#16201a');
  // lean-to greenhouse with planting trays under grow lights
  poly(c, [[x + 4, GROUND + 30], [x + W * .58, GROUND + 12], [x + W * .58, GROUND + 20], [x + 4, GROUND + 38]], '#3f5a48');
  for (let i = 0; i < 5; i++) seg(c, x + 10 + i * (W * .54) / 5, GROUND + 30, x + 16 + i * (W * .54) / 5, GROUND + 14 + i, '#8fb49a', 1.2);
  box(c, x + 10, GROUND + 46, W * .5, 4, '#4a3a2c');
  for (let i = 0; i < 8; i++) {
    const px = x + 14 + i * (W * .5 - 8) / 8;
    dot(c, px, GROUND + 42, 4, hash(sd + i) > .5 ? '#6aa04a' : '#8fb45a');
    box(c, px - 3, GROUND + 44, 6, 4, '#5a4636');
  }
  box(c, x + 10, GROUND + 30, W * .5, 3, '#cfe8b0'); pool(c, x + 10 + W * .25, GROUND + 34, W * .3, '#bfe8a0', .14, true);
  // noticeboard, laundry, residents and a bicycle
  box(c, x + W * .62, GROUND + 34, 46, 34, '#3a3026'); box(c, x + W * .62, GROUND + 34, 46, 3, '#5a4b3a');
  for (let i = 0; i < 4; i++) box(c, x + W * .62 + 4 + (i * 11) % 34, GROUND + 40 + ((i * 9) % 22), 8, 10, ['#d8cfa8', '#c9d8c0', '#e0d0b0', '#b8c8d8'][i]);
  laundryLine(c, x + W * .62, x + W - 8, GROUND + 14, { t, sd, count: 3, warm: true });
  occupant(c, x + W * .68, PLINTH - 2, .9, { t, sd: sd + 1, task: 'stand', col: '#12180f', rim: '#cfe8b0aa' });
  occupant(c, x + W * .86, PLINTH - 2, .88, { t, sd: sd + 2, task: 'cup', col: '#12180f', rim: '#cfe8b088' });
  for (let i = 0; i < 3; i++) planterBox(c, x + 8 + i * 26, WALK, { w: 20, seed: sd + i });
  neonText(c, 'LOTUS CO-OP / RESIDENTS', x + W / 2, GROUND - 20, { color: hue, size: 9.5, align: 'center', alpha: .92, flick: flicker(t, sd, 5) });
  plainText(c, ['QUIET AFTER 02:00', 'SHARE THE HARVEST', 'TOOLS IN / TOOLS OUT'][Math.floor(hash(sd * 2.9) * 3)], x + W / 2, GROUND - 6, { color: '#cfe8b8', size: 7, align: 'center' });
  tubeRect(c, x + 2, GROUND - 32, W - 4, 30, hue, { flick: flicker(t, sd, 6), width: 1.4 });
}
function fortressFront(c, p, t) {
  const { x, W, sd } = p, hue = '#ff9a5a';
  box(c, x, GROUND, W, PLINTH - GROUND + 14, '#33322c');
  for (let i = 0; i < W / 52; i++) { box(c, x + i * 52, GROUND, 12, PLINTH - GROUND, '#403e36'); box(c, x + i * 52 + 10, GROUND, 2, PLINTH - GROUND, '#1a1a16'); }
  box(c, x + 16, GROUND + 40, W * .5, 74, '#1a1d1e'); frame(c, x + 16, GROUND + 40, W * .5, 74, '#5a5a4e', 2);
  for (let i = 0; i < 6; i++) box(c, x + 20 + i * (W * .5 - 8) / 6, GROUND + 44, 5, 66, '#101314');
  box(c, x + 24, GROUND + 66, 30, 22, '#0a0c0d'); box(c, x + 26, GROUND + 68, 26, 18, '#2a4048');
  box(c, x + W * .5 + 20, GROUND + 34, W * .34, 80, '#24282a');     // slit window band
  for (let i = 0; i < 4; i++) {
    box(c, x + W * .5 + 26, GROUND + 44 + i * 18, W * .34 - 12, 8, i % 2 ? '#c08a4a' : '#1a1e20');
    if (i % 2) occupant(c, x + W * .5 + 40 + hash(sd + i) * 40, GROUND + 56 + i * 18, .8, { t, sd: sd + i, task: 'stand', col: '#0a0c0e', rim: '#ffcf8a88' });
  }
  for (const lx of [x + 8, x + W - 14]) {                            // floodlights
    box(c, lx, GROUND + 10, 6, 40, '#3a3a32'); poly(c, [[lx, GROUND + 10], [lx + 16, GROUND + 2], [lx + 18, GROUND + 12], [lx + 6, GROUND + 16]], '#4a4a40');
    pool(c, lx + 10, GROUND + 30, 60, '#ffd39a', .14, true);
  }
  fenceMesh(c, x + W - 70, WALK, 70, 66, { col: '#4a4a42', barbed: true, sd });
  barrierProp(c, x + 4, WALK, 44, { color: '#b8b09a' });
  plainText(c, 'ARCHIVE / LEVEL 4', x + 6, GROUND + 20, { color: '#b8b0a0', size: 8 });
  neonText(c, 'HELIX ARCHIVE', x + W / 2, GROUND - 20, { color: hue, size: 10, align: 'center', alpha: .9, flick: flicker(t, sd, 6) });
  plainText(c, ['NO MEMORY LEAVES THIS BUILDING', 'LEVEL 4 / SEALED STACKS', 'MEMORY IS A SERVICE'][Math.floor(hash(sd * 4.1) * 3)], x + W / 2, GROUND - 6, { color: '#c9b89a', size: 6.4, align: 'center' });
  tubeRect(c, x + 2, GROUND - 32, W - 4, 30, hue, { flick: flicker(t, sd, 7), width: 1.3 });
}
function relayFront(c, p, t) {
  const { x, W, sd } = p, hue = '#57e6dd';
  box(c, x, GROUND, W, PLINTH - GROUND + 14, '#1e2c33');
  for (let i = 0; i < 4; i++) {                                     // cable trays and conduit
    box(c, x, GROUND + 30 + i * 22, W, 6, '#2c3c44');
    for (let k = 0; k < 3; k++) box(c, x + 4 + k * 3, GROUND + 30 + i * 22, 2, 6, ['#c9564a', '#4a9ac9', '#c9c956'][k]);
    for (let px = x + 20; px < x + W; px += 42) box(c, px, GROUND + 26 + i * 22, 3, 8, '#3d4f58');
  }
  for (let i = 0; i < 2; i++) {                                     // generator + cable spools
    const gx = x + 14 + i * (W * .44);
    box(c, gx, GROUND + 84, 52, 40, '#3a4a52'); box(c, gx + 4, GROUND + 88, 44, 12, '#1c262c');
    for (let k = 0; k < 4; k++) box(c, gx + 6 + k * 10, GROUND + 92, 6, 6, hash(sd + k) > .5 ? '#8fe0d8' : '#26343c');
    ventGrate(c, gx + 4, GROUND + 104, 44, 16, t, { sd: sd + i, steam: true });
    ring(c, gx + 66, GROUND + 104, 16, '#2a3a42', 5); ring(c, gx + 66, GROUND + 104, 8, '#1a262c', 3);
  }
  fenceMesh(c, x + W - 58, WALK, 58, 56, { col: '#3d4f58', barbed: true, sd });
  for (let i = 0; i < 3; i++) box(c, x + W - 50 + i * 14, GROUND + 44, 10, 40, '#2c3c44');
  occupant(c, x + W * .5, PLINTH - 2, .88, { t, sd: sd + 3, task: 'stand', col: '#0e1418', rim: '#8fe0d8aa' });
  neonText(c, 'SIGNAL RELAY / STAFF', x + W / 2, GROUND - 20, { color: hue, size: 10, align: 'center', alpha: .92, flick: flicker(t, sd, 5) });
  plainText(c, ['UPLINK 04 / DO NOT OBSTRUCT', 'RELAY HUB 07 / STAFF ONLY', 'SIGNAL WARD / NIGHT SHIFT'][Math.floor(hash(sd * 3.7) * 3)], x + W / 2, GROUND - 6, { color: '#a8ccd0', size: 7, align: 'center' });
  tubeRect(c, x + 2, GROUND - 32, W - 4, 30, hue, { flick: flicker(t, sd, 6), width: 1.4 });
  pool(c, x + W / 2, GROUND + 60, W * .6, hue, .07, true);
}
function executiveFront(c, p, t) {
  const { x, W, sd } = p, hue = '#a8e2ee';
  box(c, x, GROUND, W, PLINTH - GROUND + 14, '#dfe9ec');           // bright plaza frontage
  for (let i = 0; i < W / 30; i++) box(c, x + i * 30, GROUND, 1.4, PLINTH - GROUND, '#b6c6cc');
  box(c, x + 10, GROUND + 44, W * .44, 70, '#20313a');             // private lobby glazing
  box(c, x + 12, GROUND + 46, W * .44 - 4, 66, '#7fa8b4');
  wash(c, x + 12, GROUND + 46, W * .44 - 4, 66, [[0, '#eaf6f8cc'], [1, '#5f8894']]);
  glassSheen(c, x + 12, GROUND + 46, W * .44 - 4, 66, sd + x, .2);
  box(c, x + 12, GROUND + 46, W * .44 - 4, 3, '#cfe0e4');
  occupant(c, x + W * .3, GROUND + 108, .92, { t, sd: sd + 1, task: 'stand', col: '#1a2a32', rim: '#ffffff88' });
  box(c, x + W * .5 + 6, GROUND + 40, 40, 78, '#2a3f48');         // card reader pillar
  box(c, x + W * .5 + 10, GROUND + 46, 32, 26, '#0e1c24'); box(c, x + W * .5 + 13, GROUND + 49, 26, 20, '#8fd6e6');
  for (let i = 0; i < 4; i++) box(c, x + W * .5 + 14, GROUND + 52 + i * 4, 10 + hash(sd + i) * 12, 2, '#1a3a44');
  for (let i = 0; i < 4; i++) bollard(c, x + W * .72 + i * 22, WALK, { color: '#dfe9ec', h: 24 });
  for (let i = 0; i < 5; i++) planterBox(c, x + 6 + i * 20, WALK - 2, { w: 16, seed: sd + i });
  neonText(c, 'HELIX / PRIVATE', x + W / 2, GROUND - 20, { color: hue, size: 10, align: 'center', alpha: .95, flick: flicker(t, sd, 6) });
  plainText(c, ['RESIDENTS / CONCIERGE 24H', 'HALO TOWERS / LEVEL 6', 'INVITATIONS ONLY'][Math.floor(hash(sd * 4.7) * 3)], x + W / 2, GROUND - 6, { color: '#e6f2f4', size: 7, align: 'center' });
  tubeRect(c, x + 2, GROUND - 32, W - 4, 30, hue, { flick: flicker(t, sd, 6), width: 1.4 });
  pool(c, x + W * .3, GROUND + 90, W * .7, '#e8f4f6', .12);
}
const BASE_FRONT = { garrison: garrisonFront, foundry: foundryFront, club: clubFront, coop: coopFront, fortress: fortressFront, relay: relayFront, executive: executiveFront };

/* ---------------------------------------------------------------- facade */
const KIND_W = { double: [30, 44], bay: [42, 58], arch: [30, 40], slot: [14, 20], picture: [46, 64], stack: [34, 50], board: [26, 40], blank: [26, 44] };
const LIT_BY = { street: .55, relay: .3, garrison: .18, fortress: .12, club: .7, coop: .78, foundry: .45, executive: .86 };
function baysFor(p, f) {
  const out = [], right = p.x + p.W - 11;
  let cx = p.x + 11, guard = 0;
  while (cx < right - 16 && guard++ < 12) {
    const n = hash(p.sd + f * 41 + cx * .073);
    let kind;
    if (p.flavor === 'garrison' || p.flavor === 'fortress') kind = n > .5 ? 'slot' : n > .28 ? 'double' : 'blank';
    else if (p.flavor === 'executive') kind = n > .34 ? 'picture' : n > .16 ? 'stack' : 'blank';
    else if (p.flavor === 'foundry' || p.flavor === 'relay') kind = n > .46 ? 'stack' : n > .3 ? 'double' : n > .18 ? 'board' : 'blank';
    else if (p.flavor === 'club' || p.flavor === 'coop') kind = n > .5 ? 'bay' : n > .28 ? 'double' : n > .12 ? 'arch' : 'blank';
    else kind = n > .48 ? 'double' : n > .32 ? 'bay' : n > .2 ? 'picture' : n > .1 ? 'arch' : n > .04 ? 'board' : 'blank';
    if (p.flavor === 'street' && f === p.floors - 1 && hash(p.sd + cx * .31) > .74) kind = 'bay';
    const [lo, hi] = KIND_W[kind];
    let bw = lo + Math.floor(hash(p.sd + cx * .11 + f) * (hi - lo + 1));
    if (cx + bw > right) bw = right - cx;
    if (bw < 15) { out.push({ kind: 'blank', x: cx, w: Math.max(10, right - cx), n }); break; }
    const lit = hash(p.sd + f * 7 + cx * .19) < (LIT_BY[p.flavor] || .55);
    out.push({ kind, x: cx, w: bw, n, lit, sd: Math.floor(hash(p.sd + cx * .53) * 900) + 1 });
    cx += bw + 5 + Math.floor(hash(p.sd + cx * .17 + f * 3) * 8);
  }
  return out;
}
const TASKS = ['', 'cup', 'phone', 'reach', 'radio', 'stand', 'stand'];
function facade(c, p, t) {
  const { x, W, sd, pal, flavor } = p;
  const top = GROUND - p.floors * p.fh;
  if (p.backdrop) backdropTower(c, x + p.backdropX, top - 20, p.backdropW, p.backdropH, pal, sd + 3, t);
  masonry(c, x - 2, top, W + 4, GROUND - top, { variant: p.material, wall: pal.wall, brick: pal.brick, sd, grime: p.grime });
  // corner quoins and floor string courses give the block masonry scale
  if (p.material === 'brick' || p.material === 'panel' || p.material === 'tile') {
    quoins(c, x - 2, top + 6, GROUND - top - 10, { step: 17, w: 13, col: tone(pal.trim, .74), sd });
    quoins(c, x + W - 12, top + 6, GROUND - top - 10, { step: 17, w: 13, col: tone(pal.trim, .74), sd });
  }
  for (let f = 0; f < p.floors; f++) stringCourse(c, x - 2, GROUND - (f + 1) * p.fh, W + 4, { top: tone(pal.trim, .78), body: tone(pal.wall, .8), under: '#0b1016' });
  for (let f = 0; f < p.floors; f++) {
    const fy = top + f * p.fh;
    if (f === 1 && p.ghost) ghostSign(c, x + 16, fy + 20, W - 32, 52, p.ghost, '#d8c39a', sd + f);
    for (const b of baysFor(p, f)) {
      // A few pixels of jitter keeps a whole floor from reading as one hard band.
      const wy = fy + 26 + (hash(b.sd * .21) > .62 ? 3 : hash(b.sd * .13) > .5 ? -3 : 0), wh = p.fh - 46;
      if (b.kind === 'blank') {
        if (hash(b.sd) > .5) { ventStacks(c, b.x + b.w / 2, wy + 8, 1, b.sd, t, false); }
        else { box(c, b.x, wy + 6, b.w, wh, '#00000018'); drainpipe(c, b.x + b.w / 2 - 3, wy, wh + 10, { col: p.pipeCol }); }
        continue;
      }
      const o = { t, sd: b.sd, lit: b.lit, kind: b.kind, warm: pal.warm, cold: pal.cold, ac: !b.lit && hash(b.sd + 2) > .74, boards: b.kind === 'board', shut: b.kind === 'double' && hash(b.sd + 4) > .78 };
      if (b.lit) o.occupantKind = TASKS[Math.floor(hash(b.sd + 5) * TASKS.length)];
      if (b.kind === 'picture' && b.lit && hash(b.sd + 6) > .55) { o.curtain = true; o.tv = hash(b.sd + 7) > .5; }
      if (b.kind === 'bay' && b.lit && hash(b.sd + 8) > .5) o.plant = true;
      if (b.kind === 'double' && b.lit && hash(b.sd + 9) > .82) o.plant = true;
      windowUnit(c, b.x, wy, b.w, wh, o);
    }
    // balconies, fire escapes and laundry break the grid
    const topFloor = f === p.floors - 1;
    if (p.balcony[f] && !topFloor) balcony(c, x + 14 + hash(p.sd + f) * (W - 90), GROUND - (f + 1) * p.fh + 2, 62 + hash(p.sd + f * 2) * 46, { pal, t, sd: sd + f, occupantKind: hash(p.sd + f * 3) > .62 ? 'cup' : '' });
    if (p.escape[f]) fireEscape(c, x + W - 58, GROUND - (f + 1) * p.fh + (topFloor ? 20 : 4), 48, p.fh * (topFloor ? .92 : 1.02), { t, sd: sd + f });
    if (hash(p.sd + f * 11) > .68) laundryLine(c, x + 8, x + W - 8, GROUND - (f + 1) * p.fh + 8, { t, sd: sd + f * 5, count: 4, warm: p.flavor === 'coop' });
  }
  // service kit: drainpipes, cables, aerials, satellite cluster
  drainpipe(c, x + 4, top + 4, GROUND - top - 6, { col: p.pipeCol });
  drainpipe(c, x + W - 11, top + 4, GROUND - top - 6, { col: p.pipeCol, head: false });
  for (let k = 0; k < 3; k++) cableRun(c, x + 2, top + 30 + k * 9, x + W + 12, top + 24 + k * 9, 14 + k * 6, { col: '#0b1218', w: 1.4, lit: k === 1 });
  if (hash(sd + 21) > .5) { dishSat(c, x + W * .3, top + 14, 11 + hash(sd) * 6, { t }); dishSat(c, x + W * .38, top + 18, 8, { t, col: '#33444a' }); }
  if (hash(sd + 23) > .58) antennaMast(c, x + W * .7, top + 8, 40 + hash(sd + 5) * 40, { t, blink: '#ff5470', rate: .8 + hash(sd) });
  if (p.relay) { for (let i = 0; i < 3; i++) dishSat(c, x + 20 + i * 40, top + 12, 13 + i * 2, { t, col: '#2f4048' }); antennaMast(c, x + W * .5, top + 10, 74, { t, blink: '#57e6dd', rate: 1.2 }); }
  if (p.holo) holoPanel(c, x + W * .28, top + 46, 54, 74, p.pal.accent, t, { sd });
  if (p.signTower) {
    bladeSign(c, x - 6, GROUND - 60 - p.signTower * 84, 40, p.signTower * 84, { color: p.hue, t, sd: sd + 4, word: p.signTowerWord, glyph: true, swing: 0 });
  }
  cornice(c, x - 4, top - 20, W + 8, 7, tone(pal.trim, .5));
  rooftopKit(c, x - 2, top, W + 4, { sd, pal, roofKind: p.roofKind, drop: p.drop }, t);
}

/* -------------------------------------------------------- street surface */
function surface(c, p, t) {
  const { x, W, sd, hue, pal } = p;
  // wet threshold, kerb highlight, drain and the reflection of the frontage
  box(c, x - 8, KERB, W + 16, WALK - KERB + 1, '#131c24');
  wash(c, x - 8, KERB, W + 16, WALK - KERB, [[0, '#243239'], [1, '#0a1016']]);
  box(c, x - 8, KERB, W + 16, 2, '#54646c');
  for (let px = x; px < x + W; px += 44) box(c, px, KERB + 2, 1.4, WALK - KERB - 2, '#00000040');
  drainGrate(c, x + W * .12, KERB - 1, 26, 9);
  manhole(c, x + W * .78, WALK - 2, 10);
  wetSmear(c, x + 8, W - 16, KERB, 26, hue, t, sd, .16);
  puddle(c, x + W * .3, WALK - 3, 54, 7, hue + '55', t, sd + 1, .3);
  puddle(c, x + W * .72, WALK - 2, 38, 6, pal.accent + '44', t, sd + 2, .22);
  c.globalAlpha = .2;
  for (let i = 0; i < 5; i++) {
    const px = x + 10 + hash(sd + i * 3.1) * (W - 20), p2 = (t * .8 + hash(sd + i)) % 1;
    ring(c, px, WALK - 3, 3 + p2 * 7, '#bfe6f0', .8);
  }
  c.globalAlpha = 1;
  if (p.puddleSplash) for (let i = 0; i < 6; i++) { const p2 = (t * 1.4 + i * .17) % 1; ring(c, x + 20 + i * 40, KERB + 2, 2 + p2 * 8, '#cfe8f0', .8); }
}
function alley(c, p, t, visible) {
  const { x, W, sd, hue, pal } = p;
  const ax = x + W + 4, aw = PITCH - W - 12;
  if (!visible({ x: ax, y: GROUND - 120, w: aw, h: 340 })) return;
  if (p.owned) {
    // boundary between a restricted base and the public street
    box(c, ax, GROUND, aw, PLINTH - GROUND + 14, '#20282e');
    fenceMesh(c, ax + 6, WALK, aw - 12, 66, { col: '#3d4a52', barbed: true, sd });
    box(c, ax + 6, GROUND + 20, aw - 12, 40, '#1a2228');
    neonText(c, p.boundaryWord || 'KEEP OUT', ax + aw / 2, GROUND + 44, { color: '#ff8a7a', size: 9, align: 'center', alpha: .85, flick: flicker(t, sd, 4) });
    barrierProp(c, ax + 4, WALK, Math.max(20, aw - 16), { color: '#d8a23c' });
    return;
  }
  alleyMouth(c, ax, GROUND + 10, aw, PLINTH - GROUND + 4, { t, sd, color: hue });
  // kerbside dressing: pole, bin, crates, bench, drain, planter
  const k = hash(sd + .5);
  if (k > .3) pavementLamp(c, ax + 16, WALK, { t, sd, color: pal.warm, h: 128 + hash(sd) * 16 });
  if (hash(sd + 1) > .35) litterBin(c, ax + 62, WALK, { color: pal.accent });
  if (hash(sd + 2) > .55) crateStack(c, ax + 88, WALK, 2 + (hash(sd + 3) * 2 | 0), { sd });
  if (hash(sd + 4) > .62) benchProp(c, ax + 106, WALK, { col: pal.trim });
  if (hash(sd + 5) > .7) planterBox(c, ax + 34, WALK, { w: 26, seed: sd });
  if (hash(sd + 6) > .66) ventGrate(c, ax + 118, GROUND + 70, 40, 30, t, { sd, steam: true });
  if (hash(sd + 7) > .78) exteriorStairs(c, ax + 74, GROUND + PLINTH - GROUND, { steps: 4, rise: 10, run: 9, dir: 1, col: '#33414a' });
  cableRun(c, ax - 4, GROUND - 6, ax + aw + 10, GROUND - 12, 12, { col: '#0b1218', w: 1.4 });
  for (let i = 0; i < 2; i++) seg(c, ax + 4 + i * aw * .5, GROUND + 4, ax + 4 + i * aw * .5, GROUND + 120, '#1a242c', 2);
}
function parking(c, p, t, visible) {
  const { x, W, sd, flavor } = p;
  const vx = x + W + 30;
  if (!visible({ x: vx, y: WALK - 70, w: 160, h: 80 })) return;
  const k = hash(sd + 9);
  const kind = flavor === 'foundry' ? 'barrow' : flavor === 'executive' ? 'van' : flavor === 'garrison' || flavor === 'relay' ? 'loader' : k > .62 ? 'taxi' : k > .3 ? 'van' : 'barrow';
  const body = flavor === 'executive' ? '#d8e4e6' : flavor === 'garrison' ? '#3f4c56' : flavor === 'foundry' ? '#5a4636' : p.pal.trim;
  vehicle(c, x + W + 8, KERB, { kind, t, sd, body, lit: p.pal.warm, glass: '#17313e' });
}
function backgroundCrowd(c, p, t) {
  // Two or three people wait further down the pavement, adding scale and life.
  const { x, W, sd, pal } = p;
  for (let i = 0; i < 3; i++) {
    const n = hash(sd + i * 5.1);
    const px = x + 12 + n * (W - 24), walk = n > .55 ? 1 : 0;
    const px2 = px + Math.sin(t * .38 + sd + i * 2) * 7 * walk;
    crowdFigure(c, px2, KERB - 2, .9 + n * .18, { t, sd: sd + i, walk, col: '#0b1017', rim: pal.warm + '55', coat: 5 + n * 3 });
  }
  if (hash(sd + 33) > .55) parasolTable(c, x + W * .5 + hash(sd) * 40, WALK, { color: hash(sd) > .5 ? '#b0405a' : '#3a6a8a', t, sd });
  if (hash(sd + 34) > .6) aBoard(c, x + W * .2, WALK, { word: p.boardWord || 'OPEN', t, sd });
  if (hash(sd + 35) > .72) bicycle(c, x + W * .78, WALK, { sd });
  if (hash(sd + 36) > .74) dumpster(c, x + W - 34, WALK, { sd, col: p.flavor === 'foundry' ? '#4a3a2a' : '#2c4440' });
  if (hash(sd + 37) > .8) utilityBox(c, x + 6, WALK, { color: pal.accent, label: 'GRID / 04', sd });
}

/* ------------------------------------------------------------------ plan */
function planFront(x, zi, i, W0) {
  const site = siteFor(x);
  const sd = Math.floor(hash(x * .0173 + zi * 13.7) * 9973) + 7;
  const flavor = site ? site.flavor : 'street';
  const basePal = FLAVOR_PAL[flavor] || palFor(zi);
  // Each address gets its own value and accent so a terrace never reads as one wall.
  const kv = .8 + hash(sd * 2.9) * .42, ka = .82 + hash(sd * 3.7) * .38;
  const pal = { ...basePal, wall: tone(basePal.wall, kv), brick: tone(basePal.brick, kv * (1 + (hash(sd * 5.3) - .5) * .2)), trim: tone(basePal.trim, kv), accent: tone(basePal.accent, ka), warm: tone(basePal.warm, .9 + hash(sd * 7.1) * .2) };
  const W = W0 || (248 + Math.floor(hash(sd * .7) * 3) * 24);
  const floors = 2 + Math.floor(hash(sd * 1.3) * 3) + (flavor === 'executive' ? 2 : flavor === 'garrison' || flavor === 'fortress' ? 1 : 0);
  const fh = 80 + Math.floor(hash(sd * 2.1) * 3) * 6;
  const biz = bizFor(flavor, sd);
  const hue = biz.hue;
  const owned = !!(site && site.atStreet && x + W / 2 >= site.base.x - 30 && x + W / 2 <= site.base.x + site.base.w + 30);
  const materials = { street: ['brick', 'brick', 'panel', 'render', 'tile'], relay: ['panel', 'corrugated', 'panel'], garrison: ['buttress', 'buttress', 'panel'], fortress: ['buttress', 'render'], club: ['brick', 'render', 'lath'], coop: ['brick', 'render', 'panel'], foundry: ['corrugated', 'lath', 'panel'], executive: ['tile', 'panel', 'tile'] }[flavor];
  const p = {
    x, W, sd, zi, i, pal, flavor, site, biz, hue, owned, floors, fh,
    material: materials[Math.floor(hash(sd * 3.3) * materials.length)],
    pipeCol: hash(sd * 5.1) > .5 ? '#2b3a42' : '#3a2c22',
    grime: .4 + hash(sd * 7.7) * .5,
    roofKind: ['flat', 'crenel', 'stepped', 'tiled'][Math.floor(hash(sd * 11.3) * 4)],
    ghost: hash(sd * 13.7) > .62 ? ['SOUP', 'HOTEL', 'COLD BEER', 'LOTUS 24', 'REPAIR', 'CLINIC', 'RAMEN'][Math.floor(hash(sd * 17.1) * 7)] : null,
    balcony: [], escape: [], relay: flavor === 'relay' || (site && !site.atStreet && hash(sd + 2) > .5), holo: hash(sd * 19.1) > .7,
    backdrop: hash(sd * 23.3) > .45, backdropX: (hash(sd * 29.7) - .5) * 90, backdropW: 90 + hash(sd * 31.1) * 90, backdropH: 150 + hash(sd * 37.3) * 260,
    drop: hash(sd * 41.7) > .5, awning: hash(sd * 43.9) > .42, awningCol: ['#7a2a3a', '#2a4a5a', '#3a5a2a', '#5a3a2a'][Math.floor(hash(sd * 47.3) * 4)],
    blade: hash(sd * 53.1) > .35 ? 1 + Math.floor(hash(sd * 59.3) * 2) : 0,
    bladeWord: ['RAMEN', 'CLINIC', 'WASH', 'PARTS', 'MUSIC', 'MART', 'HOME', 'TEA', 'REPAIR', 'BATHS', 'CANTEEN'][Math.floor(hash(sd * 61.7) * 11)],
    script: hash(sd * 67.9) > .66 ? ['24H', 'OPEN', 'CASH', 'NO CREDIT', 'WALK IN'][Math.floor(hash(sd * 71.3) * 5)] : null,
    signTower: hash(sd * 73.7) > .78 ? 2 + Math.floor(hash(sd * 79.1) * 2) : 0,
    signTowerWord: ['NOODLE', 'OPEN', 'CLINIC', 'LOTUS', 'HELIX', 'RADIO'][Math.floor(hash(sd * 83.3) * 6)],
    address: 101 + zi * 100 + i * 2, openWord: 'OPEN',
    boardWord: ['SOUP', '24H', 'REPAIR', 'TEA', 'WASH'][Math.floor(hash(sd * 89.7) * 5)],
    boundaryWord: ['KEEP OUT', 'NO ENTRY', 'RESTRICTED'][Math.floor(hash(sd * 97.3) * 3)],
    puddleSplash: hash(sd * 101.9) > .5
  };
  for (let f = 0; f < floors; f++) {
    p.balcony[f] = (flavor === 'coop' || flavor === 'club' || flavor === 'street') && hash(sd + f * 3.7) > .42;
    p.escape[f] = (flavor === 'garrison' || flavor === 'foundry' || flavor === 'fortress') ? hash(sd + f * 5.3) > .5 : hash(sd + f * 5.3) > .84;
  }
  return p;
}

/* ------------------------------------------------------------ drawStreet */
export function drawStreet(c, game, visible) {
  const t = game.time || 0;
  for (const [zi, z] of game.world.zones.entries()) {
    const pal = palFor(zi);
    for (let i = 0; i < Math.floor(z.w / PITCH); i++) {
      const x = z.x + 60 + i * PITCH;
      const top = GROUND - 4 * 96;
      if (!visible({ x: x - 40, y: top, w: 460, h: GROUND - top + 60 })) continue;
      const p = planFront(x, zi, i, null);
      const topY = GROUND - p.floors * p.fh - 30;
      if (!visible({ x: x - 40, y: topY, w: 460, h: GROUND - topY + 60 })) continue;
      facade(c, p, t);
      (p.owned && BASE_FRONT[p.flavor] ? BASE_FRONT[p.flavor] : shopFront)(c, p, t);
      surface(c, p, t);
      backgroundCrowd(c, p, t);
      parking(c, p, t, visible);
      alley(c, p, t, visible);
      // a lit district marker every few addresses
      if (i % 4 === 1) {
        box(c, x - 26, WALK - 62, 5, 62, '#33424a');
        box(c, x - 26, WALK - 78, 74, 22, '#16232b');
        plainText(c, z.name, x - 22, WALK - 68, { color: '#a7c8bb', size: 8 });
        box(c, x - 26, WALK - 58, 74, 3, pal.accent + '77');
      }
    }
  }
}
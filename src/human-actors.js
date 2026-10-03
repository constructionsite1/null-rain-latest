// Procedural human art: rigged joint chains, layered tactical garments, state-driven animation.
// Original artwork. No assets, no DOM, no dependencies, no writes to simulation objects.
import { K, NCH, frameOf, rigMemory, solvePose, solveJoints, makeJoints, isDown } from './character-rig.js';
import * as spriteArt from './sprite-actors.js';

const SKIN = ['#f3cca6', '#e5ae81', '#cb8c60', '#a76944', '#7e4b31', '#5d3727'];
const SHADE = ['#d3a67e', '#c28e65', '#a87049', '#885331', '#653922', '#462619'];
const HAIR = ['#1d1712', '#2f231a', '#5a3d26', '#7d5c34', '#b8a184', '#4e5464', '#8e3430', '#cfd4da'];
const CIVT = ['#7d6553', '#55707a', '#6f5a6e', '#63714f', '#8a6555', '#5f6570', '#7f7355', '#655343'];
const CIVP = ['#33373d', '#3f3934', '#343a42', '#3f3b34', '#3a443e'];
const CIVACC = ['#b9a37a', '#8fb0a8', '#a8929f', '#93a074', '#c0a184', '#8f9aa6', '#b3a377', '#9c8a72'];
const EDGE = '#08111a';

// Static identity per build. Per-actor fields are copied into a scratch record each draw.
const KITS = {
  blade: {
    label: 'Chronoblade', frame: 'hero', style: 'topknot', rig: 'blade',
    cloth: '#1d242b', cloth2: '#2c353e', plate: '#3a444e', dark: '#131920',
    accent: '#8cff4a', hot: '#e8ffd2', metal: '#68757e', steel: '#9aa7b0', strap: '#463a2c',
    tone: 0, hair: 3, sensor: 0, hip: 'saya', pauldron: 7, coatBack: 1, coatFront: 1,
    coatLen: 12, coatW: 4.4, scarf: '#33402f', pouch: 0, spinal: 1, legs: 2.25, arms: 2.2, boots: 1
  },
  ghost: {
    label: 'Netrunner', frame: 'hero', style: 'cowl', rig: 'vest',
    cloth: '#2a2642', cloth2: '#39325a', plate: '#463f6b', dark: '#151324',
    accent: '#c398ff', hot: '#f2e6ff', metal: '#585277', steel: '#8b86ad', strap: '#332e4c',
    tone: 1, hair: 0, sensor: 0, hip: 0, pauldron: 0, coatBack: 1, coatFront: 0,
    coatLen: 10, coatW: 4, scarf: '#3a2f57', pouch: 1, spinal: 0, legs: 2.2, arms: 2.15, boots: 1
  },
  tank: {
    label: 'Breaker', frame: 'wide', style: 'goggles', rig: 'plate',
    cloth: '#4c3f2c', cloth2: '#6b583c', plate: '#7f6c4d', dark: '#2a2318',
    accent: '#ffb04a', hot: '#ffe8c2', metal: '#8b7b5e', steel: '#b5a688', strap: '#3c301f',
    tone: 2, hair: 1, sensor: 0, hip: 0, pauldron: 8.6, coatBack: 0, coatFront: 0,
    coatLen: 8, coatW: 5.4, scarf: 0, pouch: 1, spinal: 0, legs: 2.85, arms: 2.8, boots: 1.25
  },
  gun: {
    label: 'Gunslinger', frame: 'hero', style: 'brim', rig: 'coat',
    cloth: '#4e2831', cloth2: '#6d3a44', plate: '#7f4b53', dark: '#231217',
    accent: '#e0ac5e', hot: '#ffe9c0', metal: '#6d7480', steel: '#a3adb6', strap: '#33221d',
    tone: 3, hair: 6, sensor: 0, hip: 'holster', pauldron: 0, coatBack: 1, coatFront: 1,
    coatLen: 13.5, coatW: 4.6, scarf: 0, pouch: 1, spinal: 0, legs: 2.3, arms: 2.2, boots: 1
  },
  guard: {
    label: 'Helix guard', frame: 'hero', style: 'helm', rig: 'armor',
    cloth: '#1e2732', cloth2: '#2c3846', plate: '#38495b', dark: '#101720',
    accent: '#e05548', hot: '#ffbcae', metal: '#5f707d', steel: '#8fa2ae', strap: '#2a2f36',
    tone: 3, hair: 1, sensor: '#ff5b46', hip: 0, pauldron: 0, coatBack: 0, coatFront: 0,
    coatLen: 8, coatW: 4.2, scarf: 0, pouch: 1, spinal: 0, legs: 2.4, arms: 2.3, boots: 1.1
  },
  heavy: {
    label: 'Helix heavy', frame: 'wide', style: 'helm', rig: 'armor',
    cloth: '#232b33', cloth2: '#343e48', plate: '#46535f', dark: '#131920',
    accent: '#ff8a5c', hot: '#ffd9be', metal: '#6d7a86', steel: '#9fadba', strap: '#2c3138',
    tone: 4, hair: 0, sensor: '#ff6a44', hip: 0, pauldron: 7.6, coatBack: 0, coatFront: 0,
    coatLen: 8, coatW: 5.8, scarf: 0, pouch: 1, spinal: 0, legs: 2.95, arms: 2.95, boots: 1.45
  },
  sniper: {
    label: 'Helix sniper', frame: 'hero', style: 'hoodlong', rig: 'armor',
    cloth: '#3d4436', cloth2: '#535c47', plate: '#616c54', dark: '#1b1f17',
    accent: '#c3d69a', hot: '#ecf7d6', metal: '#6a7561', steel: '#a3b096', strap: '#2b3126',
    tone: 2, hair: 3, sensor: '#ff6a44', hip: 0, pauldron: 0, coatBack: 1, coatFront: 0,
    coatLen: 14, coatW: 4.6, scarf: 0, pouch: 1, spinal: 0, legs: 2.3, arms: 2.2, boots: 1
  },
  gang: {
    label: 'Street crew', frame: 'civ', style: 'patch', rig: 'vest',
    cloth: '#39333f', cloth2: '#4b4453', plate: '#585163', dark: '#1a1720',
    accent: '#d8cfb4', hot: '#f7f0da', metal: '#5f5a68', steel: '#918c9c', strap: '#33291f',
    tone: 1, hair: 5, sensor: 0, hip: 0, pauldron: 0, coatBack: 0, coatFront: 0,
    coatLen: 9, coatW: 4, scarf: 0, pouch: 1, spinal: 0, legs: 2.2, arms: 2.15, boots: 1
  }
};
const CIVKIT = {
  label: 'Resident', frame: 'civ', style: 'civ', rig: 'plain',
  cloth: '#4a4640', cloth2: '#5d584f', plate: '#6a6459', dark: '#1d1c1a',
  accent: '#b9a37a', hot: '#f0e6cf', metal: '#6f6a60', steel: '#9d978a', strap: '#3a2f24',
  tone: 0, hair: 0, sensor: 0, hip: 0, pauldron: 0, coatBack: 0, coatFront: 0,
  coatLen: 9, coatW: 3.6, scarf: 0, pouch: 0, spinal: 0, legs: 2.05, arms: 2.05, boots: 1
};

// ------------------------------------------------------------------ primitives
function seed(e, s) {
  const k = typeof e.id === 'string' ? e.id : (e.homeX !== undefined ? e.homeX : (e.x || 0));
  let id = 0;
  if (typeof k === 'string') for (let i = 0; i < k.length; i++) id = Math.imul(id ^ k.charCodeAt(i), 16777619);
  else id = Math.round(k * 13);
  let n = Math.imul((id + (s || 0) * 7919) | 0, 2654435761);
  n ^= n >>> 13; n = Math.imul(n, 0x27d4eb2d);
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
}
function poly(c, p, f, e, w) {
  c.beginPath();
  for (let i = 0; i < p.length; i++) i ? c.lineTo(p[i][0], p[i][1]) : c.moveTo(p[i][0], p[i][1]);
  c.closePath();
  if (f) { c.fillStyle = f; c.fill(); }
  if (e) { c.strokeStyle = e; c.lineWidth = w || .8; c.stroke(); }
}
function seg(c, a, b, w, col) {
  c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
}
function bar(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function ring(c, x, y, r, col, w) {
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.stroke();
}
function dot(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); }
function grad(c, x0, y0, x1, y1, a, b) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, a); g.addColorStop(1, b); return g;
}
function taper(c, a, b, wa, wb, col, ed) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const ex = dx / l, ey = dy / l, nx = -dy / l, ny = dx / l;
  c.beginPath();
  c.moveTo(a[0] + nx * wa, a[1] + ny * wa); c.lineTo(b[0] + nx * wb, b[1] + ny * wb);
  c.quadraticCurveTo(b[0] + ex * wb * 1.7, b[1] + ey * wb * 1.7, b[0] - nx * wb, b[1] - ny * wb);
  c.lineTo(a[0] - nx * wa, a[1] - ny * wa);
  c.quadraticCurveTo(a[0] - ex * wa * 1.7, a[1] - ey * wa * 1.7, a[0] + nx * wa, a[1] + ny * wa);
  c.closePath();
  c.fillStyle = col; c.fill();
  if (ed) { c.strokeStyle = ed; c.lineWidth = .7; c.stroke(); }
}
function glow(c, blur, col, fn) {
  c.save(); c.shadowColor = col; c.shadowBlur = blur; fn(); c.restore();
}
function ribbon(c, x0, y0, x1, y1, w0, w1, col, ed, bend) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  c.beginPath();
  c.moveTo(x0 + nx * w0, y0 + ny * w0);
  c.quadraticCurveTo((x0 + x1) / 2 + nx * (w0 + w1) * .6 + bend, (y0 + y1) / 2 + ny * (w0 + w1) * .6, x1 + nx * w1, y1 + ny * w1);
  c.lineTo(x1 - nx * w1, y1 - ny * w1);
  c.quadraticCurveTo((x0 + x1) / 2 - nx * (w0 + w1) * .6 + bend, (y0 + y1) / 2 - ny * (w0 + w1) * .6, x0 - nx * w0, y0 - ny * w0);
  c.closePath();
  c.fillStyle = col; c.fill();
  if (ed) { c.strokeStyle = ed; c.lineWidth = .7; c.stroke(); }
}
const lerp2 = (a, b, k) => a + (b - a) * k;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

// ------------------------------------------------------------------ head
function skull(c, r, o, glint) {
  c.fillStyle = o.skin;
  c.beginPath(); c.ellipse(0, 0, r * .95, r * 1.04, 0, 0, 6.2832); c.fill();
  c.fillStyle = o.shade;
  c.beginPath(); c.ellipse(-r * .34, r * .22, r * .76, r * .76, 0, 0, 6.2832); c.fill();
  poly(c, [[r * .48, -r * .52], [r * 1.14, r * .16], [r * .48, r * .76], [r * .16, r * .5]], o.skin, EDGE, .6);
  poly(c, [[-r * .52, -r * .36], [r * .5, -r * .48], [r * .46, -r * .2], [-r * .52, -r * .1]], o.shade);
  bar(c, r * .14, -r * .16, r * .52, r * .22, '#140e11');
  bar(c, r * .18, -r * .34, r * .44, r * .16, glint);
  ring(c, -r * .48, r * .12, r * .26, o.shade, .7);
  bar(c, r * .06, r * .48, r * .36, r * .12, '#8d5a4c');
}
function hairTop(c, r, o, long) {
  poly(c, [[-r * 1.08, -r * .28], [-r * .84, -r * 1.3], [r * .3, -r * 1.54], [r * 1.02, -r * .72], [r * .86, -r * .28], [r * .2, -r * .5], [-r * .3, -r * .42]], o.hair, EDGE, .7);
  poly(c, [[-r * 1.0, -r * .34], [-r * .3, -r * .48], [r * .34, -r * .56], [r * .5, -r * .32], [-r * .2, -r * .28], [-r * .74, -r * .08]], o.hair2, null, 0);
  if (long) poly(c, [[-r * .98, -r * .48], [-r * .32, -r * .6], [-r * .5, r * 1.5], [-r * 1.12, r * 1.2]], o.hair, EDGE, .7);
}
function headgear(c, r, o) {
  const st = o.style;
  if (st === 'topknot') {
    hairTop(c, r, o, false);
    poly(c, [[-r * .84, -r * 1.1], [-r * 1.55, -r * 1.95], [-r * .18, -r * 2.05], [r * .36, -r * 1.24], [-r * .3, -r * .96]], o.hair, EDGE, .7);
    glow(c, 3, o.hot, () => seg(c, [-r * .12, -r * 1.9], [r * .14, -r * 2.06], 1, o.hot));
    poly(c, [[-r * 1.0, -r * .28], [-r * .52, -r * .64], [-r * .08, -r * .18], [-r * .64, r * .18]], o.accent, EDGE, .5);
    bar(c, r * .6, -r * 1.02, r * .52, r * .16, o.accent);
  } else if (st === 'cowl') {
    poly(c, [[-r * 2.0, -r * .1], [-r * 1.5, -r * 2.0], [r * .5, -r * 2.7], [r * 1.72, -r * 1.5], [r * 1.8, r * .9], [r * .5, r * 1.5], [-r * 1.3, r * 1.1]], o.cloth2, EDGE, .9);
    poly(c, [[-r * 1.3, -r * .6], [-r * .7, -r * 1.9], [r * .5, -r * 2.0], [r * 1.0, -r * 1.1], [r * .3, -r * .3], [-r * .9, -r * .3]], '#0c0f1e');
    poly(c, [[r * .9, -r * 1.0], [r * 1.34, -r * .58], [r * 1.2, r * .8], [r * .6, r * .9], [r * .5, -r * .2]], o.skin);
    glow(c, 3, o.accent, () => bar(c, -r * 1.1, -r * .8, r * 2.3, r * .5, o.accent));
    seg(c, [-r * 1.9, r * .3], [-r * 2.6, r * 2.5], 1.2, o.accent);
    seg(c, [-r * 2.6, r * 2.5], [-r * .6, r * 3.6], 1.2, o.accent);
  } else if (st === 'goggles') {
    hairTop(c, r, o, true);
    bar(c, -r * 1.5, -r * 1.1, r * 2.9, r * .5, '#33291c');
    c.fillStyle = '#d9b46a'; c.beginPath();
    c.arc(-r * .68, -r * 1.32, r * .58, 0, 6.2832); c.arc(r * .62, -r * 1.32, r * .58, 0, 6.2832); c.fill();
    ring(c, -r * .68, -r * 1.32, r * .58, '#241c12', .8); ring(c, r * .62, -r * 1.32, r * .58, '#241c12', .8);
    bar(c, r * .1, -r * 1.34, r * .5, r * .2, '#fff0c0');
    seg(c, [-r * 1.1, r * .5], [-r * 1.5, r * 1.5], 1, o.accent);
  } else if (st === 'brim') {
    poly(c, [[-r * 1.2, -r * .5], [-r * .9, -r * 1.9], [r * .7, -r * 1.9], [r * 1.05, -r * .55]], '#3d2a28', EDGE, .9);
    c.beginPath(); c.ellipse(r * .2, -r * .6, r * 2.1, r * .5, -.05, 0, 6.2832);
    c.fillStyle = '#4d3733'; c.fill(); c.strokeStyle = EDGE; c.lineWidth = .9; c.stroke();
    bar(c, -r * 1.1, -r * .95, r * 2, r * .36, '#241819');
    poly(c, [[-r * .8, -r * .6], [r * .8, -r * .7], [r * .6, r * .3], [-r * .7, r * .4]], o.hair, EDGE, .7);
    bar(c, -r * .2, -r * .3, r * 1.5, r * .2, o.accent);
  } else if (st === 'helm') {
    poly(c, [[-r * 1.16, -r * .3], [-r * 1.02, -r * 1.9], [r * .3, -r * 2.5], [r * 1.3, -r * 1.7], [r * 1.4, -r * .3]], o.plate, EDGE, .9);
    bar(c, -r * .9, -r * 1.7, r * 2.4, r * .3, o.metal);
    bar(c, -r * 1.1, -r * 1.05, r * 2.7, r * .34, o.dark);
    glow(c, 3, o.sensor, () => bar(c, r * .12, -r * 1.0, r * 1.05, r * .26, o.sensor));
    poly(c, [[-r * 1.3, r * .16], [-r * .6, r * .04], [-r * .66, r * 1.2], [-r * 1.24, r * 1.0]], o.metal, EDGE, .7);
    poly(c, [[r * .98, 0], [r * 1.5, -r * .1], [r * 1.4, r * .9], [r * 1.02, r * 1.0]], o.metal, EDGE, .7);
    seg(c, [-r * 1.05, -r * 2.2], [r * .5, -r * 2.45], 1, o.steel);
  } else if (st === 'hoodlong') {
    poly(c, [[-r * 2.0, -r * .1], [-r * 1.5, -r * 2.1], [r * .5, -r * 2.6], [r * 1.6, -r * 1.5], [r * 1.7, r * 1.0], [r * .3, r * 1.6], [-r * 1.2, r * 1.1]], o.cloth2, EDGE, .9);
    poly(c, [[-r * 1.2, -r * .7], [-r * .6, -r * 1.9], [r * .6, -r * 1.9], [r * 1.0, -r * .7], [r * .8, r * .6], [-r * .8, r * .6]], '#161a22');
    poly(c, [[-r * 1.2, r * .2], [r * .8, r * .1], [r * 1.0, r * 1.2], [-r * 1.0, r * 1.1]], o.cloth, EDGE, .8);
    glow(c, 3, o.accent, () => seg(c, [-r * .9, -r * .5], [r * .9, -r * .62], .9, o.accent));
  } else if (st === 'patch') {
    poly(c, [[-r * 1.06, -r * .3], [-r * .9, -r * 1.36], [r * .4, -r * 1.62], [r * 1.04, -r * .7], [r * .96, -r * .28], [r * .1, -r * .5], [-r * .6, -r * .36]], o.hair, EDGE, .7);
    bar(c, -r * 1.12, -r * .42, r * 2.2, r * .34, o.accent);
    poly(c, [[-r * 1.0, -r * .1], [-r * .2, -r * .46], [r * 1.2, -r * .2], [r * 1.16, r * .12], [-r * .96, r * .2]], o.accent, EDGE, .6);
    seg(c, [-r * .1, -r * .1], [r * .3, r * .5], .5, '#241c1a');
    seg(c, [-r * .3, r * .5], [r * .3, r * .34], .5, '#241c1a');
  } else hairTop(c, r, o, true);
}

// ------------------------------------------------------------------ weapons
function katana(c, o, lit) {
  poly(c, [[-11, -1.5], [-3.4, -1.9], [-3.4, 1.9], [-11, 1.5]], '#20262e', EDGE, .7);
  for (let i = 0; i < 4; i++) seg(c, [-10 + i * 1.7, -1.7], [-8.4 + i * 1.7, 1.7], .5, '#4b4238');
  c.fillStyle = o.metal; c.beginPath(); c.ellipse(-2.4, 0, 1.5, 3.3, 0, 0, 6.2832); c.fill();
  c.strokeStyle = EDGE; c.lineWidth = .7; c.stroke();
  c.beginPath();
  c.moveTo(0, -1.9); c.quadraticCurveTo(13, -2.6, 25, -1.1);
  c.lineTo(26.4, -.1); c.quadraticCurveTo(13, -.5, 0, 1.9);
  c.closePath();
  c.fillStyle = '#b9c8c4'; c.fill(); c.strokeStyle = EDGE; c.lineWidth = .6; c.stroke();
  c.fillStyle = '#f2fff2';
  c.beginPath(); c.moveTo(2, -.75); c.quadraticCurveTo(13, -1.15, 25.4, -.2); c.quadraticCurveTo(13, .3, 2, .75); c.closePath(); c.fill();
  glow(c, lit ? 6 : 3, o.accent, () => {
    c.beginPath(); c.moveTo(.4, -1.9); c.quadraticCurveTo(13, -2.6, 25, -1.1);
    c.strokeStyle = o.accent; c.lineWidth = lit ? 1.5 : 1.1; c.stroke();
    c.beginPath(); c.moveTo(1.4, 1.5); c.quadraticCurveTo(13, .25, 23.6, -.2);
    c.strokeStyle = o.hot; c.lineWidth = .7; c.stroke();
  });
}
function saya(c, o) {
  poly(c, [[-2.6, 0], [2.2, -.8], [3.4, 12], [-1.6, 12.8]], '#171d22', EDGE, .7);
  poly(c, [[-.8, .6], [2.2, -.2], [3, 10], [.4, 10.6]], '#2c343a');
  seg(c, [-1.4, 4.4], [2.6, 3.6], .8, o.accent);
  ring(c, [.2, 11.4], 1, o.metal, .8);
}
function pistol(c, o) {
  poly(c, [[-4.6, -2.2], [10.6, -2.4], [12, -.4], [11.4, 1.6], [-2.4, 1.8]], '#3f454d', EDGE, .8);
  bar(c, -3.4, -3.4, 13, 1.4, '#5c646d');
  bar(c, 9.6, -3.2, 3, 1.2, o.accent);
  poly(c, [[-2.2, 1.4], [-6.6, 2.2], [-7.4, 8.6], [-2.6, 7.6], [-1, 3.4]], '#4a2f24', EDGE, .8);
  for (let i = 0; i < 3; i++) seg(c, [-5.4 + i * .2, 3.4 + i * 1.5], [-2.6, 4 + i * 1.5], .5, '#2c1c16');
  poly(c, [[-1.6, 1.6], [-1.2, 5.4], [1.6, 5.2], [1.4, 1.6]], '#2b3138', EDGE, .6);
  ring(c, 3.2, -1.6, 1.9, '#8b939c', .9);
  dot(c, 3.2, -1.6, .8, o.hot);
  bar(c, 6.2, .4, 4.4, 1, o.metal);
}
function rifleArt(c, o, heavy, sniper) {
  poly(c, [[-10, -1], [-3, -2.4], [-1.4, .6], [-9.4, 3.2]], '#5a4030', EDGE, .8);
  bar(c, -4, -3.4, 15, 4.4, '#3e4750'); bar(c, -3.4, -3.4, 14, 1.2, '#616c76');
  bar(c, 10, -1.8, heavy ? 7 : 12, 2.6, '#78838d');
  bar(c, 15, -2.6, heavy ? 4 : 8, 1.4, '#222c35');
  poly(c, [[-1, 1], [-4.6, 2.2], [-6, 8.6], [-2, 8.6]], '#33302c', EDGE, .7);
  poly(c, [[3, 1], [8.4, 1], [6.8, 7.6], [2.4, 7.6]], '#2c343c', EDGE, .7);
  bar(c, -2, 4, 4.4, 1, o.accent);
  if (heavy) {
    poly(c, [[-6, -8.6], [1, -8.6], [3.4, -3], [-5, -2.2]], '#6b757c', EDGE, .9);
    bar(c, -4, -7.6, 5, 1, o.accent);
    bar(c, 1, -5.4, 9, 1.4, '#4d565e');
  } else {
    bar(c, 2, -5, 8, 1.6, '#2a333c');
    bar(c, 3, -6.4, 3, 2, '#4d5a63');
  }
  if (sniper) {
    poly(c, [[.6, -7.6], [10.6, -7.6], [10, -4], [1.2, -4]], '#2b3641', EDGE, .8);
    glow(c, 3, '#9fd8e4', () => seg(c, [2.2, -5.9], [9.6, -5.9], 1, '#9fd8e4'));
    poly(c, [[8, -9], [12.6, -9], [11.2, -5.2], [8, -5.2]], '#6f7a85', EDGE, .6);
  }
}
function cannonArt(c, o) {
  poly(c, [[1, -10.5], [16, -10.5], [18.6, 1], [16, 10.5], [3, 10.5], [.4, 0]], '#5f6a70', EDGE, 1.1);
  seg(c, [4, -8], [15.6, -8], 1.2, o.accent); seg(c, [4, 8], [15, 8], .9, '#3f4a50');
  bar(c, 7.6, -3.4, 4.4, 6.8, '#313d45'); ring(c, 9.8, 0, 2.6, '#8fa0a4', .9); dot(c, 9.8, 0, 1.2, o.hot);
  seg(c, [3, 9.4], [7.4, 15], 2.2, '#4a3b28');
  poly(c, [[-2, -2], [-8, .6], [-3, 3]], '#3b4750', EDGE, .7);
}
function emitter(c, o) {
  poly(c, [[-2, -3.4], [10, -3.4], [10, 3.4], [-2, 3.4]], o.cloth2, EDGE, .8);
  glow(c, 3, o.accent, () => seg(c, [1, -1.6], [8.4, -1.6], 1, o.accent));
  bar(c, 9.4, -2.8, 5, 5.6, '#5b5480');
  glow(c, 4, o.accent, () => dot(c, 12.4, 0, 1.6, o.accent));
  poly(c, [[-6, -1], [-11, .6], [-6, 2.6]], '#241f3a', EDGE, .7);
  for (let i = 0; i < 3; i++) seg(c, [-8 - i * 2.6, 1 + i * 1.4], [-13 - i * 2.2, 5.4 + i * 2.6], .9, o.accent);
}
function gauntlet(c, o) {
  poly(c, [[-3.4, -3.6], [4.4, -2.6], [5.6, 1.4], [2.6, 3.6], [-3.4, 2.4]], o.plate, EDGE, .8);
  bar(c, -1.6, -2.6, 5.4, 1.4, o.accent);
  for (let i = 0; i < 3; i++) dot(c, -.6 + i * 1.8, .8, .8, o.steel);
  seg(c, [-3.4, -.4], [-6.4, .6], 2.2, o.metal);
}

// ------------------------------------------------------------------ body parts
function limb(c, a, m, b, wa, wm, wb, colA, colB, ed, joint) {
  taper(c, a, m, wa, wm, colA, ed);
  taper(c, m, b, wm, wb, colB, ed);
  if (joint) dot(c, m[0], m[1], wm * .96, joint);
}
function bootArt(c, ax, ay, ang, fr, o, big) {
  c.save(); c.translate(ax, ay); c.rotate(-ang);
  const hl = fr.toe, tl = fr.foot, so = fr.ankle;
  poly(c, [[-hl - .7, -2.7], [tl * .5, -3], [tl * .94, -.6], [tl + .6, so * .3], [-hl - .5, so * .3]],
    big ? o.plate : o.dark, EDGE, .8);
  poly(c, [[-hl - .8, so * .2], [tl + .8, so * .2], [tl + .4, so + 1.2], [-hl - .6, so + 1.2]], '#0b131a', EDGE, .7);
  poly(c, [[tl * .42, -2.5], [tl + .4, -1.7], [tl + .6, so * .5], [tl * .3, so * .25]], big ? o.metal : o.cloth2, EDGE, .6);
  bar(c, -hl + .1, -3.1, 2.2, 1.1, o.accent);
  if (big) seg(c, [-hl + .4, -1.2], [tl * .5, -1.4], 1.2, o.metal);
  c.restore();
}
function legArt(c, J, tag, o, back, fr) {
  const hip = [J['hip' + tag + 'x'], J['hip' + tag + 'y']];
  const kn = [J['kn' + tag + 'x'], J['kn' + tag + 'y']];
  const ank = [J['ank' + tag + 'x'], J['ank' + tag + 'y']];
  const w = o.legs;
  limb(c, hip, kn, ank, w * 1.3, w, w * .82, back ? o.dark : o.cloth, back ? o.cloth : o.cloth2, EDGE, o.metal);
  ring(c, kn[0], kn[1], w * .92, o.metal, .8);
  dot(c, kn[0], kn[1], w * .4, o.accent);
  const sx = lerp2(kn[0], ank[0], .16), sy = lerp2(kn[1], ank[1], .16);
  const ex = lerp2(kn[0], ank[0], .76), ey = lerp2(kn[1], ank[1], .76);
  let nx = -(ank[1] - kn[1]), ny = ank[0] - kn[0];
  const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  poly(c, [[sx + nx * w * .95, sy + ny * w * .95], [ex + nx * w * .55, ey + ny * w * .55],
    [ex - nx * w * .55, ey - ny * w * .55], [sx - nx * w * .95, sy - ny * w * .95]], o.plate, EDGE, .6);
  seg(c, [sx + nx * w * .5, sy + ny * w * .5], [ex + nx * w * .3, ey + ny * w * .3], .8, back ? o.metal : o.steel);
  bootArt(c, ank[0], ank[1], J['toe' + tag + 'a'] || 0, fr, o, o.boots > 1.1);
  if (back) seg(c, lerp2(hip[0], kn[0], .32), lerp2(hip[1], kn[1], .32), 1.7, o.strap);
}
function armArt(c, J, tag, o, back, P) {
  const sh = [J['sh' + tag + 'x'], J['sh' + tag + 'y']];
  const el = [J['el' + tag + 'x'], J['el' + tag + 'y']];
  const hn = [J['hn' + tag + 'x'], J['hn' + tag + 'y']];
  const w = o.arms * (back ? .92 : 1);
  limb(c, sh, el, hn, w * 1.18, w * .94, w * .76, back ? o.cloth : o.cloth2, back ? o.cloth : o.cloth2, EDGE, o.metal);
  const bx = lerp2(el[0], hn[0], .32), by = lerp2(el[1], hn[1], .32);
  const fx = lerp2(el[0], hn[0], .76), fy = lerp2(el[1], hn[1], .76);
  let nx = -(hn[1] - el[1]), ny = hn[0] - el[0];
  const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  poly(c, [[bx + nx * w * 1.05, by + ny * w * 1.05], [fx + nx * w * .95, fy + ny * w * .95],
    [fx - nx * w * .95, fy - ny * w * .95], [bx - nx * w * 1.05, by - ny * w * 1.05]], o.plate, EDGE, .6);
  seg(c, [bx, by], [fx, fy], 1.5, o.strap);
  bar(c, bx - .6, by - .6, 1.3, 1.3, o.accent);
  ring(c, el[0], el[1], w * .8, o.metal, .7);
  const ux = hn[0] - el[0], uy = hn[1] - el[1], ul = Math.hypot(ux, uy) || 1;
  const open = P[K.OPEN] > .5;
  taper(c, hn, [hn[0] + ux / ul * 1.9, hn[1] + uy / ul * 1.9], w * .8, w * (open ? .5 : .64), o.skin, EDGE);
  if (!open) dot(c, hn[0] + ux / ul * 1.7, hn[1] + uy / ul * 1.7, w * .5, o.shade);
}
function torsoArt(c, J, fr, o, P) {
  const topY = J.shfy - J.cy, botY = J.hy - J.cy;
  const sw = fr.shW * (1 + P[K.TWIST] * .07);
  c.save(); c.translate(J.cx, J.cy); c.rotate(J.pa);
  poly(c, [[-sw * 1.06, topY + .4], [-sw * .34, topY - 1], [sw * .92, topY + .2], [sw * .74, botY - 1.6],
    [sw * .94, botY + 1.4], [-sw * .92, botY + 1.4], [-sw * .8, botY - 1.4]],
    grad(c, -sw * 1.2, topY, sw * .8, botY, o.cloth2, o.dark), EDGE, .9);
  poly(c, [[-sw * 1.06, topY + .4], [-sw * .34, topY - 1], [-sw * .2, botY - 1.6], [-sw * .8, botY - 1.4]], '#00000038');
  seg(c, [sw * .9, topY + .6], [sw * .72, botY - 1.6], .9, '#ffffff20');
  if (o.spinal) {                                  // asymmetric spinal implant
    const bx = -sw * 1.0;
    for (let i = 0; i < 4; i++) {
      const yy = topY + 2.4 + i * ((botY - topY - 3.4) / 4);
      poly(c, [[bx - 1.7, yy], [bx + .5, yy - .7], [bx + .5, yy + 1.4], [bx - 1.7, yy + 2]], o.metal, EDGE, .5);
    }
    bar(c, bx - 2.3, topY + 1.4, .8, (botY - topY) * .48, o.steel);
    glow(c, 4, o.spinal, () => dot(c, bx - .9, topY + 3.2, 1, o.spinal));
  }
  const rig = o.rig;
  if (rig === 'blade') {
    poly(c, [[-sw * .82, topY + 2.2], [sw * .8, topY + 1.8], [sw * .62, botY - 4.4], [-sw * .7, botY - 4]], o.plate, EDGE, .8);
    for (let i = 0; i < 3; i++) bar(c, -sw * .5 + i * sw * .5, topY + 3 + i * 2.6, sw * .34, 1.6, o.dark);
    seg(c, [-sw * .7, botY - 6.4], [sw * .66, botY - 6.8], 1.5, '#0c1a22');
    seg(c, [sw * .34, topY + 2.4], [sw * .1, botY - 4.2], 1.8, o.strap);
    seg(c, [-sw * .3, topY + 2.6], [-sw * .5, botY - 4.4], 1.2, o.accent);
  } else if (rig === 'armor') {
    poly(c, [[-sw * .96, topY + 1.6], [sw * .9, topY + 1.2], [sw * .78, botY - 3.4], [-sw * .86, botY - 3]], o.plate, EDGE, .9);
    poly(c, [[-sw * .8, topY + 3.4], [sw * .74, topY + 3], [sw * .68, botY - 5.4], [-sw * .74, botY - 5]], o.cloth2, EDGE, .7);
    seg(c, [-sw * .84, topY + 6.4], [sw * .8, topY + 6], 1.1, o.metal);
    seg(c, [-sw * .8, botY - 6.6], [sw * .74, botY - 6.8], 1.1, o.metal);
    bar(c, sw * .3, topY + 3.6, sw * .42, 1.4, o.accent);
  } else if (rig === 'plate') {
    poly(c, [[-sw * .98, topY + 1.4], [sw * .96, topY + 1], [sw * .84, botY - 3], [-sw * .88, botY - 3]], o.plate, EDGE, 1);
    poly(c, [[-sw * .74, topY + 4.2], [sw * .78, topY + 3.8], [sw * .72, topY + 7.6], [-sw * .7, topY + 8]], o.metal, EDGE, .7);
    seg(c, [-sw * .86, topY + 9.4], [sw * .84, topY + 9], 1.4, o.strap);
    bar(c, -sw * .2, topY + 5.4, sw * .5, 1.6, o.accent);
  } else if (rig === 'coat') {
    poly(c, [[-sw * .5, topY + .6], [sw * .7, topY + 1.4], [sw * 1.02, botY - 1], [sw * .2, botY + 1.2], [-sw * .5, botY - .4]], o.plate, EDGE, .8);
    poly(c, [[-sw * .1, topY + 1.2], [sw * .34, topY + 1.4], [sw * .5, botY - 2.6], [sw * .06, botY - 2.2]], '#00000030');
    for (let i = 0; i < 4; i++) dot(c, sw * .22 - i * .12, topY + 3.4 + i * 2.6, .8, o.accent);
    seg(c, [-sw * .96, topY + 2.2], [sw * .1, botY - 3.4], 2, o.strap);
  } else if (rig === 'vest') {
    poly(c, [[-sw * .74, topY + 2.4], [sw * .76, topY + 2], [sw * .7, botY - 3], [-sw * .68, botY - 3.4]], o.plate, EDGE, .8);
    seg(c, [sw * .06, topY + 2.2], [sw * .02, botY - 3.2], 1, o.metal);
    poly(c, [[-sw * .7, botY - 7.6], [sw * .6, botY - 8], [sw * .58, botY - 4.6], [-sw * .68, botY - 4.2]], o.cloth, EDGE, .7);
  } else {
    poly(c, [[-sw * .8, topY + 1.8], [sw * .78, topY + 1.4], [sw * .72, botY - 3.6], [-sw * .76, botY - 3.2]], o.cloth2, EDGE, .8);
    seg(c, [-sw * .7, topY + 5], [sw * .68, topY + 4.6], 1.2, o.metal);
  }
  poly(c, [[-sw * .34, topY - .4], [sw * .4, topY - .2], [sw * .5, topY + 2.2], [-sw * .46, topY + 2]], o.dark, EDGE, .6);
  bar(c, -1.5, topY + .4, 3.4, 2.6, o.shade);
  bar(c, -sw * .86, botY - 1.4, sw * 1.8, 2.6, '#1b1e21');
  bar(c, -1, botY - 1.6, 2.4, 3, o.accent);
  if (o.pouch) {
    poly(c, [[-sw * .3, botY + 1], [sw * .34, botY + .8], [sw * .3, botY + 5], [-sw * .34, botY + 5.4]], o.strap, EDGE, .7);
    bar(c, -sw * .2, botY + 2.4, sw * .5, 1, o.metal);
  }
  c.restore();
}
function shoulderArt(c, J, tag, o, back, fr) {
  const w = o.pauldron || fr.shW * .92;
  c.save(); c.translate(J['sh' + tag + 'x'], J['sh' + tag + 'y']); c.rotate(J.pa);
  if (back) c.scale(-1, 1);
  poly(c, [[-2.4, -1.8], [w * .8, -2.8], [w * 1.16, 2.4], [-1.6, 3.4]], o.plate, EDGE, .9);
  poly(c, [[-2.4, -1.8], [w * .8, -2.8], [w * .88, -.5], [-2, .4]], o.metal, null, 0);
  seg(c, [-1.4, 2.3], [w * 1.0, 1.7], 1, o.accent);
  bar(c, w * .3, -1.5, w * .5, .9, o.dark);
  c.restore();
}
function coatArt(c, J, o, P, fr, t, e, front) {
  const sw = fr.shW, topY = J.shfy - J.cy, botY = J.hy - J.cy;
  const swing = P[K.COAT];
  const vy = e && e.vy ? e.vy : 0;
  const lift = clamp01(vy / 620), press = clamp01(-vy / 620);   // falling lifts the cloth, rising presses it down
  c.save(); c.translate(J.cx, J.cy); c.rotate(J.pa);
  const tail = (dir, len, w, col, ph) => {
    const x0 = dir * sw * .48, y0 = botY - .6;
    const dx = dir * (-swing * 9 + 1.4) + dir * (-lift * 7 + press * 2.2);
    const dy = len * (1 - lift * .68 + press * .2) + Math.abs(swing) * 2;
    const wob = Math.sin(t * 5 + ph) * 1.7 * (.4 + Math.abs(swing) + lift);
    ribbon(c, x0, y0, x0 + dx + wob, y0 + dy, w, w * .38, col, EDGE, dir * 1.6);
    seg(c, [x0 + dx * .45, y0 + dy * .45], [x0 + dx + wob, y0 + dy], .8, o.accent);
  };
  if (front) {
    if (o.coatFront) tail(1, o.coatLen * .8, o.coatW * .8, o.cloth2, (o.ph || 0) + 2.1);
  } else {
    if (o.coatBack) tail(-1, o.coatLen, o.coatW, o.cloth, o.ph || 0);
    if (o.scarf) {
      const x0 = -sw * .28, y0 = topY + 1.8;
      const dx = -swing * 17 - 3.4 - lift * 8, dy = (5.5 + Math.abs(swing) * 7) * (1 - lift * .55);
      ribbon(c, x0, y0, x0 + dx, y0 + dy, 2, .8, o.scarf, EDGE, Math.sin(t * 6.4) * 1.9);
      seg(c, [x0 + dx * .55, y0 + dy * .55], [x0 + dx, y0 + dy], .7, o.accent);
    }
  }
  c.restore();
}
function hipArt(c, J, o, fr) {
  c.save(); c.translate(J.hx - fr.shW * .45, J.hy); c.rotate(J.pa * .6 - .1);
  if (o.hip === 'saya') {
    poly(c, [[-2.4, -1], [2, -1.8], [3.4, 15.6], [-1.4, 16.8]], '#171d22', EDGE, .7);
    poly(c, [[-.6, -.8], [1.8, -1.4], [2.8, 13], [.4, 13.8]], '#2c343a');
    seg(c, [-1.2, 5.4], [2.4, 4.4], .8, o.accent);
    ring(c, [.2, 15], 1, o.metal, .8);
  } else if (o.hip === 'holster') {
    poly(c, [[-1.8, -1], [2.6, -1.4], [3, 6.4], [-1.4, 6.8]], '#2c1d19', EDGE, .8);
    poly(c, [[-.6, -1.2], [2.2, -1.6], [2.4, 2], [-.4, 2.2]], '#3d2a22');
    bar(c, -1.4, 1.4, 4.4, 1, o.accent);
    poly(c, [[1, -3.4], [3.4, -3], [3.6, .4], [1.2, .2]], '#46303f', EDGE, .7);
  }
  c.restore();
}
function arcSlash(c, J, P, o) {
  const s = P[K.SWING];
  if (s <= .03) return;
  c.save();
  c.translate(J.wx, J.wy); c.rotate(J.wa);
  const spread = 1.05 + s * .8, r1 = 25 - s * 3, r0 = 6;
  c.globalAlpha *= .18 + s * .38;
  c.beginPath(); c.arc(0, 0, r1, -spread, .06, false); c.arc(0, 0, r0, .06, -spread, true);
  c.closePath(); c.fillStyle = o.accent; c.fill();
  c.beginPath(); c.arc(0, 0, r1 - 3.6, -spread * .8, -.06, false); c.arc(0, 0, r0 + 2, -.06, -spread * .8, true);
  c.closePath(); c.fillStyle = o.hot; c.fill();
  c.restore();
}

// ------------------------------------------------------------------ actors
const POSE = new Float64Array(NCH);
const J = makeJoints();
const O = {};
// Painted path: identical outer transform to the procedural path so facing, hit-flash,
// cloak/invuln alpha and the death collapse read the same whichever art is loaded.
function paintActor(c, e, t, player, type, ghost, R, ex, ey, w, h, dir, dead, flinch, z, aimLocal, art) {
  if (!spriteArt) return false;
  c.save();
  c.translate(ex + w / 2 - dir * flinch * 3, ey + h);
  c.scale(dir, 1);
  if (dead) {
    c.rotate(-z * 1.46);
    c.translate(0, -z * 1.6);
    c.globalAlpha *= .74;
  } else if (e.climbing) c.rotate(Math.sin(t * 12) * .02);
  if (e.cloak > 0) c.globalAlpha *= .38;
  if (e.invuln > 0) c.globalAlpha *= .8;
  if (ghost) c.globalAlpha *= .16;
  const drawn = spriteArt.drawSpriteHuman(c, e, t, player, type, ghost, {
    R, height: h, dead, art, player,
    aimLocal: player || e.aim ? aimLocal : null,
    aiming: player ? (!!e.aiming || (e.attackTimer || 0) > 0) : (e.alert || 0) > .5
  });
  c.restore();
  return drawn;
}
function wear(kit, e, accent) {
  const k = O;
  k.label = kit.label; k.frame = kit.frame; k.style = kit.style; k.rig = kit.rig;
  k.cloth = kit.cloth; k.cloth2 = kit.cloth2; k.plate = kit.plate; k.dark = kit.dark;
  k.metal = kit.metal; k.steel = kit.steel; k.strap = kit.strap; k.hot = kit.hot;
  k.sensor = kit.sensor; k.hip = kit.hip; k.pauldron = kit.pauldron;
  k.coatBack = kit.coatBack; k.coatFront = kit.coatFront; k.coatLen = kit.coatLen;
  k.coatW = kit.coatW; k.scarf = kit.scarf; k.pouch = kit.pouch;
  k.legs = kit.legs; k.arms = kit.arms; k.boots = kit.boots;
  k.accent = accent || kit.accent;
  k.spinal = kit.spinal ? k.accent : 0;
  const tone = Math.min(5, kit.tone + ((seed(e, 3) * 3) | 0));
  const hair = (kit.hair + ((seed(e, 5) * 5) | 0)) % HAIR.length;
  k.skin = SKIN[tone]; k.shade = SHADE[tone];
  k.hair = HAIR[hair]; k.hair2 = HAIR[(hair + 3) % HAIR.length];
  k.ph = seed(e, 9) * 6.2832;
  return k;
}
export function drawHuman(c, e, t, player = false, build = e.build || 'blade', ghost = false) {
  const w = e.w || 28, h = e.h || 54, dir = e.dir || 1;
  const ex = e.x || 0, ey = e.y || 0;
  const type = player ? (KITS[build] ? build : 'blade')
    : e.type === 'sniper' ? 'sniper' : e.type === 'heavy' ? 'heavy'
      : (e.faction && e.faction !== 'helix' ? 'gang' : 'guard');
  const o = wear(KITS[type] || KITS.guard, e, (!player && e.color) ? e.color : null);

  // --- weapon in hand
  let held = null;
  if (player) {
    if (e.reloadTimer > 0) held = e.reloadWeapon || e.lastFired;
    else if (e.attackTimer > 0) held = e.lastAttackKind;
    else held = e.weapon;
  }
  let art = held === 'arc' ? 'emitter' : held === 'scatter' ? 'cannon'
    : (held === 'pistol' || held === 'pulse') ? 'gun' : held === 'katana' ? 'katana'
      : held === 'fists' ? 'gauntlet' : null;
  if (!art) art = type === 'blade' ? 'katana' : type === 'gun' ? 'gun' : type === 'ghost' ? 'emitter'
    : type === 'tank' ? 'gauntlet' : type === 'sniper' ? 'sniper' : 'rifle';
  if (!player && (type === 'guard' || type === 'heavy' || type === 'gang')) art = 'rifle';
  if (type === 'tank' && art === 'rifle') art = 'gauntlet';

  // --- aim vector, mirrored into the local facing frame
  let la = 0;
  if (player) la = Number.isFinite(e.aimAngle) ? e.aimAngle : (dir < 0 ? Math.PI : 0);
  else if (e.aim) la = Math.atan2(e.aim.y - (ey + h * .45), e.aim.x - (ex + w / 2));
  else la = dir < 0 ? Math.PI : 0;
  let aimLocal = dir < 0 ? Math.PI - la : la;
  while (aimLocal > Math.PI) aimLocal -= 6.2832;
  while (aimLocal < -Math.PI) aimLocal += 6.2832;

  const R = rigMemory(e, t, ghost);
  const fr = frameOf(o.frame, h);
  const dead = isDown(e);
  const hitAge = R.hit < -1 ? 99 : t - R.hit;
  const flinch = hitAge < .2 && !dead ? 1 - hitAge / .2 : 0;
  const z = dead ? 1 - Math.pow(1 - Math.min(1, (t - R.dead) / .55), 3) : 0;

  // --- painted sprite art takes over whenever its atlas is loaded
  if (paintActor(c, e, t, player, type, ghost, R, ex, ey, w, h, dir, dead, flinch, z, aimLocal, art)) return;

  const melee = art === 'katana' || art === 'gauntlet';
  solvePose(POSE, e, R, t, {
    H: h, frame: o.frame, player, ghost, ldir: (R.vel || 0) * dir < -4 ? -1 : 1,
    combat: player || (e.alert || 0) > .35, melee: player ? melee : false,
    shooter: player ? !melee : true,
    aimLocal: (player || e.aim) ? aimLocal : null,
    telegraph: e.telegraph ? clamp01(1 - e.telegraph / (type === 'sniper' ? .95 : type === 'heavy' ? .65 : .34)) : 0
  });

  c.save();
  c.translate(ex + w / 2 - dir * flinch * 3, ey + h);
  c.scale(dir, 1);
  if (dead) {
    c.rotate(-z * 1.46);
    c.translate(0, -z * 1.6);
    c.globalAlpha *= .74;
  } else {
    const br = Math.sin(t * 1.6 + o.ph) * (R.sp > 6 ? .004 : .011);
    c.scale(1 + br, 1 - br);
    c.rotate((e.dashTimer > 0 || e.rush > 0) ? .06 : e.climbing ? Math.sin(t * 12) * .02 : 0);
    if (e.stun > 0) c.rotate(Math.sin(t * 30) * .05);
  }
  if (e.cloak > 0) c.globalAlpha *= .38;
  if (e.invuln > 0) c.globalAlpha *= .8;
  if (ghost) c.globalAlpha *= .16;

  solveJoints(POSE, fr, J);
  coatArt(c, J, o, POSE, fr, t, e, false);
  armArt(c, J, 'b', o, true, POSE);
  legArt(c, J, 'b', o, true, fr);
  hipArt(c, J, o, fr);
  torsoArt(c, J, fr, o, POSE);
  shoulderArt(c, J, 'b', o, true, fr);
  legArt(c, J, 'f', o, false, fr);
  shoulderArt(c, J, 'f', o, false, fr);
  seg(c, [J.nx, J.ny], [J.dx, J.dy], 2.5, o.shade);
  c.save();
  c.translate(J.dx, J.dy); c.rotate(J.ha);
  skull(c, fr.headR, o, type === 'blade' ? o.hot : o.accent);
  headgear(c, fr.headR, o);
  c.restore();
  armArt(c, J, 'f', o, false, POSE);
  if (art !== 'none') {
    if (art === 'katana') arcSlash(c, J, POSE, o);
    c.save();
    c.translate(J.bx, J.by); c.rotate(J.wa);
    if (art === 'katana') katana(c, o, POSE[K.SWING] > .02);
    else if (art === 'gun') pistol(c, o);
    else if (art === 'cannon') cannonArt(c, o);
    else if (art === 'emitter') emitter(c, o);
    else if (art === 'gauntlet') gauntlet(c, o);
    else rifleArt(c, o, type === 'heavy', art === 'sniper');
    c.restore();
  }
  coatArt(c, J, o, POSE, fr, t, e, true);
  c.restore();
}

// ------------------------------------------------------------------ civilians
function bunting(c, x, y, r, col) {
  const n = 6, tip = [x, y - r * 1.45];
  seg(c, [x, y + 3], [tip[0], tip[1] + 1], 1.3, '#8f9ba1'); bar(c, tip[0] - 1, tip[1] - 5, 2, 5, '#b9c3c7');
  c.beginPath(); c.moveTo(tip[0], tip[1]);
  for (let i = 0; i < n; i++) {
    const a0 = 3.1416 + i / n * 3.1416, a1 = 3.1416 + (i + 1) / n * 3.1416;
    const x0 = tip[0] + Math.cos(a0) * r, y0 = tip[1] + Math.sin(a0) * r * .74;
    const x1 = tip[0] + Math.cos(a1) * r, y1 = tip[1] + Math.sin(a1) * r * .74;
    c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + r * .17, x1, y1);
  }
  c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = EDGE; c.lineWidth = .9; c.stroke();
  for (let i = 0; i <= n; i++) {
    const a = 3.1416 + i / n * 3.1416, px = tip[0] + Math.cos(a) * r, py = tip[1] + Math.sin(a) * r * .74;
    seg(c, [tip[0], tip[1] + .6], [px, py], .8, '#0000004d'); ring(c, px, py, .9, '#c9d2d4', .7);
  }
}
export function drawResident(c, e, t) {
  const w = e.w || 22, h = e.h || 52, dir = e.dir || 1, ex = e.x || 0, ey = e.y || 0;
  const role = e.role;
  const o = wear(CIVKIT, e, null);
  const panic = e.panic > 0;
  const tone = Math.min(5, (seed(e, 1) * 6) | 0);
  o.skin = SKIN[tone]; o.shade = SHADE[tone];
  const hair = (seed(e, 11) * 8) | 0;
  o.hair = HAIR[hair]; o.hair2 = HAIR[(hair + 3) % HAIR.length];
  const top = CIVT[(seed(e, 2) * 8) | 0], bottom = CIVP[(seed(e, 4) * 5) | 0];
  o.cloth = top; o.cloth2 = bottom; o.plate = top; o.dark = '#1c1b19';
  o.accent = CIVACC[(seed(e, 9) * 8) | 0];
  o.coatBack = role === 'commuter';
  o.pouch = role === 'courier';
  o.scarf = role === 'resident' ? o.accent : 0;

  const R = rigMemory(e, t, false);

  // Painted civilian art when its atlas is available; props are baked into these poses, so the
  // procedural accessories are skipped. The speech bubble below still runs either way.
  if (spriteArt.hasCivilianSprite()) {
    c.save();
    c.translate(ex + w / 2, ey + h + (panic ? Math.sin(t * 9) * .5 : 0));
    c.scale(dir, 1);
    c.rotate(panic ? .05 : Math.sin(t * 1.2 + o.ph) * .01);
    if (spriteArt.drawSpriteResident(c, e, t, R, h, false)) { c.restore(); return speech(c, e, t, ex, ey, w, panic); }
    c.restore();
  }

  const fr = frameOf('civ', h);
  solvePose(POSE, e, R, t, { H: h, frame: 'civ', ldir: (R.vel || 0) * dir < -4 ? -1 : 1, combat: false, melee: false, shooter: false });
  solveJoints(POSE, fr, J);

  c.save();
  c.translate(ex + w / 2, ey + h + (panic ? Math.sin(t * 9) * .5 : 0));
  c.scale(dir, 1);
  c.rotate(panic ? .07 : Math.sin(t * 1.2 + o.ph) * .012);
  coatArt(c, J, o, POSE, fr, t, e, false);
  armArt(c, J, 'b', o, true, POSE);
  legArt(c, J, 'b', o, true, fr);
  torsoArt(c, J, fr, o, POSE);
  legArt(c, J, 'f', o, false, fr);
  if (role === 'vendor') {
    c.save(); c.translate(J.cx, J.cy); c.rotate(J.pa);
    const hipY = J.hy - J.cy, sw = fr.shW;
    poly(c, [[-sw * .5, 1.6], [sw * .82, 2], [sw * .9, hipY + 9], [-sw * .7, hipY + 8.4]], '#cdc0a3', EDGE, .8);
    seg(c, [-sw * .4, 2.2], [-sw * .5, hipY + 2], 1.1, '#b3a488');
    seg(c, [sw * .5, 2.4], [sw * .6, hipY + 1], 1.1, '#b3a488');
    poly(c, [[-sw * .92, 2.6], [-sw * .2, 3.2], [-sw * .3, hipY + 1], [-sw * 1.0, hipY - .4]], '#aebbb7', EDGE, .6);
    c.restore();
    bar(c, J.hnfx - 2, J.hnfy - 8.4, 8, 1.4, '#8d7f66');
    poly(c, [[J.hnfx - 1, J.hnfy - 11], [J.hnfx + 7, J.hnfy - 11], [J.hnfx + 6.4, J.hnfy - 8.4], [J.hnfx - .4, J.hnfy - 8.4]], '#5c6a72', EDGE, .7);
    for (let i = 0; i < 3; i++) {
      const p = (t * .8 + i * .33) % 1;
      c.save(); c.globalAlpha *= (1 - p) * .5;
      seg(c, [J.hnfx + 3 + Math.sin(t * 2 + i * 2) * 2, J.hnfy - 9 - p * 9], [J.hnfx + 3 + Math.sin(t * 2 + i * 2) * 2, J.hnfy - 12 - p * 9], 1.4, '#e6ecec');
      c.restore();
    }
  }
  if (role === 'courier') {
    c.save(); c.translate(J.cx, J.cy); c.rotate(J.pa);
    const hipY = J.hy - J.cy, sw = fr.shW;
    poly(c, [[-sw * .5, 1.6], [sw * 1.5, 6], [sw * 1.3, 10.6], [-sw * .4, 7.6]], '#5f4f3c', EDGE, .9);
    bar(c, sw * .3, 7, 3.4, 1.2, '#c9a04c');
    c.restore();
  }
  if (role === 'commuter') {
    const sw = fr.shW;
    poly(c, [[J.cx - sw * .9, J.shfy - 1], [J.cx - sw * .2, J.shfy - 1], [J.cx - sw * .3, J.shfy + 4], [J.cx - sw * 1.05, J.shfy + 3.4]], '#4f5860', EDGE, .7);
  }
  seg(c, [J.nx, J.ny], [J.dx, J.dy], 2.3, o.shade);
  c.save();
  c.translate(J.dx, J.dy); c.rotate(J.ha + (panic ? .12 : Math.sin(t * 1.1 + o.ph) * .04));
  skull(c, fr.headR, o, o.skin);
  if (role === 'resident') {
    hairTop(c, fr.headR, o, true);
    poly(c, [[-fr.headR * 1.1, -fr.headR * .3], [-fr.headR * .8, -fr.headR * 1.3], [fr.headR * .3, -fr.headR * -1.5], [fr.headR * 1.0, -fr.headR * .6], [fr.headR * .86, -fr.headR * .28], [fr.headR * .1, -fr.headR * .5]], o.accent, EDGE, .7);
  } else headgear(c, fr.headR, o);
  c.restore();
  armArt(c, J, 'f', o, false, POSE);
  if (role === 'commuter') {
    c.save(); c.translate(J.hnfx, J.hnfy); c.rotate(J.wa);
    bar(c, -1, -1.6, 2.2, 4.4, '#0f1a24'); bar(c, -.6, -1.2, 1.6, 3.2, '#7fc4d6');
    c.restore();
  }
  if (e.umbrella) {
    c.save();
    c.translate(J.hnfx, J.hnfy); c.rotate(J.pa * .2 + .2);
    c.translate(0, panic ? -1 : 0); c.rotate(panic ? .1 : 0);
    bunting(c, 1, 1, 15, panic ? '#4f5967' : (e.color || '#6d7f86'));
    c.restore();
  }
  c.restore();
  speech(c, e, t, ex, ey, w, panic);
}
// Speech bubble is shared by the painted and procedural resident paths.
function speech(c, e, t, ex, ey, w, panic) {
  if (!(e.speechTime > 0) || !e.speech) return;
  c.save(); c.font = '11px monospace'; const wd = c.measureText(e.speech).width + 16;
  const bx = ex + w / 2 - wd / 2, by = ey - (e.umbrella ? 44 : 26);
  c.fillStyle = '#07131eee'; c.strokeStyle = panic ? '#c08e76' : '#6c999d'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(bx + 4, by); c.lineTo(bx + wd - 4, by); c.quadraticCurveTo(bx + wd, by, bx + wd, by + 4);
  c.lineTo(bx + wd, by + 20); c.quadraticCurveTo(bx + wd, by + 24, bx + wd - 4, by + 24); c.lineTo(bx + 4, by + 24);
  c.quadraticCurveTo(bx, by + 24, bx, by + 20); c.lineTo(bx, by + 4); c.quadraticCurveTo(bx, by, bx + 4, by); c.closePath();
  c.fill(); c.stroke(); c.beginPath(); c.moveTo(bx + wd * .5 - 4, by + 24); c.lineTo(bx + wd * .5, by + 29); c.lineTo(bx + wd * .5 + 4, by + 24); c.fill(); c.stroke();
  c.fillStyle = '#e0d6bf'; c.textAlign = 'center'; c.fillText(e.speech, ex + w / 2, by + 16); c.restore();
}

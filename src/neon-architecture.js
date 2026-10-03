// Reusable procedural architecture kit for NULL // RAIN.
// Offline drawing only: deterministic per address, animated from game time,
// never touching simulation state. Imported by street.js and interiors.js.
import {BASES} from './territories.js';

export const WALK = 2140;   // pavement level and the gameplay floor
import { paintMaterial } from './world-art.js';
export const KERB = 2137;   // far kerb line: props stand here, the player walks nearer
export const GROUND = 2004; // top of the street storey
export const PLINTH = 2126; // shop stall riser
export const PITCH = 430;   // address pitch along the street

export const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const ok = (...v) => v.every(Number.isFinite);
/** Multiply a hex colour's brightness, used to keep trim tones from flaring out. */
export function tone(hex, k) {
  if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return hex;
  const f = i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k)));
  return `#${[f(1), f(3), f(5)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/* ------------------------------------------------------------------ paint */
export function box(c, x, y, w, h, col) { if (!ok(x, y, w, h) || w <= 0 || h <= 0) return; c.fillStyle = col; c.fillRect(x, y, w, h); }
export function frame(c, x, y, w, h, col, lw = 1) { if (!ok(x, y, w, h) || w <= 0 || h <= 0) return; c.strokeStyle = col; c.lineWidth = lw; c.strokeRect(x + .5, y + .5, w - 1, h - 1); }
export function seg(c, x1, y1, x2, y2, col, lw = 1) {
  if (!ok(x1, y1, x2, y2)) return; c.strokeStyle = col; c.lineWidth = lw;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}
export function poly(c, pts, col) {
  if (!pts || pts.length < 3 || !ok(...pts.flat())) return;
  c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
}
export function dot(c, x, y, r, col) { if (!ok(x, y, r) || r <= 0) return; c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
export function ring(c, x, y, r, col, lw = 1) { if (!ok(x, y, r) || r <= 0) return; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); }

// Unit-space gradients are cached per context so light costs no allocation per frame.
const GRADS = new WeakMap();
function unit(c, key, make) {
  let m = GRADS.get(c); if (!m) { m = new Map(); GRADS.set(c, m); }
  let g = m.get(key); if (!g) { g = make(c); m.set(key, g); }
  return g;
}
const U = 100;
/** Soft downward light spill, brightest at the top edge. */
export function spill(c, x, y, w, h, col, alpha = .16) {
  if (w <= 0 || h <= 0) return;
  const g = unit(c, `spill|${col}`, k => { const p = k.createLinearGradient(0, 0, 0, U); p.addColorStop(0, col); p.addColorStop(1, 'transparent'); return p; });
  c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(w / U, h / U); c.fillStyle = g; c.fillRect(0, 0, U, U); c.restore();
}
/** Radial pool of light (wet pavement, lamp haloes). */
export function pool(c, x, y, r, col, alpha = .2, add = false) {
  if (!ok(x, y, r) || r <= 0) return;
  const g = unit(c, `pool|${col}`, k => { const p = k.createRadialGradient(U / 2, U / 2, 0, U / 2, U / 2, U / 2); p.addColorStop(0, col); p.addColorStop(1, 'transparent'); return p; });
  c.save(); c.globalAlpha *= alpha; if (add) c.globalCompositeOperation = 'lighter';
  c.translate(x - r, y - r); c.scale(r * 2 / U, r * 2 / U); c.fillStyle = g; c.fillRect(0, 0, U, U); c.restore();
}
/** Vertical gradient wash inside a rect (sky behind glass, damp on brick). */
export function wash(c, x, y, w, h, stops) {
  if (w <= 0 || h <= 0) return;
  const g = unit(c, `wash|${stops.join('|')}`, k => { const p = k.createLinearGradient(0, 0, 0, U); for (const [o, col] of stops) p.addColorStop(o, col); return p; });
  c.save(); c.translate(x, y); c.scale(w / U, h / U); c.fillStyle = g; c.fillRect(0, 0, U, U); c.restore();
}

/* ------------------------------------------------------------------- neon */
export const flicker = (t, sd, rate = 6) => {
  const k = Math.floor(t * rate + sd * 7.3), a = hash(k * 1.7 + sd), b = hash(k * 4.3 + sd * 2);
  if (a < .05) return b < .5 ? .15 : .55;
  if (a < .12) return .78;
  return 1;
};
export function neonText(c, str, x, y, { color = '#ff7ab0', size = 13, align = 'left', alpha = 1, flick = 1, bold = true, halo = 1 } = {}) {
  if (!str || alpha <= 0) return;
  c.save(); c.font = `${bold ? 'bold ' : ''}${size}px "Courier New", monospace`; c.textAlign = align;
  c.globalAlpha = alpha * .34 * flick; c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 12 * halo;
  c.fillText(str, x, y);
  c.shadowBlur = 5; c.globalAlpha = alpha * flick; c.fillText(str, x, y);
  c.shadowBlur = 0; c.globalAlpha = alpha * flick * .45; c.fillStyle = '#fff6ff'; c.fillText(str, x, y);
  c.restore();
}
export function plainText(c, str, x, y, { color = '#b7c9d2', size = 9, align = 'left', alpha = 1 } = {}) {
  if (!str) return;
  c.save(); c.font = `${size}px "Courier New", monospace`; c.textAlign = align; c.globalAlpha *= alpha;
  c.fillStyle = color; c.fillText(str, x, y); c.restore();
}
/** A neon tube along a polyline: bloom, glass and hot core. */
export function tube(c, pts, col, { width = 2.2, alpha = .95, flick = 1, close = false, bloom = 1 } = {}) {
  if (!pts || pts.length < 2) return;
  const trace = () => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (close) c.closePath(); };
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.globalCompositeOperation = 'lighter';
  for (const [mul, a] of [[5, .07], [2.4, .16]]) {
    c.globalAlpha = alpha * a * flick * bloom; c.strokeStyle = col; c.lineWidth = width * mul; trace(); c.stroke();
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = alpha * flick; c.strokeStyle = col; c.lineWidth = width; trace(); c.stroke();
  c.globalAlpha = alpha * flick * .55; c.strokeStyle = '#fff8ff'; c.lineWidth = width * .38; trace(); c.stroke();
  c.restore();
}
export const tubeRect = (c, x, y, w, h, col, o) => tube(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], col, { close: true, ...o });

/* ------------------------------------------------------------------ glass */
export function rainStreaks(c, x, y, w, h, t, sd, col = '#bcd8e2', n = 7, alpha = .3) {
  c.save(); c.strokeStyle = col; c.lineWidth = 1; c.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const px = x + 3 + hash(sd * 3.1 + i * 2.7) * (w - 6), sp = 26 + hash(i + sd) * 60, len = 12 + hash(i * 1.7 + sd) * (h * .55);
    const off = (t * sp + hash(i * 5.3 + sd) * h) % (h + 30);
    const yy = y + off - 20;
    c.beginPath(); c.moveTo(px, yy); c.lineTo(px - 2.5, yy + len); c.stroke();
    c.globalAlpha = alpha * .5; dot(c, px - 2.5, yy + len, 1.1, col); c.globalAlpha = alpha;
  }
  for (let i = 0; i < n * 2; i++) dot(c, x + hash(sd + i * 3.7) * w, y + hash(sd * 2 + i * 1.9) * h, .7 + hash(i + sd) * .7, col);
  c.restore();
}
/** Diagonal specular streaks so glazing reads as glass, not a hole. */
export function glassSheen(c, x, y, w, h, sd, alpha = .1) {
  c.save(); c.globalAlpha = alpha; c.fillStyle = '#cfe9f2';
  for (let i = 0; i < 2; i++) {
    const px = x + hash(sd + i * 4.4) * w, tilt = w * .55;
    poly(c, [[px, y], [px + tilt * .2, y], [px - tilt * .62, y + h], [px - tilt * .82, y + h]], '#cfe9f2');
  }
  c.restore();
}

/* --------------------------------------------------------------- occupants */
// Small human silhouettes for windows and back rooms: coat, head, optional task.
export function occupant(c, x, y, s = 1, o = {}) {
  const { col = '#0d1017', task = '', t = 0, sd = 0, lean = 0 } = o;
  const sway = Math.sin(t * 1.1 + sd) * .8;
  c.save(); c.translate(x + lean, y); c.scale(s, s);
  const bob = task === 'walk' ? Math.abs(Math.sin(t * 3 + sd)) * 1.2 : Math.sin(t * .9 + sd) * .5;
  box(c, -4, -34 + bob, 8, 20, col);            // torso
  box(c, -3, -14 + bob, 2.4, 12, col);          // legs
  box(c, 1, -14 + bob, 2.4, 12, col);
  box(c, -1.6, -34 + bob, 3.2, 3, col);          // neck
  dot(c, 0, -38 + bob, 3.4, col);                // head
  if (task === 'cup' || task === 'phone') {
    const up = task === 'cup' ? -30 + bob + Math.sin(t * 2 + sd) * 1.6 : -33 + bob;
    seg(c, 3, -30 + bob, 6 + sway, up, col, 2.2);
    if (task === 'cup') box(c, 5.4, up - 2, 2.6, 3.4, col);
  } else if (task === 'cook') {
    seg(c, 3, -30 + bob, 7, -26 + Math.sin(t * 5 + sd) * 2.4, col, 2.2);
    seg(c, -3, -30 + bob, -6, -24 + Math.sin(t * 4 + sd) * 3, col, 2.2);
  } else if (task === 'reach') {
    seg(c, 3, -30 + bob, 9, -40 + Math.sin(t * 1.4 + sd) * 2, col, 2.2);
  } else if (task === 'radio') {
    seg(c, -3, -31 + bob, -7, -35 + sway, col, 2.2);
    box(c, -9, -36 + sway, 4, 3, col);
  } else {
    seg(c, 3.4, -30 + bob, 4.6, -18 + bob, col, 2.2);
    seg(c, -3.4, -30 + bob, -5, -18 + bob, col, 2.2);
  }
  if (o.rim) { box(c, 3.2, -34 + bob, 1.4, 18, o.rim); }
  c.restore();
}
/** Background crowd: cheap silhouette people, used behind glass and on the far pavement. */
export function crowdFigure(c, x, y, s = 1, o = {}) {
  const { col = '#101722', rim = null, t = 0, sd = 0, walk = 0, coat = 6 } = o;
  const p = Math.sin(t * 3.1 + sd), bob = Math.abs(p) * 1.1 * walk, sw = Math.sin(t * 3.1 + sd);
  c.save(); c.translate(x, y); c.scale(s, s);
  poly(c, [[-3.6, -30 + bob], [3.6, -30 + bob], [coat * .35, -13], [-coat * .35, -13]], col);
  box(c, -3, -14 + bob, 2.3, 13, col); box(c, 1, -14 + bob, 2.3, 13, col);
  box(c, -1.4, -30, 2.8, 3.4, col);
  dot(c, 0, -35 + bob, 3.2, col);
  seg(c, 3.2, -28 + bob, 5.2 + sw * 1.6 * walk, -17 + bob, col, 2);
  seg(c, -3.2, -28 + bob, -5.2 - sw * 1.6 * walk, -17 + bob, col, 2);
  if (rim) { poly(c, [[-3.6, -30 + bob], [-1.4, -30 + bob], [-coat * .2, -14], [-coat * .35, -13]], rim); dot(c, .6, -35 + bob, 2.4, rim); }
  c.restore();
}

/* --------------------------------------------------------------- masonry */
export function masonry(c, x, y, w, h, o = {}) {
  const { variant = 'brick', wall = '#372a2b', brick = '#8a5f4d', mortar = '#241c1e', sd = 0, grime = .5 } = o;
  box(c, x, y, w, h, wall);
  if (variant === 'brick') {
    const bh = 12, bw = 26;
    for (let r = 0, ry = y; ry < y + h; r++, ry += bh) {
      const off = r % 2 ? bw / 2 : 0;
      for (let bx = x - off; bx < x + w; bx += bw) {
        const n = hash(sd + r * 7.3 + bx * .13);
        if (n < .07) continue;
        const bx0 = Math.max(x, bx), bw0 = Math.min(bw - 2, x + w - Math.max(x, bx) - 1);
        box(c, bx0 + 1, ry + 1, bw0, bh - 2, brick);
        c.globalAlpha = .5; box(c, bx0 + 1, ry + 1, bw0, 1, n > .5 ? '#ffffff18' : '#00000022'); c.globalAlpha = 1;
      }
    }
    c.globalAlpha = .35;
    for (let ry = y + bh; ry < y + h; ry += bh) box(c, x, ry, w, 1, mortar);
    c.globalAlpha = 1;
  } else if (variant === 'panel') {
    const pw = 62, ph = 46;
    for (let py = y; py < y + h; py += ph) {
      box(c, x, py, w, 1, '#00000038'); box(c, x, py + 1, w, 2, '#ffffff0e');
      for (let px = x; px < x + w; px += pw) { frame(c, px, py, pw, ph, '#00000030'); box(c, px + 4, py + 6, 2, ph - 12, '#00000022'); }
      box(c, x + ((sd * 7) % pw | 0), py, 3, ph, '#00000018');
    }
  } else if (variant === 'corrugated') {
    for (let px = x; px < x + w; px += 14) { box(c, px, y, 6, h, '#ffffff09'); box(c, px + 7, y, 5, h, '#00000022'); }
    for (let py = y + 34; py < y + h; py += 78) { box(c, x, py, w, 3, '#00000026'); for (let px = x + 10; px < x + w; px += 38) dot(c, px, py + 1.5, 1.3, '#0a0f14'); }
  } else if (variant === 'render') {
    for (let i = 0; i < 7; i++) {
      const px = x + hash(sd + i * 3.1) * w, py = y + hash(sd + i * 5.7) * h, r = 14 + hash(i + sd) * 40;
      c.globalAlpha = .07; dot(c, px, py, r, hash(sd + i) > .5 ? '#ffffff' : '#000000'); c.globalAlpha = 1;
    }
    c.strokeStyle = '#00000022'; c.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const px = x + hash(sd + i * 9.1) * w;
      c.beginPath(); c.moveTo(px, y); c.lineTo(px + 6, y + h * .4); c.lineTo(px - 4, y + h * .8); c.stroke();
    }
  } else if (variant === 'tile') {
    const s = 15;
    for (let ty = y; ty < y + h; ty += s) for (let tx = x; tx < x + w; tx += s) {
      const n = hash(sd + tx * .21 + ty * .37);
      box(c, tx, ty, s - 1, s - 1, n > .8 ? '#ffffff10' : n > .5 ? '#00000012' : '#ffffff05');
    }
    c.globalAlpha = .3; for (let ty = y; ty < y + h; ty += s) box(c, x, ty, w, 1, '#00000030'); for (let tx = x; tx < x + w; tx += s) box(c, tx, y, 1, h, '#00000022'); c.globalAlpha = 1;
  } else if (variant === 'lath') {
    for (let py = y; py < y + h; py += 11) { box(c, x, py, w, 10, hash(sd + py) > .5 ? '#4a3a2c' : '#42342a'); box(c, x, py, w, 1, '#1b1410'); }
    c.globalAlpha = .25; for (let py = y; py < y + h; py += 11) box(c, x, py + 10, w, 1, '#c9a06a'); c.globalAlpha = 1;
  } else if (variant === 'buttress') {
    const bw = 54;
    for (let bx = x; bx < x + w; bx += bw) { box(c, bx, y, bw - 6, h, '#ffffff08'); box(c, bx + bw - 10, y, 4, h, '#00000030'); box(c, bx + bw - 12, y, 2, h, '#ffffff10'); }
  }
  // Rising damp, corner soot and rain streaks keep large walls from reading flat.
  if (grime > 0) {
    wash(c, x, y + h - Math.min(h, 120), w, Math.min(h, 120), [[0, 'transparent'], [1, `rgba(4,8,12,${.5 * grime})`]]);
    c.globalAlpha = .12 * grime;
    for (let i = 0; i < Math.max(3, w / 26); i++) {
      const px = x + hash(sd + i * 2.3) * w;
      wash(c, px, y, 3 + hash(i + sd) * 5, h, [[0, '#0a0f14'], [1, 'transparent']]);
    }
    c.globalAlpha = 1;
  }
  // Photopixel surface pass: the painted material atlas over the existing line work, so every
  // facade gains real texture, bevel and edge wear while keeping its own colour personality.
  paintMaterial(c, SURFACE[variant] || 'plaster', x, y, w, h, { alpha: .56, seed: sd | 0, scale: 74 });
}
const SURFACE = { brick: 'brick', panel: 'metal', corrugated: 'corrugated', render: 'plaster', tile: 'plaster', lath: 'wood', buttress: 'foundation' };
export function stringCourse(c, x, y, w, { top = '#6f6a60', body = '#3b3630', under = '#141a20' } = {}) {
  box(c, x, y, w, 2, top); box(c, x, y + 2, w, 4, body); box(c, x, y + 6, w, 2, under);
}
export function cornice(c, x, y, w, h = 12, col = '#4a463f') {
  box(c, x - 4, y, w + 8, 2, '#6d7a7c'); box(c, x, y + 2, w, h - 5, col); box(c, x - 2, y + h - 3, w + 4, 3, '#0d1218');
  for (let px = x + 8; px < x + w - 8; px += 34) box(c, px, y + 3, 6, h - 8, '#00000024');
}
export function quoins(c, x, y, h, { step = 16, w = 12, col = '#7d746a', sd = 0 } = {}) {
  for (let i = 0, py = y; py < y + h; i++, py += step) {
    const ww = i % 2 ? w : w * .68;
    box(c, x, py, ww, step - 2, col); box(c, x, py, ww, 1, '#ffffff12'); box(c, x, py + step - 3, ww, 1, '#00000030');
  }
}
export function parapet(c, x, y, w, o = {}) {
  const { kind = 'flat', col = '#3f3c36', h = 14, sd = 0 } = o;
  box(c, x, y, w, h, col); box(c, x, y, w, 2, '#69767a'); box(c, x, y + h - 2, w, 2, '#0b1015');
  if (kind === 'crenel') for (let px = x + 4; px < x + w - 10; px += 26) box(c, px, y - 7, 14, 7, col);
  if (kind === 'stepped') for (let px = x + 6; px < x + w - 16; px += 30) box(c, px, y - 6 - hash(px + sd) * 10, 16, 8, col);
  if (kind === 'tiled') for (let px = x + 2; px < x + w - 2; px += 9) box(c, px, y - 2, 5, 4, '#6a3a34');
}
/** Faded hand-painted advertising on brick: the city's memory of other businesses. */
export function ghostSign(c, x, y, w, h, word, col = '#d8c39a', sd = 0) {
  c.save(); c.globalAlpha = .16 + hash(sd) * .1;
  c.font = `bold ${Math.min(h, w / Math.max(4, word.length) * 1.5)}px "Courier New", monospace`; c.textAlign = 'center';
  c.fillStyle = col; c.fillText(word, x + w / 2, y + h * .72);
  c.globalAlpha = .07; c.fillStyle = '#0a0d12'; c.fillText(word, x + w / 2 + 2, y + h * .72 + 2); c.restore();
  c.globalAlpha = .1; for (let i = 0; i < 14; i++) box(c, x + hash(sd + i * 2.7) * w, y + hash(sd + i * 5.1) * h, 6 + hash(i + sd) * 22, 1 + hash(i * 3 + sd) * 2, '#0c1016'); c.globalAlpha = 1;
}

/* ---------------------------------------------------------------- windows */
/** A residential window with real depth: reveal, room, figure, glass, sill, spill. */
export function windowUnit(c, x, y, w, h, o = {}) {
  const { kind = 'double', t = 0, sd = 0, lit = false, warm = '#f0b878', cold = '#7fd6e6', shut = false, boards = false, ac = false, plant = false, occupantKind = '', sign = null } = o;
  const tone = lit ? warm : cold;
  // reveal + lintel give the opening thickness.
  box(c, x - 3, y - 3, w + 6, h + 8, '#0c1116');
  box(c, x, y, w, h, lit ? '#1a120c' : '#050a10');
  if (lit) {
    wash(c, x, y, w, h, [[0, tone + '44'], [.42, '#3a2617'], [1, '#140d08']]);
    box(c, x, y + h * .52, w, 2, '#2b1c11');            // back-wall shelf line
    if (hash(sd + 3) > .55) box(c, x + 4 + hash(sd) * (w - 14), y + h * .2, 8, h * .3, '#00000038'); // shelf / cabinet
    if (hash(sd + 7) > .6) { dot(c, x + w * .74, y + h * .22, 2.6, '#ffdca8'); pool(c, x + w * .74, y + h * .26, 22, '#ffcf90', .18); }
    if (occupantKind) occupant(c, x + w * .5 + Math.sin(t * .5 + sd) * 2, y + h - 3, Math.min(1.05, h / 52), { t, sd, task: occupantKind, col: '#0b0d12', rim: tone + '55' });
    else if (hash(sd + 11) > .72) box(c, x + w * .3, y + h * .55, w * .4, h * .4, '#00000030');
  } else if (hash(sd + 5) > .88) {
    box(c, x, y, w, h, '#0b1620'); dot(c, x + w * .5, y + h * .5, 3, '#2b4a5a'); // dark, a standby diode
  }
  if (o.tv) { // blue flicker of a screen, with rolling bands
    const f = .55 + .45 * hash(Math.floor(t * 9) + sd);
    box(c, x + 3, y + 6, w - 6, h - 14, `rgba(120,190,235,${.28 * f})`);
    c.save(); c.globalAlpha = .2 * f;
    for (let yy = y + 6; yy < y + h - 8; yy += 4) box(c, x + 3, yy + ((t * 22) % 4), w - 6, 1.4, '#dff2ff');
    c.restore();
  }
  // frame, mullions and glazing
  if (kind === 'arch') {
    c.strokeStyle = '#6d675c'; c.lineWidth = 2;
    c.beginPath(); c.arc(x + w / 2, y, w / 2, Math.PI, 0); c.stroke();
    box(c, x - 3, y, 3, h, '#6d675c'); box(c, x + w, y, 3, h, '#6d675c');
  }
  if (kind === 'bay') {
    box(c, x - 4, y + h - 8, w + 8, 10, '#3a3a3c');       // oriel floor
    poly(c, [[x, y], [x + 6, y - 5], [x + w - 6, y - 5], [x + w, y]], '#3c464a');
    box(c, x + w * .5 - 2, y - 7, w * .5 + 6, 4, '#59636a');
  }
  if (kind === 'slot') { box(c, x + 2, y, 2, h, '#4c4a44'); box(c, x + w - 4, y, 2, h, '#4c4a44'); }
  if (kind === 'stack') for (let ry = y + 4; ry < y + h - 6; ry += 12) box(c, x + 1, ry, w - 2, 1.6, '#3f4348');
  if (!boards && !shut) {
    if (kind === 'double' || kind === 'picture' || kind === 'stack') box(c, x + w * .5 - 1.5, y, 3, h, '#20262b');
    if (kind !== 'slot') box(c, x, y + h * .48, w, 2, '#20262b');
    if (kind === 'picture' && o.curtain) {
      for (const [px, pw] of [[x, w * .34], [x + w * .66, w * .34]]) {
        wash(c, px, y, pw, h, [[0, '#d8cdb8aa'], [1, '#6c6152aa']]);
        c.globalAlpha = .3; for (let i = 0; i < 4; i++) box(c, px + i * pw / 4, y, 2, h, '#2a241c'); c.globalAlpha = 1;
      }
    }
    glassSheen(c, x, y, w, h, sd + x, lit ? .08 : .1);
    if (o.wet !== false) rainStreaks(c, x, y, w, h, t, sd + x, '#cfe6ee', lit ? 2 : 3, lit ? .12 : .2);
  }
  if (shut) {
    for (const [px, tone2] of [[x - 7, '#3d5148'], [x + w + 2, '#35463f']]) {
      box(c, px, y - 2, 6, h + 4, tone2);
      for (let i = 0; i < 7; i++) box(c, px + 1, y + 2 + i * 7, 4, 4, '#00000028');
    }
  }
  if (boards) {
    for (let i = 0; i < 3; i++) { const ang = (i - 1) * .38; c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(ang); box(c, -w * .8, -3, w * 1.6, 7, i % 2 ? '#4a3a2c' : '#413324'); box(c, -w * .8, -3, w * 1.6, 1, '#6b563d'); c.restore(); }
  }
  if (ac) {
    box(c, x + w - 4, y + h + 4, 20, 12, '#39434a'); box(c, x + w - 2, y + h + 6, 16, 8, '#1b242b');
    for (let i = 0; i < 3; i++) ring(c, x + w + 6, y + h + 10, 2 + i * 2.4, '#5b6a72', .8);
    wash(c, x + w + 6, y + h + 18, 6, 40 + hash(sd) * 40, [[0, '#0b1015'], [1, 'transparent']]);
  }
  if (plant) {
    box(c, x + 1, y + h - 4, 12, 5, '#5a4436');
    for (let i = 0; i < 5; i++) seg(c, x + 7, y + h - 4, x + 2 + i * 3.4, y + h - 10 - hash(i + sd) * 8, '#3f6b45', 1.2);
  }
  if (sign) neonText(c, sign, x + w / 2, y + h * .68, { color: o.signColor || '#ff6fa8', size: Math.min(13, h * .3), align: 'center', alpha: .8, flick: flicker(t, sd, 5) });
  // sill, drip stain and the light the window throws onto the street
  box(c, x - 5, y + h + 4, w + 10, 4, '#4a4740'); box(c, x - 5, y + h + 4, w + 10, 1, '#6e6a60');
  if (lit) {
    spill(c, x - 6, y + h + 8, w + 12, 20 + h * .45, tone, .17);
    box(c, x - 3, y + h + 9, w + 6, 1.4, tone + '18');
  }
}

/* ------------------------------------------------------------ roof dress */
export function waterTank(c, x, y, s = 1, sd = 0) {
  box(c, x, y - 46 * s, 34 * s, 40 * s, '#2d3a40'); box(c, x, y - 46 * s, 34 * s, 4 * s, '#4c5c62');
  box(c, x + 3 * s, y - 49 * s, 28 * s, 4 * s, '#33444a');
  for (const lx of [x + 3 * s, x + 28 * s]) { box(c, lx, y - 8 * s, 4 * s, 8 * s, '#22303a'); box(c, lx - 4 * s, y - 9 * s, 12 * s, 3 * s, '#2c3c46'); }
  for (let i = 0; i < 3; i++) box(c, x, y - 40 * s + i * 12 * s, 34 * s, 1.4 * s, '#00000030');
}
export function dishSat(c, x, y, r = 12, o = {}) {
  const { t = 0, col = '#3c4a50', sweep = 0 } = o;
  box(c, x - 2, y, 4, 12, '#2b363c');
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * .35 + x) * .04 + sweep);
  c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, r, r * .9, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#0d1418'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, r, r * .9, 0, 0, Math.PI * 2); c.stroke();
  seg(c, 0, 0, 0, -r * .7, '#0d1418', 1.4); dot(c, 0, -r * .7, 2, '#5b6a72');
  c.restore();
}
export function antennaMast(c, x, y, h, o = {}) {
  const { t = 0, blink = '#ff5470', rate = 1.4, col = '#33424b' } = o;
  seg(c, x, y, x, y - h, col, 2.4);
  for (let i = 0; i * 26 < h; i++) { const yy = y - 12 - i * 26; seg(c, x - 8, yy, x + 8, yy - 8, col, 1.4); seg(c, x - 8, yy - 8, x + 8, yy, col, 1.4); }
  const on = (t * rate + x) % 2.4 < .5;
  if (on) { pool(c, x, y - h, 13, blink, .5, true); dot(c, x, y - h, 2.4, '#ffd7de'); }
  dot(c, x, y - h, 1.6, on ? blink : '#6b4048');
}
export function ventStacks(c, x, y, n = 3, sd = 0, t = 0, steam = false) {
  for (let i = 0; i < n; i++) {
    const px = x + i * 13, h = 14 + hash(sd + i) * 22;
    box(c, px, y - h, 8, h, '#2b3a42'); box(c, px - 2, y - h - 3, 12, 4, '#3d4c54'); dot(c, px + 4, y - h - 1, 2, '#0a1116');
    if (steam) { c.save(); for (let k = 0; k < 3; k++) { const p = (t * .22 + i * .3 + k * .33) % 1; c.globalAlpha = (1 - p) * .07; dot(c, px + 4 + Math.sin(t + k + i) * 6, y - h - p * 62, 4 + p * 13, '#c3dde3'); } c.restore(); }
  }
}
export function acFarm(c, x, y, w, sd = 0, t = 0) {
  for (let px = x; px < x + w; px += 24) {
    box(c, px, y, 18, 12, '#39434a'); box(c, px + 2, y + 2, 14, 8, '#1b242b');
    ring(c, px + 9, y + 6, 5, '#63737c', .9);
    const a = t * 6 + px; seg(c, px + 9 - Math.cos(a) * 4, y + 6 - Math.sin(a) * 4, px + 9 + Math.cos(a) * 4, y + 6 + Math.sin(a) * 4, '#7d8c94', .8);
  }
}
export function rooftopKit(c, x, y, w, plan, t) {
  const sd = plan.sd;
  // parapet, then a scatter of plant so every roofline has a different profile.
  parapet(c, x, y - 14, w, { kind: plan.roofKind, col: tone(plan.pal.trim, .6), sd });
  let px = x + 8;
  while (px < x + w - 12) {
    const n = hash(sd + px * .07);
    if (n > .86) { waterTank(c, px, y - 14, .8 + hash(px) * .5, sd); px += 40; }
    else if (n > .74) { dishSat(c, px + 8, y - 14, 9 + hash(px * 2) * 7, { t }); px += 30; }
    else if (n > .62) { ventStacks(c, px, y - 14, 2 + (hash(px * 3) * 2 | 0), px, t, hash(px * 5) > .6); px += 34; }
    else if (n > .52) { antennaMast(c, px + 6, y - 14, 34 + hash(px * 7) * 46, { t, blink: hash(px) > .5 ? '#ff5470' : '#ffc078', rate: .9 + hash(px * 9) }); px += 24; }
    else if (n > .44) { acFarm(c, px, y - 26, 30, sd, t); px += 36; }
    else if (n > .38) { box(c, px, y - 24, 22, 10, '#3a4a52'); box(c, px, y - 24, 22, 2, '#54666e'); px += 26; }
    else px += 12 + hash(px * 11) * 16;
  }
  // sky cable sag between roof and the next block
  if (plan.drop) {
    c.strokeStyle = '#0d1a22'; c.lineWidth = 1.4; c.beginPath();
    c.moveTo(x + w * .5, y - 12); c.quadraticCurveTo(x + w * .5 + 40, y + 6, x + w * .5 + 78, y - 4); c.stroke();
    box(c, x + w * .5 - 2, y - 16, 5, 5, '#22303a');
  }
}
/** Distant tower behind the front: depth without stealing the silhouette. */
export function backdropTower(c, x, y, w, h, pal, sd, t) {
  box(c, x, y - h, w, h, '#0c1826'); box(c, x, y - h, w, 4, '#1d2f3d');
  for (let wy = y - h + 12; wy < y - 20; wy += 15) for (let wx = x + 5; wx < x + w - 6; wx += 11) {
    const n = hash(sd + wx * .17 + wy * .31);
    if (n < .52) continue;
    box(c, wx, wy, 5, 7, n > .93 ? '#c98f5c' : n > .78 ? '#2f7f88' : '#152b38');
  }
  if (hash(sd + 1) > .5) {
    const tw = Math.min(w - 20, 60), tx = x + (w - tw) / 2;
    box(c, tx, y - h - 9, tw, 9, '#101f2c'); box(c, tx, y - h - 9, tw, 2, '#223646');
    for (let i = 0; i < 3; i++) box(c, tx + 4 + i * tw / 3, y - h - 7, 3, 5, '#ffd79a88');
  } else antennaMast(c, x + w * .5, y - h, 40 + hash(sd) * 40, { t, blink: '#ff5470', rate: 1.1 });
}

/* ---------------------------------------------------------- street fabric */
export function drainpipe(c, x, y, h, o = {}) {
  const { col = '#2b3a42', head = true } = o;
  box(c, x, y, 7, h, col); box(c, x, y, 2, h, '#ffffff12'); box(c, x + 5, y, 2, h, '#00000030');
  for (let py = y + 18; py < y + h - 8; py += 42) box(c, x - 2, py, 11, 4, '#3d4a52');
  if (head) { box(c, x - 4, y - 5, 15, 6, '#33424a'); wash(c, x + 3, y + h - 6, 8, 40, [[0, '#0c1218'], [1, 'transparent']]); }
}
export function cableRun(c, x1, y1, x2, y2, sag = 16, o = {}) {
  const { col = '#0d1a22', w = 1.6, n = 1, lit = false } = o;
  for (let k = 0; k < n; k++) {
    const s = sag + k * 5, cc = lit ? '#8a6a3a' : col;
    c.strokeStyle = cc; c.lineWidth = w; c.beginPath();
    c.moveTo(x1, y1 + k * 2); c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + s, x2, y2 + k * 2); c.stroke();
  }
}
export function laundryLine(c, x1, x2, y, o = {}) {
  const { t = 0, sd = 0, col = '#2c3a42', count = 5, warm = false } = o;
  c.strokeStyle = '#26343c'; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, y); c.quadraticCurveTo((x1 + x2) / 2, y + 4, x2, y); c.stroke();
  const pal = warm ? ['#c9a48a', '#8fa3b0', '#b8c2a0'] : ['#8d7f96', '#567b88', '#b29a79', '#7f8ba0', '#a8788a'];
  for (let i = 0; i < count; i++) {
    const p = (i + .5) / count, px = x1 + (x2 - x1) * p, sway = Math.sin(t * 1.4 + sd + i) * 1.6;
    const h = 11 + hash(sd + i) * 10, ww = 8 + hash(i + sd) * 8;
    c.save(); c.translate(px, y + 3); c.rotate(sway * .04);
    poly(c, [[-ww / 2, 0], [ww / 2, 0], [ww / 2 - 1, h], [-ww / 2 + 1, h - 1]], pal[i % pal.length]);
    c.restore();
  }
}
export function balcony(c, x, y, w, o = {}) {
  const { pal = null, t = 0, sd = 0, plants = true, occupantKind = '' } = o;
  const tone = pal ? pal.trim : '#5d5b56';
  box(c, x, y, w, 5, '#7c8288'); box(c, x, y + 5, w, 4, '#3c4348');
  for (let px = x + 8; px < x + w - 6; px += 22) { poly(c, [[px, y + 9], [px + 6, y + 9], [px + 2, y + 16]], '#3c4348'); }
  for (let px = x + 6; px < x + w - 3; px += 9) box(c, px, y - 20, 2.2, 20, '#5e666b');
  box(c, x, y - 22, w, 3, '#8b9298'); box(c, x, y - 19, w, 2, '#00000028');
  if (plants) {
    box(c, x + 6, y - 16, 15, 6, '#5a4436');
    for (let i = 0; i < 5; i++) seg(c, x + 13, y - 16, x + 8 + i * 3.4, y - 24 - hash(i + sd) * 7, '#3f6b45', 1.2);
    if (w > 60 && hash(sd + 3) > .5) { box(c, x + w - 26, y - 14, 20, 6, '#4b5054'); seg(c, x + w - 16, y - 8, x + w - 16, y - 2, '#4b5054', 2); }
  }
  if (occupantKind) occupant(c, x + w * .55, y - 22, .92, { t, sd, task: occupantKind, col: '#141a22', rim: '#9fb8c255' });
}
export function fireEscape(c, x, y, w, h, o = {}) {
  const { t = 0, sd = 0 } = o;
  box(c, x, y, w, 5, '#4c5459'); box(c, x, y + 5, w, 3, '#232c33');
  for (let px = x + 4; px < x + w - 2; px += 8) box(c, px, y - 16, 1.6, 16, '#4c5459');
  box(c, x, y - 18, w, 2.4, '#5d666c');
  for (let px = x + 6; px < x + w - 4; px += 16) box(c, px, y - 18, 2, 18, '#3d464c');
  box(c, x + w - 3, y, 3, h, '#3d464c');
  for (let yy = y + 18; yy < y + h - 20; yy += 24) { box(c, x + w - 14, yy, 12, 3, '#4c5459'); seg(c, x + w - 12, yy, x + w - 2, yy - 12, '#4c5459', 1.6); seg(c, x + w - 12, yy, x + w - 2, yy + 6, '#4c5459', 1.6); }
  if (h > 60) { box(c, x - 2, y + h, 6, 4, '#4c5459'); }
  pool(c, x + w / 2, y, 30, '#ffc078', .05);
}
export function awningFabric(c, x, y, w, o = {}) {
  const { col = '#8d3f4c', stripe = '#e6dcc4', h = 16, sag = 4, sd = 0, t = 0 } = o;
  const n = Math.max(3, Math.round(w / 22));
  for (let i = 0; i < n; i++) {
    const sx = x + i * w / n, sw = w / n, drop = h + Math.sin(i * 1.7 + sd) * sag;
    poly(c, [[sx, y], [sx + sw, y], [sx + sw + 3, y + drop], [sx - 3, y + drop]], i % 2 ? stripe : col);
    box(c, sx - 3, y + drop - 4, sw + 6, 4, i % 2 ? stripe : col);
  }
  box(c, x, y - 3, w, 4, '#2b3339');
  for (let px = x + 10; px < x + w - 8; px += 30) seg(c, px, y, px - 3, y + h + 3, '#00000038', 1.4);
  if (sd % 2 === 0) { // rainwater tracking off the edge
    c.globalAlpha = .3; for (let i = 0; i < 3; i++) { const p = (t * 1.6 + i * .37) % 1; dot(c, x + w * .3 + i * w * .3, y + h + p * 40, 1.1, '#bcd8e2'); } c.globalAlpha = 1;
  }
}
export function bladeSign(c, x, y, w, h, o = {}) {
  const { color = '#ff7ab0', t = 0, sd = 0, word = '', glyph = false, swing = 1, back = '#0d1c26' } = o;
  box(c, x - 16, y + h * .3, 18, 4, '#26333c');                    // bracket arm
  box(c, x - 16, y + h * .3, 4, 14, '#26333c');
  box(c, x, y, w, h, back); frame(c, x + 2, y + 2, w - 4, h - 4, color + '88', 1);
  const f = flicker(t, sd + x, 5);
  if (word) {
    const fs = Math.min(w * .58, (h - 8) / Math.max(1, word.length * .62));
    if (glyph) {
      for (let i = 0; i < word.length; i++) neonText(c, word[i], x + w / 2, y + h / 2 + fs * .36, { color, size: fs, align: 'center', alpha: .95, flick: f });
    } else neonText(c, word, x + w / 2, y + h / 2 + 5, { color, size: fs, align: 'center', alpha: .95, flick: f });
  } else tubeRect(c, x + 7, y + 7, w - 14, h - 14, color, { flick: f, bloom: 1.2 });
  // chase bulbs around the frame sell the electricity bill
  const per = Math.max(2, ((h - 10) / 13) | 0);
  for (let i = 0; i < per; i++) {
    const on = ((t * 2.2 + i / per + sd) % 1) < .42;
    dot(c, x + w - 5, y + 9 + i * 13, 1.5, on ? '#fff0c0' : '#6a5a44');
  }
  if (swing) {
    c.save(); c.translate(x, y + h * .3); c.rotate(Math.sin(t * .7 + x) * .014); c.translate(-x, -(y + h * .3));
    box(c, x, y, w, h, 'transparent'); c.restore();
  }
  pool(c, x + w / 2, y + h / 2, w * 1.5, color, .1, true);
}
export function lightBox(c, x, y, w, h, o = {}) {
  const { color = '#9fe8f0', t = 0, sd = 0, word = '' } = o;
  const f = flicker(t, sd, 4);
  box(c, x - 3, y - 3, w + 6, h + 6, '#101c24');
  box(c, x, y, w, h, color + '22');
  if (word) neonText(c, word, x + w / 2, y + h / 2 + 5, { color, size: Math.min(h * .55, w / (word.length * .62)), align: 'center', alpha: 1, flick: f });
  else tubeRect(c, x + 5, y + 5, w - 10, h - 10, color, { flick: f });
  box(c, x, y, w, 2, '#00000038'); box(c, x, y + h - 2, w, 2, '#00000038');
  pool(c, x + w / 2, y + h / 2, Math.max(w, h) * 1.2, color, .1, true);
}
/** Neon script painted on the shop glass (a decal, not a floating label). */
export function windowScript(c, x, y, w, text, o = {}) {
  const { color = '#ff7ab0', size = 16, t = 0, sd = 0, align = 'center' } = o;
  neonText(c, text, align === 'center' ? x + w / 2 : x, y, { color, size, align, alpha: .85, flick: flicker(t, sd, 3), halo: 1.2 });
}

/* -------------------------------------------------------------- pavement */
export function pavement(c, x, w, o = {}) {
  const { pal = null, sd = 0, wet = true } = o;
  box(c, x, KERB, w, WALK - KERB + 2, '#141d26');
  wash(c, x, KERB, w, WALK - KERB, [[0, '#1d2a33'], [1, '#0c1218']]);
  for (let px = x; px < x + w; px += 46) { box(c, px, KERB, 1.4, WALK - KERB, '#00000038'); }
  box(c, x, KERB, w, 2, '#3d4b52'); box(c, x, KERB + 2, w, 1, '#00000040');
  if (wet) {
    c.globalAlpha = .1;
    for (let i = 0; i < w / 26; i++) { const px = x + hash(sd + i * 2.3) * w; box(c, px, KERB + 4 + hash(sd + i * 5.1) * 2, 10 + hash(i + sd) * 26, 1.4, '#8fc6d4'); }
    c.globalAlpha = 1;
  }
}
export function tactileStrip(c, x, w, y = KERB + 1) {
  box(c, x, y, w, 4, '#3f4a3f'); c.globalAlpha = .5;
  for (let px = x + 2; px < x + w - 2; px += 6) dot(c, px, y + 2, 1.2, '#c8c39a'); c.globalAlpha = 1;
}
/** Smeared vertical reflection of a light source on wet ground. */
export function wetSmear(c, x, w, yBase, h, color, t, sd = 0, alpha = .22) {
  if (w <= 0) return;
  const wob = Math.sin(t * 1.7 + sd) * .04;
  c.save(); c.globalAlpha = alpha;
  wash(c, x, yBase - h, w, h, [[0, 'transparent'], [.55, color + '80'], [1, color]]);
  c.translate(0, 0); c.rotate(0);
  c.globalAlpha = alpha * .5;
  for (let i = 0; i < 6; i++) {
    const yy = yBase - h + (i + .5) / 6 * h + Math.sin(t * 2 + i + sd) * 1.2;
    box(c, x + 2 + Math.sin(t * 1.3 + i * 1.7 + sd) * 2, yy, w - 4 - hash(i + sd) * w * .3, 1.2, '#000000');
  }
  c.restore();
  c.globalAlpha = 1;
}
export function puddle(c, x, y, w, h, color, t, sd = 0, alpha = .3) {
  if (w <= 0) return;
  c.save(); c.globalAlpha = alpha;
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = alpha * .9; c.strokeStyle = '#bfe6f0'; c.lineWidth = 1;
  for (let i = 0; i < 2; i++) { const p = ((t * .5 + i * .5 + hash(sd + i)) % 1); c.beginPath(); c.ellipse(x, y, w * .5 * p, h * .5 * p, 0, 0, Math.PI * 2); c.stroke(); }
  c.restore(); c.globalAlpha = 1;
}
export function drainGrate(c, x, y, w = 26, h = 10) {
  box(c, x, y, w, h, '#0b1118'); frame(c, x, y, w, h, '#3c4a52', 1.4);
  for (let px = x + 3; px < x + w - 2; px += 4) box(c, px, y + 2, 2, h - 4, '#2a343b');
}
export function manhole(c, x, y, r = 11) {
  dot(c, x, y, r, '#151d24'); ring(c, x, y, r, '#39464e', 1.4); ring(c, x, y, r * .6, '#2b363d', 1);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; dot(c, x + Math.cos(a) * r * .4, y + Math.sin(a) * r * .4, 1, '#0c1218'); }
}
export function pavementLamp(c, x, y, o = {}) {
  const { t = 0, sd = 0, color = '#ffd39a', h = 132, col = '#2b3a42', flickerRate = 3.4, cone = true } = o;
  box(c, x - 3, y - h, 6, h, col); box(c, x - 3, y - h, 2, h, '#ffffff14');
  box(c, x - 8, y - 8, 16, 8, '#22303a');
  const f = flicker(t, sd, flickerRate);
  box(c, x - 16, y - h - 8, 30, 8, '#39474f'); box(c, x - 13, y - h - 4, 24, 4, color + (f > .5 ? '' : '55'));
  box(c, x - 2, y - h - 22, 4, 16, '#39474f');
  pool(c, x, y - h - 2, 40, color, .3 * f, true);
  if (cone) {
    // stacked translucent trapezoids read as a soft cone instead of a hard wedge
    for (let i = 0; i < 4; i++) {
      const k = i / 4, spread = 14 + k * 40, top = y - h + 2, drop = (y - top) * (1 - k * .1);
      poly(c, [[x - 11 - k * 3, top], [x + 11 + k * 3, top], [x + spread, top + drop], [x - spread, top + drop]], color + (0.055 - i * .008).toString(16).padStart(2, '0'));
    }
    spill(c, x - 44, y - h, 88, h, color, .1 * f);
  }
  pool(c, x, y - 4, 46, color, .12 * f);
}
export function benchProp(c, x, y, o = {}) {
  const { col = '#4a5a5f' } = o;
  box(c, x, y - 16, 62, 4, col); box(c, x, y - 12, 62, 3, '#33424a');
  box(c, x + 2, y - 30, 58, 4, col); box(c, x + 2, y - 26, 58, 3, '#33424a');
  for (const lx of [x + 6, x + 50]) { box(c, lx, y - 12, 4, 12, '#2a363c'); box(c, lx, y - 30, 4, 22, '#2a363c'); }
  box(c, x + 16, y - 8, 14, 3, '#6b5a4a');
}
export function litterBin(c, x, y, o = {}) {
  const { color = '#38d8d0' } = o;
  box(c, x, y - 34, 26, 34, '#26343c'); box(c, x + 2, y - 34, 4, 34, '#ffffff12');
  box(c, x - 2, y - 38, 30, 5, '#39474f'); box(c, x + 4, y - 30, 18, 3, color + '88');
  for (let i = 0; i < 4; i++) box(c, x + 3 + i * 6, y - 26, 3, 18, '#00000030');
}
export function planterBox(c, x, y, o = {}) {
  const { w = 34, seed = 0 } = o;
  box(c, x, y - 15, w, 15, '#3a3128'); box(c, x, y - 15, w, 3, '#5c4d3c');
  for (let i = 0; i < 8; i++) {
    const px = x + 3 + hash(seed + i * 1.7) * (w - 6), hh = 8 + hash(seed + i * 3.3) * 14;
    seg(c, px, y - 15, px + (hash(seed + i * 5.1) - .5) * 8, y - 15 - hh, hash(seed + i * 7.3) > .5 ? '#3f6b45' : '#557a4a', 1.2);
  }
}
export function crateStack(c, x, y, n = 3, o = {}) {
  const { col = '#4a4034', sd = 0 } = o;
  for (let i = 0; i < n; i++) {
    const s = 24 - i * 2, ox = (hash(sd + i) - .5) * 5;
    box(c, x + ox, y - s * (i + 1), s, s, i % 2 ? col : '#3f382e');
    frame(c, x + ox + 2, y - s * (i + 1) + 2, s - 4, s - 4, '#00000038', 1);
    box(c, x + ox, y - s * (i + 1) + s * .5, s, 2, '#00000028');
  }
}
export function dumpster(c, x, y, o = {}) {
  const { col = '#2c4440', sd = 0, lid = false } = o;
  box(c, x, y - 40, 66, 40, col); box(c, x + 2, y - 40, 62, 3, '#ffffff14');
  poly(c, [[x - 2, y - 40], [x + 68, y - 40], [x + 64, y - 48], [x + 2, y - 48]], lid ? '#1d302e' : '#3a5450');
  for (let i = 0; i < 5; i++) box(c, x + 4 + i * 13, y - 36, 3, 32, '#00000024');
  box(c, x + 28, y - 44, 12, 5, '#8a9a92');
  box(c, x + 4, y - 4, 10, 4, '#0a1014'); box(c, x + 52, y - 4, 10, 4, '#0a1014');
  for (let i = 0; i < 3; i++) box(c, x + 6 + hash(sd + i) * 50, y - 42, 5 + hash(i + sd) * 8, 2, '#c9c2a8');
}
export function utilityBox(c, x, y, o = {}) {
  const { color = '#ffb45c', label = 'MUNICIPAL', sd = 0 } = o;
  box(c, x, y - 46, 30, 46, '#2a3840'); box(c, x, y - 46, 30, 3, '#4a5c64');
  box(c, x + 3, y - 42, 24, 14, '#1a242b'); for (let i = 0; i < 3; i++) box(c, x + 5 + i * 7, y - 39, 4, 3, hash(sd + i) > .5 ? color : '#243038');
  box(c, x + 6, y - 24, 18, 3, '#5b6a72');
  plainText(c, label, x + 15, y - 14, { color: '#8fa4ac', size: 6, align: 'center' });
  wash(c, x + 14, y - 6, 6, 24, [[0, '#0b1015'], [1, 'transparent']]);
}
export function barrierProp(c, x, y, w = 44, o = {}) {
  const { color = '#c9a24a' } = o;
  poly(c, [[x, y], [x + w, y], [x + w - 5, y - 20], [x + 5, y - 20]], '#5c5a52');
  box(c, x + 4, y - 14, w - 8, 4, color); box(c, x + 4, y - 8, w - 8, 3, '#2a2b28');
  for (let i = 0; i < 4; i++) box(c, x + 6 + i * 10, y - 20, 5, 20, '#00000020');
}
export function bollard(c, x, y, o = {}) {
  const { color = '#8fd0c8', h = 26 } = o;
  box(c, x - 3, y - h, 6, h, '#2f3d45'); box(c, x - 3, y - h, 2, h, '#ffffff16');
  box(c, x - 3, y - h + 4, 6, 3, color + 'aa'); dot(c, x, y - h + 2, 1.4, color);
}
export function aBoard(c, x, y, o = {}) {
  const { word = 'SOUP', color = '#e8dcc0', t = 0, sd = 0 } = o;
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * .8 + sd) * .02);
  poly(c, [[-14, 0], [14, 0], [17, -34], [-17, -34]], '#2b2119');
  box(c, -12, -31, 24, 27, '#3b2f24');
  plainText(c, word, 0, -22, { color, size: 8, align: 'center' });
  plainText(c, 'OPEN', 0, -11, { color: '#d8a05a', size: 6, align: 'center' });
  c.restore();
}
export function parasolTable(c, x, y, o = {}) {
  const { color = '#b0405a', t = 0, sd = 0 } = o;
  box(c, x - 3, y - 26, 6, 26, '#2f3d45'); box(c, x - 14, y - 3, 28, 3, '#3b4850');
  poly(c, [[x - 26, y - 26], [x + 26, y - 26], [x + 18, y - 38], [x - 18, y - 38]], color);
  for (let i = 0; i < 5; i++) box(c, x - 26 + i * 11, y - 26, 5, 10, i % 2 ? '#e8dcc0' : color);
  for (const s of [-1, 1]) { dot(c, x + s * 20, y - 12, 5, '#3b4850'); box(c, x + s * 20, y - 12, 2.4, 12, '#2a343b'); }
}
export function bicycle(c, x, y, o = {}) {
  const { col = '#2f4a52', sd = 0 } = o;
  for (const wx of [x, x + 30]) { ring(c, wx, y - 9, 9, '#0e161c', 2.4); ring(c, wx, y - 9, 6, '#00000000', 1); }
  seg(c, x, y - 9, x + 12, y - 22, col, 2); seg(c, x + 12, y - 22, x + 30, y - 9, col, 2);
  seg(c, x + 12, y - 22, x + 20, y - 20, col, 2); seg(c, x + 30, y - 9, x + 22, y - 25, col, 2);
  box(c, x + 18, y - 27, 9, 3, '#4a5a5f'); seg(c, x + 22, y - 25, x + 22, y - 14, col, 2);
  seg(c, x + 28, y - 26, x + 24, y - 30, col, 2);
}
export function steamColumn(c, x, y, t, o = {}) {
  const { sd = 0, rise = 78, r = 13, alpha = .1, col = '#c3dde3', n = 4 } = o;
  c.save();
  for (let i = 0; i < n; i++) {
    const p = ((t * .3 + i / n + hash(sd + i) * .3) % 1), yy = y - p * rise, xx = x + Math.sin(t * 1.1 + i * 1.7 + sd) * (5 + p * 10);
    c.globalAlpha = (1 - p) * alpha; dot(c, xx, yy, r * (.35 + p), col);
  }
  c.restore(); c.globalAlpha = 1;
}
export function ventGrate(c, x, y, w, h, t, o = {}) {
  const { sd = 0, steam = true, col = '#2b3a42' } = o;
  box(c, x, y, w, h, col); frame(c, x, y, w, h, '#445159', 1.2);
  for (let py = y + 4; py < y + h - 2; py += 7) box(c, x + 3, py, w - 6, 3, '#0b1118');
  if (steam) steamColumn(c, x + w / 2, y, t, { sd, rise: 90, r: 12, alpha: .09 });
}
/** Dark recess between buildings: side alley, fire door, bin store. */
export function alleyMouth(c, x, y, w, h, o = {}) {
  const { t = 0, sd = 0, color = '#ffc078' } = o;
  box(c, x, y, w, h, '#070c12');
  wash(c, x, y, w, h, [[0, '#03070b'], [1, '#0b141c']]);
  box(c, x + w * .2, y + h * .12, w * .5, h * .88, '#0b1219');
  // fire door with a lit stair sign: the depth cue that says "city continues"
  box(c, x + w * .3, y + h * .3, 34, h * .7, '#1c2830'); frame(c, x + w * .3, y + h * .3, 34, h * .7, '#31424b', 1.4);
  box(c, x + w * .3 + 12, y + h * .3 + 8, 3, 3, '#9fb2b8');
  neonText(c, 'STAIR', x + w * .52, y + h * .2, { color, size: 8, alpha: .75, flick: flicker(t, sd, 3) });
  box(c, x + 2, y, 6, h, '#141d25'); box(c, x + w - 8, y, 6, h, '#141d25');
  pipeRunAt(c, x + w * .72, y, h, sd);
  pool(c, x + w / 2, y + h * .78, w * .7, color, .05);
}
export function pipeRunAt(c, x, y, h, sd = 0) {
  for (let i = 0; i < 3; i++) box(c, x + i * 5, y + 4, 3, h - 8, i === 1 ? '#3d4a52' : '#2a3640');
  for (let py = y + 26; py < y + h - 10; py += 60) box(c, x - 2, py, 19, 4, '#44525a');
}
export function exteriorStairs(c, x, y, o = {}) {
  const { steps = 6, rise = 11, run = 9, dir = 1, col = '#33414a' } = o;
  for (let i = 0; i < steps; i++) { box(c, x + dir * i * run, y - (i + 1) * rise, run + 1, rise + 1, i % 2 ? col : '#3b4a53'); box(c, x + dir * i * run, y - (i + 1) * rise, run + 1, 2, '#5d6b73'); }
  seg(c, x + dir * (steps * run - 6), y - steps * rise - 16, x + dir * (steps * run), y - 6, '#4c5a62', 2);
}
export function fenceMesh(c, x, y, w, h, o = {}) {
  const { col = '#3d4a52', sd = 0, barbed = false } = o;
  for (let px = x; px < x + w; px += 10) { box(c, px, y - h, 2, h, col); }
  for (let py = y - h; py < y; py += 9) box(c, x, py, w, 1.2, col + '88');
  for (let px = x; px < x + w; px += 26) box(c, px, y - h - 4, 4, h + 4, '#4d5b63');
  box(c, x, y - h, w, 3, '#55646c');
  if (barbed) {
    for (let px = x + 6; px < x + w - 6; px += 16) {
      for (let k = 0; k < 3; k++) ring(c, px + k * 5, y - h - 10, 4, '#8fa2aa', 1);
      seg(c, px, y - h - 8, px + 10, y - h - 14, '#8fa2aa', 1);
    }
  }
}
export function holoPanel(c, x, y, w, h, color, t, o = {}) {
  const { sd = 0, bands = 5 } = o;
  const a = .12 + .06 * Math.sin(t * 2.4 + x);
  c.save(); c.globalAlpha = a; box(c, x, y, w, h, color); c.globalAlpha = a * 2.4;
  for (let yy = y; yy < y + h; yy += 5) box(c, x, yy + (t * 18) % 5, w, 1.2, color);
  c.globalAlpha = a * 3.4; c.strokeStyle = color; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, w - 1, h - 1);
  c.globalAlpha = .5; plainText(c, `L${10 + (Math.floor(t / 6 + sd) % 40)}`, x + 4, y + 12, { color: '#ffffff', size: 8 });
  c.restore(); c.globalAlpha = 1;
  pool(c, x + w / 2, y + h / 2, Math.max(w, h) * 1.4, color, .07, true);
}
/** Parked hover vehicle at the kerb, behind the walking lane. */
export function vehicle(c, x, y, o = {}) {
  const { kind = 'taxi', t = 0, sd = 0, body = '#43585c', glass = '#17313e', lit = '#ffce8a' } = o;
  const bob = Math.sin(t * 1.6 + sd) * .8;
  if (kind === 'taxi') {
    box(c, x, y - 4, 132, 4, '#00000038');
    for (const wx of [x + 26, x + 104]) { ring(c, wx, y - 12 + bob, 9, '#0b1116', 3); dot(c, wx, y - 12 + bob, 5, '#1b2a32'); }
    poly(c, [[x + 2, y - 6], [x + 8, y - 26 + bob], [x + 34, y - 44 + bob], [x + 100, y - 44 + bob], [x + 126, y - 26 + bob], [x + 132, y - 6]], body);
    poly(c, [[x + 14, y - 28 + bob], [x + 36, y - 41 + bob], [x + 62, y - 41 + bob], [x + 62, y - 25 + bob]], glass);
    poly(c, [[x + 68, y - 41 + bob], [x + 98, y - 41 + bob], [x + 118, y - 28 + bob], [x + 68, y - 25 + bob]], glass);
    box(c, x + 4, y - 14, 124, 4, '#0e1a22');
    box(c, x + 124, y - 20, 8, 5, lit); box(c, x + 2, y - 20, 5, 4, '#c96a5a');
    box(c, x + 52, y - 50, 28, 6, '#1b2a32'); box(c, x + 56, y - 49, 20, 4, '#ffd88a');
    box(c, x + 6, y - 24, 16, 8, '#26343c');
    for (let i = 0; i < 3; i++) box(c, x + 20 + i * 40, y - 32 + bob, 14, 3, i % 2 ? '#b6c7bd' : '#8fa2a8');
  } else if (kind === 'van') {
    box(c, x, y - 4, 150, 4, '#00000038');
    for (const wx of [x + 28, x + 122]) { ring(c, wx, y - 11 + bob, 8, '#0b1116', 3); }
    poly(c, [[x + 2, y - 6], [x + 2, y - 46 + bob], [x + 18, y - 58 + bob], [x + 148, y - 58 + bob], [x + 150, y - 6]], body);
    box(c, x + 12, y - 52 + bob, 22, 20, glass); box(c, x + 40, y - 54, 60, 12, '#2a3a42');
    for (let i = 0; i < 4; i++) box(c, x + 46 + i * 14, y - 52, 8, 8, i % 2 ? '#7a8a90' : '#9aa8ac');
    box(c, x + 146, y - 20, 6, 6, lit); box(c, x, y - 22, 4, 5, '#c96a5a');
    box(c, x + 44, y - 62, 34, 5, '#33434b'); box(c, x + 48, y - 61, 26, 3, '#8fd6c8');
    box(c, x + 96, y - 34, 40, 18, '#22303a'); plainText(c, 'NIGHT LINE', x + 116, y - 22, { color: '#c9d6d2', size: 7, align: 'center' });
  } else if (kind === 'barrow') {
    box(c, x, y - 3, 60, 3, '#00000038');
    for (const wx of [x + 10, x + 50]) ring(c, wx, y - 8, 7, '#0b1116', 2.6);
    poly(c, [[x, y - 16], [x + 60, y - 16], [x + 56, y - 40], [x + 4, y - 40]], '#4a4238');
    box(c, x + 6, y - 44, 48, 5, '#5d5346'); crateStack(c, x + 8, y - 44, 2, { sd });
    seg(c, x + 56, y - 30, x + 74, y - 26, '#3b4a52', 2.4);
  } else { // cargo loader with a lit cage
    box(c, x, y - 4, 120, 4, '#00000038');
    for (const wx of [x + 24, x + 96]) ring(c, wx, y - 12 + bob, 9, '#0b1116', 3);
    box(c, x + 2, y - 32, 116, 30, body); box(c, x + 2, y - 32, 116, 3, '#ffffff18');
    box(c, x + 70, y - 50, 40, 20, glass);
    box(c, x + 74, y - 46, 32, 12, '#26343c');
    for (let i = 0; i < 5; i++) box(c, x + 8 + i * 13, y - 26, 4, 20, '#00000028');
    box(c, x + 108, y - 26, 8, 4, lit);
  }
  wetSmear(c, x + 10, 60, y, 46, lit, t, sd, .1);
}

/* ------------------------------------------------------------ base sites */
const SITE_FLAVOR = {
  'market-relay': 'relay', 'watch-house': 'garrison', 'spire-relay': 'relay',
  archive: 'fortress', saints: 'club', 'stacks-coop': 'coop',
  'cinder-yard': 'foundry', glass: 'executive'
};
/** Which base owns this stretch of street, and does it reach the pavement? */
export function siteFor(x) {
  for (const b of BASES) if (x >= b.x - 120 && x <= b.x + b.w + 120) {
    const atStreet = b.y <= GROUND + 30 && b.y + b.h >= KERB;
    return { id: b.id, name: b.name, rule: b.rule, color: b.color, faction: b.faction, flavor: SITE_FLAVOR[b.id] || 'street', atStreet, base: b };
  }
  return null;
}

/* -------------------------------------------------------------- interiors */
export function pendantLamp(c, x, y, o = {}) {
  const { t = 0, sd = 0, color = '#ffd39a', len = 30, r = 12 } = o;
  box(c, x - .8, y - len, 1.6, len, '#39474f');
  poly(c, [[x - r, y - len + 8], [x + r, y - len + 8], [x + 4, y - len], [x - 4, y - len]], '#33424a');
  const f = flicker(t, sd, 4);
  dot(c, x, y - len + 9, 3, color + (f > .5 ? '' : '44'));
  pool(c, x, y - len + 12, r * 3.4, color, .2 * f, true);
  spill(c, x - r * 2, y - len + 8, r * 4, len + 60, color, .09 * f);
}
export function stripLight(c, x, y, w, o = {}) {
  const { color = '#cfe9ee', tube2 = true } = o;
  box(c, x, y, w, 5, '#2c3a42'); box(c, x + 2, y + 1, w - 4, 3, color);
  if (tube2) pool(c, x + w / 2, y + 2, w * .6, color, .12, true);
}
export function pinBoard(c, x, y, w, h, o = {}) {
  const { sd = 0, notes = ['REWARD', 'LOST', 'SHIFT'], color = '#c9b98f' } = o;
  box(c, x, y, w, h, '#3a3026'); box(c, x, y, w, 3, '#5a4b3a');
  for (let i = 0; i < notes.length; i++) {
    const px = x + 5 + (i * 37) % Math.max(10, w - 22), py = y + 7 + ((i * 23) % Math.max(8, h - 24));
    c.save(); c.translate(px, py); c.rotate((hash(sd + i) - .5) * .3);
    box(c, 0, 0, 17, 21, color); plainText(c, notes[i], 8, 8, { color: '#2a2018', size: 5.4, align: 'center' });
    plainText(c, `0${1 + (i * 3) % 7}`, 8, 17, { color: '#6b5a3f', size: 5, align: 'center' });
    dot(c, 8, 1, 1.4, '#b34b3f'); c.restore();
  }
}
export function ceilingFan(c, x, y, t, o = {}) {
  const { r = 26, speed = 2.4 } = o;
  box(c, x - 3, y - 16, 6, 16, '#39474f');
  c.save(); c.translate(x, y - 16); c.rotate(t * speed);
  for (let i = 0; i < 3; i++) { c.rotate(Math.PI * 2 / 3); poly(c, [[0, -2], [r, -6], [r, -1], [0, 3]], '#4a5a60'); }
  dot(c, 0, 0, 4, '#5d6d72'); c.restore();
  c.globalAlpha = .12; ring(c, x, y - 16, r + 6, '#cfe4ea', 1); c.globalAlpha = 1;
}
export function dustMotes(c, x, y, w, h, t, o = {}) {
  const { sd = 0, n = 14, col = '#e6f2f4' } = o;
  c.save();
  for (let i = 0; i < n; i++) {
    const sp = 3 + hash(sd + i) * 7;
    const mx = x + ((hash(sd + i * 3.1) * w + Math.sin(t * .2 + i) * 14) % w);
    const my = y + ((hash(sd + i * 5.7) * h - t * sp) % h + h) % h;
    c.globalAlpha = .1 + hash(i + sd) * .2; dot(c, mx, my, .8 + hash(i * 7 + sd), col);
  }
  c.restore(); c.globalAlpha = 1;
}
export function monitorBank(c, x, y, w, h, o = {}) {
  const { t = 0, sd = 0, color = '#7fd6e6', rows = 5, label = '' } = o;
  box(c, x, y, w, h, '#1a242b'); frame(c, x, y, w, h, '#3d4c54', 1.4);
  for (let i = 0; i < rows; i++) {
    const ry = y + 4 + i * ((h - 8) / rows);
    box(c, x + 4, ry, w - 8, (h - 8) / rows - 3, '#08161e');
    for (let k = 0; k < 5; k++) {
      const px = x + 6 + k * ((w - 12) / 5);
      const on = hash(Math.floor(t * 3 + sd) + i * 3 + k) > .4;
      box(c, px, ry + 2, ((w - 12) / 5) - 3, ((h - 8) / rows) - 7, on ? color + '55' : '#12222b');
    }
  }
  if (label) plainText(c, label, x + 4, y + h - 3, { color: '#9fb6bc', size: 6 });
  pool(c, x + w / 2, y + h / 2, w, color, .06, true);
}
export function equalizerBars(c, x, y, w, h, t, o = {}) {
  const { sd = 0, color = '#ff7ab0', n = 10 } = o;
  for (let i = 0; i < n; i++) {
    const v = (hash(Math.floor(t * 6 + sd) + i * 3.7) * .8 + .2) * h;
    box(c, x + i * (w / n), y + h - v, w / n - 2, v, color + 'cc');
    box(c, x + i * (w / n), y + h - v, w / n - 2, 2, '#fff');
  }
  pool(c, x + w / 2, y + h / 2, w * .8, color, .12, true);
}
export function shelfBottles(c, x, y, w, h, o = {}) {
  const { t = 0, sd = 0, rows = 3, back = '#1a1410' } = o;
  box(c, x, y, w, h, back);
  for (let r = 0; r < rows; r++) {
    const sy = y + 4 + r * ((h - 4) / rows);
    box(c, x, sy + 12, w, 3, '#4a3a2a');
    for (let i = 0; i < 8; i++) {
      const bx = x + 4 + i * ((w - 8) / 8), bh = 7 + hash(sd + r * 5 + i) * 6;
      const hue = hash(sd + i + r) > .6 ? '#4d7a52' : hash(sd + i * 2 + r) > .4 ? '#7a4a52' : '#6a5a34';
      box(c, bx, sy + 12 - bh, (w - 8) / 8 - 3, bh, hue + 'cc');
      box(c, bx + 1, sy + 9 - bh, (w - 8) / 8 - 5, 2, '#d9cfae55');
    }
  }
  pool(c, x + w / 2, y + h / 2, w, '#ffb45c', .07, true);
}
export function flameRow(c, x, y, w, h, t, o = {}) {
  const { sd = 0, n = 5, color = '#ff9a4a' } = o;
  box(c, x, y, w, h, '#1b1a18');
  for (let i = 0; i < n; i++) {
    const fx = x + 4 + i * (w - 8) / n, f = .6 + .4 * Math.sin(t * 9 + i * 2.1 + sd);
    poly(c, [[fx, y + h], [fx + 3, y + h * .5 * f], [fx + (w - 8) / n * .5, y + h * .12 * f], [fx + (w - 8) / n - 3, y + h * .5 * f], [fx + (w - 8) / n, y + h]], color + 'cc');
    poly(c, [[fx + 2, y + h], [fx + (w - 8) / n * .5, y + h * .3 * f], [fx + (w - 8) / n - 2, y + h]], '#ffe08a');
  }
  pool(c, x + w / 2, y + h / 2, w, color, .2, true);
}
export function windowRain(c, x, y, w, h, o = {}) {
  const { t = 0, sd = 0, color = '#3f8fa0', warm = null } = o;
  box(c, x - 4, y - 4, w + 8, h + 8, '#1c262c');
  box(c, x, y, w, h, '#06131e');
  wash(c, x, y, w, h, [[0, '#123040'], [1, warm ? warm + '44' : '#08161f']]);
  if (warm) pool(c, x + w * .3, y + h * .4, w * .8, warm, .1, true);
  // distant city across the street, out of focus
  c.globalAlpha = .5;
  for (let i = 0; i < 6; i++) {
    const bw = 12 + hash(sd + i * 3.3) * 22, bx = x + hash(sd + i * 7.1) * (w - bw);
    box(c, bx, y + h * .28, bw, h * .72, '#0c1c28');
    for (let k = 0; k < 5; k++) if (hash(sd + i * 2 + k) > .55) box(c, bx + 2 + k * 5, y + h * .34 + k * 11, 3, 5, hash(sd + k + i) > .8 ? '#d09a5e' : '#2f7f88');
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    const px = x + hash(sd + i * 5.1) * w;
    box(c, px + w / 6, y, w / 3, h, '#00000022');
  }
  box(c, x + w * .5 - 3, y, 6, h, '#33474e'); box(c, x, y + h * .5 - 2, w, 5, '#33474e');
  box(c, x + 2, y + 2, w - 4, h - 4, 'transparent');
  rainStreaks(c, x, y, w, h, t, sd + x, '#d3ecf4', 9, .3);
  box(c, x - 6, y + h, w + 12, 6, '#3a4650'); box(c, x - 6, y + h, w + 12, 2, '#63717a');
  pool(c, x + w / 2, y + h / 2, Math.max(w, h) * 1.1, '#9fd8e4', .06);
}
export function neonWord(c, x, y, word, o = {}) {
  const { color = '#ff7ab0', size = 26, t = 0, sd = 0, align = 'center' } = o;
  neonText(c, word, x, y, { color, size, align, alpha: .9, flick: flicker(t, sd, 5), halo: 1.4 });
  pool(c, x, y - size * .3, size * word.length * .7, color, .1, true);
}
export function rugMat(c, x, y, w, h, o = {}) {
  const { sd = 0, col = '#6a3a44', trim = '#c9a86a' } = o;
  box(c, x, y, w, h, col + '66'); frame(c, x + 2, y + 2, w - 4, h - 4, trim + '55', 1.4);
  c.globalAlpha = .2; for (let i = 0; i < 6; i++) box(c, x + 4 + i * (w - 8) / 6, y + 3, 2, h - 6, '#000000'); c.globalAlpha = 1;
}
export function ductRun(c, x, y, w, h = 12, o = {}) {
  const { col = '#3a4650' } = o;
  box(c, x, y, w, h, col); box(c, x, y, w, 2, '#ffffff14'); box(c, x, y + h - 2, w, 2, '#00000030');
  for (let px = x + 12; px < x + w - 6; px += 34) box(c, px, y - 1, 3, h + 2, '#2b353d');
}
export function stoolProp(c, x, y, o = {}) {
  const { col = '#8a5a3a', h = 20 } = o;
  box(c, x - 9, y - h, 18, 4, col); box(c, x - 7, y - h + 4, 14, 2, '#00000040');
  for (const lx of [x - 6, x + 6]) { seg(c, lx, y - h + 4, lx + (lx < x ? -2 : 2), y, '#4a3a2e', 2); }
  ring(c, x, y - h * .5, 7, '#4a3a2e', 1.4);
}
export function tableTop(c, x, y, w, o = {}) {
  const { h = 34, col = '#5a4030', top = '#7d5c44' } = o;
  box(c, x, y - h, w, 5, top); box(c, x, y - h + 5, w, 3, '#00000030');
  for (const lx of [x + 8, x + w - 12]) box(c, lx, y - h + 8, 5, h - 8, col);
}
export function jukeboxProp(c, x, y, o = {}) {
  const { t = 0, sd = 0, col = '#8a3a4a' } = o;
  box(c, x, y - 46, 30, 46, col); box(c, x, y - 46, 30, 3, '#ffffff18');
  poly(c, [[x, y - 46], [x + 30, y - 46], [x + 22, y - 58], [x + 8, y - 58]], '#6a2a38');
  box(c, x + 4, y - 42, 22, 18, '#0e1a22');
  equalizerBars(c, x + 6, y - 40, 18, 14, t, { sd, color: '#ffb45c', n: 6 });
  box(c, x + 5, y - 22, 20, 4, '#3a2a30');
  for (let i = 0; i < 6; i++) dot(c, x + 6 + i * 4, y - 20, 1.3, i % 2 ? '#d9c08a' : '#8a7a6a');
  box(c, x + 4, y - 10, 22, 8, '#2a1c22');
  pool(c, x + 15, y - 32, 40, '#ff7ab0', .1, true);
}
export function mugBoard(c, x, y, cols = 5, rows = 3, sd = 0) {
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const px = x + i * 15, py = y + r * 17;
    box(c, px, py, 11, 13, '#2a3038'); box(c, px + 1, py + 1, 9, 11, hash(sd + r * 5 + i) > .5 ? '#8a9aa0' : '#b0a08a');
    dot(c, px + 5.5, py + 6, 2.2, '#4a4038');
  }
}
export function lockerBank(c, x, y, w, h, o = {}) {
  const { sd = 0, col = '#3b4a52' } = o;
  box(c, x, y - h, w, h, col);
  const n = Math.max(2, Math.floor(w / 24));
  for (let i = 0; i < n; i++) {
    box(c, x + 2 + i * (w - 4) / n, y - h + 3, (w - 4) / n - 3, h - 6, hash(sd + i) > .5 ? '#33424a' : '#2b3840');
    box(c, x + 2 + i * (w - 4) / n + 3, y - h + 8, 6, 2, '#00000040');
    box(c, x + 2 + i * (w - 4) / n + (w - 4) / n - 9, y - h + h * .5, 3, 6, '#8a9aa0');
    for (let k = 0; k < 3; k++) box(c, x + 5 + i * (w - 4) / n, y - h + 14 + k * 4, (w - 4) / n - 9, 1.6, '#00000038');
  }
  box(c, x, y - h, w, 3, '#556670');
}
export function weaponRack(c, x, y, w, h, o = {}) {
  const { sd = 0, accent = '#8fb4c0' } = o;
  box(c, x, y - h, w, 4, '#4a5a62'); box(c, x, y - 6, w, 6, '#4a5a62');
  const n = Math.max(2, Math.floor(w / 16));
  for (let i = 0; i < n; i++) {
    const rx = x + 6 + i * (w - 10) / n;
    box(c, rx, y - h + 8, 3, h - 16, '#26333a');            // barrel
    box(c, rx - 2, y - h + 10, 9, 5, '#3a4a52');
    box(c, rx - 1, y - 10, 4, 8, '#6a5040');
    box(c, rx + 1, y - h + 14, 2, h * .3, accent + '77');
  }
  box(c, x, y - h, w, h, 'transparent');
}
export function alarmRack(c, x, y, w, h, o = {}) {
  const { t = 0, sd = 0, hot = true } = o;
  box(c, x, y - h, w, h, '#1c2a33'); frame(c, x, y - h, w, h, '#3f5560', 1.4);
  for (let i = 0; i < 4; i++) {
    box(c, x + 4, y - h + 6 + i * ((h - 10) / 4), w - 8, (h - 10) / 4 - 3, '#0d1a22');
    for (let k = 0; k < 7; k++) {
      const on = hot && hash(Math.floor(t * 4 + sd) + i * 5 + k) > .45;
      dot(c, x + 8 + k * ((w - 16) / 7), y - h + 10 + i * ((h - 10) / 4), 1.5, on ? (k % 3 ? '#ff6b6b' : '#ffb45c') : '#1d2b33');
    }
  }
  if (hot) pool(c, x + w / 2, y - h / 2, w * .8, '#ff6b6b', .07, true);
}
export function grilleFloor(c, x, y, w, h, o = {}) {
  const { sd = 0, col = '#20303a' } = o;
  box(c, x, y, w, h, col);
  c.globalAlpha = .6;
  for (let py = y; py < y + h; py += 8) box(c, x, py, w, 3, '#0c161d');
  for (let px = x; px < x + w; px += 8) box(c, px, y, 2, h, '#0c161d');
  c.globalAlpha = 1;
  for (let i = 0; i < w / 60; i++) box(c, x + hash(sd + i * 3.3) * w, y + hash(sd + i * 7.7) * h * .5, 26, 2, '#2b3d47');
}
export function tileDado(c, x, y, w, h, o = {}) {
  const { tile = '#7f8a80', grout = '#2b3430', size = 18, sd = 0 } = o;
  for (let ty = y; ty < y + h; ty += size) for (let tx = x; tx < x + w; tx += size) {
    const n = hash(sd + tx * .13 + ty * .29);
    box(c, tx, ty, size - 1, size - 1, n > .86 ? tile + 'ff' : n > .5 ? tile : tile + 'e0');
  }
  c.globalAlpha = .3; for (let ty = y; ty < y + h; ty += size) box(c, x, ty, w, 1, grout); for (let tx = x; tx < x + w; tx += size) box(c, tx, y, 1, h, grout);
  c.globalAlpha = 1;
}
export function doorLeaf(c, x, y, w, h, o = {}) {
  const { col = '#1b2a33', panel = '#254049', handle = '#dab68b', glass = true, sd = 0 } = o;
  box(c, x, y, w, h, col); box(c, x + 2, y + 2, w - 4, h - 4, panel);
  if (glass) { box(c, x + 5, y + 8, w - 10, h * .46, '#0c1b24'); glassSheen(c, x + 5, y + 8, w - 10, h * .46, sd + x, .12); box(c, x + 5, y + 8, w - 10, 2, '#4d626b'); }
  box(c, x + 3, y + h * .56, w - 6, h * .34, panel + 'cc');
  box(c, x + w - 8, y + h * .46, 3, 12, handle);
  box(c, x, y, w, 2, '#00000038');
}
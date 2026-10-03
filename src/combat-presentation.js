// Combat presentation for NULL // RAIN: temporal afterimages, movement trails and
// local impact art. Render-only: never writes to a simulation object, no DOM at
// module scope, no dependencies beyond the character rig.
import * as RIG from './character-rig.js';
import * as SPR from './sprite-actors.js';
import { preloadWarden } from './warden-sprites.js';
import { drawHuman } from './human-actors.js';

// Painted art preload/status contract. Absent or failed art resolves quietly so the
// game always starts on the procedural fallback.
export function preloadArt() {
  const parts = [];
  try { if (typeof SPR.preloadSprites === 'function') parts.push(SPR.preloadSprites()); } catch { /* no painted humans */ }
  try { parts.push(preloadWarden()); } catch { /* no painted boss */ }
  return parts.length ? Promise.all(parts.map(p => Promise.resolve(p).catch(() => null))) : null;
}
export function artStatus() {
  const humans = (() => { try { return typeof SPR.spriteStatus === 'function' ? SPR.spriteStatus() : null; } catch { return null; } })();
  return { humans };
}

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// --- colour helpers ------------------------------------------------------------
function rgbOf(hex) {
  let h = String(hex || '').replace('#', '').slice(0, 6);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hexOf(r, g, b) {
  const p = v => clamp(v | 0, 0, 255).toString(16).padStart(2, '0');
  return '#' + p(r) + p(g) + p(b);
}
function tone(hex, k, toWhite = true) {
  const [r, g, b] = rgbOf(hex), t = toWhite ? 255 : 0;
  return hexOf(r + (t - r) * k, g + (t - g) * k, b + (t - b) * k);
}
function rgba(hex, a) {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
}

// Per-build echo identities. Chronoblade is electric green with a pale hot core;
// every other build keeps its own accent so nothing else turns green.
export const ECHO_STYLE = {
  blade: { core: '#f3ffe2', mid: '#8cff4a', edge: '#1c6b39' },
  ghost: { core: '#f7f0ff', mid: '#c398ff', edge: '#43287a' },
  tank: { core: '#fff1d8', mid: '#ffb04a', edge: '#7a4416' },
  gun: { core: '#ffe2dc', mid: '#e2453f', edge: '#6b1a16' }
};
const styleOf = build => ECHO_STYLE[build] || ECHO_STYLE.blade;

// The sword and EMP sweeps are authored cyan; the blade build reads them as green.
const SWORD_HEX = new Set(['#8afff0', '#84f8ee', '#7ef8e6', '#79f6ed']);
export function tuneColor(hex, build) {
  const h = String(hex || '').toLowerCase();
  if (!h) return '#9dff5c';
  if (SWORD_HEX.has(h)) return build === 'blade' ? '#9dff5c' : h;
  return h;
}

// --- rig snapshot bridge -------------------------------------------------------
// Copies depict the pose the actor actually held. The rig publishes that state
// through a per-actor snapshot; it is injected into a private copy actor so the
// live simulation is never touched. A missing bridge degrades to plain silhouettes.
const BRIDGE_CANDIDATES = ['rigMemory', 'poseSnapshot', 'snapshotFor', 'renderSnapshot', 'ghostSnapshot'];
let bridge = null, bridgeChecked = false;
function rigSnapshot(e, t) {
  if (!bridgeChecked) {
    bridgeChecked = true;
    for (const name of BRIDGE_CANDIDATES) {
      const fn = RIG[name];
      if (typeof fn !== 'function') continue;
      try {
        const probe = fn({ x: 0, y: 0, w: 28, h: 54 }, 0, true);
        if (probe && typeof probe === 'object') { bridge = fn; break; }
      } catch { /* wrong signature for this name: keep probing */ }
    }
  }
  if (!bridge) return null;
  try {
    const snap = bridge(e, t, true);
    return snap && typeof snap === 'object' ? snap : null;
  } catch { return null; }
}

// --- temporal history ---------------------------------------------------------
// Bounded ring of real prior world positions. Emitted only while travelling, so
// standing still never fills the screen with copies.
const MAX_ECHO = 6, MAX_BLINK = 2;
const POSE_KEYS = ['w', 'h', 'dir', 'vx', 'vy', 'grounded', 'crouching', 'climbing', 'attackTimer',
  'dashTimer', 'rush', 'parry', 'reloadTimer', 'reloadDuration', 'reloadWeapon', 'lastAttackKind',
  'weapon', 'secondary', 'combo', 'cloak', 'invuln', 'hp', 'maxHp', 'dead', 'aimAngle',
  'telegraph', 'flash', 'stun', 'build'];
const SNAP_KEYS = ['u', 'cad', 'step', 'lift', 'bob', 'sink', 'ph', 'vel', 'sp', 'hit', 'dead', 'atk', 'land', 'hp', 'dt', 'd'];
const TELEPORT = 96;
// A copy reproduces the exact painted frame and facing that were on screen. The frame
// record is copied at capture time so later solver passes cannot rewrite history.
function frozenFrame(e, t) {
  if (typeof SPR.spriteFrameSnapshot !== 'function') return null;
  try {
    const s = SPR.spriteFrameSnapshot(e, t);
    if (!s || !s.sprite) return null;
    return { sprite: Object.assign({}, s.sprite), face: s.face || 1 };
  } catch { return null; }
}

const HIST = {
  owner: null, world: null, room: null, t: 0, x: 0, y: 0, emitX: 0, emitY: 0,
  ring: [], blinks: []
};
export function resetTemporal() {
  HIST.owner = null; HIST.world = null; HIST.room = null; HIST.ring.length = 0;
  HIST.blinks.length = 0; HIST.t = 0;
}
function seedId(e) {
  if (typeof e.id === 'string') return e.id;
  if (e.homeX !== undefined) return String(e.homeX);
  return String(e.x || 0);
}
function poseOf(e, t) {
  const snap = {};
  const live = rigSnapshot(e, t);
  if (live) for (const k of SNAP_KEYS) if (live[k] !== undefined) snap[k] = live[k];
  const copy = { id: seedId(e) };
  for (const k of POSE_KEYS) copy[k] = e[k];
  copy.w = e.w || 28; copy.h = e.h || 54; copy.dir = e.dir || 1; copy.build = e.build || 'blade';
  return { snap, frame: frozenFrame(e, t), copy };
}
// Hands the copy actor the recorded state: rig gait for the procedural path, plus the
// frozen painted frame and facing. Writes only to the copy's own render memory.
function applyPose(e, t) {
  const snap = rigSnapshot(e.copy, t);
  if (!snap) return;
  const rec = e.snap;
  if (rec) for (const k of SNAP_KEYS) if (rec[k] !== undefined) snap[k] = rec[k];
  if (e.frame) { snap.sprite = e.frame.sprite; snap.face = e.frame.face; }
}
function pushEcho(s, t, mode, life, alpha) {
  const p = s.player, prev = HIST.ring[HIST.ring.length - 1];
  const dx = prev ? p.x - prev.x : 0, dy = prev ? p.y - prev.y : 0;
  const { snap, copy } = poseOf(p, t);
  copy.x = p.x; copy.y = p.y;
  HIST.ring.push({ x: p.x, y: p.y, t0: t, dx, dy, len: Math.hypot(dx, dy), snap, copy, mode, life, alpha });
  if (HIST.ring.length > MAX_ECHO) HIST.ring.shift();
  HIST.emitX = p.x; HIST.emitY = p.y;
}
// Records the movement history. Call once per rendered frame, before drawing.
export function captureTemporal(s, t) {
  const p = s && s.player;
  if (!p || p.dead) { HIST.ring.length = 0; HIST.blinks.length = 0; return; }
  const world = s.world || null, room = world && world.interior ? (world.interior.roomId || 'in') : null;
  const dt = HIST.owner === p && HIST.world === world ? t - HIST.t : 0;
  if (HIST.owner !== p || HIST.world !== world || HIST.room !== room || !(dt > 0) || dt > .25) {
    // New actor, new world, paused or reversed clock: drop the trail outright.
    HIST.owner = p; HIST.world = world; HIST.room = room; HIST.t = t;
    HIST.x = p.x; HIST.y = p.y; HIST.emitX = p.x; HIST.emitY = p.y;
    HIST.ring.length = 0; HIST.blinks.length = 0;
    return;
  }
  HIST.t = t;
  const moved = Math.hypot(p.x - HIST.x, p.y - HIST.y);
  if (moved > TELEPORT) {
    // Blink / room change / respawn: keep one short streak between the two real positions.
    HIST.ring.length = 0;
    HIST.blinks.push({ x0: HIST.x, y0: HIST.y, x1: p.x, y1: p.y, t0: t, ...poseOf(p, t) });
    if (HIST.blinks.length > MAX_BLINK) HIST.blinks.shift();
    HIST.emitX = p.x; HIST.emitY = p.y;
  } else if (moved > .35) {
    const dashing = p.dashTimer > 0 || p.rush > 0;
    const fractured = (s.slowTime || 0) > 0;
    if (dashing || fractured) {
      const spacing = dashing ? 21 : 31;
      const gap = Math.hypot(p.x - HIST.emitX, p.y - HIST.emitY);
      if (gap >= spacing) pushEcho(s, t, dashing ? 'dash' : 'fracture',
        dashing ? .34 : .58, dashing ? .5 : .42);
    }
  }
  HIST.x = p.x; HIST.y = p.y;
  for (let i = HIST.ring.length - 1; i >= 0; i--) if (t - HIST.ring[i].t0 > HIST.ring[i].life + .12) HIST.ring.splice(i, 1);
  for (let i = HIST.blinks.length - 1; i >= 0; i--) if (t - HIST.blinks[i].t0 > .46) HIST.blinks.splice(i, 1);
}

// --- offscreen tint pads ------------------------------------------------------
// Copies are drawn once into a small buffer, tinted there and composited once.
const PAD = 168;
let padA = null, padB = null;
function pads() {
  if (typeof document === 'undefined' || !document.createElement) return null;
  if (!padA) {
    padA = document.createElement('canvas'); padA.width = padA.height = PAD;
    padB = document.createElement('canvas'); padB.width = padB.height = PAD;
  }
  const a = padA.getContext('2d'), b = padB.getContext('2d');
  return a && b ? [a, b] : null;
}
function paintEcho(c, a, b, e, t, pal, alpha, boost) {
  const x = e.copy.x, y = e.copy.y, w = e.copy.w, h = e.copy.h;
  a.setTransform(1, 0, 0, 1, 0, 0);
  a.clearRect(0, 0, PAD, PAD);
  // Ghost draws replay the published snapshot, so hand the copy its frozen pose first.
  applyPose(e, t);
  a.save();
  a.setTransform(1, 0, 0, 1, PAD / 2 - x, PAD - 8 - (y + h));
  drawHuman(a, e.copy, t, true, e.copy.build, true);
  a.restore();
  const g = a.createLinearGradient(0, PAD - h - 14, 0, PAD - 4);
  g.addColorStop(0, pal.core); g.addColorStop(.42, pal.mid); g.addColorStop(1, pal.edge);
  a.globalCompositeOperation = 'source-atop';
  a.fillStyle = g; a.fillRect(0, 0, PAD, PAD);
  a.globalCompositeOperation = 'source-over';
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, PAD, PAD);
  b.globalCompositeOperation = 'lighter';
  for (let i = 0; i < boost; i++) b.drawImage(padA, 0, 0);
  b.globalCompositeOperation = 'source-over';
  const dx = x + w / 2 - PAD / 2, dy = y + h - PAD + 8;
  c.save();
  c.globalAlpha = clamp(alpha, 0, 1);
  c.drawImage(padB, dx, dy);
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = clamp(alpha * .45, 0, 1);
  c.drawImage(padB, dx, dy);
  c.restore();
}
function drawEchoDirect(c, e, t, pal, alpha) {
  applyPose(e, t);
  c.save();
  c.globalAlpha = clamp(alpha, 0, 1);
  drawHuman(c, e.copy, t, true, e.copy.build, true);
  c.restore();
}
function streak(c, x, y, dx, dy, len, color, alpha, width) {
  if (!(len > 1) || alpha <= .01) return;
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const ax = x - ux * len, ay = y - uy * len;
  c.save();
  c.globalAlpha = alpha * .5;
  c.strokeStyle = color; c.lineWidth = width * 2.6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(ax, ay); c.stroke();
  c.globalAlpha = alpha;
  c.strokeStyle = tone(color, .72);
  c.lineWidth = width;
  c.beginPath(); c.moveTo(x, y); c.lineTo(ax, ay); c.stroke();
  c.restore();
}
function drawTrail(c, ring, pal, alpha) {
  if (ring.length < 2 || alpha <= .01) return;
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let pass = 0; pass < 3; pass++) {
    c.globalAlpha = alpha * [.1, .16, .3][pass];
    c.strokeStyle = [pal.edge, pal.mid, tone(pal.mid, .7)][pass];
    c.lineWidth = [10, 5.5, 1.6][pass];
    c.beginPath();
    c.moveTo(ring[0].x + ring[0].copy.w / 2, ring[0].y + ring[0].copy.h / 2);
    for (let i = 1; i < ring.length; i++) c.lineTo(ring[i].x + ring[i].copy.w / 2, ring[i].y + ring[i].copy.h / 2);
    c.stroke();
  }
  c.restore();
}
// World-space pass. Draws the bounded trail, the blink streak and the copies.
export function drawTemporal(c, s, t) {
  const p = s && s.player;
  if (!p) return;
  const ring = HIST.ring, blinks = HIST.blinks;
  if (!ring.length && !blinks.length) return;
  const pal = styleOf(p.build);
  const pd = pads();
  let fresh = 0;
  for (const e of ring) if (t - e.t0 < .05) fresh++;
  try {
    drawTrail(c, ring, pal, clamp(ring.length / MAX_ECHO, .2, 1));
    for (const b of blinks) {
      const k = clamp(1 - (t - b.t0) / .46, 0, 1);
      const dx = b.x1 - b.x0, dy = b.y1 - b.y0;
      const steps = 4;
      for (let i = steps - 1; i >= 0; i--) {
        const u = (i + .5) / steps;
        const e = {
          t0: t, snap: b.snap, frame: b.frame, life: .46, alpha: .8,
          copy: Object.assign({}, b.copy, { x: b.x0 + dx * u, y: b.y0 + dy * u })
        };
        const a = k * (i === steps - 1 ? .8 : .34) * (1 - i / (steps + 2));
        if (pd) paintEcho(c, pd[0], pd[1], e, t, pal, a, 2); else drawEchoDirect(c, e, t, pal, a);
        if (i === steps - 1) streak(c, b.x1 + 14, b.y1 + 27, dx, dy, Math.min(150, Math.hypot(dx, dy)), pal.mid, k * .8, 2);
      }
    }
    for (let i = 0; i < ring.length; i++) {
      const e = ring[i];
      const age = t - e.t0;
      if (age > e.life) continue;
      const k = clamp(1 - age / e.life, 0, 1);
      const lead = i === ring.length - 1 && fresh ? 1.35 : 1;
      const a = e.alpha * k * k * lead;
      if (e.len > 1.5) streak(c, e.x + 14, e.y + 27, e.dx, e.dy, Math.min(64, e.len * 2.4), pal.mid, a * .8, 1.7);
      const boost = i >= ring.length - 2 ? 3 : 2;
      if (pd) paintEcho(c, pd[0], pd[1], e, t, pal, a, boost); else drawEchoDirect(c, e, t, pal, a);
    }
  } catch {
    // Any renderer fault must not take the frame down: fall back to plain echoes.
    for (const e of ring) if (t - e.t0 < e.life) drawEchoDirect(c, e, t, pal, e.alpha * .5);
  }
}

// --- effect painters ----------------------------------------------------------
// Every painter is local, short lived and keeps the foreground readable.
export function drawSlash(c, e, ratio, build) {
  const mid = tuneColor(e.color, build);
  const core = tone(mid, .8), deep = tone(mid, .45, false);
  const a = Number.isFinite(e.angle) ? e.angle : e.downward ? Math.PI / 2 : (e.dir || 1) < 0 ? Math.PI : 0;
  const combo = e.combo || 1, r = e.r || 70;
  const flat = combo === 2 ? .62 : combo === 3 ? .84 : 1;
  const spread = 1.02 + ratio * .5;
  c.save();
  c.translate(e.x, e.y); c.rotate(a); c.scale(1, flat);
  // restrained bloom behind the sweep
  const g = c.createRadialGradient(0, 0, r * .35, 0, 0, r * 1.5);
  g.addColorStop(0, rgba(mid, .16 * ratio)); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.5, 0, Math.PI * 2); c.fill();
  // three tapered crescent passes: deep body, mid, hot leading edge
  const passes = [[1, deep, .3 * ratio], [.82, mid, .62 * ratio], [.9, core, .95 * ratio]];
  for (const [sc, col, al] of passes) {
    c.globalAlpha = al;
    c.strokeStyle = col; c.lineWidth = sc === .82 ? 7 : 2.4;
    c.beginPath();
    c.arc(0, 0, r * sc, -spread * .96, -spread * .18);
    c.arc(0, 0, r * sc * .62, -spread * .18, -spread * .96, true);
    c.closePath(); c.fill();
  }
  c.globalAlpha = ratio;
  c.strokeStyle = core; c.lineWidth = 1.2;
  c.beginPath(); c.arc(0, 0, r * 1.02, -spread * .96, -spread * .18); c.stroke();
  // speed lines trailing the tip
  c.globalAlpha = ratio * .7; c.strokeStyle = tone(mid, .6); c.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const ang = -spread * .96 + (i / 4) * spread * .78;
    const k = 1.04 + (i % 2) * .1;
    c.beginPath();
    c.moveTo(Math.cos(ang) * r * .92, Math.sin(ang) * r * .92);
    c.lineTo(Math.cos(ang) * r * (k + .22), Math.sin(ang) * r * (k + .22));
    c.stroke();
  }
  // sparks at the leading tip
  c.globalAlpha = ratio * .9;
  for (let i = 0; i < 3; i++) {
    const ang = -spread * .2 + i * .07;
    const sx = Math.cos(ang) * r, sy = Math.sin(ang) * r;
    c.fillStyle = i ? core : mid;
    c.fillRect(sx - 1, sy - 1, 2 + i, 1.6);
  }
  c.restore();
}
export function drawRing(c, e, ratio) {
  const col = tuneColor(e.color), core = tone(col, .78), r = e.r || 60;
  const k = 1 - ratio;
  c.save();
  c.globalAlpha = ratio * .22;
  const g = c.createRadialGradient(e.x, e.y, r * k * .3, e.x, e.y, r * (k + .35));
  g.addColorStop(0, rgba(col, .5)); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y, r * (k + .35), 0, Math.PI * 2); c.fill();
  c.globalAlpha = ratio;
  c.strokeStyle = core; c.lineWidth = 1.6;
  c.beginPath(); c.arc(e.x, e.y, r * (k + .12), 0, Math.PI * 2); c.stroke();
  c.globalAlpha = ratio * .5;
  c.strokeStyle = col; c.lineWidth = 1;
  c.beginPath(); c.arc(e.x, e.y, r * (k + .3), 0, Math.PI * 2); c.stroke();
  c.restore();
}
export function drawFlash(c, e, ratio) {
  // Muzzle / point pops: compact hot core with short radial spikes.
  const col = tuneColor(e.color), core = tone(col, .85), r = Math.max(9, e.r || 16);
  c.save();
  c.globalAlpha = ratio;
  const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * (1.6 - ratio * .6));
  g.addColorStop(0, rgba(core, .9)); g.addColorStop(.45, rgba(col, .5)); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y, r * (1.6 - ratio * .6), 0, Math.PI * 2); c.fill();
  c.strokeStyle = core; c.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    const ang = i * Math.PI / 3 + (i % 2 ? .18 : 0);
    const k0 = r * .35, k1 = r * (1 + ratio * 1.5);
    c.beginPath();
    c.moveTo(e.x + Math.cos(ang) * k0, e.y + Math.sin(ang) * k0);
    c.lineTo(e.x + Math.cos(ang) * k1, e.y + Math.sin(ang) * k1);
    c.stroke();
  }
  c.fillStyle = core;
  c.beginPath(); c.arc(e.x, e.y, r * .3 * (1 - ratio * .5), 0, Math.PI * 2); c.fill();
  c.restore();
}
export function drawParry(c, e, ratio) {
  const col = tone(e.color || '#fff7c4', .2), core = '#fffdf0';
  const r = e.r || 40, k = 1 - ratio;
  c.save();
  c.globalAlpha = ratio * .3;
  const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * (1 + k));
  g.addColorStop(0, rgba(col, .8)); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y, r * (1 + k), 0, Math.PI * 2); c.fill();
  c.globalAlpha = ratio;
  c.strokeStyle = core; c.lineWidth = 2.2;
  c.beginPath(); c.arc(e.x, e.y, r * (.55 + k * .5), -1.25, 1.25); c.stroke();
  c.globalAlpha = ratio * .8;
  c.strokeStyle = col; c.lineWidth = 1;
  c.beginPath(); c.arc(e.x, e.y, r * (.78 + k * .42), 1.9, -1.9, true); c.stroke();
  for (let i = 0; i < 7; i++) {
    const ang = -1.2 + i * (2.4 / 6);
    const d = r * (.6 + k * .75);
    c.globalAlpha = ratio * (.9 - i * .06);
    c.fillStyle = i % 2 ? core : col;
    c.fillRect(e.x + Math.cos(ang) * d - 1.2, e.y + Math.sin(ang) * d - 1.2, 2.6, 2.2);
  }
  c.restore();
}
export function drawImpact(c, e, ratio) {
  const col = tuneColor(e.color), core = tone(col, .82), r = e.r || 60;
  c.save();
  c.globalAlpha = ratio;
  const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
  g.addColorStop(0, rgba(core, .5 * ratio + .12)); g.addColorStop(.5, rgba(col, .22 * ratio)); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y, r, 0, Math.PI * 2); c.fill();
  // hot core
  c.globalAlpha = ratio * .95;
  c.fillStyle = core;
  c.beginPath(); c.arc(e.x, e.y, r * .12 * ratio + 1.5, 0, Math.PI * 2); c.fill();
  // ragged crack ring
  c.strokeStyle = col; c.lineWidth = 1.4;
  for (let i = 0; i < 9; i++) {
    const a0 = i * (Math.PI * 2 / 9), a1 = a0 + .42;
    c.beginPath();
    c.arc(e.x, e.y, r * (.34 + ratio * .5), a0, a1);
    c.stroke();
  }
  // shards
  c.fillStyle = core;
  for (let i = 0; i < 10; i++) {
    const ang = i * 2.39996, d = r * (.2 + (1 - ratio) * .95), s = 1 + (i % 3);
    c.globalAlpha = ratio * (.5 + (i % 2) * .4);
    c.fillRect(e.x + Math.cos(ang) * d, e.y + Math.sin(ang) * d, s, s * 1.6);
  }
  c.restore();
}
export function drawExplosion(c, e, ratio) {
  const col = tuneColor(e.color), core = tone(col, .8), r = e.r || 60, k = 1 - ratio;
  c.save();
  const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * (.4 + k * .8));
  g.addColorStop(0, rgba(core, .34 * ratio)); g.addColorStop(.55, rgba(col, .16 * ratio)); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.globalAlpha = ratio;
  c.beginPath(); c.arc(e.x, e.y, r * (.4 + k * .8), 0, Math.PI * 2); c.fill();
  for (const [m, w, a] of [[.95, 2.6, 1], [.72, 1.4, .6], [1.18, .9, .4]]) {
    c.globalAlpha = ratio * a;
    c.strokeStyle = m === .95 ? core : col; c.lineWidth = w;
    c.beginPath(); c.arc(e.x, e.y, r * m * (.35 + k * .75), 0, Math.PI * 2); c.stroke();
  }
  c.fillStyle = core; c.globalAlpha = ratio * .9;
  c.beginPath(); c.arc(e.x, e.y, r * .16 * ratio + 2, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 12; i++) {
    const ang = i * 2.39996, d = r * (.25 + (1 - ratio) * .8);
    c.globalAlpha = ratio * .55;
    c.fillRect(e.x + Math.cos(ang) * d, e.y + Math.sin(ang) * d, 1.6, 3.2);
  }
  c.restore();
}
export function drawBeam(c, e, ratio) {
  const col = tuneColor(e.color), core = tone(col, .8);
  const tx = e.tx ?? (e.x + (e.dir || 1) * (e.r || 70)), ty = e.ty ?? e.y;
  const dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = ratio * .3; c.strokeStyle = col; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(tx, ty); c.stroke();
  c.globalAlpha = ratio * .8; c.strokeStyle = core; c.lineWidth = 2;
  c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(tx, ty); c.stroke();
  c.globalAlpha = ratio;
  c.fillStyle = core;
  c.beginPath(); c.arc(e.x + ux * l * ratio, e.y + uy * l * ratio, 2.4, 0, Math.PI * 2); c.fill();
  c.restore();
}
export function drawFloatText(c, e, ratio, build) {
  const s = String(e.text || ''), hot = /HEADSHOT/i.test(s);
  const col = tuneColor(e.color, build) || '#b7c9d2';
  if (hot) {
    const r = 26;
    c.save();
    c.globalAlpha = ratio * .85;
    c.strokeStyle = tone(col, .5); c.lineWidth = 1.4;
    c.beginPath(); c.arc(e.x, e.y + 4, r * (1.2 - ratio * .2), 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 6; i++) {
      const ang = i * 1.047;
      c.globalAlpha = ratio * .7;
      c.fillStyle = tone(col, .7);
      c.fillRect(e.x + Math.cos(ang) * r * .5, e.y + 4 + Math.sin(ang) * r * .5, 2, 2);
    }
    c.restore();
  }
  c.save();
  c.globalAlpha = clamp(ratio * 1.4, 0, 1);
  c.font = 'bold 13px "Courier New", monospace';
  c.textAlign = 'center';
  c.fillStyle = '#04080f';
  c.fillText(s, e.x + 1, e.y + 1);
  c.fillStyle = col;
  c.fillText(s, e.x, e.y);
  c.textAlign = 'left';
  c.restore();
}
// Dispatcher used by the renderer for every existing effect record.
export function drawEffect(c, e, ratio, build) {
  const r = e.r || 60;
  switch (e.type) {
    case 'text': drawFloatText(c, e, ratio, build); break;
    case 'slash': drawSlash(c, e, ratio, build); break;
    case 'beam': drawBeam(c, e, ratio); break;
    case 'ring': {
      const small = r <= 20;
      const parry = /fff7c4|fffbe0|fffce8/i.test(String(e.color || '')) && r >= 22;
      if (parry) drawParry(c, e, ratio);
      else if (small) drawFlash(c, e, ratio);
      else drawRing(c, e, ratio);
      break;
    }
    case 'explosion': drawExplosion(c, e, ratio); break;
    case 'noise': drawImpact(c, e, ratio); break;
    default: drawRing(c, e, ratio);
  }
}

// --- time fracture frame ------------------------------------------------------
// Green edge distortion, slow temporal banding and a vignette. Deliberately low
// contrast: enemies, shots and hazards must stay readable underneath it.
export function drawFracture(c, w, h, t, amount) {
  const k = clamp((amount || 0) / 2.4, 0, 1);
  if (k <= 0) return;
  const pulse = .82 + .18 * Math.sin(t * 2.1);
  const mid = '#8cff4a', core = '#e9ffd6';
  c.save();
  // Corner-weighted vignette only: the middle of the frame stays clean so painted
  // characters, shots and hazards read at full contrast.
  c.globalAlpha = .09 * k * pulse;
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .46, w / 2, h / 2, Math.max(w, h) * .74);
  g.addColorStop(0, 'transparent'); g.addColorStop(.62, rgba(mid, .1)); g.addColorStop(1, rgba(mid, .55));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  // edge bands: top and bottom distortion, four sliced scans each
  const bands = 4, bh = Math.max(8, h * .035);
  for (let i = 0; i < bands; i++) {
    for (const top of [true, false]) {
      const y = top ? h * .035 + i * bh * .9 : h - h * .035 - i * bh * .9 - bh;
      const off = Math.sin(t * 1.7 + i * 1.3) * 26 * k;
      const a = (.05 + .05 * (i / bands)) * k * pulse;
      c.globalAlpha = a;
      c.fillStyle = mid;
      c.fillRect(off, y, w - Math.abs(off), 1.6);
      c.globalAlpha = a * .55;
      c.fillStyle = core;
      c.fillRect(off * .5, y + 2, w - Math.abs(off * .5), 1);
    }
  }
  // vertical chroma fringe at the frame edges
  c.globalAlpha = .12 * k * pulse;
  c.fillStyle = mid; c.fillRect(0, 0, 2, h); c.fillRect(w - 2, 0, 2, h);
  c.globalAlpha = .07 * k;
  c.fillStyle = '#7ef8e6'; c.fillRect(2, 0, 1, h); c.fillRect(w - 3, 0, 1, h);
  // scanning temporal streaks drifting across the frame
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const ph = (t * (.16 + i * .05) + i * .37) % 1;
    const x = ((i * 173 + t * (i % 2 ? 34 : -28)) % (w + 200)) - 100;
    const y = h * (.12 + .76 * ((i * .618) % 1));
    c.globalAlpha = .05 * k * Math.sin(ph * Math.PI);
    c.strokeStyle = i % 2 ? mid : core; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 90 + i * 12, y); c.stroke();
  }
  c.restore();
}
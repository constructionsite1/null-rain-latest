// Painted sprite engine for humans.
//  - async, Node-safe atlas loading with a published preload/status contract
//  - load-time figure isolation: connected-component labelling per nominal cell strips the
//    neighbour bleed the painter left behind (Chronoblade sword glows cross cell borders)
//  - one constant pixels-per-world-unit scale per family, taken from the standing reference,
//    so crouch/dash/jump compress naturally instead of being renormalised to full height
//  - per-figure foot line + torso centre measured from real alpha, never the bbox midpoint
//  - state driven frame selection, facing mirroring, afterimage frame freezing
// Node-safe: nothing touches Image/document at import time. Absent art falls back silently.
import { rigMemory } from './character-rig.js';

export const SPRITE_BASE = 'assets/characters/';
const WORLD_H = 54;                    // gameplay actor height the painted art is fitted to

// ---------------------------------------------------------------- atlas definitions
// rows/cols are the nominal painted grid. `rowNames` labels enemy families (never `rows`).
// `ref` is the frame whose painted body height defines the family scale.
export const SHEETS = {
  gunslinger: {
    file: 'gunslinger-painted-v1.png', cols: 4, rows: 3, ref: 0,
    frames: ['idle', 'runA', 'runFlight', 'runB', 'jump', 'dash', 'crouchAim',
      'aimFwd', 'aimUp', 'aimDown', 'reload', 'hurt']
  },
  chronoblade: {
    file: 'chronoblade-painted-v1.png', cols: 4, rows: 3, ref: 0,
    frames: ['idle', 'runA', 'runFlight', 'runB', 'jump', 'dash', 'crouch',
      'parry', 'windup', 'cutHoriz', 'cutRise', 'cutOverhead']
  },
  enemies: {
    file: 'enemies-painted-v1.png', cols: 4, rows: 4, ref: 0,
    rowNames: ['punk', 'corp', 'tech', 'heavy'],
    frames: ['idle', 'walkA', 'walkB', 'aim']
  },
  movement: {
    file: 'movement-painted-v1.png', cols: 4, rows: 4, optional: true,
    families: { gun: { rows: [0, 1], frames: 8, match: 'gunslinger' }, blade: { rows: [2, 3], frames: 8, match: 'chronoblade' } }
  },
  // Supplemental poses. Two identities share one sheet, so each block inherits the units-per-pixel
  // of its matched hero sheet (resolved at draw time, because load order is not guaranteed).
  actions: {
    file: 'actions-painted-v1.png', cols: 4, rows: 4, optional: true,
    frames: ['gunRunFireL', 'gunRunFireR', 'gunAirFire', 'gunCrouchFire',
      'gunReloadOpen', 'gunReloadEject', 'gunReloadInsert', 'gunReloadClose',
      'chronoSidearmIdle', 'chronoSidearmRun', 'chronoSidearmCrouch', 'chronoSidearmAir',
      'chronoReload', 'chronoClimbL', 'chronoClimbR', 'chronoHurt'],
    blocks: [{ from: 0, to: 7, match: 'gunslinger', ref: 4 }, { from: 8, to: 15, match: 'chronoblade', ref: 8 }]
  },
  // Supplemental civilians. The sheet has real transparency but a baked dark radial backdrop in
  // its alpha 1..20 band, so the overflow threshold is raised to keep that wash out of the art.
  civilians: {
    file: 'civilians-painted-v1.png', cols: 4, rows: 4, optional: true, soft: 28,
    rowNames: ['vendor', 'courier', 'commuter', 'resident'],
    frames: ['idle', 'walkA', 'walkB', 'startle']
  }
};

// Civilian role -> painted family row.
export const CIVILIAN_ROW = { vendor: 0, courier: 1, commuter: 2 };

// Which painted identity each in-game type wears.
export const IDENTITY = {
  gun: { sheet: 'gunslinger', row: 0 },
  blade: { sheet: 'chronoblade', row: 0 },
  ghost: { sheet: 'enemies', row: 2 },
  tank: { sheet: 'enemies', row: 3 },
  guard: { sheet: 'enemies', row: 1 },
  sniper: { sheet: 'enemies', row: 2 },
  heavy: { sheet: 'enemies', row: 3 },
  gang: { sheet: 'enemies', row: 0 }
};

// ---------------------------------------------------------------- sheet records
const sheets = {};
const waiters = [];
let base = SPRITE_BASE;
let started = false;
function blank(id) {
  return { id, def: SHEETS[id], img: null, clean: null, state: 'idle', w: 0, h: 0, cw: 0, ch: 0, figs: null, fam: {}, scale: 0, refPx: 0, measured: false };
}
for (const id in SHEETS) sheets[id] = blank(id);

export function spriteStatus() {
  const out = { base, ready: false, settled: false, started, sheets: {}, pending: 0, total: 0 };
  for (const id in SHEETS) {
    const s = sheets[id];
    if (s.def.optional && s.state === 'missing') continue;
    out.total++;
    out.sheets[id] = {
      state: s.state, w: s.w, h: s.h, cols: s.def.cols, rows: s.def.rows, file: s.def.file,
      unitsPerPixel: s.scale ? +s.scale.toFixed(5) : 0, refPx: s.refPx || 0, figures: s.figs ? countFigs(s.figs) : 0,
      measured: s.measured
    };
    if (s.state === 'loaded') out.ready = true;
    if (s.state === 'loading' || s.state === 'idle') out.pending++;
  }
  out.settled = started && out.pending === 0;
  return out;
}
function countFigs(f) { let n = 0; for (const r of f) for (const c of r) if (c) n++; return n; }
export function setSpriteBase(url) { base = url || SPRITE_BASE; }
function dom() { return typeof document !== 'undefined' && !!document.createElement; }
function makeImage() {
  if (typeof Image === 'function') return new Image();
  if (!dom()) return null;
  const el = document.createElement('img');
  if ('decoding' in el) el.decoding = 'async';
  return el;
}
function settle() {
  if (!started || spriteStatus().pending > 0) return;
  const st = spriteStatus();
  for (let i = 0; i < waiters.length; i++) { try { waiters[i](st); } catch { /* listener owns its errors */ } }
  waiters.length = 0;
}
export function onSpritesReady(cb) {
  if (typeof cb !== 'function') return () => { };
  if (!started) preloadSprites();
  if (spriteStatus().settled) { cb(spriteStatus()); return () => { }; }
  waiters.push(cb);
  return () => { const i = waiters.indexOf(cb); if (i >= 0) waiters.splice(i, 1); };
}
function loadSheet(id) {
  const sh = sheets[id];
  if (sh.state !== 'idle') return;
  if (!dom() && typeof Image !== 'function') { sh.state = 'unsupported'; return; }
  const im = makeImage();
  if (!im) { sh.state = 'unsupported'; return; }
  sh.state = 'loading';
  im.onload = () => {
    sh.img = im;
    sh.w = im.naturalWidth || im.width || 0;
    sh.h = im.naturalHeight || im.height || 0;
    sh.cw = sh.w / (sh.def.cols || 1);
    sh.ch = sh.h / (sh.def.rows || 1);
    sh.state = 'loaded';
    try { measureSheet(sh); } catch { sh.measured = false; }   // unmeasured sheets still draw via the raw grid
    settle();
  };
  im.onerror = () => { sh.state = sh.def.optional ? 'missing' : 'error'; settle(); };
  im.src = base + sh.def.file;
}
export function preloadSprites() {
  if (!started) {
    started = true;
    for (const id in SHEETS) loadSheet(id);
    settle();
  }
  if (spriteStatus().settled) return Promise.resolve(spriteStatus());
  return new Promise(res => waiters.push(res));
}
export function injectSheet(id, img) {                 // tests / external preload pipelines
  const sh = sheets[id];
  if (!sh || !img) return false;
  sh.img = img;
  sh.w = img.naturalWidth || img.width || 0;
  sh.h = im_h(img);
  sh.cw = sh.w / (sh.def.cols || 1);
  sh.ch = sh.h / (sh.def.rows || 1);
  sh.state = 'loaded';
  try { measureSheet(sh); } catch { sh.measured = false; }
  started = true;
  settle();
  return true;
}
function im_h(img) { return img.naturalHeight || img.height || 0; }
export function spriteSheet(id) { const s = sheets[id]; return s && s.state === 'loaded' ? s : null; }

// ---------------------------------------------------------------- measurement
const CORE = 140, SOFT = 16, BLEED = 130;   // BLEED ~0.36 cell: enough for a trailing sword
// Phase 1: claim each figure's solid core, strictly inside its own nominal cell. Restricting
// this pass is what stops a tall row-0 figure from swallowing row-1 artwork. The largest solid
// component wins, so a stray specular highlight can never become the seed.
function claimCore(A, W, H, label, seen, id, cx, cy, cw, chh, own) {
  const x1 = Math.min(cx + cw, W), y1 = Math.min(cy + chh, H);
  let best = null, comp = null, stack = null;
  for (let y = cy; y < y1; y++) {
    const row = y * W;
    for (let x = cx; x < x1; x++) {
      const p0 = row + x;
      if (label[p0] || seen[p0] || A[p0] < CORE) continue;
      comp = [p0]; seen[p0] = 1; stack = [p0];
      while (stack.length) {
        const p = stack.pop(), px = p % W, py = (p / W) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < cx || ny < cy || nx >= x1 || ny >= y1) continue;
          const n = ny * W + nx;
          if (label[n] || seen[n] || A[n] < CORE) continue;
          seen[n] = 1; comp.push(n); stack.push(n);
        }
      }
      if (!best || comp.length > best.length) best = comp;
    }
  }
  if (!best) return false;
  for (let i = 0; i < best.length; i++) { label[best[i]] = id; own.push(best[i]); }
  return true;
}
// Phase 2: one global breadth-first expansion from every core at once, so overflow that
// crosses a cell border (sword tips, coat edges, glow) goes to the NEAREST figure.
function claimOverflow(A, W, H, label, own, depth, soft) {
  let frontier = [];
  for (let id = 1; id < own.length; id++) for (let i = 0; i < own[id].length; i++) frontier.push(own[id][i]);
  for (let d = 0; d < depth && frontier.length; d++) {
    const next = [];
    for (let q = 0; q < frontier.length; q++) {
      const p = frontier[q], px = p % W, py = (p / W) | 0, id = label[p];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (label[n] || A[n] < soft) continue;
        label[n] = id; own[id].push(n); next.push(n);
      }
    }
    frontier = next;
  }
}
// Box, ground line and torso centre for one isolated figure.
function measureFigure(own, id, A, W, H) {
  let bx0 = W, by0 = H, bx1 = -1, by1 = -1, foot = -1;
  const list = own[id];
  for (let i = 0; i < list.length; i++) {
    const p = list[i], px = p % W, py = (p / W) | 0;
    if (px < bx0) bx0 = px; if (px > bx1) bx1 = px;
    if (py < by0) by0 = py; if (py > by1) by1 = py;
    if (A[p] >= CORE && py > foot) foot = py;
  }
  if (bx1 < 0 || foot < 0) return null;
  const bodyPx = foot - by0;
  const band = foot - bodyPx * 0.55;
  let sx = 0, sw = 0;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if ((p / W) | 0 > band) continue;
    const a = A[p];
    sx += (p % W) * a; sw += a;
  }
  return { id, x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1, foot, cx: sw > 0 ? sx / sw : (bx0 + bx1) / 2, bodyPx };
}
// Repack every isolated figure into a clean uniform grid so no draw call can clip a sword or
// reveal a neighbour, then derive one constant scale from the standing reference frame.
function measureSheet(sh) {
  const def = sh.def;
  if (!dom()) return;
  const cv = document.createElement('canvas');
  cv.width = sh.w; cv.height = sh.h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  if (!g) return;
  g.clearRect(0, 0, sh.w, sh.h);
  g.drawImage(sh.img, 0, 0);
  let data;
  try { data = g.getImageData(0, 0, sh.w, sh.h).data; } catch { return; }
  const A = new Uint8Array(sh.w * sh.h);
  for (let i = 0, p = 3; i < A.length; i++, p += 4) A[i] = data[p];
  const label = new Int32Array(A.length);
  const seen = new Uint8Array(A.length);
  const cols = def.cols || 1, rows = def.rows || 1;
  const own = [[]];
  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let cI = 0; cI < cols; cI++) {
      id++;
      own[id] = [];
      claimCore(A, sh.w, sh.h, label, seen, id, Math.round(cI * sh.cw), Math.round(r * sh.ch), Math.round(sh.cw), Math.round(sh.ch), own[id]);
    }
  }
  claimOverflow(A, sh.w, sh.h, label, own, Math.round(Math.min(sh.cw, sh.ch) * .36), sh.def.soft || SOFT);
  const raw = [];
  let maxW = 8, maxH = 8, found = 0;
  for (let r = 0; r < rows; r++) {
    raw[r] = [];
    for (let cI = 0; cI < cols; cI++) {
      const f = measureFigure(own, r * cols + cI + 1, A, sh.w, sh.h);
      raw[r][cI] = f;
      if (f) { found++; if (f.w > maxW) maxW = f.w; if (f.h > maxH) maxH = f.h; }
    }
  }
  if (!found) return;
  const cellW = maxW + 8, cellH = maxH + 8;
  const out = document.createElement('canvas');
  out.width = cellW * cols; out.height = cellH * rows;
  const og = out.getContext('2d');
  const tmp = document.createElement('canvas');
  for (let r = 0; r < rows; r++) {
    for (let cI = 0; cI < cols; cI++) {
      const f = raw[r][cI];
      if (!f) continue;
      // Preserve the painted RGB of every isolated pixel; only alpha is masked.
      tmp.width = f.w; tmp.height = f.h;
      const tg = tmp.getContext('2d');
      const idata = tg.createImageData(f.w, f.h);
      for (let y = 0; y < f.h; y++) {
        const srow = (f.y + y) * sh.w + f.x, drow = y * f.w;
        for (let x = 0; x < f.w; x++) {
          const si = (srow + x) * 4, di = (drow + x) * 4;
          idata.data[di] = data[si];
          idata.data[di + 1] = data[si + 1];
          idata.data[di + 2] = data[si + 2];
          idata.data[di + 3] = label[srow + x] === f.id ? data[si + 3] : 0;
        }
      }
      tg.putImageData(idata, 0, 0);
      // Anchors are LOCAL to the crop: torso centre x and the ground line.
      const localCx = f.cx - f.x, localFoot = f.foot - f.y;
      let dx = Math.round(cI * cellW + cellW / 2 - localCx);
      let dy = Math.round(r * cellH + (cellH - 4) - localFoot);
      const loX = cI * cellW, hiX = (cI + 1) * cellW - f.w;
      const loY = r * cellH, hiY = (r + 1) * cellH - f.h;
      if (dx < loX) dx = loX; else if (dx > hiX) dx = Math.max(loX, hiX);
      if (dy < loY) dy = loY; else if (dy > hiY) dy = Math.max(loY, hiY);
      og.save();
      og.beginPath(); og.rect(cI * cellW, r * cellH, cellW, cellH); og.clip();
      og.drawImage(tmp, dx, dy);
      og.restore();
      f.sx = dx; f.sy = dy; f.sw = f.w; f.sh = f.h;
      f.ax = localCx / f.w;
      f.ay = localFoot / f.h;
      f.px = { x: f.sx, y: f.sy, w: f.sw, h: f.sh };
    }
  }
  sh.clean = out;
  sh.figs = raw;
  if (def.rowNames) {
    // Enemy families were painted at slightly different sizes: each row gets its own standing
    // reference (row 0 is the punk, not a universal yardstick).
    sh.rowUnits = [];
    for (let r = 0; r < rows; r++) {
      const ref = raw[r] && raw[r][0];
      const units = ref && ref.bodyPx ? WORLD_H / ref.bodyPx : WORLD_H / (maxH || WORLD_H);
      sh.rowUnits[r] = units;
      for (let cI = 0; cI < cols; cI++) if (raw[r][cI]) raw[r][cI].units = units;
    }
    sh.refPx = raw[0] && raw[0][0] ? raw[0][0].bodyPx : maxH;
    sh.scale = sh.rowUnits[0] || WORLD_H / sh.refPx;
  } else {
    const refIdx = def.ref || 0;
    const rf = raw[Math.floor(refIdx / cols)] && raw[Math.floor(refIdx / cols)][refIdx % cols];
    sh.refPx = rf ? rf.bodyPx : maxH;
    sh.scale = WORLD_H / sh.refPx;          // WORLD UNITS per source pixel
    for (let r = 0; r < rows; r++) for (let cI = 0; cI < cols; cI++) if (raw[r][cI]) raw[r][cI].units = sh.scale;
  }
  sh.measured = true;
  if (def.families) buildFamilies(sh);
  if (def.blocks) {
    // Each supplement identity is painted at its own source resolution, so each block derives its
    // units-per-pixel from its own upright reference frame (gun reload-open, chrono sidearm idle).
    // Fitting those upright bodies to 54 world units keeps crouch/air compression natural.
    for (const b of def.blocks) {
      const rf = raw[Math.floor(b.ref / cols)] && raw[Math.floor(b.ref / cols)][b.ref % cols];
      const units = rf && rf.bodyPx ? WORLD_H / rf.bodyPx : WORLD_H / (maxH || WORLD_H);
      b.units = units;
      b.refPx = rf ? rf.bodyPx : 0;
      for (let r = 0; r < rows; r++) {
        for (let cI = 0; cI < cols; cI++) {
          const f = raw[r][cI];
          if (!f) continue;
          const i = r * cols + cI;
          if (i >= b.from && i <= b.to) { f.match = b.match; f.units = units; }
        }
      }
    }
    sh.blocks = def.blocks;
    sh.refPx = raw[0] && raw[0][0] ? raw[0][0].bodyPx : maxH;
    sh.scale = (def.blocks[0] && def.blocks[0].units) || WORLD_H / sh.refPx;
  }
  // Mean source body height of this sheet's stride frames: used to keep the movement sheet's
  // run cycle the same on-screen size as the main sheet's own run frames.
  if (def.frames) {
    let sum = 0, n = 0;
    for (let r = 0; r < rows; r++) {
      for (let cI = 0; cI < cols; cI++) {
        const f = raw[r][cI];
        if (f && /run|walk/i.test(def.frames[r * cols + cI] || '')) { sum += f.bodyPx; n++; }
      }
    }
    sh.runMeanPx = n ? sum / n : 0;
  }
}
// The movement sheet packs two run cycles. Each family inherits the units-per-pixel of its
// matched main sheet, so switching idle -> run never changes the character's absolute size
// and the run pose keeps its natural forward compression.
function buildFamilies(sh) {
  const cols = sh.def.cols;
  for (const key in sh.def.families) {
    const fam = sh.def.families[key];
    let sum = 0, n = 0;
    const figs = [];
    for (let r = fam.rows[0]; r <= fam.rows[1]; r++) {
      for (let cI = 0; cI < cols; cI++) {
        const f = sh.figs[r] && sh.figs[r][cI];
        if (f) { figs.push(f); sum += f.bodyPx; n++; }
      }
    }
    const main = sheets[fam.match];
    const avg = n ? sum / n : WORLD_H;
    const units = main && main.scale ? main.scale * ((main.runMeanPx || avg) / avg) : WORLD_H / avg;
    sh.fam[key] = { rows: fam.rows, frames: fam.frames, figs, count: figs.length, avgPx: Math.round(avg), scale: units };
  }
}

// ---------------------------------------------------------------- frame selection
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
// Frames dwell centred on their nominal pose (half-sector bias) so a distance-driven stride
// reads as weight transfer instead of strobing between silhouettes.
function strideFrame(u, n) {
  const p = u - Math.floor(u);
  return Math.min(n - 1, Math.floor((p + 0.5 / n) * n) % n);
}
function ready(id) { const s = sheets[id]; return s && s.state === 'loaded'; }

// Pure state decision: which painted frame an actor wants, independent of pixel availability.
// Returns { set: 'actions'|'main'|'movement', index, key?, kick, tilt }. Exported so the whole
// state matrix can be verified without a browser.
export function resolveState(kind, e, R, t, opts) {
  const o = opts || {};
  const id = IDENTITY[kind];
  const def = id ? SHEETS[id.sheet] : null;
  const cols = def && def.cols ? def.cols : 4;
  const player = !!o.player;
  const sp = R.sp || 0;
  const grounded = e.grounded !== false;
  const atkT = e.attackTimer || 0;
  const dur = R.atk > .1 ? (R.atk > .9 ? .9 : R.atk) : .24;
  const ap = atkT > 0 ? clamp01(1 - atkT / dur) : 0;
  const hitAge = R.hit < -1 ? 99 : t - R.hit;
  let name = 'idle', kick = 0, tilt = 0, movement = false;
  const frameIndex = nm => {
    const i = def && def.frames ? def.frames.indexOf(nm) : -1;
    return (i < 0 ? 0 : i) + (def && def.rowNames ? 0 : 0);
  };

  if (def && def.rowNames) {                      // enemy families: idle / walkA / walkB / aim
    const airborne = !grounded || (e.dashTimer || 0) > 0 || (e.rush || 0) > 0;
    if (atkT > 0 || (e.telegraph || 0) > 0 || (airborne && player)) {
      name = 'aim'; kick = atkT > 0 ? 1 - ap : (airborne ? .5 : 0); tilt = -kick * .04;
    } else if (e.crouching && player) { name = 'aim'; kick = .3; }
    else if (sp > 8) name = (Math.floor((R.u || 0) * 2) % 2) ? 'walkB' : 'walkA';
  } else if (kind === 'blade') {
    if (atkT > 0 && (e.lastAttackKind === 'katana' || e.lastAttackKind === 'fists' || !e.lastAttackKind)) {
      const combo = ((e.combo || 0) % 3) || 3;
      name = ap < .34 ? 'windup' : combo === 1 ? 'cutHoriz' : combo === 2 ? 'cutOverhead' : 'cutRise';
      kick = ap < .34 ? (ap / .34) * .9 : 1 - (ap - .34) / .66;
      tilt = (combo === 1 ? -.035 : combo === 2 ? .05 : -.02) * kick;
    } else if (e.parry > 0) name = 'parry';
    else if (e.dashTimer > 0 || e.rush > 0) name = 'dash';
    else if (!grounded) name = 'jump';
    else if (e.crouching) name = 'crouch';
    else if (sp > 14) movement = true;
  } else if (kind === 'gun') {
    const aim = o.aimLocal;
    const shooting = atkT > 0 || o.aiming;
    if (shooting) {
      name = aim == null ? 'aimFwd' : aim < -.5 ? 'aimUp' : aim > .55 ? 'aimDown' : 'aimFwd';
      if (atkT > 0) { kick = 1 - ap; tilt = -kick * .055; }
    } else if ((e.reloadTimer || 0) > 0) {
      name = 'reload';
      kick = Math.sin(clamp01((e.reloadTimer || 0) / (e.reloadDuration || 1.2)) * Math.PI) * .5;
    } else if (e.dashTimer > 0 || e.rush > 0) name = 'dash';
    else if (!grounded) name = 'jump';
    else if (e.crouching) name = 'crouchAim';
    else if (sp > 14) movement = true;
    if (name === 'idle' && hitAge < .24) { name = 'hurt'; kick = 1 - hitAge / .24; }
  } else {                                        // tank / ghost share the enemy vocabulary
    if (e.dashTimer > 0 || e.rush > 0) name = 'dash';
    else if (!grounded) name = 'jump';
    else if (e.crouching) name = 'crouch';
    else if (sp > 14) name = def && def.frames ? def.frames[strideFrame(R.u || 0, 4)] : 'idle';
  }

  // Supplemental action sheet wins wherever it holds a better pose.
  const reloadP = clamp01(1 - (e.reloadTimer || 0) / (e.reloadDuration || 1.2));
  const gunish = o.art === 'gun' || o.art === 'emitter' || o.art === 'cannon';
  const steep = o.aimLocal != null && (o.aimLocal < -.5 || o.aimLocal > .55);
  let sup = -1;
  let setIsAction = false;
  if (kind === 'gun') {
    if ((e.reloadTimer || 0) > 0) { sup = 4 + Math.min(3, Math.floor(reloadP * 4)); setIsAction = true; }   // staged cylinder reload
    else if (atkT > 0) {
      setIsAction = true;
      if (!grounded) sup = 2;                                                        // air fire
      else if (e.crouching) sup = 3;                                                 // crouch fire
      else if (!steep && sp > 14) sup = (Math.floor((R.u || 0) * 2) % 2) ? 1 : 0;    // run fire, alternating
    }
  } else if (kind === 'blade') {
    if ((e.reloadTimer || 0) > 0 && gunish) { sup = 12; setIsAction = true; }         // magazine reload
    else if (gunish) { setIsAction = true; sup = !grounded ? 11 : e.crouching ? 10 : sp > 14 ? 9 : 8; }  // sidearm set
    else if (e.climbing) { setIsAction = true; sup = (Math.floor(t * 1.7) % 2) ? 14 : 13; }   // climb reach
    else if (hitAge < .24) { setIsAction = true; sup = 15; }                         // hurt
  }
  // Committed actions swap instantly (no transition, no input latency); locomotion and aim
  // changes are allowed a short eased blend.
  const snapNow = setIsAction || /windup|cutHoriz|cutRise|cutOverhead|parry|dash|hurt/i.test(name) || kick > 0;
  if (sup >= 0) return { set: 'actions', index: sup, kick, tilt, name: ACTIONS_FRAMES[sup], moving: sp > 14, snap: true };
  if (movement) return { set: 'movement', key: kind === 'gun' ? 'gun' : 'blade', index: -1, kick, tilt, name: 'run', moving: true, snap: snapNow };
  return { set: 'main', index: frameIndex(name), kick, tilt, name, moving: sp > 14, cols, snap: snapNow };
}
const ACTIONS_FRAMES = SHEETS.actions.frames;

// Identity of the frame actually being drawn: sheet + family + repacked cell. Two different
// painted frames never share an id, so a gait frame change is detected as a real transition.
function figIdOf(fr) {
  const f = fr.fig;
  return f && f.sx !== undefined ? f.sx + '.' + f.sy : (fr.name || '?');
}
// Returns {sheet, fig, kick, tilt, ...} or null when the art is unavailable.
export function pickFrame(kind, e, R, t, opts) {
  const st = resolveState(kind, e, R, t, opts);
  if (st.set === 'actions') {
    const act = sheets.actions;
    if (!act || act.state !== 'loaded' || !act.figs) return null;
    const ac = act.def.cols || 4;
    const fig = act.figs[Math.floor(st.index / ac)] && act.figs[Math.floor(st.index / ac)][st.index % ac];
    if (!fig) return null;
    return { sheet: 'actions', fig, set: 'actions', name: st.name, kick: st.kick, tilt: st.tilt, move: false, moveKey: null, moving: st.moving, index: st.index, units: unitsFor(act, fig), phase: R.u || 0, snap: !!st.snap };
  }
  const id = IDENTITY[kind];
  if (!id) return null;
  const sh = sheets[id.sheet];
  if (!ready(id.sheet)) return null;
  const def = sh.def, cols = def.cols || 1;
  if (st.set === 'movement') {
    const fam = runFamily(kind, R);
    if (!fam) return null;
    return { sheet: 'movement', fig: fam.fig, set: 'movement', name: st.name, kick: st.kick, tilt: st.tilt, move: true, moveKey: fam.key, moving: true, index: fam.row * cols + fam.col, units: sheets.movement.fam[fam.key].scale, phase: R.u || 0, snap: !!st.snap };
  }
  const i = Math.min(st.index, cols * (def.rows || 1) - 1);
  const hero = !def.rowNames;
  const fr = hero ? Math.floor(i / cols) : id.row;
  const fc = hero ? i % cols : i;
  const fig = sh.figs && sh.figs[fr] ? sh.figs[fr][fc] : null;
  if (!fig) return null;
  return { sheet: id.sheet, fig, set: 'main', name: st.name, kick: st.kick, tilt: st.tilt, move: false, moveKey: null, moving: st.moving, index: i, units: unitsFor(sh, fig), phase: R.u || 0, snap: !!st.snap };
}
// Preferred real run cycle from the movement atlas, positioned on the gait phase.
function runFamily(kind, R) {
  const key = kind === 'gun' ? 'gun' : kind === 'blade' ? 'blade' : null;
  if (!key) return null;
  const ms = sheets.movement;
  if (!ready('movement') || !ms.fam[key] || ms.fam[key].figs.length < 4) return null;
  const fams = ms.fam[key];
  const cols = ms.def.cols || 4;
  const u = R.u || 0;
  const k = strideFrame(u, fams.frames);
  const row = fams.rows[Math.floor(k / cols)], col = k % cols;
  const fig = ms.figs[row] && ms.figs[row][col];
  if (!fig) return null;
  return { fig, row, col, family: fams, key };
}
function bobFor() { return 0; }
// Units per source pixel for a figure: its own family reference, else the hero sheet it matches,
// else the sheet default. Resolved per draw so atlas load order cannot change the result.
export function unitsFor(sh, fig) {
  if (fig && fig.units) return fig.units;
  if (fig && fig.match) {
    const m = sheets[fig.match];
    if (m && m.scale) return m.scale;
  }
  return sh.scale || 1;
}
// Draws the selected figure with the feet anchored on the local origin (+x forward).
// `units` is world units per source pixel, so a standing reference frame lands at actor height.
export function blitFigure(c, sh, fig, height) {
  const k = unitsFor(sh, fig) * ((height || WORLD_H) / WORLD_H);
  const dw = fig.sw * k, dh = fig.sh * k;
  c.drawImage(sh.clean, fig.sx, fig.sy, fig.sw, fig.sh, -dw * fig.ax, -dh * fig.ay, dw, dh);
  return true;
}
// Raw-grid fallback for a sheet that could not be measured (no canvas / tainted read).
function blitRaw(c, sh, row, index, height) {
  const cols = sh.def.cols || 1, rows = sh.def.rows || 1;
  const x = index % cols, y = Math.floor(index / cols);
  if (y >= rows) return false;
  const cw = sh.cw, chh = sh.ch, pad = 2;
  const k = ((height || WORLD_H) / WORLD_H);
  c.drawImage(sh.img, x * cw + pad, y * chh + pad, cw - pad * 2, chh - pad * 2,
    -((cw - pad * 2) * k) / 2, -(chh - pad * 2) * k + 1, (cw - pad * 2) * k, (chh - pad * 2) * k);
  return true;
}
export function hasSprite(kind) {
  const id = IDENTITY[kind];
  return !!(id && ready(id.sheet));
}

// ---------------------------------------------------------------- entry point
// Painted human draw. Returns false when the art is unavailable so the caller can fall back.
// Expects the caller's transform to already sit on the actor's foot centre, mirrored by facing.
export function drawSpriteHuman(c, e, t, player, kind, ghost, o) {
  if (!started) preloadSprites();
  const R = o.R;
  let fr;
  if (ghost && R && R.sprite) {
    fr = R.sprite;                               // frozen history: replayed verbatim
  } else {
    fr = pickFrame(kind, e, R, t, o);
    if (!fr) return false;
    // Breathing / weight transform is captured on the live pass only and travels inside the
    // descriptor, so a ghost can never recompute it from the live clock.
    const ph = e.phase || 0;
    const still = fr.kick || fr.snap;
    fr.bobY = still ? 0 : Math.sin(t * 1.7 + ph) * (fr.moving ? .18 : .34);
    fr.rot = still ? 0 : Math.sin(t * 1.15 + ph) * (fr.moving ? .004 : .009);
    if (!ghost && R) commitFrame(R, fr, t, (e.dir || 1) < 0 ? -1 : 1);
  }
  const sh = sheets[fr.sheet];
  if (!sh) return false;
  c.save();
  // Restrained eased transition between locomotion/aim frames (<=50ms). Attack, parry, reload and
  // fire frames carry snap:true and swap immediately, so no input latency is introduced there.
  const blend = fr.blend === undefined ? 1 : fr.blend;
  const prev = fr.prevSprite;
  const eased = !!(prev && blend < 1 && !fr.snap && prev.sheet === fr.sheet);
  if (eased) paintOne(c, sheets[prev.sheet], prev, o.height, 1 - blend);
  const ok = paintOne(c, sh, fr, o.height, eased ? blend : 1);
  c.restore();
  return ok !== false;
}
const BLEND_MS = 0.05;                      // 50ms ceiling for one frame transition
// Shallow copy without the history field, so a captured predecessor can never chain recursively
// (echo cloning serialises these descriptors).
function freezePrev(fr) {
  if (!fr) return null;
  const p = {};
  for (const k in fr) if (k !== 'prevSprite') p[k] = fr[k];
  p.prevSprite = null;
  p.blend = 1;
  return p;
}
function commitFrame(R, fr, t, face) {
  const id = fr.set + '|' + fr.sheet + '|' + (fr.moveKey || '') + '|' + figIdOf(fr);
  if (R.sprite && id !== R.frameId) { R.prevSprite = freezePrev(R.sprite); R.blendStart = t; }
  R.frameId = id;
  R.sprite = fr;
  fr.blend = R.blendStart >= 0 && t !== undefined ? clamp01((t - R.blendStart) / BLEND_MS) : 1;
  if (fr.blend >= 1) R.prevSprite = null;
  fr.prevSprite = R.prevSprite;
  if (R.snap) {
    R.snap.sprite = fr; R.snap.prevSprite = fr.prevSprite; R.snap.blend = fr.blend;
    R.snap.face = face === undefined ? 1 : face;
  }
}
function paintOne(c, sh, fr, height, alpha) {
  if (!sh || !fr.fig) return false;
  // Each frame is transform-isolated so a predecessor's bob/rotation/kick can never carry over.
  c.save();
  const prevA = c.globalAlpha;
  c.globalAlpha = prevA * (alpha === undefined ? 1 : alpha);
  if (fr.bobY || fr.rot) { c.translate(0, fr.bobY || 0); c.rotate(fr.rot || 0); }
  if (fr.kick > 0) { c.translate(-fr.kick * 2, 0); c.rotate(fr.tilt); }
  let ok = false;
  if (fr.move && sh.fam && sh.fam[fr.moveKey]) {
    const fams = sh.fam[fr.moveKey];
    const k = fams.scale * ((height || WORLD_H) / WORLD_H);
    const dw = fr.fig.sw * k, dh = fr.fig.sh * k;
    c.drawImage(sh.clean, fr.fig.sx, fr.fig.sy, fr.fig.sw, fr.fig.sh, -dw * fr.fig.ax, -dh * fr.fig.ay, dw, dh);
    ok = true;
  } else if (fr.fig && sh.clean) {
    ok = blitFigure(c, sh, fr.fig, height);
  } else if (sh.img) {
    const def = sh.def;
    const fi = def.frames ? def.frames.indexOf(fr.name) : -1;
    const i = Math.min(fi < 0 ? 0 : fi, (def.cols * def.rows) - 1);
    ok = blitRaw(c, sh, 0, i, height);
  }
  c.globalAlpha = prevA;
  c.restore();
  return ok;
}
// Civilian frame choice: role picks the family row, gait phase alternates the walk pair,
// panic uses the startled pose. Returns the same descriptor shape as pickFrame.
export function pickResidentFrame(e, R, t) {
  const sh = sheets.civilians;
  if (!sh || sh.state !== 'loaded' || !sh.figs || !sh.measured) return null;
  const row = CIVILIAN_ROW[e.role] === undefined ? 3 : CIVILIAN_ROW[e.role];
  const def = sh.def, cols = def.cols || 4;
  const panic = e.panic > 0;
  const sp = R.sp || 0;
  let col = 0;
  if (panic) col = 3;
  else if (sp > 8) col = (Math.floor((R.u || 0) * 2) % 2) ? 2 : 1;
  const fig = sh.figs[row] && sh.figs[row][col];
  if (!fig) return null;
  // Panic is a committed reaction: snap instantly, never ease into it.
  return { sheet: 'civilians', fig, set: 'civilians', name: def.frames[col], kick: 0, tilt: 0, move: false, moveKey: null, moving: sp > 14, panic, snap: !!panic, units: fig.units || sh.scale, phase: R.u || 0 };
}
// Painted civilian draw. Umbrella/props are baked into these poses, so the procedural
// accessories are skipped while the speech bubble (drawn by the caller) is preserved.
export function drawSpriteResident(c, e, t, R, height, ghost) {
  if (!started) preloadSprites();
  let fr;
  if (ghost && R && R.sprite) fr = R.sprite;
  else {
    fr = pickResidentFrame(e, R, t);
    if (!fr) return false;
    const ph = e.phase || 0;
    fr.bobY = fr.panic ? 0 : Math.sin(t * 1.6 + ph) * .22;
    fr.rot = fr.panic ? 0 : Math.sin(t * 1.1 + ph) * .006;
    if (!ghost && R) commitFrame(R, fr, t, (e.dir || 1) < 0 ? -1 : 1);
  }
  const sh = sheets.civilians;
  const blend = fr.blend === undefined ? 1 : fr.blend;
  const prev = fr.prevSprite;
  const eased = !!(prev && blend < 1 && !fr.snap && prev.sheet === fr.sheet);
  // Same transform isolation and complementary weights as the heroes; panic snaps instantly.
  if (eased) paintOne(c, sheets[prev.sheet], prev, height || WORLD_H, 1 - blend);
  return paintOne(c, sh, fr, height || WORLD_H, eased ? blend : 1);
}
export function hasCivilianSprite() { const s = sheets.civilians; return !!(s && s.state === 'loaded' && s.measured); }
// Afterimage contract: the exact painted frame a historical copy must reproduce.
export const SPRITE_SNAP_KEYS = ['sprite', 'face'];
export function spriteFrameSnapshot(e, t) {
  const s = rigMemory(e, t, true);
  return { sprite: s.sprite, face: s.face };
}
// Plain data for the animation lab / loading screens: names, order and per-sheet facts.
export function spriteManifest() {
  const out = { base, worldHeight: WORLD_H, sheets: {}, identity: {} };
  for (const id in SHEETS) {
    const s = sheets[id];
    out.sheets[id] = {
      file: s.def.file, state: s.state, cols: s.def.cols, rows: s.def.rows,
      frames: s.def.frames ? s.def.frames.slice() : null,
      rowNames: s.def.rowNames ? s.def.rowNames.slice() : null,
      families: s.def.families ? Object.keys(s.def.families) : null,
      unitsPerPixel: s.scale || 0, refPx: s.refPx || 0, rowUnits: s.rowUnits || null, measured: s.measured
    };
  }
  for (const kind in IDENTITY) out.identity[kind] = { sheet: IDENTITY[kind].sheet, row: IDENTITY[kind].row };
  return out;
}
// Frame chosen for an actor right now (lab previews and tests).
export function currentFrame(kind, e, t, opts) {
  if (!started) preloadSprites();
  const R = rigMemory(e, t, false);
  return pickFrame(kind, e, R, t, opts || {});
}

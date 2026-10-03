// Painted Warden atlas: assets/characters/warden-painted-v1.png, 4 columns x 2 rows.
// Poses 0 idle, 1 strideA, 2 strideB, 3 cleaverWindup, 4 lowCharge, 5 cleaverSweep,
// 6 stagger, 7 rage. Side facing right with real alpha.
//
// One constant pixels-per-world-unit scale taken from the standing pose, with every
// other pose anchored on its own measured foot line, so a crouch or wind-up never
// gets renormalised into an upright full-height rectangle.
// Node-safe: nothing touches Image or document at import time; a missing or
// unreadable sheet reports it and the caller falls back.
const FILE = 'warden-painted-v1.png';
const COLS = 4, ROWS = 2, WORLD_H = 86;      // gameplay Warden height, in world pixels
const SOLID = 140, SOFT = 16, GLOW = 22;
const POSE = { IDLE: 0, STRIDE_A: 1, STRIDE_B: 2, WINDUP: 3, LOW_CHARGE: 4, SWEEP: 5, STAGGER: 6, RAGE: 7 };
const POSE_NAME = ['idle', 'strideA', 'strideB', 'cleaverWindup', 'lowCharge', 'cleaverSweep', 'stagger', 'rage'];

const sheet = {
  img: null, state: 'idle', w: 0, h: 0, cw: 0, ch: 0, figs: null, clean: null,
  unitsPerPixel: 0, refPx: 0, refSource: 'standing', measured: false, diag: null,
  fallbacks: [], defects: {}, warned: false
};
const waiters = [];
let started = false;

export function wardenStatus() {
  return {
    file: FILE, state: sheet.state, w: sheet.w, h: sheet.h, cols: COLS, rows: ROWS,
    figures: sheet.figs ? sheet.figs.flat().filter(Boolean).length : 0,
    measured: sheet.measured,
    unitsPerPixel: sheet.unitsPerPixel ? +sheet.unitsPerPixel.toFixed(5) : 0,
    refPx: sheet.refPx,
    refSource: sheet.refSource || 'standing',
    clean: sheet.clean ? { w: sheet.clean.width, h: sheet.clean.height } : null
  };
}
function dom() { return typeof document !== 'undefined' && !!document.createElement; }
export function preloadWarden() {
  if (!started) {
    started = true;
    if (!dom() && typeof Image !== 'function') sheet.state = 'unsupported';
    else {
      const im = typeof Image === 'function' ? new Image() : document.createElement('img');
      sheet.state = 'loading';
      im.onload = () => {
        sheet.img = im;
        sheet.w = im.naturalWidth || im.width || 0;
        sheet.h = im.naturalHeight || im.height || 0;
        sheet.cw = sheet.w / COLS; sheet.ch = sheet.h / ROWS;
        sheet.state = 'loaded';
        try { measure(); } catch { sheet.measured = false; }
        settle();
      };
      im.onerror = () => { sheet.state = 'error'; settle(); };
      im.src = new URL('../assets/characters/' + FILE, import.meta.url).href;
    }
  }
  if (sheet.state !== 'loading') return Promise.resolve(wardenStatus());
  return new Promise(res => waiters.push(res));
}
function settle() {
  if (sheet.state === 'loading') return;
  const st = wardenStatus();
  for (let i = 0; i < waiters.length; i++) { try { waiters[i](st); } catch { /* listener owns its errors */ } }
  waiters.length = 0;
}
export function wardenReady() { return sheet.state === 'loaded' && !!sheet.clean && sheet.measured && sheet.unitsPerPixel > 0; }

// --- measurement --------------------------------------------------------------
// Label every solid component inside one nominal cell, keep the LARGEST one as the body,
// absorb components that touch it (a cleaver held against the body is not a second actor),
// then let a bounded soft-glow pass follow so neighbouring art cannot bleed in.
function isolate(A, W, H, label, id, cx, cy, cw, ch) {
  const x0 = Math.max(0, cx), y0 = Math.max(0, cy);
  const x1 = Math.min(cx + cw, W), y1 = Math.min(cy + ch, H);
  const lw = x1 - x0, lh = y1 - y0;
  if (lw <= 0 || lh <= 0) return null;
  const comp = new Int32Array(lw * lh);
  const comps = [], stack = [];
  for (let ly = 0; ly < lh; ly++) for (let lx = 0; lx < lw; lx++) {
    const li = ly * lw + lx;
    if (comp[li] || A[(y0 + ly) * W + (x0 + lx)] < SOLID) continue;
    const cid = comps.length + 1;
    const own = [];
    stack.length = 0; stack.push(li); comp[li] = cid;
    while (stack.length) {
      const p = stack.pop();
      own.push(p);
      const px = p % lw, py = (p / lw) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= lw || ny >= lh) continue;
        const n = ny * lw + nx;
        if (comp[n] || A[(y0 + ny) * W + (x0 + nx)] < SOLID) continue;
        comp[n] = cid; stack.push(n);
      }
    }
    comps.push(own);
  }
  if (!comps.length) return null;
  // Largest solid component wins. Seeding from the first strongest-alpha pixel instead let a
  // detached speck or a bright cleaver tip become the whole "actor", which is what left the
  // charge and phase-2 poses rendering as nothing but glow.
  let main = 0;
  for (let i = 1; i < comps.length; i++) if (comps[i].length > comps[main].length) main = i;
  const abs = li => ((y0 + ((li / lw) | 0)) * W) + (x0 + (li % lw));
  const boxOf = own => {
    let a = W, b = H, c = -1, d = -1;
    for (const li of own) { const p = abs(li), px = p % W, py = (p / W) | 0; if (px < a) a = px; if (px > c) c = px; if (py < b) b = py; if (py > d) d = py; }
    return { x0: a, y0: b, x1: c, y1: d };
  };
  const mb = boxOf(comps[main]);
  const owned = comps[main].slice();
  for (let i = 0; i < comps.length; i++) {
    if (i === main || comps[i].length * 3 > owned.length) continue;  // never let a speck win
    const b = boxOf(comps[i]);
    const touch = b.x1 >= mb.x0 - 6 && b.x0 <= mb.x1 + 6 && b.y1 >= mb.y0 - 6 && b.y0 <= mb.y1 + 6;
    if (touch) for (const li of comps[i]) owned.push(li);
  }
  // bounded soft-glow expansion from the selected body only
  const taken = new Uint8Array(lw * lh);
  const all = [];
  for (const li of owned) { if (!taken[li]) { taken[li] = 1; all.push(abs(li)); } }
  let frontier = owned.slice();
  for (let dpt = 0; dpt < GLOW && frontier.length; dpt++) {
    const next = [];
    for (const li of frontier) {
      const px = li % lw, py = (li / lw) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= lw || ny >= lh) continue;
        const n = ny * lw + nx;
        if (taken[n]) continue;
        const a = A[(y0 + ny) * W + (x0 + nx)];
        if (a < SOFT || a >= SOLID) continue;
        taken[n] = 1; all.push(abs(n)); next.push(n);
      }
    }
    frontier = next;
  }
  let bx0 = W, by0 = H, bx1 = -1, by1 = -1, foot = -1, solidTop = -1, solidPx = 0, maxA = 0;
  for (const p of all) {
    label[p] = id;
    const px = p % W, py = (p / W) | 0, a = A[p];
    if (px < bx0) bx0 = px; if (px > bx1) bx1 = px;
    if (py < by0) by0 = py; if (py > by1) by1 = py;
    if (a > maxA) maxA = a;
    if (a >= SOLID) {
      solidPx++;
      if (py > foot) foot = py;
      if (solidTop < 0 || py < solidTop) solidTop = py;
    }
  }
  if (bx1 < 0 || foot < 0 || solidTop < 0) return null;
  // bodyPx counts painted solid art only: the soft glow halo must not set the scale
  const bodyPx = foot - solidTop;
  const bandTop = foot - bodyPx * .55;
  let sx = 0, sw = 0;
  for (const p of all) {
    if ((p / W | 0) > bandTop) continue;
    const a = A[p];
    sx += (p % W) * a; sw += a;
  }
  // cx/foot stay absolute source pixels; the repack converts them to local crop anchors
  return {
    id, x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1, foot,
    cx: sw > 0 ? sx / sw : (bx0 + bx1) / 2, bodyPx, solidPx, maxA
  };
}
function measure() {
  if (!dom()) return;
  const { w: W, h: H, cw, ch } = sheet;
  if (!W || !H) return;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  if (!g) return;
  g.clearRect(0, 0, W, H);
  g.drawImage(sheet.img, 0, 0);
  let data;
  try { data = g.getImageData(0, 0, W, H).data; } catch { return; }
  const A = new Uint8Array(W * H);
  for (let i = 0, p = 3; i < A.length; i++, p += 4) A[i] = data[p];
  const label = new Int32Array(A.length);
  const figs = [];
  let id = 0, maxW = 8, maxH = 8;
  for (let r = 0; r < ROWS; r++) {
    figs[r] = [];
    for (let i = 0; i < COLS; i++) {
      const f = isolate(A, W, H, label, ++id, Math.round(i * cw), Math.round(r * ch), Math.round(cw), Math.round(ch));
      figs[r][i] = f;
      if (f) { if (f.w > maxW) maxW = f.w; if (f.h > maxH) maxH = f.h; }
    }
  }
  if (!id || maxH < 4) return;
  const cellW = maxW + 4, cellH = maxH + 6;
  const out = document.createElement('canvas');
  out.width = cellW * COLS; out.height = cellH * ROWS;
  const og = out.getContext('2d');
  const tmp = document.createElement('canvas');
  for (let r = 0; r < ROWS; r++) for (let i = 0; i < COLS; i++) {
    const f = figs[r][i];
    if (!f) continue;
    tmp.width = f.w; tmp.height = f.h;
    const tg = tmp.getContext('2d');
    const img = tg.createImageData(f.w, f.h);
    // Painted RGB is copied verbatim; only alpha is masked by the isolated label, so
    // real materials, shading and the red powered joints survive the repack.
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const sp = (f.y + y) * W + (f.x + x), o = (y * f.w + x) * 4, q = sp * 4;
      img.data[o] = data[q]; img.data[o + 1] = data[q + 1]; img.data[o + 2] = data[q + 2];
      img.data[o + 3] = label[sp] === f.id ? A[sp] : 0;
    }
    tg.putImageData(img, 0, 0);
    // Local crop anchors: cx/foot are absolute source pixels, so convert before use. Because
    // ax/ay are normalised against the crop itself, where the crop sits inside the clean
    // canvas does not affect the drawn result - only containment matters. Centring each
    // crop in its own cell therefore guarantees bounds for every pose, including
    // forward-leaning cleaver frames whose weighted centroid sits far from the crop
    // centre (subtracting that offset globally is what blanked charge and phase 2).
    const localCx = f.cx - f.x, localFoot = f.foot - f.y;
    const sx = i * cellW + Math.round((cellW - f.w) / 2);
    const sy = r * cellH + Math.round((cellH - f.h) / 2);
    og.drawImage(tmp, sx, sy);
    f.sx = sx; f.sy = sy; f.sw = f.w; f.sh = f.h;
    f.lcx = localCx; f.lfoot = localFoot;
    f.ax = localCx / f.w;          // normalized foot-anchor x inside the source crop
    f.ay = localFoot / f.h;        // normalized foot-anchor y inside the source crop
  }
  sheet.clean = out;
  sheet.figs = figs;
  // Scale comes from the standing pose, but a standing pose that measured as a fragment
  // would wreck every other pose, so fall back to the median body height in that case.
  const bodies = [];
  for (const row of figs) for (const f of row) if (f && f.bodyPx > 0) bodies.push(f.bodyPx);
  bodies.sort((a, b) => a - b);
  const median = bodies.length ? bodies[bodies.length >> 1] : 0;
  const standing = figs[0] && figs[0][0] ? figs[0][0].bodyPx : 0;
  let refPx = standing, refSource = 'standing';
  if (!(standing > 0) || (median > 0 && (standing < median * .6 || standing > median * 1.6))) {
    refPx = median; refSource = 'median';
  }
  sheet.refPx = refPx;
  sheet.refSource = refSource;
  // ONE constant world-units-per-source-pixel factor for all eight poses. The standing
  // reference pose then measures exactly WORLD_H world pixels tall.
  sheet.unitsPerPixel = sheet.refPx > 0 ? WORLD_H / sheet.refPx : 0;
  sheet.measured = sheet.refPx > 0 && !!sheet.clean;
  sheet.defects = {};
  sheet.fallbacks = [];
  sheet.warned = false;
  sheet.diag = validate();
}

// Every pose is reported, valid or not: source rect, bounds, destination size and the
// visible source alpha measured during isolation. Nothing is skipped silently.
export function validate() {
  const rows = [];
  if (!sheet.figs || !sheet.clean) return rows;
  const upp = sheet.unitsPerPixel || 0, CW = sheet.clean.width, CH = sheet.clean.height;
  for (let pose = 0; pose < COLS * ROWS; pose++) {
    const r = Math.floor(pose / COLS), i = pose % COLS;
    const f = sheet.figs[r] && sheet.figs[r][i];
    if (!f) {
      rows.push({ pose, name: POSE_NAME[pose], present: false, alphaOk: false, reason: 'no isolated figure: cell has no solid alpha' });
      continue;
    }
    const dw = f.sw * upp, dh = f.sh * upp;
    const oy = -dh * f.ay, ox = -dw * f.ax;
    rows.push({
      pose, name: POSE_NAME[pose], present: true,
      bodyPx: f.bodyPx, bodyWorldPx: +(f.bodyPx * upp).toFixed(1), solidPx: f.solidPx, maxAlpha: f.maxA,
      // visible source alpha: the isolated crop must actually carry painted pixels
      alphaOk: f.solidPx >= 64 && f.maxA >= 200,
      src: { x: f.sx, y: f.sy, w: f.sw, h: f.sh },
      srcInBounds: f.sx >= 0 && f.sy >= 0 && f.sx + f.sw <= CW && f.sy + f.sh <= CH,
      dst: { w: +dw.toFixed(2), h: +dh.toFixed(2), ox: +ox.toFixed(2), oy: +oy.toFixed(2) },
      // A full painted body anchored at its foot sits entirely above the origin, so the
      // foot offset runs from 0 down to the drawn height - not "less than half an actor".
      // Requiring |oy| < WORLD_H*.5 wrongly failed healthy standing frames (~86).
      anchorOk: f.ax >= 0 && f.ax <= 1 && f.ay >= 0 && f.ay <= 1,
      sizeOk: dw > 0 && dh > 0 && dh <= WORLD_H * 2 && f.ax >= 0 && f.ax <= 1 && f.ay >= 0 && f.ay <= 1
    });
  }
  return rows;
}
export function wardenDiagnostics() {
  const frames = sheet.diag && sheet.diag.length ? sheet.diag : validate();
  return {
    status: wardenStatus(), refSource: sheet.refSource || 'standing', frames,
    bad: frames.filter(f => !f.present || !f.srcInBounds || !f.sizeOk || !f.alphaOk),
    guardRejects: Object.values(sheet.defects || {}),
    fallbacks: sheet.fallbacks.slice()
  };
}
export function injectWarden(img) {
  if (!img) return false;
  sheet.img = img;
  sheet.w = img.naturalWidth || img.width || 0;
  sheet.h = img.naturalHeight || img.height || 0;
  sheet.cw = sheet.w / COLS; sheet.ch = sheet.h / ROWS;
  sheet.state = 'loaded';
  started = true;
  try { measure(); } catch { sheet.measured = false; }
  settle();
  return true;
}

// --- pose selection -----------------------------------------------------------
// Boss mechanics are untouched: only the visual pose is derived from existing fields.
export function pickWardenPose(e, t) {
  const windup = e.telegraph > 0 ? Math.min(1, (e.telegraph || 0) / (e.phase === 1 ? .9 : .78)) : 0;
  const rage = e.phase === 2 || (e.maxHp ? e.hp < e.maxHp * .5 : false);
  if (e.dead) return POSE.STAGGER;
  if (e.charge > 0) return POSE.SWEEP;
  if (windup > 0) return windup > .55 ? POSE.LOW_CHARGE : POSE.WINDUP;
  if (e.stun > 0 || (e.flash || 0) > 0) return POSE.STAGGER;
  if (rage) return POSE.RAGE;
  if ((e.cooldown || 0) > .35 && Math.sin(t * 2.2) > .2) return POSE.LOW_CHARGE;
  // patrol weight shift: two strides on a slow cadence, driven by the patrol clock
  const gait = (t * 1.35 + (e.minX || 0) * .001) % 1;
  return gait < .5 ? POSE.STRIDE_A : POSE.STRIDE_B;
}
// Every unusable frame is recorded and reported once, whether it failed isolation or the
// draw guard. Nothing is skipped silently.
function noteDefect(pose, reason) {
  sheet.defects = sheet.defects || {};
  const rec = sheet.defects[pose] || (sheet.defects[pose] = { pose, name: POSE_NAME[pose], reasons: [], hits: 0 });
  if (!rec.reasons.includes(reason)) rec.reasons.push(reason);
  rec.hits++;
  if (!sheet.warned && typeof console !== 'undefined') {
    sheet.warned = true;
    const rows = (sheet.diag || validate()).filter(r => !r.present || !r.alphaOk || !r.srcInBounds || !r.sizeOk);
    console.warn('[warden] unusable atlas frames:', rows.length ? rows : 'none', '· guard rejects:', Object.values(sheet.defects));
  }
}
function figureOf(pose) {
  const want = sheet.figs && sheet.figs[Math.floor(pose / COLS)];
  const f = want && want[pose % COLS];
  if (f && f.sw) return f;
  // keep the boss visible while the defect stays on record for review
  noteDefect(pose, 'no-figure');
  const alt = sheet.figs && sheet.figs[0] && sheet.figs[0][0];
  sheet.fallbacks.push({ pose });
  if (sheet.fallbacks.length > 24) sheet.fallbacks.shift();
  return alt;
}
// Draws the Warden with its feet on the caller's origin, +x is forward.
// Returns false when the painted sheet is unavailable so the caller can fall back.
export function drawWardenPainted(c, e, t) {
  if (!wardenReady()) return false;
  const upp = sheet.unitsPerPixel;
  const pose = pickWardenPose(e, t);
  if (!(upp > 0) || upp > 1) { noteDefect(pose, 'bad-scale'); return false; }
  const fig = figureOf(pose);
  if (!fig || !fig.sw) return false;
  const CW = sheet.clean.width, CH = sheet.clean.height;
  if (fig.sx < 0 || fig.sy < 0 || fig.sx + fig.sw > CW || fig.sy + fig.sh > CH) { noteDefect(pose, 'src-bounds'); return false; }
  // world-unit destination: source pixels * (WORLD_H / refPx)
  const dw = fig.sw * upp, dh = fig.sh * upp;
  if (!(dw > 0) || !(dh > 0) || dh > WORLD_H * 2) { noteDefect(pose, 'dst-size'); return false; }
  // the foot anchor must sit inside its own crop, and the body must hang above the origin
  if (!(fig.ax >= 0 && fig.ax <= 1 && fig.ay >= 0 && fig.ay <= 1)) { noteDefect(pose, 'anchor'); return false; }
  const h = e.h || WORLD_H;
  const rage = e.phase === 2 || (e.maxHp ? e.hp < e.maxHp * .5 : false);
  const windup = e.telegraph > 0 ? Math.min(1, (e.telegraph || 0) / (e.phase === 1 ? .9 : .78)) : 0;
  const flash = Math.min(1, (e.flash || 0) / .12);
  c.save();
  if (e.dead) { c.rotate(-1.15); c.translate(0, -h * .06); c.globalAlpha *= .8; }
  // planted charge leans into the direction of travel, the sweep follows through
  else if (e.charge > 0) c.rotate(-.12);
  else if (windup > 0) c.rotate(windup * .05);
  c.drawImage(sheet.clean, fig.sx, fig.sy, fig.sw, fig.sh, -dw * fig.ax, -dh * fig.ay, dw, dh);
  if (flash > 0) {
    // additive hit bloom, never a repaint: the painted detail stays readable
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(0, -h * .58, 2, 0, -h * .58, h * .5);
    g.addColorStop(0, `rgba(255,226,214,${.55 * flash})`); g.addColorStop(1, 'rgba(255,226,214,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(0, -h * .56, h * .42, h * .5, 0, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
  // Restrained powered core: a local red glow that swells through the wind-up only.
  const coreY = -h * .62, coreX = h * .04;
  const pulse = .55 + .45 * Math.sin(t * (rage ? 8 : 3.2));
  const power = .1 + windup * .5 + (e.charge > 0 ? .35 : 0) + (rage ? .12 : 0);
  if (power > .06) {
    const col = rage ? '255,150,60' : '255,64,72';
    const r = h * (.16 + power * .12);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(coreX, coreY, 0, coreX, coreY, r);
    g.addColorStop(0, `rgba(${col},${.55 * power * pulse})`);
    g.addColorStop(.5, `rgba(${col},${.22 * power * pulse})`);
    g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g;
    c.beginPath(); c.arc(coreX, coreY, r, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  return true;
}
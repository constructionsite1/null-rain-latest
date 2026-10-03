// Photopixel world surface art: painted material tiles for existing geometry + a far-background
// panorama. Shared contract for the renderer. Node-safe: no DOM access at import time, and every
// entry point reports false (so callers keep their existing visuals) until the art is ready.
export const WORLD_ART_BASE = 'assets/world/';

// Material atlas is an opaque 4x2 grid. Index order matches the art brief.
export const MATERIALS = ['brick', 'plaster', 'metal', 'corrugated', 'wood', 'pavement', 'glass', 'foundation'];
const MAT_ALIAS = {
  brick: 0, plaster: 0 + 1, concrete: 1, metal: 2, gunmetal: 2, panel: 2, corrugated: 3, freight: 3,
  wood: 4, planks: 4, pavement: 5, asphalt: 5, road: 5, glass: 6, foundation: 7, rubble: 7, stone: 7
};
const ATLAS_COLS = 4, ATLAS_ROWS = 2;
const PANORAMA = 'painted-city-v1.png';
const ATLAS = 'photopixel-materials-v1.png';

const state = {
  atlas: null, atlasState: 'idle', aw: 0, ah: 0,
  pan: null, panState: 'idle', pw: 0, ph: 0,
  started: false, tiles: {}, patterns: {}, veil: null
};
const waiters = [];

// ---------------------------------------------------------------- loading
function dom() { return typeof document !== 'undefined' && !!document.createElement; }
function makeImage() {
  if (typeof Image === 'function') return new Image();
  if (!dom()) return null;
  const el = document.createElement('img');
  if ('decoding' in el) el.decoding = 'async';
  return el;
}
function loadOne(url, onReady, onFail) {
  const im = makeImage();
  if (!im) { onFail(); return; }
  im.onload = () => onReady(im);
  im.onerror = onFail;
  im.src = url;
}
export function preloadWorldArt() {
  if (!state.started) start();
  if (worldArtStatus().settled) return Promise.resolve(worldArtStatus());
  return new Promise(res => waiters.push(res));
}
function start() {
  state.started = true;
  if (!dom() && typeof Image !== 'function') {
    state.atlasState = 'unsupported'; state.panState = 'unsupported';
    return;
  }
  state.atlasState = 'loading'; state.panState = 'loading';
  loadOne(WORLD_ART_BASE + ATLAS, im => {
    state.atlas = im;
    state.aw = im.naturalWidth || im.width || 0;
    state.ah = im.naturalHeight || im.height || 0;
    state.atlasState = state.aw > 0 ? 'loaded' : 'error';
    settle();
  }, () => { state.atlasState = 'error'; settle(); });
  loadOne(WORLD_ART_BASE + PANORAMA, im => {
    state.pan = im;
    state.pw = im.naturalWidth || im.width || 0;
    state.ph = im.naturalHeight || im.height || 0;
    state.panState = state.pw > 0 ? 'loaded' : 'error';
    settle();
  }, () => { state.panState = 'error'; settle(); });
}
// Fires once both images are terminal (loaded, error or unsupported).
function settle() {
  const st = worldArtStatus();
  if (!st.settled) return st;
  const list = waiters.slice();
  waiters.length = 0;
  for (let i = 0; i < list.length; i++) { try { list[i](st); } catch { /* listener owns errors */ } }
  return st;
}
export function onWorldArtReady(cb) {
  if (typeof cb !== 'function') return () => { };
  if (!state.started) start();
  if (worldArtStatus().settled) { cb(worldArtStatus()); return () => { }; }
  waiters.push(cb);
  return () => { const i = waiters.indexOf(cb); if (i >= 0) waiters.splice(i, 1); };
}
export function worldArtStatus() {
  const pending = (state.atlasState === 'loading' || state.atlasState === 'idle' ? 1 : 0)
    + (state.panState === 'loading' || state.panState === 'idle' ? 1 : 0);
  return {
    base: WORLD_ART_BASE,
    started: state.started,
    settled: state.started && pending === 0,
    ready: state.atlasState === 'loaded',
    panorama: state.panState === 'loaded',
    materials: state.tiles ? Object.keys(state.tiles).length : 0,
    atlas: { state: state.atlasState, w: state.aw, h: state.ah, cols: ATLAS_COLS, rows: ATLAS_ROWS, file: ATLAS },
    pan: { state: state.panState, w: state.pw, h: state.ph, file: PANORAMA }
  };
}
export function setWorldArtBase(url) { /* reserved for alternate hosting */ }

// ---------------------------------------------------------------- tiles
// Tiles are built once per (material, world size, variant). The declared `scale` really changes
// the material's world size, the atlas crop is inset to drop the baked gutter, and a repeat
// pattern is cached per key. No per-frame image reads.
const TILE_SIZES = [32, 48, 64, 96, 128];
const GUTTER = 2;
const tileSize = s => {
  const want = s && s > 4 ? s : 64;
  let best = TILE_SIZES[0];
  for (const t of TILE_SIZES) if (Math.abs(t - want) < Math.abs(best - want)) best = t;
  return best;
};
function tileFor(name, size, variant) {
  const key = name + ':' + size + ':' + variant;
  if (state.tiles[key]) return state.tiles[key];
  if (state.atlasState !== 'loaded' || !state.aw) return null;
  if (!dom()) return null;
  const i = MAT_ALIAS[name] === undefined ? -1 : MAT_ALIAS[name];
  if (i < 0 || i >= MATERIALS.length) return null;
  const cw = state.aw / ATLAS_COLS, chh = state.ah / ATLAS_ROWS;
  const sx = (i % ATLAS_COLS) * cw + GUTTER, sy = Math.floor(i / ATLAS_COLS) * chh + GUTTER;
  const sw = cw - GUTTER * 2, sh = chh - GUTTER * 2;
  if (!(sw > 0) || !(sh > 0)) return null;
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const g = cv.getContext('2d');
  if (!g) return null;
  if (variant) { g.translate(size, size); g.rotate(Math.PI); }
  g.drawImage(state.atlas, sx, sy, sw, sh, 0, 0, size, size);
  state.tiles[key] = cv;
  return cv;
}
function patternFor(c, name, size, variant) {
  const key = name + ':' + size + ':' + variant;
  if (state.patterns[key]) return state.patterns[key];
  const tile = tileFor(name, size, variant);
  if (!tile) return null;
  let p = null;
  try { p = c.createPattern(tile, 'repeat'); } catch { p = null; }
  if (p) state.patterns[key] = p;
  return p;
}
function veilFor() {
  if (state.veil) return state.veil;
  if (!dom()) return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 4;
  const g = cv.getContext('2d');
  if (!g) return null;
  g.fillStyle = 'rgba(10,16,26,0.30)';
  g.fillRect(0, 0, 4, 4);
  state.veil = cv;
  return cv;
}

// Paints a material across an existing rectangle. The caller keeps its own flat fill as the
// base coat, so signs, silhouettes and colour personality survive; this adds surface, bevel and
// edge wear on top. World-aligned so neighbouring rectangles never seam or shimmer.
export function paintMaterial(c, kind, x, y, w, h, opts) {
  const o = opts || {};
  if (!(w > 0) || !(h > 0)) return false;
  const name = typeof kind === 'string' ? kind : MATERIALS[kind];
  const seed = o.seed === undefined ? 0 : o.seed | 0;
  const size = tileSize(o.scale);
  const pat = patternFor(c, name, size, (seed >> 1) & 1);
  if (!pat) return false;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  // World-aligned phase (seeded, so neighbours do not read as one tiled sheet) and a fill rect
  // that covers the clipped target exactly in that shifted space: full coverage, never a
  // half-empty panel, with no context mirroring.
  const sx = (((x + seed * 29) % size) + size) % size;
  const sy = (((y + seed * 47) % size) + size) % size;
  c.translate(x - sx, y - sy);
  c.globalAlpha *= alpha;
  c.fillStyle = pat;
  c.fillRect(0, 0, sx + w + 1, sy + h + 1);
  c.restore();
  // painted bevel: light catch on the top edge, contact shadow at the bottom
  if (o.bevel !== false) {
    c.save();
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.globalAlpha *= alpha;
    const lip = Math.min(2, Math.max(1, h * .06));
    c.fillStyle = 'rgba(226,236,246,0.10)';
    c.fillRect(x, y, w, lip);
    c.fillStyle = 'rgba(6,10,16,0.26)';
    c.fillRect(x, y + h - lip, w, lip);
    c.fillStyle = 'rgba(6,10,16,0.14)';
    c.fillRect(x, y, Math.min(2, w * .05), h);
    c.restore();
  }
  return true;
}

// Far-background panorama. Wraps horizontally for infinite scrolling and sits low-contrast so
// heroes stay legible; existing landmarks and city architecture are drawn over it by the caller.
export function drawPaintedPanorama(c, game, width, height) {
  if (state.panState !== 'loaded' || !state.pan || !(width > 0) || !(height > 0)) return false;
  const cam = (game && game.camera) || { x: 0, y: 0 };
  const s = Math.max(width / state.pw, (height * 0.86) / state.ph);
  const dw = state.pw * s, dh = state.ph * s;
  const ox = -(((cam.x * 0.22) % dw) + dw) % dw - dw;
  const oy = height - dh - (cam.y - 1400) * 0.06;
  const n = Math.ceil(width / dw) + 2;
  c.save();
  for (let i = 0; i < n; i++) c.drawImage(state.pan, ox + i * dw, oy, dw, dh);
  const veil = veilFor();
  if (veil) {
    try {
      const p = c.createPattern(veil, 'repeat');
      if (p) { c.fillStyle = p; c.fillRect(0, 0, width, height); }
    } catch { /* pattern unsupported: skip the veil */ }
  }
  c.restore();
  return true;
}

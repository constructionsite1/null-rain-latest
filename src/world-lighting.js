// Source-connected neon lighting and wet-pavement response for NULL // RAIN.
//
// Lights are derived from real world sources: street signs, shopfronts, lanterns, lamps,
// awnings, vents, service pipes, plus the pendant fixtures each interior actually draws.
// Nothing is a screen-space wash - each source tints the characters, steel and pavement
// around it. Canvas2D only: no per-frame image reads, no dependencies, capped light count,
// cached gradients, and one reusable foreground layer for actor tinting.
export function hash(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }

// --- shared world art bridge -------------------------------------------------
let WA = null;
let worldArtImport = null;
function attach(mod) {
  if (!mod) return;
  WA = mod;
  try { if (typeof mod.preloadWorldArt === 'function') mod.preloadWorldArt(); } catch { /* pending art */ }
}
if (typeof document !== 'undefined') {
  worldArtImport = import('./world-art.js').then(attach).catch(() => null);
}
export function worldArtStatus() {
  try { return WA && typeof WA.worldArtStatus === 'function' ? WA.worldArtStatus() : null; }
  catch { return null; }
}
export function preloadWorldArt() {
  return Promise.resolve(worldArtImport).then(() => {
    try { return WA && typeof WA.preloadWorldArt === 'function' ? WA.preloadWorldArt() : null; }
    catch { return null; }
  }).catch(() => null);
}
export function paintSurface(c, kind, x, y, w, h, opts) {
  if (WA && typeof WA.paintMaterial === 'function') {
    try { return WA.paintMaterial(c, kind, x, y, w, h, opts) !== false; } catch { return false; }
  }
  return false;
}
export function paintPanorama(c, game, width, height) {
  if (WA && typeof WA.drawPaintedPanorama === 'function') {
    try { return WA.drawPaintedPanorama(c, game, width, height) !== false; } catch { return false; }
  }
  return false;
}

// --- palette ------------------------------------------------------------------
function rgb(hex) {
  let h = String(hex || '').replace('#', '').slice(0, 6);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
function shade(hex, k, white = true) {
  const [r, g, b] = rgb(hex), t = white ? 255 : 0;
  const q = v => cl(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + q(r + (t - r) * k) + q(g + (t - g) * k) + q(b + (t - b) * k);
}
function rgba(hex, a) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${cl(a, 0, 1)})`;
}
// Warm windows, cyan utility/clinic, magenta club, red restricted, amber foundry: derived
// from the authored source colour so lights stay connected to what is painted on the wall.
export function lightRole(color, type) {
  const [r, g, b] = rgb(color);
  if (r > 185 && g < 120 && b < 130) return 'restricted';
  if (r > 175 && b > 130 && g < 160) return 'club';
  if (r > 180 && g > 115 && b < 125) return 'foundry';
  if (g > 150 && b > 150) return 'utility';
  if (r > 150 && g > 100 && b < 110 && g >= b) return 'window';
  return type === 'shop' ? 'front' : 'utility';
}
const ROLE_GAIN = { restricted: .9, club: .88, foundry: .86, utility: .8, window: .66, front: .74 };

// --- registry (cached per world) ---------------------------------------------
// Street profiles are sized from the decoration; interiors use the pendant fixtures the
// room painter already draws, so rooms are lit from real sources too.
const PROFILE = {
  sign: { reach: 150, pool: 132, cone: .85, flicker: .05, tube: 'neon' },
  shop: { reach: 112, pool: 104, cone: .7, flicker: .025, tube: 'edge' },
  lantern: { reach: 54, pool: 62, cone: .45, flicker: .09, tube: 'core' },
  lamp: { reach: 50, pool: 104, cone: .78, flicker: .02, tube: 'core' },
  awning: { reach: 96, pool: 84, cone: .5, flicker: .02, tube: 'edge' },
  pipe: { reach: 46, pool: 56, cone: .35, flicker: .06, tube: 'core' },
  window: { reach: 118, pool: 80, cone: .45, flicker: .012, tube: 'edge' },
  vent: { reach: 56, pool: 68, cone: .4, flicker: .07, tube: 'core' },
  pendant: { reach: 96, pool: 108, cone: .85, flicker: .015, tube: 'core' }
};
const ROOM_FIXTURES = {
  diner: [[250, '#ffd39a'], [560, '#ffd39a'], [900, '#ffd39a'], [1240, '#ffd39a']],
  hangout: [[150, '#ffb0d8'], [500, '#ffb0d8'], [1000, '#ffb0d8'], [1240, '#ff7ad0']],
  barracks: [[200, '#cfe9ee'], [760, '#cfe9ee'], [1200, '#57e6dd']]
};
const MAX_LIGHTS = 10, MAX_STREAKS = 4, MAX_SHADOWS = 64;
const CACHE = { world: null, lights: [] };
const SHADOWS = [];

// The surface a source actually illuminates. A platform whose top sits at the source's own
// bottom (shopfronts at y 2140 meet the pavement at y 2140) IS the lit surface, so the
// search accepts tops level with the source instead of skipping them and dropping the
// pool two hundred pixels below the playable street.
function groundBelow(world, x, y) {
  let best = Infinity;
  for (const p of world.platforms || []) {
    const l = p.x, r = p.x + (p.w || 0);
    if (x < l - 8 || x > r + 8) continue;
    if (p.y < y - 10) continue;                 // level with, or below, the source
    if (p.y < best) best = p.y;
  }
  // nothing to stand on below this source: fall back to a short drop, not a long one
  return best === Infinity ? y + 120 : best;
}
function lightRecord(o) {
  const colour = o.color || '#35d8df';
  const role = lightRole(colour, o.type);
  return {
    x: o.x, y: o.y, w: o.w, h: o.h, type: o.type, tube: o.tube, role,
    colour, core: shade(colour, .6), hot: shade(colour, .88), dim: shade(colour, .32, false),
    cx: o.cx, bottom: o.bottom, reach: o.reach, pool: o.pool, poolY: o.poolY,
    cone: o.cone, flicker: o.flicker, gain: ROLE_GAIN[role] || .7,
    seed: hash(o.x * .017 + o.y * .031 + colour.length),
    gBloom: null, gCone: null, gPool: null
  };
}
function buildLights(world) {
  if (CACHE.world === world) return CACHE.lights;
  const out = [];
  if (world.interior) {
    // Interior rooms carry no decorations: light them from the fixtures their own painter
    // draws, so rooms are never a flat unlit box.
    const room = world.room || {};
    const id = room.id || String(world.id || '').replace(/^room-/, '');
    const fixtures = ROOM_FIXTURES[id] || ROOM_FIXTURES.diner;
    const floorY = world.floor || 880;
    for (const [x, color] of fixtures) {
      const p = PROFILE.pendant;
      out.push(lightRecord({
        type: 'pendant', tube: 'core', color, x: x - 7, y: 292, w: 14, h: 16,
        cx: x, bottom: 316, reach: p.reach, pool: p.pool, poolY: floorY,
        cone: p.cone, flicker: p.flicker
      }));
    }
    // a low coloured wash along the back wall keeps the room from reading as a lightbox
    out.push(lightRecord({
      type: 'window', tube: 'edge', color: room.color || '#7fb6c6', x: 40, y: 300, w: 1360, h: 150,
      cx: 720, bottom: 450, reach: 200, pool: 260, poolY: floorY, cone: .5, flicker: .01
    }));
  } else {
    for (const d of world.decorations || []) {
      const p = PROFILE[d.type];
      if (!p) continue;
      const x = d.x || 0, y = d.y || 0, w = d.w || 0, h = d.h || 0;
      // A storefront emits from its sign band, not from an imaginary full-building face.
      const emitY = d.type === 'shop' ? y : y;
      const emitH = d.type === 'shop' ? Math.min(h, 26) : h;
      const bottom = d.type === 'shop' ? y + emitH : y + h;
      const cx = d.type === 'shop' ? x + w * .5 : x + (w || 10) / 2;
      const wide = w ? cl(w / 220, .55, 1.5) : 1;
      out.push(lightRecord({
        type: d.type, tube: p.tube, color: d.color,
        x: d.type === 'shop' ? x + w * .08 : x, y: emitY,
        w: d.type === 'shop' ? w * .84 : w, h: emitH,
        cx, bottom,
        reach: p.reach * wide, pool: p.pool * wide, poolY: groundBelow(world, cx, bottom),
        cone: p.cone, flicker: p.flicker
      }));
    }
  }
  CACHE.world = world;
  CACHE.lights = out;
  return out;
}
export function lightCount(world) { return buildLights(world || {}).length; }
// Compact registry dump for QA: confirms each source's emitter and the surface it lights.
export function lightSnapshot(world) {
  return buildLights(world || {}).map(l => ({
    type: l.type, tube: l.tube, role: l.role, color: l.colour,
    x: Math.round(l.x), y: Math.round(l.y), w: Math.round(l.w), h: Math.round(l.h),
    cx: Math.round(l.cx), bottom: Math.round(l.bottom),
    poolY: Math.round(l.poolY), reach: Math.round(l.reach)
  }));
}
function visibleLights(world, cam, width, height, limit) {
  const lights = buildLights(world || {});
  const cxm = cam.x + width / 2, cym = cam.y + height * .55, out = [];
  for (const l of lights) {
    const d = Math.hypot(l.cx - cxm, ((l.poolY + l.y) / 2) - cym);
    if (d < l.reach * 3.2 + 240) out.push({ l, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, limit).map(o => o.l);
}
// One deterministic flicker per light: a slow wobble with an occasional short dip.
function flickerOf(l, t) {
  const wob = 1 - l.flicker * (.5 + .5 * Math.sin(t * (5.5 + l.seed * 4) + l.seed * 9));
  const dip = (l.flicker > .06 && Math.sin(t * 1.7 + l.seed * 5) > .985) ? l.flicker * 2.2 : 0;
  return cl(wob - dip, .35, 1.1);
}

// --- street / room lighting pass ----------------------------------------------
// Canvas gradients are cached per light for speed, but a cached gradient keeps the
// transform it was built under. Any camera move, zoom change or view resize therefore
// invalidates the cache, so a light can never end up pinned to the screen. The actor
// layer keeps its OWN key: the two passes rasterise at different scales, and sharing one
// key made each pass invalidate the other's gradients every single frame.
const GRAD_KEYS = { world: '', actor: '' };
function keyOf(tag, cam, width, height, scale) {
  return `${tag}|${(cam.x * 4) | 0}|${(cam.y * 4) | 0}|${(width * 4) | 0}|${(height * 4) | 0}|${scale.toFixed(3)}`;
}
function syncGradientKey(tag, cam, width, height, scale) {
  const key = keyOf(tag, cam, width, height, scale);
  if (key === GRAD_KEYS[tag]) return;
  GRAD_KEYS[tag] = key;
  for (const l of CACHE.lights) {
    if (tag === 'world') { l.gBloom = null; l.gCone = null; l.gPool = null; }
    else l.gActor = null;
  }
}
export function drawLighting(c, world, cam, width, height, t) {
  buildLights(world);
  syncGradientKey('world', cam, width, height, 1);
  const use = visibleLights(world, cam, width, height, MAX_LIGHTS);
  if (!use.length) return 0;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const l of use) {
    const gain = l.gain * flickerOf(l, t);
    drawSourceFace(c, l, gain);
    // light shaft from the source down to the surface it actually illuminates
    if (l.poolY > l.bottom + 8) {
      if (!l.gCone) {
        l.gCone = c.createLinearGradient(0, l.bottom, 0, l.poolY);
        l.gCone.addColorStop(0, rgba(l.core, .42));
        l.gCone.addColorStop(.42, rgba(l.colour, .2));
        l.gCone.addColorStop(1, rgba(l.dim, 0));
      }
      const span = l.pool, topW = Math.max(4, (l.w || 10) * .45);
      c.globalAlpha = .3 * gain * l.cone;
      c.fillStyle = l.gCone;
      c.beginPath();
      c.moveTo(l.cx - topW, l.bottom);
      c.lineTo(l.cx + topW, l.bottom);
      c.lineTo(l.cx + span, l.poolY);
      c.lineTo(l.cx - span, l.poolY);
      c.closePath(); c.fill();
      // ground pool: masked onto the lit surface, never a circle hanging in open air
      if (!l.gPool) {
        l.gPool = c.createRadialGradient(l.cx, l.poolY, 1, l.cx, l.poolY, span);
        l.gPool.addColorStop(0, rgba(l.core, .4));
        l.gPool.addColorStop(.4, rgba(l.colour, .17));
        l.gPool.addColorStop(.78, rgba(l.dim, .05));
        l.gPool.addColorStop(1, rgba(l.dim, 0));
      }
      c.globalAlpha = .5 * gain;
      c.fillStyle = l.gPool;
      c.beginPath();
      c.ellipse(l.cx, l.poolY, span, span * .24, 0, 0, Math.PI * 2);
      c.fill();
      // wet pavement: a few broken streaks hanging below the pool
      const streaks = Math.min(MAX_STREAKS, 1 + Math.round(span / 46));
      for (let i = 0; i < streaks; i++) {
        const sx = l.cx + (hash(l.seed * 31 + i) - .5) * span * 1.05;
        const len = span * (.3 + hash(l.seed * 17 + i * 5) * .8);
        c.globalAlpha = (.09 + .11 * hash(i * 13 + l.seed)) * gain;
        c.strokeStyle = i % 2 ? l.core : l.colour;
        c.lineWidth = 1 + hash(i * 7 + l.seed) * 1.5;
        c.beginPath();
        c.moveTo(sx, l.poolY + 2);
        for (let s = 1; s <= 4; s++) {
          const wob = Math.sin(t * 1.6 + i * 1.9 + l.seed * 6) * 2;
          c.lineTo(sx + wob * s * .5 + (hash(i * 3 + s) - .5) * 3, l.poolY + (len * s) / 4);
        }
        c.stroke();
      }
    }
  }
  c.restore();
  return use.length;
}
// Luminous face per source type. Neon signs get a narrow tube border with a very light
// interior wash so painted lettering underneath stays readable; only small fixtures
// (lamp, lantern, pendant) get a solid core.
function drawSourceFace(c, l, gain) {
  const w = l.w || 0, h = l.h || 0;
  if (w > 8 && h > 8) {
    if (!l.gBloom) {
      l.gBloom = c.createRadialGradient(l.cx, l.y + h * .5, 2, l.cx, l.y + h * .5, l.reach);
      l.gBloom.addColorStop(0, rgba(l.core, .5));
      l.gBloom.addColorStop(.28, rgba(l.colour, .22));
      l.gBloom.addColorStop(.62, rgba(l.dim, .07));
      l.gBloom.addColorStop(1, rgba(l.dim, 0));
    }
    c.globalAlpha = .2 * gain;
    c.fillStyle = l.gBloom;
    c.beginPath(); c.arc(l.cx, l.y + h * .5, l.reach, 0, Math.PI * 2); c.fill();
    if (l.tube === 'neon') {
      c.globalAlpha = .16 * gain;
      c.fillStyle = l.colour;
      c.fillRect(l.x + 3, l.y + 3, w - 6, h - 6);
      c.globalAlpha = .8 * gain;
      c.lineWidth = 2.4; c.strokeStyle = l.core;
      c.strokeRect(l.x + 2.5, l.y + 2.5, w - 5, h - 5);
      c.globalAlpha = .95 * gain;
      c.lineWidth = 1; c.strokeStyle = l.hot;
      c.strokeRect(l.x + 4, l.y + 4, w - 8, h - 8);
    } else if (l.tube === 'edge') {
      c.globalAlpha = .5 * gain;
      c.lineWidth = 1.6; c.strokeStyle = l.core;
      c.strokeRect(l.x + 1, l.y + 1, w - 2, h - 2);
      c.globalAlpha = .12 * gain;
      c.fillStyle = l.colour;
      c.fillRect(l.x + 2, l.y + 2, w - 4, h - 4);
    }
  } else {
    const bw = Math.max(2, w || 3), bh = Math.max(3, h * .16 || 6);
    c.globalAlpha = .34 * gain;
    c.fillStyle = l.core;
    c.fillRect(l.cx - bw, l.y + h * .5 - bh, bw * 2, bh * 2);
    c.globalAlpha = .9 * gain;
    c.fillStyle = l.hot;
    c.fillRect(l.cx - bw * .4, l.y + h * .5 - bh * .4, bw * .8, bh * .8);
  }
}

// --- ambient shadow (kept separate from the neon highlight) -------------------
export function drawAmbient(c, world, cam, width, height) {
  c.save();
  const g = c.createLinearGradient(0, cam.y, 0, cam.y + height);
  g.addColorStop(0, 'rgba(4,10,18,.3)');
  g.addColorStop(.45, 'rgba(4,10,18,.08)');
  g.addColorStop(1, 'rgba(6,14,20,0)');
  c.fillStyle = g;
  c.fillRect(cam.x - 4, cam.y - 4, width + 8, height + 8);
  c.restore();
  void world;
}

// --- foreground actor lighting ------------------------------------------------
// Characters are drawn into one reusable layer, tinted with the local sources using
// source-atop (so only character pixels take the colour), then composited back.
// The layer is rasterised at the SCENE scale the main canvas uses, never at one source
// pixel per logical world pixel, otherwise the device-pixel-ratio upscale blurs painted
// sprite detail. Oversampling is bounded to 2x so a 4K panel cannot explode the buffer.
const LAYER = { cv: null, ctx: null, w: 0, h: 0, scale: 0, live: false };
function dom() { return typeof document !== 'undefined' && !!document.createElement; }
export function beginActorLayer(width, height, cam, sceneScale) {
  if (!dom()) return null;
  const scale = clampScale(sceneScale);
  const w = Math.max(2, Math.ceil(width * scale)), h = Math.max(2, Math.ceil(height * scale));
  if (!LAYER.cv || LAYER.w !== w || LAYER.h !== h || LAYER.scale !== scale) {
    LAYER.cv = document.createElement('canvas');
    LAYER.cv.width = w; LAYER.cv.height = h;
    LAYER.ctx = LAYER.cv.getContext('2d');
    LAYER.w = w; LAYER.h = h; LAYER.scale = scale;
  }
  if (!LAYER.ctx) return null;
  const g = LAYER.ctx;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  g.setTransform(scale, 0, 0, scale, -cam.x * scale, -cam.y * scale);
  LAYER.live = true;
  return LAYER;
}
function clampScale(v) { return (Number.isFinite(v) && v > 0.25 ? v : 1) > 2 ? 2 : (Number.isFinite(v) && v > 0.25 ? v : 1); }
export function actorLayerContext() { return LAYER.live && LAYER.ctx ? LAYER.ctx : null; }
export function lightActorLayer(world, cam, width, height, t) {
  const g = LAYER.live && LAYER.ctx ? LAYER.ctx : null;
  if (!g) return 0;
  buildLights(world);
  syncGradientKey('actor', cam, width, height, LAYER.scale);
  const use = visibleLights(world, cam, width, height, MAX_LIGHTS);
  if (!use.length) return 0;
  g.save();
  g.globalCompositeOperation = 'source-atop';
  let n = 0;
  for (const l of use) {
    const gain = l.gain * flickerOf(l, t);
    const r = l.reach * .8;
    if (!l.gActor || l.gActorR !== r) {
      const grad = g.createRadialGradient(l.cx, l.y + (l.h || 20) * .5, 2, l.cx, l.y + (l.h || 20) * .5, r);
      grad.addColorStop(0, rgba(l.core, .5));
      grad.addColorStop(.34, rgba(l.colour, .26));
      grad.addColorStop(1, rgba(l.dim, 0));
      l.gActor = grad; l.gActorR = r;
    }
    g.globalAlpha = .5 * gain;
    g.fillStyle = l.gActor;
    g.beginPath(); g.arc(l.cx, l.y + (l.h || 20) * .5, r, 0, Math.PI * 2); g.fill();
    n++;
  }
  // a shallow ambient term so characters never float free of the scene value
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(18,34,48,.16)';
  g.fillRect(cam.x - 8, cam.y - 8, width + 16, height + 16);
  g.restore();
  return n;
}
export function compositeActorLayer(c, cam, width, height) {
  if (!LAYER.live || !LAYER.cv) return false;
  // one composite into the same logical rectangle the scene occupies
  c.drawImage(LAYER.cv, cam.x, cam.y, width, height);
  LAYER.live = false;
  return true;
}

// --- contact shadows ----------------------------------------------------------
export function beginShadows() { SHADOWS.length = 0; }
export function addContact(x, y, w, strength = 1) {
  if (SHADOWS.length < MAX_SHADOWS) SHADOWS.push({ x, y, w, strength });
}
export function drawContacts(c) {
  if (!SHADOWS.length) return;
  c.save();
  for (const s of SHADOWS) {
    c.globalAlpha = .34 * s.strength;
    c.fillStyle = '#03070c';
    c.beginPath(); c.ellipse(s.x, s.y, s.w, Math.max(1.6, s.w * .22), 0, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  SHADOWS.length = 0;
}
export function resetLighting() { CACHE.world = null; CACHE.lights.length = 0; }
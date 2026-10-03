// Procedural character rig: distance-anchored gait, layered pose blending, 2-bone IK.
// Pure math. No DOM, no canvas, no simulation writes, no per-frame allocation.
// All authored pose units assume a 54px human; poses are rescaled by H/54 on output.
export const NCH = 30;
export const K = {
  HIPX: 0, HIPY: 1, LEAN: 2, CHEST: 3, HEADX: 4, HEADY: 5, TILT: 6,
  BFX: 7, BFY: 8, BTOE: 9, FFX: 10, FFY: 11, FTOE: 12,
  BHX: 13, BHY: 14, BELB: 15, FHX: 16, FHY: 17, FELB: 18,
  WEAP: 19, GRIP: 20, SWING: 21, CROUCH: 22, COAT: 23, LOOK: 24,
  STRETCH: 25, TWIST: 26, STANCE: 27, HANDMODE: 28, OPEN: 29
};
export const FRAMES = {
  hero: { spine: 16.5, shW: 5.7, hipW: 2.7, thigh: 13.4, shin: 12.6, ankle: 2.2, foot: 5.4, uarm: 8.8, farm: 8.4, hand: 2.7, headR: 3.05, toe: 1.9 },
  wide: { spine: 16.2, shW: 7.9, hipW: 3.5, thigh: 13.0, shin: 12.3, ankle: 2.4, foot: 6.2, uarm: 9.7, farm: 9.5, hand: 3.1, headR: 3.35, toe: 2.2 },
  civ: { spine: 16.2, shW: 5.3, hipW: 2.5, thigh: 13.6, shin: 12.8, ankle: 2.2, foot: 5.0, uarm: 8.5, farm: 8.1, hand: 2.5, headR: 3.0, toe: 1.8 }
};
const FR = {};
export function frameOf(name, H) {
  const key = name + ':' + H;
  let f = FR[key];
  if (!f) {
    const b = FRAMES[name] || FRAMES.hero, k = (H || 54) / 54, f2 = { H: H || 54 };
    for (const p in b) f2[p] = b[p] * k;
    FR[key] = f = f2;
  }
  return f;
}
const TAU = Math.PI * 2;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const mix = (a, b, w) => a + (b - a) * w;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const A = new Float64Array(NCH), B = new Float64Array(NCH), C = new Float64Array(NCH);
const POS = [K.HIPX, K.HIPY, K.HEADX, K.HEADY, K.BFX, K.BFY, K.FFX, K.FFY, K.BHX, K.BHY, K.FHX, K.FHY, K.GRIP];

function blend(o, a, b, w) {
  for (let i = 0; i < NCH; i++) o[i] = a[i] + (b[i] - a[i]) * w;
  o[K.LEAN] = a[K.LEAN] + wrap(b[K.LEAN] - a[K.LEAN]) * w;
  o[K.TILT] = a[K.TILT] + wrap(b[K.TILT] - a[K.TILT]) * w;
  o[K.WEAP] = a[K.WEAP] + wrap(b[K.WEAP] - a[K.WEAP]) * w;
}
function scalePose(o, s) {
  if (s === 1) return o;
  for (let i = 0; i < POS.length; i++) o[POS[i]] *= s;
  return o;
}

// ------------------------------------------------------------------ neutral
function base(o) {
  o[K.HIPX] = 0; o[K.HIPY] = -26.5; o[K.LEAN] = .05; o[K.CHEST] = 1;
  o[K.HEADX] = .3; o[K.HEADY] = 0; o[K.TILT] = 0;
  o[K.BFX] = -3.4; o[K.BFY] = 0; o[K.BTOE] = -.08;
  o[K.FFX] = 4.6; o[K.FFY] = 0; o[K.FTOE] = .08;
  o[K.BHX] = -.9; o[K.BHY] = 15.1; o[K.BELB] = 2.35;
  o[K.FHX] = 1.1; o[K.FHY] = 14.6; o[K.FELB] = 2.35;
  o[K.WEAP] = -.42; o[K.GRIP] = 2.2; o[K.SWING] = 0; o[K.CROUCH] = 0;
  o[K.COAT] = 0; o[K.LOOK] = 0; o[K.STRETCH] = 0; o[K.TWIST] = 0;
  o[K.STANCE] = 1; o[K.HANDMODE] = 0; o[K.OPEN] = 0;
  return o;
}
function guard(o, reach) {
  base(o);
  o[K.HIPY] = -25.4; o[K.LEAN] = .11;
  o[K.BFX] = -6.2; o[K.FFX] = 6.4; o[K.BTOE] = -.22; o[K.FTOE] = .12;
  o[K.BHX] = -2.4; o[K.BHY] = 12.4;
  o[K.FHX] = 8.4 * (reach || 1); o[K.FHY] = 6.4;
  o[K.BELB] = 2.35; o[K.FELB] = 2.5;
  o[K.WEAP] = -.34; o[K.HANDMODE] = 1; o[K.GRIP] = 2.4; o[K.TWIST] = 1;
  return o;
}

// ------------------------------------------------------------------ gait
const _lf = { x: 0, y: 0, toe: 0 }, _lb = { x: 0, y: 0, toe: 0 };
function legCycle(q, duty, len, lift, o) {
  if (q < duty) {
    o.x = len * (duty * .5 - q);
    o.y = 0;
    o.toe = mix(.18, -.12, q / duty);
  } else {
    const k = (q - duty) / (1 - duty), e = k * k * (3 - 2 * k);
    o.x = len * (-duty * .5 + e * duty);
    const a = Math.sin(Math.PI * k);
    o.y = -lift * a * (.4 + .6 * a);
    o.toe = mix(.62, -.12, k * k);
  }
  return o;
}
function gait(o, R, armed, sp, ldir) {
  const duty = clamp(.78 - R.cad * .045, .56, .78), len = R.step;
  legCycle(R.u + .5, duty, len, R.lift, _lb);
  legCycle(R.u, duty, len, R.lift, _lf);
  o[K.BFX] = _lb.x * ldir; o[K.BFY] = _lb.y; o[K.BTOE] = _lb.toe * (ldir < 0 ? -1 : 1);
  o[K.FFX] = _lf.x * ldir; o[K.FFY] = _lf.y; o[K.FTOE] = _lf.toe * (ldir < 0 ? -1 : 1);
  o[K.HIPY] = -26.5 + Math.abs(Math.sin(R.u * TAU)) * R.bob - R.sink;
  o[K.HIPX] = 0; o[K.STANCE] = 1;
  const w = Math.cos(R.u * TAU) * (ldir < 0 ? -.55 : 1);
  const sw = clamp(R.cad / 3.2, 0, 1.25);
  if (!armed) {
    o[K.BHX] = mix(-1.4, -3.2 - w * 2.4 * sw, .3 + .7 * sw);
    o[K.BHY] = mix(14.8, 12.4 - Math.abs(w) * 1.4 * sw, .3 + .7 * sw);
    o[K.FHX] = mix(1.2, 3.1 + w * 2.6 * sw, .3 + .7 * sw);
    o[K.FHY] = mix(14.4, 12.1 - Math.abs(w) * 1.6 * sw, .3 + .7 * sw);
    o[K.BELB] = mix(2.35, 2.95, sw); o[K.FELB] = mix(2.35, 2.95, sw);
  }
  const drive = clamp(sp / (54 * 5.4), 0, 1);
  o[K.LEAN] = mix(.06, .22 + Math.abs(w) * .04, drive);
  o[K.TWIST] = drive * .75;
  o[K.HEADX] = .3 + Math.cos(R.u * TAU * 2) * .35 * drive;
  return o;
}

// Lower body only: keeps the articulated gait under upper-body poses (aiming, firing,
// reloading) so a ranged character never slides across the ground on a rigid stance.
function gaitUpper(o, R, sp, ldir, amp) {
  const duty = clamp(.78 - R.cad * .045, .56, .78), len = R.step;
  legCycle(R.u + .5, duty, len, R.lift, _lb);
  legCycle(R.u, duty, len, R.lift, _lf);
  o[K.BFX] = _lb.x * ldir; o[K.BFY] = _lb.y; o[K.BTOE] = _lb.toe * (ldir < 0 ? -1 : 1);
  o[K.FFX] = _lf.x * ldir; o[K.FFY] = _lf.y; o[K.FTOE] = _lf.toe * (ldir < 0 ? -1 : 1);
  o[K.HIPY] += (Math.abs(Math.sin(R.u * TAU)) - .64) * R.bob * amp;
  o[K.LEAN] += clamp(sp / (54 * 5.4), 0, 1) * .07 * amp;
  o[K.TWIST] += clamp(sp / 300, 0, 1) * .4 * amp;
  o[K.STANCE] = 1;
  return o;
}

// ------------------------------------------------------------------ pose library
function idle(o, R, t) {
  base(o);
  const br = Math.sin(t * 1.7 + R.ph);
  o[K.HIPY] += br * .38;
  o[K.CHEST] = 1 + br * .012;
  o[K.BHY] = 15.1 + br * .5; o[K.FHY] = 14.6 + br * .45; o[K.FHX] += br * .5;
  o[K.LEAN] += br * .018; o[K.TILT] = br * .03;
  o[K.HEADX] += br * .22; o[K.COAT] = br * .06;
  return o;
}
function ready(o, t) {
  guard(o, 1);
  const br = Math.sin(t * 1.9) * .4;
  o[K.HIPY] += br; o[K.FHY] += br * .5; o[K.BHY] += br * .4;
  o[K.TILT] = br * .022; o[K.COAT] = br * .05;
  return o;
}
function walk(o, R, t, sp, ldir) { gait(o, R, o[K.HANDMODE] > .5, sp, ldir); o[K.COAT] = R.cad * .06; return o; }
function run(o, R, t, sp, ldir) {
  gait(o, R, o[K.HANDMODE] > .5, sp, ldir);
  const d = clamp(sp / 300, 0, 1.3);
  o[K.HIPY] -= d * 1.7;
  o[K.LEAN] += clamp(sp / 320, 0, 1) * .1;
  o[K.STRETCH] = clamp(sp / 320, 0, 1) * .5;
  o[K.CHEST] = 1 + clamp(sp / 340, 0, 1) * .03;
  o[K.COAT] = .34 + d * .32;
  o[K.BTOE] = mix(o[K.BTOE], -.42, .55); o[K.FTOE] = mix(o[K.FTOE], .5, .4);
  return o;
}
function dash(o, k) {
  base(o);
  const s = clamp(k, 0, 1);
  o[K.HIPY] = mix(-22.5, -15.8, s);
  o[K.LEAN] = mix(.3, .5, s);
  o[K.CHEST] = mix(.96, .9, s);
  o[K.FFX] = mix(9, 15.2, s); o[K.FFY] = -1.4; o[K.FTOE] = -.3;
  o[K.BFX] = mix(-8, -13.6, s); o[K.BFY] = -3.4; o[K.BTOE] = .7;
  o[K.FHX] = 7.6; o[K.FHY] = 6.6; o[K.FELB] = 2.6;
  o[K.BHX] = -6.4; o[K.BHY] = 9.4; o[K.BELB] = 2.2;
  o[K.WEAP] = mix(1.5, 2.15, s);
  o[K.HANDMODE] = 1; o[K.GRIP] = 2.4; o[K.TWIST] = .5;
  o[K.COAT] = mix(.5, 1.2, s);
  o[K.HEADX] = 1.4; o[K.HEADY] = -.4; o[K.TILT] = -.16;
  return o;
}
function rise(o, k) {
  base(o);
  const s = clamp(k, 0, 1);
  o[K.HIPY] = mix(-25.5, -23.4, s);
  o[K.LEAN] = mix(.14, .05, s);
  o[K.FFX] = mix(6, 3.2, s); o[K.FFY] = mix(-2, -7.6, s); o[K.FTOE] = mix(.3, .95, s);
  o[K.BFX] = mix(-5, -3.2, s); o[K.BFY] = mix(-1, -3.6, s); o[K.BTOE] = mix(-.2, .5, s);
  o[K.FHX] = 4.2; o[K.FHY] = 9.4; o[K.FELB] = 2.7;
  o[K.BHX] = -3.4; o[K.BHY] = 12.4; o[K.BELB] = 2.2;
  o[K.WEAP] = mix(-.7, -.2, s);
  o[K.HANDMODE] = 1; o[K.GRIP] = 2.4; o[K.STRETCH] = .8;
  o[K.COAT] = mix(-.1, .18, s);
  o[K.HEADX] = .6; o[K.HEADY] = -.3;
  return o;
}
function fall(o, k) {
  base(o);
  const s = clamp(k, 0, 1);
  o[K.HIPY] = mix(-24.6, -25.6, s);
  o[K.LEAN] = mix(-.02, -.13, s);
  o[K.FFX] = mix(4.4, 6.8, s); o[K.FFY] = mix(-4, -1.4, s); o[K.FTOE] = mix(.85, .3, s);
  o[K.BFX] = mix(-4, -6.6, s); o[K.BFY] = mix(-3, -2, s); o[K.BTOE] = mix(.6, .1, s);
  o[K.FHX] = 5.4; o[K.FHY] = 10.4; o[K.FELB] = 2.8;
  o[K.BHX] = -5; o[K.BHY] = 11.4; o[K.BELB] = 2.1;
  o[K.WEAP] = mix(-.2, .5, s);
  o[K.HANDMODE] = 1; o[K.GRIP] = 2.4;
  o[K.COAT] = mix(.7, 1.05, s);
  o[K.HEADX] = -.4; o[K.TILT] = -.06;
  return o;
}
function land(o, k, impact) { // absorb depth follows the descent speed that caused it
  base(o);
  const hard = .55 + .45 * clamp((impact || 320) / 720, 0, 1);
  const s = (1 - clamp(k, 0, 1)) * hard;
  o[K.HIPY] = mix(-26.5, -14.6, s);
  o[K.CROUCH] = s;
  o[K.LEAN] = mix(.06, .38, s);
  o[K.CHEST] = mix(1, .88, s);
  o[K.FFX] = mix(4.6, 9.4, s); o[K.FTOE] = mix(.08, -.24, s);
  o[K.BFX] = mix(-3.4, -8.4, s); o[K.BTOE] = mix(-.08, .55, s);
  o[K.FHX] = mix(1.1, 3.8, s); o[K.FHY] = mix(14.6, 8.6, s);
  o[K.BHX] = mix(-.9, -4.6, s); o[K.BHY] = mix(15.1, 9.6, s);
  o[K.WEAP] = mix(-.42, .34, s);
  o[K.HANDMODE] = 1; o[K.GRIP] = 2.4;
  o[K.COAT] = mix(0, -.62, s);
  o[K.HEADX] = mix(.3, 1.8, s); o[K.HEADY] = mix(0, 1.2, s);
  o[K.STRETCH] = .3 * (1 - s);
  return o;
}
function crouch(o, R, t, aim) {
  base(o);
  const br = Math.sin(t * 2.4) * .3;
  o[K.HIPY] = -14.8 + br * .5;
  o[K.CROUCH] = 1; o[K.LEAN] = .3; o[K.CHEST] = .9;
  o[K.FFX] = 8.4; o[K.FTOE] = -.3;
  o[K.BFX] = -7.6; o[K.BFY] = -1.2; o[K.BTOE] = .45;
  o[K.FHX] = 4.2; o[K.FHY] = 10.2; o[K.FELB] = 2.9;
  o[K.BHX] = -2.6; o[K.BHY] = 11.6; o[K.BELB] = 2.4;
  o[K.WEAP] = aim == null ? .5 : aim;
  o[K.HANDMODE] = 1; o[K.GRIP] = 2.4; o[K.TWIST] = .6;
  o[K.COAT] = .3;
  o[K.HEADX] = 1.5; o[K.HEADY] = .7; o[K.TILT] = .05;
  return o;
}
function climb(o, R, t) {
  base(o);
  const p = Math.sin(t * 3.6 + R.ph);
  o[K.HIPY] = -25 + Math.sin(t * 7.2) * .5;
  o[K.LEAN] = .12;
  o[K.FFX] = 3.2 + p * 3.4; o[K.FFY] = -6 - p * 6.4; o[K.FTOE] = .8 - p * .4;
  o[K.BFX] = -2.6 - p * 3.4; o[K.BFY] = -6 + p * 6.4; o[K.BTOE] = .8 + p * .4;
  o[K.FHX] = 1.6; o[K.FHY] = 3.2 - p * 7.4; o[K.FELB] = 3;
  o[K.BHX] = -1.6; o[K.BHY] = 3.2 + p * 7.4; o[K.BELB] = 3;
  o[K.WEAP] = -.2 + p * .1;
  o[K.HANDMODE] = 1; o[K.GRIP] = 2.4;
  o[K.COAT] = .12;
  o[K.HEADX] = .2; o[K.HEADY] = -.6; o[K.TILT] = -.04;
  return o;
}
// Three distinct sweeps: level cut, overhead chop, rising spin.
function swing(o, k, combo) {
  guard(o, 1);
  const strike = clamp((k - .3) / .7, 0, 1);
  const e = strike * strike * (3 - 2 * strike);
  if (combo === 1) {
    o[K.LEAN] = mix(-.14, .3, e);
    o[K.TWIST] = mix(-1, 1, e);
    o[K.HIPX] = mix(-2.4, 2.6, e);
    o[K.HIPY] = mix(-24.6, -25.8, e);
    o[K.BHX] = mix(1.6, -7.2, e); o[K.BHY] = mix(12.6, 9.4, e);
    o[K.FHX] = mix(-3.4, 10.6, e); o[K.FHY] = mix(14.4, 6.4, e);
    o[K.FELB] = mix(2.4, 3.15, e); o[K.BELB] = mix(2.6, 2.2, e);
    o[K.WEAP] = mix(2.55, -.5, e);
    o[K.FFX] = mix(6.4, 10.2, e); o[K.FFY] = mix(0, -1.6, e);
    o[K.BFX] = mix(-6.2, -9.4, e);
    o[K.COAT] = mix(-.3, .55, e);
    o[K.TILT] = mix(.1, -.12, e);
  } else if (combo === 2) {
    o[K.LEAN] = mix(-.3, .44, e);
    o[K.TWIST] = mix(-1, .8, e);
    o[K.HIPY] = mix(-25.8, -22.8, e);
    o[K.FHX] = mix(1.8, 9.4, e); o[K.FHY] = mix(-9.4, 9.2, e);
    o[K.BHX] = mix(-.6, -5.4, e); o[K.BHY] = mix(-8.2, 7.6, e);
    o[K.FELB] = mix(3, 2.7, e); o[K.BELB] = mix(3, 2.4, e);
    o[K.WEAP] = mix(-2.3, .62, e);
    o[K.FFX] = mix(4.4, 9.6, e); o[K.FFY] = mix(-1.2, 0, e);
    o[K.BFX] = mix(-4.4, -8.2, e);
    o[K.COAT] = mix(-.5, .8, e);
    o[K.HEADY] = mix(-1.4, 1.4, e); o[K.TILT] = mix(-.14, .16, e);
  } else {
    o[K.LEAN] = mix(-.22, -.04, e);
    o[K.TWIST] = mix(-1, 1, e);
    o[K.HIPX] = mix(1.6, -1.2, e);
    o[K.HIPY] = mix(-26.4, -23.6, e);
    o[K.FHX] = mix(-6, 7.6, e); o[K.FHY] = mix(11.4, 5.4, e);
    o[K.BHX] = mix(-2.4, -4.6, e); o[K.BHY] = mix(13.4, 8.4, e);
    o[K.FELB] = mix(2.6, 3.05, e); o[K.BELB] = mix(2.6, 2.3, e);
    o[K.WEAP] = mix(1.1, -2.05, e);
    o[K.FFX] = mix(7.6, 3.6, e); o[K.FFY] = mix(0, -6.4, e);
    o[K.BFX] = mix(-7.4, -2.6, e);
    o[K.COAT] = mix(-.4, 1.25, e);
    o[K.HEADY] = mix(.8, -1.6, e); o[K.TILT] = mix(.12, -.18, e);
    o[K.STRETCH] = .4 * strike;
  }
  o[K.SWING] = strike;
  o[K.OPEN] = 0;
  return o;
}
function shoot(o, aim, k) {
  base(o);
  o[K.HIPY] = -26.2; o[K.LEAN] = .1;
  o[K.FFX] = 5.4; o[K.BFX] = -5.4;
  const c = Math.cos(aim), s = Math.sin(aim), L = 16.4;
  o[K.FHX] = c * L; o[K.FHY] = s * L; o[K.FELB] = 2.2;
  o[K.BHX] = c * (L - 5.6) - s * 1.2;
  o[K.BHY] = s * (L - 5.6) + c * 1.2;
  o[K.BELB] = 2;
  o[K.WEAP] = aim; o[K.GRIP] = 3.2; o[K.HANDMODE] = 2; o[K.TWIST] = .9;
  o[K.HEADX] = 1.2 + c * 1.4; o[K.HEADY] = s * 1.4; o[K.TILT] = aim * .3;
  const r = 1 - clamp(k, 0, 1);
  if (r > 0) {
    o[K.LEAN] -= r * .16;
    o[K.HIPX] -= c * r * 2.6;
    o[K.FHX] -= c * r * 3.4; o[K.FHY] -= s * r * 3.4;
    o[K.BHX] -= c * r * 2.2; o[K.BHY] -= s * r * 2.2;
    o[K.FELB] = mix(2.2, 3.1, r);
    o[K.WEAP] -= r * .2;
    o[K.CHEST] = 1 - r * .05;
    o[K.HEADX] -= c * r * 1.6; o[K.HEADY] -= s * r * 1.6;
    o[K.TILT] -= r * .1;
  }
  return o;
}
function reload(o, k) {
  base(o);
  const s = clamp(k, 0, 1), e = s < .5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2;
  o[K.HIPY] = -25.6 - e * .8;
  o[K.LEAN] = .04 + e * .16;
  o[K.FFX] = 6.2; o[K.BFX] = -5;
  o[K.FHX] = 4.6; o[K.FHY] = 12.4 + e * 2.6; o[K.FELB] = 2.5;
  o[K.BHX] = 1.4 + e * 2.2; o[K.BHY] = 10.6 - e * 3.4; o[K.BELB] = 1.5;
  o[K.WEAP] = .95 - e * .55;
  o[K.GRIP] = 3.2; o[K.HANDMODE] = 2;
  o[K.HEADX] = .4 + e * .8; o[K.HEADY] = e * 1.5; o[K.TILT] = e * .1;
  o[K.TWIST] = .3; o[K.OPEN] = 1; o[K.COAT] = .1;
  return o;
}
function parry(o, k) {
  base(o);
  const s = clamp(k, 0, 1);
  o[K.HIPY] = -24.4 - s * 1.2;
  o[K.CROUCH] = s * .5;
  o[K.CHEST] = 1 - s * .04;
  o[K.FFX] = 8.2; o[K.BFX] = -8.6; o[K.BTOE] = -.3; o[K.FTOE] = -.16;
  o[K.FHX] = 6.4; o[K.FHY] = 7.2 - s * 1.4; o[K.FELB] = 2.7;
  o[K.BHX] = -1.4; o[K.BHY] = 8.4 - s; o[K.BELB] = 2.5;
  o[K.WEAP] = -1.32 - s * .16; o[K.GRIP] = 2.4; o[K.HANDMODE] = 1;
  o[K.TWIST] = .7;
  o[K.HEADX] = 1.1; o[K.HEADY] = -.3; o[K.TILT] = -.06;
  o[K.COAT] = -.2; o[K.SWING] = s * .5;
  return o;
}
function hurt(o, k) {
  base(o);
  const s = 1 - clamp(k, 0, 1);
  o[K.HIPY] = -26.5 + s * 1.2;
  o[K.LEAN] = .05 - s * .34;
  o[K.HIPX] = -s * 2.4;
  o[K.FFX] = 4.6 - s * 3.4; o[K.BFX] = -3.4 - s * 2.6;
  o[K.FHX] = 1.1 - s * 5.4; o[K.FHY] = 14.6 - s * 4.4; o[K.FELB] = mix(2.35, 3.1, s);
  o[K.BHX] = -.9 + s * 4.4; o[K.BHY] = 15.1 - s * 2.6; o[K.BELB] = mix(2.35, 3, s);
  o[K.WEAP] = mix(-.42, .9, s); o[K.HANDMODE] = 1; o[K.GRIP] = 2.4;
  o[K.HEADX] = .3 - s * 2.4; o[K.TILT] = -s * .3; o[K.HEADY] = s * .8;
  o[K.CHEST] = 1 - s * .06;
  o[K.COAT] = -s * .5;
  return o;
}
function dead(o, k) {
  base(o);
  const s = clamp(k, 0, 1);
  o[K.HIPY] = mix(-26.5, -9.5, s);
  o[K.CROUCH] = s;
  o[K.LEAN] = mix(.06, .66, s);
  o[K.CHEST] = mix(1, .82, s);
  o[K.FFX] = mix(4.6, 12.4, s); o[K.FFY] = mix(0, -1, s); o[K.FTOE] = mix(.08, -.4, s);
  o[K.BFX] = mix(-3.4, -2, s); o[K.BFY] = mix(0, -4.4, s); o[K.BTOE] = mix(-.08, .6, s);
  o[K.FHX] = mix(1.1, 7.4, s); o[K.FHY] = mix(14.6, 12.4, s); o[K.FELB] = mix(2.35, 3, s);
  o[K.BHX] = mix(-.9, -3.4, s); o[K.BHY] = mix(15.1, 11.4, s);
  o[K.WEAP] = mix(-.42, 1.4, s); o[K.HANDMODE] = 1; o[K.GRIP] = 2.4;
  o[K.HEADX] = mix(.3, 2.6, s); o[K.HEADY] = mix(0, 2.2, s); o[K.TILT] = mix(0, .4, s);
  o[K.COAT] = mix(0, .6, s);
  return o;
}
function windup(o, k) {
  guard(o, 1);
  const s = clamp(k, 0, 1);
  o[K.LEAN] = -.1 - s * .12;
  o[K.TWIST] = -s;
  o[K.HIPY] = -25 + s * 1.6;
  o[K.FHX] = 4.4 - s * 5; o[K.FHY] = 6.4 - s * 3.4; o[K.FELB] = 2.5;
  o[K.BHX] = -3.4 + s * 1.4; o[K.BHY] = 12.4 - s * 2;
  o[K.WEAP] = mix(-.34, -2.2, s);
  o[K.FFX] = 6.4 - s * 1.4; o[K.BFX] = -6.2 - s * 2.4; o[K.BTOE] = -.3;
  o[K.HEADX] = .3 - s * .8; o[K.TILT] = s * .1;
  return o;
}

// ------------------------------------------------------------------ memory
const MEM = new WeakMap();
// Canonical render-only snapshot contract. Consumers (temporal afterimages) copy these
// scalars plus `pose` into a private clone; see seedClone().
export const SNAP_KEYS = ['u', 'cad', 'step', 'lift', 'bob', 'sink', 'ph', 'vel', 'dt', 'd', 'sp',
  'hit', 'dead', 'atk', 'atkOn', 'land', 'landVy', 'hp', 'pose', 'sprite', 'face', 'prevSprite', 'blend'];
function freshSnap() {
  return { u: 0, cad: 2, step: 27, lift: 5, bob: 1.2, sink: 0, ph: 0, vel: 0, dt: 0, d: 0, sp: 0, hit: -9, dead: 0, atk: 0, atkOn: 0, hp: 0, land: -9, landVy: 0, pose: null, sprite: null, face: 1, prevSprite: null, blend: 1 };
}
// A downed actor is one the simulation has killed: explicit flag or a spent hp pool.
export function isDown(e) {
  return !!(e && (e.dead || (typeof e.hp === 'number' && e.hp <= 0)));
}
export function rigMemory(e, t, ghost) {
  let s = MEM.get(e);
  if (!s) {
    const ph = (typeof e.phase === 'number' && e.phase <= 6.3) ? e.phase : 0;
    s = freshSnap(); s.hp = e.hp || 0; s.x = e.x || 0; s.t = t; s.airT = -1; s.airVy = 0;
    s.snap = freshSnap(); s.snap.ph = ph; s.snap.hp = s.hp;
    s.sm = new Float64Array(NCH); s.smi = 0;
    MEM.set(e, s);
  }
  if (ghost) return s.snap;
  const dt = clamp((t - s.t) || 0, 0, .06);
  s.t = t;
  const x = e.x || 0, dx = x - s.x;
  s.x = x;
  if (Math.abs(dx) < 84) {
    s.d += Math.abs(dx);
    s.vel = dt > 0 ? dx / dt : 0;
  } else { s.d = 0; s.u = 0; s.vel = 0; }
  s.dt = dt;
  const spT = Math.max(Math.abs(s.vel), Math.abs(e.vx || 0) * (dt > 0 ? 1 : 0));
  s.sp += (spT - s.sp) * (dt > 0 ? Math.min(1, dt * 15) : 0);
  if (s.sp < 1.5) s.sp = 0;
  const k = 54 / (e.h || 54);
  // ONE distance-driven stride drives both the gait phase and the leg geometry, so the planted
  // foot covers exactly the ground the body covers (no skate, no frequency jitter with speed).
  s.step = clamp(s.sp * .3, 16, 96) * k;
  s.cad = clamp(s.sp / Math.max(1, s.step / k), 1.2, 5);
  s.lift = clamp(54 * (.07 + (s.cad - 1.5) * .055), 3, 12) * k;
  s.bob = clamp(54 * (.012 + (s.cad - 1.5) * .022), .5, 2.4) * k;
  s.sink = 0;
  if (dt > 0 && !e.dead && e.grounded !== false && !e.climbing) {
    if (Math.abs(dx) > .01 && s.sp > 8) s.u = (s.u + Math.abs(dx) / Math.max(1, s.step / k)) % 1;
    else {
      let d = (1 - s.u) % 1; if (d > .5) d -= 1;
      s.u = (s.u + d * Math.min(1, dt * 7) + 1) % 1;
    }
  }
  if (e.hp !== undefined && e.hp !== null && e.hp < s.hp) s.hit = t;
  if (e.hp !== undefined && e.hp !== null) s.hp = e.hp;
  if (isDown(e)) { if (!s.dead) s.dead = t; } else s.dead = 0;
  // Landing fires once per airborne->grounded transition and only after real descent,
  // so jump launches and grounded frames never trigger a false absorb.
  if (e.climbing) { s.airT = -1; s.airVy = 0; }
  else if (e.grounded === false) { if (s.airT < 0) s.airT = t; s.airVy = e.vy || 0; }
  else if (s.airT >= 0) {
    if ((s.airVy || 0) > 90 && !e.dead) { s.land = t; s.landVy = s.airVy; }
    s.airT = -1; s.airVy = 0;
  }
  const atk = e.attackTimer || 0;
  if (atk > 0) { if (!s.atkOn || atk > s.atk) s.atk = atk; s.atkOn = 1; }
  else { s.atk = 0; s.atkOn = 0; }
  s.vyPre = e.vy || 0;
  const p = s.snap;
  p.u = s.u; p.cad = s.cad; p.step = s.step; p.lift = s.lift; p.bob = s.bob; p.sink = 0;
  p.ph = s.ph; p.vel = s.vel; p.sp = s.sp; p.hit = s.hit; p.dead = s.dead;
  p.atk = s.atk; p.atkOn = s.atkOn; p.land = s.land; p.landVy = s.landVy;
  p.hp = s.hp; p.dt = dt; p.d = s.d; p.pose = s.sm;
  p.sprite = s.sprite || null; p.face = s.face || 1;
  p.prevSprite = s.prevSprite || null; p.blend = s.blend === undefined ? 1 : s.blend;
  return s;
}
// Render-only entry point: identical to rigMemory(e,t,true) and never advances live state.
export function poseSnapshot(e, t) { return rigMemory(e, t, true); }
// Installs a captured snapshot into a private clone so drawHuman(..., ghost) reproduces the
// exact recorded frame. Copies scalars AND the smoothed pose, so no easing drift appears.
// `snap.pose` must be captured (copied) at record time; it aliases the live buffer.
export function seedClone(clone, snap, t) {
  if (!clone || !snap) return null;
  let s = MEM.get(clone);
  if (!s) {
    s = freshSnap(); s.hp = clone.hp || 0; s.x = clone.x || 0; s.t = t || 0; s.airT = -1;
    s.snap = freshSnap(); s.sm = new Float64Array(NCH); MEM.set(clone, s);
  }
  for (let i = 0; i < SNAP_KEYS.length; i++) {
    const key = SNAP_KEYS[i];
    if (snap[key] === undefined) continue;
    s[key] = snap[key];
    s.snap[key] = snap[key];
  }
  if (snap.pose) { s.sm.set(snap.pose); s.smi = 1; s.snap.pose = s.sm; }
  else s.smi = 0;
  s.x = clone.x || 0; s.t = t || 0;
  return s.snap;
}

// ------------------------------------------------------------------ state machine
const SNAP = { swing: 1, shoot: 1, reload: 1, parry: 1, hurt: 1, dead: 1, dash: 1, land: 1 };
// Fills `out` with the blended pose for this actor. Never touches `e`.
export function solvePose(out, e, R, t, o) {
  const H = o.H || e.h || 54;
  const fr = frameOf(o.frame || 'hero', H);
  const sc = H / 54;
  const player = !!o.player;
  const ldir = o.ldir == null ? 1 : o.ldir;
  const sp = R.sp;
  const grounded = e.grounded !== false;
  const climbing = !!e.climbing;
  const crouching = !!e.crouching;
  const dashT = Math.max(e.dashTimer || 0, e.rush || 0);
  const atkT = e.attackTimer || 0;
  const dur = clamp(R.atk || atkT || .26, .1, .9);
  const ap = clamp(1 - atkT / dur, 0, 1);
  const hitAge = R.hit < -1 ? 99 : t - R.hit;
  const deadAge = R.dead ? t - R.dead : 0;
  const landAge = R.land < -1 ? 99 : t - R.land;
  const combo = (e.combo || 0) % 3 || 3;
  const melee = atkT > 0 && o.melee !== false;
  const shooter = !!o.shooter;
  const runAmt = clamp(sp / (H * 5.4), 0, 1);

  // Priority: committed actions (attack, dash, parry) outrank stance and locomotion, so
  // aerial and crouched swings still play their arm motion.
  let id;
  if (climbing) id = 'climb';
  else if (atkT > 0) id = (o.melee === false || o.shooter) ? 'shoot' : 'swing';
  else if (dashT > 0) id = 'dash';
  else if (e.parry > 0) id = 'parry';
  else if (crouching) id = 'crouch';
  else if (!grounded) id = (e.vy || 0) < -40 ? 'rise' : 'fall';
  else if (landAge < .28) id = 'land';
  else if (e.reloadTimer > 0) id = 'reload';
  else if (shooter && o.telegraph > 0) id = 'windup';
  else if (sp > H * .55) id = runAmt > .16 ? 'run' : 'walk';
  else id = o.combat ? 'ready' : 'idle';
  // a flinch only overrides soft states; attacks, parries and dashes keep their read
  if (hitAge < .22 && (id === 'idle' || id === 'ready' || id === 'walk' || id === 'run'
    || id === 'crouch' || id === 'climb' || id === 'land' || id === 'windup')) id = 'hurt';

  switch (id) {
    case 'idle': idle(A, R, t); break;
    case 'ready': ready(A, t); break;
    case 'walk': walk(A, R, t, sp, ldir); break;
    case 'run': run(A, R, t, sp, ldir); break;
    case 'dash': dash(A, clamp(dashT / .22, 0, 1)); break;
    case 'rise': rise(A, clamp(-(e.vy || 0) / 500, 0, 1)); break;
    case 'fall': fall(A, clamp((e.vy || 0) / 520, 0, 1)); break;
    case 'land': land(A, clamp(landAge / .28, 0, 1), R.landVy); break;
    case 'crouch': crouch(A, R, t, o.crouchAim); break;
    case 'climb': climb(A, R, t); break;
    case 'swing': {
      swing(A, ap, combo);
      if (ap < .34) { ready(B, t); blend(C, B, A, ap / .34); A.set(C); } // visible wind-up
      break;
    }
    case 'shoot': shoot(A, o.aimLocal || 0, clamp(ap / .5, 0, 1)); break;
    case 'reload': reload(A, clamp(1 - (e.reloadTimer || 0) / (e.reloadDuration || 1.2), 0, 1)); break;
    case 'parry': parry(A, clamp((e.parry || 0) / .55, 0, 1)); break;
    case 'windup': windup(A, o.telegraph); break;
    case 'hurt': hurt(A, clamp(hitAge / .22, 0, 1)); break;
    default: idle(A, R, t);
  }
  // Ranged upper-body poses keep walking underneath: legs, hip bob and lean follow the gait.
  if (grounded && !crouching && !climbing && R.sp > 10
    && (id === 'shoot' || id === 'reload' || id === 'windup')) {
    gaitUpper(A, R, sp, ldir, id === 'reload' ? .55 : 1);
  }
  if (R.dead) { dead(A, clamp(deadAge / .5, 0, 1)); id = 'dead'; }
  // aim bias while the weapon tracks the reticle
  const aim = o.aimLocal;
  if (aim != null && !melee && (id === 'ready' || id === 'idle' || id === 'crouch')) {
    A[K.WEAP] = aim + (id === 'idle' ? -.3 : 0);
    A[K.HEADX] = mix(A[K.HEADX], Math.cos(aim) * 1.7, .55);
    A[K.HEADY] = mix(A[K.HEADY], Math.sin(aim) * 1.7, .55);
    A[K.TILT] = mix(A[K.TILT], aim * .25, .5);
  }
  // Locomotion states ease into each other; attacks and flinches stay instant.
  // Ghost draws never smooth: a recorded frame must reproduce exactly.
  if (R.sm && !o.ghost) {
    if (SNAP[id]) { R.sm.set(A); R.smi = 1; }
    else if (!R.smi) { R.sm.set(A); R.smi = 1; }
    else {
      const k = 1 - Math.exp(-(R.dt > 0 ? R.dt : .016) * 17);
      for (let i = 0; i < NCH; i++) {
        if (i === K.LEAN || i === K.TILT || i === K.WEAP) R.sm[i] += wrap(A[i] - R.sm[i]) * k;
        else R.sm[i] += (A[i] - R.sm[i]) * k;
      }
      A.set(R.sm);
    }
  }
  scalePose(A, sc);
  out.set(A);
  return out;
}

// ------------------------------------------------------------------ forward kinematics
const JN = ['hx', 'hy', 'cx', 'cy', 'nx', 'ny', 'dx', 'dy', 'ha', 'pa',
  'shbx', 'shby', 'elbx', 'elby', 'hnbx', 'hnby',
  'shfx', 'shfy', 'elfx', 'elfy', 'hnfx', 'hnfy',
  'hipbx', 'hipby', 'knbx', 'knby', 'ankbx', 'ankby', 'toebx', 'toeby', 'heebx', 'heeby', 'toeba',
  'hipfx', 'hipfy', 'knfx', 'knfy', 'ankfx', 'ankfy', 'toefx', 'toefy', 'heefx', 'heefy', 'toefa',
  'wa', 'wx', 'wy', 'bx', 'by'];
export function makeJoints() { const J = {}; for (let i = 0; i < JN.length; i++) J[JN[i]] = 0; return J; }
const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
function ik2(rx, ry, tx, ty, l1, l2, pole) {
  let dx = tx - rx, dy = ty - ry, d = Math.hypot(dx, dy) || .001;
  const mx = l1 + l2 - .02, mn = Math.abs(l1 - l2) + .02;
  if (d > mx) { const f = mx / d; dx *= f; dy *= f; d = mx; }
  if (d < mn) { const f = mn / d; dx *= f; dy *= f; d = mn; }
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const dir = Math.atan2(dy, dx);
  const side = wrap(pole - dir) >= 0 ? 1 : -1;
  return [rx + Math.cos(dir + side * a) * l1, ry + Math.sin(dir + side * a) * l1];
}
export function solveJoints(P, fr, J) {
  const lean = P[K.LEAN], crouch = P[K.CROUCH];
  const hipx = P[K.HIPX], hipy = P[K.HIPY];
  const spine = fr.spine * P[K.CHEST] * (1 - crouch * .09) * (1 + P[K.STRETCH] * .05);
  const shW = fr.shW * (1 + P[K.TWIST] * .07);
  const ux = Math.sin(lean), uy = -Math.cos(lean);
  const rtx = Math.cos(lean), rty = Math.sin(lean);
  J.pa = lean; J.wa = P[K.WEAP];
  J.hx = hipx; J.hy = hipy;
  // chest pivot sits at 55% of the spine; the shoulder line caps the spine
  J.cx = hipx + ux * spine * .55; J.cy = hipy + uy * spine * .55;
  J.nx = hipx + ux * (spine + 1.2); J.ny = hipy + uy * (spine + 1.2);
  const look = P[K.HEADX] + P[K.LOOK];
  J.dx = J.nx + ux * fr.headR * 1.3 + rtx * look;
  J.dy = J.ny + uy * fr.headR * 1.3 + rty * look;
  J.ha = P[K.TILT] + lean * .45;
  J.shbx = hipx + ux * spine - rtx * shW; J.shby = hipy + uy * spine - rty * shW;
  J.shfx = hipx + ux * spine + rtx * shW; J.shfy = hipy + uy * spine + rty * shW;
  const [bx, by] = rot(P[K.BHX], P[K.BHY], lean);
  const [fx, fy] = rot(P[K.FHX], P[K.FHY], lean);
  const hfx = J.shfx + fx, hfy = J.shfy + fy;
  const mode = P[K.HANDMODE], grip = P[K.GRIP];
  const c = Math.cos(P[K.WEAP]), s = Math.sin(P[K.WEAP]);
  let hbx = J.shbx + bx, hby = J.shby + by;
  if (mode > .35) {
    if (mode > 1.5) { hbx = hfx - c * (grip + 3.2) - s * 1.6; hby = hfy - s * (grip + 3.2) + c * 1.6; }
    else { hbx = hfx - c * (grip + 4.4) + s * .9; hby = hfy - s * (grip + 4.4) - c * .9; }
  }
  const eb = ik2(J.shbx, J.shby, hbx, hby, fr.uarm, fr.farm, P[K.BELB] + lean);
  J.elbx = eb[0]; J.elby = eb[1]; J.hnbx = hbx; J.hnby = hby;
  const ef = ik2(J.shfx, J.shfy, hfx, hfy, fr.uarm, fr.farm, P[K.FELB] + lean);
  J.elfx = ef[0]; J.elfy = ef[1]; J.hnfx = hfx; J.hnfy = hfy;
  J.bx = hfx + c * (grip * .5 - 3.6); J.by = hfy + s * (grip * .5 - 3.6);
  J.wx = hfx + c * grip * .5; J.wy = hfy + s * grip * .5;
  J.hipbx = hipx - fr.hipW; J.hipby = hipy;
  J.hipfx = hipx + fr.hipW; J.hipfy = hipy;
  const leg = (hxp, hyp, tx2, ty2, toe, tag, J2) => {
    // pose gives the sole contact point; the ankle rides `ankle` above it, the foot pitches by `toe`
    const sa = Math.sin(toe), ca = Math.cos(toe);
    const ax = tx2 + sa * fr.ankle, ay = ty2 - ca * fr.ankle;
    const kn = ik2(hxp, hyp, ax, ay, fr.thigh, fr.shin, 0);
    J2['kn' + tag + 'x'] = kn[0]; J2['kn' + tag + 'y'] = kn[1];
    J2['ank' + tag + 'x'] = ax; J2['ank' + tag + 'y'] = ay;
    J2['toe' + tag + 'a'] = toe;
    J2['toe' + tag + 'x'] = ax + fr.foot * ca + fr.ankle * sa;
    J2['toe' + tag + 'y'] = ay - fr.foot * sa + fr.ankle * ca;
    J2['hee' + tag + 'x'] = ax - fr.toe * ca + fr.ankle * sa;
    J2['hee' + tag + 'y'] = ay + fr.toe * sa + fr.ankle * ca;
  };
  leg(J.hipbx, J.hipby, P[K.BFX], P[K.BFY], P[K.BTOE], 'b', J);
  leg(J.hipfx, J.hipfy, P[K.FFX], P[K.FFY], P[K.FTOE], 'f', J);
  return J;
}

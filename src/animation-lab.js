// Standalone visual review harness for the real actor renderer.
// Draws shipped game code only: no duplicate mechanics, no game state, and no
// writes outside this file. Node-safe (does nothing until a document exists).
import { drawActor, drawResident } from './actors.js';
import { captureTemporal, drawTemporal, resetTemporal, preloadArt } from './combat-presentation.js';
import { wardenDiagnostics } from './warden-sprites.js';

const BUILDS = ['blade', 'ghost', 'tank', 'gun'];
const BUILD_NAME = { blade: 'CHRONOBLADE', ghost: 'NETRUNNER', tank: 'BREAKER', gun: 'GUNSLINGER' };
const BUILD_HEX = { blade: '#8cff4a', ghost: '#c398ff', tank: '#ffb04a', gun: '#e2453f' };
// 'pistol' is the definitive reference weapon (long red-lit revolver) and is the name the
// real HUD uses for the Gunslinger primary.
const WEAPON = { blade: 'katana', ghost: 'arc', tank: 'fists', gun: 'pistol' };
const CELL_W = 288, CELL_H = 210, COLS = 5, GAP = 8, PADX = 12, PADY = 12;

function actor(id, over = {}) {
  return Object.assign({
    id, x: 0, y: 0, w: 28, h: 54, dir: 1, vx: 0, vy: 0, grounded: true,
    crouching: false, climbing: false, attackTimer: 0, parry: 0, reloadTimer: 0, reloadDuration: 1.2,
    reloadWeapon: null, lastAttackKind: null, combo: 0, hp: 100, maxHp: 100, dead: false,
    build: 'blade', weapon: 'katana', aimAngle: 0, alert: 0, stun: 0, flash: 0, invuln: 0, cloak: 0
  }, over);
}
// Each stage owns one persistent actor so the rig keeps its own gait memory.
const stage = (label, run, opt = {}) => ({ label, run, player: true, ...opt });
const mech = (label, over, run) => ({ label, run, player: false, make: () => actor(label.replace(/\W/g, ''), over) });

const STAGES = [
  stage('IDLE', () => { }),
  stage('WALK', a => { a.x += 62 * CLOCK.dt; a.vx = 62; }),
  stage('RUN', a => { a.x += 330 * CLOCK.dt; a.vx = 330; }),
  stage('DASH', a => {
    a.dashTimer = (a.dashTimer || 0) - CLOCK.dt;
    if (a.dashTimer <= 0) a.dashTimer = .34;
    a.x += 430 * CLOCK.dt; a.vx = 430;
  }),
  stage('JUMP', a => {
    a.jump = (a.jump ?? 0) + CLOCK.dt;
    if (a.jump > 1.5) a.jump = 0;
    a.grounded = a.jump > .95;
    a.vy = a.grounded ? 60 : -430 * Math.cos(a.jump * 6.2);
  }),
  stage('CROUCH', a => {
    a.crouch = ((a.crouch ?? 0) + CLOCK.dt) % 3.2;
    a.crouching = a.crouch > 3;
    a.x += (a.crouching ? 0 : 74) * CLOCK.dt; a.vx = a.crouching ? 0 : 74;
  }),
  stage('CLIMB', a => {
    a.climbing = true;
    // alternate the reach so both painted climb-reach frames are shown
    a.beat = ((a.beat ?? 0) + CLOCK.dt) % 2.4;
    a.ldir = a.beat < 1.2 ? 1 : -1;
    a.vx = a.ldir * 60; a.x += 18 * CLOCK.dt;
  }),
  stage('STRIKE 1', a => {
    a.attackTimer = (a.attackTimer || 0) - CLOCK.dt;
    if (a.attackTimer <= 0) { a.attackTimer = .34; a.lastAttackKind = 'katana'; }
  }, { combo: 1 }),
  stage('STRIKE 2', a => {
    a.attackTimer = (a.attackTimer || 0) - CLOCK.dt;
    if (a.attackTimer <= 0) { a.attackTimer = .34; a.lastAttackKind = 'katana'; }
  }, { combo: 2 }),
  stage('STRIKE 3', a => {
    a.attackTimer = (a.attackTimer || 0) - CLOCK.dt;
    if (a.attackTimer <= 0) { a.attackTimer = .4; a.lastAttackKind = 'katana'; }
  }, { combo: 3 }),
  stage('PARRY', a => {
    a.parry = (a.parry || 0) - CLOCK.dt;
    if (a.parry <= 0) a.parry = 1.5;
  }),
  stage('FIRE', a => {
    a.attackTimer = (a.attackTimer || 0) - CLOCK.dt;
    if (a.attackTimer <= 0) { a.attackTimer = .2; a.lastAttackKind = 'pistol'; }
    a.aimAngle = -.42;
  }),
  stage('RELOAD', a => {
    a.reloadTimer = (a.reloadTimer || 0) - CLOCK.dt;
    if (a.reloadTimer <= 0) { a.reloadTimer = 1.2; a.reloadWeapon = 'pistol'; }
  }),
  // Fixed-identity cells drive the painted action sheets directly, so the showcase shows
  // the real renderer whatever character happens to be selected in the header.
  stage('RUN-FIRE', a => {
    a.x += 210 * CLOCK.dt; a.vx = 210;
    a.attackTimer = (a.attackTimer || 0) - CLOCK.dt;
    if (a.attackTimer <= 0) { a.attackTimer = .26; a.lastAttackKind = 'pistol'; }
  }, { fixed: 'gun' }),
  stage('AIR-FIRE', a => {
    a.jump = (a.jump ?? 0) + CLOCK.dt;
    if (a.jump > 1.6) a.jump = 0;
    a.grounded = a.jump > 1.15;
    a.vy = a.grounded ? 60 : -280 * Math.cos(a.jump * 4);
    a.attackTimer = (a.attackTimer || 0) - CLOCK.dt;
    if (a.attackTimer <= 0) { a.attackTimer = .3; a.lastAttackKind = 'pistol'; }
  }, { fixed: 'gun' }),
  stage('CROUCH-FIRE', a => {
    a.crouching = true;
    a.attackTimer = (a.attackTimer || 0) - CLOCK.dt;
    if (a.attackTimer <= 0) { a.attackTimer = .3; a.lastAttackKind = 'pistol'; }
  }, { fixed: 'gun' }),
  stage('CYLINDER RELOAD', a => {
    a.reloadDuration = 2.2;
    a.reloadTimer = (a.reloadTimer || 0) - CLOCK.dt;
    if (a.reloadTimer <= 0) { a.reloadTimer = 2.2; a.reloadWeapon = 'pistol'; }
  }, { fixed: 'gun' }),
  stage('SIDEARM', a => {
    // walks the four painted Chronoblade sidearm contexts: stand, run, crouch, air
    a.ctx = ((a.ctx ?? 0) + CLOCK.dt) % 5.2;
    const k = Math.floor(a.ctx / 1.3) % 4;
    a.crouching = k === 2;
    a.grounded = k !== 3;
    a.vy = k === 3 ? -240 * Math.cos(a.ctx * 6) : 0;
    if (k === 1) { a.x += 200 * CLOCK.dt; a.vx = 200; } else a.vx = 0;
    a.attackTimer = (a.attackTimer || 0) - CLOCK.dt;
    if (a.attackTimer <= 0) { a.attackTimer = .28; a.lastAttackKind = 'pistol'; }
  }, { fixed: 'blade' }),
  stage('MAG RELOAD', a => {
    a.reloadDuration = 1.8;
    a.reloadTimer = (a.reloadTimer || 0) - CLOCK.dt;
    if (a.reloadTimer <= 0) { a.reloadTimer = 1.8; a.reloadWeapon = 'pistol'; }
  }, { fixed: 'blade' }),
  stage('HIT', a => {
    a.hit = (a.hit ?? 0) - CLOCK.dt;
    if (a.hit <= 0) { a.hit = 1.3; a.hp = a.hp > 40 ? a.hp - 30 : 100; }
  }),
  stage('DEATH', a => {
    a.death = (a.death ?? 0) + CLOCK.dt;
    if (a.death > 2.4) a.death = 0;
    a.dead = a.death > .35;
  }),
  mech('WARDEN / PATROL', { type: 'boss', w: 64, h: 86, active: false, cooldown: 1.1, phase: 0 }, a => { a.patrol = (a.patrol ?? 0) + CLOCK.dt; }),
  mech('WARDEN / WINDUP', { type: 'boss', w: 64, h: 86, active: true, cooldown: 0, phase: 0 }, a => {
    a.wind = (a.wind ?? 0) + CLOCK.dt;
    if (a.wind > 1.5) a.wind = 0;
    a.telegraph = .78 * (1 - (a.wind % .5) / .5);
  }),
  mech('WARDEN / CHARGE', { type: 'boss', w: 64, h: 86, active: true, cooldown: 0, phase: 1 }, a => {
    a.run = (a.run ?? 0) + CLOCK.dt;
    if (a.run > 1.4) a.run = 0;
    a.telegraph = a.run < .8 ? .9 * (1 - a.run / .8) : 0;
    a.charge = a.run >= .8 ? .55 : 0;
    a.x += 150 * CLOCK.dt;
  }),
  mech('WARDEN / PHASE 2', { type: 'boss', w: 64, h: 86, active: true, cooldown: 0, phase: 2 }, a => {
    a.wind = (a.wind ?? 0) + CLOCK.dt;
    if (a.wind > 1.6) a.wind = 0;
    a.telegraph = .78 * Math.max(0, 1 - (a.wind % .6) / .6);
    a.flash = ((a.flash ?? 0) - CLOCK.dt) || (hash(state.time * 3) > .82 ? .12 : 0);
  }),
  mech('DRONE / PATROL', { type: 'drone', w: 38, h: 26, alert: 0, burstLeft: 0 }, a => {
    a.patrol = (a.patrol ?? 0) + CLOCK.dt;
    a.y = Math.sin(a.patrol * 2.4) * 20;
  }),
  mech('DRONE / SCAN', { type: 'drone', w: 38, h: 26, alert: 1, burstLeft: 0 }, a => {
    a.patrol = (a.patrol ?? 0) + CLOCK.dt;
    a.y = Math.sin(a.patrol * 2.4) * 16;
    a.aim = { x: 400, y: a.y + 8 };
  }),
  mech('DRONE / BURST', { type: 'drone', w: 38, h: 26, alert: 1, burstLeft: 3 }, a => {
    a.patrol = (a.patrol ?? 0) + CLOCK.dt;
    a.aim = { x: 400, y: a.y + 6 };
    a.burstTimer = (a.burstTimer ?? 0) - CLOCK.dt;
    if (a.burstTimer <= 0) { a.burstTimer = .18; a.burstLeft = a.burstLeft > 0 ? a.burstLeft - 1 : 3; }
  }),
  mech('HELIX GUARD', { type: 'guard', faction: 'helix', color: '#9fd0e0', label: 'HELIX', alert: .9, hp: 85, maxHp: 85 }, a => { a.x += 40 * CLOCK.dt; }),
  mech('HELIX HEAVY', { type: 'heavy', faction: 'helix', color: '#ffb27a', label: 'HEAVY', alert: 1, telegraph: .4, hp: 120, maxHp: 155 }, a => {
    a.telegraph = .3 + .3 * Math.sin((a.p = (a.p ?? 0) + CLOCK.dt));
  }),
  { label: 'RESIDENT', player: false, resident: true, make: () => actor('resident', { role: 'vendor', homeX: 0, panic: 0, w: 22, h: 52 }), run: a => { a.x += 26 * CLOCK.dt; } }
];

function hash(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }

// Shared frame clock: stage scripts read CLOCK.dt instead of threading a parameter.
const CLOCK = { dt: 0 };
const state = { time: 0, build: 'blade', paused: false, step: false, fps: 60, frames: 0 };

function boot() {
  const canvas = document.getElementById('stage');
  const c = canvas.getContext('2d');
  const readout = document.getElementById('readout');
  const pauseBtn = document.getElementById('pause');
  const live = STAGES.map(def => ({ def, actor: def.make ? def.make() : null }));
  const echo = {
    p: actor('echo-player', { build: 'blade' }),
    s: { time: 0, mode: 'playing', world: { width: 4000, height: 800, interior: null }, slowTime: 0, player: null },
    t: 0, blink: 0
  };
  echo.s.player = echo.p;
  canvas.width = PADX * 2 + COLS * CELL_W + GAP * (COLS - 1);

  const boxOf = [];
  function layout() {
    boxOf.length = 0;
    let cx = 0, cy = 0, tall = 1;
    const place = (span, rows) => {
      if (cx + span > COLS) { cx = 0; cy += tall; tall = 1; }
      boxOf.push({
        x: PADX + cx * (CELL_W + GAP), y: PADY + cy * (CELL_H + GAP),
        w: CELL_W * span + GAP * (span - 1), h: CELL_H * rows + GAP * (rows - 1)
      });
      cx += span; tall = Math.max(tall, rows);
    };
    for (const l of live) place(1, 1);
    place(2, 2);
    const h = PADY * 2 + (cy + tall + 1) * (CELL_H + GAP);
    if (canvas.height !== h) canvas.height = h;
    return h;
  }

  function reset() {
    for (const l of live) l.actor = l.def.make ? l.def.make() : null;
    resetTemporal();
    Object.assign(echo.p, actor('echo-player', { build: state.build }));
    echo.s.world = { width: 4000, height: 800, interior: null };
    echo.s.slowTime = 0;
    echo.t = 0; echo.blink = 0;
    state.time = 0; state.frames = 0;
  }
  function setBuild(b) {
    state.build = b;
    for (const btn of document.querySelectorAll('[data-build]')) btn.setAttribute('aria-pressed', String(btn.dataset.build === b));
    for (const l of live) if (l.def.player) { l.actor = null; }
    echo.p.build = b; echo.p.weapon = WEAPON[b];
    resetTemporal();
  }

  function panel(box, label, accent) {
    c.fillStyle = '#061019dd'; c.fillRect(box.x, box.y, box.w, box.h);
    c.strokeStyle = '#16303f'; c.lineWidth = 1; c.strokeRect(box.x + .5, box.y + .5, box.w - 1, box.h - 1);
    c.fillStyle = accent; c.globalAlpha = .14; c.fillRect(box.x + 1, box.y + 1, box.w - 2, 18); c.globalAlpha = 1;
    c.strokeStyle = accent; c.globalAlpha = .5;
    c.beginPath(); c.moveTo(box.x + 1, box.y + 19.5); c.lineTo(box.x + box.w - 1, box.y + 19.5); c.stroke();
    c.globalAlpha = 1;
    c.font = '10px "Courier New", monospace'; c.textAlign = 'left'; c.fillStyle = accent;
    c.fillText(label.toUpperCase(), box.x + 9, box.y + 13);
    c.strokeStyle = '#0d1f2d'; c.globalAlpha = .85;
    for (let gx = box.x + 20; gx < box.x + box.w - 8; gx += 24) { c.beginPath(); c.moveTo(gx, box.y + 20); c.lineTo(gx, box.y + box.h - 6); c.stroke(); }
    for (let gy = box.y + 44; gy < box.y + box.h - 6; gy += 24) { c.beginPath(); c.moveTo(box.x + 6, gy); c.lineTo(box.x + box.w - 6, gy); c.stroke(); }
    c.globalAlpha = 1;
  }
  // Anchor the feet point on the cell, then scale, then cancel the actor offset.
  function figure(a, box, scale, ground, paint) {
    c.save();
    c.beginPath(); c.rect(box.x + 1, box.y + 20, box.w - 2, box.h - 21); c.clip();
    c.strokeStyle = '#1d4250'; c.lineWidth = 1; c.setLineDash([4, 5]);
    c.beginPath(); c.moveTo(box.x + 10, ground + .5); c.lineTo(box.x + box.w - 10, ground + .5); c.stroke();
    c.setLineDash([]);
    c.translate(box.x + box.w / 2, ground);
    c.scale(scale, scale);
    c.translate(-(a.x + (a.w || 28) / 2), -(a.y + (a.h || 54)));
    paint(c, a);
    c.restore();
  }

  function drawEchoBay(box) {
    const p = echo.p, ground = box.y + box.h - 30;
    const mode = echo.t < 2.6 ? 'GROUND RUN' : echo.t < 3.4 ? 'DASH BURST' : 'TIME FRACTURE + BLINK';
    p.x += (mode === 'DASH BURST' ? 380 : 150) * CLOCK.dt;
    p.dashTimer = mode === 'DASH BURST' ? Math.max(.06, p.dashTimer - CLOCK.dt) : 0;
    if (mode !== 'DASH BURST') p.dashTimer = 0;
    echo.s.slowTime = mode === 'TIME FRACTURE + BLINK' ? 2.4 : 0;
    echo.s.time = state.time;
    echo.blink += CLOCK.dt;
    if (echo.blink > 2.2) { echo.blink = 0; p.x += 150; }
    p.y = 0; p.vy = 0; p.grounded = true;
    panel(box, 'TEMPORAL ECHOES  ·  ' + mode, BUILD_HEX[state.build]);
    c.save();
    c.beginPath(); c.rect(box.x + 1, box.y + 20, box.w - 2, box.h - 21); c.clip();
    c.translate(box.x + box.w / 2 - (p.x + 14), ground - 54);
    captureTemporal(echo.s, state.time);
    drawTemporal(c, echo.s, state.time);
    drawActor(c, p, state.time, true, state.build);
    c.restore();
    c.font = '10px "Courier New", monospace'; c.textAlign = 'left'; c.fillStyle = '#4d7d8a';
    c.fillText('green ghost copies trail the real path · dash · time fracture · blink', box.x + 10, box.y + box.h - 10);
    c.textAlign = 'left';
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const raw = frame.last ? Math.min(.05, (now - frame.last) / 1000) : 1 / 60;
    frame.last = now;
    state.fps += (1 / Math.max(raw, .001) - state.fps) * .12;
    const step = state.paused ? (state.step ? (state.step = false, 1 / 60) : 0) : raw;
    CLOCK.dt = step;
    if (CLOCK.dt > 0) {
      state.time += CLOCK.dt; state.frames++;
      for (const l of live) {
        const a = l.actor || (l.actor = actor(l.def.label.replace(/\W/g, '')));
        if (l.def.fixed) { a.build = l.def.fixed; a.weapon = WEAPON[l.def.fixed]; a.combo = 0; }
        else if (l.def.player) {
          a.build = state.build; a.weapon = WEAPON[state.build];
          if (l.def.combo) a.combo = l.def.combo;
        }
        l.def.run(a, CLOCK.dt);
      }
      echo.t += CLOCK.dt;
      if (echo.t > 7.4) echo.t = 0;
    }
    const height = layout();
    c.fillStyle = '#04080e'; c.fillRect(0, 0, canvas.width, height);
    for (let i = 0; i < live.length; i++) {
      const l = live[i], box = boxOf[i], a = l.actor;
      if (!a) continue;
      const ground = box.y + box.h - 30;
      const accent = l.def.fixed ? BUILD_HEX[l.def.fixed] : l.def.player ? BUILD_HEX[state.build] : '#ff8f6a';
      panel(box, l.def.label, accent);
      // one scale per cell: actors of different heights stay inside their panel
      const scale = Math.min(2.8, (box.h - 74) / ((a.h || 54) + 10));
      figure(a, box, scale, ground, l.def.resident
        ? (cc, aa) => drawResident(cc, aa, state.time)
        : (cc, aa) => drawActor(cc, aa, state.time, !!l.def.player, aa.build || 'blade'));
    }
    drawEchoBay(boxOf[boxOf.length - 1]);
    // boss frame audit: all eight painted poses, with any unusable frame named
    const wd = wardenDiagnostics();
    const good = wd.frames.filter(f => f.present && f.srcInBounds && f.sizeOk && f.alphaOk).length;
    const rejects = (wd.guardRejects || []).length;
    const boss = wd.frames.length
      ? (good + '/8 BOSS FRAMES' + (wd.bad.length ? ' · ' + wd.bad.map(f => f.name).join(', ') : '') +
        (rejects ? ' · guard ' + rejects : ''))
      : 'BOSS FRAMES PENDING';
    readout.textContent = `${BUILD_NAME[state.build]} · ${state.paused ? 'PAUSED' : 'RUNNING'} · ${boss} · ${state.fps.toFixed(0)} fps · frame ${state.frames}`;
  }

  pauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? 'RESUME' : 'PAUSE';
  });
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('step').addEventListener('click', () => {
    state.step = true;
    if (!state.paused) { state.paused = true; pauseBtn.textContent = 'RESUME'; }
  });
  for (const btn of document.querySelectorAll('[data-build]')) btn.addEventListener('click', () => setBuild(btn.dataset.build));
  addEventListener('keydown', ev => {
    const k = ev.key.toLowerCase();
    if (k === ' ' || k === 'p') { ev.preventDefault(); pauseBtn.click(); }
    else if (k === 'r') reset();
    else if (k === 'n') document.getElementById('step').click();
    else if (k >= '1' && k <= '4') setBuild(BUILDS[+k - 1]);
  });
  reset();
  setBuild('blade');
  // painted atlases load exactly as they do in the game; the rig fallback shows until ready
  const artBadge = document.getElementById('art');
  const markArt = () => { if (artBadge) artBadge.textContent = 'ART READY'; };
  try {
    const p = preloadArt();
    if (p && typeof p.then === 'function') p.then(markArt, markArt); else markArt();
  } catch { markArt(); }
  requestAnimationFrame(frame);
}

if (typeof document !== 'undefined' && document.getElementById) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
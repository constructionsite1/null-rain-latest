/** Original procedural soundtrack and effects for NULL // RAIN.
 * API: await start() from a gesture; setMuted(bool), setVolume(0..1),
 * setIntensity(0..1), setPaused(bool), play(name, options|strength), destroy().
 * No assets are loaded. The scheduler stops while paused or the tab is hidden.
 */
export class AudioEngine {
  constructor() {
    this.ctx = null; this.volume = .3; this.muted = false; this.paused = false;
    this.intensity = 0; this.timer = null; this.step = 0; this.next = 0;
    this.nodes = new Set(); this.destroyed = false;
    this.onVisibility = () => this.sync();
    document.addEventListener('visibilitychange', this.onVisibility);
  }
  async start() {
    if (this.destroyed) return;
    if (!this.ctx) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      this.ctx = new Context();
      this.master = this.ctx.createGain();
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -12; limiter.knee.value = 18; limiter.ratio.value = 4;
      this.master.connect(limiter); limiter.connect(this.ctx.destination);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.master.gain.value = this.muted ? 0 : this.volume;
    }
    await this.ctx.resume(); this.sync();
  }
  setMuted(value) { this.muted = !!value; this.updateGain(); }
  setVolume(value) { this.volume = this.clamp(value); this.updateGain(); }
  setIntensity(value) { this.intensity = this.clamp(value); }
  clamp(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
  updateGain() {
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, .04);
  }
  setPaused(value) { this.paused = !!value; this.sync(); }
  sync() {
    if (!this.ctx || this.destroyed) return;
    const stopped = this.paused || document.hidden;
    clearInterval(this.timer); this.timer = null;
    if (stopped) { this.ctx.suspend().catch(() => {}); return; }
    this.ctx.resume().catch(() => {});
    this.next = this.ctx.currentTime + .06;
    this.timer = setInterval(() => this.schedule(), 60); this.schedule();
  }
  track(source, gain, extra = []) {
    this.nodes.add(source);
    source.onended = () => {
      source.disconnect(); gain.disconnect(); extra.forEach(node => node.disconnect());
      this.nodes.delete(source);
    };
  }
  tone(freq, time, duration, level, type = 'sine', endFreq = freq, cutoff = 2500) {
    if (!this.ctx || this.nodes.size > 96) return;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(), filter = this.ctx.createBiquadFilter();
    osc.type = type; osc.frequency.setValueAtTime(Math.max(20, freq), time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), time + duration);
    filter.type = 'lowpass'; filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(level, time + Math.min(.035, duration / 5));
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    osc.connect(filter); filter.connect(gain); gain.connect(this.master);
    this.track(osc, gain, [filter]); osc.start(time); osc.stop(time + duration + .02);
  }
  hiss(time, duration, level, frequency = 1000, type = 'highpass') {
    if (!this.ctx || this.nodes.size > 96) return;
    const source = this.ctx.createBufferSource(), gain = this.ctx.createGain(), filter = this.ctx.createBiquadFilter();
    source.buffer = this.noise; source.loop = true;
    filter.type = type; filter.frequency.value = frequency; filter.Q.value = .7;
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(level, time + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.master);
    this.track(source, gain, [filter]); source.start(time, Math.random()); source.stop(time + duration + .02);
  }
  schedule() {
    if (!this.ctx || this.paused || document.hidden) return;
    const beat = 60 / 94, tick = beat / 4;
    while (this.next < this.ctx.currentTime + .18) {
      const s = this.step++, t = this.next, k = this.intensity;
      const roots = [45, 41, 48, 43], root = roots[Math.floor(s / 64) % 4];
      const hz = n => 440 * 2 ** ((n - 69) / 12);
      if (s % 16 === 0) {
        [0, 7, 12, 15].forEach((n, i) => this.tone(hz(root + n), t + i * .014, beat * 4.5, .028, 'triangle', hz(root + n) * 1.003, 650));
        this.hiss(t, beat * 4, .013, 3200);
      }
      if (s % 4 === 0) this.tone(hz(root - 12), t, tick * 2.8, .10, 'triangle', hz(root - 12), 400);
      if (s % 2 === 0) {
        const pattern = [0, 7, 12, 15, 12, 7, 19, 7];
        this.tone(hz(root + 12 + pattern[(s / 2) % 8]), t, tick * 1.5, .018 + k * .015, 'triangle', undefined, 1100 + k * 1000);
      }
      if (s % 16 === 0 || (k > .45 && s % 8 === 6)) this.tone(120, t, .18, .20, 'sine', 36);
      if (s % 16 === 8) { this.hiss(t, .12, .07, 1500, 'bandpass'); this.tone(180, t, .08, .025); }
      if (s % 4 === 2 || (k > .65 && s % 2 === 1)) this.hiss(t, .045, .025, 6500);
      this.next += tick;
    }
  }
  play(name, options = {}) {
    if (!this.ctx || this.ctx.state !== 'running' || this.paused || document.hidden || this.destroyed) return;
    const strength = typeof options === 'number' ? options : options.volume ?? options.strength ?? 1;
    const amp = this.clamp(strength), t = this.ctx.currentTime + .005;
    const tone = (a, d, l, b = a, type = 'sine') => this.tone(a, t, d, l * amp, type, b);
    const noise = (d, l, f = 1500) => this.hiss(t, d, l * amp, f);
    const chord = (notes, d = .6) => notes.forEach((f, i) => this.tone(f, t + i * .065, d, .09 * amp, 'triangle'));
    switch (name) {
      case 'jump': tone(180, .16, .14, 360, 'triangle'); break;
      case 'doubleJump': tone(270, .21, .14, 680, 'triangle'); noise(.1, .035, 4000); break;
      case 'land': tone(72, .1, .16, 40); noise(.06, .08, 600); break;
      case 'dash': noise(.19, .17, 2500); tone(190, .16, .065, 55); break;
      case 'slash': noise(.13, .19, 1800); tone(500, .09, .045, 95); break;
      case 'shoot': tone(130, .1, .18, 32, 'triangle'); noise(.08, .16, 2600); break;
      case 'hit': noise(.1, .15, 700); tone(100, .13, .15, 40); break;
      case 'hurt': tone(150, .26, .16, 55, 'sawtooth'); noise(.2, .08, 500); break;
      case 'death': tone(180, 1.1, .12, 25, 'triangle'); noise(.6, .08, 500); break;
      case 'hackTick': case 'ui': tone(720, .07, .07, 820, 'triangle'); break;
      case 'hack': case 'ability': chord([220, 330, 440], .45); break;
      case 'hackFail': tone(170, .25, .11, 100, 'triangle'); break;
      case 'unlock': case 'pickup': chord([440, 550, 660], .35); break;
      case 'checkpoint': chord([220, 330, 440, 660], .8); break;
      case 'alert': case 'boss': chord([110, 116.54, 220], .7); break;
      case 'siren':
        this.tone(330,t,.65,.045*amp,'sine',495,900);
        this.tone(495,t+.65,.65,.04*amp,'sine',330,900);
        break;
      case 'win': chord([220, 261.63, 330, 440, 523.25], 1.3); break;
      case 'noise': noise(.3, .12, 1200); break;
      default: break;
    }
  }
  destroy() {
    this.destroyed = true; clearInterval(this.timer); this.timer = null;
    document.removeEventListener('visibilitychange', this.onVisibility);
    for (const node of this.nodes) { try { node.stop(); } catch {} }
    this.nodes.clear(); if (this.ctx) this.ctx.close().catch(() => {});
  }
}

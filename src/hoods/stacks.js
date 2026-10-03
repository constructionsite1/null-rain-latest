/** THE STACKS: residential towers, fire-escape zig-zags, laundry catwalks. Deterministic. */
function hash(n) {
  let h = (n | 0) * 374761393 + 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export default function stacks(x0) {
  const W = 1400, GROUND = 2140, STEP = 105;
  const out = { platforms: [], ladders: [], shadows: [], decorations: [], objects: [], pickups: [], zones: [], enemies: [] };
  const E = (id, type, x, feet, minX, maxX, dir = -1) => out.enemies.push({ id: `stacks-${id}`, type, x, y: feet - (type === 'boss' ? 86 : type === 'drone' ? 26 : 54), minX, maxX, dir });
  const P = (id, x, y, w, kind = 'metal', h = 22) => out.platforms.push({ id: `stacks-${id}`, x, y, w, h, kind });
  const L = (x, top, bottom) => out.ladders.push({ x, y: top, w: 36, h: bottom - top });
  const D = (type, x, y, w, h, text = '', color = '#35d8df') => out.decorations.push({ type, x, y, w, h, text, color });
  const colors = ['#a0eda8', '#35d8df', '#fa4f9e', '#f9a75b'];

  P('floor', x0, GROUND, W, 'solid', 260);
  out.zones.push({ name: 'THE STACKS', x: x0, w: W, color: '#a0eda8' });

  const towers = 4, bw = 250, gap = (W - towers * bw) / (towers + 1);
  const bx = [];
  for (let t = 0; t < towers; t++) {
    const x = Math.round(x0 + gap + t * (bw + gap));
    bx.push(x);
    const floors = 6 + Math.floor(hash(t + 11) * 4); // 6..9 landings
    const roofY = GROUND - floors * STEP;
    D('building', x, roofY, bw, GROUND - roofY, '', colors[t % 4]);
    D('pipe', x + bw - 30, roofY + 40, 16, GROUND - roofY - 40, '', colors[t % 4]);
    D('window', x + 40, roofY + 90, 90, 60, '', '#ad744449');
    // zig-zag fire escapes alternating left/right (jump + double jump)
    for (let f = 1; f <= floors; f++) {
      const left = f % 2 === 1;
      const w = 130;
      const px = left ? x - 40 : x + bw - w + 40;
      P(`t${t}-fe${f}`, px, GROUND - f * STEP, w);
      D('awning', px, GROUND - f * STEP, w, 18, '', colors[(t + f) % 4]);
    }
    if (t === 0 || t === 2 || t === 3) { const f = t === 0 ? 2 : 3, left = f % 2 === 1, px = left ? x - 40 : x + bw - 130 + 40; E(`guard${t}`, 'guard', px + 30, GROUND - f * STEP, px + 5, px + 125, t % 2 ? -1 : 1); }
    if (t === 1) E('sniper', 'sniper', x + 100, roofY - STEP, x, x + bw - 20);
    // rooftop garden
    P(`t${t}-roof`, x - 10, roofY - STEP, bw + 20);
    D('crate', x + 20, roofY - STEP - 40, 40, 40);
    D('lamp', x + bw - 40, roofY - STEP - 100, 0, 100, '', '#a0eda8');
    D('antenna', x + bw / 2, roofY - STEP - 90, 0, 90);
    // climb pole from ground up to the third landing
    L(x + bw / 2 - 18, GROUND - 3 * STEP, GROUND);
    // shadowed stairwells
    out.shadows.push({ x: x + 20, y: GROUND - 150, w: 150, h: 150 });
    out.shadows.push({ x: x + 60, y: GROUND - 3 * STEP - 150, w: 140, h: 150 });
    D('shop', x + 10, GROUND - 120, 200, 120, ['LAUNDRY 24', 'NOODLES', 'POST BOX', 'REPAIRS'][t], colors[t % 4]);
  }
  D('sign', bx[0] + 60, 1200, 300, 120, 'THE STACKS', '#a0eda8');

  // laundry-line catwalks bridging gaps between towers
  for (let t = 0; t < towers - 1; t++) {
    const level = 3 + Math.floor(hash(t + 40) * 3);
    const y = GROUND - level * STEP - 40 + (t % 2) * STEP;
    const x = bx[t] + bw - 40, w = bx[t + 1] - x + 40;
    P(`line${t}`, x, Math.round(y / 5) * 5, w);
    D('cable', x, y - 60, w, 60, '', '#f777ac');
    for (let k = 0; k < 4; k++) D('lantern', x + 30 + k * (w / 4), y - 30, 24, 42, '', colors[(t + k) % 4]);
  }

  const pick = (id, type, x, y) => out.pickups.push({ id: `stacks-${id}`, type, x, y, value: type === 'shard' ? 1 : 35 });
  pick('a', 'shard', bx[0] + bw / 2, GROUND - 3 * STEP - 60);
  pick('b', 'health', bx[2] + 60, 2100);
  pick('c', 'shard', bx[3] + bw / 2, GROUND - 7 * STEP - 60);

  out.objects = out.decorations;
  return out;
}

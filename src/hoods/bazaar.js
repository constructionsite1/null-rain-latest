// NEON BAZAAR neighbourhood: deterministic, no Math.random.
export default function bazaar(x0) {
  const W = 1400, G = 2140;
  const hash = (n) => { let h = (n * 2654435761 + 1013904223) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return h >>> 0; };
  const pick = (n, arr) => arr[hash(n) % arr.length];
  const cols = ['#ff4a9c', '#35d8df', '#ffae51', '#a0eda8', '#ff765c'];
  const out = { platforms: [], ladders: [], shadows: [], decorations: [], pickups: [], zones: [], enemies: [] };
  const E = (id, type, x, feet, minX, maxX, dir = -1) => out.enemies.push({ id: `bz-${id}`, type, x: x0 + x, y: feet - (type === 'boss' ? 86 : type === 'drone' ? 26 : 54), minX: x0 + minX, maxX: x0 + maxX, dir });
  out.objects = out.decorations;
  const plat = (id, x, y, w, kind = 'metal', h = 22) => out.platforms.push({ id: `bz-${id}`, x: x0 + x, y, w, h, kind });
  const deco = (type, x, y, w, h, text = '', color = '#35d8df') => out.decorations.push({ type, x: x0 + x, y, w, h, text, color });

  out.zones.push({ name: 'NEON BAZAAR', x: x0, w: W, color: '#ff4a9c' });
  plat('floor', 0, G, W, 'solid', 260);

  // Stalls: awnings at heights reachable from the floor with a single jump.
  const heights = [2040, 1940, 1840];
  let x = 40, i = 0;
  while (x < W - 260) {
    const w = 150 + hash(i * 7) % 90;
    const y = heights[hash(i * 3 + 1) % heights.length];
    plat(`awn${i}`, x, y, w, 'metal', 18);
    deco('awning', x, y, w, 26, '', pick(i, cols));
    deco('shop', x + 10, G - 90, w - 20, 90, pick(i + 9, ['NOODLES', 'CHIPS 4U', 'SYNTH TEA', 'REPAIR', 'WIRE+BONE', 'SOUP']), pick(i + 2, cols));
    if (i % 2 === 0) deco('lantern', x + w / 2, y + 30 + hash(i) % 30, 24, 42, '', '#ff765c');
    x += w + 40 + hash(i * 5) % 50; i++;
  }

  // Stacked shop-houses with balconies (step 100, alternating sides for double jump).
  for (const [bx, n] of [[200, 5], [760, 6], [1120, 4]]) {
    deco('building', bx - 30, G - 110 * n - 80, 330, 110 * n + 80, '', pick(bx, cols));
    for (let f = 0; f < n; f++) {
      const side = f % 2 ? 150 : 0;
      plat(`bal${bx}-${f}`, bx + side, G - 100 * (f + 1) - 20, 140, 'metal', 18);
      deco('window', bx + side + 20, G - 100 * (f + 1) - 90, 100, 50, '', '#ad744449');
    }
    deco('sign', bx + 270, G - 110 * n + 20, 90, 200, '夢\nRAIN', pick(bx + 1, cols));
  }

  // Climb poles
  out.ladders.push({ x: x0 + 80, y: 1840, w: 36, h: G - 1840 });
  out.ladders.push({ x: x0 + 700, y: 1740, w: 36, h: G - 1740 });
  out.ladders.push({ x: x0 + 1300, y: 1840, w: 36, h: G - 1840 });

  // Shadowed alleys
  out.shadows.push({ x: x0 + 520, y: 1990, w: 200, h: 150 }, { x: x0 + 1000, y: 1990, w: 130, h: 150 }, { x: x0 + 230, y: 1700, w: 150, h: 150 });

  // Signs and lanterns
  deco('sign', 20, 1700, 180, 90, 'NEON\nBAZAAR', '#ff4a9c');
  deco('sign', 560, 1660, 150, 90, 'OPEN\n24H', '#53eeff');
  deco('neon', 1250, 1720, 100, 80, 'RAMEN', '#ffae51');
  for (let l = 0; l < 6; l++) deco('lantern', 120 + l * 220, 1750 + hash(l + 50) % 60, 24, 42, '', pick(l, cols));
  deco('crate', 620, G - 60, 60, 60); deco('crate', 1060, G - 60, 60, 60);

  out.pickups.push(
    { id: 'bz-shard-a', type: 'shard', x: x0 + 1190, y: 1700, value: 1 },
    { id: 'bz-cell', type: 'energy', x: x0 + 300, y: 2060, value: 35 },
    { id: 'bz-shard-b', type: 'shard', x: x0 + 830, y: 1520, value: 1 },
  );
  E('guard-a', 'guard', 420, G, 330, 700, 1);
  E('guard-b', 'guard', 900, G, 780, 1100);
  E('guard-c', 'guard', 1180, G, 1100, 1380, 1);
  E('guard-d', 'guard', 100, G, 20, 190);
  E('drone', 'drone', 600, 1700, 100, 1300, 1);
  return out;
}

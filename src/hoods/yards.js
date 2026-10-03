/** RUST YARDS: industrial neighbourhood, 1400 wide, ground y=2140. Deterministic. */
const hash = (n) => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };

export default function yards(x0) {
  const out = { platforms: [], ladders: [], shadows: [], objects: [], pickups: [], zones: [] };
  const P = (id, x, y, w, kind = 'metal', h = 22) => out.platforms.push({ id: `yards-${id}`, x: x0 + x, y, w, h, kind });
  const L = (x, top, bottom) => out.ladders.push({ x: x0 + x, y: top, w: 36, h: bottom - top });
  const O = (type, x, y, w, h, text = '', color = '#c0642e') => out.objects.push({ type, x: x0 + x, y, w, h, text, color });
  const G = 2140;
  P('floor', 0, G, 1400, 'solid', 260);

  // Container stacks: solid blocks, each layer 90 tall (single jump), climb over them.
  const stacks = [[60, 2], [330, 3], [640, 2], [980, 3], [1230, 1]];
  stacks.forEach(([sx, n], i) => {
    const w = 190 + Math.floor(hash(i + 1) * 3) * 20;
    for (let k = 0; k < n; k++) {
      const off = k ? Math.floor((hash(i * 7 + k) - 0.5) * 30) : 0;
      const y = G - 90 * (k + 1);
      P(`cont-${i}-${k}`, sx + off, y, w, 'solid', 90);
      O('crate', sx + off, y, w, 90, '', hash(i * 3 + k) > 0.5 ? '#b5532a' : '#7d5a3c');
    }
    out.shadows.push({ x: x0 + sx + w, y: G - 150, w: 60, h: 150 });
  });

  // Pipe catwalks above the stacks, then crane arms as high platforms.
  P('catwalk-a', 150, 1850, 300); P('catwalk-b', 520, 1790, 300);
  P('catwalk-c', 880, 1730, 260);
  P('crane-a', 300, 1640, 420); P('crane-b', 800, 1520, 460);
  P('tank-top', 1180, 1900, 180);
  L(190, 1850, G - 180); L(1250, 1900, G); L(560, 1640, 1790); L(1000, 1520, 1730);
  O('pipe', 150, 1860, 300, 14, '', '#8a4a2a'); O('pipe', 520, 1800, 300, 14, '', '#8a4a2a');
  O('antenna', 700, 1560, 0, 80); O('antenna', 1200, 1440, 0, 80);
  O('building', 1050, 1930, 150, 210, '', '#8a4a2a');
  O('sign', 600, 1500, 200, 70, 'RUST\nYARDS', '#ff9654');
  O('lamp', 420, 1650, 0, 90, '', '#ffae51');

  out.shadows.push({ x: x0 + 560, y: 1930, w: 200, h: 210 }, { x: x0 + 1090, y: 2000, w: 120, h: 140 }, { x: x0 + 300, y: 1500, w: 180, h: 140 });

  out.pickups.push(
    { id: 'yards-shard-a', type: 'shard', x: x0 + 430, y: 1610, value: 1 },
    { id: 'yards-med-a', type: 'health', x: x0 + 1250, y: 1870, value: 35 },
    { id: 'yards-cell-a', type: 'energy', x: x0 + 1000, y: 1490, value: 35 },
  );
  out.zones.push({ name: 'RUST YARDS', x: x0, w: 1400, color: '#c0642e' });
  out.decorations = out.objects;
    const E = (id, type, x, feet, minX, maxX, dir = -1) => { const h = type === 'drone' ? 26 : 54; return { id, type, x: x0 + x, y: feet - h, minX: x0 + minX, maxX: x0 + maxX, dir }; };
  out.enemies = [
    E('yards-heavy-a', 'heavy', 880, 2140, 860, 975),
    E('yards-heavy-b', 'heavy', 420, 1640, 310, 700, 1),
    E('yards-heavy-c', 'heavy', 600, 1790, 530, 810),
    E('yards-drone', 'drone', 700, 1430, 300, 1250, 1),
  ];
  return out;
}

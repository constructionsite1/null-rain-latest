// GLASS SPIRES: corporate plaza neighbourhood, 1400 wide. Deterministic (seeded hash).
const hash = (n) => { let h = (n ^ 0x9e3779b9) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function spires(x0) {
  const out = { platforms: [], ladders: [], shadows: [], decorations: [], objects: [], pickups: [], zones: [] };
  out.objects = out.decorations;
  const P = (id, dx, y, w, kind = 'metal', h = 22) => out.platforms.push({ id: `spires-${id}`, x: x0 + dx, y, w, h, kind });
  const L = (dx, top, bottom) => out.ladders.push({ x: x0 + dx, y: top, w: 36, h: bottom - top });
  const D = (type, dx, y, w, h, text = '', color = '#63d9ff') => out.decorations.push({ type, x: x0 + dx, y, w, h, text, color });
  const S = (dx, y, w, h) => out.shadows.push({ x: x0 + dx, y, w, h });

  P('floor', 0, 2140, 1400, 'solid', 260);

  // Tower bases (solid blocks), each 140 tall: reachable with jump + double jump.
  const towers = [[60, 260], [520, 300], [1000, 320]];
  const colors = ['#63d9ff', '#a0eda8', '#ff9bd0'];
  towers.forEach(([dx, w], i) => {
    P(`base-${i}`, dx, 2000, w, 'solid', 140);
    const top = 700 + Math.floor(hash(i + 7) * 500);
    D('building', dx + 10, top, w - 20, 2000 - top, '', colors[i]);
    D('window', dx + 30, 1900, w - 60, 60, '', '#63d9ff55');
  });

  // Maintenance ledges stepping up each tower (<=130 each) with poles up sides.
  P('ledge-a1', 20, 1870, 150); P('ledge-a2', 210, 1740, 150); P('ledge-a3', 60, 1610, 190);
  L(300, 1740, 2000); L(280, 1610, 1740);
  P('ledge-b1', 480, 1880, 140); P('ledge-b2', 700, 1760, 150);
  L(830, 1630, 2000);
  P('ledge-c1', 1230, 1880, 140); P('ledge-c2', 1000, 1750, 150); P('ledge-c3', 1190, 1620, 180);
  L(1030, 1750, 2000);

  // Sky-bridges between towers.
  P('bridge-ab', 250, 1610, 260, 'metal', 16); P('bridge-ab2', 520, 1580, 300, 'metal', 16);
  P('bridge-bc', 840, 1630, 180, 'metal', 16);
  P('bridge-top', 640, 1470, 340, 'metal', 16);
  L(900, 1470, 1630);

  // Holo-billboard platforms.
  [[380, 1860, 'HOLO'], [900, 1860, 'NEXUS'], [1180, 1990, 'AXIOM']].forEach(([dx, y, t], i) => {
    P(`holo-${i}`, dx, y, 130, 'metal', 14);
    D('sign', dx - 5, y - 150, 140, 120, `${t}\nCORP`, colors[i % 3]);
  });

  // Shadowed service corridors under bridges and in tower bases.
  S(330, 2000, 180, 140); S(840, 2000, 160, 140); S(250, 1470, 240, 140); S(1190, 1500, 180, 120);

  for (let i = 0; i < 6; i++) D('lamp', 20 + i * 240 + Math.floor(hash(i) * 60), 2020, 0, 120, '', '#63d9ff');
  D('sign', 380, 1450, 280, 130, 'GLASS\nSPIRES', '#63d9ff');

  [['spires-a', 'shard', 100, 1820], ['spires-b', 'energy', 780, 1420], ['spires-c', 'health', 1260, 1580]]
    .forEach(([id, type, dx, y]) => out.pickups.push({ id, type, x: x0 + dx, y, value: type === 'shard' ? 1 : 35 }));

  out.zones.push({ name: 'GLASS SPIRES', x: x0, w: 1400, color: '#63d9ff' });
    const E = (id, type, x, feet, minX, maxX, dir = -1) => { const h = type === 'drone' ? 26 : 54; return { id, type, x: x0 + x, y: feet - h, minX: x0 + minX, maxX: x0 + maxX, dir }; };
  out.enemies = [
    E('spires-guard-a', 'guard', 380, 1610, 260, 500, 1),
    E('spires-guard-b', 'guard', 650, 1580, 530, 810),
    E('spires-guard-c', 'guard', 780, 1470, 650, 970, 1),
    E('spires-guard-d', 'guard', 930, 1630, 850, 1010),
    E('spires-sniper-a', 'sniper', 160, 1610, 70, 240),
    E('spires-sniper-b', 'sniper', 1290, 1620, 1200, 1360),
  ];
  return out;
}

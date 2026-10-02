/** NULL // RAIN campaign. Only the first district is currently playable. */
export const CAMPAIGN = [
  { id: 'rain-market', name: '01 / THE RAIN MARKET', biome: 'Neon bazaar / maintenance stacks', playable: true, description: 'Steal the weather archive from the city that sells its own rain.' },
  { id: 'glass-garden', name: '02 / GLASS GARDEN', biome: 'Overgrown corporate conservatory', playable: false, description: 'Follow the stolen memories into a sealed botanical district.' },
  { id: 'dead-sun', name: '03 / DEAD SUN', biome: 'Amber foundry / orbital uplink', playable: false, description: 'Decide who owns the dawn.' },
];

/** Fresh mutable data on every new run; no state is shared between saves. */
export function createWorld() {
  const world = {
    id: 'rain-market', name: 'THE RAIN MARKET', width: 7200, height: 2400,
    spawn: { x: 180, y: 2086 },
    zones: [
      { name: 'RAIN MARKET', x: 0, w: 2500, color: '#fb438e' },
      { name: 'UTILITY SPIRE', x: 2500, w: 2900, color: '#32e3dc' },
      { name: 'RELAY CROWN', x: 5400, w: 1800, color: '#ffae51' },
    ],
    platforms: [], ladders: [], shadows: [], decorations: [],
    interactables: [], enemies: [], gates: [], pickups: [],
  };
  const platform = (id, x, y, w, kind = 'metal', h = 22) => world.platforms.push({ id, x, y, w, h, kind });
  const ladder = (x, top, bottom) => world.ladders.push({ x, y: top, w: 36, h: bottom - top });
  const decoration = (type, x, y, w, h, text = '', color = '#35d8df') => world.decorations.push({ type, x, y, w, h, text, color });
  const interact = (id, type, x, y, label, extra = {}) => world.interactables.push({ id, type, x, y, label, ...extra });
  const enemy = (id, type, x, feet, minX, maxX, dir = -1) => world.enemies.push({ id, type, x, y: feet - (type === 'boss' ? 86 : type === 'drone' ? 26 : 54), minX, maxX, dir });

  // A continuous street provides a forgiving route. Upper floors are one-way:
  // every change in height is <= 190, and ladders link each district's spine.
  platform('street', 0, 2140, 7200, 'solid', 260);
  const shelves = [
    ['market-awning-a', 300, 1950, 470], ['market-awning-b', 830, 1790, 430],
    ['market-balcony', 1290, 1630, 470], ['market-roof', 1750, 1450, 570],
    ['market-bridge', 2170, 1620, 570], ['market-return', 1430, 1960, 670],
    ['market-lower', 2200, 1960, 620], ['spire-west', 2720, 1780, 470],
    ['spire-relay', 3110, 1600, 550], ['spire-upper', 3600, 1420, 520],
    ['spire-roof', 4080, 1240, 650], ['spire-secret', 4560, 1060, 470],
    ['spire-east', 4650, 1430, 600], ['spire-descent', 5120, 1610, 460],
    ['spire-low', 3460, 1960, 650], ['spire-middle', 4010, 1780, 650],
    ['crown-approach', 5490, 1790, 560], ['crown-catwalk', 5840, 1600, 700],
    ['crown-roof', 6410, 1430, 590], ['crown-egress', 6690, 1790, 440],
    ['boss-service', 6110, 1960, 630],
  ];
  for (const [id, x, y, w] of shelves) platform(id, x, y, w);
  for (const [x, top, bottom] of [
    [490, 1950, 2140], [1020, 1790, 2140], [1510, 1630, 1960],
    [1990, 1450, 1960], [2440, 1620, 2140], [2920, 1780, 2140],
    [3310, 1600, 1960], [3830, 1420, 1960], [4350, 1240, 1780],
    [4840, 1060, 1430], [5330, 1610, 2140], [5700, 1790, 2140],
    [6010, 1600, 1790], [6540, 1430, 1960], [6900, 1790, 2140],
  ]) ladder(x, top, bottom);

  // Cover has explicit volumes so detection can use the same geometry as art.
  for (const [x, y, w, h] of [
    [100, 1990, 330, 150], [720, 1980, 180, 160], [1200, 1980, 190, 160],
    [1600, 1800, 260, 160], [2150, 1980, 220, 160], [2800, 1990, 220, 150],
    [3220, 1440, 200, 160], [3650, 1990, 210, 150], [4200, 1620, 180, 160],
    [4800, 1270, 220, 160], [5160, 1990, 200, 150], [5590, 1630, 200, 160],
    [6200, 1800, 170, 160], [6840, 1980, 180, 160],
  ]) world.shadows.push({ x, y, w, h });

  interact('checkpoint-start', 'checkpoint', 230, 2140, 'SAFEHOUSE / SAVE');
  interact('bench-market', 'upgrade', 370, 2140, 'RIPPER / UPGRADES');
  interact('cache-pulse', 'cache', 1050, 1790, 'PULSE PISTOL', { weapon: 'pulse' });
  interact('relay-market', 'terminal', 2040, 1450, 'MARKET RELAY', { puzzle: true, description: 'Align three signal bands to sever the market surveillance feed.' });
  interact('checkpoint-spire', 'checkpoint', 2750, 2140, 'MAINTENANCE / SAVE');
  interact('bench-spire', 'upgrade', 3050, 2140, 'TECH BENCH / UPGRADES');
  interact('relay-spire', 'terminal', 3400, 1600, 'SPIRE RELAY', { puzzle: true, description: 'Align three signal bands to unlock the archive perimeter.' });
  interact('cache-arc', 'cache', 4430, 1240, 'ARC CARBINE', { weapon: 'arc' });
  interact('cache-scatter', 'cache', 4900, 2140, 'SCATTER CANNON', { weapon: 'scatter' });
  interact('checkpoint-crown', 'checkpoint', 5600, 2140, 'CROWN / SAVE');
  interact('bench-crown', 'upgrade', 5730, 2140, 'FINAL BENCH / UPGRADES');
  interact('security-market','terminal',1240,2140,'ALARM SUBSTATION / MARKET',{description:'Jam the district alarm for 35 seconds. Patrols can still see and fight you.'});
  interact('security-spire','terminal',3900,1960,'ALARM SUBSTATION / SPIRE',{description:'Silence reinforcements and district alarm for 35 seconds.'});
  interact('security-crown','terminal',5930,1790,'ALARM SUBSTATION / CROWN',{description:'Disrupt the district response before entering the crown.'});
  interact('boss-override', 'terminal', 6500, 1430, 'WARDEN / REMOTE OVERRIDE', { puzzle: true, requires: ['relay-market', 'relay-spire'], description: 'A silent route: rewrite the Warden before entering its arena.' });
  interact('core', 'terminal', 6770, 2140, 'TAKE THE WEATHER ARCHIVE', { requires: ['relay-market', 'relay-spire'], bossRequired: true, description: 'The rain contains the memories the city erased.' });
  interact('exit', 'exit', 7060, 2140, 'UPLINK / DECIDE THE DAWN', { requires: ['core'] });
  const lore = [
    ['lore-diner', 1450, 1630, 'THE LAST WARM MEAL', 'The diner serves soup to people without identities. The cameras count bowls; the owner counts names.'],
    ['lore-garden', 4880, 1060, 'A SEED IN THE MACHINE', 'A maintenance worker kept one living tree above the exhaust. Its roots reached the memory conduits.'],
    ['lore-warden', 6170, 1600, 'THE WARDEN REMEMBERS', 'The Warden was built from a volunteer. The contract never mentioned that memories survive the conversion.'],
  ];
  for (const [id, x, y, label, text] of lore) interact(id, 'lore', x, y, label, { text });
  // Archive gate seals both street and maintenance paths, while the high roof
  // allows an observant infiltrator to reach the remote override first.
  world.gates.push({ id: 'archive-gate', x: 6040, y: 1760, w: 34, h: 380, requires: ['relay-market', 'relay-spire'] });
  enemy('market-patrol-a', 'guard', 690, 2140, 540, 1110, 1);
  enemy('market-patrol-b', 'guard', 1530, 2140, 1420, 2050);
  enemy('market-lookout', 'sniper', 1480, 1630, 1370, 1650);
  enemy('market-drone', 'drone', 2230, 1750, 1780, 2540);
  enemy('spire-heavy', 'heavy', 3090, 2140, 2950, 3420);
  enemy('spire-patrol', 'guard', 3660, 1960, 3520, 4000, 1);
  enemy('spire-sniper', 'sniper', 4170, 1240, 4160, 4530);
  enemy('spire-drone', 'drone', 4800, 1560, 4470, 5180, 1);
  enemy('crown-guard', 'guard', 5480, 2140, 5360, 5860);
  enemy('crown-lookout', 'sniper', 5760, 1790, 5530, 5980);
  enemy('warden', 'boss', 6390, 2140, 6160, 6700);
  for (const [id, type, x, y] of [
    ['credit-a', 'shard', 740, 1920], ['credit-b', 'shard', 1700, 1600],
    ['credit-c', 'shard', 2240, 1590], ['credit-d', 'shard', 3630, 1390],
    ['credit-e', 'shard', 4900, 1030], ['credit-f', 'shard', 6900, 1760],
    ['med-a', 'health', 2450, 2110], ['med-b', 'health', 5250, 2110],
    ['cell-a', 'energy', 3890, 1930], ['cell-b', 'energy', 5940, 1570],
  ]) world.pickups.push({ id, type, x, y, value: type === 'shard' ? 1 : 35 });

  // Deterministic architecture: broad silhouettes, lit shops, hanging signage,
  // ducts and cable runs. Rendering remains procedural and fully offline.
  for (let x = 100, i = 0; x < 7150; x += 390, i++) {
    const color = x < 2500 ? '#fa4f9e' : x < 5400 ? '#35d8df' : '#f9a75b';
    const roof = 650 + ((i * 173) % 620);
    decoration('building', x, roof, 310, 2140 - roof, '', color);
    decoration('pipe', x + 250, roof + 70, 18, 2140 - roof - 70, '', color);
    decoration('vent', x + 34, 2040, 92, 62, '', color);
    decoration('cable', x, roof - 40, 500, 70, '', color);
  }
  const signs = [
    [500, 1580, 150, 160, 'NOODLE\nSIGNAL', '#ff578c'],
    [1190, 1300, 110, 250, '夢\nRAIN\n夢', '#53eeff'],
    [1790, 1180, 330, 140, 'MIDNIGHT\nMARKET', '#ff4a9c'],
    [2570, 1390, 110, 260, 'UTILITY\n09', '#31e5d3'],
    [3500, 1070, 320, 170, 'MEMORY\nIS A SERVICE', '#63d9ff'],
    [4480, 700, 280, 130, 'KEEP\nGROWING', '#a0eda8'],
    [5520, 1310, 180, 250, 'ARCHIVE\nCROWN', '#ffb258'],
    [6530, 1030, 340, 180, 'THE CITY\nREMEMBERS', '#ff636e'],
  ];
  for (const [x, y, w, h, text, color] of signs) decoration('sign', x, y, w, h, text, color);
  decoration('shop', 40, 1850, 480, 290, 'NULL / SAFEHOUSE', '#45dedc');
  decoration('shop', 900, 1850, 300, 290, 'AFTER HOURS', '#ff9654');
  decoration('shop', 1880, 1990, 240, 150, 'SOUP + STATIC', '#f777ac');
  decoration('shop', 2790, 1850, 450, 290, 'MUNICIPAL SYSTEMS', '#37bcb9');
  decoration('shop', 5560, 1880, 410, 260, 'CROWN SERVICE', '#eb995c');
  for (const x of [660, 780, 900, 1110, 1310, 1670, 1940, 2280]) decoration('lantern', x, 1730 + x % 140, 24, 42, '', '#ff765c');
  // The simulation and renderer both consume the common interactable list.
  // Keep pickups as a convenient data alias for tooling, sharing object state.
  world.interactables.push(...world.pickups);
  return world;
}

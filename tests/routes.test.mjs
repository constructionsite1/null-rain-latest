import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

/** Geometry regression: use real controls and physics from the normal spawn.
 * Freeze patrols and grant invulnerability to isolate route geometry from combat.
 * No player coordinates, velocity, grounded state, platforms or ladders are edited.
 */
function route() {
  const game = new Game('blade');
  game.player.invuln = 100000;
  for (const enemy of game.enemies) { enemy.stun = 100000; enemy.alert = 1; }
  function frames(count, input = {}) {
    for (let i = 0; i < count; i++) {
      game.update(1 / 60, input);
      assert.equal(game.mode, 'playing', 'movement remains playable');
      game.events = [];
    }
  }
  function walk(x) {
    let elapsed = 0;
    while (Math.abs(game.player.x - x) > 5 && elapsed++ < 2200) {
      frames(1, { right: game.player.x < x, left: game.player.x > x });
    }
    assert.ok(elapsed < 2200, `walk to ${x} must not stall at a gate`);
    frames(30);
  }
  function climb(feet) {
    let elapsed = 0;
    while (game.player.y + game.player.h > feet + 1 && elapsed++ < 1200) frames(1, { up: true });
    assert.ok(elapsed < 1200, `ladder reaches ${feet}`);
    frames(25);
    assert.equal(game.player.y + game.player.h, feet, 'exiting ladder lands on its top shelf');
    assert.equal(game.player.grounded, true);
  }
  function doubleJumpTo(x, feet) {
    const input = { right: x > game.player.x, left: x < game.player.x };
    frames(1, { ...input, jumpPressed: true });
    frames(18, input);
    frames(1, { ...input, jumpPressed: true });
    let elapsed = 0;
    while (Math.abs(game.player.x - x) > 6 && elapsed++ < 150) {
      frames(1, { right: game.player.x < x, left: game.player.x > x });
    }
    frames(90);
    assert.equal(game.player.y + game.player.h, feet, `double jump reaches shelf at ${feet}`);
    assert.equal(game.player.grounded, true);
  }
  function interact(id, hack = false) {
    assert.equal(game.interaction()?.id, id, `real interaction radius reaches ${id}`);
    game.interact();
    if (hack) {
      assert.equal(game.mode, 'hacking');
      game.hackSuccess(game.world.interactables.find(object => object.id === id));
    }
  }
  return { game, frames, walk, climb, doubleJumpTo, interact };
}

test('geometry: complete both relays, collect roof weapon, bypass Warden, recover core and exit using controls', () => {
  const { game, frames, walk, climb, doubleJumpTo, interact } = route();
  walk(1020); climb(1790);
  walk(1210); doubleJumpTo(1430, 1630);
  walk(1730); doubleJumpTo(1990, 1450);
  walk(2026); interact('relay-market', true);
  assert.equal(game.flags['relay-market'], true);
  assert.equal(game.world.gates[0].open, false, 'one relay does not open perimeter');

  walk(2440); climb(1620);
  walk(2790);
  assert.equal(game.player.y + game.player.h, 1780, 'eastward descent lands on spire shelf');
  walk(2920); climb(1780);
  walk(3150); doubleJumpTo(3350, 1600);
  walk(3386); interact('relay-spire', true);
  assert.equal(game.world.gates[0].open, true, 'both relays open street perimeter');

  walk(3630); doubleJumpTo(3860, 1420);
  walk(4080); doubleJumpTo(4300, 1240);
  walk(4416); interact('cache-arc');
  assert.ok(game.player.owned.includes('arc'));
  walk(4700); doubleJumpTo(4870, 1060);
  assert.ok(game.world.pickups.find(item => item.id === 'credit-e').done, 'highest roof salvage collects on contact');

  walk(5700); climb(1790);
  walk(6010); climb(1600);
  walk(6540); climb(1430);
  walk(6486); interact('boss-override', true);
  assert.equal(game.flags.bossResolved, true);
  assert.equal(game.flags.wardenSpared, true);
  assert.equal(game.stats.kills, 0, 'remote override completes encounter without a kill');

  walk(6756);
  frames(1, { down: true, jumpPressed: true }); frames(80);
  frames(1, { down: true, jumpPressed: true }); frames(80);
  assert.equal(game.player.y + game.player.h, 2140, 'drop-through controls return to street');
  interact('core', true);
  walk(7046);
  assert.equal(game.interaction()?.id, 'exit');
  game.interact();
  assert.equal(game.mode, 'ending');
});

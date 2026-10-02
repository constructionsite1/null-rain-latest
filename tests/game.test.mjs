import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, BUILDS, SKILLS } from '../src/game.js';

function arena(build = 'blade') {
  const g = new Game(build);
  g.world.platforms = [{ x:0, y:2140, w:7200, h:260, kind:'solid' }];
  g.world.gates = []; g.world.ladders = []; g.world.shadows = [];
  g.world.interactables = []; g.enemies = [];
  Object.assign(g.player, { x:200, y:2086, grounded:true });
  return g;
}
function enemy(g, x = 350, extra = {}) {
  const e = { id:`test-${g.enemies.length}`, type:'guard', x, y:2086, w:28, h:54,
    hp:100, maxHp:100, dir:-1, active:true, dead:false, alert:0, state:'patrol',
    stun:0, cooldown:100, minX:x-500, maxX:x+500, patrolTime:0, viewRange:310,
    search:0, telegraph:0, attackTimer:0, ...extra };
  g.enemies.push(e); return e;
}
function frames(g, count, input = {}) { for(let i=0;i<count;i++) g.update(1/60,input); }
function goTo(g,o) { Object.assign(g.player,{x:o.x-14,y:o.y-54}); }

test('dash preserves a longer protection window and tank pulse grants barrier', () => {
  const g=arena('tank');g.player.invuln=2;g.ability();g.update(1/60,{dashPressed:true});
  assert.ok(g.player.invuln>1.9);assert.ok(g.player.barrier>.9);
});

test('objective navigation points toward Warden or rooftop override after relays', () => {
  const g=new Game();g.flags['relay-market']=g.flags['relay-spire']=true;
  assert.ok(g.targets[0].label.includes('WARDEN'));
  g.player.y=1400;assert.equal(g.targets[0].id,'boss-override');
});

test('all four builds deliver distinct abilities and consume one activation', () => {
  for(const build of Object.keys(BUILDS)) {
    const g=arena(build), threats=[enemy(g,300),enemy(g,350),enemy(g,400),enemy(g,450)];
    g.ability(); assert.equal(g.player.energy,60); assert.equal(g.player.abilityCooldown,SKILLS[build].q.cooldown);
    g.ability(); assert.equal(g.player.energy,60,'cooldown prevents a second activation');
    if(build==='blade') { assert.equal(g.slowTime,2.4); assert.equal(threats[0].hp,100); }
    if(build==='ghost') { assert.deepEqual(threats.map(e=>e.hp),[68,68,68,100]); assert.equal(threats[0].stun,2.1); }
    if(build==='tank') { assert.equal(g.player.barrier,1); assert.equal(threats[0].hp,42); }
    if(build==='gun') { assert.equal(g.player.deadeye,3); g.attack(); assert.equal(g.projectiles[0].damage,36); assert.equal(g.projectiles[0].pierce,true); }
  }
});

test('damage grants temporary protection, armor reduces damage, lethal damage records one death', () => {
  const g=arena('tank'); g.hurt(40); assert.equal(g.player.hp,118);
  g.hurt(40); assert.equal(g.player.hp,118);
  frames(g,50); g.hurt(40); assert.equal(g.player.hp,86);
  g.player.invuln=0; g.hurt(1000); g.hurt(1000);
  assert.equal(g.mode,'dead'); assert.equal(g.player.hp,0); assert.equal(g.stats.deaths,1);
});

test('crouching in shadow evades distant patrols, exposed standing triggers alarm', () => {
  const hidden=arena(); hidden.world.shadows=[{x:180,y:2000,w:100,h:140}];
  const watcher=enemy(hidden,400); frames(hidden,100,{down:true});
  assert.equal(hidden.player.hidden,true); assert.equal(watcher.alert,0);
  const exposed=arena(), guard=enemy(exposed,400); frames(exposed,100);
  assert.equal(guard.alert,1); assert.equal(exposed.stats.alarms,1);
});

test('solid cover prevents patrol from beginning a firing windup', () => {
  const g=arena(); const guard=enemy(g,400,{alert:1,cooldown:0});
  g.world.platforms.push({x:300,y:2000,w:20,h:140,kind:'solid'});
  frames(g,10); assert.equal(g.projectiles.length,0); assert.equal(guard.telegraph,0);
});

test('fast projectiles hit crossed enemies without tunneling', () => {
  const g=arena('gun'), target=enemy(g,300);
  g.projectiles.push({x:250,y:2110,vx:5000,vy:0,life:1,damage:26,enemy:false,hits:[],kind:'pulse'});
  g.update(.033); assert.equal(target.hp,74); assert.equal(g.projectiles.length,0);
});

test('a wall absorbs a projectile before it can damage a target behind it', () => {
  const g=arena(), target=enemy(g,340);
  g.world.platforms.push({x:300,y:2000,w:15,h:140,kind:'solid'});
  g.projectiles.push({x:250,y:2110,vx:5000,vy:0,life:1,damage:26,enemy:false,hits:[],kind:'pulse'});
  g.update(.033); assert.equal(target.hp,100); assert.equal(g.projectiles.length,0);
});

test('both relay hacks are required to open archive gate and activate the Warden', () => {
  const g=new Game(); const relay=id=>g.world.interactables.find(o=>o.id===id);
  const gate=g.world.gates[0], boss=g.enemies.find(e=>e.type==='boss');
  g.hackSuccess(relay('relay-market')); assert.equal(gate.open,false);
  g.player.x=6100; g.update(.016); assert.equal(boss.active,false);
  g.hackSuccess(relay('relay-spire')); assert.equal(gate.open,true);
  g.update(.016); assert.equal(boss.active,true);
});

test('override enables core recovery and extraction; the core is locked beforehand', () => {
  const g=new Game(); const object=id=>g.world.interactables.find(o=>o.id===id);
  g.enemies.filter(e=>e.type!=='boss').forEach(e=>e.dead=true);
  g.hackSuccess(object('relay-market')); g.hackSuccess(object('relay-spire'));
  goTo(g,object('core')); g.interact(); assert.equal(g.mode,'playing'); assert.equal(g.flags.core,undefined);
  goTo(g,object('boss-override')); g.interact(); assert.equal(g.mode,'hacking');
  g.hackSuccess(object('boss-override')); assert.equal(g.flags.wardenSpared,true);
  assert.equal(g.enemies.find(e=>e.type==='boss').dead,true);
  goTo(g,object('core')); g.interact(); assert.equal(g.mode,'hacking'); g.hackSuccess(object('core'));
  goTo(g,object('exit')); g.interact(); assert.equal(g.mode,'ending');
});

test('defeating the Warden also unlocks the core, preserving the violent outcome', () => {
  const g=new Game(), boss=g.enemies.find(e=>e.type==='boss');
  boss.active=true; g.damageEnemy(boss,10000);
  assert.equal(g.flags.bossResolved,true); assert.equal(g.flags.wardenSpared,false);
  assert.equal(g.stats.kills,1);
});

test('street salvage, health and energy pickups collect on contact', () => {
  const g=new Game(); g.enemies=[];
  for(const type of ['shard','health','energy']) {
    const pickup=g.world.pickups.find(o=>o.type===type);
    g.player.hp=40; g.player.energy=30; const credits=g.player.credits;
    Object.assign(g.player,{x:pickup.x-14,y:pickup.y-40,vx:0,vy:0});
    g.update(.001); assert.equal(pickup.done,true,`${type} should collect`);
    if(type==='shard') assert.ok(g.player.credits>credits);
    if(type==='health') assert.ok(g.player.hp>40);
    if(type==='energy') assert.ok(g.player.energy>60);
  }
});

test('checkpoint retry restores progress and build, discards later damage, preserves death count', () => {
  const g=new Game('ghost'); const relay=g.world.interactables.find(o=>o.id==='relay-market');
  g.hackSuccess(relay); g.player.credits=8; g.player.upgrades=['edge'];
  const cp=g.world.interactables.find(o=>o.id==='checkpoint-spire'); goTo(g,cp); g.saveCheckpoint(cp);
  const snapshot=JSON.parse(JSON.stringify(g.serialize()));
  g.player.invuln=0; g.hurt(1000); const retry=g.retry();
  assert.equal(retry.mode,'playing'); assert.equal(retry.player.build,'ghost');
  assert.equal(retry.player.hp,retry.player.maxHp); assert.equal(retry.player.energy,100);
  assert.equal(retry.flags['relay-market'],true); assert.equal(retry.player.credits,8);
  assert.equal(retry.checkpoint,cp.id); assert.equal(retry.stats.deaths,1);
  const restored=new Game(); assert.equal(restored.restore(snapshot),true);
  assert.equal(restored.player.build,'ghost'); assert.equal(restored.player.vx,0);
  restored.player.credits=0; assert.equal(snapshot.player.credits,8,'restoration cannot mutate the saved snapshot');
});


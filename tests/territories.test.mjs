import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {BASES,territoryAt,attacksPlayer} from '../src/territories.js';
import {selectTarget} from '../src/factions.js';

test('public street sentries tolerate visitors; restricted garrisons select trespassers',()=>{
  const g=new Game('gun',331),watch=g.enemies.find(e=>e.id==='market-patrol-a'),heavy=g.enemies.find(e=>e.id==='spire-heavy');
  g.enemies=[watch,heavy];Object.assign(g.player,{x:800,y:2086});assert.equal(territoryAt(g.world,g.player).rule,'public');assert.equal(selectTarget(g,watch),null);
  for(let i=0;i<180;i++)g.update(1/60);assert.equal(g.player.hp,100);assert.equal(g.security.heat,0);assert.ok(!g.projectiles.some(b=>b.enemy));
  Object.assign(g.player,{x:3000,y:2086});assert.equal(territoryAt(g.world,g.player).id,'watch-house');assert.equal(selectTarget(g,heavy),g.player);
  Object.assign(g.player,{x:2500,y:2086});assert.equal(attacksPlayer(g,heavy),false);
});
test('Wire Saints tolerate visitors while Cinder furnace guards defend their yard',()=>{
  const g=new Game('blade',331),wire=g.enemies.find(e=>e.faction==='wire'),cinder=g.enemies.find(e=>e.faction==='cinder');
  g.enemies=[wire,cinder];Object.assign(g.player,{x:7700,y:2086});assert.equal(territoryAt(g.world,g.player).rule,'neutral');assert.equal(attacksPlayer(g,wire),false);
  Object.assign(g.player,{x:10500,y:2086});assert.equal(territoryAt(g.world,g.player).id,'cinder-yard');assert.equal(attacksPlayer(g,cinder),true);assert.equal(g.enemies.find(e=>e.faction==='cinder').access,'restricted');
  Object.assign(g.player,{x:9800,y:2086});assert.equal(attacksPlayer(g,cinder),false);
});
test('provoking a public sentry persists aggression across save/load; wanted guards also engage',()=>{
  const g=new Game('blade',3),watch=g.enemies.find(e=>e.id==='market-patrol-a');Object.assign(g.player,{x:800,y:2086});assert.equal(attacksPlayer(g,watch),false);
  g.damageEnemy(watch,1);assert.equal(attacksPlayer(g,watch),true);const restored=new Game('blade',4);restored.restore(g.serialize());assert.equal(attacksPlayer(restored,restored.enemies.find(e=>e.id===watch.id)),true);
  const other=g.enemies.find(e=>e.id==='market-patrol-b');assert.equal(attacksPlayer(g,other),false);g.security.level=1;assert.equal(attacksPlayer(g,other),true);
});
test('watch-house interior is restricted; diner and gang club are neutral',()=>{
  const g=new Game('gun',3);g.enterRoom('barracks');assert.equal(territoryAt(g.world,g.player).rule,'restricted');assert.ok(g.enemies.every(e=>attacksPlayer(g,e)));g.leaveRoom();
  g.enterRoom('hangout');assert.equal(territoryAt(g.world,g.player).rule,'neutral');assert.ok(g.enemies.every(e=>!attacksPlayer(g,e)));
  assert.ok(BASES.filter(b=>b.rule==='restricted').length>=5);assert.ok(BASES.filter(b=>b.rule==='neutral').length>=2);
});
test('restricted garrison actually attacks an unprovoking trespasser through the simulation',()=>{
  const g=new Game('gun',3),heavy=g.enemies.find(e=>e.id==='spire-heavy');g.enemies=[heavy];g.civilians=[];g.world.platforms=[{x:0,y:2140,w:12800,h:260,kind:'solid'}];g.world.gates=[];g.world.ladders=[];
  Object.assign(g.player,{x:2850,y:2086,hp:100,invuln:0,grounded:true});
  for(let i=0;i<240;i++)g.update(1/60);
  assert.ok(g.player.hp<100);assert.equal(heavy.hostileToPlayer,undefined,'trespassing alone does not set permanent provocation');
});
test('nine city checkpoints occupy clear public/neutral streets and retry restores the chosen location',()=>{
  const initial=new Game('gun',3),points=initial.world.interactables.filter(o=>o.type==='checkpoint');assert.equal(points.length,9);
  for(const point of points){const g=new Game('gun',3);g.enemies=[];g.civilians=[];Object.assign(g.player,{x:point.x-14,y:point.y-54,hp:20,stamina:0});g.player.ammo.pistol=0;
    assert.notEqual(territoryAt(g.world,g.player).rule,'restricted',point.label);
    assert.ok(!g.solids.some(s=>g.player.x<s.x+s.w&&g.player.x+28>s.x&&g.player.y<s.y+s.h&&g.player.y+54>s.y),point.label+' has a clear standing position');
    assert.equal(g.interaction()?.id,point.id);g.interact();assert.equal(g.checkpoint,point.id);assert.equal(g.player.hp,100);assert.equal(g.player.stamina,100);assert.equal(g.player.ammo.pistol,12);
    g.player.invuln=0;g.hurt(1000);const retry=g.retry();assert.equal(retry.player.x,point.x-14);assert.equal(retry.checkpoint,point.id);
  }
});

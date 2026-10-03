import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {createGangs,selectTarget} from '../src/factions.js';
import {updateCivilians} from '../src/civilians.js';

const guard=(id,x,faction='helix')=>({id,x,y:2086,w:28,h:54,type:'guard',faction,active:true,dead:false,hp:85,maxHp:85,
  dir:1,minX:0,maxX:12800,alert:0,stun:0,cooldown:0,patrolTime:0,telegraph:0,search:0});
function quietGame(){const g=new Game('blade',123);g.enemies=[];g.player.x=1500;g.player.y=2086;g.world.gates=[];return g;}

test('city seed reproduces gang positions, residents, and two or three distinct groups',()=>{
  const a=new Game('blade',331),b=new Game('blade',331);
  assert.deepEqual(a.civilians,b.civilians);assert.deepEqual(createGangs(331),createGangs(331));
  const groups=new Set(a.enemies.filter(e=>e.faction).map(e=>e.group));assert.ok(groups.size>=2&&groups.size<=3);
  assert.ok(a.civilians.length>40);assert.ok(a.civilians.every(c=>c.x>=c.minX&&c.x<=c.maxX));
  for(let seed=0;seed<20;seed++)for(const gang of createGangs(seed,a.world)) {
    assert.ok(gang.x>=gang.minX&&gang.x<=gang.maxX);
    assert.ok(!a.world.platforms.some(p=>p.kind==='solid'&&gang.x<p.x+p.w&&gang.x+gang.w>p.x&&gang.y<p.y+p.h&&gang.y+gang.h>p.y),'gang spawns on a clear street');
  }
});
test('neutral gangs ignore the player and select security or rival factions',()=>{
  const g=quietGame(),wire=guard('wire',100,'wire'),ally=guard('ally',140,'wire'),helix=guard('helix',210),cinder=guard('cinder',175,'cinder');
  g.enemies=[wire,ally];g.player.x=110;assert.equal(selectTarget(g,wire),null);
  g.enemies.push(helix);assert.equal(selectTarget(g,wire),helix);
  g.enemies.push(cinder);assert.equal(selectTarget(g,wire),cinder);
  g.world.platforms.push({x:160,y:1990,w:10,h:150,kind:'solid'});assert.equal(selectTarget(g,wire),null);
});
test('attacking a gang makes its group hostile and hostility persists across saves',()=>{
  const g=new Game('blade',3),gang=g.enemies.find(e=>e.faction);g.damageEnemy(gang,1);
  assert.ok(g.enemies.filter(e=>e.group===gang.group&&e.faction===gang.faction).every(e=>e.hostileToPlayer));
  assert.ok(g.enemies.filter(e=>e.faction&&e.group!==gang.group).every(e=>!e.hostileToPlayer));
  const saved=g.serialize(),restored=new Game('blade',900);restored.restore(saved);
  assert.equal(restored.citySeed,3);assert.deepEqual(restored.enemies.filter(e=>e.faction),saved.gangs);
});
test('NPC skirmishes do not grant kills, XP, salvage, energy, or security heat',()=>{
  const g=quietGame(),helix=guard('helix',100),gang=guard('wire',240,'wire');g.enemies=[helix,gang];g.player.energy=40;
  for(let n=0;n<180;n++)g.update(1/60,{});
  assert.ok(g.enemies.some(e=>e.hp<85));assert.equal(g.player.xp,0);assert.equal(g.stats.kills,0);assert.equal(g.player.credits,0);assert.equal(g.security.heat,0);assert.equal(g.stats.alarms,0);
  const energy=g.player.energy;g.damageEnemy(gang,999,0,{x:100,y:2113},false);assert.equal(g.player.energy,energy);assert.equal(g.player.xp,0);
});
test('faction shots hit opponents, leave allies intact and spare an unprovoking player',()=>{
  const g=quietGame(),wire=guard('wire',100,'wire'),ally=guard('ally',150,'wire'),helix=guard('helix',300);g.enemies=[wire,ally,helix];
  g.player.x=200;g.enemyShot(wire,{x:330,y:2113},0,90,1000);
  for(let n=0;n<20;n++)g.update(1/60,{});
  assert.equal(g.player.hp,100);assert.equal(ally.hp,85);assert.equal(helix.dead,true);assert.equal(g.player.xp,0);
});
test('residents flee nearby noise, settle afterward and stay outside combat rewards',()=>{
  const g=quietGame(),c=g.civilians[0];g.civilians=[c];const before=c.x;
  g.noise(c.x-40,c.y,150);assert.ok(c.panic>0);updateCivilians(g,.1);assert.ok(c.x>=before);
  for(let n=0;n<600;n++)updateCivilians(g,1/60);
  assert.equal(c.panic,0);assert.ok(c.x>=c.minX&&c.x<=c.maxX);assert.equal(g.player.xp,0);assert.equal(g.stats.kills,0);
});
test('returning to a discovered district still emits a zone event for audio',()=>{
  const g=quietGame();g.update(1/60);g.events=[];g.player.x=7500;g.update(1/60);g.events=[];
  g.player.x=1000;g.update(1/60);const event=g.events.find(e=>e.type==='zone');
  assert.equal(event.name,'RAIN MARKET');assert.equal(event.firstVisit,false);assert.equal(g.discovered.filter(x=>x==='RAIN MARKET').length,1);
});
test('talking to a civilian is non-blocking and preserves objective state',()=>{
  const g=quietGame(),c=g.civilians[0];g.civilians=[c];g.world.interactables=[];g.player.x=c.x;g.player.y=c.y;
  const objective=g.objective;g.interact();assert.equal(c.speech,c.line);assert.ok(c.speechTime>0);assert.equal(g.mode,'playing');assert.equal(g.objective,objective);
});
test('street battles wait for the player to approach their block',()=>{
  const g=new Game('blade',88),gangs=g.enemies.filter(e=>e.faction),positions=gangs.map(e=>e.x);
  for(let n=0;n<120;n++)g.update(1/60,{});
  assert.deepEqual(gangs.map(e=>e.x),positions);assert.ok(gangs.every(e=>e.hp===e.maxHp));
});
test('poles support gripping, fast sliding and a directional jump without immediate regrab',()=>{
  const g=quietGame();g.world.ladders=[{x:1500,y:1750,w:36,h:390}];g.player.x=1503;g.player.y=1850;
  g.update(1/60,{up:true});assert.equal(g.player.climbing,true);assert.equal(g.player.vy,-220);
  g.update(1/60,{});assert.equal(g.player.climbing,true);assert.equal(g.player.vy,0);
  g.update(1/60,{down:true});assert.equal(g.player.vy,340);
  const before=g.player.x;g.update(1/60,{jumpPressed:true,right:true});assert.equal(g.player.climbing,false);assert.equal(g.player.vx,420);assert.ok(g.player.x>before);
  g.update(1/60,{up:true});assert.equal(g.player.climbing,false);assert.ok(g.player.vy<0);
});

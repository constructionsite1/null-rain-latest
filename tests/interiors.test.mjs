import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {ROOMS} from '../src/interiors.js';
import {AimState} from '../src/aim.js';

test('Gunslinger keeps the same pistol on left click with or without precision aim',()=>{
  const a=new AimState();a.left=true;
  assert.deepEqual(a.buttons('gun'),{attack:true,secondary:false,aiming:false});
  a.right=true;assert.deepEqual(a.buttons('gun'),{attack:true,secondary:false,aiming:true});
  a.left=false;assert.deepEqual(a.buttons('gun'),{attack:false,secondary:false,aiming:true});
  const g=new Game('gun',10);g.enemies=[];const aim={x:900,y:1900};
  g.update(1/60,{...a.buttons('gun'),aim});assert.equal(g.projectiles.length,0);
  a.left=true;g.update(1/60,{...a.buttons('gun'),aim});assert.equal(g.projectiles[0].kind,'pistol');
  assert.ok(g.projectiles[0].vy<0);const before=g.player.x;
  for(let i=0;i<20;i++)g.update(1/60,{...a.buttons('gun'),right:true,aim});
  assert.ok(g.player.x>before);assert.ok(g.projectiles.every(b=>b.kind==='pistol'));
  g.player.attackTimer=0;g.projectiles=[];g.update(1/60,{secondary:true,aim});assert.equal(g.projectiles[0].kind,'pulse');
});
test('every building entrance leads to a furnished, playable room and returns to the same street point',()=>{
  for(const room of ROOMS){const g=new Game('gun',4),city=g.world,enemyIds=g.enemies.map(e=>e.id);
    const entrance=city.interactables.find(o=>o.roomId===room.id);Object.assign(g.player,{x:entrance.x-14,y:entrance.y-54});
    const position={x:g.player.x,y:g.player.y};assert.equal(g.interaction(),entrance);g.interact();
    assert.equal(g.world.interior,true);assert.equal(g.world.room.id,room.id);assert.ok(g.world.platforms.length>=6);assert.ok(g.world.interactables.some(o=>o.type==='cache'));
    assert.equal(g.interaction().label,'Return to the street');g.interact();assert.equal(g.world,city);assert.equal(g.player.x,position.x);assert.equal(g.player.y,position.y);assert.deepEqual(g.enemies.map(e=>e.id),enemyIds);
  }
});
test('interior progress and street progress survive save/load without replenishing a looted room',()=>{
  const g=new Game('gun',77);g.flags['relay-market']=true;g.world.interactables.find(o=>o.id==='credit-a').done=true;
  g.enemies[0].dead=true;g.enemies[0].hp=0;const outsideHP=g.enemies[1].hp;
  g.enterRoom('barracks',{x:2856,y:2086});const cache=g.world.interactables.find(o=>o.type==='cache');
  Object.assign(g.player,{x:cache.x-14,y:cache.y-54});g.enemies.forEach(e=>{e.stun=1000;e.alert=1;});g.interact();assert.equal(cache.done,true);assert.ok(g.player.owned.includes('scatter'));
  g.damageEnemy(g.enemies[0],999);const saved=g.serialize(),restored=new Game('gun',7);assert.equal(restored.restore(saved),true);
  assert.equal(restored.world.room.id,'barracks');assert.equal(restored.player.x,saved.player.x);assert.equal(restored.world.interactables.find(o=>o.type==='cache').done,true);assert.equal(restored.enemies[0].dead,true);
  restored.leaveRoom();assert.equal(restored.flags['relay-market'],true);assert.equal(restored.enemies[0].dead,true);assert.equal(restored.enemies[1].hp,outsideHP);assert.equal(restored.world.interactables.find(o=>o.id==='credit-a').done,true);
  const credits=restored.player.credits;restored.enterRoom('barracks');assert.equal(restored.world.interactables.find(o=>o.type==='cache').done,true);assert.equal(restored.player.credits,credits);
});
test('room guards retain neutral faction behavior and doors outrank a nearby takedown',()=>{
  const g=new Game('blade',2);g.enterRoom('hangout');assert.ok(g.enemies.every(e=>e.faction==='wire'&&!e.hostileToPlayer));
  Object.assign(g.enemies[0],{x:130,y:g.player.y,dir:1});assert.equal(g.interaction().type,'door');
  g.damageEnemy(g.enemies[0],1);assert.ok(g.enemies.every(e=>e.hostileToPlayer));
});
test('upper-room supply locker can be reached through movement controls',()=>{
  const g=new Game('gun',1);g.enterRoom('diner');g.player.invuln=1000;
  let i=0;for(;i<800&&g.player.x<1280;i++)g.update(1/60,{right:true,jumpPressed:i%36===0});
  assert.ok(i<800,'stairs and cover do not trap the player');
  for(let n=0;n<180;n++)g.update(1/60,{up:true,left:g.player.x>1307,right:g.player.x<1295});
  for(let n=0;n<80;n++)g.update(1/60,{left:g.player.x>1180});
  for(let n=0;n<70;n++)g.update(1/60,{});
  assert.equal(g.player.y+g.player.h,620);assert.equal(g.interaction()?.type,'cache');g.interact();assert.ok(g.player.owned.includes('arc'));
});

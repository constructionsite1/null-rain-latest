import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WEAPONS,bodyHit} from '../src/game.js';

function arena(build='gun'){
  const g=new Game(build,3);g.enemies=[];g.civilians=[];g.world.ladders=[];g.world.gates=[];g.world.pickups=[];g.world.interactables=[];
  g.world.platforms=[{x:0,y:2140,w:12800,h:260,kind:'solid'}];Object.assign(g.player,{x:200,y:2086,grounded:true,dir:1});return g;
}
function frames(g,seconds,input={}){for(let i=0;i<Math.ceil(seconds*60);i++)g.update(1/60,input);}
function guard(g,x=450){const e={id:'shooter',type:'guard',x,y:2086,w:28,h:54,hp:200,maxHp:200,dir:-1,minX:x,maxX:x,active:true,dead:false,alert:0,stun:1000,cooldown:100,attackTimer:0,patrolTime:0,viewRange:300,search:0};g.enemies.push(e);return e;}

test('magazines exhaust, automatically reload on trigger, and block fire until completion',()=>{
  const g=arena();for(let i=0;i<12;i++){g.player.attackTimer=0;g.attack();}
  assert.equal(g.player.ammo.pistol,0);assert.equal(g.projectiles.length,12);
  g.player.attackTimer=0;g.attack();assert.equal(g.projectiles.length,12);assert.equal(g.player.reloadTimer,1.25);
  g.attack(true);assert.equal(g.player.ammo.pulse,16,'cannot bypass reload with the sidearm');
  frames(g,.7);assert.equal(g.player.ammo.pistol,0);g.mode='paused';const timer=g.player.reloadTimer;frames(g,2);assert.equal(g.player.reloadTimer,timer);
  g.mode='playing';frames(g,.6);assert.equal(g.player.ammo.pistol,12);g.attack();assert.equal(g.player.ammo.pistol,11);
});
test('manual reload keeps separate magazines; scatter pellets consume one shell; switch cancels reload',()=>{
  const g=arena();g.attack();g.player.attackTimer=0;g.attack(true);assert.equal(g.player.ammo.pistol,11);assert.equal(g.player.ammo.pulse,15);
  assert.equal(g.reload(),true);assert.equal(g.player.reloadWeapon,'pulse');g.player.owned.push('scatter');g.cycleSidearm();assert.equal(g.player.reloadTimer,0);assert.equal(g.player.ammo.pulse,15);
  g.player.attackTimer=0;g.projectiles=[];g.attack(true);assert.equal(g.projectiles.length,5);assert.equal(g.player.ammo.scatter,3);
  g.reload();frames(g,1.9);assert.equal(g.player.ammo.scatter,4);assert.equal(g.reload(),false);
});
test('dash spends stamina independently, exhausts after two dashes, and recharges after recovery',()=>{
  const g=arena();g.player.energy=0;g.physics(g.player,1/60,{dashPressed:true});assert.equal(g.player.stamina,65);assert.equal(g.player.energy,0);
  frames(g,.72);g.physics(g.player,1/60,{dashPressed:true});assert.equal(g.player.stamina,30);frames(g,.72);
  const position=g.player.x;g.physics(g.player,1/60,{dashPressed:true});assert.equal(g.player.dashTimer,0);assert.ok(g.events.some(e=>e.type==='toast'&&e.text.includes('EXHAUSTED')));
  assert.equal(g.player.stamina,30);frames(g,4);assert.equal(g.player.stamina,100);assert.ok(g.player.x>=position);
});
test('saves preserve magazines, reload progress and stamina; legacy saves and checkpoints refill safely',()=>{
  const g=arena();g.attack();g.reload();g.player.stamina=19;const saved=g.serialize(),loaded=arena();loaded.restore(saved);
  assert.equal(loaded.player.ammo.pistol,11);assert.equal(loaded.player.reloadTimer,1.25);assert.equal(loaded.player.stamina,19);
  frames(loaded,1.3);assert.equal(loaded.player.ammo.pistol,12);
  for(const key of ['ammo','stamina','maxStamina','staminaDelay','reloadTimer','reloadWeapon','lastFired'])delete saved.player[key];
  loaded.restore(saved);assert.equal(loaded.player.stamina,100);assert.equal(loaded.player.ammo.arc,8);
  loaded.player.ammo.pistol=0;loaded.player.stamina=0;loaded.saveCheckpoint({id:'test',active:false});assert.equal(loaded.player.stamina,100);assert.equal(loaded.player.ammo.pistol,12);
});
test('projectiles deal head, torso and leg damage using their swept contact point',()=>{
  for(const [offset,expected] of [[5,40],[26,20],[46,13]]){const g=arena(),e=guard(g);g.projectiles.push({x:400,y:e.y+offset,vx:5000,vy:0,life:1,damage:20,enemy:false,hits:[],kind:'pulse'});g.update(.033);assert.equal(e.hp,200-expected);}
  const actor={x:200,y:100,w:28,h:54};assert.equal(bodyHit({x:180,y:90},{x:240,y:120},actor).region,'head');
  assert.equal(bodyHit({x:180,y:105},{x:240,y:105},{...actor,type:'drone'}).multiplier,1);
  for(const [offset,expected] of [[5,40],[26,20],[46,13]]){const g=arena();g.projectiles.push({x:190,y:g.player.y+offset,vx:1000,vy:0,life:1,damage:20,enemy:true});g.update(1/60);assert.equal(g.player.hp,100-expected);}
});
test('timed parry can return a round to its shooter while late parries only deflect',()=>{
  for(const [roll,returns] of [[.1,true],[.99,false]]){const g=arena('blade'),e=guard(g);g.useSkill('v');const b={x:245,y:2113,vx:-900,vy:0,damage:20,enemy:true,ownerId:e.id,life:2};
    const original=Math.random;try{Math.random=()=>roll;g.deflectProjectile(b);}finally{Math.random=original;}
    assert.equal(b.enemy,false);assert.equal(b.damage,30);assert.equal(Math.abs(b.vy)<.01,returns);
    g.projectiles=[b];frames(g,.6);assert.equal(e.hp<200,returns);
  }
  const g=arena('blade');guard(g);g.player.parry=.2;const b={x:245,y:2113,vx:-900,vy:0,damage:20,enemy:true,ownerId:'shooter',life:2};g.deflectProjectile(b);assert.ok(Math.abs(b.vy)>100);assert.equal(b.damage,16);
});
test('Chronoblade swing deflects front bullets but leaves the back exposed',()=>{
  const front=arena('blade');front.attack(false,{x:800,y:2113});front.projectiles=[{x:265,y:2113,vx:-1500,vy:0,damage:20,enemy:true,life:2}];front.update(1/60);assert.equal(front.player.hp,100);assert.equal(front.projectiles[0].enemy,false);
  const back=arena('blade');back.attack(false,{x:800,y:2113});back.projectiles=[{x:190,y:2113,vx:1000,vy:0,damage:20,enemy:true,life:2}];back.update(1/60);assert.equal(back.player.hp,80);
});

test('active parry leaves rear bullets exposed in both facing directions',()=>{
  for(const dir of [-1,1]){
    const g=arena('blade');g.player.dir=dir;g.useSkill('v',{x:214+dir*500,y:2113});
    g.projectiles=[{x:dir>0?190:238,y:2113,vx:dir*1000,vy:0,damage:20,enemy:true,life:2}];
    g.update(1/60);assert.equal(g.player.hp,80);
  }
});

test('cursor facing controls Chronoblade guard direction while walking the other way',()=>{
  const g=arena('blade');g.player.grounded=true;
  g.update(1/60,{right:true,faceCursor:true,aim:{x:100,y:1900},guardPressed:true});
  assert.equal(g.player.dir,-1);assert.ok(g.player.vx>0);assert.ok(g.player.parry>0);
});

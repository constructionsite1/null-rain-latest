import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, SKILLS, xpForLevel } from '../src/game.js';

function arena(build='blade') {
  const g=new Game(build);g.enemies=[];g.world.gates=[];g.world.ladders=[];g.world.interactables=[];
  g.world.platforms=[{x:0,y:2140,w:7200,h:260,kind:'solid'}];
  Object.assign(g.player,{x:200,y:2086,grounded:true});return g;
}
function threat(g,x=280,extra={}) {
  const e={id:`t${g.enemies.length}`,type:'guard',x,y:2086,w:28,h:54,hp:200,maxHp:200,dir:-1,active:true,dead:false,alert:1,state:'alert',stun:0,cooldown:100,minX:0,maxX:7100,patrolTime:0,viewRange:350,search:0,telegraph:0,attackTimer:0,...extra};g.enemies.push(e);return e;
}
const frames=(g,n,input={})=>{for(let i=0;i<n;i++)g.update(1/60,input);};

test('mouse aim is exact, RMB alone never fires, keyboard fire remains straight',()=>{
  const g=arena('gun');threat(g,400,{y:1900});
  g.update(1/60,{aiming:true,aim:{x:214,y:1600}});assert.equal(g.projectiles.length,0);
  g.attack(false,{x:214,y:1600});assert.ok(Math.abs(g.projectiles[0].vx)<.001);assert.ok(g.projectiles[0].vy<0);
  g.projectiles=[];g.player.attackTimer=0;g.player.dir=1;g.attack();assert.equal(g.projectiles[0].vy,0);
});

test('each build exposes three separately gated skills; flow changes cost and cooldown',()=>{
  for(const build of Object.keys(SKILLS)){
    const g=arena(build);assert.deepEqual(Object.keys(SKILLS[build]),['q','c','v']);
    assert.equal(g.useSkill('v'),true);const energy=g.player.energy;assert.equal(g.useSkill('v'),false);assert.equal(g.player.energy,energy);
    assert.equal(g.useSkill('c',{x:500,y:2113}),true);assert.ok(g.player.skillCooldown>0);assert.equal(g.player.abilityCooldown,0);
  }
  const g=arena();g.player.talents.flow=2;g.useSkill('q');assert.equal(g.player.energy,68);assert.equal(g.player.abilityCooldown,7.6);
});

test('blink respects solid walls and remote EMP affects at most three targets',()=>{
  const blade=arena();blade.world.platforms.push({x:350,y:1800,w:30,h:340,kind:'solid'});
  blade.useSkill('c',{x:700,y:2113});assert.ok(blade.player.x+28<=350);assert.ok(blade.player.x>200);
  const ghost=arena('ghost');const enemies=[260,280,300,320].map(x=>threat(ghost,x));
  ghost.useSkill('c',{x:300,y:2113});assert.equal(enemies.filter(e=>e.hp<200).length,3);
});

test('three-hit melee combo finishes harder and a downward air hit bounces',()=>{
  const g=arena();const e=threat(g,265,{stun:100});const damages=[];
  for(let i=0;i<3;i++){const before=e.hp;g.player.attackTimer=0;g.attack(false,{x:400,y:2113});damages.push(before-e.hp);}
  assert.equal(g.player.combo,3);assert.ok(damages[2]>damages[0]);
  const pogo=arena();pogo.player.y=2000;pogo.player.grounded=false;const below=threat(pogo,200);
  pogo.attack(false,{x:214,y:2250});assert.ok(below.hp<200);assert.equal(pogo.player.vy,-590);assert.equal(pogo.player.jumps,1);
});

test('parry reflects a projectile and restores energy; cloak breaks on attacks',()=>{
  const g=arena();g.useSkill('v');const energy=g.player.energy;
  g.projectiles.push({x:245,y:2113,vx:-600,vy:0,r:4,enemy:true,damage:20,life:2});
  g.update(1/60);assert.equal(g.player.hp,100);assert.equal(g.projectiles[0].enemy,false);assert.ok(g.projectiles[0].vx>0);assert.ok(g.player.energy>energy+11);
  const ghost=arena('ghost');ghost.useSkill('v');ghost.update(1/60);assert.equal(ghost.player.hidden,true);ghost.attack();assert.equal(ghost.player.cloak,0);
});

test('heavy frontal shield rewards flanking; boss armor and stun resistance preserve recovery windows',()=>{
  const g=arena();const heavy=threat(g,350,{type:'heavy'});g.damageEnemy(heavy,50,0,{x:200,y:2113});assert.equal(heavy.hp,181);
  g.damageEnemy(heavy,50,0,{x:500,y:2113});assert.equal(heavy.hp,131);
  const boss=threat(g,500,{type:'boss',hp:1350,maxHp:1350,telegraph:1});g.damageEnemy(boss,100,4);assert.equal(boss.hp,1285);assert.ok(boss.stun<=.12);
  boss.stun=0;g.damageEnemy(boss,100,4);assert.equal(boss.stun,0);boss.telegraph=0;g.damageEnemy(boss,100);assert.equal(boss.hp,1135);
});

test('guard bursts, sniper locked beam and Warden patterns are telegraphed before damage',()=>{
  const g=arena();g.player.invuln=100;const guard=threat(g,550,{cooldown:0});
  g.update(1/60);assert.ok(guard.telegraph>0);assert.equal(g.projectiles.length,0);frames(g,42);assert.ok(g.projectiles.length>=3);
  const sniperGame=arena();const sniper=threat(sniperGame,550,{type:'sniper',cooldown:0});sniperGame.update(1/60);assert.ok(sniper.telegraph>.8);assert.equal(sniperGame.player.hp,100);
  frames(sniperGame,65);assert.ok(sniperGame.player.hp<100);
  const bossGame=arena();bossGame.player.invuln=100;const boss=threat(bossGame,500,{type:'boss',hp:1350,maxHp:1350,cooldown:0,phase:0});
  bossGame.update(1/60);assert.ok(boss.telegraph>0);const phases=new Set();for(let i=0;i<750;i++){bossGame.update(1/60);phases.add(boss.phase);}assert.equal(phases.size,3);
});

test('XP rewards are one-time, talent ranks cap at two, old saves receive safe independent defaults',()=>{
  const g=arena();const hack={id:'security-test',x:0,y:0,label:'jam'};g.hackSuccess(hack);const xp=g.player.xp;g.hackSuccess(hack);assert.equal(g.player.xp,xp);
  g.gainXP(xpForLevel(5));assert.equal(g.player.level,5);assert.equal(g.player.skillPoints,4);assert.equal(g.events.filter(e=>e.type==='levelup').length,4);
  assert.equal(g.spendTalent('guard'),true);assert.equal(g.player.maxHp,120);assert.equal(g.spendTalent('guard'),true);assert.equal(g.spendTalent('guard'),false);assert.equal(g.spendTalent('invalid'),false);
  const save=g.serialize();delete save.player.talents;delete save.player.skillCooldown;const restored=new Game();assert.equal(restored.restore(save),true);assert.deepEqual(restored.player.talents,{force:0,flow:0,guard:0});assert.equal(restored.player.skillCooldown,0);
  restored.player.owned.push('scatter');assert.ok(!save.player.owned.includes('scatter'));
});

test('jump input shortly before landing is buffered into an immediate jump',()=>{
  const g=arena();Object.assign(g.player,{y:2060,vy:300,grounded:false,jumps:2,coyote:0});
  g.update(1/60,{jumpPressed:true});frames(g,8);assert.ok(g.player.vy<0);assert.ok(g.player.y<2086);
});

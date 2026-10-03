import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

test('safehouses deny free healing during an active district alarm and recover after jamming', () => {
  const g=new Game();g.player.x=216;g.player.y=2086;g.player.hp=40;g.raiseAlarm(.4);
  g.interact();assert.equal(g.player.hp,40,'an alarm blocks checkpoint healing');
  g.hackSuccess(g.world.interactables.find(o=>o.id==='security-market'));
  g.interact();assert.equal(g.player.hp,g.player.maxHp,'a jam restores safehouse access without nearby pursuit');
});

function fixture(build='blade') {
  const g=new Game(build);g.enemies=[];g.world.ladders=[];
  g.world.platforms=[{x:0,y:2140,w:7200,h:260,kind:'solid'}];
  g.world.gates=[];g.world.shadows=[];
  Object.assign(g.player,{x:200,y:2086,grounded:true});return g;
}
function patrol(g,x=400,extra={}) {
  const e={id:`witness-${g.enemies.length}`,type:'guard',x,y:2086,w:28,h:54,hp:65,maxHp:65,
    dir:-1,minX:100,maxX:900,active:true,dead:false,alert:0,state:'patrol',stun:0,
    cooldown:100,attackTimer:0,patrolTime:0,viewRange:310,search:0,telegraph:0,...extra};
  g.enemies.push(e);return e;
}
function frames(g,seconds,input={}) {for(let i=0;i<Math.ceil(seconds*60);i++){g.update(1/60,input);g.events=[];}}
function responses(g){return g.enemies.filter(e=>e.reinforcement);}
function spawnResponse(g){g.raiseAlarm(.8);frames(g,3.1);}

test('quiet movement and shadow stealth leave district heat at zero',()=>{
  const g=fixture();g.world.shadows=[{x:150,y:1990,w:200,h:150}];patrol(g,500);
  frames(g,3,{down:true});assert.equal(g.player.hidden,true);assert.equal(g.security.heat,0);
  assert.equal(g.security.level,0);assert.equal(responses(g).length,0);
});

test('confirmed sighting and witnessed scatter fire escalate district security',()=>{
  const seen=fixture();patrol(seen);frames(seen,1.1);
  assert.equal(seen.stats.alarms,1);assert.ok(seen.security.heat>=.4);assert.equal(seen.security.level,1);
  const loud=fixture();patrol(loud,450);loud.player.secondary='scatter';
  for(let i=0;i<15;i++){loud.player.attackTimer=0;loud.player.ammo.scatter=4;/* Isolate witnessed noise from magazine limits. */loud.attack(true,{x:800,y:1800});}
  assert.equal(loud.security.level,2);assert.ok(loud.security.dispatch>0);
  const unwitnessed=fixture();unwitnessed.player.secondary='scatter';unwitnessed.attack(true);
  assert.equal(unwitnessed.security.heat,0,'unheard attacks do not report themselves');
});

test('a decoy redirects patrols without reporting district heat',()=>{
  const g=fixture();const e=patrol(g,500);g.update(1/60,{noisePressed:true});
  assert.equal(e.state,'investigate');assert.ok(e.search>0);assert.equal(g.security.heat,0);
});

test('response team arrives after warning, with a campaign-wide cap of three',()=>{
  const g=fixture();g.raiseAlarm(.8);frames(g,2.5);assert.equal(responses(g).length,0);
  frames(g,.6);assert.equal(responses(g).length,2);
  g.enemies.forEach(e=>e.dead=true);frames(g,25);g.raiseAlarm(1);frames(g,3.1);
  assert.equal(responses(g).length,3);
  g.enemies.forEach(e=>e.dead=true);frames(g,30);g.raiseAlarm(1);frames(g,4);
  assert.equal(responses(g).length,3);assert.equal(g.security.reinforcements,3);
});

test('breaking contact allows heat to cool and readiness to return to normal',()=>{
  const g=fixture();g.raiseAlarm(.6);frames(g,5);assert.ok(g.security.heat>.59);
  frames(g,16);assert.equal(g.security.level,0);assert.equal(g.security.heat,0);
});

test('repeatable substation jam cancels response but leaves direct local detection possible',()=>{
  const g=fixture();const station=g.world.interactables.find(o=>o.id==='security-market');
  g.raiseAlarm(.9);g.hackSuccess(station);
  assert.equal(station.done,false);assert.equal(g.security.dispatch,0);assert.equal(g.security.suppressed,35);
  const e=patrol(g);frames(g,2);assert.equal(e.alert,1);assert.equal(g.security.heat,0);
  assert.equal(responses(g).length,0);
  Object.assign(g.player,{x:station.x-14,y:station.y-54});e.dead=true;
  g.interact();assert.equal(g.mode,'hacking');g.hackSuccess(station);
  assert.equal(g.security.suppressed,35);assert.equal(station.done,false);
  frames(g,34);g.raiseAlarm(1);frames(g,.5);assert.equal(responses(g).length,0);
  assert.equal(g.security.heat,0);
});

test('dynamic responders survive save/restore with state and unique IDs',()=>{
  const g=fixture();spawnResponse(g);const original=responses(g);
  original[0].hp=21;original[1].dead=true;
  const snapshot=JSON.parse(JSON.stringify(g.serialize()));const restored=new Game();
  restored.restore(snapshot);assert.equal(responses(restored).length,2);
  assert.equal(responses(restored)[0].hp,21);assert.equal(responses(restored)[1].dead,true);
  assert.equal(restored.security.reinforcements,2);
  restored.restore(snapshot);
  assert.equal(responses(restored).length,2,'reloading the same save cannot duplicate response units');
  assert.equal(new Set(restored.enemies.map(e=>e.id)).size,restored.enemies.length);
});

test('lockdown still permits relay hacks, Warden override, core recovery and extraction',()=>{
  const g=new Game();g.enemies.forEach(e=>e.dead=true);g.raiseAlarm(1);frames(g,3.1);
  assert.equal(g.security.level,2);assert.equal(responses(g).length,2);
  const object=id=>g.world.interactables.find(o=>o.id===id);
  for(const id of ['relay-market','relay-spire','boss-override','core']){
    const o=object(id);Object.assign(g.player,{x:o.x-14,y:o.y-54});g.interact();
    assert.equal(g.mode,'hacking',`${id} remains usable during lockdown`);g.hackSuccess(o);
  }
  const exit=object('exit');Object.assign(g.player,{x:exit.x-14,y:exit.y-54});g.interact();
  assert.equal(g.mode,'ending');assert.equal(g.flags.core,true);
});

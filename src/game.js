import {assignAccess,attacksPlayer,territoryAt} from './territories.js';
import { createWorld } from './world.js';
import {createCivilians,frightenCivilians,updateCivilians} from './civilians.js';
import {createGangs,factionOf,selectTarget} from './factions.js';
import {createInterior} from './interiors.js';

export const BUILDS = {
  blade: { name:'CHRONOBLADE', role:'Sandevistan / katana', color:'#71f6ed', hp:100, weapon:'katana', ability:'TIME FRACTURE', detail:'Slow the district. Close the gap with a lethal blade.', tip:'Q slows enemies for 2.4 seconds. C blinkstrikes; V parries.' },
  ghost: { name:'NETRUNNER', role:'Quickhacks / control', color:'#c09bff', hp:85, weapon:'arc', ability:'CHAIN BREACH', detail:'Break their network. Disable threats from a distance.', tip:'Q interrupts up to 3 threats. C targets an EMP; V cloaks.' },
  tank: { name:'BREAKER', role:'Brute / impact', color:'#ffb464', hp:150, weapon:'fists', ability:'SEISMIC PULSE', detail:'Walk through resistance. Turn armor into a weapon.', tip:'Q releases a shockwave. C rushes; V braces. Take 20% less damage.' },
  gun: { name:'GUNSLINGER', role:'Precision / reflex', color:'#ff729d', hp:100, weapon:'pistol', ability:'DEADEYE', detail:'Every opening is a shot. Overclock your trigger finger.', tip:'Q grants 3 seconds of faster piercing shots. C fans; V evades.' }
};
export const WEAPONS = {
  pistol:{name:'Vigil',label:'Gunslinger pistol',damage:24,cooldown:.24,speed:1400,color:'#ffb39a',range:1000,magazine:12,reload:1.25},
  pulse:{name:'Needle',label:'Suppressed pulse',damage:22,cooldown:.27,speed:1100,color:'#78f5e3',range:800,magazine:16,reload:1.1},
  arc:{name:'Synapse',label:'Arc disruptor',damage:17,cooldown:.48,speed:800,color:'#c6a0ff',range:640,magazine:8,reload:1.6},
  scatter:{name:'Breach',label:'Scatter cannon',damage:15,cooldown:.72,speed:900,color:'#ffb66d',range:430,magazine:4,reload:1.8}
};
const skill=(name,key,cost,cooldown,description)=>({name,key,cost,cooldown,description});
export const SKILLS = {
  blade:{q:skill('Time fracture','Q',40,10,'Slow hostile systems for 2.4 seconds.'),c:skill('Blinkstrike','C',25,5,'Blink toward the cursor up to 260px and strike. Walls stop traversal.'),v:skill('Mirror parry','V',15,4,'Deflect for 0.55s. First 0.14s: perfect parry, 75% chance to return toward shooter.')},
  ghost:{q:skill('Chain breach','Q',40,9,'Damage and interrupt up to three nearby targets.'),c:skill('Remote EMP','C',30,6,'Detonate an EMP at the cursor within 550px; interrupts up to three targets.'),v:skill('Optical cloak','V',20,8,'Hide from detection for three seconds. Attacking breaks concealment.')},
  tank:{q:skill('Seismic pulse','Q',40,9,'Stagger nearby threats with an armored shockwave.'),c:skill('Shoulder rush','C',25,5,'Rush forward with brief protection and strike each enemy once.'),v:skill('Brace barrier','V',20,7,'Absorb 70% of incoming damage for 2 seconds.')},
  gun:{q:skill('Deadeye','Q',40,10,'Three seconds of faster piercing shots with 50% bonus damage.'),c:skill('Fan volley','C',25,5,'Fire three high-speed piercing rounds in a narrow fan.'),v:skill('Reflex evade','V',20,5,'A short evasive dash and clear the weapon recovery timer.')},
};
export const xpForLevel=level=>[0,0,90,230,430,700][clamp(Math.floor(level),1,5)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const center=e=>({x:e.x+e.w/2,y:e.y+e.h/2});
function segmentEntry(a,b,r) {
  let lo=0,hi=1;
  for(const [p,d,min,max] of [[a.x,b.x-a.x,r.x,r.x+r.w],[a.y,b.y-a.y,r.y,r.y+r.h]]) {
    if(Math.abs(d)<.0001){if(p<min||p>max)return null;}
    else {let t1=(min-p)/d,t2=(max-p)/d;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return null;}
  }
  return lo;
}
function segmentRect(a,b,r){return segmentEntry(a,b,r)!==null;}
export function bodyHit(from,to,actor){
  const fraction=segmentEntry(from,to,actor)??0,point={x:from.x+(to.x-from.x)*fraction,y:from.y+(to.y-from.y)*fraction};
  if(actor.type==='drone'||actor.type==='boss')return {region:'armor',multiplier:1,point};
  const height=(point.y-actor.y)/actor.h;
  const region=height<.22?'head':height>.62?'legs':'torso';
  return {region,multiplier:region==='head'?2:region==='legs'?.65:1,point};
}

export class Game {
  constructor(build='blade',citySeed=Math.floor(Math.random()*4294967296)) {
    this.world=createWorld();this.time=0;this.mode='playing';this.events=[];this.projectiles=[];this.particles=[];this.effects=[];
    this.camera={x:0,y:1400};this.slowTime=0;this.alarm=0;this.shake=0;this.mapOpen=false;this.zone='';this.discovered=[];
    this.stats={kills:0,takedowns:0,alarms:0,shards:0,deaths:0,time:0};this.flags={};this.checkpoint=null;this.savedCheckpoint=null;
    this.security={heat:0,level:0,quiet:0,suppressed:0,reinforcements:0,dispatch:0,siren:0};
    const b=BUILDS[build];this.player={...this.world.spawn,w:28,h:54,vx:0,vy:0,dir:1,grounded:false,crouching:false,hp:b.hp,maxHp:b.hp,energy:100,maxEnergy:100,build,weapon:b.weapon,secondary:'pulse',owned:['pulse'],attackTimer:0,dashTimer:0,dashCooldown:0,abilityCooldown:0,invuln:0,anim:0,hidden:false,jumps:0,coyote:0,dropTimer:0,deadeye:0,damageBonus:0,upgrades:[],credits:0,
      stamina:100,maxStamina:100,staminaDelay:0,ammo:Object.fromEntries(Object.entries(WEAPONS).map(([id,w])=>[id,w.magazine])),reloadTimer:0,reloadDuration:0,reloadWeapon:null,lastFired:WEAPONS[b.weapon]?b.weapon:'pulse',
      jumpBuffer:0,skillCooldown:0,guardCooldown:0,parry:0,cloak:0,barrier:0,rush:0,rushHits:[],combo:0,comboTimer:0,skillTimer:0,aimX:780,aimY:2113,aimAngle:0,aiming:false,xp:0,level:1,skillPoints:0,talents:{force:0,flow:0,guard:0}};
    this.enemies=this.world.enemies.map((e,i)=>{
      const type=e.type;const hp=type==='boss'?1350:type==='heavy'?155:type==='drone'?56:type==='sniper'?70:85;
      return {...e,w:type==='boss'?64:type==='drone'?38:28,h:type==='boss'?86:type==='drone'?26:54,hp,maxHp:hp,dir:e.dir||-1,alert:0,state:'patrol',stun:0,attackTimer:0,cooldown:1+i*.13,dead:false,vy:0,vx:0,homeY:e.y,patrolTime:i,viewRange:type==='sniper'?540:type==='drone'?370:310,active:type!=='boss',phase:0,telegraph:0,search:0};
    });
    this.citySeed=citySeed>>>0;this.civilians=createCivilians(this.world,this.citySeed);
    this.roomStates={};this.outside=null;
    this.enemies.push(...createGangs(this.citySeed,this.world));this.enemies.forEach(e=>assignAccess(this.world,e));
    this.saveCheckpoint(null,false);
  }
  event(type,data={}){this.events.push({type,...data});}
  sound(name){this.event('sound',{name});}
  toast(text){this.event('toast',{text});}
  effect(type,x,y,options={}){this.effects.push({type,x,y,life:.5,maxLife:.5,color:'#84f8ee',...options});}
  burst(x,y,color='#7ef8e6',n=12){for(let i=0;i<n;i++)this.particles.push({x,y,vx:(Math.random()-.5)*260,vy:(Math.random()-.6)*240,life:.3+Math.random()*.45,maxLife:.75,color,size:1+Math.random()*3});}
  get objective(){
    if(this.flags.core)return 'Reach the extraction lift';
    if(this.flags.bossResolved)return 'Access the memory core';
    const count=['relay-market','relay-spire'].filter(id=>this.flags[id]).length;
    return count<2?`Unlink the two security relays · ${count}/2`:'Enter the relay crown · confront the Warden';
  }
  get targets(){
    if(this.world.interior)return this.world.interactables.filter(o=>o.type==='door');
    if(this.flags['relay-market']&&this.flags['relay-spire']&&!this.flags.bossResolved){
      if(this.player.y<1700)return this.world.interactables.filter(o=>o.id==='boss-override');
      const boss=this.enemies.find(e=>e.type==='boss');return boss?[{x:boss.x,y:boss.y+boss.h,label:'WARDEN / 09 · rooftop override available'}]:[];
    }
    const types=this.flags.core?['exit']:this.flags.bossResolved?['core']:['relay-market','relay-spire'].filter(id=>!this.flags[id]);
    return this.world.interactables.filter(o=>types.includes(o.id)||types.includes(o.type));
  }
  get solids(){return [...this.world.platforms.filter(p=>p.kind==='solid'),...this.world.gates.filter(g=>!g.open)];}
  lineClear(a,b){return !this.solids.some(r=>segmentRect(a,b,r));}
  noise(x,y,r=330){
    frightenCivilians(this,x,y,r);
    this.effect('noise',x,y,{r,life:.7,maxLife:.7,color:'#f3b26b'});
    let heard=false;for(const e of this.enemies)if(!e.dead&&e.active&&Math.hypot(e.x-x,e.y-y)<r){e.search=4;e.investigateX=clamp(x,e.minX,e.maxX);e.state='investigate';e.alert=Math.max(e.alert,.25);if(factionOf(e)==='helix')heard=true;}
    if(r>=400&&heard)this.raiseAlarm(.055);
  }
  raiseAlarm(amount){
    const s=this.security;if(s.suppressed>0)return;s.heat=clamp(s.heat+amount,0,1);s.quiet=0;
    const level=s.heat>=.75?2:s.heat>=.3?1:0;
    if(level>s.level){this.sound('alert');this.toast(level===2?'DISTRICT LOCKDOWN · response team dispatched':'SECURITY ALERT · patrols on high readiness');if(level===2&&s.reinforcements<3)s.dispatch=3;}
    s.level=level;
  }
  securityStep(dt){
    const s=this.security;s.suppressed=Math.max(0,s.suppressed-dt);
    s.siren=Math.max(0,(s.siren||0)-dt);if(s.level>0&&s.suppressed<=0&&s.siren<=0){this.sound('siren');s.siren=s.level===2?5:9;}
    const detected=this.enemies.some(e=>!e.dead&&e.active&&e.type!=='boss'&&factionOf(e)==='helix'&&(!e.targetId||e.targetId==='player')&&e.alert>.85);
    if(detected&&s.suppressed<=0){s.quiet=0;this.raiseAlarm(dt*.045);}else s.quiet+=dt;
    if(s.quiet>6||s.suppressed>0)s.heat=Math.max(0,s.heat-dt*(s.suppressed>0?.3:.045));
    s.level=s.heat>=.75?2:s.heat>=.3?1:0;
    if(s.dispatch>0&&!this.world.interior){s.dispatch-=dt;if(s.dispatch<=0&&s.level===2&&s.suppressed<=0&&s.reinforcements<3){
      const count=Math.min(3-s.reinforcements,2),p=this.player;
      for(let i=0;i<count;i++){
        const x=clamp(p.x+(p.x<6200?1:-1)*(420+i*95),100,7050),id=`response-${++s.reinforcements}`;
        this.enemies.push({id,type:'guard',x,y:2086,w:28,h:54,hp:65,maxHp:65,dir:p.x>x?-1:1,minX:Math.max(40,x-420),maxX:Math.min(7120,x+420),vx:0,vy:0,homeY:2086,active:true,dead:false,alert:.5,state:'investigate',stun:0,cooldown:1.3,attackTimer:0,patrolTime:0,viewRange:380,search:8,investigateX:p.x,telegraph:0,reinforcement:true});
        this.effect('ring',x,2120,{r:65,color:'#ff6c85',life:1,maxLife:1});
      }
      this.toast('RESPONSE TEAM ARRIVED · rooftops remain open');this.sound('boss');
    }}
  }
  gainXP(amount){
    const p=this.player;p.xp+=amount;
    while(p.level<5&&p.xp>=xpForLevel(p.level+1)){p.level++;p.skillPoints++;p.energy=Math.min(p.maxEnergy,p.energy+30);this.event('levelup',{level:p.level});this.toast(`LEVEL ${p.level} · +1 talent point · press T`);this.sound('unlock');}
  }
  spendTalent(key){
    const p=this.player;if(!['force','flow','guard'].includes(key)||p.skillPoints<=0||p.talents[key]>=2)return false;
    p.skillPoints--;p.talents[key]++;
    if(key==='guard'){p.maxHp+=20;p.hp=Math.min(p.maxHp,p.hp+20);}
    this.sound('unlock');this.autosave();return true;
  }
  damageEnemy(e,amount,stun=0,source=null,playerDamage=true){
    if(e.dead)return;
    if(playerDamage)e.hostileToPlayer=true;
    if(playerDamage&&e.faction&&e.faction!=='helix')for(const ally of this.enemies)if(ally.group===e.group&&ally.faction===e.faction)ally.hostileToPlayer=true;
    const from=source||center(this.player);
    if(e.type==='heavy'&&amount<900&&(from.x-center(e).x)*e.dir>0&&e.telegraph<=0){amount*=.38;this.effect('ring',e.x+e.w/2,e.y+24,{r:26,color:'#e0b66a',life:.18,maxLife:.18});}
    if(e.type==='boss'){
      // Armor remains stronger during an attack wind-up; recovery rewards aggression.
      amount*=e.telegraph>0||e.charge>0?.65:.85;
      stun=Math.min(.12,stun);if((e.staggerImmune||0)>0)stun=0;else if(stun>0)e.staggerImmune=1.5;
    }
    e.hp-=amount;e.stun=Math.max(e.stun,stun);e.alert=1;e.state='alert';e.flash=.12;
    if(e.type!=='boss')e.x=clamp(e.x+Math.sign(center(e).x-from.x)*Math.min(24,amount*.45),e.minX,e.maxX);
    this.burst(e.x+e.w/2,e.y+e.h/2,e.type==='boss'?'#ffae62':'#fc789a',8);this.sound('hit');
    if(e.hp<=0){e.hp=0;e.dead=true;if(playerDamage){this.stats.kills++;this.gainXP(e.type==='boss'?150:e.type==='heavy'?45:30);this.player.credits+=e.type==='boss'?5:1;this.player.energy=Math.min(100,this.player.energy+9);}this.burst(e.x,e.y,'#ffb066',20);if(e.type==='boss')this.resolveBoss(false);}
  }
  hurt(amount,dir=0){
    const p=this.player;if(p.invuln>0||this.mode!=='playing')return;
    p.hp-=amount*(p.build==='tank'?.8:1)*(p.barrier>0?.3:1)*(1-p.talents.guard*.08);p.invuln=.55;p.vx=dir*180;this.shake=.3;this.sound('hurt');this.burst(p.x,p.y,'#ff5b75',12);
    if(p.hp<=0){p.hp=0;this.mode='dead';this.stats.deaths++;this.sound('death');this.event('death');}
  }
  aimAt(aim){
    const p=this.player,from=center(p);const target=aim||{x:from.x+p.dir*600,y:from.y};
    p.aimX=target.x;p.aimY=target.y;p.aimAngle=Math.atan2(target.y-from.y,target.x-from.x);
    if(Math.abs(target.x-from.x)>2)p.dir=target.x>from.x?1:-1;
    return target;
  }
  fireRound(angle,damage,speed=1150,extra={}){
    const p=this.player;const from=center(p);
    this.projectiles.push({x:from.x+Math.cos(angle)*24,y:from.y+Math.sin(angle)*24,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:3,color:'#8bf6ed',damage,enemy:false,life:1,kind:'pulse',pierce:false,hits:[],...extra});
  }
  attack(secondary=false,aim=null){
    const p=this.player;if(p.attackTimer>0||p.dashTimer>0)return;
    const target=this.aimAt(aim);p.cloak=0;
    const kind=secondary?p.secondary:p.weapon;
    const bonus=1+p.damageBonus+p.talents.force*.15;
    if(kind==='katana'||kind==='fists') {
      p.lastAttackKind=kind;
      p.combo=p.comboTimer>0?p.combo%3+1:1;p.comboTimer=.8;
      p.attackTimer=(kind==='katana'?.24:.32)+(p.combo===3?.1:0);if(kind==='katana')p.bladeDeflect=.14;
      const reach=kind==='katana'?115:95;
      const downward=!p.grounded&&target.y>center(p).y+35&&Math.abs(target.x-center(p).x)<160;
      this.effect('slash',p.x+14,p.y+27,{dir:p.dir,r:reach,angle:downward?Math.PI/2:(p.dir<0?Math.PI:0),downward,combo:p.combo,color:kind==='katana'?'#8afff0':'#ffb16b',life:.2,maxLife:.2});this.sound('slash');
      for(const e of this.enemies){
        if(e.dead||!e.active||!this.lineClear(center(p),center(e)))continue;
        const dx=center(e).x-center(p).x,dy=center(e).y-center(p).y;
        const hit=downward?Math.abs(dx)<65&&dy>0&&dy<reach+30:Math.abs(dy)<75&&dx*p.dir>-24&&dx*p.dir<reach;
        if(hit){this.damageEnemy(e,(kind==='katana'?25:32)*(p.combo===3?1.6:1)*bonus,p.combo===3?.38:.12);
          if(downward){p.vy=-590;p.jumps=1;p.grounded=false;this.effect('ring',p.x+14,p.y+54,{r:50,color:'#eaffc5'});this.sound('doubleJump');}
        }
      }
      this.noise(p.x,p.y,150);return;
    }
    const weapon=WEAPONS[kind];if(!weapon)return;
    if(p.reloadTimer>0)return;p.lastFired=kind;
    if(p.ammo[kind]<=0){this.reload(kind);return;}
    p.ammo[kind]--;p.lastAttackKind=kind;p.attackTimer=weapon.cooldown*(p.deadeye>0?.68:1);
    const count=kind==='scatter'?5:1;
    for(let i=0;i<count;i++)this.fireRound(p.aimAngle+(i-(count-1)/2)*.09,weapon.damage*bonus*(p.deadeye>0?1.5:1),weapon.speed,{r:kind==='arc'?5:3,color:weapon.color,life:weapon.range/weapon.speed,kind,pierce:p.deadeye>0});
    this.effect('ring',p.x+14+Math.cos(p.aimAngle)*25,p.y+27+Math.sin(p.aimAngle)*25,{r:16,life:.1,maxLife:.1,color:weapon.color});this.sound('shoot');this.noise(p.x,p.y,kind==='pulse'?130:kind==='arc'?190:400);
  }
  reload(kind=this.player.lastFired){
    const p=this.player,w=WEAPONS[kind];
    if(!w||p.reloadTimer>0||p.ammo[kind]>=w.magazine)return false;
    p.reloadWeapon=kind;p.reloadDuration=w.reload;p.reloadTimer=w.reload;this.sound('reload');return true;
  }
  serviceEquipment(){
    const p=this.player;p.stamina=p.maxStamina;p.staminaDelay=0;p.reloadTimer=0;p.reloadWeapon=null;
    for(const [id,w] of Object.entries(WEAPONS))p.ammo[id]=w.magazine;
  }
  deflectProjectile(b){
    const p=this.player,perfect=p.parry>.41,shooter=this.enemies.find(e=>e.id===b.ownerId&&!e.dead&&e.active);
    const speed=Math.hypot(b.vx,b.vy),returnShot=perfect&&shooter&&Math.random()<.75;
    const at={x:p.x+p.w/2+p.dir*32,y:clamp(b.y,p.y+3,p.y+p.h-3)};
    const target=returnShot?center(shooter):null;
    const angle=target?Math.atan2(target.y-at.y,target.x-at.x):perfect&&!shooter?Math.atan2(-b.vy,-b.vx):Math.atan2(-b.vy,-b.vx)-.75;
    Object.assign(b,{x:at.x,y:at.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,enemy:false,hits:[],pierce:false,kind:'pulse',color:perfect?'#eaffbb':'#89f6ee',life:1.8,damage:b.damage*(perfect?1.5:.8)});
    delete b.faction;delete b.ownerId;p.energy=Math.min(p.maxEnergy,p.energy+(perfect?12:3));
    this.effect('ring',at.x,at.y,{r:perfect?48:24,color:b.color,life:.2,maxLife:.2});this.burst(at.x,at.y,b.color,6);this.sound(perfect?'parry':'deflect');
    if(perfect)this.effect('text',p.x+14,p.y-18,{text:returnShot?'PERFECT / RETURN':'PERFECT PARRY',color:'#eaffbb',life:.65,maxLife:.65});
  }
  cycleSidearm(){
    const p=this.player;if(p.owned.length<2)return;
    p.secondary=p.owned[(p.owned.indexOf(p.secondary)+1)%p.owned.length];p.lastFired=p.secondary;
    p.reloadTimer=0;p.reloadWeapon=null;this.toast(`${WEAPONS[p.secondary].name} · R reload`);this.sound('ui');
  }
  ability(){return this.useSkill('q');}
  useSkill(key,aim=null){
    const p=this.player,config=SKILLS[p.build][key],field={q:'abilityCooldown',c:'skillCooldown',v:'guardCooldown'}[key];
    if(!config||!field)return false;
    const flow=p.talents.flow,cost=config.cost*(1-flow*.1);
    if(p.energy<cost||p[field]>0){this.toast(`${config.name.toUpperCase()} · ${Math.ceil(cost)} energy / ready cooldown required`);return false;}
    p.energy-=cost;p[field]=config.cooldown*(1-flow*.12);p.skillTimer=.35;this.sound('ability');
    const target=this.aimAt(aim||{x:p.aimX,y:p.aimY});
    this.effect('ring',p.x+14,p.y+26,{r:key==='v'?70:190,life:.45,maxLife:.45,color:BUILDS[p.build].color});
    const nearby=(at,r)=>this.enemies.filter(e=>!e.dead&&e.active&&Math.hypot(center(e).x-at.x,center(e).y-at.y)<r&&this.lineClear(at,center(e))).sort((a,b)=>dist(center(a),at)-dist(center(b),at)).slice(0,3);
    const damage=1+p.talents.force*.15;
    if(key==='q'){
      if(p.build==='blade')this.slowTime=2.4;
      if(p.build==='ghost')for(const e of nearby(center(p),550)){this.effect('beam',p.x+14,p.y+24,{tx:e.x+e.w/2,ty:e.y+20,color:'#bf91ff'});this.damageEnemy(e,32*damage,2.1);}
      if(p.build==='tank'){p.barrier=1;for(const e of nearby(center(p),260))this.damageEnemy(e,58*damage,1.1);this.noise(p.x,p.y,600);}
      if(p.build==='gun')p.deadeye=3;
    }
    if(key==='c'){
      p.cloak=0;
      if(p.build==='blade'){
        const from=center(p),dx=target.x-from.x,dy=target.y-from.y,len=Math.hypot(dx,dy)||1,reach=Math.min(260,len);
        let x=p.x,y=p.y;
        for(let travelled=8;travelled<=reach;travelled+=8){const candidate={x:p.x+dx/len*travelled,y:p.y+dy/len*travelled,w:p.w,h:p.h};
          if(candidate.x<12||candidate.x+p.w>this.world.width-12||candidate.y<0||this.solids.some(s=>overlap(candidate,s)))break;x=candidate.x;y=candidate.y;}
        p.x=x;p.y=y;p.vx=0;p.vy=0;p.invuln=Math.max(p.invuln,.22);
        this.effect('beam',from.x,from.y,{tx:p.x+14,ty:p.y+27,color:'#8afff0'});
        for(const e of nearby(center(p),120))this.damageEnemy(e,48*damage,.3);this.effect('slash',p.x+14,p.y+27,{r:120,dir:p.dir,angle:p.dir<0?Math.PI:0});this.effect('ring',p.x+14,p.y+27,{r:120,life:.25,maxLife:.25,color:'#8afff0'});
      }
      if(p.build==='ghost'){
        const from=center(p),dx=target.x-from.x,dy=target.y-from.y,len=Math.hypot(dx,dy)||1,reach=Math.min(550,len);
        let at=from;for(let r=12;r<=reach;r+=12){const next={x:from.x+dx/len*r,y:from.y+dy/len*r};if(!this.lineClear(from,next))break;at=next;}
        this.effect('explosion',at.x,at.y,{r:160,color:'#c29aff',life:.6,maxLife:.6});for(const e of nearby(at,160))this.damageEnemy(e,42*damage,1.8,at);this.noise(at.x,at.y,330);
      }
      if(p.build==='tank'){p.rush=.38;p.rushHits=[];p.dashTimer=.38;p.invuln=Math.max(p.invuln,.3);}
      if(p.build==='gun'){for(let i=-1;i<=1;i++)this.fireRound(p.aimAngle+i*.1,32*damage,1250,{pierce:true,color:'#ff95bb'});this.sound('shoot');this.noise(p.x,p.y,350);}
    }
    if(key==='v'){
      if(p.build==='blade')p.parry=.55;
      if(p.build==='ghost')p.cloak=3;
      if(p.build==='tank')p.barrier=2;
      if(p.build==='gun'){p.dashTimer=.18;p.invuln=Math.max(p.invuln,.4);p.attackTimer=0;p.dashCooldown=.45;}
    }
    this.toast(config.name.toUpperCase());return true;
  }
  interaction(){
    const p=this.player;
    const door=this.world.interactables.find(o=>(o.type==='door'||o.type==='checkpoint')&&Math.hypot(o.x-p.x-p.w/2,o.y-p.y-p.h)<55);
    if(door)return door;
    const victim=this.enemies.find(e=>!e.dead&&e.active&&e.type!=='boss'&&e.type!=='drone'&&e.alert<.7&&Math.abs(e.x-p.x)<78&&Math.abs(e.y-p.y)<45&&(p.x-e.x)*e.dir<0);
    if(victim)return {type:'takedown',enemy:victim,label:'Silent takedown'};
    const near=this.world.interactables.filter(o=>!o.done&&Math.hypot(o.x-(p.x+14),o.y-(p.y+p.h))<100).sort((a,b)=>dist({x:a.x,y:a.y},{x:p.x+14,y:p.y+54})-dist({x:b.x,y:b.y},{x:p.x+14,y:p.y+54}));
    if(near[0])return near[0];
    const civilian=this.civilians.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<75&&c.panic<=0);
    return civilian?{type:'talk',civilian,label:`Talk · ${civilian.role}`} : null;
  }
  interact(){
    const p=this.player,o=this.interaction();if(!o)return;
    if(o.type==='door'){if(o.roomId)this.enterRoom(o.roomId);else this.leaveRoom();return;}
    if(o.type==='talk'){o.civilian.speech=o.civilian.line;o.civilian.speechTime=5;o.civilian.wait=5;return;}
    if(o.type==='takedown'){this.damageEnemy(o.enemy,999);this.stats.takedowns++;this.gainXP(25);this.sound('slash');this.toast('SILENT TAKEDOWN · +1 salvage');return;}
    if(o.requires){const req=Array.isArray(o.requires)?o.requires:[o.requires];if(!req.every(id=>this.flags[id])){this.toast(o.lockedText||'Security locked. Unlink both relays first.');return;}}
    if(o.type==='terminal'){
      if(o.id==='core'&&!this.flags.bossResolved){this.toast('The Warden still controls the core.');return;}
      this.mode='hacking';this.event('hack',{object:o});this.sound('ui');
    } else if(o.type==='checkpoint'){if(this.security.level>0||this.enemies.some(e=>!e.dead&&e.active&&attacksPlayer(this,e)&&e.alert>.8&&dist(e,p)<550)){this.toast('SAFEHOUSE OFFLINE · lose pursuit or jam an alarm substation first');return;}this.saveCheckpoint(o);}
    else if(o.type==='upgrade'){this.mode='upgrade';this.event('upgrade',{object:o});}
    else if(o.type==='cache'){const key=o.weapon||['pulse','arc','scatter'][Math.min(2,this.player.owned.length)];const duplicate=this.player.owned.includes(key);if(!duplicate)this.player.owned.push(key);this.player.credits+=2;this.player.energy=100;this.player.ammo[key]=WEAPONS[key].magazine;this.player.secondary=key;o.done=true;this.sound('pickup');this.toast(`${duplicate?'Weapon serviced':WEAPONS[key]?.name+' acquired'} · +2 salvage · K sidearm · R reload · X switch`);this.autosave();}
    else if(o.type==='lore'){o.done=true;this.stats.shards++;this.gainXP(25);this.player.credits+=2;this.mode='lore';this.event('lore',{object:o});this.sound('pickup');this.autosave();}
    else if(o.type==='exit'){if(!this.flags.core){this.toast('Recover the memory core before extraction.');return;}this.mode='ending';this.event('ending');}
    else if(o.type==='shard'){o.done=true;this.player.credits+=o.value||2;this.sound('pickup');this.toast('Salvage acquired');}
    else if(o.type==='health'){o.done=true;this.player.hp=Math.min(this.player.maxHp,this.player.hp+50);this.sound('pickup');}
  }
  hackSuccess(o){
    if(!this.flags[o.id])this.gainXP(o.id==='boss-override'?100:o.id==='core'?80:50);
    o.done=true;this.flags[o.id]=true;this.mode='playing';this.sound('unlock');this.burst(o.x,o.y-30,'#81ffda',25);
    if(o.id.startsWith('security-')){o.done=false;this.security.heat=0;this.security.level=0;this.security.dispatch=0;this.security.suppressed=35;for(const e of this.enemies)if(!e.dead&&e.type!=='boss'){e.alert=Math.min(e.alert,.3);e.search=0;}this.toast('ALARM JAMMED · 35 seconds without a district response');}
    else if(o.id==='boss-override'){this.resolveBoss(true);this.toast('WARDEN QUARANTINED · a mind, not a weapon');}
    else if(o.id==='core'){this.flags.core=true;this.toast('The archive holds living minds. Reach extraction.');}
    else this.toast(`${o.label||'Relay'} disconnected · routes unlocked`);
    this.updateGates();this.autosave();
  }
  updateGates(){for(const g of this.world.gates){const req=Array.isArray(g.requires)?g.requires:[g.requires];g.open=req.every(id=>this.flags[id]);}}
  resolveBoss(override){
    this.flags.bossResolved=true;this.flags['boss-resolved']=true;this.flags.wardenSpared=override;
    for(const e of this.enemies)if(e.type==='boss'){e.dead=true;e.hp=0;}
    this.projectiles=this.projectiles.filter(b=>!b.enemy);this.player.hp=Math.max(this.player.hp,this.player.maxHp*.65);this.sound('win');this.toast(override?'Warden severed from the network.':'WARDEN DEFEATED · access the memory core');this.updateGates();
  }
  upgrade(key,o){
    const p=this.player;if(p.upgrades.includes(key)){this.toast('Already installed.');return false;}if(p.credits<3){this.toast('Need 3 salvage. Explore caches or disable patrols.');return false;}
    p.credits-=3;p.upgrades.push(key);if(key==='armor'){p.maxHp+=35;p.hp=p.maxHp;}if(key==='reactor')p.reactor=true;if(key==='edge')p.damageBonus+=.25;
    this.sound('unlock');this.toast('Augment installed');this.mode='playing';this.autosave();return true;
  }
  saveCheckpoint(o,announce=true){
    if(o){this.player.hp=this.player.maxHp;this.player.energy=100;this.serviceEquipment();this.checkpoint=o.id;this.flags[o.id]=true;o.active=true;for(const c of this.world.interactables)if(c.type==='checkpoint')c.active=c===o;}
    this.savedCheckpoint=this.serialize();if(announce){this.toast('SAFEHOUSE SYNCED · health, stamina and magazines restored');this.sound('checkpoint');this.event('save',{data:this.savedCheckpoint});}
  }
  autosave(){this.event('save',{data:this.serialize()});}
  rememberRoom(){
    if(this.world.interior)this.roomStates[this.world.room.id]={objects:this.world.interactables.map(o=>({id:o.id,done:o.done,active:o.active})),enemies:JSON.parse(JSON.stringify(this.enemies))};
  }
  enterRoom(id,returnPoint=null){
    if(this.outside)return false;
    const world=createInterior(id);if(!world)return false;
    this.outside={world:this.world,enemies:this.enemies,civilians:this.civilians,returnPoint:returnPoint||{x:this.player.x,y:this.player.y},zone:this.zone};
    this.world=world;this.enemies=world.enemies.map(e=>({...e}));this.civilians=createCivilians(world,this.citySeed);this.enemies.forEach(e=>assignAccess(world,e));
    const saved=this.roomStates[id];if(saved){this.enemies=JSON.parse(JSON.stringify(saved.enemies));for(const o of world.interactables){const state=saved.objects.find(s=>s.id===o.id);if(state)Object.assign(o,state);}}
    this.placeAt(world.spawn);this.event('room',{name:world.name});this.toast(world.room.description);return true;
  }
  leaveRoom(){
    if(!this.outside)return false;
    this.rememberRoom();const city=this.outside;
    this.world=city.world;this.enemies=city.enemies;this.civilians=city.civilians;this.outside=null;
    this.placeAt(city.returnPoint);this.event('room',{name:'Back on the street'});return true;
  }
  placeAt(point){
    Object.assign(this.player,point,{vx:0,vy:0,climbing:false,grounded:false,poleKick:0,poleRelease:0,dropTimer:0,dashTimer:0,jumpBuffer:0,invuln:Math.max(.6,this.player.invuln)});
    this.projectiles=[];this.effects=[];this.particles=[];this.zone='';this.alarm=0;
    this.camera={x:Math.max(0,this.player.x-440),y:Math.max(0,this.player.y-470)};
  }
  serialize(){
    this.rememberRoom();const city=this.outside||this;
    return {version:1,citySeed:this.citySeed,roomStates:JSON.parse(JSON.stringify(this.roomStates)),location:this.outside?{roomId:this.world.room.id,returnPoint:{...this.outside.returnPoint}}:null,
      gangs:city.enemies.filter(e=>e.faction&&e.faction!=='helix').map(e=>({...e})),player:JSON.parse(JSON.stringify(this.player)),flags:{...this.flags},stats:{...this.stats},security:{...this.security},
      responses:city.enemies.filter(e=>e.reinforcement).map(e=>({...e})),objects:city.world.interactables.map(o=>({id:o.id,done:o.done,active:o.active})),enemies:city.enemies.map(e=>({id:e.id,dead:e.dead,hp:e.hp,hostileToPlayer:!!e.hostileToPlayer})),checkpoint:this.checkpoint,discovered:[...this.discovered]};
  }
  restore(data){
    if(!data||data.version!==1)return false;
    if(this.outside)this.leaveRoom();this.roomStates=JSON.parse(JSON.stringify(data.roomStates||{}));
    if(data.citySeed!==undefined){this.citySeed=data.citySeed>>>0;this.civilians=createCivilians(this.world,this.citySeed);}
    if(data.gangs){this.enemies=this.enemies.filter(e=>!e.faction||e.faction==='helix');this.enemies.push(...data.gangs.map(e=>({...e})));}
    Object.assign(this.player,{stamina:100,maxStamina:100,staminaDelay:0,ammo:{},reloadTimer:0,reloadWeapon:null,reloadDuration:0,bladeDeflect:0,lastFired:WEAPONS[data.player.weapon]?data.player.weapon:(data.player.secondary||'pulse')},JSON.parse(JSON.stringify(data.player)),{vx:0,vy:0,invuln:1,dashTimer:0,attackTimer:0});this.player.ammo=Object.fromEntries(Object.entries(WEAPONS).map(([id,w])=>[id,clamp(this.player.ammo?.[id]??w.magazine,0,w.magazine)]));this.player.stamina=clamp(this.player.stamina??100,0,this.player.maxStamina);this.player.talents={force:0,flow:0,guard:0,...this.player.talents};this.player.rushHits=[];this.player.parry=0;this.player.cloak=0;this.player.barrier=0;this.player.rush=0;this.flags={...data.flags};this.stats={...data.stats};this.checkpoint=data.checkpoint;this.discovered=[...(data.discovered||[])];
    for(const o of this.world.interactables){const saved=data.objects.find(v=>v.id===o.id);if(saved)Object.assign(o,saved);}
    for(const e of this.enemies){const saved=data.enemies.find(v=>v.id===e.id);if(saved)Object.assign(e,saved);}
    for(const e of this.enemies)if(!e.access)assignAccess(this.world,e);
    if(data.security)Object.assign(this.security,data.security);for(const e of data.responses||[])if(!this.enemies.some(existing=>existing.id===e.id))this.enemies.push({...e});
    this.mode='playing';this.projectiles=[];this.updateGates();if(data.location?.roomId){if(this.enterRoom(data.location.roomId,data.location.returnPoint)){Object.assign(this.player,{x:data.player.x,y:data.player.y});}}this.savedCheckpoint=this.serialize();return true;
  }
  retry(){const deaths=this.stats.deaths;const fresh=new Game(this.player.build);fresh.restore(this.savedCheckpoint);fresh.player.hp=fresh.player.maxHp;fresh.player.energy=100;fresh.serviceEquipment();fresh.stats.deaths=deaths;return fresh;}
  physics(p,dt,input){
    const wasGrounded=p.grounded;const oldBottom=p.y+p.h;const oldX=p.x;
    p.crouching=!!input.down&&p.grounded;
    const ladder=this.world.ladders.find(l=>p.x+p.w>l.x-10&&p.x<l.x+l.w+10&&p.y+p.h>l.y&&p.y<l.y+l.h);
    const move=(input.right?1:0)-(input.left?1:0);const speed=p.crouching?115:290;
    p.poleRelease=Math.max(0,(p.poleRelease||0)-dt);p.poleKick=Math.max(0,(p.poleKick||0)-dt);
    p.climbing=!!ladder&&(input.up||input.down||(p.climbing&&!p.grounded&&oldBottom>ladder.y+8&&(!move||input.jumpPressed)))&&!p.dashTimer&&p.poleRelease<=0;
    if(move&&!p.dashTimer&&!(p.build==='blade'&&input.faceCursor))p.dir=move;
    if(p.dashTimer>0){p.vx=p.dir*870;p.vy=0;}
    else{if(p.poleKick<=0)p.vx+=(move*speed-p.vx)*Math.min(1,dt*(p.grounded?18:10));if(p.climbing){p.vx=0;p.vy=input.down?340:input.up?-220:0;p.jumps=0;}else p.vy=Math.min(900,p.vy+1700*dt);}
    if(p.grounded)p.coyote=.11;else p.coyote=Math.max(0,p.coyote-dt);
    if(input.jumpPressed)p.jumpBuffer=.12;else p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
    if(p.jumpBuffer>0){
      if(input.down&&!p.climbing){p.jumpBuffer=0;p.dropTimer=.24;p.y+=8;p.grounded=false;}
      else if(p.grounded||p.coyote>0||p.jumps<2||p.climbing){p.jumpBuffer=0;const fromPole=p.climbing,second=!p.grounded&&p.coyote<=0&&!fromPole;p.vy=second?-625:-665;p.jumps=second?2:1;p.coyote=0;p.grounded=false;p.climbing=false;if(fromPole){p.vx=(move||p.dir)*420;p.poleKick=.18;p.poleRelease=.25;}this.sound(second?'doubleJump':'jump');this.effect('ring',p.x+14,p.y+54,{r:second?30:16,life:.3,maxLife:.3});}
    }
    if(input.dashPressed&&p.dashCooldown<=0){
      if(p.stamina>=35){p.stamina-=35;p.staminaDelay=.9;p.dashTimer=.17;p.dashCooldown=.7;p.invuln=Math.max(p.invuln,.22);p.vx=p.dir*870;p.vy=0;this.sound('dash');}
      else {this.toast('DASH EXHAUSTED · let stamina recharge');this.sound('empty');}
    }
    p.x+=p.vx*dt;p.x=clamp(p.x,12,this.world.width-p.w-12);
    for(const s of this.solids)if(overlap(p,s)){if(oldX+p.w<=s.x+2)p.x=s.x-p.w;else if(oldX>=s.x+s.w-2)p.x=s.x+s.w;p.vx=0;}
    p.y+=p.vy*dt;p.grounded=false;
    if(p.climbing&&p.vy>=0&&p.y+p.h>=ladder.y+ladder.h){p.y=ladder.y+ladder.h-p.h;p.climbing=false;p.vy=0;}
    if(!p.climbing){for(const s of [...this.world.platforms,...this.world.gates.filter(g=>!g.open)]){
      if(p.x+p.w>s.x+2&&p.x<s.x+s.w-2&&p.vy>=0&&oldBottom<=s.y+8&&p.y+p.h>=s.y&&(p.dropTimer<=0||s.kind==='solid'||s.y>=2140)){p.y=s.y-p.h;p.vy=0;p.grounded=true;p.jumps=0;}
      else if(s.kind==='solid'&&overlap(p,s)&&p.vy<0){p.y=s.y+s.h;p.vy=0;}
    }}
    if(p.y>this.world.height+50){this.hurt(30);p.x=this.world.spawn.x;p.y=this.world.spawn.y;p.vy=0;}
    if(!wasGrounded&&p.grounded){this.sound('land');this.burst(p.x+14,p.y+54,'#6dbebc',4);}
  }
  enemyShot(e,target,spread=0,damage=13,speed=490){
    const from=center(e),a=Math.atan2(target.y-from.y,target.x-from.x)+spread;
    this.projectiles.push({x:from.x,y:from.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:4,color:e.color||(e.type==='drone'?'#ff72c8':'#ff826e'),enemy:true,damage,life:2.5,faction:factionOf(e),ownerId:e.id,canHitPlayer:attacksPlayer(this,e)});e.attackTimer=.2;
    frightenCivilians(this,from.x,from.y,260);
  }
  enemyStep(e,dt){
    if(e.dead||!e.active)return;
    if(e.faction&&e.faction!=='helix'&&Math.abs(e.x-this.player.x)>1400)return;
    const target=e.type==='boss'?this.player:selectTarget(this,e),p=target||this.player;
    const targetId=target===this.player?'player':target?.id;
    if(e.targetId!==undefined&&e.targetId!==targetId){e.burstLeft=0;e.telegraph=0;e.alert=0;}
    e.targetId=targetId;if(!target){e.telegraph=0;e.burstLeft=0;e.alert=0;}
    e.patrolTime+=dt;e.stun=Math.max(0,e.stun-dt);e.cooldown-=dt;e.flash=Math.max(0,(e.flash||0)-dt);e.staggerImmune=Math.max(0,(e.staggerImmune||0)-dt);
    if(e.stun>0)return;
    if(e.type==='boss'){this.bossStep(e,dt);return;}
    const pc=center(p),ec=center(e),dx=pc.x-ec.x,dy=pc.y-ec.y;
    const inCone=dx*e.dir>0&&Math.abs(dy)<Math.abs(dx)*.55+35&&Math.hypot(dx,dy)<e.viewRange;
    const seen=!!target&&(target!==this.player||inCone)&&this.lineClear(ec,pc)&&(!p.hidden||Math.hypot(dx,dy)<55)&&!(p.dashTimer>0);
    const old=e.alert;e.alert=clamp(e.alert+(seen?(p.crouching?.65:1.35):-.18)*dt,0,1);
    if(old<1&&e.alert>=1){e.state='alert';if(target===this.player&&factionOf(e)==='helix'){this.stats.alarms++;this.sound('alert');this.raiseAlarm(.4);}}
    if(e.alert>.8){
      e.search=4;e.state='alert';
      if(e.telegraph<=0)e.dir=dx>0?1:-1;
      if(e.cooldown<=0&&Math.abs(dy)<(e.type==='sniper'?330:210)&&this.lineClear(ec,pc)&&e.telegraph<=0&&!(e.burstLeft>0)){
        e.cooldown=(e.type==='heavy'?2.0:e.type==='sniper'?2.4:e.type==='drone'?1.65:1.7)*(this.security.level>0?.85:1);
        e.aim={...pc};e.telegraph=e.type==='sniper'?.95:e.type==='heavy'?.65:.32;
        if(e.type==='heavy')this.effect('noise',ec.x,ec.y,{r:145,color:'#ffd27b',life:.65,maxLife:.65});
      }
    }else if(e.search>0){e.search-=dt;e.state='investigate';}else e.state='patrol';
    if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0){
      if(e.type==='sniper'){
        const from=center(e),a=Math.atan2(e.aim.y-from.y,e.aim.x-from.x),to={x:from.x+Math.cos(a)*850,y:from.y+Math.sin(a)*850};
        this.effect('beam',from.x,from.y,{tx:to.x,ty:to.y,color:'#ff6f7e',life:.16,maxLife:.16});
        if(this.lineClear(from,pc)&&segmentRect(from,to,p)){if(p===this.player)this.hurt(32,e.dir);else this.damageEnemy(p,32,0,from,false);}e.attackTimer=.3;this.sound('shoot');frightenCivilians(this,from.x,from.y,330);
      }else if(e.type==='heavy'){
        const from=center(e);this.effect('ring',from.x,from.y+18,{r:150,color:'#ffb76f',life:.45,maxLife:.45});
        if(Math.abs(dx)<145&&Math.abs(dy)<65&&this.lineClear(from,pc)){if(p===this.player)this.hurt(27,e.dir);else this.damageEnemy(p,27,0,from,false);}
        this.enemyShot(e,{x:from.x+e.dir*600,y:from.y+8},0,18,340);
      }else{e.burstLeft=e.type==='drone'?3:3;e.burstTimer=0;}
    }}
    if(e.burstLeft>0){e.burstTimer-=dt;if(e.burstTimer<=0){this.enemyShot(e,e.aim,(e.burstLeft-2)*.035,e.type==='drone'?11:14,e.type==='drone'?440:500);e.burstLeft--;e.burstTimer=.14;}}
    const speed=(e.type==='heavy'?44:e.type==='drone'?105:72)*(this.security.level>0?1.2:1);
    if(e.telegraph<=0){
      let move=e.dir;
      if(e.state==='alert')move=Math.abs(dx)<145?-Math.sign(dx):Math.abs(dx)>280?Math.sign(dx):Math.sin(e.patrolTime*2)>0?1:-1;
      else if(e.search>0&&e.investigateX!==undefined)move=e.investigateX>e.x?1:-1;
      if(e.type==='sniper'&&e.state==='alert')move=Math.abs(dx)<180?-Math.sign(dx):0;
      e.x+=move*speed*dt;
    }
    if(e.x<e.minX){e.x=e.minX;if(e.state!=='alert')e.dir=1;e.investigateX=undefined;}if(e.x>e.maxX){e.x=e.maxX;if(e.state!=='alert')e.dir=-1;e.investigateX=undefined;}
    if(e.type==='drone')e.y=e.homeY+Math.sin(e.patrolTime*2.4)*45;
    e.attackTimer=Math.max(0,e.attackTimer-dt);
  }
  bossStep(e,dt){
    const p=this.player;e.engagedAt??=this.time;e.dir=p.x>e.x?1:-1;e.alert=1;
    if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0){
      if(e.phase===0){for(let i=-1;i<=1;i++)this.enemyShot(e,e.aim,i*.2,21,460);}
      if(e.phase===1){e.charge=.6;e.chargeDir=e.dir;this.effect('noise',e.x+32,e.y+80,{r:160,color:'#ff8175'});}
      if(e.phase===2){
        for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;this.projectiles.push({x:e.x+32,y:e.y+40,vx:Math.cos(a)*330,vy:Math.sin(a)*330,r:6,color:'#eab56c',enemy:true,damage:18,life:3});}
        for(const dir of [-1,1])this.projectiles.push({x:e.x+32,y:e.y+e.h-12,vx:dir*410,vy:0,r:9,color:'#ffad67',enemy:true,damage:24,life:2});
        this.shake=.2;
      }
      e.cooldown=e.hp<e.maxHp*.5?.85:1.35;
    }}else if(e.charge>0){e.charge-=dt;e.x=clamp(e.x+e.chargeDir*720*dt,e.minX,e.maxX);if(overlap(p,e))this.hurt(32,e.chargeDir);}
    else if(e.cooldown<=0){e.phase=(e.phase+1)%3;e.aim={...center(p)};e.telegraph=(e.phase===1?.9:.78)*(e.hp<e.maxHp*.5?.8:1);this.sound('boss');}
    else if(Math.abs(e.x-p.x)>220)e.x=clamp(e.x+e.dir*58*dt,e.minX,e.maxX);
  }
  update(dt,input={}){
    dt=Math.min(dt,.0334);if(this.mode!=='playing')return;this.time+=dt;this.stats.time+=dt;const p=this.player;
    for(const key of ['attackTimer','dashTimer','dashCooldown','abilityCooldown','skillCooldown','guardCooldown','parry','bladeDeflect','cloak','barrier','rush','comboTimer','skillTimer','invuln','dropTimer','deadeye'])p[key]=Math.max(0,(p[key]||0)-dt);
    this.slowTime=Math.max(0,this.slowTime-dt);this.shake=Math.max(0,this.shake-dt);p.energy=Math.min(p.maxEnergy,p.energy+dt*(p.reactor?17:9)*(1+p.talents.flow*.12));
    const rechargeTime=Math.max(0,dt-p.staminaDelay);p.staminaDelay=Math.max(0,p.staminaDelay-dt);
    if(p.dashTimer<=0)p.stamina=Math.min(p.maxStamina,p.stamina+rechargeTime*24);
    if(p.reloadTimer>0){p.reloadTimer=Math.max(0,p.reloadTimer-dt);if(p.reloadTimer===0){p.ammo[p.reloadWeapon]=WEAPONS[p.reloadWeapon].magazine;p.reloadWeapon=null;this.sound('reloadReady');}}
    if(p.build==='blade'&&input.faceCursor&&input.aim&&!p.dashTimer&&Math.abs(input.aim.x-center(p).x)>2)p.dir=input.aim.x>center(p).x?1:-1;
    this.physics(p,dt,input);p.anim+=dt*(Math.abs(p.vx)>20?Math.abs(p.vx)/40:2);
    p.aiming=!!input.aiming;
    if(input.aim){if(!p.dashTimer&&(p.aiming||input.attack||input.secondary)&&Math.abs(Math.cos(Math.atan2(input.aim.y-center(p).y,input.aim.x-center(p).x)))>.2)p.dir=input.aim.x>=center(p).x?1:-1;p.aimX=input.aim.x;p.aimY=input.aim.y;p.aimAngle=Math.atan2(input.aim.y-center(p).y,input.aim.x-center(p).x);if(p.aiming||input.attack||input.secondary)this.aimAt(input.aim);}
    else p.aimAngle=p.dir===1?0:Math.PI;
    p.hidden=p.cloak>0||(p.crouching&&this.world.shadows.some(s=>overlap(p,s)));
    if(input.cyclePressed)this.cycleSidearm();
    if(input.reloadPressed)this.reload();
    if(input.secondary)this.attack(true,input.aim);else if(input.attack)this.attack(false,input.aim);
    if(input.abilityPressed)this.useSkill('q',input.aim);if(input.skillPressed)this.useSkill('c',input.aim);if(input.guardPressed)this.useSkill('v',input.aim);if(input.interactPressed)this.interact();
    if(p.rush>0)for(const e of this.enemies)if(!e.dead&&e.active&&!p.rushHits.includes(e.id)&&overlap({x:p.x-15,y:p.y-5,w:p.w+30,h:p.h+10},e)){p.rushHits.push(e.id);this.damageEnemy(e,55*(1+p.talents.force*.15),.7);this.effect('explosion',e.x,e.y+25,{r:65,color:'#ffc07b'});}

    if(input.noisePressed&&p.energy>=20){p.energy-=20;this.noise(clamp(p.x+p.dir*280,0,this.world.width),p.y,380);this.sound('noise');this.toast('Decoy ping · patrols investigate the sound');}
    const edt=dt*(this.slowTime>0?.23:1);
    for(const e of this.enemies){if(e.type==='boss'&&!e.dead&&!e.active&&this.flags['relay-market']&&this.flags['relay-spire']&&p.x>5950){e.active=true;e.engagedAt=this.time;this.event('boss');this.toast('WARDEN / 09 · jump the charge, watch the wind-up');}this.enemyStep(e,edt);}
    this.alarm=this.enemies.reduce((a,e)=>!e.dead&&e.active&&(!e.targetId||e.targetId==='player')&&factionOf(e)==='helix'?Math.max(a,e.alert):a,0);
    this.securityStep(dt);
    updateCivilians(this,dt);
    for(const b of this.projectiles){
      const old={x:b.x,y:b.y};const step=b.enemy?edt:dt;b.x+=b.vx*step;b.y+=b.vy*step;b.life-=step;
      if(this.solids.some(s=>segmentRect(old,b,s))){b.life=0;continue;}
      if(b.enemy){
        const shield={x:p.dir>0?p.x+p.w/2:p.x-46,y:p.y-4,w:60,h:p.h+8};
        const incoming=b.vx*p.dir<0&&(old.x-center(p).x)*p.dir>=0;
        if(p.build==='blade'&&incoming&&b.canHitPlayer!==false&&(p.parry>0||p.bladeDeflect>0)&&segmentRect(old,b,shield)){this.deflectProjectile(b);continue;}
        const faction=b.faction||'helix';
        const struck=this.enemies.filter(e=>!e.dead&&e.active&&e.type!=='boss'&&e.id!==b.ownerId&&factionOf(e)!==faction&&segmentRect(old,b,e)).sort((a,e)=>Math.hypot(a.x-old.x,a.y-old.y)-Math.hypot(e.x-old.x,e.y-old.y))[0];
        const hitsPlayer=b.canHitPlayer!==false&&segmentRect(old,b,p);
        if(struck&&(!hitsPlayer||Math.hypot(struck.x-old.x,struck.y-old.y)<Math.hypot(p.x-old.x,p.y-old.y))){this.damageEnemy(struck,b.damage*bodyHit(old,b,struck).multiplier,0,old,false);b.life=0;continue;}
        if(hitsPlayer){
        this.hurt(b.damage*bodyHit(old,b,p).multiplier,Math.sign(b.vx));b.life=0;
      }}
      else for(const e of this.enemies.filter(e=>!e.dead&&e.active&&!b.hits.includes(e.id)&&segmentRect(old,b,e)).sort((a,e)=>segmentEntry(old,b,a)-segmentEntry(old,b,e))){const hit=bodyHit(old,b,e);this.damageEnemy(e,b.damage*hit.multiplier,b.kind==='arc'?.35:0,old);if(hit.region==='head')this.effect('text',hit.point.x,hit.point.y-12,{text:'HEADSHOT ×2',color:'#ffd69d',life:.5,maxLife:.5});b.hits.push(e.id);if(!b.pierce){b.life=0;break;}}
    }
    this.projectiles=this.projectiles.filter(b=>b.life>0);
    for(const q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=280*dt;q.life-=dt;}this.particles=this.particles.filter(q=>q.life>0);
    for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
    for(const o of this.world.interactables)if(!o.done&&['shard','health','energy'].includes(o.type)&&Math.hypot(o.x-p.x-14,o.y-p.y-40)<45){if(o.type==='shard'){p.credits+=o.value||1;this.sound('pickup');}if(o.type==='health'){if(p.hp>=p.maxHp)continue;p.hp=Math.min(p.maxHp,p.hp+(o.value||35));this.sound('pickup');}if(o.type==='energy')p.energy=Math.min(100,p.energy+40);o.done=true;}
    const area=territoryAt(this.world,p);if(area.id!==this.territoryId){this.territoryId=area.id;this.event('territory',{area});}
    const zone=this.world.zones.find(z=>p.x>=z.x&&p.x<z.x+z.w);if(zone&&zone.name!==this.zone){this.zone=zone.name;const firstVisit=!this.discovered.includes(zone.name);if(firstVisit)this.discovered.push(zone.name);this.event('zone',{name:zone.name,firstVisit});}
  }
}

import {attacksPlayer} from './territories.js';
import {randomStream} from './civilians.js';
export const factionOf=e=>e.faction||'helix';
export function createGangs(seed,world=null) {
  const random=randomStream(seed^0xabc731),groups=2+Math.floor(random()*2),gangs=[];
  const names=['wire','cinder','wire'];
  for(let group=0;group<groups;group++) {
    let base=[7620,10380,9240][group]+Math.floor(random()*180),minX=base-300,maxX=base+430,spacing=45;
    if(world){
      const zone=world.zones.find(z=>base>=z.x&&base<z.x+z.w),gaps=[];let start=zone.x+20;
      const walls=world.platforms.filter(p=>p.kind==='solid'&&p.y<2140&&p.y+p.h>2086&&p.x<zone.x+zone.w&&p.x+p.w>zone.x).sort((a,b)=>a.x-b.x);
      for(const wall of walls){if(wall.x-start>=130)gaps.push({start,end:wall.x});start=Math.max(start,wall.x+wall.w);}
      if(zone.x+zone.w-20-start>=130)gaps.push({start,end:zone.x+zone.w-20});
      const gap=gaps.sort((a,b)=>Math.abs((a.start+a.end)/2-base)-Math.abs((b.start+b.end)/2-base))[0];
      if(!gap)continue;
      minX=gap.start+5;maxX=gap.end-33;spacing=36;base=Math.max(minX,Math.min(base,maxX-spacing*2));
    }
    for(let i=0;i<3;i++)gangs.push({id:`gang-${group}-${i}`,type:names[group]==='cinder'&&i===2?'heavy':'guard',faction:names[group],group,
      label:names[group]==='wire'?'WIRE SAINTS':'CINDER CREW',color:names[group]==='wire'?'#cc8fff':'#ffbd65',
      x:base+i*spacing,y:2086,w:28,h:54,minX,maxX,hp:names[group]==='cinder'&&i===2?120:65,maxHp:names[group]==='cinder'&&i===2?120:65,
      dir:i%2?1:-1,active:true,dead:false,hostileToPlayer:false,alert:0,state:'patrol',stun:0,
      cooldown:1+i*.3,attackTimer:0,patrolTime:i,viewRange:390,search:0,telegraph:0,homeY:2086,vx:0,vy:0});
  }
  return gangs;
}
export function selectTarget(game,e) {
  const faction=factionOf(e),p=game.player;
  const pc={x:p.x+p.w/2,y:p.y+p.h/2},ec={x:e.x+e.w/2,y:e.y+e.h/2};
  let target=attacksPlayer(game,e)?p:null;
  if(Math.abs(ec.x-pc.x)>1400)return target;
  // Engaged security prioritizes its player pursuit. Other guards may defend their block.
  if(target===p&&e.alert>.8&&e.targetId==='player')return p;
  let best=target?Math.hypot(ec.x-pc.x,ec.y-pc.y):Infinity;
  for(const other of game.enemies) {
    if(other===e||other.dead||!other.active||other.type==='boss'||factionOf(other)===faction)continue;
    const oc={x:other.x+other.w/2,y:other.y+other.h/2},distance=Math.hypot(ec.x-oc.x,ec.y-oc.y);
    if(distance<420&&distance<best&&game.lineClear(ec,oc)){target=other;best=distance;}
  }
  return target;
}

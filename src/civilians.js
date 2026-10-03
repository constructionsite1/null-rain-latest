// Street residents are scenery with behavior, never combat targets.
export function randomStream(seed) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
const voices={
  vendor:['Hot broth. Real ginger. No subscription.','Security buys noodles here too. Nobody gets credit.','The roof routes are quieter than the street.'],
  commuter:['Last train was cancelled. Again.','I live upstairs. The rain sounds different up there.','Helix owns the cameras, not the whole city.'],
  courier:['Three deliveries left before the curfew.','Keep the street clear. This medicine has a deadline.','Yards to Bazaar. Fastest route is over the awnings.'],
  resident:['The lights flicker when the crown draws power.','We used to see the sunrise between these towers.','If trouble starts, we wait behind the shutters.']
};
export function createCivilians(world,seed) {
  const random=randomStream(seed),people=[];
  for(const [zi,zone] of world.zones.entries()) {
    const count=world.interior?5:zi===0?14:zone.name.includes('SPIRES')?6:9;
    for(let i=0;i<count;i++) {
      const x=zone.x+70+random()*(zone.w-140),role=['vendor','commuter','resident','courier'][i%4];
      const feet=world.floor||2140;
      // Restrict each walk to the free street interval around its home.
      let minX=Math.max(zone.x+25,x-180),maxX=Math.min(zone.x+zone.w-45,x+180);
      for(const wall of world.platforms.filter(p=>p.kind==='solid'&&p.y<feet&&p.y+p.h>feet-54)) {
        if(wall.x+wall.w<=x)minX=Math.max(minX,wall.x+wall.w+10);
        else if(wall.x>=x+22)maxX=Math.min(maxX,wall.x-32);
        else {minX=1;maxX=0;break;}
      }
      if(maxX<minX)continue;
      people.push({id:`resident-${zi}-${i}`,type:'civilian',role,x,y:feet-52,w:22,h:52,
        homeX:x,minX,maxX,dir:random()>.5?1:-1,speed:role==='courier'?67:28+random()*18,
        color:['#b69c79','#769ba4','#a887b0','#92a882','#c78171'][i%5],
        umbrella:!world.interior&&i%3===0,phase:random()*6.28,wait:random()*5,panic:0,anim:0,vx:0,
        line:voices[role][i%3],speech:'',speechTime:0});
    }
  }
  return people;
}
export function frightenCivilians(game,x,y,radius) {
  for(const c of game.civilians)if(Math.hypot(c.x-x,c.y-y)<radius){
    if(c.panic<=0){c.speech=['Get inside!','Stay down!','Not again…'][c.id.length%3];c.speechTime=2;}
    c.panic=4;c.dir=c.x<x?-1:1;
  }
}
export function updateCivilians(game,dt) {
  for(const c of game.civilians) {
    c.panic=Math.max(0,c.panic-dt);c.wait-=dt;c.speechTime=Math.max(0,c.speechTime-dt);
    const danger=game.enemies.find(e=>!e.dead&&e.active&&e.alert>.8&&Math.hypot(e.x-c.x,e.y-c.y)<250);
    if(danger){c.panic=3;c.dir=c.x<danger.x?-1:1;}
    if(game.security.level>0&&Math.abs(c.x-game.player.x)<700)c.panic=Math.max(c.panic,1);
    c.vx=c.panic>0?c.dir*135:c.wait>0||c.role==='vendor'?0:c.dir*c.speed;
    c.x=Math.max(c.minX,Math.min(c.maxX,c.x+c.vx*dt));
    if(c.x===c.minX||c.x===c.maxX){if(c.panic>0)c.vx=0;else{c.dir=c.x===c.minX?1:-1;c.wait=2+c.phase*.5;}}
    if(c.panic<=0&&Math.abs(c.x-c.homeX)>125&&c.wait<=0)c.dir=c.homeX>c.x?1:-1;
    c.anim+=dt*(Math.abs(c.vx)>0?Math.abs(c.vx)/16:1);
  }
}

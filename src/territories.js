export const BASES=[
  {id:'market-relay',name:'HELIX / SIGNAL ROOST',rule:'restricted',x:1320,y:1150,w:1270,h:750,color:'#ff7978',faction:'helix',detail:'Survey drones and marksmen protect the relay roofs.'},
  {id:'watch-house',name:'HELIX / WATCH HOUSE',rule:'restricted',x:2750,y:1840,w:710,h:301,color:'#ff7978',faction:'helix',detail:'An armored street garrison. Guards attack trespassers.'},
  {id:'spire-relay',name:'HELIX / UPLINK STATION',rule:'restricted',x:3460,y:900,w:1760,h:1120,color:'#ff7978',faction:'helix',detail:'Elevated surveillance decks. Snipers cover long sightlines.'},
  {id:'archive',name:'HELIX / ARCHIVE FORTRESS',rule:'restricted',x:5320,y:1250,w:1510,h:900,color:'#ff7978',faction:'helix',detail:'The Warden controls this barricaded archive approach.'},
  {id:'saints',name:'WIRE SAINTS / NIGHT BLOCK',rule:'neutral',x:7540,y:1930,w:800,h:220,color:'#c9a0ff',faction:'wire',detail:'Music, noodle stalls and a social club. The crew tolerates visitors.'},
  {id:'stacks-coop',name:'LOTUS / RESIDENT COOPERATIVE',rule:'neutral',x:8740,y:1880,w:970,h:270,color:'#91d6b4',faction:'wire',detail:'Residents and neighborhood sentries. Weapons stay quiet here.'},
  {id:'cinder-yard',name:'CINDER CREW / FURNACE YARD',rule:'restricted',x:10040,y:1800,w:1140,h:350,color:'#ffb06c',faction:'cinder',detail:'Scrap workers guard their machinery. Entry is treated as a threat.'},
  {id:'glass',name:'HELIX / EXECUTIVE COMPOUND',rule:'restricted',x:11780,y:1600,w:1000,h:550,color:'#ff7978',faction:'helix',detail:'Private security behind glass. Armed response on entry.'}
];
export function territoryAt(world,actor){
  if(world.interior){const restricted=world.room.id==='barracks';return {id:world.room.id,name:world.room.name,rule:restricted?'restricted':'neutral',color:restricted?'#ff7978':world.room.color,detail:world.room.description};}
  const x=actor.x+(actor.w||0)/2,y=actor.y+(actor.h||0);
  return BASES.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<=b.y+b.h)||{id:'public',name:'PUBLIC STREET',rule:'public',color:'#91d6b4',detail:'Visitors welcome. Security becomes hostile if you attack or raise an alarm.'};
}
export function assignAccess(world,e){
  const area=territoryAt(world,e);e.access=area.rule;e.baseId=area.id;
  if(e.faction==='cinder'){e.access='restricted';e.baseId='cinder-yard';}
  else if(e.faction==='wire')e.access='neutral';
  return e;
}
export function attacksPlayer(game,e){
  if(e.hostileToPlayer||e.reinforcement)return true;
  if(!e.access)return !e.faction||e.faction==='helix'; // Untagged combat fixtures/legacy actors.
  if((!e.faction||e.faction==='helix')&&game.security.level>0)return true;
  if(e.access!=='restricted')return false;
  return territoryAt(game.world,game.player).id===e.baseId;
}
export function drawTerritories(c,world,visible,t){
  if(world.interior)return;
  const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
  for(const b of BASES){if(!visible(b,200))continue;
    const feet=b.y+b.h,signY=Math.min(feet-110,b.y+72);
    if(b.id==='cinder-yard'){
      for(let a=0;a<3;a++){const x=b.x+170+a*210;rect(x,feet-115,74,115,'#423f37');rect(x+7,feet-103,60,73,'#211f20');rect(x+15,feet-83,44,45,'#bd6c3c');rect(x+24,feet-66,28,27,'#f7b767');for(let k=0;k<5;k++)rect(x+11,feet-104+k*14,53,3,'#40362e');rect(x+58,feet-162,14,47,'#59605a');}
    }else if(b.id==='saints'){
      rect(b.x+260,feet-156,230,57,'#201c31');c.strokeStyle=b.color;c.strokeRect(b.x+262,feet-154,226,53);c.fillStyle='#e7b1e6';c.font='bold 15px monospace';c.fillText('SAINTS / LIVE TONIGHT',b.x+274,feet-132);for(let a=0;a<15;a++){const h=5+Math.abs(Math.sin(t*2.4+a))*13;rect(b.x+275+a*13,feet-109-h,6,h,b.color);}
    }else if(b.id==='watch-house'||b.id==='archive'){
      for(let a=0;a<3;a++){const x=b.x+170+a*140;rect(x,feet-57,72,57,'#34444f');rect(x+3,feet-52,66,8,'#c69b64');for(let k=0;k<5;k++)rect(x+7+k*13,feet-52,5,8,'#263540');rect(x+18,feet-38,37,2,'#637c87');}
    }
    for(const x of [b.x,b.x+b.w-6]){
      rect(x,signY,5,feet-signY,b.rule==='restricted'?'#704649':'#3e665d');
      rect(x-22,signY-27,49,25,'#101e28');c.strokeStyle=b.color;c.lineWidth=1;c.strokeRect(x-21,signY-26,47,23);c.fillStyle=b.color;c.font='bold 8px monospace';c.textAlign='center';c.fillText(b.rule==='restricted'?'KEEP OUT':'WELCOME',x+2,signY-11);c.textAlign='left';
      if(b.rule==='restricted'){rect(x-3,feet-8,11,4,b.color);const pulse=.45+Math.sin(t*2)*.15;c.globalAlpha=pulse;rect(x-2,signY+6,9,9,b.color);c.globalAlpha=1;}
    }
    rect(b.x+16,signY+8,Math.min(285,b.w-32),36,'#0c1c27dd');c.fillStyle=b.color;c.font='bold 11px monospace';c.fillText(b.name,b.x+25,signY+23);c.font='9px monospace';c.fillText(b.rule==='restricted'?'RESTRICTED / ARMED RESPONSE':'NEUTRAL / DO NOT PROVOKE',b.x+25,signY+36);
    c.strokeStyle=b.color+'90';c.lineWidth=2;c.setLineDash(b.rule==='restricted'?[9,7]:[2,9]);c.beginPath();c.moveTo(b.x,feet-3);c.lineTo(b.x+b.w,feet-3);c.stroke();c.setLineDash([]);
  }
}

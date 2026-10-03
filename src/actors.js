// Original articulated humans, civilian outfits and mechanical threats.
// Human art lives in human-actors.js (owned elsewhere); mechanical threats are
// authored here. No DOM, no dependencies, no writes to simulation objects.
import {drawHuman,drawResident} from './human-actors.js';
import {drawWardenPainted,wardenReady} from './warden-sprites.js';

export {drawHuman,drawResident};

function poly(c,p,color,edge='#07121d',weight=1.3){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=weight;c.stroke()}}
function seg(c,a,b,width,color,edge='#08111b'){c.lineCap='round';c.strokeStyle=edge;c.lineWidth=width+2;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function bar(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function ring(c,x,y,r,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke()}
function glow(c,color){c.shadowColor=color;c.shadowBlur=4}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function mixc(hex,to,k){const p=h=>{const n=parseInt(String(h).replace('#','').slice(0,6),16)||0;return[(n>>16)&255,(n>>8)&255,n&255]};const a=p(hex),b=p(to);const q=v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0');return '#'+q(a[0]+(b[0]-a[0])*k)+q(a[1]+(b[1]-a[1])*k)+q(a[2]+(b[2]-a[2])*k)}

// ------------------------------------------------------------------ Warden
// Armoured biped enforcer: planted heavy stride, layered shoulder and torso
// plate, one unmistakable red visor, and a mass-driver cleaver that telegraphs.
const WARDEN={
  dark:'#1b2733',mid:'#33465a',lite:'#5b7385',edge:'#0a121a',trim:'#8fa3ad',
  visor:'#ff2f45',visorHot:'#ffe2d8',core:'#ff3b30',coreHot:'#ffdccb',
  rage:'#ff9c34',rageHot:'#ffe9c4',blade:'#93a7b2',bladeEdge:'#e8f4f8'
};
function wardenPlate(base,flash){return flash>0?mixc(base,'#ffd9cf',flash*.45):base}
function wardenLeg(c,hip,knee,foot,flash,accent){
  const D=WARDEN;
  poly(c,[[hip[0]-6,hip[1]-2],[hip[0]+6,hip[1]-3],[knee[0]+5,knee[1]+3],[knee[0]-5,knee[1]+4]],wardenPlate(D.mid,flash));
  seg(c,hip,knee,9,wardenPlate(D.dark,flash));
  poly(c,[[knee[0]-6,knee[1]-5],[knee[0]+5,knee[1]-6],[knee[0]+7,knee[1]+2],[knee[0]-4,knee[1]+3]],wardenPlate(D.lite,flash));
  poly(c,[[knee[0]-3,knee[1]-2],[knee[0]+3,knee[1]-3],[knee[0]+2,knee[1]+1],[knee[0]-2,knee[1]+1]],accent,null);
  seg(c,knee,foot,8,wardenPlate(D.dark,flash));
  poly(c,[[knee[0]-5,knee[1]+4],[knee[0]+5,knee[1]+4],[foot[0]+4,foot[1]-5],[foot[0]-4,foot[1]-5]],wardenPlate(D.mid,flash));
  poly(c,[[foot[0]-4,foot[1]-6],[foot[0]+4,foot[1]-7],[foot[0]+5,foot[1]+1],[foot[0]-5,foot[1]+1]],wardenPlate(D.lite,flash));
  poly(c,[[foot[0]-7,foot[1]-3],[foot[0]+8,foot[1]-4],[foot[0]+11,foot[1]+1],[foot[0]+9,foot[1]+3],[foot[0]-8,foot[1]+3]],wardenPlate(D.dark,flash));
  bar(c,foot[0]-7,foot[1]+1,17,1,wardenPlate(D.trim,flash*.6));
}
function wardenPauldron(c,sx,y,scale,flash,accent,spike){
  const D=WARDEN;
  for(let i=2;i>=0;i--){
    const w=(17-i*3.4)*scale,h=(9-i*1.6)*scale;
    poly(c,[[sx*(1+i*.16),y-h*.5-i*4],[sx*(1+i*.16)+w,y+i*1.5],[sx*(1+i*.16)+w*.7,y+h],[sx*(1+i*.16)-2,y+h*.7]],wardenPlate(i===0?D.mid:D.dark,flash));
  }
  bar(c,sx*.9,y,3*scale,7*scale,wardenPlate(D.trim,flash*.5));
  if(spike)poly(c,[[sx*1.1,y-4],[sx*1.5,y-16*scale],[sx*1.9,y-3]],wardenPlate(D.lite,flash));
  glow(c,accent);bar(c,sx*1.05,y+3*scale,4*scale,2,accent);c.shadowBlur=0;
}
// Shared ground treatment: the painted and procedural bodies both plant on this.
function wardenGround(c,e,t,h){
  c.globalAlpha=.5;c.fillStyle='#03080e';c.beginPath();c.ellipse(0,1,h*.29,4.5,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
  if((e.charge||0)>0||(e.telegraph||0)>.35){for(let i=0;i<3;i++){const k=(t*3+i*.33)%1;c.globalAlpha=(1-k)*.16;c.fillStyle='#8ea6ae';c.beginPath();c.ellipse(-8-k*16,2+k*3,7+k*13,2+k*3,0,0,Math.PI*2);c.fill()}c.globalAlpha=1}
}
function wardenLabel(c,e,t,w,h){
  if(!e.active)return;
  const wind=clamp((e.telegraph||0)/(e.phase===1?.9:.78),0,1),core=e.phase===2?'#ffc17b':'#ff8f6a';
  c.font='bold 9px monospace';c.textAlign='center';
  c.fillStyle=wind>.05?'#ffe2d8':core;
  c.fillText(wind>.05?'WARDEN // INBOUND':(e.charge||0)>0?'WARDEN // CHARGE':'WARDEN // 09',e.x+w/2,e.y-14);
  if(wind>.05){c.globalAlpha=wind*.7;c.fillStyle='#ff2f45';c.fillRect(e.x+w/2-20,e.y-8,40*wind,2);c.globalAlpha=1}
  c.textAlign='left';
}
function warden(c,e,t){
  const w=e.w||64,h=e.h||86,dir=e.dir||1,D=WARDEN;
  // Painted boss art is the shipped look. Once the atlas is measured the geometric body
  // is unreachable, so nothing is ever drawn on top of the painted figure.
  if(wardenReady()){
    c.save();c.translate(e.x+w/2,e.y+h);c.scale(dir,1);
    wardenGround(c,e,t,h);
    drawWardenPainted(c,e,t);
    c.restore();
    wardenLabel(c,e,t,w,h);return;
  }
  const flash=clamp((e.flash||0)/.12,0,1);
  const wind=clamp((e.telegraph||0)/(e.phase===1?.9:.78),0,1);
  const charging=(e.charge||0)>0,enraged=e.phase===2;
  const recover=(!wind&&!charging&&(e.cooldown||0)>0)?clamp((e.cooldown||0)/1.35,0,1):0;
  const swing=charging?1:wind>0?wind*.55:recover*.5;
  const core=enraged?D.rage:D.core,coreHot=enraged?D.rageHot:D.coreHot;
  const shift=Math.sin(t*1.5)*1.1,brace=charging?.9:wind*.5+swing*.4;
  c.save();c.translate(e.x+w/2,e.y+h);c.scale(dir,1);
  wardenGround(c,e,t,h);
  // back leg then front leg: a wide, planted stance that widens under load
  const spread=15+brace*5,pump=charging?Math.sin(t*14)*4:0;
  wardenLeg(c,[-7,-44+pump*.2],[-spread*.72,-25-pump*.4],[-spread*.9+shift,-1],flash,core);
  wardenLeg(c,[-4,-44-pump*.2],[spread*.7,-24+pump*.4],[spread*.95-shift,-1],flash*.9,core);
  // hip block and skirt plates
  poly(c,[[-15,-52],[15,-52],[17,-40],[-17,-40]],wardenPlate(D.dark,flash));
  poly(c,[[-16,-48],[-3,-49],[-5,-34],[-18,-36]],wardenPlate(D.mid,flash));
  poly(c,[[3,-49],[16,-48],[18,-36],[5,-34]],wardenPlate(D.mid,flash));
  poly(c,[[-9,-47],[9,-47],[10,-38],[-10,-38]],wardenPlate(D.edge,flash*.4));
  for(let i=0;i<3;i++)bar(c,-13+i*9,-45,4,2,wardenPlate(D.trim,flash*.5));
  // torso: layered chest plate over a ribbed abdomen
  poly(c,[[-13,-56],[13,-56],[16,-44],[9,-38],[-9,-38],[-16,-44]],wardenPlate(D.dark,flash));
  for(let i=0;i<3;i++)bar(c,-9,-53+i*4,18,2,wardenPlate(D.edge,flash*.3));
  const lean=charging?-3:wind>0?2:recover*1.5;
  poly(c,[[-19,-76+lean*.3],[19,-76+lean*.3],[22,-64+lean],[13,-50],[-13,-50],[-22,-64+lean]],wardenPlate(D.mid,flash));
  poly(c,[[-15,-74+lean*.3],[2,-75+lean*.3],[0,-58],[-17,-60]],wardenPlate(D.lite,flash));
  poly(c,[[4,-75+lean*.3],[17,-73+lean*.3],[16,-59],[3,-58]],wardenPlate(D.dark,flash*.8));
  // side vents glow hotter through the wind-up
  glow(c,core);
  for(let i=0;i<3;i++){
    c.globalAlpha=.35+wind*.5;bar(c,-21,-70+i*5+lean*.3,4,2.4,core);
    c.globalAlpha=.35+wind*.5;bar(c,17,-70+i*5+lean*.3,4,2.4,core);
  }
  c.globalAlpha=1;c.shadowBlur=0;
  // reactor core, recessed behind an armoured iris
  poly(c,[[-8,-70+lean*.3],[8,-70+lean*.3],[10,-58+lean*.4],[-10,-58+lean*.4]],wardenPlate(D.edge,flash*.4));
  glow(c,coreHot);
  c.globalAlpha=.55+wind*.45;
  poly(c,[[-5,-67+lean*.3],[5,-67+lean*.3],[6,-61+lean*.4],[-6,-61+lean*.4]],core,null);
  c.globalAlpha=1;
  c.fillStyle=coreHot;c.beginPath();c.arc(0,-64+lean*.35,1.9+wind*1.5,0,Math.PI*2);c.fill();
  c.shadowBlur=0;
  bar(c,-10,-72+lean*.3,20,2,wardenPlate(D.trim,flash*.6));
  // exhaust stacks flare during the wind-up
  for(const s2 of [-1,1]){
    const ex=s2*13,ey=-76+lean*.3;
    poly(c,[[ex-s2*4,ey],[ex+s2*4,ey],[ex+s2*5,ey-13],[ex-s2*3,ey-13]],wardenPlate(D.dark,flash));
    glow(c,core);c.globalAlpha=.25+wind*.6;
    bar(c,ex-s2*2,ey-12,4,2,core);c.globalAlpha=1;c.shadowBlur=0;
  }
  // shoulders clamp in as the strike loads
  const clampIn=brace*3;
  wardenPauldron(c,-1,-70+lean*.3+clampIn*.2,1.02,flash,core,enraged);
  wardenPauldron(c,1,-70+lean*.3+clampIn*.2,1.16,flash,core,enraged||e.phase===1);
  // rear arm: braced ram-gauntlet
  seg(c,[-15,-68+lean*.3],[-24,-54],6,wardenPlate(D.dark,flash));
  poly(c,[[-30,-56],[-19,-58],[-17,-46],[-29,-45]],wardenPlate(D.mid,flash));
  bar(c,-29,-52,10,2,wardenPlate(D.trim,flash*.5));
  glow(c,core);bar(c,-27,-49,5,2,core);c.shadowBlur=0;
  // head: recessed helm with a single red visor slit
  const hy=-80+lean*.4;
  poly(c,[[-11,hy-6],[10,hy-7],[14,hy+2],[8,hy+9],[-8,hy+8],[-13,hy+1]],wardenPlate(D.dark,flash));
  poly(c,[[-9,hy-4],[11,hy-5],[12,hy+1],[7,hy+6],[-7,hy+5],[-11,hy]],wardenPlate(D.lite,flash));
  poly(c,[[-8,hy-1],[11,hy-2],[10,hy+5],[-7,hy+4]],wardenPlate(D.edge,flash*.4));
  glow(c,D.visor);
  const vw=enraged?4:2.6;
  bar(c,-7,hy+1,17,vw,D.visorHot);
  bar(c,-7,hy+1,17,1.4,D.visor);
  if(enraged)bar(c,-.6,hy-1,1.6,vw+2,'#1b2733');
  c.globalAlpha=.5+wind*.5;
  glow(c,D.visor);
  poly(c,[[-8,hy-2],[12,hy-3],[13,hy-1],[-9,hy]],D.visorHot,null);
  c.globalAlpha=1;c.shadowBlur=0;
  bar(c,-13,hy-6,5,3,wardenPlate(D.mid,flash));
  seg(c,[12,hy-4],[17,hy-11],1.6,wardenPlate(D.trim,flash*.5));
  c.fillStyle=enraged?D.rage:D.visor;c.fillRect(17,hy-13,2,2);
  // front arm + mass-driver cleaver
  const sh=[16,-68+lean*.3],el=[25,-56-swing*5],gr=[24,-46+swing*7];
  seg(c,sh,el,7,wardenPlate(D.dark,flash));
  poly(c,[[el[0]-4,el[1]-3],[el[0]+4,el[1]-2],[el[0]+3,el[1]+5],[el[0]-4,el[1]+4]],wardenPlate(D.lite,flash));
  seg(c,el,gr,6,wardenPlate(D.mid,flash));
  const ang=charging?.62:wind>.05?-1.05-wind*1.25:.55+recover*.3;
  c.save();c.translate(gr[0],gr[1]);c.rotate(ang);
  poly(c,[[-4,-5],[10,-7],[44,-9],[50,-4],[50,4],[44,9],[10,7],[-4,5]],wardenPlate(D.blade,flash));
  poly(c,[[-4,-5],[10,-7],[44,-9],[50,-4],[8,-1],[-2,-1]],wardenPlate(D.lite,flash));
  bar(c,6,-7,3,14,wardenPlate(D.edge,flash*.4));
  bar(c,40,-8,2,16,D.bladeEdge);
  bar(c,42,-7,2,14,wardenPlate(core,flash));
  if(enraged){poly(c,[[16,-9],[22,-20],[28,-9]],wardenPlate(D.lite,flash))}
  glow(c,enraged?D.rage:D.core);
  c.globalAlpha=.2+wind*.4;bar(c,12,-2,34,4,enraged?D.rage:D.core);c.globalAlpha=1;c.shadowBlur=0;
  c.restore();
  c.restore();
  wardenLabel(c,e,t,w,h);
}
// ------------------------------------------------------------------ drones
// Compact surveillance machines: ducted rotors, a gimballed sensor lens and a
// district livery so each patrol reads as Helix surveillance hardware.
const DACC=[null,'#ff4fd8','#c9d96a','#ff9a2e','#bff4ff'];
function district(e){const x=(e.x||0);return x<7200?0:x<8600?1:x<10000?2:x<11400?3:4}
function districtMark(c,a,flash){
  if(!a)return;
  bar(c,-9,-14,18,1.6,mixc(a,'#ffffff',flash*.4));
  glow(c,a);
  bar(c,-2,-11,4,4,a);
  c.shadowBlur=0;
  bar(c,-11,-11,3,4,a);
}
function drone(c,e,t){
  const w=e.w||38,accent=DACC[district(e)],flash=clamp((e.flash||0)/.12,0,1);
  const bob=Math.sin(t*4.2)*3,roll=Math.sin(t*1.7)*.08,spin=t*38;
  const alerted=(e.alert||0)>.5,burst=(e.burstLeft||0)>0;
  const body=flash>0?mixc('#3a4f5e','#ffd9cf',flash*.5):'#3a4f5e';
  const lite=flash>0?mixc('#7f97a5','#ffd9cf',flash*.5):'#7f97a5';
  c.save();c.translate(e.x+w/2,e.y+13+bob);c.rotate(roll);
  // ducted rotors
  for(const s of[-1,1]){
    const rx=s*17,ry=-9;
    seg(c,[s*7,-4],[rx*.8,ry],2.6,'#2b3d4a');
    c.globalAlpha=.55;c.strokeStyle='#8fb6c2';c.lineWidth=1.6;
    c.beginPath();c.ellipse(rx,ry,7,6,0,0,Math.PI*2);c.stroke();
    c.globalAlpha=.28;c.fillStyle='#7fd4dd';c.beginPath();c.ellipse(rx,ry,6,5,0,0,Math.PI*2);c.fill();
    c.globalAlpha=.95;
    for(let i=0;i<3;i++){
      const a=spin+i*2.094;
      seg(c,[rx+Math.cos(a)*1.5,ry+Math.sin(a)*1.5],[rx+Math.cos(a)*5.4,ry+Math.sin(a)*4.2],1.3,lite,null);
    }
    c.fillStyle='#22323d';c.beginPath();c.arc(rx,ry,1.8,0,Math.PI*2);c.fill();
    c.globalAlpha=1;
    bar(c,rx-7,ry-6,2,2,accent||'#8fb6c2');
  }
  // chassis
  poly(c,[[-11,-9],[9,-10],[14,-5],[13,5],[-12,6],[-15,-2]],body);
  poly(c,[[-9,-8],[7,-9],[10,-4],[-11,-3]],lite);
  poly(c,[[-11,2],[12,1],[11,6],[-12,7]],'#22323d');
  bar(c,-4,-16,8,6,body);
  poly(c,[[-4,-16],[4,-16],[6,-11],[-6,-11]],lite);
  districtMark(c,accent,flash);
  bar(c,10,-8,3,5,alerted?'#ff5b46':'#5f7c88');
  if(alerted){glow(c,'#ff5b46');bar(c,10,-7,2,3,'#ff9c86');c.shadowBlur=0}
  // sensor gimbal with a lens that tracks the aim point
  const sa=e.aim?Math.atan2(e.aim.y-(e.y+16),e.aim.x-(e.x+w/2)):0;
  const lx=-2+Math.cos(sa)*5,ly=7+Math.sin(sa)*3;
  seg(c,[0,2],[lx,ly],2.4,'#2b3d4a');
  poly(c,[[lx-5,ly-4],[lx+5,ly-4],[lx+6,ly+4],[lx-6,ly+4]],'#243544');
  poly(c,[[lx-4,ly-3],[lx+4,ly-3],[lx+5,ly+3],[lx-5,ly+3]],'#16232f');
  glow(c,burst?'#ffffff':alerted?'#ff6f8d':'#7fe8f0');
  c.fillStyle=burst?'#ffffff':alerted?'#ffb0c0':'#cffbff';
  c.beginPath();c.arc(lx,ly,2.1,0,Math.PI*2);c.fill();
  c.shadowBlur=0;
  if(alerted){
    c.globalAlpha=.16+(burst?.2:0);
    c.fillStyle=burst?'#ffffff':'#7fe8f0';
    c.beginPath();c.moveTo(lx,ly);
    c.lineTo(lx+Math.cos(sa-.34)*34,ly+Math.sin(sa-.34)*34);
    c.lineTo(lx+Math.cos(sa+.34)*34,ly+Math.sin(sa+.34)*34);
    c.closePath();c.fill();
    c.globalAlpha=1;
  }
  // whip antenna and landing skid
  seg(c,[9,-6],[15,-19],1.1,'#8fb6c2',null);
  c.fillStyle=Math.sin(t*6)>0?'#8ff2d8':'#2f6f60';c.fillRect(15,-21,2,2);
  bar(c,-6,7,11,2,'#1d2b36');
  c.restore();
}

const palette={blade:'#79f6ed',ghost:'#c398ff',tank:'#ffc279',gun:'#ff7894'};
export function drawCivilian(c,e,t){drawResident(c,e,t);}
export function drawActor(c,e,t,player=false,build=e.build||'blade',ghost=false){
  if(e.type==='drone'){drone(c,e,t);return;}
  if(e.type==='boss'){warden(c,e,t);return;}
  drawHuman(c,e,t,player,build,ghost);
  if(ghost||e.dead)return;
  const x=e.x+(e.w||28)/2,y=e.y+(e.h||54)/2,accent=palette[build]||'#a8dace';
  c.save();
  if(player&&(e.parry>0||e.barrier>0)){c.globalAlpha=.65;ring(c,x,y,37,e.parry>0?'#f4e5b9':accent,2);}
  if(!player){
    // damage flash: additive bloom over the figure, detail stays readable
    const fl=clamp((e.flash||0)/.12,0,1);
    if(fl>0){
      const ew=e.w||28,eh=e.h||54,g=c.createRadialGradient(x,y+eh*.1,2,x,y+eh*.1,eh*.72);
      g.addColorStop(0,`rgba(255,236,226,${.5*fl})`);g.addColorStop(1,'rgba(255,236,226,0)');
      c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;
      c.beginPath();c.ellipse(x,y+eh*.1,ew*.85,eh*.56,0,0,Math.PI*2);c.fill();c.restore();
    }
    c.font='bold 12px monospace';c.textAlign='center';
    if(e.stun>0){c.fillStyle='#caacff';c.fillText('×',x,e.y-9);}
    else if(e.alert>.5){c.fillStyle=e.targetId==='player'?'#ffc188':e.color||'#a5bdc7';c.fillText('!',x,e.y-9);}
    if(e.hp<e.maxHp){bar(c,e.x-3,e.y-5,(e.w||28)+6,3,'#091620');bar(c,e.x-3,e.y-5,((e.w||28)+6)*Math.max(0,e.hp/e.maxHp),2,e.color||'#ed9783');}
  }
  c.restore();
}
export function drawPortrait(c,build,x,y,scale=3,time=0){c.save();c.translate(x,y);c.scale(scale,scale);drawActor(c,{x:-14,y:-54,w:28,h:54,dir:1,vx:0,grounded:true,build,aimAngle:-.32},time,true,build);c.restore()}
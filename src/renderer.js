import {drawActor,drawPortrait} from './actors.js';
// Original procedural art for NULL // RAIN. All coordinates are world pixels.
const C={ink:'#070d18',metal:'#182333',edge:'#3b5060',cyan:'#71f8f3',pink:'#ff547f',amber:'#ffc078'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function line(c,x,y,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
function path(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
function glow(c,x,y,r,color,alpha=.24){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.globalAlpha=1}
function text(c,s,x,y,color='#b7c9d2',size=11,align='left'){c.font=`${size}px "Courier New", monospace`;c.textAlign=align;c.fillStyle=color;c.fillText(s,x,y);c.textAlign='left'}
let skyline;
let panorama;
if(typeof Image!=='undefined'){panorama=new Image();panorama.src=new URL('../assets/skyline.png',import.meta.url).href;}
function getSkyline(){
  if(skyline||typeof document==='undefined')return skyline;
  skyline=document.createElement('canvas');skyline.width=2400;skyline.height=1100;const c=skyline.getContext('2d');
  const g=c.createLinearGradient(0,0,0,1100);g.addColorStop(0,'#071320');g.addColorStop(.48,'#172739');g.addColorStop(1,'#103137');c.fillStyle=g;c.fillRect(0,0,2400,1100);
  for(let layer=0;layer<3;layer++)for(let i=0;i<34;i++){
    const x=i*78+hash(i+layer*51)*30,w=45+hash(i+11)*90,h=100+hash(i+layer*75)*540,y=950-h+layer*38;
    rect(c,x,y,w,h+200,['#152333','#101c2c','#0a1725'][layer]);
    rect(c,x+5,y-5,w*.64,6,'#203042');
    if(i%5===0){line(c,x+w*.6,y,x+w*.6,y-80,'#253948',2);rect(c,x+w*.6-2,y-80,4,4,'#ed6379')}
    for(let wy=y+16;wy<1000;wy+=16)for(let wx=x+9;wx<x+w-6;wx+=11){const a=hash(wx*wy+layer);if(a>.6)rect(c,wx,wy,3+hash(wx)*3,5,a>.93?'#c88b61':a>.8?'#357278':'#27424f')}
    if(layer===2&&i%4===0){const cy=y+60;rect(c,x+w-10,cy,15,88,'#1d3a44');for(let a=0;a<5;a++)rect(c,x+w-7,cy+7+a*16,9,7,i%8===0?'#ef698d':'#4da9ab')}
  }
  return skyline;
}
function background(c,s,w,h){
  rect(c,0,0,w,h,C.ink);const t=s.time||0,cam=s.camera||{x:0,y:0};const sky=getSkyline();
  if(sky){const bx=-(cam.x*.16)%2400,by=-120-cam.y*.09;for(let k=-1;k<3;k++)c.drawImage(sky,bx+k*2400,by,2400,1100)}
  if(panorama?.complete&&panorama.naturalWidth){
    // Alternating mirrored tiles have continuous edges without a hard repeat seam.
    const ph=Math.max(h*1.16,840),pw=ph*panorama.naturalWidth/panorama.naturalHeight;
    const shift=cam.x*.13,first=Math.floor(shift/pw)-1,by=-ph*.12-cam.y*.025;
    c.save();c.globalAlpha=.82;
    for(let i=first;i<(shift+w)/pw+1;i++){const x=i*pw-shift;c.save();if(Math.abs(i)%2){c.translate(x+pw,by);c.scale(-1,1);c.drawImage(panorama,0,0,pw,ph)}else c.drawImage(panorama,x,by,pw,ph);c.restore()}
    c.restore();
  }
  glow(c,w*.72,h*.2,360,'#335777',.22);glow(c,w*.15,h*.8,360,'#1d797f',.17);
  // The middle distance carries cranes, viaducts and irregular aerial cables.
  const px=cam.x*.34,py=cam.y*.2;
  for(let i=Math.floor(px/550)-1;i<(px+w)/550+1;i++){
    const x=i*550-px,y=420+hash(i)*130-py;
    rect(c,x,y,14,700,'#0c1823');rect(c,x-55,y,250,9,'#1c303a');line(c,x,y,x+140,y-88,'#1b3442',5);line(c,x+140,y-88,x+250,y,'#1b3442',3);
    c.strokeStyle='#0a1621';c.lineWidth=3;c.beginPath();c.moveTo(x-250,y-70);c.quadraticCurveTo(x,y+80,x+300,y-70);c.stroke();
    if(i%2===0){rect(c,x+100,y+45,75,25,'#132d3a');text(c,'KINETIC',x+108,y+61,'#34727b',10)}
  }
  const fog=c.createLinearGradient(0,h*.3,0,h);fog.addColorStop(0,'transparent');fog.addColorStop(1,'#0a29333a');c.fillStyle=fog;c.fillRect(0,0,w,h);
  c.globalAlpha=.13;for(let i=0;i<92;i++){const x=(hash(i)*w-t*95)%w,y=(hash(i+400)*h+t*410)%h;line(c,x,y,x-8,y+26,'#9dc3d7',.7)}c.globalAlpha=1;
}
function platform(c,p){
  const {x,y,w,h}=p,solid=p.kind==='solid';
  rect(c,x,y,w,h,solid?'#101924':'#152332');rect(c,x,y,w,4,'#66818b');rect(c,x,y+4,w,3,'#273e4a');
  if(h>28){rect(c,x+3,y+10,w-6,Math.max(2,h-13),'#101b29');for(let a=x+12;a<x+w;a+=76){line(c,a,y+12,a+56,Math.min(y+h-6,y+56),'#253240',2);line(c,a+56,y+12,a,Math.min(y+h-6,y+56),'#1c2b3a',2)}
    for(let a=x+8;a<x+w;a+=120){rect(c,a,y+9,3,3,'#81939b');rect(c,a,y+h-8,3,3,'#344959')}
  }else{for(let a=x+8;a<x+w;a+=60)rect(c,a,y+9,36,3,'#26394a')}
  if(w>160){line(c,x+12,y+2,x+w-12,y+2,'#9ad1d0',.6);for(let a=x+30;a<x+w-20;a+=100){const len=12+hash(a)*40;rect(c,a,y-2,len,2,'#74bcc47a')}}
  if(solid&&h>150){for(let a=x+32;a<x+w-60;a+=180){const wy=y+45;rect(c,a,wy,98,66,'#07111a');rect(c,a+4,wy+4,90,57,'#1d393d');for(let k=0;k<3;k++){rect(c,a+9+k*28,wy+9,23,42,k===1?'#c38d5360':'#547a7560')}rect(c,a+2,wy+62,94,5,'#41505a');line(c,a+49,wy+3,a+49,wy+60,'#0b1723',4);text(c,'住居  /  SECTOR 07',a+3,wy+84,'#455b64',8)}}
}
function sign(c,d,t){
  const x=d.x||0,y=d.y||0,w=d.w||160,h=d.h||46,color=d.color||C.cyan;
  glow(c,x+w*.5,y+h*.5,Math.max(w,h)*.75,color,.07);rect(c,x,y,w,h,'#09131e');c.strokeStyle=color;c.lineWidth=1;c.strokeRect(x+3,y+3,w-6,h-6);rect(c,x+7,y+7,3,h-14,color);
  const labels=(d.text||d.label||'夜  /  NIGHT MARKET').split('\n');labels.forEach((label,i)=>text(c,label,x+w*.5,y+h*.5+(i-(labels.length-1)/2)*20+4,color,Math.min(22,Math.max(10,w/(label.length*.7))), 'center'));
  if(hash(Math.floor(t*5)+x)>.97)rect(c,x,y+h*.5,w,4,'#07101ed0');
}
function decoration(c,d,t){
  const {x=0,y=0,w=100,h=60}=d;
  if(d.type==='building'){
    // Service towers frame large open views instead of covering the panorama.
    const sw=Math.min(66,w*.18),sx=hash(x)>.5?x:x+w-sw;
    rect(c,sx,y,sw,h,'#0b1722dc');rect(c,sx,y,sw,5,'#3a4d57');line(c,sx+sw-8,y,sx+sw-8,y+h,'#344955',3);
    for(let yy=y+30;yy<y+h-30;yy+=94){rect(c,sx+8,yy,sw-23,32,'#172e39');rect(c,sx+12,yy+4,sw-31,22,hash(yy+x)>.6?'#cf925554':'#3b999c45');rect(c,sx+7,yy+33,sw-20,3,'#48636b');line(c,sx+4,yy+45,sx+sw-4,yy+88,'#34424b',2)}
    line(c,x,y+4,x+w,y+4,'#233c4b',3);return;
  }
  if(d.type==='shop'){
    const color=d.color||C.amber;rect(c,x,y,w,h,'#14202a');rect(c,x+8,y+25,w-16,h-30,'#07151d');
    rect(c,x+14,y+31,w*.62,h-43,'#a8784447');for(let xx=x+18;xx<x+w*.65;xx+=28){line(c,xx,y+31,xx,y+h-12,'#263d43',3);rect(c,xx+5,y+h-37,16,13,'#99745a');rect(c,xx+7,y+h-42,11,5,'#b9a386')}
    rect(c,x+w*.73,y+28,w*.2,h-34,'#21353a');rect(c,x+w*.75,y+36,w*.16,h*.25,'#357074');line(c,x+w*.9,y+h*.65,x+w*.94,y+h*.65,color,2);
    sign(c,{x,y,w,h:23,text:d.text||'夜市  /  OPEN LATE',color},t);path(c,[[x-7,y+23],[x+w+7,y+23],[x+w+15,y+43],[x-15,y+43]],'#3b4650');for(let xx=x;xx<x+w;xx+=24)line(c,xx,y+25,xx-7,y+42,'#596267',6);
    glow(c,x+w*.35,y+h-10,w*.8,color,.1);text(c,'24H   ·   CASH / CREDIT',x+15,y+h-10,color,8);return;
  }
  if(d.type==='lantern'){line(c,x+w/2,y-14,x+w/2,y,'#3e5159',1);glow(c,x+w/2,y+h/2,65,d.color||C.amber,.22);rect(c,x,y,w,h,d.color||'#e5a567');rect(c,x-2,y,w+4,3,'#3b2730');rect(c,x-2,y+h-3,w+4,3,'#3b2730');for(let a=x+4;a<x+w;a+=6)line(c,a,y+3,a,y+h-3,'#98613c',1);return}
  if(['sign','billboard','neon'].includes(d.type))return sign(c,d,t);
  if(d.type==='wire'||d.type==='cable'){c.strokeStyle=d.color||'#060e19';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+w*.5,y+h,x+w,y);c.stroke();return}
  if(d.type==='pipe'){rect(c,x,y,w,h,'#172937');rect(c,x+3,y,w>h?w-6:3,h> w?h:3,'#46606a');for(let a=0;a<(w>h?w:h);a+=64)rect(c,x+(w>h?a:0),y+(w>h?0:a),w>h?5:w,h>w?5:h,'#3c505b');return}
  if(d.type==='window'){rect(c,x,y,w,h,'#384541');rect(c,x+4,y+4,w-8,h-8,d.color||'#ad744449');for(let a=x+24;a<x+w;a+=30)line(c,a,y,a,y+h,'#071722',4);rect(c,x-4,y+h,w+8,5,'#40535c');return}
  if(d.type==='vent'){rect(c,x,y,w,h,'#22313c');for(let a=y+5;a<y+h;a+=6)rect(c,x+4,a,w-8,2,'#091723');return}
  if(d.type==='crate'){rect(c,x,y,w,h,'#263b42');c.strokeStyle='#476168';c.strokeRect(x+4,y+4,w-8,h-8);line(c,x+5,y+5,x+w-5,y+h-5,'#172830',3);text(c,'物流',x+9,y+h-10,'#70908c',11);return}
  if(d.type==='antenna'){line(c,x,y+h,x,y,'#3a4d5b',3);line(c,x-18,y+10,x+18,y+10,'#3a4d5b',2);rect(c,x-2,y-2,4,4,C.pink);return}
  if(d.type==='lamp'){line(c,x,y,x,y+h,'#33444e',3);rect(c,x-15,y+h,30,5,d.color||C.amber);glow(c,x,y+h+10,90,d.color||C.amber,.15);return}
  if(d.type==='awning'){path(c,[[x,y],[x+w,y],[x+w+15,y+h],[x-15,y+h]],d.color||'#41433c');for(let a=x;a<x+w;a+=25)line(c,a,y,a-7,y+h,'#102329',6);return}
}
function interactable(c,o,t,player){
  const {x,y}=o,color=o.done?'#42776c':o.type==='upgrade'?C.pink:o.type==='cache'?C.amber:C.cyan;
  if(['health','energy','shard'].includes(o.type)){
    if(o.done)return;const yy=y-24+Math.sin(t*3+x)*4,pc=o.type==='health'?'#a6fca5':o.type==='energy'?C.cyan:'#c69aff';
    glow(c,x,yy,30,pc,.12);path(c,[[x,yy-15],[x+12,yy],[x,yy+15],[x-12,yy]],'#112733');c.strokeStyle=pc;c.lineWidth=1;c.beginPath();c.arc(x,yy,17,0,Math.PI*2);c.stroke();
    if(o.type==='health'){rect(c,x-3,yy-8,6,16,pc);rect(c,x-8,yy-3,16,6,pc)}else if(o.type==='energy')path(c,[[x+2,yy-10],[x-7,yy+2],[x,yy+2],[x-2,yy+10],[x+8,yy-3],[x+1,yy-3]],pc);else{path(c,[[x,yy-9],[x+6,yy],[x,yy+9],[x-6,yy]],pc);line(c,x,yy-6,x,yy+6,'#faf3ff',1)}return;
  }
  if(o.type==='terminal'){rect(c,x-16,y-50,32,50,'#233445');rect(c,x-12,y-46,24,23,'#071824');rect(c,x-9,y-43,18,2,color);for(let a=0;a<3;a++)rect(c,x-9,y-37+a*4,8+hash(a+x)*10,1,color);rect(c,x-10,y-17,20,2,'#63818a');glow(c,x,y-33,36,color,.12)}
  else if(o.type==='checkpoint'){line(c,x,y,x,y-72,'#334753',3);rect(c,x-18,y-73,36,20,'#152535');text(c,'SYNC',x,y-59,color,9,'center');c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.ellipse(x,y-2,30,6,0,0,Math.PI*2);c.stroke();}
  else if(o.type==='cache'){rect(c,x-23,y-26,46,26,'#33434b');rect(c,x-25,y-30,50,7,'#50606a');rect(c,x-5,y-26,10,6,color);text(c,'MK.04',x,y-9,'#92a4a8',8,'center')}
  else if(o.type==='upgrade'){rect(c,x-16,y-56,32,56,'#272333');rect(c,x-11,y-48,22,26,'#11232e');path(c,[[x,y-45],[x-7,y-32],[x+2,y-32],[x-3,y-22],[x+9,y-36],[x+1,y-36]],color);glow(c,x,y-35,42,color,.1)}
  else if(o.type==='exit'){rect(c,x-32,y-90,64,90,'#193842');rect(c,x-26,y-84,52,84,'#0a1927');line(c,x-25,y-81,x+25,y-81,color,3);text(c,'↑ EXIT',x,y-97,color,12,'center')}
  else {rect(c,x-10,y-22,20,22,'#29333e');text(c,'≡',x,y-6,color,18,'center')}
  if(!o.done){const a=.55+Math.sin(t*3+x)*.2;c.globalAlpha=a;text(c,o.type==='terminal'?'⌘':o.type==='cache'?'◇':'◈',x,y-80,color,15,'center');c.globalAlpha=1}
  const near=player&&Math.hypot(player.x+14-x,player.y+54-y)<100;
  if(near){const label=o.done?'COMPLETE':`[ E ] ${o.label||o.type.toUpperCase()}`;c.font='11px "Courier New",monospace';const ww=c.measureText(label).width+20;rect(c,x-ww/2,y-111,ww,23,'#08111eed');text(c,label,x,y-95,o.done?'#77958e':color,11,'center')}
}
const actor=drawActor;
export const renderPortrait=drawPortrait;
export function renderDossier(c,build,x,y,scale=5,time=0){drawPortrait(c,build,x,y,scale,time)};
function telegraph(c,e,t){
  if(e.dead||!e.active&&e.type==='boss'||!(e.telegraph>0||e.charge>0))return;
  const x=e.x+(e.w||28)/2,y=e.y+(e.h||54)*.4,dir=e.chargeDir||e.dir||1;
  if(e.type==='boss'){
    const color=e.phase===2?C.amber:C.pink,foot=e.y+e.h;
    if(e.phase===1||e.charge>0){const left=dir>0?x:x-390;c.globalAlpha=.13+.07*Math.sin(t*22);rect(c,left,foot-12,390,12,color);c.globalAlpha=1;line(c,left,foot-3,left+390,foot-3,color,2);for(let a=0;a<6;a++){const xx=x+dir*(a*55+20);line(c,xx-dir*9,foot-10,xx,foot-5,color,2);line(c,xx,foot-5,xx-dir*9,foot,color,2)}text(c,'CHARGE',x, e.y-34,color,11,'center')}
    else{c.setLineDash([5,5]);c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,e.phase===2?116:80,-Math.PI,0);c.stroke();c.setLineDash([]);if(e.phase===2)for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;line(c,x+Math.cos(a)*44,y+Math.sin(a)*44,x+Math.cos(a)*100,y+Math.sin(a)*100,'#ffbe7355',2)}text(c,e.phase===2?'BURST':'TRIAD',x,e.y-34,color,11,'center')}
    glow(c,x,y,70,color,.14);
  }else if(e.aim){c.save();c.globalAlpha=.45+.2*Math.sin(t*25);c.setLineDash([5,8]);line(c,x,y,e.aim.x,e.aim.y,C.pink,1);c.setLineDash([]);c.strokeStyle=C.pink;c.beginPath();c.arc(e.aim.x,e.aim.y,9,0,Math.PI*2);c.stroke();line(c,e.aim.x-14,e.aim.y,e.aim.x+14,e.aim.y,C.pink);line(c,e.aim.x,e.aim.y-14,e.aim.x,e.aim.y+14,C.pink);c.restore()}
}
function steam(c,d,t){
  const x=d.x+d.w/2,y=d.y;
  for(let i=0;i<5;i++){const k=(t*.24+i*.2+hash(d.x))%1,xx=x+k*30+Math.sin(t+i)*7,yy=y-k*92,r=7+k*18;c.globalAlpha=(1-k)*.045;c.fillStyle='#c5e2e6';c.beginPath();c.ellipse(xx,yy,r*1.4,r,Math.sin(k),0,Math.PI*2);c.fill()}c.globalAlpha=1;
}
function combatSlash(c,e,ratio){
  const angle=Number.isFinite(e.angle)?e.angle:e.downward?Math.PI/2:e.dir<0?Math.PI:0,r=e.r||70,combo=e.combo||1;
  c.save();c.translate(e.x,e.y);c.rotate(angle);c.scale(1,combo===2?.65:1);
  for(let i=0;i<4;i++){
    const rr=r-i*6;c.globalAlpha=ratio*(1-i*.21);c.strokeStyle=i===0?'#f1fff8':e.color||'#81f9ed';c.lineWidth=i===0?2:5-i;c.beginPath();c.arc(0,0,rr,-1.35+i*.12,1.3-i*.1);c.stroke();
  }
  c.globalAlpha=ratio*.3;c.fillStyle=e.color||'#88fbea';c.beginPath();c.arc(0,0,r,-1.2,1.1);c.arc(0,0,r*.65,1.1,-1.2,true);c.closePath();c.fill();
  for(let i=0;i<5;i++){const a=-1.1+i*.48;line(c,Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+13),Math.sin(a)*(r+13),'#d9fff8',1)}c.restore();
}
export function render(c,s,width,height){
  const world=s.world||{},cam=s.camera||{x:0,y:0},t=s.time||0,p=s.player;
  c.save();background(c,s,width,height);c.translate(-cam.x,-cam.y);
  const visible=(o,pad=100)=>o.x+(o.w||60)>cam.x-pad&&o.x<cam.x+width+pad&&o.y+(o.h||100)>cam.y-pad&&o.y<cam.y+height+pad;
  // Architecture behind gameplay geometry: service cables and sodium lights.
  for(const z of world.zones||[]){if(z.x+z.w<cam.x||z.x>cam.x+width)continue;const y=world.height?world.height-490:1900;glow(c,z.x+z.w/2,y,Math.min(600,z.w*.6),z.color||'#22bcc4',.04)}
  for(const d of world.decorations||[])if(visible(d,300))decoration(c,d,t);
  for(const sh of world.shadows||[]){if(!visible(sh))continue;rect(c,sh.x,sh.y,sh.w,sh.h,'#02091480');line(c,sh.x+5,sh.y+sh.h-3,sh.x+sh.w-5,sh.y+sh.h-3,'#578d9450',2);for(let a=sh.x+10;a<sh.x+sh.w;a+=30)line(c,a,sh.y+sh.h-7,a+10,sh.y+sh.h-7,'#46616e',1);if(p&&Math.abs(p.x+14-(sh.x+sh.w/2))<sh.w/2+120&&Math.abs(p.y+54-sh.y-sh.h)<100)text(c,'◐ SHADOW',sh.x+sh.w/2,sh.y+sh.h-17,'#89b6bc',10,'center')}
  for(const pl of world.platforms||[])if(visible(pl))platform(c,pl);
  for(const l of world.ladders||[]){if(!visible(l))continue;line(c,l.x+3,l.y,l.x+3,l.y+l.h,'#688a8d',3);line(c,l.x+l.w-3,l.y,l.x+l.w-3,l.y+l.h,'#688a8d',3);for(let yy=l.y+10;yy<l.y+l.h;yy+=15)line(c,l.x+3,yy,l.x+l.w-3,yy,'#8cafab',2);rect(c,l.x-4,l.y-4,l.w+8,4,C.amber);text(c,'↑',l.x+l.w/2,l.y-14,C.amber,18,'center')}
  for(const g of world.gates||[]){if(!visible(g))continue;if(g.open){line(c,g.x,g.y,g.x+g.w,g.y,'#42bdb2',3);continue}rect(c,g.x,g.y,g.w,g.h,'#182a38');for(let yy=g.y+4;yy<g.y+g.h;yy+=12){rect(c,g.x+3,yy,g.w-6,3,'#4b6470');if((yy-g.y)%24<12)rect(c,g.x+5,yy,6,3,C.pink)}rect(c,g.x+g.w*.5-6,g.y+g.h*.5-18,12,36,'#1e1427');text(c,'×',g.x+g.w*.5,g.y+g.h*.5+5,C.pink,23,'center')}
  for(const e of s.enemies||[]){if(e.dead||!visible(e,350))continue;if(e.stun>0)continue;const ex=e.x+(e.w||28)/2,ey=e.y+(e.type==='drone'?15:17),r=e.viewRange||(e.type==='sniper'?440:e.type==='drone'?270:235),a=e.dir<0?Math.PI:0;const vg=c.createRadialGradient(ex,ey,0,ex,ey,r);vg.addColorStop(0,e.alert>.5?'#ff60732e':'#efbf681e');vg.addColorStop(1,'transparent');c.fillStyle=vg;c.beginPath();c.moveTo(ex,ey);c.arc(ex,ey,r,a-.45,a+.45);c.closePath();c.fill();}
  for(const o of world.interactables||[])if(visible({x:o.x-100,y:o.y-120,w:200,h:150}))interactable(c,o,t,p);
  for(const o of world.interactables||[])if(o.id?.startsWith('security-')&&visible({x:o.x,y:o.y-80,w:40,h:90})){
    const hot=s.security?.level>0&&!(s.security?.suppressed>0),col=hot?'#ff647c':'#80e0c9';
    rect(c,o.x-7,o.y-63,14,8,col);if(hot){glow(c,o.x,o.y-60,55,col,.14+Math.sin(t*5)*.08);}text(c,'ALARM',o.x,o.y-74,col,9,'center');
  }
  for(const e of s.enemies||[])if(visible(e))actor(c,e,t);
  for(const e of s.enemies||[])if(visible(e,400))telegraph(c,e,t);
  if(p){if(p.dashTimer>0||p.rush>0||s.slowTime>0){for(let a=3;a>=1;a--){c.save();c.translate(-(p.dir||1)*a*17,a);c.globalAlpha=.6*(1-a/4);drawActor(c,p,t-a*.04,true,p.build,true);c.restore()}}actor(c,p,t,true,p.build);if(p.hidden){c.strokeStyle='#78f5d949';c.setLineDash([3,5]);c.strokeRect(p.x-6,p.y-6,(p.w||28)+12,(p.h||54)+12);c.setLineDash([])}}
  for(const bullet of s.projectiles||[]){if(!visible({x:bullet.x,y:bullet.y,w:5,h:5},50))continue;line(c,bullet.x,bullet.y,bullet.x-(bullet.vx||0)*.024,bullet.y-(bullet.vy||0)*.024,bullet.color||C.amber,2);rect(c,bullet.x-2,bullet.y-2,4,4,'#fff7d8')}
  for(const e of s.effects||[]){const ratio=clamp((e.life||0)/(e.maxLife||.5),0,1),r=e.r||60;c.globalAlpha=ratio;if(e.type==='text'){text(c,e.text||'',e.x,e.y,e.color||C.cyan,14,'center')}else if(e.type==='slash'){combatSlash(c,e,ratio)}else if(e.type==='beam'){line(c,e.x,e.y,e.tx??(e.x+(e.dir||1)*r),e.ty??e.y,e.color||C.cyan,5);line(c,e.x,e.y,e.tx??(e.x+(e.dir||1)*r),e.ty??e.y,'#e9ffff',1)}else{c.strokeStyle=e.color||(e.type==='explosion'?C.amber:C.cyan);c.lineWidth=e.type==='noise'?1:3;c.beginPath();c.arc(e.x,e.y,r*(1-ratio*.7),0,Math.PI*2);c.stroke();if(e.type==='explosion'){c.fillStyle='#ffb562';c.globalAlpha=ratio*.25;c.fill()}}c.globalAlpha=1}
  for(const pt of s.particles||[]){c.globalAlpha=clamp((pt.life||0)/(pt.maxLife||1),0,1);rect(c,pt.x,pt.y,pt.size||2,pt.size||2,pt.color||C.cyan)}c.globalAlpha=1;
  for(const d of world.decorations||[])if(d.type==='vent'&&visible(d,120))steam(c,d,t);
  // Wet ledges catch moving highlights; near rain gives the image depth.
  for(const pl of world.platforms||[]){if(!visible(pl)||pl.w<160)continue;for(let a=0;a<Math.min(6,pl.w/70);a++){const x=pl.x+hash(a+pl.x)*pl.w;rect(c,x,pl.y+7,16+hash(a)*30,1,'#71c4d433')}}
  c.restore();
  c.save();c.globalAlpha=.23;for(let i=0;i<65;i++){const x=((hash(i+921)*width-t*160-cam.x*.17)%width+width)%width,y=((hash(i+98)*height+t*650-cam.y*.1)%height+height)%height;line(c,x,y,x-12,y+39,'#b4d4dd',1)}c.globalAlpha=1;
  const vignette=c.createRadialGradient(width/2,height/2,height*.2,width/2,height/2,width*.64);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#02071388');c.fillStyle=vignette;c.fillRect(0,0,width,height);
  if(s.slowTime>0){rect(c,0,0,width,2,C.cyan);rect(c,0,height-2,width,2,C.cyan);c.globalAlpha=.04;rect(c,0,0,width,height,C.cyan);c.globalAlpha=1}c.restore();
  if(s.security?.level>0&&!(s.security?.suppressed>0)&&s.mode!=='title'){c.save();c.globalAlpha=(s.security.level===2?.22:.1)*(.6+Math.sin(t*4)*.4);rect(c,0,0,width,3,'#ff617d');rect(c,0,height-3,width,3,'#ff617d');c.restore();}
}





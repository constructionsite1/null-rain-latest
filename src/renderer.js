import {drawTerritories,attacksPlayer} from './territories.js';
import {drawActor,drawPortrait,drawCivilian} from './actors.js';
import {drawStreet} from './street.js';
import {drawInterior} from './interiors.js';
import {captureTemporal,drawTemporal,drawEffect,drawFracture,preloadArt as preloadCharacters} from './combat-presentation.js';
import {preloadWorldArt,paintPanorama,paintSurface,drawLighting,drawAmbient,drawContacts,beginShadows,addContact,beginActorLayer,actorLayerContext,lightActorLayer,compositeActorLayer,worldArtStatus} from './world-lighting.js';
// Character atlases and world art settle together; either may be missing.
export function preloadArt(){
  return Promise.all([Promise.resolve(preloadCharacters()).catch(()=>null),Promise.resolve(preloadWorldArt()).catch(()=>null)]);
}
export {worldArtStatus};
// Original procedural art for NULL // RAIN. All coordinates are world pixels.
const C={ink:'#070d18',metal:'#182333',edge:'#3b5060',cyan:'#71f8f3',pink:'#ff547f',amber:'#ffc078'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function line(c,x,y,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
function path(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
function glow(c,x,y,r,color,alpha=.24){if(!Number.isFinite(x+y+r)||r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.globalAlpha=1}
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
// Districts: parallax city layers, cached once to offscreen canvases; animated overlays are drawn per frame.
const LW=7200,LH=620,CITY=[{f:.22,base:'#0b1623',sc:.8},{f:.4,base:'#0d1b29',sc:1},{f:.62,base:'#101f2e',sc:1.25}];
const district=wx=>wx<1800?0:wx<3300?1:wx<5100?2:3;
const NEON=['RAMEN 24','VOID BAR','NOODLE//09','SYNTH FIX','LOTUS INN','DATA SPA','CHROME CUTS','TEA & TECH','KIRIN-X','HALO LABS'];
let cityLayers;
function buildCity(){
  if(cityLayers||typeof document==='undefined')return cityLayers;
  cityLayers=CITY.map((L,li)=>{
    const W=Math.ceil(LW*L.f+1700),cv=document.createElement('canvas');cv.width=W;cv.height=LH;const c=cv.getContext('2d'),dyn=[];
    let lx=-20,i=0;
    while(lx<W){
      const sd=li*977+i*13.7,wx=lx/L.f,d=district(wx),r=k=>hash(sd+k),bw=(d===3?70+r(1)*90:d===2?90+r(1)*130:d===1?60+r(1)*70:55+r(1)*60)*L.sc;
      const bh=(d===3?260+r(2)*300:d===2?120+r(2)*170:d===1?90+r(2)*110:170+r(2)*210)*(.75+li*.12),y=LH-bh,x=lx;
      rect(c,x,y,bw,bh,L.base);rect(c,x,y,bw,3,'#25394a');rect(c,x+bw-4,y,4,bh,'#08121c');
      if(d===0){ // residential: lit windows, balconies, AC units, laundry lines
        for(let wy=y+14;wy<LH-10;wy+=20)for(let wx2=x+7;wx2<x+bw-10;wx2+=14){const a=hash(wx2*3.1+wy+sd);rect(c,wx2,wy,7,9,a>.78?'#d9a266':a>.6?'#3f9ba0':'#162a38');if(a>.9)rect(c,wx2-2,wy+10,11,2,'#4a6270');if(a<.1)rect(c,wx2+8,wy+3,6,5,'#5c6d76')}
        if(r(5)>.4){const ly=y+30+r(6)*60;line(c,x-6,ly,x+bw+6,ly+4,'#2a3d4a',1);for(let a=x;a<x+bw;a+=9)rect(c,a,ly+2,5,9+hash(a)*5,['#b45a6e','#4f8fa0','#c9a45c','#6a6fb0'][(a|0)%4])}
        rect(c,x+bw*.2,y-8,bw*.3,8,'#17293a');rect(c,x+bw*.3,y-22,3,14,'#2e4352');
      }else if(d===1){ // market: stalls, awnings, hanging lanterns
        const sy=LH-60;for(let a=x;a<x+bw;a+=30*L.sc){const col=['#b8485f','#2f8a8e','#c78a3a','#6a4fa0'][Math.floor(hash(a+sd)*4)];path(c,[[a,sy],[a+28*L.sc,sy],[a+32*L.sc,sy+14],[a-4,sy+14]],col);rect(c,a+2,sy+14,26*L.sc,30,'#0a141e');rect(c,a+6,sy+22,8,12,'#cf9a5e')}
        for(let wy=y+10;wy<sy-10;wy+=18)for(let wx2=x+6;wx2<x+bw-8;wx2+=13)rect(c,wx2,wy,6,8,hash(wx2+wy*7+sd)>.7?'#d1a161':'#17303c');
        const ll=y+6+r(7)*20;line(c,x-10,ll,x+bw+10,ll+10,'#2a3a46',1);for(let a=x;a<x+bw;a+=16){const col=hash(a)>.5?'#ff9a54':'#ff547f';glow(c,a,ll+12,14,col,.5);rect(c,a-3,ll+8,6,8,col)}
      }else if(d===2){ // industrial: tanks, pipes, cranes, stacks
        for(let wy=y+20;wy<LH-12;wy+=26)if(r(wy)>.3)for(let wx2=x+8;wx2<x+bw-10;wx2+=20)rect(c,wx2,wy,10,4,hash(wx2+wy)>.88?'#c58a55':'#1a2e3b');
        if(r(3)>.45){c.fillStyle='#14232f';c.beginPath();c.ellipse(x+bw*.5,y,bw*.34,18,0,Math.PI,0);c.fill();rect(c,x+bw*.16,y,bw*.68,34,'#14232f');for(let k=0;k<3;k++)rect(c,x+bw*.16,y+6+k*10,bw*.68,2,'#25394a')}
        for(let k=0;k<2;k++){const py=y+40+k*50+r(8+k)*20;rect(c,x-12,py,bw+24,6,'#1d3140');rect(c,x-12,py,bw+24,2,'#3c5668')}
        if(r(4)>.65){rect(c,x+bw-14,y-70,8,70,'#162836');rect(c,x+bw-14,y-70,8,5,'#ffb35e');dyn.push({k:'steam',x:x+bw-10,y:y-70})}
        if(r(9)>.7){const cx=x+bw*.3,cy=y-90;rect(c,cx,cy,5,90,'#1a2c3a');line(c,cx-70,cy+4,cx+90,cy+4,'#2b4254',3);line(c,cx+2,cy-26,cx-70,cy+4,'#2b4254',1);line(c,cx+2,cy-26,cx+90,cy+4,'#2b4254',1);line(c,cx+80,cy+4,cx+80,cy+44,'#41596a',1)}
      }else{ // corporate towers: glass grid, holo-billboards
        for(let wy=y+8;wy<LH-8;wy+=10)for(let wx2=x+4;wx2<x+bw-5;wx2+=8){const a=hash(wx2*1.7+wy*2.3+sd);rect(c,wx2,wy,5,6,a>.8?'#79eef0':a>.65?'#e4bd7e':'#10202e')}
        rect(c,x+bw*.4,y-24,2,24,'#2e4a5a');
        if(r(6)>.35&&li>0)dyn.push({k:'holo',x:x+bw*.5-26,y:y+30+r(7)*60,w:52,h:76,col:['#6af5ee','#ff547f','#c99bff'][Math.floor(r(8)*3)]});
      }
      if(r(10)>.5||d===3)dyn.push({k:'ant',x:x+bw*.5+r(11)*bw*.3,y:y-(d===3?24:8),p:r(12)*6});
      if(li>0&&r(13)>.62)dyn.push({k:'neon',x:x+3,y:y+bh*.3+r(14)*40,w:Math.min(bw-6,56),text:NEON[Math.floor(r(15)*NEON.length)],col:['#ff547f','#71f8f3','#ffc078','#c99bff'][Math.floor(r(16)*4)],p:r(17)*9});
      lx+=bw+(2+r(18)*8);i++;
    }
    const mist=c.createLinearGradient(0,LH-140,0,LH);mist.addColorStop(0,'transparent');mist.addColorStop(1,'#12363e66');c.fillStyle=mist;c.fillRect(0,LH-140,W,140);
    return {cv,dyn,f:L.f};
  });
  return cityLayers;
}
function city(c,s,w,h){
  const L=buildCity();if(!L)return;const t=s.time||0,cam=s.camera||{x:0,y:0};
  L.forEach((ly,li)=>{
    const ox=-cam.x*ly.f,oy=h-LH+60+li*34-cam.y*(.06+li*.03);
    c.globalAlpha=.55+li*.17;c.drawImage(ly.cv,ox,oy);c.globalAlpha=1;
    if(li===1)for(let k=0;k<3;k++){const sp=70+k*40,dir=k%2?-1:1,span=w+600,x=((t*sp*dir+k*913)%span+span)%span-300,y=oy+LH*.2+k*70+Math.sin(t+k)*5;rect(c,x,y,22,5,'#1b2b3a');rect(c,x+4,y-3,12,3,'#25394a');rect(c,x+(dir>0?20:0),y+1,3,2,'#ffe7a8');glow(c,x+(dir>0?-6:28),y+3,16,k%2?'#ff547f':'#71f8f3',.4)}
    for(const d of ly.dyn){const sx=d.x+ox;if(sx<-120||sx>w+120)continue;const sy=d.y+oy;
      if(d.k==='ant'){if((t*1.3+d.p)%2<.35){glow(c,sx,sy,9,'#ff3b5c',.8);rect(c,sx-1,sy-1,3,3,'#ff7a90')}}
      else if(d.k==='neon'){const fl=hash(Math.floor(t*(6+d.p%4))+d.p)>.12&&!(d.p>6&&hash(Math.floor(t*14)+d.p)>.5);if(fl){glow(c,sx+d.w/2,sy+6,d.w*.7,d.col,.22);c.globalAlpha=.55+li*.2;text(c,d.text,sx+d.w/2,sy+9,d.col,Math.min(11,d.w/(d.text.length*.62)),'center');c.globalAlpha=1}}
      else if(d.k==='holo'){const a=.14+.06*Math.sin(t*3+d.x);c.globalAlpha=a;rect(c,sx,sy,d.w,d.h,d.col);c.globalAlpha=a*2.5;for(let yy=sy;yy<sy+d.h;yy+=5)rect(c,sx,yy+((t*20)%5),d.w,1,d.col);c.strokeStyle=d.col;c.strokeRect(sx,sy,d.w,d.h);c.globalAlpha=1}
      else if(d.k==='steam'){for(let i=0;i<4;i++){const k=(t*.2+i*.25)%1;c.globalAlpha=(1-k)*.07;c.fillStyle='#bcd6dc';c.beginPath();c.arc(sx+k*14+Math.sin(t+i)*4,sy-k*60,5+k*14,0,Math.PI*2);c.fill()}c.globalAlpha=1}
    }
  });
}
// Puddle reflections on wet platform tops (world space, after gameplay geometry).
function puddles(c,world,cam,w,h,t){
  for(const pl of world.platforms||[]){if(pl.w<200||pl.x+pl.w<cam.x||pl.x>cam.x+w||pl.y<cam.y||pl.y>cam.y+h)continue;
    for(let k=0;k<Math.min(4,pl.w/160);k++){const px=pl.x+20+hash(k*7+pl.x)*(pl.w-110),pw=40+hash(k+pl.y)*50,col=['#71f8f3','#ff547f','#ffc078'][k%3];
      c.globalAlpha=.22;rect(c,px,pl.y+1,pw,2,'#3a7a88');c.globalAlpha=.1+.06*Math.sin(t*2+k);rect(c,px+pw*.2,pl.y+3,pw*.6,3,col);c.globalAlpha=.18;const rp=(t*.8+k*.37)%1;c.strokeStyle='#b4e4ee';c.lineWidth=1;c.beginPath();c.ellipse(px+pw*.5,pl.y+2,pw*.4*rp,2*rp,0,0,Math.PI*2);c.stroke();c.globalAlpha=1}}
}
function background(c,s,w,h){
  rect(c,0,0,w,h,C.ink);const t=s.time||0,cam=s.camera||{x:0,y:0};const sky=getSkyline();
  // Painted cinematic panorama is the far background when the shared world art has landed;
  // the existing skyline, city layers, businesses and landmarks stay exactly as they are.
  const painted=paintPanorama(c,s,w,h);
  if(!painted&&sky){const bx=-(cam.x*.16)%2400,by=-120-cam.y*.09;for(let k=-1;k<3;k++)c.drawImage(sky,bx+k*2400,by,2400,1100)}
  if(!painted&&panorama?.complete&&panorama.naturalWidth){
    // Alternating mirrored tiles have continuous edges without a hard repeat seam.
    const ph=Math.max(h*1.16,840),pw=ph*panorama.naturalWidth/panorama.naturalHeight;
    const shift=cam.x*.13,first=Math.floor(shift/pw)-1,by=-ph*.12-cam.y*.025;
    c.save();c.globalAlpha=.82;
    for(let i=first;i<(shift+w)/pw+1;i++){const x=i*pw-shift;c.save();if(Math.abs(i)%2){c.translate(x+pw,by);c.scale(-1,1);c.drawImage(panorama,0,0,pw,ph)}else c.drawImage(panorama,x,by,pw,ph);c.restore()}
    c.restore();
  }
  city(c,s,w,h);
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
function platform(c,p,bottom,t=0){
  const {x,y,w,h}=p,solid=p.kind==='solid',hs=hash(x*.37+y);
  if(solid&&y>=2140&&w>=1400){
    // Street foundations, service mains and the night train beneath the pavement.
    // Wet asphalt on the real slab plus rough underpass concrete on the cut face; the
    // vector detailing and the train animation stay exactly as they were.
    rect(c,x,y,w,h,'#07121c');
    paintSurface(c,'pavement',x,y,w,Math.min(h,120),{seed:hs*211,alpha:.5});
    paintSurface(c,'foundation',x,y+120,w,Math.max(8,Math.min(h-120,140)),{seed:hs*307,alpha:.44});
    rect(c,x,y,w,8,'#526773');rect(c,x,y+8,w,18,'#1d2d3a');
    for(let a=x+10;a<x+w;a+=110){rect(c,a,y+3,60,2,'#8aa3a755');rect(c,a,y+13,37,3,'#0c1a24');}
    rect(c,x,y+44,w,5,'#2c4854');rect(c,x,y+51,w,2,'#6a6353');rect(c,x,y+183,w,3,'#405868');
    for(let a=x+40;a<x+w;a+=180){rect(c,a,y+27,10,h-27,'#20313e');rect(c,a-10,y+31,30,5,'#3d535e');rect(c,a+4,y+84,15,3,'#72c5bc60');}
    // lit top edge and a shadowed base keep the slab from reading as a flat vector block
    rect(c,x,y,w,2,'#9fc4cc4d');rect(c,x,y+h-4,w,4,'#04090f7a');
    c.save();c.beginPath();c.rect(x,y+66,w,116);c.clip();
    const tx=((t*170)%13800)-600;
    if(tx+600>x&&tx<x+w){rect(c,tx,y+91,600,79,'#334650');rect(c,tx,y+95,600,4,'#b0b39a');rect(c,tx,y+149,600,3,'#c7935f');
      for(let i=0;i<12;i++){rect(c,tx+12+i*49,y+107,34,27,'#a5c9b64f');rect(c,tx+26+i*49,y+109,3,25,'#1c3542');rect(c,tx+11+i*49,y+161,13,10,'#0b1720');}
      rect(c,tx+585,y+113,10,8,'#eac78b');}
    c.restore();return;
  }
  if(solid){
if(p.id?.startsWith('yards-cont-')){
      // Freight containers: corrugated steel, corner castings, stencils and rust.
      // A few carry a scuffed vent or a dead neon tag so the yard keeps its neon.
      const coat=['#794935','#516765','#745e3d'][Math.floor(hs*3)];
      const lit=hash(x*.21+y*.13);
      rect(c,x,y,w,h,coat);rect(c,x+3,y+4,w-6,h-8,'#0c11151c');
      // painted corrugated steel on the real panel rectangle; geometry unchanged
      if(paintSurface(c,'corrugated',x,y,w,h,{seed:hs*97,alpha:.62}))rect(c,x+3,y+4,w-6,h-8,'#0c11151c');
      for(let a=x+8;a<x+w-5;a+=11){rect(c,a,y+5,3,h-10,'#070d1838');rect(c,a+3,y+5,1,h-10,'#d5bb8e30');}
      for(let a=x+8;a<x+w-5;a+=128){rect(c,a,y+6,2,h-12,'#0b101a55');rect(c,a+2,y+6,1,h-12,'#e6d0a52e')}
      rect(c,x,y,w,5,'#a48d6b');rect(c,x,y,w,1,'#d7c39c');rect(c,x,y+h-5,w,5,'#2a343a');
      rect(c,x,y+h-2,w,2,'#11191f');
      for(const a of [x+3,x+w-8]){rect(c,a,y+4,5,h-8,'#a58e70');rect(c,a+1,y+10,3,5,'#313a3c');rect(c,a+1,y+h-15,3,5,'#313a3c')}
      const door=x+w*.72;line(c,door,y+5,door,y+h-5,'#111e23',2);
      for(const a of [door+10,x+w-19]){line(c,a,y+8,a,y+h-8,'#aab0a0',2);rect(c,a-3,y+h*.52,6,9,'#25363b')}
      if(lit>.62){ // scuffed extraction vent, still lit
        const vx2=x+w*.14,vy2=y+h*.34,glowCol=lit>.86?'#7df0d8':'#ffb45e';
        rect(c,vx2,vy2,26,20,'#0c141a');rect(c,vx2+2,vy2+2,22,16,'#0a1a1e');
        glow(c,vx2+13,vy2+10,26,glowCol,.12);
        for(let k=0;k<4;k++)rect(c,vx2+3,vy2+3+k*4,20,2,lit>.86?'#5fd8c4aa':'#c58a4c88');
      }else if(lit<.2){ // dead neon tag wired to the fence
        const tx2=x+w*.82,ty2=y+16,col='#ff547f';
        rect(c,tx2,ty2,3,18,'#1b2a33');
        c.strokeStyle=col;c.globalAlpha=.5;c.lineWidth=1.4;c.strokeRect(tx2-5,ty2-4,15,10);c.globalAlpha=1;
        glow(c,tx2+3,ty2+1,20,col,.06);
        text(c,'HELIX',tx2-1,ty2+3,'#c9647e',7);
      }
      rect(c,x+15,y+19,Math.min(111,w*.56),25,'#101d23b0');text(c,'CINDER / FREIGHT',x+21,y+29,'#d8c8a8',8);text(c,`CY-${Math.floor(hs*899)+100}`,x+21,y+40,'#a4b8b4',8);
      for(let a=x+15;a<x+66;a+=10)path(c,[[a,y+h-15],[a+5,y+h-15],[a+10,y+h-7],[a+5,y+h-7]],'#ddb255');
      for(let k=0;k<7;k++){const a=x+8+hash(x+k*17)*(w-16),b=y+8+hash(y+k*31)*(h-16);rect(c,a,b,2+hash(k+x)*9,2,'#d58d6244');}
      return;
    }
    rect(c,x,y,w,h,hs>.5?'#101924':'#121c26');
    // photopixel surface paint on the existing slab; the vector detailing stays on top
    paintSurface(c,h>46?'plaster':'foundation',x,y,w,h,{seed:hs*131+(x|0)%97,alpha:h>46?.5:.42});
    rect(c,x,y,w,4,'#66818b');rect(c,x-3,y-5,w+6,6,'#2a3d4a');rect(c,x-3,y-5,w+6,1,'#7fa0a8');
    for(let a=x+6;a<x+w-10;a+=22)rect(c,a,y-9,10,4,'#223341');
    for(let a=x+30;a<x+w-50;a+=170){const t=hash(a+y);
      if(t<.4){rect(c,a,y-26,34,21,'#2b3c48');rect(c,a+3,y-23,28,3,'#1a2833');for(let f=0;f<3;f++)rect(c,a+6+f*9,y-18,6,10,'#12202b')}
      else if(t<.7){line(c,a+10,y-5,a+10,y-44,'#3a5260',2);rect(c,a-4,y-48,28,3,'#4b6a76');rect(c,a+8,y-52,4,4,C.pink)}
      else{rect(c,a,y-18,20,13,'#33444f');rect(c,a+4,y-30,12,12,'#2a3a45')}}
    if(h>28){
      rect(c,x+2,y+8,w-4,2,'#1d2c39');
      const cols=Math.max(1,Math.floor((w-16)/30)),rows=Math.floor((h-24)/34);
      for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){const wx=x+10+k*30,wy=y+18+r*34,a=hash(wx*3.1+wy);
        rect(c,wx,wy,18,22,'#06101a');rect(c,wx+2,wy+2,14,18,a>.72?'#c38d5370':a>.45?'#3b999c55':'#14262f');rect(c,wx-2,wy+23,22,3,'#2b3c48')}
      if(w>200&&h>90){const sx=x+20+hash(x)*(w-120),sy=y+h-60,col=[C.cyan,C.pink,C.amber][Math.floor(hs*3)%3];
        glow(c,sx+45,sy+14,70,col,.08);rect(c,sx,sy,90,26,'#09131e');c.strokeStyle=col;c.lineWidth=1;c.strokeRect(sx+2,sy+2,86,22);text(c,['薬局','RAMEN','NEON'][Math.floor(hs*3)%3],sx+45,sy+19,col,13,'center')}
      for(let a=x+60;a<x+w-20;a+=240)line(c,a,y+8,a,y+h-4,'#243545',3);
    }else for(let a=x+8;a<x+w;a+=60)rect(c,a,y+9,36,3,'#26394a');
    // directional bevel: light catches the top edge, the base sits in shadow
    rect(c,x,y,w,2,'#8fb2b84d');rect(c,x,y+h-3,w,3,'#050b1270');
    return;
  }
  const bot=Math.max(y+h,bottom);
  if(w>=90&&bot-y>40){c.globalAlpha=.55;rect(c,x+6,y+h,w-12,bot-y-h,'#0a131d');
    c.globalAlpha=.5;for(let yy=y+h+30;yy<bot;yy+=46)for(let a=x+14;a<x+w-24;a+=34){const q=hash(a*1.3+yy);if(q>.45)rect(c,a,yy,12,16,q>.85?'#c38d5350':'#1d3a44')}c.globalAlpha=1}
  const type=w<110?0:w<170?1:w<260?2:3,v=Math.floor(hs*3);
  const post=px=>{rect(c,px-3,y+h,6,bot-y-h,'#1b2a37');rect(c,px-3,y+h,2,bot-y-h,'#34495a');for(let yy=y+h+60;yy<bot;yy+=90)rect(c,px-5,yy,10,3,'#2a3d4a')};
  if(type===0){
    post(x+6);post(x+w-6);
    rect(c,x,y,w,h,'#233444');rect(c,x,y,w,4,'#6d8892');
    rect(c,x+w*.15,y-22,w*.55,22,'#3a4d58');rect(c,x+w*.15+4,y-18,w*.55-8,3,'#22313c');rect(c,x+w*.15+4,y-11,w*.55-8,3,'#22313c');
    line(c,x+4,y+h,x+w*.5,y+h+26,'#2f4352',3);line(c,x+w-4,y+h,x+w*.5,y+h+26,'#2f4352',3);
  }else if(type===1){
    post(x+8);post(x+w-8);
    rect(c,x,y,w,h,'#1f2f3d');rect(c,x,y,w,3,'#70909a');
    for(let a=x+4;a<x+w-3;a+=8)rect(c,a,y+3,4,h-4,'#14212c');
    line(c,x,y-26,x+w,y-26,'#4d6a76',2);for(let a=x+2;a<=x+w-1;a+=14)line(c,a,y,a,y-26,'#3d5662',2);
    line(c,x+w*.5,y+h,x+4,y+h+34,'#2f4352',2);line(c,x+w*.5,y+h,x+w-4,y+h+34,'#2f4352',2);
  }else if(type===2){
    post(x+6);post(x+w-6);
    if(v===0){
      rect(c,x,y,w,h,'#1c2b38');rect(c,x,y,w,3,'#6d8892');
      const cc=hs>.3?['#c9445f','#e9d7c3']:['#2ba8ad','#e9d7c3'],n=Math.floor(w/16);
      c.globalAlpha=.85;for(let k=0;k<n;k++){const a=x+k*(w/n);c.fillStyle=cc[k%2];c.beginPath();c.moveTo(a,y+h);c.lineTo(a+w/n,y+h);c.lineTo(a+w/n,y+h+16);c.arc(a+w/n/2,y+h+16,w/n/2,0,Math.PI);c.closePath();c.fill()}c.globalAlpha=1;
      rect(c,x,y+h,w,3,'#101a24');
    }else{
      rect(c,x,y,w,h,'#202f3c');rect(c,x,y,w,4,'#6d8892');rect(c,x-2,y+h-3,w+4,3,'#14212c');
      line(c,x+2,y-28,x+w-2,y-28,'#58747f',3);for(let a=x+4;a<x+w;a+=11)line(c,a,y,a,y-28,'#3a5260',1.5);
      line(c,x+8,y+h,x+w*.3,y+h+40,'#2f4352',3);line(c,x+w-8,y+h,x+w*.7,y+h+40,'#2f4352',3);
      if(hs>.5){rect(c,x+w-30,y-14,20,14,'#27404a');rect(c,x+w-26,y-22,12,9,'#2e6a3d')}
    }
  }else{
    for(let a=x+16;a<x+w-10;a+=Math.max(120,w/4))post(a);
    rect(c,x,y,w,h,'#1c2b38');rect(c,x,y,w,4,'#6d8892');
    for(let a=x+6;a<x+w-3;a+=10)rect(c,a,y+4,5,h-5,'#101c27');
    line(c,x,y-24,x+w,y-24,'#4d6a76',2);line(c,x,y-12,x+w,y-12,'#2f4352',1.5);
    for(let a=x;a<=x+w;a+=40)line(c,a,y,a,y-24,'#3d5662',2);
    c.strokeStyle='#24343f';c.lineWidth=2;c.beginPath();c.moveTo(x,y+h);c.quadraticCurveTo(x+w*.25,y+h+28,x+w*.5,y+h);c.quadraticCurveTo(x+w*.75,y+h+28,x+w,y+h);c.stroke();
    for(let a=x+40;a<x+w-30;a+=160){rect(c,a,y+h,3,10,'#ffc07888');glow(c,a+1,y+h+10,22,C.amber,.1)}
  }
  if(w>160){for(let a=x+30;a<x+w-20;a+=100){const len=12+hash(a)*40;rect(c,a,y-2,len,2,'#74bcc47a')}}
}
function ladder(c,l,t){
  const px=l.x+l.w/2,top=l.y,bot=l.y+l.h,k=Math.floor(hash(l.x*.173)*5);
  const bracket=(yy,wd)=>{rect(c,px-wd/2-4,yy,wd+8,4,'#3a5260');rect(c,px-wd/2-4,yy,wd+8,1,'#7fa0a8');rect(c,px+wd/2+2,yy-3,10,2,'#26394a')};
  if(k===0){
    rect(c,px-5,top,10,l.h,'#3a4a50');rect(c,px-5,top,3,l.h,'#667c82');rect(c,px+3,top,2,l.h,'#1c282d');
    for(let yy=top+20;yy<bot;yy+=60)bracket(yy,10);
    rect(c,px-8,top-4,16,6,'#4d636a');
  }else if(k===1){
    const col=hash(l.x)>.5?C.pink:C.cyan;rect(c,px-3,top,6,l.h,'#2b3a46');
    glow(c,px,top+l.h/2,60,col,.08);
    for(let yy=top+16;yy<bot-30;yy+=70){rect(c,px+3,yy,18,5,col);rect(c,px+3,yy,18,1,'#ffffff80')}
    for(let yy=top+40;yy<bot;yy+=80)bracket(yy,6);
  }else if(k===2){
    rect(c,px-7,top,14,l.h,'#18222b');
    for(let i=-1;i<=1;i++)line(c,px+i*3.5,top,px+i*3.5,bot,['#c9445f','#2ba8ad','#caa24f'][i+1],2);
    for(let yy=top+14;yy<bot;yy+=36)rect(c,px-8,yy,16,4,'#3a5260');
    for(let yy=top+40;yy<bot;yy+=120)bracket(yy,14);
  }else if(k===3){
    rect(c,px-3,top+10,6,l.h-10,'#2b3a46');rect(c,px-3,top+10,2,l.h-10,'#4f6672');
    glow(c,px,top+4,70,C.amber,.14);rect(c,px-6,top,12,8,'#ffd49a');
    rect(c,px-6,bot-8,12,8,'#223341');
  }else{
    rect(c,px-4,top,3,l.h,'#6a7a80');rect(c,px+1,top,3,l.h,'#5a6a70');
    for(let yy=top+24;yy<bot;yy+=70){rect(c,px-9,yy,18,4,'#8a8f7a');rect(c,px-9,yy,18,1,'#b4b89c')}
    for(let yy=top+50;yy<bot;yy+=140)bracket(yy,8);
  }
  rect(c,px-8,bot-3,16,3,'#1a2631');
  const a=.5+.3*Math.sin(t*3+l.x);glow(c,px,top-6,18,C.amber,.1+.1*a);rect(c,px-7,top-3,14,3,'#ffc07899');
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
    rect(c,sx,y,sw,h,'#0b1722dc');
    // painted panel on the tower face, vector detail and lit windows on top
    paintSurface(c,'metal',sx,y,sw,h,{seed:hash(x*.6+y*.2)+7,alpha:.5});
    rect(c,sx,y,sw,5,'#3a4d57');line(c,sx+sw-8,y,sx+sw-8,y+h,'#344955',3);
    for(let yy=y+30;yy<y+h-30;yy+=94){rect(c,sx+8,yy,sw-23,32,'#172e39');rect(c,sx+12,yy+4,sw-31,22,hash(yy+x)>.6?'#cf925554':'#3b999c45');rect(c,sx+7,yy+33,sw-20,3,'#48636b');line(c,sx+4,yy+45,sx+sw-4,yy+88,'#34424b',2)}
    line(c,x,y+4,x+w,y+4,'#233c4b',3);return;
  }
  if(d.type==='shop'){
    const color=d.color||C.amber,seed=hash(x*1.7+y*.3),sd2=hash(x*.9+y*2.1);
    rect(c,x,y,w,h,'#14202a');
    rect(c,x+8,y+25,w-16,h-30,'#07151d');
    rect(c,x+14,y+31,w*.62,h-43,'#a8784447');
    // Materials go on AFTER their opaque base fills so they are never buried: brick on the
    // frontage band, plaster on the shutter field, corrugated on the roller door, glass on
    // the lit window strip.
    paintSurface(c,'brick',x,y,w,Math.min(h,44),{seed,alpha:.5});
    paintSurface(c,'plaster',x+8,y+25,w-16,h-30,{seed:sd2+3,alpha:.42});
    paintSurface(c,'corrugated',x+10,y+27,w*.6,h-34,{seed:sd2+11,alpha:.34});
    for(let xx=x+18;xx<x+w*.65;xx+=28){line(c,xx,y+31,xx,y+h-12,'#263d43',3);rect(c,xx+5,y+h-37,16,13,'#99745a');rect(c,xx+7,y+h-42,11,5,'#b9a386')}
    rect(c,x+w*.73,y+28,w*.2,h-34,'#21353a');rect(c,x+w*.75,y+36,w*.16,h*.25,'#357074');
    // door and window materials come after their own opaque fills, so they stay visible
    paintSurface(c,'metal',x+w*.73,y+28,w*.2,h-34,{seed:sd2+23,alpha:.5});
    paintSurface(c,'glass',x+w*.75,y+36,w*.16,h*.25,{seed:sd2+31,alpha:.62});
    rect(c,x+w*.73,y+28,w*.2,2,'#4f6d7455');rect(c,x+w*.73,y+h-40,w*.2,2,'#07161d66');
    line(c,x+w*.9,y+h*.65,x+w*.94,y+h*.65,color,2);
    // bevels on the dominant faces keep them from reading flat
    rect(c,x,y,w,2,'#7ea3ae55');rect(c,x,y+h-4,w,4,'#040b1370');rect(c,x+8,y+25,w-16,2,'#0d1c26');
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
  if(o.type==='door'){
    const accent=o.color||C.cyan;
    if(o.roomId){rect(c,x-50,y-151,100,151,'#273e47');rect(c,x-37,y-136,74,136,'#10202a');rect(c,x-29,y-126,58,105,'#314a54');rect(c,x-21,y-114,41,60,accent+'45');
      paintSurface(c,'metal',x-50,y-151,100,151,{seed:(x*.31+y*.13)%83,alpha:.5});
      paintSurface(c,'corrugated',x-29,y-126,58,105,{seed:(x*.17+y*.29)%71,alpha:.42});
      paintSurface(c,'glass',x-21,y-114,41,60,{seed:(x*.41+y*.07)%53,alpha:.55});
      rect(c,x-37,y-136,74,3,'#0a1923');rect(c,x-29,y-126,2,105,'#0c1d26');rect(c,x+27,y-126,2,105,'#0c1d26');
      rect(c,x+23,y-58,4,11,'#e0c6a4');rect(c,x-50,y-151,100,2,'#7fa4ae55');rect(c,x-50,y-6,100,6,'#030b1377');
      rect(c,x-67,y-177,134,28,'#0a1923');paintSurface(c,'metal',x-67,y-177,134,28,{seed:(x*.23+y*.19)%59,alpha:.45});
      text(c,o.roomId==='diner'?'AFTER HOURS':o.roomId==='barracks'?'WATCH HOUSE':'SAINTS CLUB',x,y-158,accent,12,'center');glow(c,x,y-100,100,accent,.08);text(c,'ENTER / E',x,y-188,accent,9,'center');}
    if(player&&Math.hypot(player.x+14-x,player.y+54-y)<55){const label=`[ E ] ${o.label}`,ww=Math.min(340,label.length*6+18);rect(c,x-ww/2,y-220,ww,23,'#08111eee');text(c,label,x,y-204,accent,10,'center');}return;
  }
  if(['health','energy','shard'].includes(o.type)){
    if(o.done)return;const yy=y-24+Math.sin(t*3+x)*4,pc=o.type==='health'?'#a6fca5':o.type==='energy'?C.cyan:'#c69aff';
    glow(c,x,yy,30,pc,.12);path(c,[[x,yy-15],[x+12,yy],[x,yy+15],[x-12,yy]],'#112733');c.strokeStyle=pc;c.lineWidth=1;c.beginPath();c.arc(x,yy,17,0,Math.PI*2);c.stroke();
    if(o.type==='health'){rect(c,x-3,yy-8,6,16,pc);rect(c,x-8,yy-3,16,6,pc)}else if(o.type==='energy')path(c,[[x+2,yy-10],[x-7,yy+2],[x,yy+2],[x-2,yy+10],[x+8,yy-3],[x+1,yy-3]],pc);else{path(c,[[x,yy-9],[x+6,yy],[x,yy+9],[x-6,yy]],pc);line(c,x,yy-6,x,yy+6,'#faf3ff',1)}return;
  }
  if(o.type==='terminal'){rect(c,x-16,y-50,32,50,'#233445');rect(c,x-12,y-46,24,23,'#071824');rect(c,x-9,y-43,18,2,color);for(let a=0;a<3;a++)rect(c,x-9,y-37+a*4,8+hash(a+x)*10,1,color);rect(c,x-10,y-17,20,2,'#63818a');glow(c,x,y-33,36,color,.12)}
  else if(o.type==='checkpoint'){
    // Safehouse panel: painted metal frame, corrugated shutter field, glass SYNC screen.
    // Materials go on after their opaque base fills so they are never buried.
    rect(c,x-42,y-94,84,94,'#142e35');
    paintSurface(c,'metal',x-42,y-94,84,94,{seed:(x*.13+y*.07)%97,alpha:.55});
    rect(c,x-37,y-89,74,86,'#071e29');
    paintSurface(c,'corrugated',x-37,y-89,74,86,{seed:(x*.29+y*.11)%89,alpha:.5});
    rect(c,x-41,y-94,82,4,'#80deca');
    rect(c,x-37,y-89,2,86,'#0a2731');rect(c,x+35,y-89,2,86,'#0a2731');
    for(let a=x-33;a<x+34;a+=9)rect(c,a,y-85,2,78,'#04141c66');
    text(c,o.active?'SAVED / SAFEHOUSE':'SAFEHOUSE / E',x,y-102,'#94f6db',10,'center');
    glow(c,x,y-46,70,'#78dfce',.13);line(c,x,y,x,y-72,'#334753',3);
    rect(c,x-18,y-73,36,20,'#152535');
    paintSurface(c,'glass',x-18,y-73,36,20,{seed:(x*.7+y*.3)%61,alpha:.6});
    text(c,'SYNC',x,y-59,color,9,'center');
    c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.ellipse(x,y-2,30,6,0,0,Math.PI*2);c.stroke();
    // bevel: lit top lip, shadowed base, so the panel reads as a built object
    rect(c,x-42,y-94,84,2,'#a9efe0aa');rect(c,x-42,y-6,84,6,'#030d1477');
  }
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
// Sparks keep their travel direction: short streaks with a hot core.
function spark(c,pt){
  const k=clamp((pt.life||0)/(pt.maxLife||1),0,1),vx=pt.vx||0,vy=pt.vy||0,l=Math.hypot(vx,vy)||1,sz=pt.size||2;
  c.globalAlpha=k;
  if(l>90){
    const ux=vx/l,uy=vy/l,len=Math.min(9,l*.02);
    line(c,pt.x,pt.y,pt.x-ux*len,pt.y-uy*len,pt.color||C.cyan,sz);
    c.globalAlpha=k*.9;c.fillStyle='#f4fffa';
    c.fillRect(pt.x-sz*.4,pt.y-sz*.4,sz*.8,sz*.8);
  }else{rect(c,pt.x,pt.y,sz,sz,pt.color||C.cyan)}
  c.globalAlpha=1;
}
export function render(c,s,width,height){
  const world=s.world||{},cam=s.camera||{x:0,y:0},t=s.time||0,p=s.player;
  // Bounded temporal history of real world positions; cleared outside play.
  if(s.mode==='playing')captureTemporal(s,t);else captureTemporal(null,t);
  c.save();if(world.interior)rect(c,0,0,width,height,'#080f17');else background(c,s,width,height);c.translate(-cam.x,-cam.y);
  if(world.interior)drawInterior(c,world,t);
  const visible=(o,pad=100)=>o.x+(o.w||60)>cam.x-pad&&o.x<cam.x+width+pad&&o.y+(o.h||100)>cam.y-pad&&o.y<cam.y+height+pad;
  // Characters render into a reusable foreground layer so local neon can tint character
// // pixels only (source-atop) without washing the whole frame or touching any label.
// The layer is rasterised at the scene scale so painted sprite detail stays crisp.
  beginShadows();
  const sceneScale=(typeof c.getTransform==='function'&&c.getTransform().a)||1;
  const layer=beginActorLayer(width,height,cam,sceneScale),ac=actorLayerContext()||c;
  const lamp=fn=>fn(ac);
  // Architecture behind gameplay geometry: service cables and sodium lights.
  for(const z of world.zones||[]){if(z.x+z.w<cam.x||z.x>cam.x+width)continue;const y=world.height?world.height-490:1900;glow(c,z.x+z.w/2,y,Math.min(600,z.w*.6),z.color||'#22bcc4',.04)}
  for(const d of world.decorations||[])if(visible(d,300))decoration(c,d,t);
  if(!world.interior)drawStreet(c,s,visible);
  drawTerritories(c,world,visible,t);
  for(const sh of world.shadows||[]){if(!visible(sh))continue;rect(c,sh.x,sh.y,sh.w,sh.h,'#02091480');line(c,sh.x+5,sh.y+sh.h-3,sh.x+sh.w-5,sh.y+sh.h-3,'#578d9450',2);for(let a=sh.x+10;a<sh.x+sh.w;a+=30)line(c,a,sh.y+sh.h-7,a+10,sh.y+sh.h-7,'#46616e',1);if(p&&Math.abs(p.x+14-(sh.x+sh.w/2))<sh.w/2+120&&Math.abs(p.y+54-sh.y-sh.h)<100)text(c,'◐ SHADOW',sh.x+sh.w/2,sh.y+sh.h-17,'#89b6bc',10,'center')}
  for(const pl of world.platforms||[])if(visible(pl)){if(world.interior){
      // Interior slabs are filled opaque first, then textured so the room floor shows the
      // photopixel material instead of a flat block. Geometry stays exactly as authored.
      rect(c,pl.x,pl.y,pl.w,pl.h,pl.kind==='solid'?'#283b45':'#57615e');
      const theme=world.room?.theme||'diner';
      const big=pl.w>=420&&pl.h>=40;
      paintSurface(c,big?(theme==='barracks'?'metal':'wood'):(theme==='barracks'?'pavement':'plaster'),pl.x,pl.y,pl.w,pl.h,{seed:((pl.x*.31+pl.y*.17)|0)%101,alpha:big?.46:.38});
      rect(c,pl.x,pl.y,pl.w,3,big?'#9caa9b55':'#9caa9b66');
      rect(c,pl.x,pl.y+pl.h-3,pl.w,3,'#0a141c66');
    }else platform(c,pl,Math.max(pl.y+pl.h,Math.min(2140,world.height||pl.y+400,cam.y+height+60)),t);}
  for(const l of world.ladders||[]){if(!visible(l))continue;ladder(c,l,t)}
  for(const g of world.gates||[]){if(!visible(g))continue;if(g.open){line(c,g.x,g.y,g.x+g.w,g.y,'#42bdb2',3);continue}rect(c,g.x,g.y,g.w,g.h,'#182a38');for(let yy=g.y+4;yy<g.y+g.h;yy+=12){rect(c,g.x+3,yy,g.w-6,3,'#4b6470');if((yy-g.y)%24<12)rect(c,g.x+5,yy,6,3,C.pink)}rect(c,g.x+g.w*.5-6,g.y+g.h*.5-18,12,36,'#1e1427');text(c,'×',g.x+g.w*.5,g.y+g.h*.5+5,C.pink,23,'center')}
  for(const e of s.enemies||[]){if(e.dead||!visible(e,350))continue;if(e.stun>0)continue;const ex=e.x+(e.w||28)/2,ey=e.y+(e.type==='drone'?15:17),r=e.viewRange||(e.type==='sniper'?440:e.type==='drone'?270:235),a=e.dir<0?Math.PI:0;const vg=c.createRadialGradient(ex,ey,0,ex,ey,r);vg.addColorStop(0,e.alert>.5?'#ff60732e':'#efbf681e');vg.addColorStop(1,'transparent');c.fillStyle=vg;c.beginPath();c.moveTo(ex,ey);c.arc(ex,ey,r,a-.45,a+.45);c.closePath();c.fill();}
  for(const o of world.interactables||[])if(visible({x:o.x-100,y:o.y-120,w:200,h:150}))interactable(c,o,t,p);
  for(const o of world.interactables||[])if(o.id?.startsWith('security-')&&visible({x:o.x,y:o.y-80,w:40,h:90})){
    const hot=s.security?.level>0&&!(s.security?.suppressed>0),col=hot?'#ff647c':'#80e0c9';
    rect(c,o.x-7,o.y-63,14,8,col);if(hot){glow(c,o.x,o.y-60,55,col,.14+Math.sin(t*5)*.08);}text(c,'ALARM',o.x,o.y-74,col,9,'center');
  }
  for(const civilian of s.civilians||[])if(visible(civilian)){lamp(cc=>drawCivilian(cc,civilian,t));addContact(civilian.x+(civilian.w||22)/2,civilian.y+(civilian.h||52),(civilian.w||22)*.62,.9)}
  for(const e of s.enemies||[])if(visible(e)){lamp(cc=>actor(cc,e,t));addContact(e.x+(e.w||28)/2,e.y+(e.h||54),(e.w||28)*.6,e.type==='boss'?1.35:e.type==='drone'?.5:1);if(e.faction&&e.faction!=='helix'){if(e.dead){rect(c,e.x+36,e.y+e.h-4,19,3,'#7d8a8d');rect(c,e.x+39,e.y+e.h-2,4,5,e.color);rect(c,e.x-12,e.y+e.h-2,8,3,'#98866a');}else if(!(s.enemies||[]).some(ally=>!ally.dead&&ally.group===e.group&&ally.id<e.id)){text(c,e.label,e.x+14,e.y-19,e.color,9,'center');if(!e.hostileToPlayer)text(c,e.access==='restricted'?'RESTRICTED':'NEUTRAL',e.x+14,e.y-30,'#adb5ad',8,'center');}}}
  for(const e of s.enemies||[])if(visible(e)&&!e.dead&&!e.faction&&e.access==='public'){text(c,attacksPlayer(s,e)?'SECURITY / HOSTILE':'WATCH / NEUTRAL',e.x+14,e.y-19,attacksPlayer(s,e)?'#ff8a91':'#91d6b4',8,'center');}
  for(const e of s.enemies||[])if(visible(e,400))telegraph(c,e,t);
  // Temporal echoes sit behind the live figure so the foreground stays sharp.
  if(p){lamp(cc=>{drawTemporal(cc,s,t);actor(cc,p,t,true,p.build)});addContact(p.x+(p.w||28)/2,p.y+(p.h||54),(p.w||28)*.66,1);if(p.hidden){c.strokeStyle='#78f5d949';c.setLineDash([3,5]);c.strokeRect(p.x-6,p.y-6,(p.w||28)+12,(p.h||54)+12);c.setLineDash([])}}
  // Characters are composited and grounded BEFORE bullets, slashes, impacts and sparks, so
  // foreground combat feedback is never hidden behind a body.
  if(layer){lightActorLayer(world,cam,width,height,t);compositeActorLayer(c,cam,width,height)}
  drawContacts(c);
  drawAmbient(c,world,cam,width,height);
  drawLighting(c,world,cam,width,height,t);
  for(const bullet of s.projectiles||[]){if(!visible({x:bullet.x,y:bullet.y,w:5,h:5},50))continue;line(c,bullet.x,bullet.y,bullet.x-(bullet.vx||0)*.024,bullet.y-(bullet.vy||0)*.024,bullet.color||C.amber,2);rect(c,bullet.x-2,bullet.y-2,4,4,'#fff7d8')}
  for(const e of s.effects||[])drawEffect(c,e,clamp((e.life||0)/(e.maxLife||.5),0,1),(p&&p.build)||'blade');
  for(const pt of s.particles||[])spark(c,pt);
  for(const d of world.decorations||[])if(d.type==='vent'&&visible(d,120))steam(c,d,t);
  // Wet ledges catch moving highlights; near rain gives the image depth.
  for(const pl of world.platforms||[]){if(!visible(pl)||pl.w<160)continue;for(let a=0;a<Math.min(6,pl.w/70);a++){const x=pl.x+hash(a+pl.x)*pl.w;rect(c,x,pl.y+7,16+hash(a)*30,1,'#71c4d433')}}
  puddles(c,world,cam,width,height,t);
  // All lighting stays inside world drawing: HUD, aim reticle, territory labels and
  // interface text keep their own contrast.
  c.restore();
  c.save();if(!world.interior){c.globalAlpha=.23;for(let i=0;i<65;i++){const x=((hash(i+921)*width-t*160-cam.x*.17)%width+width)%width,y=((hash(i+98)*height+t*650-cam.y*.1)%height+height)%height;line(c,x,y,x-12,y+39,'#b4d4dd',1)}}c.globalAlpha=1;
  const vignette=c.createRadialGradient(width/2,height/2,height*.2,width/2,height/2,width*.64);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#02071388');c.fillStyle=vignette;c.fillRect(0,0,width,height);
  c.restore();
  if(s.slowTime>0)drawFracture(c,width,height,t,s.slowTime);
  if(s.security?.level>0&&!(s.security?.suppressed>0)&&s.mode!=='title'){c.save();c.globalAlpha=(s.security.level===2?.22:.1)*(.6+Math.sin(t*4)*.4);rect(c,0,0,width,3,'#ff617d');rect(c,0,height-3,width,3,'#ff617d');c.restore();}
}





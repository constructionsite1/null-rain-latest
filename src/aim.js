const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Screen-space reticle stays independent of camera motion and movement direction.
export class AimState {
  constructor(){this.x=0;this.y=0;this.active=false;this.left=false;this.right=false;}
  reset(){this.left=false;this.right=false;}
  place(x,y,width,height){this.x=clamp(x,12,width-12);this.y=clamp(y,58,height-12);this.active=true;}
  move(dx,dy,width,height){this.place(this.x+dx,this.y+dy,width,height);}
  world(camera){return this.active?{x:this.x+camera.x,y:this.y+camera.y}:null;}
  buttons(){return {attack:this.left&&!this.right,secondary:this.left&&this.right,aiming:this.right};}
}

export function createAimController(canvas,{size,enabled,onRelease,onFallback}){
  const state=new AimState();let intentional=false,wasLocked=false,warned=false;
  function position(e){const {width,height}=size(),r=canvas.getBoundingClientRect();
    if(document.pointerLockElement===canvas)state.move(e.movementX*width/r.width,e.movementY*height/r.height,width,height);
    else state.place((e.clientX-r.left)*width/r.width,(e.clientY-r.top)*height/r.height,width,height);
  }
  function fallback(){if(!warned){warned=true;onFallback();}}
  document.addEventListener('mousemove',e=>{if(enabled()&&(document.pointerLockElement===canvas||e.target===canvas))position(e);});
  canvas.addEventListener('pointerdown',e=>{
    if(!enabled())return;e.preventDefault();if(document.pointerLockElement!==canvas)position(e);
    if(e.button===0)state.left=true;
    if(e.button===2){state.right=true;if(document.pointerLockElement!==canvas){
      intentional=false;
      try{if(canvas.requestPointerLock){const p=canvas.requestPointerLock();p?.catch(fallback);}else fallback();}catch{fallback();}
    }}
  });
  window.addEventListener('pointerup',e=>{if(e.button===0)state.left=false;if(e.button===2)state.right=false;});
  document.addEventListener('pointerlockerror',fallback);
  document.addEventListener('pointerlockchange',()=>{
    const locked=document.pointerLockElement===canvas;document.body.classList.toggle('mouse-captured',locked);
    if(wasLocked&&!locked){state.reset();if(!intentional&&enabled())onRelease();}
    wasLocked=locked;intentional=false;
  });
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  return {state,release(){state.reset();if(document.pointerLockElement===canvas){intentional=true;document.exitPointerLock();}},seed(player,camera){const {width,height}=size();state.place(player.x+player.w/2-camera.x+player.dir*210,player.y+22-camera.y,width,height);state.active=false;}};
}

export function drawTargeting(ctx,game,aim,width,height){
  const p=game.player,c=game.camera;
  const x=aim.active?aim.x:clamp(p.x+p.w/2-c.x+p.dir*210,12,width-12),y=aim.active?aim.y:clamp(p.y+22-c.y,58,height-12);
  const point={x:x+c.x,y:y+c.y};
  const target=game.enemies.filter(e=>!e.dead&&e.active!==false&&point.x>=e.x-12&&point.x<=e.x+e.w+12&&point.y>=e.y-12&&point.y<=e.y+e.h+12&&game.lineClear({x:p.x+p.w/2,y:p.y+23},{x:e.x+e.w/2,y:e.y+e.h/2})).sort((a,b)=>Math.hypot(a.x+a.w/2-point.x,a.y+a.h/2-point.y)-Math.hypot(b.x+b.w/2-point.x,b.y+b.h/2-point.y))[0];
  const color=target?'#ff8a91':aim.right?'#f4e8b8':'#a5fff0';
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.4;
  if(aim.right){ctx.save();ctx.globalAlpha=.2;ctx.setLineDash([3,9]);ctx.beginPath();ctx.moveTo(p.x+p.w/2-c.x,p.y+23-c.y);ctx.lineTo(x,y);ctx.stroke();ctx.restore();}
  if(target){const tx=target.x-c.x-7,ty=target.y-c.y-7,tw=target.w+14,th=target.h+14;
    ctx.globalAlpha=.8;for(const [a,b,s,t] of [[tx,ty,1,1],[tx+tw,ty,-1,1],[tx,ty+th,1,-1],[tx+tw,ty+th,-1,-1]]){ctx.beginPath();ctx.moveTo(a+s*8,b);ctx.lineTo(a,b);ctx.lineTo(a,b+t*8);ctx.stroke();}
    ctx.fillStyle='#071018';ctx.fillRect(tx,ty-11,tw,3);ctx.fillStyle=color;ctx.fillRect(tx,ty-11,tw*target.hp/target.maxHp,3);
    ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(target.type==='boss'?'WARDEN / 09':target.type.toUpperCase(),tx+tw/2,ty-18);ctx.globalAlpha=1;
  }
  const gap=aim.right?5:9,recoil=p.attackTimer>0?3:0;
  ctx.shadowColor='#030911';ctx.shadowBlur=4;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ctx.beginPath();ctx.moveTo(x+dx*(gap+recoil),y+dy*(gap+recoil));ctx.lineTo(x+dx*(gap+7+recoil),y+dy*(gap+7+recoil));ctx.stroke();}
  ctx.fillRect(x-1,y-1,2,2);
  if(aim.right){ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.globalAlpha=.3;ctx.stroke();}
  ctx.restore();
}

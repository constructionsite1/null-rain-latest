// Authored layered vector puppets: collision geometry is independent of the costume.
const palette={blade:'#79f6ed',ghost:'#c398ff',tank:'#ffc279',gun:'#ff7894'};
function poly(c,p,color,edge='#07121d',weight=1.3){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=weight;c.stroke()}}
function seg(c,a,b,width,color,edge='#08111b'){c.lineCap='round';c.strokeStyle=edge;c.lineWidth=width+2;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function bar(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function ring(c,x,y,r,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke()}
function glow(c,color){c.shadowColor=color;c.shadowBlur=3}
function limb(c,hip,knee,foot,accent,large=false){
  const n=large?8:5;seg(c,hip,knee,n,'#455767');seg(c,knee,foot,n-1,'#263c4f');
  poly(c,[[knee[0]-3,knee[1]-4],[knee[0]+4,knee[1]-3],[knee[0]+4,knee[1]+3],[knee[0]-3,knee[1]+3]],'#84939a');
  seg(c,[knee[0]+1,knee[1]+4],[foot[0]+1,foot[1]-3],1,accent,null);
  poly(c,[[foot[0]-4,foot[1]-4],[foot[0]+4,foot[1]-4],[foot[0]+9,foot[1]-1],[foot[0]+8,foot[1]+2],[foot[0]-5,foot[1]+2]],'#18232e');bar(c,foot[0]-4,foot[1]+1,11,1,'#84959e');
}
function weapon(c,kind,angle,attack,accent,shoulder=-34){
  c.save();c.translate(8,shoulder);c.rotate(angle);if(attack&&kind!=='blade')c.translate(-2,0);
  seg(c,[-3,3],[8,8],5,'#4b6374');seg(c,[8,8],[17,0],4,'#9fa9af');bar(c,13,-2,6,6,'#657786');
  if(kind==='blade'){
    const a=attack?-.65:1.03;c.rotate(a);seg(c,[16,0],[24,0],3,'#464456');bar(c,23,-6,3,12,'#be9c78');poly(c,[[26,-2],[71,-2],[78,-5],[72,1],[26,2]],'#d8f6f2',accent,.6);seg(c,[29,-1],[71,-1],.7,'#fff',null);
  }else if(kind==='tank'){
    poly(c,[[11,-8],[27,-8],[34,-2],[33,8],[24,13],[11,8]],'#73868d');bar(c,20,-5,11,3,accent);for(let i=0;i<3;i++)bar(c,26,-1+i*4,7,2,'#aab8b6');
  }else if(kind==='ghost'){
    poly(c,[[11,-5],[24,-5],[26,5],[13,7]],'#62557e');bar(c,15,-3,9,5,accent);for(let i=0;i<3;i++)bar(c,29+i*6,-5+Math.sin(i)*3,2,2,accent);
  }else{
    const rifle=kind==='sniper'||kind==='guard'||kind==='heavy';
    poly(c,[[12,-4],[rifle?39:31,-4],[rifle?42:31,1],[21,3],[18,10],[13,8]],'#82939c');bar(c,20,-4,rifle?32:17,2,'#c6d5d8');bar(c,17,3,4,9,'#503b40');
    if(rifle){poly(c,[[8,-2],[16,-2],[16,5],[7,8]],'#344654');bar(c,25,-8,11,4,'#233849');bar(c,28,-8,4,2,accent);if(kind==='sniper'){bar(c,40,-4,25,3,'#a1b6c0');seg(c,[35,1],[39,12],1.5,'#4d6471');seg(c,[35,1],[32,12],1.5,'#4d6471')}}else{ring(c,22,-1,4,'#d1b0a7',1);bar(c,20,-7,6,2,'#e4c2b2')}
    if(attack){poly(c,[[rifle?66:40,-2],[rifle?83:54,-7],[rifle?77:47,0],[rifle?86:56,5],[rifle?66:40,2]],'#fff2ac',null);}
  }
  c.restore();
}
function drone(c,e,t){
  const x=e.x+(e.w||38)/2,y=e.y+13+Math.sin(t*4)*3;c.save();c.translate(x,y);
  for(const side of [-1,1]){seg(c,[side*8,-2],[side*22,-6],3,'#647b88');poly(c,[[side*17,-10],[side*29,-10],[side*31,-4],[side*16,-4]],'#273d4e');seg(c,[side*14,-12],[side*34,-12],1.2,'#91bdc6');seg(c,[side*18,-15],[side*30,-15],1,'#6c8997');bar(c,side*24-2,-10,4,5,'#d5a278')}
  poly(c,[[-12,-8],[10,-8],[16,-2],[10,8],[-10,8],[-16,0]],'#435c6c');poly(c,[[-9,-6],[7,-6],[8,3],[-8,3]],'#192b3b');bar(c,-6,-4,12,2,'#91b2bf');seg(c,[0,5],[0,12],3,'#7a8c94');poly(c,[[-6,10],[5,10],[8,15],[3,19],[-6,17]],'#364e60');glow(c,'#ff6f8d');bar(c,2,12,5,3,'#ff6f8d');c.restore();
}
function warden(c,e,t){
  const w=e.w||64,h=e.h||86,dir=e.dir||1;c.save();c.translate(e.x+w/2,e.y+h);c.scale(dir,1);const a=e.phase===2?'#ffc17b':'#ff7894',pulse=Math.sin(t*7)*2;
  // Four segmented supports and projecting blade shoulders make the Warden unmistakable.
  for(const side of [-1,1]){limb(c,[side*13,-30],[side*28,-18],[side*34,0],a,true);seg(c,[side*18,-46],[side*37,-31],9,'#3e5365');seg(c,[side*37,-31],[side*43,-15],6,'#71848e');poly(c,[[side*29,-68],[side*43,-60],[side*47,-41],[side*32,-45]],'#64727c');seg(c,[side*33,-62],[side*43,-51],2,a,null)}
  poly(c,[[-23,-66],[-16,-77],[17,-77],[27,-60],[21,-32],[12,-23],[-16,-25],[-25,-40]],'#2e4255');poly(c,[[-19,-62],[-4,-67],[-5,-34],[-20,-40]],'#738089');poly(c,[[5,-67],[20,-61],[18,-38],[5,-34]],'#526777');poly(c,[[-7,-62],[7,-62],[10,-42],[0,-34],[-10,-42]],'#101d2c');glow(c,a);poly(c,[[-4,-57],[4,-57],[5,-47],[0,-42],[-5,-47]],a,null);c.shadowBlur=0;
  for(let i=0;i<3;i++)seg(c,[-16,-53+i*5],[-8,-50+i*5],1,'#bbc6c8',null);
  poly(c,[[-13,-87],[8,-91],[18,-81],[13,-68],[-11,-70],[-18,-79]],'#4b6275');poly(c,[[-14,-81],[16,-82],[12,-75],[-10,-73]],'#121f31');glow(c,a);seg(c,[-9,-78],[12,-79],2,a,null);c.shadowBlur=0;poly(c,[[-12,-86],[-24,-100],[-16,-96],[-4,-86]],'#879ba8');poly(c,[[10,-88],[23,-101],[21,-90],[16,-81]],'#879ba8');
  seg(c,[20,-59],[38,-50],8,'#72848d');seg(c,[38,-50],[44,-40],7,'#435966');poly(c,[[37,-44],[55,-47],[62,-39],[56,-28],[38,-30]],'#667882');bar(c,43,-41,13,3,a);
  for(let i=0;i<4;i++)bar(c,-18+i*10,-24,6,3,'#a1ada9');poly(c,[[-21,-31],[-24,-9],[-12,-16],[-5,-31]],'#432b40');poly(c,[[7,-30],[16,-10],[25,-5],[20,-32]],'#432b40');
  c.restore();if(e.active){c.font='9px monospace';c.textAlign='center';c.fillStyle=a;c.fillText('WARDEN // 09',e.x+w/2,e.y-25);c.textAlign='left'}
}
export function drawActor(c,e,t,player=false,build=e.build||'blade',ghost=false){
  if(e.type==='drone')return drone(c,e,t);if(e.type==='boss')return warden(c,e,t);
  const w=e.w||28,h=e.h||54,dir=e.dir||1,accent=player?palette[build]||palette.blade:e.type==='sniper'?'#ffc278':'#ff7b8b';
  const move=Math.min(1,Math.abs(e.vx||0)/140)||(!player&&['patrol','investigate','search'].includes(e.state)&&!e.stun?.65:0),gait=Math.sin(t*13+e.x*.015)*move;
  const attack=e.attackTimer>0,crouch=e.crouching?13:0,jump=player&&e.grounded===false,bob=jump?0:Math.abs(gait)*1.8;
  c.save();c.translate(e.x+w/2,e.y+h);c.scale(dir,1);
  if(e.dashTimer>0||e.rush>0)c.rotate(.23);else if(jump)c.rotate(Math.max(-.08,Math.min(.08,(e.vx||0)*.0003)));
  if(e.dead){c.rotate(dir*.5*Math.PI);c.translate(-18,6);c.globalAlpha*=.62}
  if(e.cloak>0)c.globalAlpha*=.38;if(e.invuln>0)c.globalAlpha*=.75;if(ghost)c.globalAlpha*=.18;
  const head=-h+5+crouch+bob,hip=-19+crouch*.2,large=build==='tank'&&player||e.type==='heavy';
  const legDir=player&&e.moveDir&&e.moveDir!==dir?-1:1;
  for(const side of [-1,1]){const foot=jump?[side*10+gait*3,-7-side*3]:[side*5+gait*side*12*legDir,0];limb(c,[side*5,hip],[side*7+gait*side*7,hip*.46],foot,accent,large)}
  const coat=player?build==='gun'?'#473345':build==='ghost'?'#36314d':'#263b4e':'#344352',tail=Math.sin(t*8)*3+gait*5;
  if(build==='gun'||build==='ghost'||!player){poly(c,[[-11,head+17],[-15,hip+3],[-20-tail,hip+15],[-9,hip+10],[-2,head+24]],coat);poly(c,[[3,head+20],[13,hip+2],[19+tail,hip+14],[5,hip+8]],coat);seg(c,[-14,hip+5],[-18-tail,hip+13],1,accent,null)}
  poly(c,[[-10,head+13],[6,head+12],[13,head+23],[8,hip],[-9,hip],[-13,head+28]],coat);poly(c,[[-10,head+16],[-4,head+14],[-3,hip],[-9,hip]],'#6d8390');poly(c,[[0,head+16],[7,head+17],[9,head+28],[0,head+29]],'#192f42');
  for(let i=0;i<3;i++)seg(c,[-2,head+21+i*5],[6,head+21+i*5],.8,'#8098a3',null);bar(c,-10,hip-2,19,3,'#172a39');bar(c,-2,hip-2,4,3,'#c9b89a');
  // Far arm with an articulated cuff and cybernetic knuckles.
  seg(c,[-9,head+20],[-13-gait*3,head+32],5,'#4e6678');seg(c,[-13-gait*3,head+32],[-8-gait*6,hip-1],4,'#8597a0');bar(c,-13-gait*6,hip-3,6,5,'#2d485a');bar(c,-12-gait*6,hip-3,4,1,accent);
  if(large){poly(c,[[-20,head+15],[-10,head+12],[-5,head+24],[-16,head+31],[-23,head+23]],'#7b878b');poly(c,[[8,head+13],[18,head+17],[21,head+27],[10,head+30]],'#6b7b87');poly(c,[[-7,head+17],[7,head+17],[11,head+32],[-8,head+34]],'#51626b');bar(c,-4,head+20,10,3,accent);seg(c,[-20,head+18],[-15,head+25],1,'#c2c9c2',null)}
  // Faceted face and swept white hair. Enemies use sealed tactical masks.
  poly(c,[[-6,head-5],[5,head-5],[9,head+1],[6,head+11],[-3,head+12],[-8,head+5]],player?'#c5bcb3':'#6e828e');bar(c,6,head+2,3,3,'#c3c6bf');
  if(player&&build==='ghost'){poly(c,[[-13,head+2],[-9,head-11],[2,head-15],[11,head-8],[13,head+10],[7,head+14],[-4,head+11]],'#2b2e45');poly(c,[[-7,head-5],[7,head-5],[9,head+6],[-5,head+7]],'#0b1626');glow(c,accent);seg(c,[-5,head+1],[8,head+1],2,accent,null);c.shadowBlur=0;for(let i=0;i<3;i++)seg(c,[-11-i,head+8],[-15-i*3,head+24+i*3],1,accent,null)}
  else if(player){poly(c,[[-10,head-1],[-8,head-8],[-2,head-13],[2,head-10],[8,head-11],[12,head-4],[4,head-3],[0,head+1]],'#e7eeea');seg(c,[-5,head-7],[3,head-7],1,'#ffffff',null);poly(c,[[-6,head+6],[7,head+4],[7,head+11],[-3,head+13],[-7,head+10]],'#182b3d');bar(c,3,head+1,4,2,accent)}
  else{poly(c,[[-10,head-5],[-5,head-10],[8,head-8],[12,head-2],[8,head+1],[-8,head+1]],'#273a4c');poly(c,[[-6,head+4],[8,head+2],[8,head+11],[-4,head+13]],'#152636');glow(c,accent);seg(c,[0,head+1],[9,head],2,accent,null);c.shadowBlur=0;for(let i=0;i<3;i++)bar(c,-2+i*3,head+7,1,3,'#617482');if(e.type==='sniper'){bar(c,5,head-2,9,5,'#7d8f99');bar(c,9,head-1,5,2,accent)}}
  // Personal costume accents: asymmetry and mechanical expressions read at a glance.
  if(player&&build==='gun'){
    poly(c,[[-12,head-7],[-7,head-16],[5,head-17],[10,head-8]],'#604353');poly(c,[[-17,head-6],[-7,head-9],[13,head-8],[18,head-4],[4,head-3],[-12,head-3]],'#866071');seg(c,[-8,head-9],[10,head-9],1.5,'#ff8e9e',null);bar(c,6,head+1,5,2,'#ffd9b4');poly(c,[[-8,head+16],[-2,head+23],[-6,head+29],[-12,head+21]],'#9d6976');bar(c,-12,hip-1,5,7,'#b38576');
  }
  if(player&&build==='tank'){
    poly(c,[[-12,head-6],[-7,head-12],[7,head-11],[13,head-5],[10,head+1],[-10,head+1]],'#6b7d85');bar(c,-7,head-2,15,3,'#d2a374');bar(c,4,head-1,7,3,'#ffecb9');poly(c,[[-7,head+6],[9,head+5],[11,head+12],[1,head+15],[-7,head+11]],'#89979a');for(let i=0;i<3;i++)bar(c,-3+i*4,head+9,2,3,'#25394c');poly(c,[[-23,head+14],[-13,head+9],[-7,head+15],[-12,head+26],[-24,head+23]],'#ad8b60');bar(c,-19,head+16,8,2,'#ffcf93');
  }
  if(player&&build==='ghost'){
    poly(c,[[-18,head+19],[-11,head+16],[-8,head+30],[-15,head+34],[-20,head+28]],'#645875');bar(c,-17,head+21,5,8,'#b89be9');seg(c,[-18,head+25],[-22,head+35],1.3,accent,null);seg(c,[-22,head+35],[-12,hip+3],1.3,accent,null);bar(c,7,head+5,3,2,'#f4d5ff');
  }
  const scarf=player?accent:'#4c6170';poly(c,[[-9,head+12],[8,head+12],[8,head+16],[-8,head+17]],scarf);if(player&&build!=='tank')poly(c,[[-8,head+12],[-22-move*13,head+13+tail],[-30-move*7,head+20+tail],[-15,head+18],[-7,head+16]],accent);
  if(player&&build==='blade'){seg(c,[-13,hip+10],[8,head+4],4,'#203849');seg(c,[-12,hip+9],[9,head+3],1,'#8baeb6',null);bar(c,5,head+6,8,2,'#c4a07b')}
  if(e.type==='heavy'){poly(c,[[8,head+10],[25,head+14],[27,-2],[13,3],[5,-8]],'#526778');poly(c,[[12,head+16],[21,head+19],[22,-4],[14,-1]],'#253b50');seg(c,[12,head+22],[23,head+24],2,'#b5bcc0',null);bar(c,13,head+27,8,3,'#ffb288');bar(c,-17,head+24,5,11,'#ff926c')}
  if(e.type==='sniper'){poly(c,[[-12,head+11],[-18,head+17],[-14,hip+13],[-4,hip+7],[-6,head+17]],'#51524c');for(let i=0;i<5;i++)seg(c,[-14,head+20+i*5],[-9,head+22+i*5],1,'#8a8b73',null);bar(c,-12,head+6,6,4,'#8e8c73')}
  let aim=player&&Number.isFinite(e.aimAngle)?e.aimAngle:e.aim?Math.atan2(e.aim.y-(e.y+h*.4),e.aim.x-(e.x+w/2)):dir<0?Math.PI:0;
  // Angle is converted into the mirrored torso frame, allowing walking and aiming to differ.
  aim=dir<0?Math.PI-aim:aim;
  if(player&&build==='blade'&&attack)aim=(e.combo===2?.65:e.combo===3?-1.1:-.45)+Math.sin((e.attackTimer||0)*20)*.45;
  weapon(c,player?build:e.type==='sniper'?'sniper':e.type==='heavy'?'heavy':'guard',aim,attack,accent,head+22);
  if(player&&jump&&(e.jumpCount>1||e.jumps>1)){for(const side of [-1,1])poly(c,[[side*4,-2],[side*10,7],[side*6,15],[side*3,6]],accent,null)}
  c.restore();
  if(!ghost&&!e.dead){if(e.parry>0)ring(c,e.x+w/2,e.y+h*.5,39,accent,2);if(e.barrier>0){ring(c,e.x+w/2,e.y+h*.5,43,'#ffcc8e',2);ring(c,e.x+w/2,e.y+h*.5,47,'#ffcc8e55',1)}if(e.stun>0){ring(c,e.x+w/2,e.y-6,8,'#a7faff',1);for(let i=0;i<3;i++)bar(c,e.x+w/2+Math.cos(t*6+i*2)*10,e.y-7+Math.sin(t*6+i*2)*4,3,2,'#a7faff')}}
  if(!player&&!ghost&&!e.dead&&(e.hp<e.maxHp||e.alert>.3)){bar(c,e.x+w/2-20,e.y-20,40,3,'#1d3040');bar(c,e.x+w/2-20,e.y-20,40*Math.max(0,e.hp/(e.maxHp||1)),3,accent)}
}
export function drawPortrait(c,build,x,y,scale=3,time=0){c.save();c.translate(x,y);c.scale(scale,scale);drawActor(c,{x:-14,y:-54,w:28,h:54,dir:1,vx:0,grounded:true,build,aimAngle:-.32},time,true,build);c.restore()}

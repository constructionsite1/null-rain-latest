import * as A from './neon-architecture.js';
import { paintMaterial } from './world-art.js';
const {
  box: rect, seg, poly, dot, ring, wash, puddle, spill, pool, tubeRect, neonText, plainText, flicker, hash,
  ductRun, cableRun, laundryLine, windowRain, pinBoard, pendantLamp, ceilingFan, mugBoard, monitorBank,
  alarmRack, lockerBank, weaponRack, grilleFloor, shelfBottles, equalizerBars, jukeboxProp, stoolProp,
  tableTop, dustMotes, occupant, steamColumn, glassSheen, tone
} = A;
export const ROOMS=[
  {id:'diner',name:'AFTER HOURS / DINER',x:970,y:2140,theme:'diner',color:'#e7a46e',description:'A warm kitchen, a back room and a fire escape. The owner knows the district.'},
  {id:'barracks',name:'HELIX / WATCH HOUSE',x:2870,y:2140,theme:'barracks',color:'#76c4ce',description:'A street-level guard post. The armory is upstairs; the alarm rack is downstairs.'},
  {id:'hangout',name:'WIRE SAINTS / SOCIAL CLUB',x:8090,y:2140,theme:'hangout',color:'#c291ca',description:'The crew keeps a bar, a card table and a loft above the Bazaar.'}
];
export function attachEntrances(world){
  for(const r of ROOMS)world.interactables.push({id:`door-${r.id}`,type:'door',roomId:r.id,x:r.x,y:r.y,label:`Enter ${r.name}`,color:r.color});
}
export function createInterior(id) {
  const room=ROOMS.find(r=>r.id===id);if(!room)return null;
  const floor=880,world={id:`room-${id}`,name:room.name,width:1440,height:1000,floor,interior:true,room,
    spawn:{x:100,y:floor-54},platforms:[],ladders:[],shadows:[],decorations:[],gates:[],pickups:[],interactables:[],enemies:[],
    zones:[{name:room.name,x:0,w:1440,color:room.color}]};
  const solid=(name,x,y,w,h)=>world.platforms.push({id:`${id}-${name}`,x,y,w,h,kind:'solid',interior:true});
  const ledge=(name,x,y,w)=>world.platforms.push({id:`${id}-${name}`,x,y,w,h:16,kind:'metal',interior:true});
  solid('floor',0,floor,1440,120);solid('wall-left',0,250,30,630);solid('wall-right',1410,250,30,630);
  ledge('loft',710,620,660);ledge('stair-a',440,780,110);ledge('stair-b',540,700,110);
  world.ladders.push({x:1290,y:620,w:36,h:260});
  solid('counter',300,831,110,49);solid('cover',1030,826,76,54);
  world.shadows.push({x:600,y:735,w:150,h:145},{x:1110,y:475,w:190,h:145});
  world.interactables.push({id:`exit-${id}`,type:'door',roomId:null,x:100,y:floor,label:'Return to the street',color:'#80d9cf'});
  world.interactables.push({id:`room-${id}-cache`,type:'cache',x:1190,y:620,label:id==='barracks'?'Armory / Breach':'Supply locker',weapon:id==='barracks'?'scatter':'arc'});
  world.interactables.push({id:`room-${id}-med`,type:'health',x:560,y:850,value:35,label:'First aid'});
  if(id==='barracks')world.interactables.push({id:'security-watch-house',type:'terminal',x:880,y:880,label:'Watch house / alarm rack'});
  const crew=id==='hangout';
  if(id!=='diner')for(const [i,x,feet,minX,maxX] of [[0,800,880,750,990],[1,1140,620,900,1250]])world.enemies.push({id:`room-${id}-guard-${i}`,type:'guard',x,y:feet-54,w:28,h:54,
    hp:70,maxHp:70,dir:-1,minX,maxX,active:true,dead:false,alert:0,state:'patrol',stun:0,cooldown:1.2+i*.3,attackTimer:0,patrolTime:i,viewRange:340,telegraph:0,search:0,vy:0,vx:0,homeY:feet-54,
    ...(crew?{faction:'wire',group:100,label:'WIRE SAINTS',color:'#c291ca',hostileToPlayer:false}:{})});
  return world;
}

export function drawInterior(c, world, t) {
  // A.box is context-bound (its first argument is the 2D context); the room art below
  // is written context-free, so re-bind it locally instead of passing `c` 72 times.
  const rect=(x,y,w,h,color)=>A.box(c,x,y,w,h,color);
  const r=world.room, accent=r.color, floor=world.floor, theme=r.theme;
  const skin = theme==='diner'  ? {wall:'#33352e',low:'#4d4b3c',floor:'#3a3128',warm:'#ffd39a'}
    : theme==='hangout'     ? {wall:'#2b2532',low:'#4a3348',floor:'#2f2430',warm:'#ffb0d8'}
    :                          {wall:'#1f313a',low:'#31454c',floor:'#232f36',warm:'#a8e0e6'};
  rect(0,0,1440,1000,'#0a1119');

  // Back wall, dado and skirting: each room is built from different material.
  wash(c,30,250,1380,floor-250,[[0,'#0c1219'],[.42,skin.wall],[.8,tone(skin.wall,.86)],[1,'#090f15']]);
  // Photopixel surfaces: every room texture covers the whole wall. Themes are diner / barracks /
  // hangout, so the watch-house gets sealed metal, the diner brick, the club wood.
  const wallMat = theme==='diner'?'brick':theme==='hangout'?'wood':'metal';
  const floorMat = theme==='diner'?'wood':theme==='hangout'?'wood':'pavement';
  paintMaterial(c, wallMat, 30,250,1380,floor-250, { alpha: theme==='diner'?.5:.44, seed: 3, scale: 72 });
  paintMaterial(c, floorMat, 30,floor,1380,1000-floor, { alpha: .40, seed: 8, scale: 84, bevel: false });
  for(let i=0;i<26;i++)rect(30+i*54,250,2,630,'#0000001f');
  rect(30,250,1380,12,'#0d161c');rect(30,258,1380,3,skin.low+'aa');
  if(theme==='diner'||theme==='hangout'){
    rect(30,700,1380,66,skin.low);rect(30,700,1380,3,'#8a8574');
    for(let x=34;x<1410;x+=22)rect(x,704,20,58,x%44?'#00000016':'#ffffff0c');
    rect(30,762,1380,3,'#00000033');
  }else{
    rect(30,720,1380,8,'#0f1a20');rect(30,728,1380,2,'#3d545c');
    for(let x=60;x<1400;x+=160){rect(x,730,60,22,'#1b2a31');rect(x+3,733,54,16,'#254049');rect(x+6,736,44,2,'#6f8a90');}
  }
  rect(30,856,1380,24,'#1a2228');rect(30,856,1380,2,skin.low);
  for(let x=30;x<1410;x+=60)rect(x,860,2,20,'#00000030');

  // Floor plate: wet sheen, neon spill and puddles under the lamps.
  rect(30,880,1380,6,skin.floor);
  wash(c,30,880,1380,14,[[0,skin.floor+'cc'],[1,'transparent']]);
  for(const [px,pw] of [[420,260],[860,300],[1180,200]])puddle(c,px,884,pw,9,accent+'33',t,px,.22);
  rect(30,878,1380,2,'#ffffff14');

  // Ceiling services.
  rect(30,250,1380,26,'#0c141a');
  ductRun(c,60,276,620,16,{col:'#2b363d'});ductRun(c,700,276,420,14,{col:'#28333a'});
  for(let x=120;x<1400;x+=190){rect(x,262,8,18,'#222c33');cableRun(c,x+4,280,x+194,280,5,{col:'#0b1116',w:1.2});}

  // Rain-lit street windows: the city keeps moving outside the cutaway.
  const wins = theme==='diner'  ? [[120,620,190,168],[640,470,150,150],[1120,430,170,160]]
    : theme==='barracks'        ? [[90,600,120,150],[420,430,150,140],[900,400,150,140],[1180,620,140,150]]
    :                            [[110,620,180,165],[600,440,160,150],[1150,470,160,155]];
  for(const [wx,wy,ww,wh] of wins)windowRain(c,wx,wy,ww,wh,{t,sd:wx,warm:theme==='hangout'?'#ff6ad0':theme==='barracks'?'#57e6dd':'#ffb45c'});

  // Wall dressing: name plate, duty board, conduit.
  rect(560,300,240,46,'#101a20');rect(563,303,234,40,'#3a3428');
  c.font='bold 16px monospace';c.fillStyle=accent;c.fillText(r.name,576,328);
  plainText(c,theme==='diner'?'SOUP / COFFEE / A LITTLE PEACE':theme==='hangout'?'NO CAMERAS. NO CREDIT. NO HELIX.':'SHIFT 03 / MUNICIPAL SECURITY',578,345,{color:'#c2bcaa',size:9});
  pinBoard(c,820,296,150,108,{sd:3,notes:['SHIFT','ROSTER','LOST','OWED','FIX']});
  for(const [x,y] of [[380,300],[1080,300],[1330,330]]){rect(x,y,7,420,'#2b363c');for(const yy of [y+60,y+180,y+320])rect(x-3,yy,13,5,'#7d8a80');}
  rect(340,250,6,630,'#2b343a');rect(1000,250,6,630,'#2b343a');

  if(theme==='diner'){
    // Pass window and kitchen behind it.
    rect(300,640,110,62,'#1d2622');rect(304,644,102,54,'#39453f');
    rect(304,660,102,5,'#5a6a60');rect(304,680,102,4,'#5a6a60');
    for(let i=0;i<3;i++){rect(312+i*34,646,26,12,'#5f6d63');rect(314+i*34,650,22,5,'#9aa89a');}
    flameRowAt(c,316,690,80,12,t,2);
    // Counter slab edge, urn and a plate stack under the pass.
    rect(296,820,118,11,'#b9c2bd');rect(300,816,110,5,'#8b9691');
    rect(232,790,46,32,'#3d4747');rect(236,794,38,24,'#68756c');rect(238,800,30,2,'#b8bda1');
    rect(258,804,3,14,'#262d2b');dot(c,250,786,3,'#e0a05a');
    steamColumn(c,250,786,t,{sd:4,rise:34,r:6,alpha:.1,n:3});
    for(let i=0;i<4;i++){rect(414+i*5,852-i*3,12,3,i%2?'#d3d8d2':'#b4bcb6');rect(414+i*5,849-i*3,12,2,'#8f9791');}
    // Menu board.
    rect(296,700,118,96,'#20282a');rect(300,704,110,88,'#2f3a34');
    plainText(c,'NIGHT MENU',312,720,{color:'#d8cfa8',size:9});
    const menu=[['NOODLES','6'],['SOUP','4'],['COFFEE','2'],['PIE','5'],['TEA','1']];
    for(let i=0;i<menu.length;i++){plainText(c,menu[i][0],312,736+i*12,{color:'#c9d0bc',size:8});plainText(c,menu[i][1],400,736+i*12,{color:'#e0c98a',size:8,align:'right'});}
    // Booth tables and stools.
    for(const tx of [460,700,980]){
      tableTop(c,tx,830,96,{h:40,col:'#4a3a2c',top:'#7a5a44'});
      stoolProp(c,tx+16,880,{col:'#8a5a3a',h:26});stoolProp(c,tx+72,880,{col:'#8a5a3a',h:26});
      rect(tx+34,816,16,4,'#c9d2cc');rect(tx+56,816,10,4,'#a8b4ae');
    }
    jukeboxProp(c,1150,880,{t,sd:7});
    // Wall clock, photographs, a coat rail and a shelf of jars.
    dot(c,470,400,28,'#2a241c');ring(c,470,400,26,'#6a5a44',2.4);dot(c,470,400,23,'#d6c8a8');
    seg(c,470,400,470,382,'#3a2f22',2);seg(c,470,400,484,406,'#8a3a2a',1.6);dot(c,470,400,2.4,'#3a2f22');
    for(let i=0;i<12;i++)dot(c,470+Math.cos(i/12*6.283)*22,400+Math.sin(i/12*6.283)*22,1,'#4a3c2a');
    for(let i=0;i<3;i++){rect(520+i*62,360,54,42,'#5a4a34');rect(524+i*62,364,46,34,'#2a3038');poly(c,[[528+i*62,394],[538+i*62,374],[548+i*62,394]],'#4a5a62');}
    rect(560,624,120,4,'#6a5a44');
    for(let i=0;i<2;i++){seg(c,568+i*54,624,568+i*54,634,'#8a7a5a',1.6);
      poly(c,[[556+i*54,632],[580+i*54,632],[576+i*54,690],[560+i*54,690]],i?'#5a4a3a':'#3f4a4e');
      rect(558+i*54,660,22,6,i?'#7a6a52':'#3a4a52');}
    rect(880,372,120,4,'#6a5a44');
    for(let i=0;i<8;i++){const h=10+hash(3+i)*10;rect(886+i*14,376-h,11,h,['#8a7a4a','#7a5a4a','#5a7a6a'][i%3]);rect(887+i*14,378-h,9,3,'#c9b98f55');}
    rect(1010,470,110,44,'#1a2228');rect(1014,474,102,36,'#2a333a');
    plainText(c,'OPEN 24H',1065,490,{color:'#d8cfa8',size:11,align:'center'});
    plainText(c,'SOUP / COFFEE',1065,504,{color:'#9aa89a',size:7,align:'center'});
    for(let i=0;i<5;i++){seg(c,1060,610,1060+(i-2)*11,610+18+hash(i)*22,'#4a7a4a',1.6);rect(1058,600,5,10,'#7a5a3a');}
    pendantLamp(c,250,300,{t,sd:1,color:'#ffd39a',len:40,r:14});
    pendantLamp(c,560,300,{t,sd:5,color:'#ffd39a',len:70,r:14});
    pendantLamp(c,900,300,{t,sd:9,color:'#ffd39a',len:40,r:14});
    pendantLamp(c,1240,300,{t,sd:12,color:'#ffd39a',len:70,r:14});
    ceilingFan(c,700,286,t,{r:30});
    mugBoard(c,356,560,5,2,2);
    rect(1330,596,70,92,'#1c2428');rect(1334,600,62,84,'#2f3a3e');
    plainText(c,'CLOSED? NO.',1365,700,{color:'#c9b98f',size:8,align:'center'});
    occupant(c,452,830,1,{t,sd:3,task:'cook',col:'#14120e',rim:skin.warm+'77'});
    occupant(c,610,878,1,{t,sd:8,task:'cup',col:'#14120e',rim:skin.warm+'55'});
    occupant(c,1140,878,.96,{t,sd:11,task:'stand',col:'#14120e',rim:skin.warm+'55'});
  }else if(theme==='hangout'){
    // Bar, backlit bottles and stools.
    rect(760,700,214,14,'#6a4a52');rect(756,714,222,8,'#bd8b72');rect(764,722,206,74,'#3a2b36');
    for(let row=0;row<2;row++){
      const sy=730+row*32;
      rect(768,sy+22,198,4,'#80636b');
      for(let i=0;i<9;i++){
        const bx=774+i*21,hue=['#a19572','#718f80','#8a6a9a','#9a7a5a'][i%4];
        rect(bx,sy+6,8,16,hue+'dd');rect(bx+2,sy+3,4,5,'#bdb395');pool(c,bx+4,sy+10,12,hue,.1);
      }
    }
    shelfBottles(c,1000,560,90,120,{t,sd:5,rows:4,back:'#241a26'});
    // Flyers, a dartboard and a crate of records stacked under the loft.
    for(let i=0;i<4;i++){rect(340+i*66,362,56,74,i%2?'#3a2a3a':'#2a3340');rect(344+i*66,366,48,66,'#c9b0c8');
      plainText(c,['SET','LIVE','CASH','B2B'][i],368+i*66,404,{color:'#2a2028',size:9,align:'center'});
      plainText(c,['9PM','FRI','ALL','DM'][i],368+i*66,418,{color:'#5a4a58',size:6,align:'center'});}
    dot(c,530,560,26,'#2a2030');ring(c,530,560,24,'#8a6a7a',2);
    for(let i=0;i<12;i++)rect(530+Math.cos(i/12*6.283)*19,560+Math.sin(i/12*6.283)*19,2,2,'#1a1420');
    dot(c,530,560,7,'#1a1420');dot(c,534,556,2.4,'#c9b98f');
    for(const [cx2,cy2] of [[1180,860],[1206,860]]){rect(cx2,cy2-26,26,26,'#4a3a2c');rect(cx2+2,cy2-24,22,10,'#8a6a4a');rect(cx2+2,cy2-10,22,10,'#3a4a5a');}
    rect(1160,700,70,16,'#4a3a2c');rect(1162,702,26,12,'#8a6a4a');rect(1190,702,20,12,'#5a7a6a');
    for(let i=0;i<4;i++)stoolProp(c,776+i*54,880,{col:'#7a4a52',h:24});
    jukeboxProp(c,1300,880,{t,sd:3,col:'#6a2a4a'});
    // Stage, speakers and a moving equalizer.
    rect(1140,786,240,94,'#2a2028');rect(1140,780,240,8,'#5a4048');
    equalizerBars(c,1170,796,180,58,t,{sd:2,color:'#ff6ad0',n:14});
    plainText(c,'WIRE SAINTS / LIVE',1250,776,{color:'#e7b1e6',size:11,align:'center'});
    for(const sx of [1120,1372]){rect(sx,700,24,88,'#241a28');ring(c,sx+12,722,8,'#0d0a12',2.4);ring(c,sx+12,762,10,'#0d0a12',2.4);}
    pool(c,1250,760,120,'#ff6ad0',.1,true);
    // Card table under a low lamp, couch and cable spaghetti.
    tableTop(c,96,830,110,{h:34,col:'#4a3348',top:'#6a4458'});
    for(let i=0;i<4;i++)rect(112+(i%2)*22,812-(i>1?2:0),16,11,['#d8cfa8','#c98a9a','#8fb4c0','#c9b45a'][i]);
    rect(60,800,40,30,'#3a2434');rect(62,796,36,6,'#57364a');
    occupant(c,130,878,.98,{t,sd:4,task:'cup',col:'#150f16',rim:skin.warm+'66'});
    occupant(c,80,800,.96,{t,sd:6,task:'stand',col:'#150f16',rim:skin.warm+'55'});
    for(let i=0;i<5;i++)cableRun(c,1090+i*8,300+i*6,1410,700+i*8,40+i*12,{col:'#0d0a12',w:1.6});
    for(let i=0;i<6;i++)dot(c,300+i*210,302+i%2*6,2.4,'#ffb0d8');
    pool(c,700,310,200,'#ffb0d8',.07,true);
    pendantLamp(c,150,300,{t,sd:2,color:'#ffb0d8',len:96,r:12});
    pendantLamp(c,500,300,{t,sd:8,color:'#ffb0d8',len:40,r:14});
    pendantLamp(c,1000,300,{t,sd:13,color:'#ffb0d8',len:60,r:14});
    occupant(c,900,878,.98,{t,sd:10,task:'stand',col:'#150f16',rim:skin.warm+'55'});
    occupant(c,1270,872,.96,{t,sd:14,task:'phone',col:'#150f16',rim:skin.warm+'55'});
  }else{
    // Watch desk: the console slab carries a live bank of feeds.
    rect(1030,760,78,66,'#1b2b33');monitorBank(c,1036,766,66,44,{t,sd:3,color:'#7fd6e6',rows:4,label:'RAIN MARKET'});
    rect(1024,800,90,26,'#2a3c46');rect(1028,804,82,4,'#5f8a94');
    alarmRack(c,880,872,92,74,{t,sd:5,hot:true});
    // Lockers, weapons and a cot.
    lockerBank(c,1150,878,120,190,{sd:7,col:'#33454e'});
    lockerBank(c,1276,878,96,190,{sd:11,col:'#2c3c46'});
    weaponRack(c,700,878,130,96,{sd:2});
    rect(700,786,130,6,'#3a4a54');
    for(let i=0;i<5;i++)rect(706+i*26,792,3,84,'#26333a');
    rect(60,830,150,50,'#2b3b44');rect(64,818,142,14,'#3d505a');rect(70,806,60,12,'#c9d0cc');
    rect(216,828,12,52,'#33454e');rect(60,806,12,24,'#33454e');
    monitorBank(c,300,560,120,76,{t,sd:6,color:'#8fd6c0',rows:5,label:'GATE 02 / QUIET'});
    rect(300,640,120,40,'#16232a');grilleFloor(c,306,646,108,28,{sd:3});
    plainText(c,'SHIFT ENDS 06:00',360,700,{color:'#8fb4c0',size:9,align:'center'});
    mugBoard(c,300,740,5,2,4);
    // Duty board with officer photos.
    rect(880,300,210,120,'#16232a');rect(884,304,202,112,'#22323a');
    for(let i=0;i<6;i++){
      const px=892+(i%3)*64,py=312+((i/3)|0)*50;
      rect(px,py,56,42,'#33454e');ring(c,px+28,py+21,11,'#1a262c',2);
      plainText(c,['RVO','OKA','NIX','VRA','SOL','KAI'][i],px+28,py+25,{color:'#9fb2b8',size:7,align:'center'});
    }
    grilleFloor(c,30,700,240,180,{sd:9});
    rect(560,780,120,100,'#243038');
    for(let i=0;i<4;i++)rect(566+i*28,788,22,84,i%2?'#33454e':'#2a3a42');
    // First-aid box, hose reel, wall clock and an extinguisher on standby.
    rect(348,340,44,36,'#e8e4dc');rect(352,344,36,28,'#c94a44');
    rect(366,352,8,12,'#c94a44');rect(362,356,16,4,'#c94a44');
    dot(c,700,392,22,'#4a5a62');ring(c,700,392,20,'#2a3a42',3);ring(c,700,392,9,'#6a7a82',2);
    seg(c,700,392,700,376,'#c9d0cc',2);
    dot(c,470,660,22,'#2a343a');ring(c,470,660,20,'#63737a',2);dot(c,470,660,16,'#d2d8d2');
    seg(c,470,660,470,648,'#3a4a50',1.6);seg(c,470,660,482,664,'#8a3a2a',1.4);
    rect(316,782,16,34,'#a8342a');rect(318,816,12,6,'#2a2a28');seg(c,332,788,340,798,'#2a2a28',2);
    rect(310,776,28,7,'#c9d0cc');
    occupant(c,470,878,.98,{t,sd:3,task:'stand',col:'#0e1418',rim:skin.warm+'66'});
    occupant(c,940,878,.98,{t,sd:9,task:'cup',col:'#0e1418',rim:skin.warm+'55'});
    pendantLamp(c,200,300,{t,sd:1,color:'#cfe9ee',len:40,r:16});
    pendantLamp(c,760,300,{t,sd:6,color:'#cfe9ee',len:64,r:16});
    pendantLamp(c,1200,300,{t,sd:11,color:'#57e6dd',len:40,r:16});
    for(const [px,py] of [[520,320],[1320,320]]){rect(px,py,26,12,'#1c2a31');rect(px+2,py+12,22,6,'#e8f2f4');pool(c,px+13,py+20,60,'#dff2f6',.12,true);}
  }

  // Loft: pillars, deck underside, railing and what hangs beneath it.
  rect(712,636,14,244,'#31434c');rect(1350,636,14,244,'#31434c');rect(712,636,14,244,'#ffffff10');
  for(let x=730;x<1370;x+=44)rect(x,588,3,32,'#69757a');
  rect(710,584,660,4,'#86908a');rect(710,596,660,2,'#00000040');
  rect(726,636,624,10,'#25333b');
  for(let x=736;x<1340;x+=34){rect(x,646,8,8,'#2f3f47');cableRun(c,x,654,x+34,654,5,{col:'#0d1116',w:1.1});}
  laundryLine(c,740,1000,660,{t,sd:12,count:5,warm:true});
  occupant(c,880,700,.94,{t,sd:19,task:'phone',col:'#0f1418',rim:skin.warm+'55'});
  occupant(c,1180,700,.94,{t,sd:17,task:'stand',col:'#0f1418',rim:skin.warm+'55'});

  // Stairs: stringers, treads and a handrail under the gameplay ledges.
  for(const [sx,sy] of [[440,780],[540,700]]){
    rect(sx-3,sy+16,8,floor-sy-16,'#263942');rect(sx+105,sy+16,8,floor-sy-16,'#263942');
    seg(sx,sy+8,sx+110,floor-10,'#33454e',3);
    seg(sx,sy-22,sx+110,floor-46,'#4d5f68',2.4);
    for(let i=0;i<5;i++)rect(sx+6+i*22,sy+2,3,20-i*2,'#3d4f58');
  }
  for(let i=0;i<8;i++)rect(452+i*12,872-i*12,12,4,i%2?'#3d4f58':'#33454e');

  // Light pools and floating dust give the cutaway its volume.
  for(const [px,py,rr,col] of [[250,330,190,'#ffd39a'],[700,320,200,'#ffd39a'],[1180,320,190,skin.warm],[470,800,220,skin.warm],[1180,700,200,accent]]){
    const g=c.createRadialGradient(px,py,0,px,py,rr);
    g.addColorStop(0,col+'26');g.addColorStop(.55,col+'0c');g.addColorStop(1,'transparent');
    c.fillStyle=g;c.fillRect(px-rr,py-rr,rr*2,rr*2);
  }
  dustMotes(c,60,300,1320,560,t,{sd:5,n:20,col:skin.warm});

  // Street doors.
  for(const d of world.interactables.filter(o=>o.type==='door')){
    rect(d.x-36,d.y-128,72,128,'#3f4a48');rect(d.x-32,d.y-124,64,124,'#0e1f28');
    rect(d.x-26,d.y-116,52,116,'#22343c');rect(d.x-22,d.y-108,44,66,'#14242c');
    glassSheen(c,d.x-22,d.y-108,44,66,d.x,.16);
    rect(d.x-22,d.y-42,44,34,'#1c2c34');rect(d.x+14,d.y-52,4,10,'#dab68b');
    plainText(c,'STREET',d.x,d.y-136,{color:'#a7dad0',size:10,align:'center'});
    neonText(c,'EXIT',d.x,d.y-42,{color:'#a7dad0',size:11,align:'center',alpha:.85,flick:flicker(t,d.x,4)});
    pool(c,d.x,d.y-60,90,'#a7dad0',.07);
  }
}
function flameRowAt(c,x,y,w,h,t,sd){
  for(let i=0;i<4;i++){
    const f=.5+.5*Math.sin(t*8+i*1.7+sd);
    poly(c,[[x+i*(w/4),y+h],[x+i*(w/4)+3,y+h*.4*f],[x+i*(w/4)+w/8,y+h*.1*f],[x+i*(w/4)+w/4-3,y+h*.4*f],[x+i*(w/4)+w/4,y+h]],`rgba(255,150,70,${.6*f+.2})`);
  }
  pool(c,x+w/2,y+h/2,w,'#ff9a4a',.2,true);
}

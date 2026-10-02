import { Game, BUILDS, WEAPONS, SKILLS, xpForLevel } from './game.js';
import { render, renderPortrait } from './renderer.js';
import { AudioEngine } from './audio.js';
import { CAMPAIGN } from './world.js';
import { createAimController, drawTargeting } from './aim.js';

const $=s=>document.querySelector(s);
const canvas=$('#game'),ctx=canvas.getContext('2d',{alpha:false});
const audio=new AudioEngine();
const DEBUG=new URLSearchParams(location.search).has('debug');
const SAVE='null-rain-save-v1'+(DEBUG?'-qa':''),SETTINGS='null-rain-settings-v1';
let game=new Game(),selected='blade',onTitle=true,modalType=null,last=0,toastTimer,zoneTimer,logicalW=1440,logicalH=810,muted=false;
let tutorialDismissed=false;
const keys=new Set(),pressed=new Set();
const aiming=createAimController(canvas,{size:()=>({width:logicalW,height:logicalH}),enabled:()=>!onTitle&&!modalType&&game.mode==='playing',onRelease:()=>pause(),onFallback:()=>toast('Mouse capture unavailable here. Cursor aiming still works inside the game.')});
const mouse=aiming.state;
let save=null;
try{save=JSON.parse(localStorage.getItem(SAVE));const settings=JSON.parse(localStorage.getItem(SETTINGS)||'{}');muted=!!settings.muted;audio.setMuted(muted);}catch{}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3400);}
function persist(data){save=data;try{localStorage.setItem(SAVE,JSON.stringify(data));}catch{toast('Browser storage unavailable. This session remains playable.');}}
function clearInput(){keys.clear();pressed.clear();mouse.reset();}
function resize(){const ratio=innerWidth/innerHeight;logicalH=810;logicalW=logicalH*ratio;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(canvas.width/logicalW,0,0,canvas.height/logicalH,0,0);}
window.addEventListener('resize',resize);resize();
function renderBuilds(){
  $('#builds').innerHTML=Object.entries(BUILDS).map(([id,b],i)=>`<button class="build-card ${selected===id?'selected':''}" data-build="${id}" style="--accent:${b.color}" aria-pressed="${selected===id}"><small>0${i+1} / ${id==='blade'?'REFLEX':id==='ghost'?'INTELLIGENCE':id==='tank'?'BODY':'PRECISION'}</small><b>${b.name}</b><p>${b.role}</p><span class="build-check">${selected===id?'◈':'◇'}</span><canvas width="154" height="200" data-portrait="${id}"></canvas></button>`).join('');
  for(const c of document.querySelectorAll('[data-portrait]')){const cc=c.getContext('2d');renderPortrait(cc,c.dataset.portrait,78,130,1.4,0);}
  $('#continue').hidden=!save||save.complete;
}
renderBuilds();
$('#builds').addEventListener('click',e=>{const b=e.target.closest('[data-build]');if(!b)return;selected=b.dataset.build;renderBuilds();audio.play('ui');});

function showModal(type,content,wide=false){
  clearInput();aiming.release();document.body.classList.add('in-menu');modalType=type;$('#modal-content').className=`modal ${wide?'map-modal':''}`;$('#modal-content').innerHTML=content;$('#modal').hidden=false;
  audio.setPaused(true);setTimeout(()=>$('#modal-content').querySelector('button')?.focus({preventScroll:true}),50);
}
function closeModal(){
  $('#modal').hidden=true;document.body.classList.remove('in-menu');modalType=null;clearInput();if(!onTitle&&game.mode!=='dead'&&game.mode!=='complete')game.mode='playing';audio.setPaused(onTitle);canvas.focus?.();
}
function start(build=selected,continueSave=false){
  audio.start().catch(()=>{});audio.setPaused(false);game=new Game(build);if(continueSave&&save)game.restore(save);
  onTitle=false;modalType=null;tutorialDismissed=continueSave;$('#title-screen').hidden=true;$('#hud').hidden=false;$('#modal').hidden=true;document.body.classList.add('playing');$('#header-status').textContent='DISTRICT 07 / LIVE SIGNAL';
  game.camera.x=clamp(game.player.x-logicalW*.4,0,game.world.width-logicalW);game.camera.y=clamp(game.player.y-logicalH*.65,0,game.world.height-logicalH+100);clearInput();
  aiming.seed(game.player,game.camera);document.body.classList.remove('in-menu');
  if(!continueSave){showModal('briefing',`<div class="eyebrow">CONTRACT 01 / THE RAIN MARKET</div><h2>Steal back the rain.</h2><p>Helix sells the city its own memories. Yours are somewhere in their weather archive. Unlink two security relays, get past the Warden, and extract the core.</p><div class="manual-grid"><section><h3>01 / FIND YOUR ROUTE</h3><p>Street, maintenance, or rooftops.<br><kbd>SPACE</kbd> twice for a double jump.<br><kbd>W S</kbd> climb the cyan ladders.</p></section><section><h3>02 / STAY UNSEEN</h3><p><kbd>S</kbd> crouch in marked shadows.<br><kbd>E</kbd> behind guards: silent takedown.<br><kbd>F</kbd> send a decoy ping ahead.</p></section><section><h3>03 / BREAK THE RULES</h3><p><kbd>J</kbd> or click: primary attack.<br>Hold <kbd>RMB</kbd> aim · <kbd>LMB</kbd> fire.<br><kbd>Q C V</kbd> three build abilities.</p></section></div><small class="note">${BUILDS[build].tip} Safehouses refill health and set your retry point. Progress also saves after objectives.</small><div class="modal-actions"><button class="primary-button" data-action="begin">GO DARK <span>→</span></button><span class="chip" style="color:#79949c">M — DISTRICT MAP / H — FIELD MANUAL</span></div>`);game.mode='briefing';}
}
$('#deploy').onclick=()=>start();$('#continue').onclick=()=>start(save.player.build,true);
function title(){
  aiming.release();
  if(!onTitle&&game.mode!=='complete'&&game.mode!=='dead')persist(game.serialize());onTitle=true;game.mode='title';document.body.classList.remove('playing');$('#hud').hidden=true;$('#title-screen').hidden=false;$('#modal').hidden=true;modalType=null;$('#header-status').textContent='OFFLINE / SINGLE PLAYER';audio.setPaused(true);clearInput();renderBuilds();
}
function help(){if(!onTitle)game.mode='paused';showModal('help',`<div class="eyebrow">FIELD MANUAL / PC CONTROLS</div><h2>A thousand ways through.</h2><div class="manual-grid"><section><h3>MOVEMENT</h3><p><kbd>A D</kbd> or <kbd>← →</kbd> Move<br><kbd>SPACE</kbd> Jump / double jump<br><kbd>SHIFT</kbd> Dash · brief invulnerability<br><kbd>W S</kbd> Climb ladders<br><kbd>S</kbd> Crouch in shadow<br><kbd>S + SPACE</kbd> Drop through a ledge</p></section><section><h3>COMBAT</h3><p><kbd>LMB</kbd> / <kbd>J</kbd> Signature weapon<br><kbd>RMB</kbd> Hold precision aim / capture mouse<br><kbd>RMB + LMB</kbd> / <kbd>K</kbd> Fire sidearm<br><kbd>Q C V</kbd> Power / technique / defense<br><kbd>R</kbd> Cycle collected sidearms<br><kbd>E</kbd> Takedown from behind<br>Aim down + slash in air to bounce off enemies.</p></section><section><h3>INFILTRATION</h3><p><kbd>E</kbd> Use / hack / collect<br><kbd>F</kbd> Decoy ping · 20 energy<br><kbd>M</kbd> / <kbd>TAB</kbd> District map<br><kbd>T</kbd> XP talents · three paths<br><kbd>ESC</kbd> Release cursor / pause<br>Sync at safehouses to refill and save.<br>Spend 3 salvage on each augment.</p></section></div><small class="note">Right click captures the mouse; a game reticle replaces the cursor. Aim freely while moving. Q / C / V abilities spend energy and have independent cooldowns. Vision cones fill from amber to red. Crouching in a shadow hides you beyond close range. Break line of sight and patrols will search, then stand down. Attacks and decoys create sound rings.</small><div class="modal-actions"><button class="primary-button" data-action="close">UNDERSTOOD <span>→</span></button></div>`);}
$('#title-help').onclick=help;$('#help-button').onclick=help;
function pause(){if(onTitle||modalType)return;game.mode='paused';showModal('pause',`<div class="eyebrow">SIGNAL HELD / PAUSED</div><h2>The rain can wait.</h2><p>${escape(game.objective)}<br>${BUILDS[game.player.build].name} · ${game.player.credits} salvage · ${game.stats.shards}/3 memory fragments</p><div class="modal-actions"><button class="primary-button" data-action="close">RESUME <span>→</span></button><button class="text-button" data-action="help">FIELD MANUAL</button><button class="text-button" data-action="title">SAVE & TITLE</button></div>`);}
$('#pause-button').onclick=pause;
function drawMap(){
  const c=$('#map-canvas'),mc=c.getContext('2d');const w=c.width,h=c.height,sx=(w-80)/game.world.width,sy=(h-65)/game.world.height;const px=x=>40+x*sx,py=y=>20+y*sy;
  mc.fillStyle='#081722';mc.fillRect(0,0,w,h);mc.font='11px monospace';mc.textAlign='left';
  for(const z of game.world.zones){mc.fillStyle=z.color+'08';mc.fillRect(px(z.x),20,z.w*sx,h-50);mc.fillStyle=z.color;mc.fillText(z.name,px(z.x)+14,40);}
  mc.strokeStyle='#739aa566';mc.lineWidth=2;for(const p of game.world.platforms){mc.beginPath();mc.moveTo(px(p.x),py(p.y));mc.lineTo(px(p.x+p.w),py(p.y));mc.stroke();}
  mc.setLineDash([3,3]);mc.strokeStyle='#59b2b666';mc.lineWidth=2;for(const l of game.world.ladders){mc.beginPath();mc.moveTo(px(l.x),py(l.y));mc.lineTo(px(l.x),py(l.y+l.h));mc.stroke();}mc.setLineDash([]);
  for(const o of game.world.interactables){if(o.done||['health','energy','shard'].includes(o.type))continue;mc.fillStyle=o.type==='terminal'||o.type==='exit'?'#ffbd76':o.type==='checkpoint'?'#84f6e3':'#bd9ced';mc.fillRect(px(o.x)-3,py(o.y)-6,6,6);if(o.type==='terminal'||o.type==='exit'){mc.font='8px monospace';mc.fillText(o.id==='relay-market'?'RELAY A':o.id==='relay-spire'?'RELAY B':o.id==='boss-override'?'OVERRIDE':o.id.toUpperCase(),px(o.x)-24,py(o.y)-13);}}
  const p=game.player;mc.fillStyle='#e8ffff';mc.beginPath();mc.arc(px(p.x+14),py(p.y+54)-3,5,0,Math.PI*2);mc.fill();mc.strokeStyle='#7ce9dc';mc.beginPath();mc.arc(px(p.x+14),py(p.y+54)-3,10,0,Math.PI*2);mc.stroke();mc.fillStyle='#ddfff4';mc.font='9px monospace';mc.fillText('YOU',px(p.x+14)+15,py(p.y+54));
}
function map(){if(onTitle)return;if(modalType==='map'){closeModal();return;}if(modalType)return;game.mode='paused';showModal('map',`<div class="eyebrow">DISTRICT 07 / RECOVERED SCHEMATIC</div><h2>The Rain Market</h2><p>${escape(game.objective)}. Ladders connect the streets to the rooftops. The upper crown offers another way past the Warden.</p><canvas id="map-canvas" width="1040" height="400" aria-label="District map"></canvas><div class="map-legend"><span><i></i>SAFEHOUSE / YOU</span><span><i></i>OBJECTIVE</span><span><i></i>CACHE / MEMORY / BENCH</span></div><div class="modal-actions"><button class="primary-button" data-action="close">BACK TO THE RAIN <span>→</span></button><small class="note">M / TAB TO CLOSE</small></div>`,true);drawMap();}
$('#map-button').onclick=map;
let hack=null;
function hacking(o){
  hack={object:o,bits:o.id==='relay-market'?[false,true,false]:o.id==='relay-spire'?[true,false,false]:[false,false,true],moves:0};
  showModal('hack',`<div class="eyebrow">LOCAL ACCESS / ${escape(o.label)}</div><h2>Break the circuit.</h2><p>Bring all three signal nodes online. Each switch flips its own node and the next one; the last switch flips only itself.</p><div class="hack-board"><div class="hack-wire"></div><div class="hack-nodes">${[0,1,2].map(i=>`<button class="hack-node" data-node="${i}"><strong>0${i+1}</strong><span>OFFLINE</span></button>`).join('')}</div><p class="hack-hint">Left affects 01 + 02. Middle affects 02 + 03. Right affects 03.<br>Think from left to right. Your signal stays undetected while solving.</p><div class="hack-state" id="hack-state">SIGNAL NOT CONNECTED</div></div><div class="modal-actions"><button class="text-button" data-action="close">DISCONNECT / ESC</button>${game.player.build==='ghost'?'<button class="text-button" data-action="quickhack">NETRUNNER BYPASS · 30 ENERGY</button>':game.player.build==='tank'?'<button class="text-button" data-action="forcehack">FORCE OPEN · 15 HEALTH / LOUD</button>':''}</div>`);updateHack();
}
function updateHack(){for(const b of document.querySelectorAll('[data-node]')){const active=hack.bits[+b.dataset.node];b.classList.toggle('on',active);b.querySelector('span').textContent=active?'CONNECTED':'OFFLINE';}}
function finishHack(){const o=hack.object;closeModal();game.hackSuccess(o);hack=null;}
function upgrades(o){
  const choices=[['armor','SUBDERMAL WEAVE','+35 maximum health. Fully restores health on install.'],['reactor','CLOSED-LOOP CELL','Energy regenerates 70% faster. More dashes and abilities.'],['edge','WEAPON OVERCLOCK','All signature and sidearm damage increases by 25%.']];
  showModal('upgrade',`<div class="eyebrow">RIPPER TERMINAL / ${game.player.credits} SALVAGE</div><h2>Make yourself impossible.</h2><p>Three augments. Three salvage each. Each can be installed once.</p><div class="choice-grid">${choices.map(([id,name,desc])=>`<button class="choice ${game.player.upgrades.includes(id)?'owned':''}" data-upgrade="${id}" ${game.player.upgrades.includes(id)?'disabled':''}><small>${game.player.upgrades.includes(id)?'INSTALLED':'3 SALVAGE'}</small><b>${name}</b><p>${desc}</p></button>`).join('')}</div><div class="modal-actions"><button class="text-button" data-action="close">DISCONNECT / ESC</button></div>`);
}
function talents(){
  if(onTitle||modalType&&modalType!=='talents')return;game.mode='paused';const p=game.player;
  const options=[['force','FORCE','+15% weapon and ability damage per rank.'],['flow','FLOW','Per rank: 12% faster energy recovery, 12% shorter ability cooldowns and 10% lower ability energy costs.'],['guard','GUARD','Per rank: +20 maximum health, recover 20 health and take 8% less damage.']];
  showModal('talents',`<div class="eyebrow">NEURAL GROWTH / LEVEL ${p.level} · ${p.skillPoints} POINT${p.skillPoints===1?'':'S'}</div><h2>Earn your next edge.</h2><p>Combat, silent takedowns, first-time hacks and memory fragments grant XP. Each level earns one point. Three paths, two ranks each.</p><div class="choice-grid">${options.map(([id,name,desc])=>`<button class="choice" data-talent="${id}" ${p.skillPoints<1||p.talents[id]>=2?'disabled':''}><small>RANK ${p.talents[id]} / 2 · 1 POINT</small><b>${name}</b><p>${desc}</p></button>`).join('')}</div><div class="modal-actions"><button class="primary-button" data-action="close">BACK TO THE RAIN →</button><small class="note">${p.level>=5?'MAXIMUM LEVEL':`${p.xp} / ${xpForLevel(p.level+1)} TOTAL XP TO NEXT LEVEL`}</small></div>`);
}
$('#talent-button').onclick=talents;
const ENDINGS={
  release:{name:'OPEN THE SKY',line:'You gave the memories back.',desc:'The rain turns silver. For seven seconds, every window in the market shows a life someone was paid to forget. Then the messages arrive: thank you. Stop. I remember. Freedom is not a clean signal — but it is theirs now.',future:'In Glass Garden, someone is growing bodies for the people inside the archive.'},
  shelter:{name:'BUILD A SANCTUARY',line:'You made a place for the forgotten.',desc:'You isolate the archive from Helix, leaving each mind a choice: return, or rest. The Warden opens its eyes for the first time without an order. “Can it still rain in here?” it asks. You leave the weather running.',future:'The sanctuary needs a physical home. A seed in Glass Garden has already found one.'},
  trade:{name:'BUY BACK YOUR NAME',line:'You found yourself. Almost.',desc:'Helix restores your identity in exchange for a clean copy. But the courier in your old photograph has a different face. The archive did not steal your past. It made you from someone else’s unfinished promise. You keep the original core.',future:'The name in the photograph leads to Glass Garden. Your story is just beginning.'}
};
function ending(){showModal('ending',`<div class="eyebrow">THE WEATHER ARCHIVE / EXTRACTION READY</div><h2>They aren't records.<br>They're still here.</h2><p>The stolen memories are living minds. Your employer wanted a file. You found a city. ${game.flags.wardenSpared?'The Warden, freed from its orders, waits for your decision.':'A final recording from the Warden asks you to leave the rain running.'}</p><div class="choice-grid"><button class="choice" data-ending="release"><small>01 / FREEDOM</small><b>OPEN THE SKY</b><p>Broadcast the archive. Let the people reclaim their memories.</p></button><button class="choice" data-ending="shelter"><small>02 / SANCTUARY</small><b>KEEP THEM SAFE</b><p>Sever corporate access. Let the minds decide their own future.</p></button><button class="choice" data-ending="trade"><small>03 / IDENTITY</small><b>BUY BACK YOUR NAME</b><p>Trade a copy for your past. Keep the original, just in case.</p></button></div>`);}
function complete(choice){
  const e=ENDINGS[choice];game.flags.ending=choice;game.mode='complete';persist({...game.serialize(),complete:true});audio.setPaused(false);
  const minutes=Math.floor(game.stats.time/60),seconds=Math.floor(game.stats.time%60).toString().padStart(2,'0');
  showModal('complete',`<div class="eyebrow">CHAPTER 01 / SIGNAL DELIVERED</div><h2>${e.line}</h2><p>${e.desc}</p><small class="note">${e.future}</small><div class="stats-row"><div><b>${minutes}:${seconds}</b>MISSION TIME</div><div><b>${game.stats.takedowns}</b>SILENT TAKEDOWNS</div><div><b>${game.stats.shards}/3</b>MEMORY FRAGMENTS</div><div><b>${game.flags.wardenSpared?'SPARED':'DEFEATED'}</b>THE WARDEN</div></div><div class="chapters">${CAMPAIGN.map((c,i)=>`<div>CHAPTER 0${i+1} / ${i===0?'COMPLETE':'PLANNED'}<b>${c.name.slice(5)}</b><p>${c.biome}</p></div>`).join('')}</div><small class="note" style="margin-top:18px">End of Chapter One. Glass Garden and Dead Sun are future campaign destinations.</small><div class="modal-actions"><button class="primary-button" data-action="title">BACK TO TITLE <span>→</span></button><button class="text-button" data-action="replay">REPLAY THIS BUILD</button></div>`);
}
function processEvents(){
  for(const e of game.events){
    if(e.type==='sound')audio.play(e.name);
    if(e.type==='toast')toast(e.text);
    if(e.type==='levelup')toast(`NEURAL LEVEL ${e.level} / New talent point. Press T to evolve.`);
    if(e.type==='save')persist(e.data);
    if(e.type==='hack')hacking(e.object);
    if(e.type==='upgrade')upgrades(e.object);
    if(e.type==='lore')showModal('lore',`<div class="eyebrow">MEMORY FRAGMENT ${game.stats.shards} / 3</div><h2>${escape(e.object.label)}</h2><p>${escape(e.object.text||e.object.description||'An echo from another life.')}</p><small class="note">+2 SALVAGE · ARCHIVE FRAGMENT RECOVERED</small><div class="modal-actions"><button class="primary-button" data-action="close">KEEP MOVING <span>→</span></button></div>`);
    if(e.type==='ending')ending();
    if(e.type==='death')showModal('death',`<div class="eyebrow">CONNECTION LOST / MEMORY INTACT</div><h2>Signal interrupted.</h2><p>The city got a little too close. Retry from your last safehouse sync with full health and energy.</p><small class="note">Dash through attacks. Crouch in shadows. Use rooftops to bypass patrols. Use Q / C / V together. Aim down and slash in the air to bounce from a target.</small><div class="modal-actions"><button class="primary-button" data-action="retry">RECONSTRUCT <span>↻</span></button><button class="text-button" data-action="title">TITLE SCREEN</button></div>`);
    if(e.type==='zone'){const z=$('#zone-banner');z.querySelector('b').textContent=e.name;z.classList.add('show');clearTimeout(zoneTimer);zoneTimer=setTimeout(()=>z.classList.remove('show'),3100);}
  }
  game.events=[];
}
$('#modal-content').addEventListener('click',e=>{
  const target=e.target.closest('button');if(!target)return;audio.play('ui');
  if(target.dataset.node!==undefined&&hack){const i=+target.dataset.node;hack.bits[i]=!hack.bits[i];if(i<2)hack.bits[i+1]=!hack.bits[i+1];hack.moves++;updateHack();if(hack.bits.every(Boolean)){document.querySelectorAll('[data-node]').forEach(b=>b.disabled=true);$('#hack-state').textContent='ACCESS GRANTED / DISCONNECTING';setTimeout(()=>{if(hack&&modalType==='hack')finishHack();},400);}return;}
  if(target.dataset.upgrade){if(game.upgrade(target.dataset.upgrade))closeModal();return;}
  if(target.dataset.talent){if(game.spendTalent(target.dataset.talent)){persist(game.serialize());talents();}return;}
  if(target.dataset.ending){complete(target.dataset.ending);audio.setPaused(false);audio.play('win');return;}
  switch(target.dataset.action){
    case 'begin':case 'close':closeModal();break;
    case 'help':help();break;
    case 'title':title();break;
    case 'replay':start(game.player.build);break;
    case 'retry':game=game.retry();game.camera.x=clamp(game.player.x-logicalW*.4,0,game.world.width-logicalW);game.camera.y=clamp(game.player.y-logicalH*.65,0,game.world.height-logicalH+100);closeModal();break;
    case 'quickhack':if(game.player.energy>=30){game.player.energy-=30;finishHack();}else toast('30 energy required for a remote bypass.');break;
    case 'forcehack':if(game.player.hp>15){game.player.hp-=15;const o=hack.object;finishHack();game.noise(o.x,o.y,650);}else toast('More than 15 health required to force this connection.');break;
  }
});
$('#brand').onclick=e=>{e.preventDefault();if(!onTitle)pause();};
$('#audio-toggle').onclick=()=>{muted=!muted;audio.setMuted(muted);$('#audio-toggle').textContent=muted?'×♪':'♪';$('#audio-toggle').title=muted?'Unmute audio':'Mute audio';try{localStorage.setItem(SETTINGS,JSON.stringify({muted}));}catch{}};
$('#audio-toggle').textContent=muted?'×♪':'♪';
$('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>toast('Fullscreen is unavailable in this browser panel.'));};
window.addEventListener('keydown',e=>{
  const code=e.code;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(code))e.preventDefault();if(!keys.has(code))pressed.add(code);keys.add(code);
  if(e.repeat)return;
  if(code==='Escape'){if(modalType&&!['death','ending','complete'].includes(modalType)){closeModal();}else if(!onTitle)pause();return;}
  if(code==='KeyM'||code==='Tab'){map();return;}if(code==='KeyH'&&!modalType){help();return;}
  if(code==='KeyT'){if(modalType==='talents')closeModal();else talents();return;}
  if(!onTitle&&!modalType&&code==='KeyR'){const p=game.player;const index=p.owned.indexOf(p.secondary);p.secondary=p.owned[(index+1)%p.owned.length];toast(`${WEAPONS[p.secondary].name} / ${WEAPONS[p.secondary].label}`);}
  if(modalType==='hack'&&['Digit1','Digit2','Digit3'].includes(code))document.querySelector(`[data-node="${+code.at(-1)-1}"]`)?.click();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();if(!onTitle&&!modalType&&game.mode==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(!onTitle&&!modalType)pause();}});

function input(){const has=(...k)=>k.some(v=>keys.has(v)),hit=(...k)=>k.some(v=>pressed.has(v)),mb=mouse.buttons();return {left:has('KeyA','ArrowLeft'),right:has('KeyD','ArrowRight'),up:has('KeyW','ArrowUp'),down:has('KeyS','ArrowDown'),jumpPressed:hit('Space'),dashPressed:hit('ShiftLeft','ShiftRight'),attack:has('KeyJ')||mb.attack,secondary:has('KeyK')||mb.secondary,aiming:mb.aiming,abilityPressed:hit('KeyQ'),skillPressed:hit('KeyC'),guardPressed:hit('KeyV'),interactPressed:hit('KeyE'),noisePressed:hit('KeyF'),aim:mouse.world(game.camera)};}
function updateHUD(){
  const p=game.player,b=BUILDS[p.build];$('#build-name').textContent=b.name;$('#hp-label').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('#hp-fill').style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;$('#energy-fill').style.width=`${p.energy}%`;
  for(const [key,field] of [['q','abilityCooldown'],['c','skillCooldown'],['v','guardCooldown']]){const skill=SKILLS[p.build][key],cd=p[field]||0;$('#skill-'+key+'-name').textContent=skill.name;$('#skill-'+key+'-status').textContent=cd>0?`${cd.toFixed(1)}s`:p.energy<skill.cost*(1-p.talents.flow*.1)?'LOW ENERGY':'READY';$('#skill-'+key).classList.toggle('ready',cd<=0&&p.energy>=skill.cost*(1-p.talents.flow*.1));$('#skill-'+key).title=skill.description;}
  const lower=xpForLevel(p.level),upper=xpForLevel(p.level+1);$('#xp-fill').style.width=`${p.level>=5?100:clamp((p.xp-lower)/(upper-lower)*100,0,100)}%`;$('#xp-label').textContent=`LV ${p.level} · ${p.level>=5?'MAX':`${p.xp-lower} / ${upper-lower} XP`}`;$('#talent-button').innerHTML=`<kbd>T</kbd> ${p.skillPoints>0?`${p.skillPoints} TALENT POINT${p.skillPoints===1?'':'S'}`:'TALENTS'}`;$('#talent-button').classList.toggle('available',p.skillPoints>0);
  $('#aim-status').textContent=mouse.right?'PRECISION AIM · LMB FIRE':document.pointerLockElement===canvas?'MOUSE CAPTURED · ESC RELEASE':'RMB AIM / CAPTURE · LMB ATTACK';
  const sec=game.security;$('#header-status').textContent=sec.suppressed>0?`ALARM JAMMED / ${Math.ceil(sec.suppressed)}s`:sec.level===2?'⚠ LOCKDOWN / RESPONSE ACTIVE':sec.level===1?'⚠ SECURITY ALERT':sec.heat>.05?'SECURITY / COOLING DOWN':'DISTRICT 07 / LOW PROFILE';$('#header-status').style.color=sec.level>0?'#ff8c87':'';
  $('#security-state').textContent=sec.suppressed>0?'JAMMED':sec.level===2?'LOCKDOWN':sec.level===1?'ALERT':sec.heat>.05?'COOLING':'LOW PROFILE';$('#district-security').dataset.level=sec.level;$('#security-fill').style.width=`${sec.heat*100}%`;$('.security-track').setAttribute('aria-valuenow',Math.round(sec.heat*100));$('#security-hint').textContent=sec.suppressed>0?`Response blocked for ${Math.ceil(sec.suppressed)}s. Guards still fight.`:sec.dispatch>0?`Backup arrives in ${Math.ceil(sec.dispatch)}s. Fight or break contact.`:sec.level===2?'Reinforcements active. Roof routes remain open.':sec.level===1?'Patrols move and fire faster. Safehouses locked.':sec.heat>.05?'Break contact to let the district cool down.':'Stealth keeps patrol pressure low.';
  $('#salvage').textContent=`${p.credits} SALVAGE`;$('#visibility').textContent=p.hidden?'◌ HIDDEN':game.alarm>.8?'▲ DETECTED':game.alarm>.2?'◈ SUSPICIOUS':'◉ VISIBLE';$('#visibility').style.color=p.hidden?'#89f4de':game.alarm>.8?'#ff859a':'#a3b2b5';$('#objective').textContent=game.objective;
  $('#primary-name').textContent=p.weapon.toUpperCase();$('#secondary-name').textContent=WEAPONS[p.secondary]?.name.toUpperCase();$('#cycle-hint').textContent=p.owned.length>1?'· R CYCLE':'';
  const target=game.targets.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];$('#target-distance').textContent=target?`${target.x>p.x?'→':'←'} ${Math.round(Math.hypot(target.x-p.x,target.y-p.y)/10)}m · ${target.y<p.y-130?'ABOVE YOU':target.y>p.y+180?'BELOW YOU':target.label}`:'';
  const interaction=game.interaction();$('#interact-prompt').hidden=!interaction||!!modalType;if(interaction)$('#interact-prompt').innerHTML=`<kbd>E</kbd>${escape(interaction.label||'Interact')}`;
  const boss=game.enemies.find(e=>e.type==='boss'&&e.active&&!e.dead);$('#boss-hud').hidden=!boss;if(boss){$('#boss-fill').style.width=`${boss.hp/boss.maxHp*100}%`;$('#boss-status').textContent=boss.stun>0?'SYSTEM INTERRUPTED':boss.telegraph>0?['VOLLEY INCOMING','CHARGE INCOMING — JUMP','RADIAL BURST'][boss.phase]:'MUNICIPAL DEFENSE CONSTRUCT';}
  const t=$('#tutorial');t.hidden=tutorialDismissed||p.x>1100||game.stats.time>75||!!modalType;if(!t.hidden)t.innerHTML=p.x<480?'<b>FIRST STEPS / TAKE THE HIGH ROAD</b>A / D move. SPACE jumps, then press again in the air.<br>Hold W at the cyan ladder. Your first relay is above the market.':'<b>YOU ARE NOT ALONE</b>Orange cones show enemy sight. Hold S inside a marked shadow to hide. Get behind a guard and press E.';
  if(!t.hidden&&innerWidth<1000)$('#interact-prompt').hidden=true;
}
function frame(now){
  const dt=Math.min((now-last)/1000||.016,.0334);last=now;
  if(onTitle){game.time+=dt;game.camera.x=1100+Math.sin(now*.000035)*230;game.camera.y=1100+Math.sin(now*.000045)*40;}
  else{
    game.update(dt,input());processEvents();
    const p=game.player;const desiredX=clamp(p.x+p.w/2-logicalW*.46+p.dir*90,0,Math.max(0,game.world.width-logicalW));const desiredY=clamp(p.y+p.h-logicalH*.67,0,game.world.height-logicalH+75);
    if(!modalType){game.camera.x+=(desiredX-game.camera.x)*(1-Math.exp(-dt*5));game.camera.y+=(desiredY-game.camera.y)*(1-Math.exp(-dt*5));}
    updateHUD();audio.setIntensity(game.alarm*.6+(game.enemies.some(e=>e.type==='boss'&&e.active&&!e.dead)?.4:0));
  }
  pressed.clear();ctx.save();if(game.shake>0&&!onTitle)ctx.translate((Math.random()-.5)*game.shake*12,(Math.random()-.5)*game.shake*12);render(ctx,game,logicalW,logicalH);ctx.restore();if(!onTitle&&!modalType&&game.mode==='playing')drawTargeting(ctx,game,mouse,logicalW,logicalH);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);$('#loading').classList.add('loading-fade');
// An explicit debug bridge is available only when opted into by local QA.
if(DEBUG){
  window.__NULL_RAIN__={get game(){return game;},start:(build='blade')=>{start(build);closeModal();},closeModal,complete,step:(dt,i)=>{game.update(dt,i);processEvents();},get audio(){return audio;},save:()=>game.serialize()};
  // Local QA fixture controls. Normal play never installs these shortcuts.
  window.addEventListener('keydown',e=>{
    if(!e.altKey||onTitle)return;
    if(e.code==='Digit1'){
      closeModal();const o=game.world.interactables.find(o=>o.id===(!game.flags['relay-market']?'relay-market':'relay-spire'));Object.assign(game.player,{x:o.x-14,y:o.y-54,vx:0,vy:0,invuln:5});
    }
    if(e.code==='Digit2'){
      closeModal();game.flags['relay-market']=game.flags['relay-spire']=true;game.updateGates();Object.assign(game.player,{x:6170,y:2086,vx:0,vy:0,hp:game.player.maxHp,energy:100,invuln:3});
    }
    if(e.code==='Digit3'){
      closeModal();game.flags['relay-market']=game.flags['relay-spire']=true;game.resolveBoss(true);game.flags.core=true;game.updateGates();Object.assign(game.player,{x:7035,y:2086,vx:0,vy:0,hp:game.player.maxHp});
    }
    if(e.code==='Digit4'){closeModal();game.raiseAlarm(1);game.player.invuln=10;}
    if(e.code==='Digit5'){closeModal();const o=game.world.interactables.find(o=>o.id==='security-market');Object.assign(game.player,{x:o.x-14,y:o.y-54,vx:0,vy:0,invuln:5});}
    if(e.code==='Digit6'){closeModal();game.gainXP?.(180);processEvents();}
  });
}

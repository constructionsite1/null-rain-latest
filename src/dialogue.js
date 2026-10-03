// In-world story dialogue. Non-blocking: never pauses the game or captures input (Enter skips a line).
const SPK={VEX:'#83f4e4',WARDEN:'#ff4fd8',YOU:'#ffbd76'};
const FALLBACK={blade:'Edge first. Questions never.',ghost:'Quiet feet. Quieter plans.',tank:'Walls move when I do.',gun:'Range is a love language.'};
const L={
 start:[['VEX','Comms up. You are in the Rain Market, runner. Helix keeps your memories in the weather archive.'],['YOU',{blade:'Then I will cut the sky open and take them back.',ghost:'In and out. They will not even see the rain move.',tank:'Knock first. Then through the door anyway.',gun:'Archive has a lot of windows. Good. I like sightlines.'}],['VEX','Two relays, one Warden, one core. Do not die interesting.'],['VEX',{blade:'Blade rig: Q fractures time, C blinkstrikes your mark, V parries their bullets back. Chain them.',ghost:'Ghost rig: Q chain-breaches nearby targets, C drops an EMP at your cursor, V cloaks you. Stay unseen.',tank:'Tank rig: Q sends a seismic pulse, C is a shoulder rush, V braces a barrier. Be the wall.',gun:'Gun rig: Q is deadeye, C fans a volley, V is a reflex evade. Keep your distance.'}]],
 zone:[[['VEX','New sector. Camera density up. Stay off the neon.']],[['VEX','Signal is thin here. Keep moving, I will keep listening.']],[['YOU',{blade:'Fresh steel, fresh district.',ghost:'Shadows are thicker here. Good.',tank:'Narrow halls. I will make them wider.',gun:'Counting exits. Counting angles.'}]],[['VEX','Helix patrols loop every ninety seconds. Learn the rhythm.']],[['VEX','Rain is heavier up here. Sensors hate that. So do I.']],[['VEX','Vendor drones hum overhead. Ignore the ads, they are tracking you.']],[['YOU',{blade:'Smell that? Ozone and noodles.',ghost:'Crowd is thick. Good cover.',tank:'Crowds part for me. Eventually.',gun:'Rooftops all around. Lovely.'}]],[['VEX','Street kid on the corner: "Helix pays for faces, runner. Keep yours covered."']],[['VEX','Neon sign says OPEN ALL NIGHT. Nothing here is honest, but it is open.']],[['VEX','Overheard: "They wiped the whole block last cycle. Nobody asked why."']],[['VEX','Corp patrol on the next street. Count the boots, not the lights.']]],
 hack:[[['VEX','Relay handshake open. Hold the line while I scrub it.'],['YOU',{blade:'Hack fast. My patience is edged too.',ghost:'Door is a suggestion now.',tank:'If it fights back, I will hit it.',gun:'Cover me, VEX. I will cover the door.'}]],[['VEX','Nice. Their eyes just went blind for a breath.'],['WARDEN','Someone is knocking on my network. How rude.']],[['VEX','Relay down. Helix will notice. Move before they do.']],[['WARDEN','You are pulling threads, runner. The whole city is stitched to them.']]],
 lore:[[['VEX','That is a memory shard. Yours. Do not let it flicker.'],['YOU',{blade:'Every shard is a promise I owe someone.',ghost:'I remember a rooftop. Wind. A name.',tank:'Heavier than it looks. Good, keep it.',gun:'One more piece of the picture.'}]],[['VEX','Helix sold this back to you once already. Not again.']],[['VEX','Careful. Memories bite when they come home.']],[['VEX','Another shard. The picture of who you were is sharpening.']],[['YOU',{blade:'I know this place. I bled here.',ghost:'Someone I trusted. Someone who left.',tank:'It hurts. Means it is real.',gun:'A name on the tip of my tongue.'}]]],
 upgrade:[[['VEX','Fresh hardware. Chrome smells like ozone and bad ideas.'],['YOU',{blade:'Sharper. Faster. Mine.',ghost:'Lighter. Quieter. Better.',tank:'Heavier. Meaner. Mine.',gun:'More range, fewer excuses.'}]],[['VEX','Install complete. Try not to brag.']],[['VEX','Chrome is cheap. Surviving is not. Spend wisely.']]],
 levelup:[[['VEX','Level up. Spend that point, runner, unspent edge is dead weight.']],[['VEX','Neural climb confirmed. Your talent tree just grew a branch.'],['YOU',{blade:'Still hungry.',ghost:'Another layer deeper.',tank:'Level up. Bigger problem for them.',gun:'Sharper aim, same bad attitude.'}]]],
 boss:[[['WARDEN','You are a draft the city forgot to delete, runner.'],['VEX','That is the Warden. Break her guard, then hit hard.']]],
 ending:[[['VEX','Core extracted. Signal clean. You did it, runner.'],['WARDEN','Delete me and Helix writes another me. Rain always falls.'],['YOU',{blade:'Then I will cut every one of them.',ghost:'Let it rain. I will already be gone.',tank:'Send the next one. I will be waiting.',gun:'Next time I will see you coming from a mile off.'}]]],
 death:[[['VEX','Flatline. Rebooting your signal, hold on.']],[['WARDEN','Another echo lost in the rain. How tragic.']],[['YOU',{blade:'Not yet.',ghost:'Again. Smarter.',tank:'Still standing. Barely.',gun:'Recalibrating. One more try.'}]]],
 save:[[['VEX','Checkpoint synced. Safehouse log updated.']],[['VEX','Progress locked. Breathe for a second.']],[['VEX','Saved. Rain keeps falling, but now you keep your place.']]]
};
const HOOD={
 'AFTER HOURS / DINER':[['VEX','After Hours. The owner keeps coffee hot through curfew. The supply locker is upstairs.']],
 'HELIX / WATCH HOUSE':[['VEX','Watch house. Guards downstairs, armory upstairs. That alarm rack can quiet the district.']],
 'WIRE SAINTS / SOCIAL CLUB':[['VEX','Wire Saints territory. Keep your weapon quiet and they will leave you alone.']],
 'NEON BAZAAR':[['VEX','Neon Bazaar. Every stall here sells something stolen, including the smiles.'],['YOU','Hawker by the noodle cart: "Fresh chrome, cheap memories, no refunds, friend."']],
 'THE STACKS':[['VEX','The Stacks. Helix archived whole lives in these towers. Keep your voice down.'],['YOU','Old clerk in the dark: "Everything is filed here. Even the people who asked not to be."']],
 'RUST YARDS':[['VEX','Rust Yards. Scrap crews, loose wiring, no cameras. That is the good news.'],['YOU','Welder on a crate: "Mind the cranes, runner. They remember who owes them."']],
 'GLASS SPIRES':[['VEX','Glass Spires. Corporate money lives up here. So do the best sensors.'],['YOU','Doorman, smiling thin: "Wrong district. Wrong coat. Wrong rain, runner."']]
};
export function createDialogue(root=document.body){
  const el=document.createElement('div');el.className='dlg-box';el.setAttribute('role','status');el.innerHTML='<b class="dlg-tag"></b><div class="dlg-name"></div><div class="dlg-text"></div>';root.appendChild(el);
  const nameEl=el.querySelector('.dlg-name'),textEl=el.querySelector('.dlg-text'),tag=el.querySelector('.dlg-tag');
  let fired=new Set(),queue=[],cur=null,shown=0,hold=0,build='blade',count={};
  const line=([who,t])=>({who,text:typeof t==='string'?t:(t[build]||FALLBACK[build]||'')});
  // Each trigger key fires once per run (tracked in `fired`); repeated keys of a type cycle through that type's variants.
  function push(type,key){if(fired.has(key)||!L[type])return;fired.add(key);const v=L[type],i=count[type]=(count[type]||0)+1;if(queue.length>6)queue.length=6;for(const p of v[(i-1)%v.length])queue.push(line(p));}
  function next(){cur=queue.shift()||null;shown=0;hold=0;if(!cur){el.classList.remove('show');return;}
    nameEl.textContent=cur.who;nameEl.style.color=SPK[cur.who];tag.style.background=SPK[cur.who];textEl.textContent='';el.classList.add('show');}
  addEventListener('keydown',e=>{if(e.key==='Enter'&&cur){if(shown<cur.text.length)shown=cur.text.length;else hold=1e9;}});
  return{
    begin(game){fired=new Set();queue=[];cur=null;count={};el.classList.remove('show');build=(game&&game.player&&game.player.build)||'blade';push('start','start');},
    onEvent(ev){if(!ev)return;const t=ev.type,o=ev.object;
      if(t==='zone'){const h=HOOD[ev.name],k='zone:'+ev.name;if(h){if(!fired.has(k)){fired.add(k);if(queue.length>6)queue.length=6;for(const p of h)queue.push(line(p));}}else push(t,k);}else if(t==='hack'||t==='lore'||t==='upgrade')push(t,t+':'+((o&&(o.id||o.label))||count[t]||0));
      else if(t==='levelup')push(t,'levelup:'+ev.level);else if((t==='death'||t==='save')&&(count[t]||0)<L[t].length)push(t,t+':'+((count[t]||0)+1));else if(t==='ending'||t==='boss')push(t,t);},
    update(dt){if(!cur){if(queue.length)next();return;}const full=cur.text.length;if(shown<full){shown=Math.min(full,shown+dt*42);textEl.textContent=cur.text.slice(0,Math.floor(shown));}else{hold+=dt;if(hold>1.2+full*.03)next();}}
  };
}

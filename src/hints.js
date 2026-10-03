import {territoryAt} from './territories.js';
import { BUILDS, SKILLS } from './game.js';
const PLAY={blade:'Fast melee duelist. Slow time, blink in, strike.',ghost:'Control and stealth. Disable threats from range.',tank:'Slow and sturdy. Absorb hits, break the line.',gun:'Ranged precision. Pick targets, keep moving.'};
const BUILD_TIPS={
  blade:['Blade: tap V to parry projectiles.','Blade: Q slows time - blink in and chain strikes.','Blade: strike unaware guards from behind for a takedown.'],
  ghost:['Ghost: EMP (Q) first, then cloak (V) to slip away.','Ghost: cloaked, reposition behind guards.','Ghost: disable threats from range, avoid melee.'],
  tank:['Tank: flank armored guards - frontal hits are costly.','Tank: shoulder rush (C) breaks lines and hits all in its path.','Tank: pop barrier (V) before a firefight.'],
  gun:['Gun: left click fires the pistol at your cursor. K fires the sidearm.','Gun: Deadeye (Q) speeds fire - use it on snipers.','Gun: C fires a piercing burst through lined-up enemies.','Gun: V is a quick evasive dash - keep moving and shooting.']
};
const DISTRICT_TIPS=[
  [7200,8600,['Neon Bazaar: crowds and bright signs hide movement - use stalls as cover.','Neon Bazaar: watch for drones above the market lanes.']],
  [8600,10000,['The Stacks: vertical maze - use ladders and ledges to get above patrols.','The Stacks: tight corridors favor ambushes - strike from the shadows.']],
  [10000,11400,['Rust Yards: welder-bots are armored in front - flank them.','Rust Yards: heavy machinery is noisy - use it to mask your approach.']],
  [11400,12800,['Glass Spires: exposed glass floors - stay low and avoid open sightlines.','Glass Spires: elite guards ahead - save your abilities for them.']]
];
export function contextTip(game,p){
  const sec=game.security;
  if(p.hp<p.maxHp*.3)return 'Low health: break line of sight and find a safehouse or medkit.';
  if(sec.level>0||game.alarm>.8)return 'Alarm raised: break sight, hide in shadow (hold S) or jam a security unit.';
  const area=territoryAt(game.world,p);if(area.rule==='restricted'&&game.alarm<.5)return `${area.name}: restricted. Guards attack trespassers. Use cover or leave the marked boundary.`;
  let boss=false,alerted=false;
  for(const e of game.enemies){if(e.dead||!e.active)continue;if(e.type==='boss')boss=true;else if(e.alert>.85&&(!e.targetId||e.targetId==='player')&&(!e.faction||e.hostileToPlayer))alerted=true;}
  if(boss)return 'Boss active: watch telegraphs, dash through attacks, strike in the gaps.';
  if(alerted)return 'Enemy alerted: break line of sight, then wait out the search in shadow.';
  if(game.enemies.some(e=>e.faction&&e.access!=='restricted'&&!e.dead&&!e.hostileToPlayer&&Math.abs(e.x-p.x)<260))return 'Gangs fight security and rival crews. They leave you alone unless you attack.';
  if(game.interaction?.()?.type==='talk')return 'People live here. Press E to talk to a resident.';
  const d=DISTRICT_TIPS.find(t=>p.x>=t[0]&&p.x<t[1]);
  if(d&&(((game.time/8)|0)%2===0))return d[2][(((game.time/16)|0))%d[2].length];
  if(p.energy<25)return 'Energy low: abilities need charge. Wait, or grab an energy cell.';
  if(p.skillPoints>0)return 'Talent point available: press T to spend it.';
  if(p.hidden)return 'In shadow: you are hard to spot. Stay still and let patrols pass.';
  if(game.world.interactables?.some(o=>o.type==='checkpoint'&&Math.abs(o.x-p.x)<160&&Math.abs(o.y-p.y)<160))return 'Safehouse nearby: press E to save and recover.';
  const cd=p.abilityCooldown>0?'Q':p.skillCooldown>0?'C':p.guardCooldown>0?'V':'';
  if(cd&&(game.time|0)%6<3)return `Ability ${cd} on cooldown: fight with your weapon until it recharges.`;
  if(game.world.ladders.some(l=>Math.abs(p.x+p.w/2-l.x-l.w/2)<60&&p.y+p.h>l.y&&p.y<l.y+l.h))return 'Pole: W climbs, release to grip, S slides. A/D + Space jumps sideways.';
  if(game.interaction?.())return 'Press E to interact.';
  const tips=BUILD_TIPS[p.build]||[],n=(game.time/7)|0;
  return n%2||!tips.length?'RMB aims precisely. Dash (Shift) to dodge attacks. F throws a noise decoy.':tips[(n>>1)%tips.length];
}
export function hintsHTML(game,p,on){
  if(!on)return '<span class="hint-tab"><kbd>G</kbd> HINTS</span>';
  const b=BUILDS[p.build],s=SKILLS[p.build];
  const row=k=>`<div><kbd>${s[k].key}</kbd> <b>${s[k].name}</b> <i>${s[k].cost}E</i><br><small>${s[k].description}</small></div>`;
  return `<div class="hint-head"><b>${b.name}</b><span><kbd>G</kbd> hide</span></div><p>${PLAY[p.build]}</p>${row('q')+row('c')+row('v')}<div class="hint-tip">${contextTip(game,p)}</div>`;
}

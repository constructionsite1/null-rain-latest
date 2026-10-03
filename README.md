# NULL // RAIN

An original PC browser stealth-action game. **Chapter 01: The Rain Market is playable from start to ending.** Glass Garden and Dead Sun are planned campaign locations, not playable levels yet.

## Play

Double-click **START GAME.bat**, then open <http://localhost:4173>. Alternatively run `npm start` in this folder. Node.js is the only launch requirement; the game has no package dependencies, network services, or asset downloads during play. A current Chrome or Edge browser is recommended. The preview also works inside Codex.

Choose one of four implants and enter the district. The map is 12,800 × 2,400 world pixels, with the original mission regions plus Neon Bazaar, the Stacks, Rust Yards and Glass Spires. Street, maintenance and rooftop paths connect the city. Your mission: unlink both relays, overcome or remotely sever the Warden, recover the archive, and decide its future.

The streets have vendors, commuters, couriers and residents. Press E near a calm resident to talk; nearby combat sends people fleeing. Wire Saints and Cinder Crew groups occupy the eastern districts and fight security or rivals. Wire Saints tolerate visitors until attacked. Cinder Crew defend the marked furnace yard against trespassers. Shops, laundry, night-line stops and an underground train give each block everyday life. District music changes as you travel, including return visits.

Three street doors lead into playable interiors: After Hours diner, Helix watch house, and Wire Saints social club. Press E to enter or leave. Rooms contain residents, guards, supplies and climbable lofts; loot and enemy state persist in saves. Characters use human faces, articulated limbs, layered coats, boots and mechanical joints, with distinct outfits for each build and faction.

Nine cyan safehouse checkpoints span the city: starting shelter, market shelter, maintenance, service tunnel, crown approach, Bazaar clinic, Lotus resident shelter, Yards union refuge and Spires transit shelter. Press E at a safehouse to save and refill health, energy, stamina and magazines. Retry returns to that chosen position. The safehouse remains unavailable during a district alert or active player pursuit.

Public streets tolerate visitors; public Helix sentries respond to provocation or district alerts. Neutral purple/green blocks (Wire Saints and Lotus residents) tolerate your presence. Restricted red/orange bases attack trespassers: Signal Roost, Watch House, Uplink Station, Archive Fortress, Cinder Furnace Yard and Executive Compound. Boundary signs, pavement markings, map shading, targeting labels and the access panel show the rules. Cinder use armored scrap enforcers; Helix roof stations favor drones/snipers; the watch house uses heavy security; Wire Saints keep a music club. Leaving a restricted area ends its passive targeting, but attacking a guard/crew preserves their hostility in saves.

Buildings have seven distinct business/residential fronts: kitchens, clinics, laundries, repair shops, records, groceries and apartments. Windows show workers, rotating washers, food steam, product displays, mailboxes, stairwells, balconies and domestic silhouettes. Projecting neon and cycling advertisements add street activity.

## Controls

| Action | Keys |
| --- | --- |
| Move | A / D or left / right arrows |
| Jump / double jump | Space, then Space again in the air |
| Climb / grip / slide on poles | W climbs, release to grip, S slides |
| Jump sideways from a pole | A / D + Space |
| Crouch in shadows | S / down |
| Drop through platform | S + Space |
| Dash | Shift; costs 35 stamina, recharges after a 0.9s recovery delay |
| Signature weapon | J or left mouse button |
| Precision aim / capture mouse | Hold right mouse button (other builds) |
| Chronoblade directional parry | Right click to parry; hold to face cursor. Front bullets only; V also activates parry |
| Gunslinger pistol | Left click toward cursor; J fires straight ahead |
| Fire sidearm | K; Netrunner and Breaker also use right + left mouse buttons |
| Build abilities | Q power / C technique / V defense |
| XP talents | T |
| Interact / hack / silent takedown | E |
| Decoy ping ahead | F; costs 20 energy |
| Reload last fired gun | R; empty magazines auto-reload when you try to fire |
| Switch acquired sidearms | X |
| Map | M / Tab |
| Field manual | H |
| Pause | Escape |

On death, the red FLATLINED / YOU DIED screen offers Retry from Safehouse or Title. Retry restores the last safehouse state with full health and equipment.

Mouse aims freely; right click requests pointer lock and hides the native cursor, with a game reticle and enemy brackets. Escape releases capture and pauses. Embedded panels may deny pointer lock; cursor aiming remains available. Keyboard-only attacks fire straight ahead. Magazines: Vigil 12 (1.25s reload), Needle 16 (1.1s), Synapse 8 (1.6s), Breach 4 shells (1.8s). R reloads the last fired gun; switching sidearms with X cancels a reload. Reload supplies are unlimited, but firing is blocked until the reload completes. Energy powers abilities; dash uses a separate 100-point stamina reserve, spends 35 points, and recovers at 24 points/second after 0.9s. Q/C/V abilities retain their energy costs. Safehouse syncs refill magazines and stamina. Energy regenerates. Safehouse syncs refill health/energy and set a retry point. Progress also saves locally after objectives and upgrades; **Continue Signal** restores it. Starting a fresh run does not delete the previous save until you sync or complete an objective.

## Builds and progression

- **Chronoblade:** three-hit katana combo, time fracture, targeted blinkstrike and projectile parry. Ordinary katana swings deflect front-facing bullets for 0.14s. V gives a 0.55s guard: its first 0.14s is a perfect parry with a 75% chance of aiming the reflected bullet toward its shooter; late parries scatter it away. Aim down while airborne to bounce off enemies.
- **Netrunner:** arc disruptor, three-target chain breach, cursor-targeted EMP and optical cloak; can spend energy to bypass puzzles.
- **Breaker:** impact fists, extra health, damage resistance, an armored shockwave, shoulder rush and brace barrier; can force a terminal at a health cost.
- **Gunslinger:** precision pistol, Deadeye piercing shots, fan volley and reflex evade.

XP comes from combat, silent takedowns, first-time hacks and memories. Five levels award talent points across Force, Flow and Guard, each capped at two ranks.

Three collectible sidearms: Needle (suppressed pulse), Synapse (stunning arc), Breach (five-shot scatter). Weapon crates also give two salvage. Three one-time augments cost three salvage each: health, energy regeneration, or weapon damage. Three optional memory fragments add story and salvage.

Projectile damage on people depends on the first contact point: head ×2, torso ×1, legs ×0.65. Armor still applies, and drones/the Warden use their mechanical armor rules. Headshots show a marker at the reticle and an impact label.

Patrols, heavy units, drones, and snipers use directional vision, suspicion, sound investigation, searching, and attack wind-ups. Hide by crouching in the marked shadow volumes. Get close behind an unaware guard to perform a silent takedown. The Warden has three telegraphed attack patterns and can also be neutralized through the rooftop override.

### Chaos and district alarms

Combat is a complete route through the level; an alarm never fails the mission. Confirmed sightings and witnessed loud fire raise district heat. **Alert** makes patrols move 35% faster and shoot more frequently. **Lockdown** gives a three-second warning, then dispatches a response team. Backup is capped at three additional enemies over a run, and rooftop routes remain open.

Break contact for six seconds to start cooling the district. Three physical alarm substations can be hacked repeatedly to clear heat and block new responses for 35 seconds; guards still see and fight you locally. Safehouses cannot heal or save while the district is alerted or a nearby enemy is tracking you. Stealth preserves resources; chaos trades those resources for direct progress. The heat meter, siren, warning lights, and response countdown show the consequences.

## Implementation and verification

Vanilla JavaScript ES modules, Canvas 2D, Web Audio, and browser local storage. All final assets and source are in this folder.

`npm test` runs gameplay and route regressions. The full geometry test traverses from normal spawn using real movement inputs through both relays, roof loot, boss bypass, core, and extraction; it freezes enemy combat to isolate reachability. Separate tests cover combat, stealth, projectiles, progression, pickups, and save/retry.

Browser checks cover title/build selection, briefing, real relay puzzle solving, objective persistence after reload, combat ability activation, pause, map, the ending UI, and alarm escalation/jamming. Local developer fixtures are opt-in via `?debug` (Alt+1 relay, Alt+2 Warden, Alt+3 extraction, Alt+4 lockdown, Alt+5 alarm substation, Alt+6 XP); normal play has no fixture shortcuts. QA runs use a separate save slot.

## Assets

Soundtrack and effects are original procedural Web Audio synthesis at 94 BPM. No third-party music or character art is bundled. See [ASSETS.md](ASSETS.md) for the generated panorama provenance and prompt.

## Files

`src/game.js` simulation and game rules; `src/world.js` authored level data; `src/renderer.js` procedural visual layers; `src/actors.js` articulated characters; `src/aim.js` mouse capture and targeting; `src/audio.js` synthesis; `src/main.js` input, menus, saves, and camera; `style.css` interface; `server.mjs` local static server.

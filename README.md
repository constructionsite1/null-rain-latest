# NULL // RAIN

An original PC browser stealth-action game. **Chapter 01: The Rain Market is playable from start to ending.** Glass Garden and Dead Sun are planned campaign locations, not playable levels yet.

## Play

Double-click **START GAME.bat**, then open <http://localhost:4173>. Alternatively run `npm start` in this folder. Node.js is the only launch requirement; the game has no package dependencies, network services, or asset downloads during play. A current Chrome or Edge browser is recommended. The preview also works inside Codex.

Choose one of four implants and enter the district. The map is 7,200 × 2,400 world pixels, with three connected regions and street, maintenance, and rooftop paths. Your mission: unlink both relays, overcome or remotely sever the Warden, recover the archive, and decide its future.

## Controls

| Action | Keys |
| --- | --- |
| Move | A / D or left / right arrows |
| Jump / double jump | Space, then Space again in the air |
| Climb ladder | W / S or up / down arrows |
| Crouch in shadows | S / down |
| Drop through platform | S + Space |
| Dash | Shift; costs 15 energy |
| Signature weapon | J or left mouse button |
| Precision aim / capture mouse | Hold right mouse button |
| Fire sidearm | Right + left mouse buttons, or K |
| Build abilities | Q power / C technique / V defense |
| XP talents | T |
| Interact / hack / silent takedown | E |
| Decoy ping ahead | F; costs 20 energy |
| Cycle acquired sidearms | R |
| Map | M / Tab |
| Field manual | H |
| Pause | Escape |

Mouse aims freely; right click requests pointer lock and hides the native cursor, with a game reticle and enemy brackets. Escape releases capture and pauses. Embedded panels may deny pointer lock; cursor aiming remains available. Keyboard-only attacks fire straight ahead. Energy regenerates. Safehouse syncs refill health/energy and set a retry point. Progress also saves locally after objectives and upgrades; **Continue Signal** restores it. Starting a fresh run does not delete the previous save until you sync or complete an objective.

## Builds and progression

- **Chronoblade:** three-hit katana combo, time fracture, targeted blinkstrike and projectile parry. Aim down while airborne to bounce off enemies.
- **Netrunner:** arc disruptor, three-target chain breach, cursor-targeted EMP and optical cloak; can spend energy to bypass puzzles.
- **Breaker:** impact fists, extra health, damage resistance, an armored shockwave, shoulder rush and brace barrier; can force a terminal at a health cost.
- **Gunslinger:** precision pistol, Deadeye piercing shots, fan volley and reflex evade.

XP comes from combat, silent takedowns, first-time hacks and memories. Five levels award talent points across Force, Flow and Guard, each capped at two ranks.

Three collectible sidearms: Needle (suppressed pulse), Synapse (stunning arc), Breach (five-shot scatter). Weapon crates also give two salvage. Three one-time augments cost three salvage each: health, energy regeneration, or weapon damage. Three optional memory fragments add story and salvage.

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

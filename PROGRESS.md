# NULL // RAIN

## Scope
Build a polished playable first level of an original PC cyberpunk side-scrolling stealth action game. Current user priority is level 1, not completing the entire three-level campaign. No questions; make independent decisions. All project files stay in this folder. Target October 2, 2026, 4 pm IST. Resume heartbeat requested for 1:40 pm IST.

## Architecture
Vanilla JavaScript modules + Canvas 2D, no network dependencies. Fixed-scale side camera with smooth dead zone. Original procedural/vector art and Web Audio soundtrack. Four builds: Sandevistan katana, netrunner, brute, gunslinger. At most three choices per upgrade/weapon/ending screen.

Files: src/game.js simulation; src/renderer.js procedural rendering; src/world.js level data; src/audio.js procedural sound; src/main.js input/UI/bootstrap. index.html + style.css shell. server.mjs local static server. Tests in tests/.

## Contract (agents)
Coordinates world pixels, x/y top-left, y down. Player 28x54. World 7200x2400, floor y2140. Platforms {id,x,y,w,h,kind}, one-way except kind solid. Ladders {x,y,w,h}. Shadows {x,y,w,h}. Interactables {id,type,x,y,label,...}, position at standing feet (within 90px player center). types terminal,checkpoint,cache,upgrade,lore,exit. Enemy spawn {id,type,x,y,minX,maxX,dir}, x/y top-left; types guard,drone,sniper,heavy,boss. Objects mutate with active/open/done states. Gates {id,x,y,w,h,requires}, closed until required terminal IDs completed. World has zones {name,x,w,color}, decorations [], platforms,ladders,shadows,interactables,enemies,gates,spawn:{x,y},width,height.

Renderer export render(ctx,state,width,height). State {world,player,enemies,projectiles,particles,effects,camera:{x,y},time,slowTime,alarm,objective,mode,mapOpen}. camera top-left in world coords. Renderer may render background with missing world on menu; main will provide a populated state. Player {x,y,w,h,vx,vy,dir,grounded,crouching,hp,maxHp,energy,maxEnergy,build,weapon,attackTimer,dashTimer,invuln,anim,hidden}. Enemies same basic geometry plus type,hp,maxHp,dir,alert,state,stun,attackTimer,dead. Projectiles {x,y,vx,vy,color,enemy,r}; particles {x,y,vx,vy,life,maxLife,color,size}; effects {type,x,y,life,maxLife,dir,r,color}. Platforms and objects are live world data. All timings seconds. Build IDs blade,ghost,tank,gun. Effects types slash,ring,beam,explosion,noise,text; text effects have text.

## Status
Playable MVP implemented and browser verified. All source and the generated skyline are local. Agents completed renderer/world/audio and tests. Root integrated game simulation, UI, save system, launcher, menus, hacking and endings.

At the final audit, 77% of five-hour allowance was consumed. Resume automation id: resume-null-rain-at-1-40-pm; scheduled 1:40 pm IST October 2. User requested monitoring budget and preserving MVP. Do not expand into chapters 2/3 unless first-level quality warrants and user requests.

Verification: 11 gameplay unit regressions plus a full actual-control geometry route regression. Browser QA solved both hacking puzzles, reloaded and continued saved progress, triggered ability/pause in Warden encounter, and completed sanctuary ending. No console errors observed. Geometry test freezes enemies and uses invulnerability only to isolate route reachability; do not claim it was a human combat playthrough.

Current local server: node server.mjs on localhost:4173. START GAME.bat can relaunch it. README.md documents controls and scope. ASSETS.md records original built-in Imagegen panorama prompt and provenance.

Final audit COMPLETE. 14/14 tests pass. Fixed tank dash truncating existing protection, missing boss objective navigation, victory audio suspension, and narrow-screen tutorial/prompt overlap. Independent normal-health arena simulation defeated boss with all four builds; combat tuning is intentionally forgiving (Gunslinger fastest). Browser map checked. Final screenshot assets/gameplay-preview.jpg. Normal preview is reset to title screen and marked deliverable. Latest usage88%; no further expansion is needed. Goal achieved. Keep requested1:40pm heartbeat as a completion-aware check; first-level implementation is finished, so it should avoid duplicating work and disable itself at that check.

## 1:40 pm resume / latest user request

User clarified that stealth should be optimal but chaos must be a viable punished option, with alarm systems. Implemented district heat from witnessed loud attacks and confirmed sightings; Alert increases patrol movement35% and fire rate; Lockdown warns3 seconds and dispatches a capped response team (maximum3 extra units across the run). No mission-fail alarm and no new blocking gates. Breaking contact6 seconds begins cooling. Three repeatable physical substations jam alarms35 seconds while guards retain local detection/combat. Safehouses cannot heal/save during alert or nearby pursuit. Added heat HUD, siren, warning lighting and state persistence for dynamic response enemies. Separate QA save slot prevents test fixtures touching normal saves.

Security regressions and prior gameplay/route tests pass. Browser verified lockdown countdown/dispatch, physical substation puzzle, jammed heat0, and continued local enemy combat while jammed. No console errors. Alarm preview assets/alarm-preview.jpg. Latest changes complete; disable the consumed resume heartbeat. Current scope remains the finished first-level MVP.


## Combat and character overhaul delivered
User requested cursor-directed combat, SteamWorld Heist II-inspired character identity and smoother movement. Implemented precise mouse aim, RMB aim/capture and RMB+LMB sidearm, game reticle/target brackets; capture fallback for embedded browser. Three Q/C/V skills per build, melee combos/pogo, projectile parry, cloak/barrier, targeted blink/EMP, XP five levels and three two-rank talents. Articulated character art has mechanical faces, asymmetrical gear, animated aimed weapons, distinctive heavy/sniper/drone/Warden. Guards burst, snipers telegraph beams, heavies shield front and shockwave, Warden three patterns with armor and stun resistance. Jump buffer120ms and coyote110ms.
34/34 tests pass including complete geometry route, combat, XP/save and security. Browser verified launch, new HUD, cursor capture graceful fallback, XP level-up and talent purchase. Existing game tab became unresponsive to browser automation; fresh preview used. 94% of five-hour allowance used at final integration; no new expansion. README controls updated. First level remains deliverable; chapters2/3 still planned.

## Claude session — October 2, 2026 (16:04–16:28 IST)

Parallel Claude (Sonnet) agents in isolated worktrees, merged and verified on `main` (34/34 tests pass):

- **Hints panel** (`src/hints.js`): top-right, ON by default, `G` toggles (also a pause-menu checkbox); build name, playstyle, Q/C/V explanations with costs, plus a contextual tip. Persisted in `null-rain-settings-v1`.
- **Tutorial**: title-screen `TUTORIAL: ON/OFF` (default ON). 13 input-driven steps (move → map) with build-specific ability steps; Enter skips a step, Esc skips all.
- **Dialogue** (`src/dialogue.js`): typewriter comms box, handler VEX, the Warden, and per-build player replies, triggered once per run from `Game.events`. Non-blocking.
- **City** (`src/renderer.js`): three cached seeded parallax layers with residential, market, industrial and corporate districts; animated neon, antenna lights, holo-billboards, steam, hover-cars and puddle reflections.
- **Animations** (`src/actors.js`): breathing, run bob/arm swing, squash/stretch, landing detection, dash afterimages, per-build attack FX, flinch, alert "!", stun sparks and death collapse.
- **Layout** (`src/world.js`): 6 optional ledges, 3 ladders, 5 shadow zones, 5 alley pickups and extra props. Existing routes are unchanged.
- **Fix**: `glow()` and `resize()` guard against non-finite sizes (a zero-height window crashed the render loop).

Verified in browser: new skyline, hints panel and tutorial render. Not yet verified: full playthrough, dialogue timing, hints-panel overlap on small screens, frame rate.
- **Round 2:** ladders now drawn as city poles (drainpipes, neon poles, conduits, lamp posts, scaffolds); one-way platforms drawn as balconies, fire escapes, awnings, catwalks and AC ledges with supports and facades; solids drawn as buildings. Player now faces aim when attacking, swing arcs match the real hit reach, and the blinkstrike shows its damage radius. Dialogue has ~25 more lines (VEX ability briefings use the correct ability names), and hints have build-specific and situational tips.
- **Remaining (not done in time):** collision geometry is still the original platform layout. A true open-region rebuild of `world.js` (organic streets, interiors, pole-climbing as a distinct mechanic) is the next big step.
- **Round 3, neighbourhoods:** four procedural, deterministic districts (`src/hoods/`) are attached east of the Rain Market through `attachHoods()`, widening the world from 7,200 to 12,800. They are NEON BAZAAR, THE STACKS, RUST YARDS and GLASS SPIRES, each with its own zone, platforms, poles, shadows and pickups, and no enemies yet. They are reachable along the continuous ground floor. Not yet checked: jump reachability inside each district, and the map (M) layout with the wider world.
- **Round 4, enemies:** 19 enemies across the four new districts (guards, heavies, drones, snipers). Their looks change by district: neon-mask enforcers in the Bazaar, scrap militia in the Stacks, welder-bots in the Yards, white corporate security with halo drones in the Spires. Not yet checked: combat balance in these districts.

## Codex resumption — October 2, 2026
Copied Claude's current project into the main Punk 2D directory, preserving the main Git history and the separate source copy. All 40 project files matched by hash before updating resumption notes. Main-directory verification: 34/34 tests pass. RESUME.md now identifies the main directory as the active workspace and retains the unfinished backlog. No additional gameplay changes or browser verification in this transfer.

## City life — October 2, 2026
Added civilian street routines, umbrellas, local panic and E conversations; seeded neutral gang factions fighting guards/rivals with group hostility and save support; district audio on every zone transition; lit storefronts, varied domestic floors, moving laundry, night-line displays and underground transit. Poles support gripping, sliding and directional jumps. NPC fights stay local and award no player XP, salvage, kills or heat. Space Bunny supplied a read-only design review. Verification: 44/44 tests pass, including ten city regressions and the complete original geometry route. Browser checked all added districts and the expanded map, without console errors. Geometry has not been rebuilt; normal-health playthrough, measured FPS and further interface polish remain outstanding.


## Human character, interiors and Gunslinger pass — October 2, 2026

Active project: main Punk 2D directory. Latest art direction is SteamWorld Heist II-inspired silhouettes, outfits and mechanical details, expressed as original human characters. `src/human-actors.js` replaces humanoid art with layered coats, visible faces, boots, articulated knees/elbows and smaller weapons. Gait follows actual position changes (including AI patrols); crouch, jump, climb, recoil and coat motion have distinct poses. Drones/Warden retain their existing mechanical rendering. Space Bunny CLI supplied the first human renderer; Codex integrated it and corrected identity hashing, guard faction outfits, gait and climbing grips.

Three real enterable buildings are implemented in `src/interiors.js`: After Hours diner (x970), Helix watch house (x2870), Wire Saints social club (x8090). E enters/leaves at street doors. Furnished rooms contain usable stairs/poles/lofts, residents, supplies, guards and an alarm rack in the watch house. Gang club members are neutral until attacked. Exiting restores the same street position; room loot/enemies and current room location survive saves. Street security dispatch pauses indoors. Exterior mission routes are preserved.

Gunslinger: LMB fires Vigil pistol toward cursor, RMB optionally captures precision cursor without changing weapon, K fires acquired sidearm, J fires straight forward in keyboard play. HUD, briefing, manual, tutorial and README describe this. Pistol now has explicit weapon stats. View is closer (720 world pixels high).

Validation: all 49 tests pass, including five new interior/control tests and the complete original mission traversal. Syntax and Git whitespace checks pass. Browser checked human art, diner and watch-house transitions, Gunslinger HUD; no console errors. Debug Alt+8 cycles building door locations, E performs the actual transition; Alt+7 still tours eastern districts. QA uses its separate save slot.

Remaining: normal-health encounter balance/playthrough, more distinct room geometry and civilian routines, richer room interactions, and further architecture/art refinement. This is a procedural human art pass, not a full authored sprite asset pipeline.

## Reload, stamina, parry and street atmosphere — October 2, 2026

Implemented per-weapon magazines (pistol12/pulse16/arc8/scatter4), manual R reload of last fired gun, automatic reload on an empty trigger, weapon-specific reload times, reload HUD/progress reticle/audio/hand pose. X now switches sidearms and cancels reload. Supplies are unlimited; timing is the combat cost. Dash uses separate stamina:100 max,35 per Shift dash,0.9s delay,24/s regeneration. Abilities retain their energy costs. Safehouses/retry refill equipment; old saves receive independent safe defaults, current saves preserve ammo/stamina/reload progress.

Chronoblade ordinary swings deflect front bullets for 0.14s. V guards0.55s: first0.14s is perfect,75% chance to return toward a living shooter (otherwise scatter). Late guard deflects without targeted return. Existing no-owner rounds reverse during perfect parry. Reflected rounds retain normal collision/damage and may miss moving shooters. Metallic feedback and PERFECT PARRY/RETURN labels differentiate timing. Projectile location damage is head2x/torso1x/legs0.65x based on swept first contact, for people on either side. Mechanical drone/Warden armor unchanged. Headshot reticle/impact labels added. Quick keyboard/mouse attack taps are buffered for the next frame.

Street atmosphere includes masonry courses, roof edges/gutters, silhouettes moving behind lit windows, lamps, drains/steam, planters, parked service vehicles/taxis and district plaques. These sit behind gameplay and retain mission geometry.

Verification: 56 gameplay tests pass (seven new resource/body/parry tests), original full traversal still passes. Browser caught and fixed a street-render scope error; final browser QA and screenshot are recorded in this turn. Normal-health combat balancing remains to be measured.

Death feedback: replaced Signal Interrupted with a red FLATLINED / HEALTH 0 and YOU DIED screen, clear RETRY FROM SAFEHOUSE action and save rollback notice. Debug Alt+9 forces a real lethal hit for UI verification.

## Distinct businesses and territorial bases — October 2, 2026

Added seven distinct storefront/residential interiors in street.js, with visible shopkeepers, soup steam, clinic scanner/bed, animated laundromat drums, repair parts, records, grocery shelves, apartment mailboxes/stairs. Materials, colored neon, vertical projecting signs, balcony railings, warm residential windows and cycling advertisements vary across the streets.

New territories.js defines eight bases/blocks with personality, bounds and public/neutral/restricted access rules. Public Helix street sentries tolerate visitors until personally attacked or district security becomes alerted. Wire Saints club and Lotus cooperative are neutral. Signal Roost/Uplink use existing sniper/drone encounters; Watch House is a heavy garrison; Archive remains Warden fortress; Cinder Furnace Yard now contains the seeded Cinder crew with one heavy; Executive Compound is private security. Seeded groups now spawn Wire Bazaar/Cinder Yards/optional Wire Stacks, still using clear-gap placement. Restricted groups select the player while inside their base; provocation persists after exit and in saves. Neutral patrols still fight other factions. Reinforcements remain hostile.

Boundary plaques, colored pavement markings, base furniture/furnaces/music signs, HUD access rules, target labels and map shading distinguish access. Clear contextual warning appears on entry. Four initial territory tests plus actual attack simulation verify neutral visitors, trespass targeting, aggression persistence and room rules. Debug Alt+9 tests red death UI; Alt+8 visits doors, Alt+7 eastern districts.

## Distributed checkpoint safehouses

Nine outdoor checkpoints now span the city (six added): start230, market1400, maintenance2670, service tunnel4900, crown approach5270, Bazaar7480, Lotus9090, Yards11204, Spires11744. Existing maintenance/crown checkpoints moved outside restricted boundaries; Cinder boundary ends11180 to preserve the clear union-refuge approach. All checkpoint positions are clear of solids and in public/neutral territory. Cyan booth outlines, SAFEHOUSE/E sign, active SAVED label and map markers show them. E prioritizes a nearby checkpoint over takedowns. Sync refills health/energy/stamina/magazines; active pursuit/alerts deny sync, unrelated NPC skirmishes do not.

Verification: 62 tests pass, including all nine checkpoint clear-standing positions, access rules, E sync/refill and chosen-position retry. Browser verified R reload and stamina drain, red YOU DIED and retry, restricted Watch House warnings, and improved storefront rendering. An earlier street scope error was fixed; it remains only in the browser's historical log. Full normal-health balancing remains outstanding.

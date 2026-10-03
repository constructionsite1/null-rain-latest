# NULL // RAIN — handoff to Claude

Prepared October 2, 2026. This document describes the current implementation, not a claim that its game feel or art has reached the reference games' quality.

## Start here

Improve the existing playable first level. Preserve a working MVP throughout. Read this file, `README.md`, `src/game.js`, `src/world.js`, and the tests, then play the game before choosing changes. `PROGRESS.md` is chronological history: earlier completion statements and balance descriptions are superseded by its final combat-overhaul section and current code.

Project directory: `C:\Users\Asus\Desktop\AI Personal Projects\Punk 2D`. The user explicitly requested using only this folder. Make implementation decisions independently; the user does not want clarification questions. Prefer focused improvements over a rewrite or adding unfinished campaign levels.

```powershell
npm start
# http://localhost:4173/
npm test
```

`START GAME.bat` is the desktop launcher. Node.js is required; there are no npm dependencies or build step. If port 4173 is already serving this project, reuse it. The server may already be running. Use a current desktop Chrome or Edge for real mouse-capture testing.

## What the user wants

- An original cyberpunk 2D side-view action/stealth platformer with layered, vertically and horizontally explorable environments.
- Mark of the Ninja-inspired camera, responsiveness and stealth; Hollow Knight-inspired traversal and melee. These are aspirations, not implemented parity.
- Stealth should be optimal, but aggressive combat must be viable and challenging. Alarms punish noise with pressure, not mission failure.
- Four simplified builds: Sandevistan katana, netrunner, brute and gunslinger. Other choice sets should contain no more than three options.
- Distinctive, expressive characters and enemies. Latest art direction: SteamWorld Heist II-inspired silhouettes, outfits and mechanical character details, adapted into an original cyberpunk world.
- Fast combat with multiple abilities, weapons, XP and upgrades. Mouse-directed shooting, a custom reticle, right-click aim and native cursor capture.
- A complete first-level MVP takes priority over scope. Three chapters were originally envisioned, but only chapter one is currently playable.

Visual references: dense neon streets, rainy elevated walkways, deep city backgrounds, warm storefront interiors, cyan/magenta signage and strong foreground silhouettes. Do not reuse copyrighted characters or logos.

Reference links:
- https://destroy.spritefusion.com/ — cursor-directed weapons independent of movement. Its right button throws grenades; our requested adaptation uses right-click aiming.
- https://steamworldgames.com/steamworld-heist-2/ — character identity inspiration.

The original 1:40pm resume automation was consumed and paused. Do not recreate it from historical notes. Original delivery target was October 2 at 4pm Asia/Calcutta. Codex last reported 94% five-hour usage; that is historical account state, not Claude's budget.

## Current playable content

Chapter 01, **The Rain Market**, spans 7,200 × 2,400 world units. Street, maintenance and rooftop paths connect three district regions. Unlink two relays, confront or remotely override the Warden, recover the memory archive, reach extraction and choose one of three endings. Glass Garden and Dead Sun are named future chapters, not playable maps.

Includes ladders, double jumps, dash, drop-through ledges, shadows, patrols, sound investigation, hacking puzzles, alarm substations, safehouses, weapon crates, pickups, salvage upgrades and three memory fragments. Music and SFX are original procedural Web Audio. The background panorama is an original generated local asset; see `ASSETS.md`.

### Combat and progression

| Build ID | Identity | Q | C | V |
| --- | --- | --- | --- | --- |
| `blade` | Chronoblade / katana | Time fracture | Targeted blinkstrike | Projectile parry |
| `ghost` | Netrunner / arc | Chain breach | Targeted EMP | Optical cloak |
| `tank` | Breaker / fists | Seismic pulse | Shoulder rush | Brace barrier |
| `gun` | Gunslinger / pistol | Deadeye | Fan volley | Reflex evade |

See exported `SKILLS` for authoritative costs/cooldowns. Melee has a three-hit combo and downward airborne hits can bounce the player. Blink checks solid collision. EMP/chain effects cap targets at three. Cloak breaks on attack. Heavy frontal armor rewards flanking. Guards burst fire, snipers telegraph a locked beam, drones attack from the air. Warden has three attack patterns, phase pressure, armor and stagger resistance. There is no artificial minimum encounter duration; an earlier experimental clock-based damage cap was removed.

XP comes from kills, silent takedowns, first-time hacks and memories. Level cap 5. Each level grants a point. Three talents, two ranks each:

- Force: +15% weapon/ability damage per rank.
- Flow: −10% ability energy cost, −12% ability cooldown, +12% energy regeneration per rank.
- Guard: +20 maximum health, recover 20 health, −8% incoming damage per rank.

Separate salvage augments: armor, reactor and weapon overclock. Three collectible sidearms: Needle, Synapse and Breach.

### Alarm rules

Confirmed sightings and witnessed loud attacks raise district heat. Alert increases patrol speed and fire rate. Lockdown warns before deploying responders; total extra responders are capped at three per run. Breaking contact for six seconds starts cooling. Physical substations can be hacked repeatedly to clear heat and jam response for 35 seconds; local enemy detection/combat still operates. Repeated jamming must not farm XP. Safehouses deny healing/saving during an alert or nearby pursuit. Alarms never close off mission completion.

## Controls

| Action | Input |
| --- | --- |
| Move | A/D or left/right arrows |
| Jump / double jump | Space |
| Climb | W/S at ladder |
| Crouch / drop through ledge | S / S+Space |
| Dash | Shift |
| Signature attack | Left mouse / J |
| Precision aim and request mouse capture | Hold right mouse |
| Fire sidearm | Right + left mouse / K |
| Abilities | Q / C / V |
| Interact, hack, takedown | E |
| Decoy | F |
| Cycle collected sidearms | R |
| XP talents | T |
| Map / manual | M or Tab / H |
| Release cursor, pause or close menu | Escape |

Right click alone must never fire. Mouse aiming is exact; target brackets provide feedback, not aim snapping. Without mouse aim, keyboard fire is straight ahead. Pointer lock persists until release/menu/blur; holding RMB controls precision aim. Native capture was rejected by the Codex embedded browser, and the fallback was verified. Successful pointer lock in a normal browser remains to be verified. Avoid conflating an embedded-browser restriction with a game implementation failure.

## Architecture and contracts

Vanilla ES modules + Canvas 2D + browser local storage. No engine framework or remote runtime dependencies.

| File | Responsibility |
| --- | --- |
| `src/game.js` | Simulation, collision, AI, combat, skills, XP, security, checkpoints, persistence |
| `src/world.js` | Authored level geometry, ladders, shadows, objects, spawns, campaign metadata |
| `src/main.js` | Bootstrap, input mapping, UI/modals, save storage, audio integration, camera/frame loop |
| `src/aim.js` | Testable reticle state, pointer-lock controller, target overlay |
| `src/renderer.js` | Environment, parallax, lighting, world objects, effects, render integration |
| `src/actors.js` | Articulated player/enemy drawing, weapon aiming, character silhouettes and animation |
| `src/audio.js` | Procedural soundtrack and SFX |
| `index.html`, `style.css` | Title, HUD, modal UI and layout |
| `server.mjs` | Local static server on port 4173 |

World coordinates use top-left x/y, with y increasing downward. Player collider is 28 × 54; art extends beyond it. Platforms are one-way unless `kind: 'solid'`. Closed gates also count as solids. Floor is around y=2140. `Game.lineClear()` tests against solids. Camera is world top-left; aim controller converts logical screen coordinates into world coordinates.

Game input includes movement flags, `jumpPressed`, `dashPressed`, `attack`, `secondary`, `aiming`, exact world `aim`, `abilityPressed` (Q), `skillPressed` (C), `guardPressed` (V), interaction and decoy. Main loop clamps elapsed time; simulation receives dt. Jump buffer is 120ms, coyote time 110ms. Preserve reachability when tuning jump/dash physics.

`Game.events` bridges simulation and UI/audio. Events include sound, toast, save, hack, upgrade, lore, ending, death, zone and levelup. Menus pause simulation and clear held inputs. Be careful about stuck mouse buttons or pointer-lock loss when opening menus.

Player animation/skill fields include `aimAngle`, `aimX`, `aimY`, `aiming`, `combo`, `comboTimer`, `attackTimer`, `dashTimer`, `parry`, `cloak`, `barrier`, `rush` and `skillTimer`. Cooldowns: `abilityCooldown`, `skillCooldown`, `guardCooldown`. Enemy fields include `type`, `alert`, `state`, `stun`, `telegraph`, `phase`, `active`, `dead`, health and geometry. Preserve the renderer/simulation contract when changing either.

Save key: `null-rain-save-v1`; QA uses `null-rain-save-v1-qa` with `?debug`. Settings key: `null-rain-settings-v1`. Version-1 saves are restored with defaults for new XP/talent fields. Keep old-save compatibility or explicitly migrate. Never overwrite a user's normal save with fixtures.

## Verification baseline and honest limits

Latest full suite: **34 passing tests** via `npm test`.

- `tests/game.test.mjs`: core combat, abilities, stealth, collision, mission, pickups and retry.
- `tests/combat-v2.test.mjs`: exact aim, skill gating, blink collision, EMP cap, combos/pogo, parry/cloak, armor, telegraphs, XP/old saves and jump buffering.
- `tests/aim.test.mjs`: primary/aimed-fire exclusivity and screen/world reticle behavior.
- `tests/security.test.mjs`: heat, response bounds, jamming, cooling, persistence and mission completion in lockdown.
- `tests/routes.test.mjs`: traverses spawn through relays, roof loot, boss bypass, core and extraction using movement inputs. **Enemy combat is frozen and invulnerability isolates geometry; this is not a normal-difficulty full playthrough.**

Browser checks across prior iterations covered puzzle solving, saving/reloading, map, endings and alarm jamming. Latest combat iteration checked launch, new art/HUD, pointer-lock fallback, XP level-up and talent purchase. Final fresh preview showed no console errors. Latest combat balance has not received a full human-style, normal-health playthrough with every build. Earlier successful arena simulations predate the new boss tuning and do not validate the current balance.

Screenshots: `assets/combat-preview.jpg` (latest), `assets/alarm-preview.jpg`, `assets/gameplay-preview.jpg` (older).

Opt-in `?debug` keyboard fixtures:

- Alt+1: next relay.
- Alt+2: unlock relays and place at Warden.
- Alt+3: prepare extraction.
- Alt+4: raise lockdown.
- Alt+5: alarm substation.
- Alt+6: add XP.

Fixtures do not exist in normal play. A debug bridge is also installed only in debug mode. Use fixtures to inspect systems, then verify genuine gameplay separately.

## Recommended next improvements, in order

1. **Play and tune responsiveness.** Verify pointer lock in normal Chrome/Edge, cursor release, simultaneous move/aim/fire, menu transitions and camera behavior. Check dash/jump interaction, corner snagging, landing feedback and input buffering. Target Mark of the Ninja's responsiveness without claiming parity.
2. **Combat readability and fairness.** Play first encounters and Warden with every build at normal health. Tune telegraph visibility, projectile pressure, defensive timing, melee reach, stun resistance and resource recovery. Ensure melee builds can reach airborne threats and finish the boss without relying on the override. Preserve both combat and stealth routes.
3. **Character presentation.** Review silhouettes at actual gameplay scale. Current characters are code-drawn articulated figures, not production sprite sheets. Improve readable faces, outfit identity, run/jump/land/attack poses and enemy tells. Keep their original cyberpunk identity while following the user's SteamWorld-inspired direction.
4. **First-level encounter and exploration quality.** Add meaningful route tradeoffs, cover, hazards, rewards and concise teaching where justified. Avoid simply increasing enemy count or map dimensions. Keep existing routes completable.
5. **Polish and usability.** Audit all skill descriptions against actual mechanics, HUD density at smaller desktop sizes, audio balance, checkpoints and old saves. Consider compact ability explanations; current live HUD tooltips are not a substitute for learning each build.

Potential issues in this list are audit targets, not confirmed bugs. Make small coherent changes and rerun relevant tests. Do not replace meaningful assertions just to make tests pass after a regression. Retain the complete ending flow and the no-alarm-failure rule. Do not expand to chapters two and three until the first level is convincingly better.

## Suggested first Claude work session

1. Run the baseline tests and inspect the current game in a desktop browser.
2. Play one stealth route and one aggressive encounter; inspect all four builds and the boss with QA fixtures as needed.
3. Choose the highest-impact feel/readability problems and fix a bounded set.
4. Validate affected systems plus the complete route, capture a fresh screenshot and update `PROGRESS.md` with changes, checks and remaining limitations.

Deliver a playable improvement rather than only a plan. Keep all work within this project directory.

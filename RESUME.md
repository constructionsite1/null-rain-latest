# NULL // RAIN — resume notes

## Distributed checkpoint safehouses

Nine outdoor checkpoints now span the city (six added): start230, market1400, maintenance2670, service tunnel4900, crown approach5270, Bazaar7480, Lotus9090, Yards11204, Spires11744. Existing maintenance/crown checkpoints moved outside restricted boundaries; Cinder boundary ends11180 to preserve the clear union-refuge approach. All checkpoint positions are clear of solids and in public/neutral territory. Cyan booth outlines, SAFEHOUSE/E sign, active SAVED label and map markers show them. E prioritizes a nearby checkpoint over takedowns. Sync refills health/energy/stamina/magazines; active pursuit/alerts deny sync, unrelated NPC skirmishes do not.

Verification: 62 tests pass, including all nine checkpoint clear-standing positions, access rules, E sync/refill and chosen-position retry. Browser verified R reload and stamina drain, red YOU DIED and retry, restricted Watch House warnings, and improved storefront rendering. An earlier street scope error was fixed; it remains only in the browser's historical log. Full normal-health balancing remains outstanding.


## Distinct businesses and territorial bases — October 2, 2026

Added seven distinct storefront/residential interiors in street.js, with visible shopkeepers, soup steam, clinic scanner/bed, animated laundromat drums, repair parts, records, grocery shelves, apartment mailboxes/stairs. Materials, colored neon, vertical projecting signs, balcony railings, warm residential windows and cycling advertisements vary across the streets.

New territories.js defines eight bases/blocks with personality, bounds and public/neutral/restricted access rules. Public Helix street sentries tolerate visitors until personally attacked or district security becomes alerted. Wire Saints club and Lotus cooperative are neutral. Signal Roost/Uplink use existing sniper/drone encounters; Watch House is a heavy garrison; Archive remains Warden fortress; Cinder Furnace Yard now contains the seeded Cinder crew with one heavy; Executive Compound is private security. Seeded groups now spawn Wire Bazaar/Cinder Yards/optional Wire Stacks, still using clear-gap placement. Restricted groups select the player while inside their base; provocation persists after exit and in saves. Neutral patrols still fight other factions. Reinforcements remain hostile.

Boundary plaques, colored pavement markings, base furniture/furnaces/music signs, HUD access rules, target labels and map shading distinguish access. Clear contextual warning appears on entry. Four initial territory tests plus actual attack simulation verify neutral visitors, trespass targeting, aggression persistence and room rules. Debug Alt+9 tests red death UI; Alt+8 visits doors, Alt+7 eastern districts.


## Reload, stamina, parry and street atmosphere — October 2, 2026

Implemented per-weapon magazines (pistol12/pulse16/arc8/scatter4), manual R reload of last fired gun, automatic reload on an empty trigger, weapon-specific reload times, reload HUD/progress reticle/audio/hand pose. X now switches sidearms and cancels reload. Supplies are unlimited; timing is the combat cost. Dash uses separate stamina:100 max,35 per Shift dash,0.9s delay,24/s regeneration. Abilities retain their energy costs. Safehouses/retry refill equipment; old saves receive independent safe defaults, current saves preserve ammo/stamina/reload progress.

Chronoblade ordinary swings deflect front bullets for 0.14s. V guards0.55s: first0.14s is perfect,75% chance to return toward a living shooter (otherwise scatter). Late guard deflects without targeted return. Existing no-owner rounds reverse during perfect parry. Reflected rounds retain normal collision/damage and may miss moving shooters. Metallic feedback and PERFECT PARRY/RETURN labels differentiate timing. Projectile location damage is head2x/torso1x/legs0.65x based on swept first contact, for people on either side. Mechanical drone/Warden armor unchanged. Headshot reticle/impact labels added. Quick keyboard/mouse attack taps are buffered for the next frame.

Street atmosphere includes masonry courses, roof edges/gutters, silhouettes moving behind lit windows, lamps, drains/steam, planters, parked service vehicles/taxis and district plaques. These sit behind gameplay and retain mission geometry.

Verification: 56 gameplay tests pass (seven new resource/body/parry tests), original full traversal still passes. Browser caught and fixed a street-render scope error; final browser QA and screenshot are recorded in this turn. Normal-health combat balancing remains to be measured.


## Human character, interiors and Gunslinger pass — October 2, 2026

Active project: main Punk 2D directory. Latest art direction is SteamWorld Heist II-inspired silhouettes, outfits and mechanical details, expressed as original human characters. `src/human-actors.js` replaces humanoid art with layered coats, visible faces, boots, articulated knees/elbows and smaller weapons. Gait follows actual position changes (including AI patrols); crouch, jump, climb, recoil and coat motion have distinct poses. Drones/Warden retain their existing mechanical rendering. Space Bunny CLI supplied the first human renderer; Codex integrated it and corrected identity hashing, guard faction outfits, gait and climbing grips.

Three real enterable buildings are implemented in `src/interiors.js`: After Hours diner (x970), Helix watch house (x2870), Wire Saints social club (x8090). E enters/leaves at street doors. Furnished rooms contain usable stairs/poles/lofts, residents, supplies, guards and an alarm rack in the watch house. Gang club members are neutral until attacked. Exiting restores the same street position; room loot/enemies and current room location survive saves. Street security dispatch pauses indoors. Exterior mission routes are preserved.

Gunslinger: LMB fires Vigil pistol toward cursor, RMB optionally captures precision cursor without changing weapon, K fires acquired sidearm, J fires straight forward in keyboard play. HUD, briefing, manual, tutorial and README describe this. Pistol now has explicit weapon stats. View is closer (720 world pixels high).

Validation: all 49 tests pass, including five new interior/control tests and the complete original mission traversal. Syntax and Git whitespace checks pass. Browser checked human art, diner and watch-house transitions, Gunslinger HUD; no console errors. Debug Alt+8 cycles building door locations, E performs the actual transition; Alt+7 still tours eastern districts. QA uses its separate save slot.

Remaining: normal-health encounter balance/playthrough, more distinct room geometry and civilian routines, richer room interactions, and further architecture/art refinement. This is a procedural human art pass, not a full authored sprite asset pipeline.


## Current city-life implementation — October 2, 2026

Work remains in the main directory. Implemented `src/civilians.js`, `src/factions.js` and `src/street.js`, integrated with simulation, rendering, saves and audio. Vendors, residents, couriers and commuters walk bounded street intervals, pause, carry umbrellas, flee nearby combat and talk with E. Civilians are not enemies or damage/XP targets. Two or three seeded groups (Wire Saints / Cinder Crew) spawn in the eastern districts. Gangs fight security and opposing factions, remain neutral until attacked, and preserve group hostility in saves. NPC kills award no player resources or security heat; skirmishes activate locally so groups survive until approached. Civilian routines reset on load with the saved city seed; gang position/health/hostility are saved.

Shop fronts include lit shelves, doors, house numbers, varied upper floors, animated laundry, benches and night-line displays. Ground floors render as street infrastructure and an animated underground train. Poles now support gripping on release, faster S slides, and A/D + Space kicks with a short regrab delay. Collision layout and mission routes remain intact. District audio is wired and refreshes on return visits. Neutral crews use amber targeting and one group label; dead crews leave small dropped equipment details.

Validation: 44 tests pass, including ten new city tests and the original full geometry route. Browser reviewed Rain Market and all four eastern districts plus the full-width map, with no console errors. A normal-health full playthrough and measured frame-rate audit are still outstanding. Space Bunny CLI supplied a read-only design review; Codex implemented and verified the changes. In `?debug`, Alt+7 cycles the eastern districts for review.

Remaining priorities: an organic collision-layout/interior rebuild (existing geometry is retained), encounter balance, richer civilian routines and interior interaction, small-screen HUD/dialogue polish, and normal-difficulty playthrough testing. The historical next-task list below is superseded for civilians, gangs, district audio and pole movement.

## Active Codex resumption — October 2, 2026

- Active working directory: `C:\Users\Asus\Desktop\AI Personal Projects\Punk 2D` (the main project directory). Make subsequent edits here.
- Copied all 40 tracked project files from `Claude's take`, including its current uncommitted file contents. Verified matching file hashes before adding this resumption note. Preserved the main repository's Git history and left the source copy intact; excluded Claude's Git metadata and agent worktrees.
- Verification in the main directory: `npm test` passes all 34 tests. No new gameplay features or browser/playthrough verification were performed during this transfer.
- `npm start` in this directory defaults to port 4173. The port 4180 instruction below describes Claude's separate copy and is historical.
- Continue from the current implementation and the unfinished tasks below: civilians, random gangs, district audio integration, traversal/layout improvements and gameplay verification.
- The user authorizes calling OpenCode CLI Space Bunny for help when useful, especially design and related code.


These notes are for the next AI coding agent (for example GPT/Codex) picking this up. They cover the session on October 2, 2026, 16:04–16:28 IST. Read `HANDOFF.md` for the original architecture and contracts, and `PROGRESS.md` for history. This file covers what changed since then and what to do next.

## Run / verify

```bash
npm test          # 34 tests, all passing at the end of the session
PORT=4180 node server.mjs   # or the "null-rain" config in .claude/launch.json
```

- Use **http://localhost:4180/** for this folder. Port 4173 on this machine was serving a *different* copy of the game.
- `?debug` exposes `window.__NULL_RAIN__` with `game`, `start(build)`, `closeModal()`, `step(dt)` and other helpers. It is useful for teleporting the player, for example `g.player.x = 10200`.
- The browser pane's rAF stops when the pane is hidden, and `innerWidth`/`innerHeight` read 0. That is a pane artifact, not a game bug.

## Working method (what worked)

- The user expects fast, parallel progress without clarification questions. Work to the stated deadline and keep pushing.
- Split work by file ownership so parallel changes don't conflict, for example hoods/*, actors.js, renderer.js, dialogue.js, hints.js and audio.js.
- Do one change per git branch or worktree, merge with `git merge --no-ff`, and run `node --check <file>` and `npm test` after each merge.
- Do a browser sanity check (start a game, teleport into each district) before declaring something done.
- Never trust a "done" report without running the tests yourself.

## What exists now (all on `main`)

| Area | Where | Notes |
| --- | --- | --- |
| Hints panel | `src/hints.js`, `main.js`, `index.html`, `style.css` | Top-right, on by default, `G` toggles it, plus a pause-menu checkbox. Shows the build, Q/C/V with costs, and one contextual tip, including tips for each district. Stored in `null-rain-settings-v1`. |
| Tutorial | `main.js` (`TUT`, `tutTick`, `tutRender`) | Title-screen `TUTORIAL: ON/OFF`, on by default. 13 input-driven steps. Enter skips a step and Esc skips the tutorial. Sets `tutorialDone`. |
| Dialogue | `src/dialogue.js` | `createDialogue()`, then `begin(game)`, `onEvent(ev)` and `update(dt)`. Bottom comms box with a typewriter effect. Lines come from VEX, the Warden and per-build replies, plus arrival lines for each district. Each trigger fires once per run. |
| City backdrop | `src/renderer.js` `buildCity()`/`city()` | Three cached seeded parallax layers in four district styles, with animated neon, hover-cars, steam and puddles. |
| Architecture look | `src/renderer.js` `platform()`/`ladder()` | Ladders are drawn as poles. Platforms are drawn as balconies, fire escapes, awnings and catwalks with supports. Solids are drawn as buildings. **Drawing only, so collision is unchanged.** |
| Player anim/sync | `src/actors.js`, `src/game.js` | Squash and stretch, dash afterimages and attack FX per build. The player faces the aim direction when attacking, and the swing arc matches the real reach. |
| Neighbourhoods | `src/hoods/{bazaar,stacks,yards,spires}.js`, `src/hoods/index.js` | `attachHoods(world)` (called in `createWorld`) appends 1,400-wide procedural districts east of x=7200, so the world is now 12,800 wide. Each district returns `platforms, ladders, shadows, decorations, pickups, zones, enemies`. |
| District enemies | the hood files | 19 enemies (guards, heavies, drones, snipers). Glass Spires has 7, so it may be harsh. |
| Enemy styles | `src/actors.js` | Looks are chosen by world x: neon-mask enforcers, scrap militia, welder-bots, and white corporate security with halo drones. |
| District audio | `src/audio.js` `setDistrict(name)` | **Not called anywhere yet.** |

## Next tasks (user asked, not done)

1. **Civilians.** Add a new `civilians` array (new module, for example `src/civilians.js`, plus drawing in `actors.js`). They wander the streets and flee when `game.alarm` rises, when combat sounds are near, or when an enemy is alerted nearby. They must not count as enemies for XP or alarms. They should be cheap to simulate.
2. **Random gangs.** Spawn 2–3 gang groups at random street spots (seeded per run). They fight Helix guards and each other, and turn hostile if the player attacks them. This needs a faction field on enemies and target selection in `game.js`, which is the riskiest part, so add tests.
3. **Wire district audio.** On the `zone` event in `main.js`, call `audio.setDistrict(...)` with names that match those in `audio.js` (neon / yards / spires / undercity).
4. **Exploration feel.** Make pole climbing a distinct mechanic: slide down, jump off sideways. Turn the original Rain Market platform layout into more organic streets, interiors and rooftops. Keep `tests/routes.test.mjs` passing.
5. **Verify untested items:**
   - map (M) with the 12,800-wide world
   - combat balance in the new districts
   - hints panel overlap on small screens
   - dialogue timing
   - frame rate with the cached layers
   - a full normal-difficulty playthrough

## Gotchas

- An agent once filled `game.js` with interleaved blank lines (a CRLF artifact). Check `git diff -w --stat` on merges.
- Agent worktrees may start from an older commit. Tell agents to run `git merge --ff-only main` first.
- `glow()` in the renderer and `resize()` in `main.js` now guard against non-finite sizes. Keep those guards.
- Hood modules alias `objects` to `decorations`, and `attachHoods` skips the duplicate.
- Leftover agent worktrees live in `.claude/worktrees/` and old opencode/kilo worktrees live in `%TEMP%\direct_wt\`. Both are safe to remove.

Death feedback: replaced Signal Interrupted with a red FLATLINED / HEALTH 0 and YOU DIED screen, clear RETRY FROM SAFEHOUSE action and save rollback notice. Debug Alt+9 forces a real lethal hit for UI verification.

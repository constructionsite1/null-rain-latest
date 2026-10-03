# Combat presentation direction — current user references

Work in the MAIN Punk 2D directory. The nested Claude's take folder is archival.
The user asks for two maximum-reasoning free Space Bunny CLI agents, with Codex directing and reviewing. This assignment is the Kilo Code combat presentation / mechanical villain artist role.

## Your exclusive files

- src/actors.js (preserve the drawHuman/drawResident wrapper APIs)
- src/renderer.js
- Optional NEW src/combat-presentation.js
- Optional animation-lab.html and src/animation-lab.js (a standalone visual review showcase)
- docs/art-direction/EFFECTS-REPORT.md
- src/interiors.js ONLY for the two integration repairs below; preserve all art and room data otherwise.

## Existing integration blockers to repair first

The previous architecture agent left drawInterior using `rect(0,0,...)` calls while `rect` is now a top-level alias of A.box, whose first parameter must be the Canvas context. Establish the original context-bound local helper inside drawInterior (or consistently pass c) so ALL rect calls actually render. The old agent's mock raster probes missed this; review the real call signatures. Also restore the original exit door color `color:'#80d9cf'` in createInterior's exit interactable; this was accidentally removed outside that agent's art scope. Leave collision/room/enemy data unchanged. Syntax-only and gameplay tests won't catch the rect rendering bug: exercise drawInterior for all three rooms with a strict Canvas context mock or real Canvas harness, and report results. Keep temporary probe files confined to .qa/; no outside folders or external directory operations.

Do not edit human-actors.js or character-rig.js (the other live agent owns them), game.js, main.js, audio.js, city/interior architecture, styles, existing HTML, tests, Git or existing docs. Do not run browser automation, download tools, commit, or inspect the archival tree. Report needed integration changes outside ownership instead of editing them. The director handles real-browser review.

## Reference and target

Study the attached animation sheet and combat scene, also available here as PNGs. Original art inspired by the references. Chronoblade's signature presentation is electric GREEN with pale hot cores, dark human tactical silhouette, temporal copies of its actual articulated pose, slicing energy ribbons and quick sparks. City lighting stays cyan/magenta; do not turn the whole city green. Armored villains should read as threatening, heavy and human shaped instead of toy robots.

## World combat effects

Replace the current three translated stale ghost copies with convincing distance-spaced afterimages during dash, blink and time fracture, using actual prior world positions and render-local state only. Preserve the main actor's animation state: the character artist will make ghost draws non-mutating. Trails fade green for Chronoblade; other builds keep their own accents. Visible temporal streaks should follow movement direction, not always horizontal offsets. Clear history on teleports, restart, world change and reversed/paused time. Bound memory and avoid filling the screen with copies when standing still. No simulation mutation from rendering.

Give existing melee/slash, blink, parry/reflect, headshot, muzzle flash and impacts crisp local effects: hot core + restrained bloom, short sparks, sweep shape, readable hit response. Use existing effects and state fields; do not change damage, ranges, invulnerability, magazines, stamina, territorial hostility or save formats. Time fracture may have subtle green edge distortion/vignette and temporal streaks but keep enemies, shots and hazards readable. Avoid strong continuous flashing or full-screen washed-out effects. The player always needs a sharp foreground silhouette.

Mechanical threats in actors.js: redesign Warden with a powerful biped / armored enforcer silhouette, meaningful shoulder/torso armor, clear red visor/core and weapon, planted heavy stride, windup/recovery and phase distinction. Keep its actual w/h data, attacks and hitboxes unchanged. Drones should read as compact surveillance machines with a distinct sensor and rotors, not floating dinner plates. Human enemy redesign belongs to the other agent; preserve drawActor's neutral/hostile and health/status labels.

Review foreground level rendering so old solid geometry doesn't visually erase the new district personality. A prior director fix renders yards-cont-* as corrugated freight containers rather than apartments. Preserve and improve it if useful, keeping all geometry/collision intact. Avoid expanding the scope into another architecture rewrite.

## Animation showcase

Create a standalone animation-lab.html + src/animation-lab.js if useful for review. It should import the REAL actor renderer, show actual enlarged poses (idle/run/jump/crouch/climb/dash/three combo strikes/parry/fire/reload/hit/death) and villain silhouettes, with a dark cyan/green readable presentation and controls to pause/reset/switch build. This is a visual harness only, no duplicate game mechanics. It must work from the existing local server without altering main.js or index.html. Main renderer imports must stay Node-safe where currently supported.

Preserve render(c,s,width,height), renderTitle/renderDossier and drawActor APIs. Every drawing path saves/restores state. Run syntax/import checks and npm test once after owned implementation. Write EFFECTS-REPORT.md with results, limitations and any requested integration fixes. Finish promptly after delivery.

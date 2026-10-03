# Character direction — current user references

Work in the MAIN Punk 2D directory. The nested Claude's take copy is archival.
The user asks for two maximum-reasoning free Space Bunny CLI agents, with Codex acting as director and reviewer. This assignment is the OpenCode character artist / animator role.

## Your exclusive files

- src/human-actors.js
- Optional NEW src/character-rig.js, imported only by human-actors.js
- docs/art-direction/CHARACTER-REPORT.md for a concise delivery report

Do not edit actors.js, renderer.js, game.js, main.js, audio.js, city architecture, HTML, CSS, tests, Git configuration or existing docs. Another live agent owns effects and mechanical villains. Do not run browser automation, download tools, commit, or inspect the archival tree. Use Node syntax checks; the director handles browser review. Report needed changes outside ownership instead of making them.

## Reference and target

Study the attached animation sheet and combat scene, also available in this folder as PNGs. The current characters look like small upright paper dolls. Make a substantial visual and animation improvement, not another palette swap.

Chronoblade: lean, athletic, human cybernetic runner; dark layered tactical clothing; angled shoulder plates, strapped forearms, plated shins, split coat/scarf tails, asymmetric spinal implant, warm visible face or narrow green visor, swept hair/topknot. A long green edged katana with a believable grip, guard and scabbard. Green is the signature accent for this build, with pale hot blade core. Human proportions, small head, strong hands/boots, silhouette readable at actual 54px gameplay height and at enlarged portraits. Original artwork inspired by the references, no pasted reference background/sheet.

Other builds retain distinct identities: violet hooded Netrunner; broad amber Breaker with mechanical gauntlets; burgundy/brass Gunslinger with coat, holster and clear pistol. Human guards: dark tactical armor with red sensor slits; heavier guards have wider shoulders, layered torso plates and massive boots. Neutral Wire/Cinder crews retain readable faction accents and civilian styling. Civilians stay recognizably human and retain varied outfits.

## Motion and animation

Use articulated local joints and pose blending rather than translating stiff limbs. Clearly different idle breathing, walking, running, sprint/dash, jump takeoff/ascent/descent/landing, crouch, pole climb, melee combo 1/2/3, aimed firing/recoil, reload, timed parry, hit recoil, death/collapse. Use the game's EXISTING state fields and weapons; do not invent gameplay abilities or new input requirements.

Running must lean forward and show planted foot stance / bent knees. Dash should be a low committed lunge with trailing coat/scarf. Katana attacks should visibly wind up and follow through, torso rotates, both arms participate, and each combo uses a different sweep. Draw the green sword arc close to the actual arm/blade path; the separate effects agent will add world trails. Parry is a planted guard with blade across the upper torso. Pole climbing alternates hands/feet. Crouch compresses the whole figure. Guns fire from the hand toward aimAngle, with recoil and supported grip; reload lowers weapon and brings the other hand to magazine.

Preserve drawHuman(c,e,t,player=false,build=e.build||'blade',ghost=false) and drawResident(c,e,t) APIs. Preserve the actual collision/hitbox geometry: drawings may project slightly beyond bounds, but do not change actor data. All drawing saves/restores Canvas state. Rendering must not mutate simulation objects. Renderer-local WeakMap animation memory is okay, but ghost draws must not advance or corrupt the live pose state (current renderer makes several ghost calls per frame). Handle zero/reversed delta, paused time, teleports, dead actors, minimal portrait actor data, all four builds, and unknown/default IDs robustly. Avoid per-frame heavy object churn. No dependencies unless truly necessary for the native Canvas renderer.

Deliver working code, run syntax/import checks, and write CHARACTER-REPORT.md listing visual changes, limitations, and any integration requests. Finish promptly after your owned work is complete.

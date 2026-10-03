# Rejected draft: reference-faithful painted art presentation

User rejects geometric character art and requests close match to references with only small differences, complete overhaul allowed. Current pass not accepted. Root generates painted transparent sprite atlases; OpenCode owns human sprite integration via human-actors/character-rig/new sprite-actors.js. You own renderer.js, actors.js (Warden/drone), combat-presentation.js, animation-lab.html/src/animation-lab.js. Additionally narrow main.js resize/camera/init/weapon label/loading callback integration now authorized. If needed own small index/style changes for loading/zoom only. Do NOT edit other role files.

Read PAINTED-OVERHAUL-CHARACTER.md for planned atlas paths and frame layouts. Asset generation is running; do not fake assets. Integrate OpenCode published preload/status/frame snapshot contract after it exists. Replace legacy temporal bridge with exact selected painted-frame/facing snapshot contract. Real silhouettes in tinted echoes should use painted characters. Match red Gunslinger / green Chronoblade with crisp local effects.

Camera is crucial: 54px actors in720logical are unreadably tiny. Target approximately420–480logical height normal landscape gameplay (closer to references), without changing physics/hitboxes. Preserve cursor world projection, rooms/retry/resize camera centering and HUD. A simple zoom +/− if practical can give user choice. Default should visibly showcase character, not hide it. Start/room camera must not snap in from stale720 setup.

Fix current lab first: current placement translates unscaled actor coords THEN scales, causing feet to spill below panels and walking actors drift off cell. Clip cells, translate to cell foot anchor then scale then translate negative actor foot coordinates. This is a director-confirmed screenshot defect. Check there isn't invalid `let CLOCK.dt` from your global replace interruption. Run node --check. Current first three cells look identical because motion state/placement bug. Preview must show actual enlarged painted characters correctly, all builds, fire/air/crouch/reload, villain identity. Remove technical module names from user-facing lab; simple visual preview with play/pause/step/builds. Do not build mocks.

Human villains use generated enemy atlas; preserve Warden imposing biped and drone unless close-reference heavy painted art can replace Warden visibly too via clean cross-role interface. Villain reference need NOT be as intricate (user correction), silhouettes and outfit identities matter. Keep territories labels, city, freight containers, all mechanics and save states. Avoid screen-filling effects that hide painted artwork.

You can implement camera/lab/effect scaffolding while assets generate; inspect actual assets when ready and coordinate through reports. Once delivered director runs actual-browser QA. Report limitations honestly; no final acceptance from syntax alone.

UPDATE: all3 painted atlases ARE NOW READY in assets/characters, see PAINTED-ASSETS-READY.md. OpenCode integrates sprites; do not wait on generation.

Director actual browser lab review: repeated TypeError reading dt at drawEchoBay line208 before latest corrections, ensure reload after fix no errors. Sprite draft every hero pose idle due OpenCode def.rows dispatch bug; root sent that to character role. Assets ready; movement atlas8frames/build pending then integrate.

ADDITIONAL REQUIRED: PAINTED-WARDEN-BRIEF.md. User rejects geometric character designs wholesale; your current geometric robot Warden must use new painted8pose boss atlas (generating now). Complete it within your owned files after camera/loading/FX integration, before reporting acceptance.

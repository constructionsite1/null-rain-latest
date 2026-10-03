# User's current direction — preserve the city, unify its rendering

ASSETS NOW READY in assets/world: painted-city-v1.png 2112x744; photopixel-materials-v1.png eight square materials arranged4x2. All inspected by root. Use generated material atlas as actual surface paint, preserving existing geometry.

The user clarified: the world LOOKS GOOD, do NOT redesign layout/businesses/building personality. It needs to match the characters' realistic PHOTOPIXEL style. Neon should feel stylized/cartoonish but physically luminous, affecting FOREGROUND. Also smooth character animations.

Root remains designer/orchestrator; SAME TWO CLI free Space Bunny MAX instances implement. No new simulations, collision changes, save schema, dependencies or mechanics. Keep previous gameplay systems intact. Finish remaining character crash/options/scale corrections FIRST; see SUPPLEMENT-LIVE-BLOCKERS.md. Kilo finish Warden visible8/8 FIRST; see WARDEN-LIVE-REVIEW.md.

## Art production / shared contract
Root is generating assets/world/photopixel-materials-v1.png (opaque4cols2rows material atlas) and assets/world/painted-city-v1.png (wide opaque cinematic parallax). They will be copied when ready; currently pending. Material tile indices:0 brick,1 plaster/concrete,2 gunmetal panel,3 corrugated freight steel,4 dark wood,5 wet asphalt,6 dark glass,7 rough black foundation. Genuine material shading/pixel grain. Use these as tactile surfaces on existing rectangles, not another wall of random vector lines.

OpenCode owns NEW src/world-art.js. Shared exports: preloadWorldArt() resolves status, worldArtStatus(), paintMaterial(c,kind,x,y,w,h,{alpha,seed,scale}={}) returns boolean, drawPaintedPanorama(c,game,width,height) returns boolean. kind accepts indices or brick,plaster,metal,corrugated,wood,pavement,glass,foundation. Node-safe; pending art uses existing visuals. Cache patterns/crops; no per-frame image reads. Draw small repeats at believable detail scale; roughness subtle, body silhouettes legible. Panorama is far background only, current businesses/landmarks intact. Kilo may import these exports after module lands; do not edit it.

## OpenCode task / exclusive ownership
human-actors.js, sprite-actors.js, character-rig.js; world-art.js; street.js, interiors.js, neon-architecture.js. Update CHARACTER-REPORT.md and WORLD-SURFACE-REPORT.md.
1. Finish actual sidearm/reload pose selection and stable supplement size; paintActor must receive existing art metadata correctly.
2. Smooth real sprite animation: stable body scale and anchor, consistent stride driven by distance, less frame jitter, short eased transitions while keeping moving legs active during fire. Gentle breathing/body weight shift. Do not stretch poses or cause sliding. If brief frame blends are used keep <=60ms, restrained and capture BOTH frames/weights in historical echoes. Attacks/parry feedback still immediate, no simulation interpolation or input delay. Frozen ghosts must remain frozen.
3. Apply realistic photopixel MATERIAL textures to EXISTING architecture (facade walls, shutters, steel, glass, brick), streets/props where owned, and all three room materials. Preserve address signs, homes, doors, business/neutral/restricted cues, upper balconies, cargo and colorful personality. Existing broad flat fills should visibly gain painted roughness, beveled shadow and varied edge wear. Keep low contrast behind heroes. Avoid every wall becoming the same texture/color. Safehouse/frontage and enterable rooms must still align.
4. Small believable directional bevels/contact shadows, no noisy speckles everywhere or full-screen texture overlay. Texture world geometry itself.

## Kilo task / exclusive ownership
renderer.js, combat-presentation.js, warden-sprites.js, actors.js, animation lab; narrow main.js loading/camera only; NEW world-lighting.js. Update EFFECTS-REPORT.md and WORLD-LIGHTING-REPORT.md.
1. Finish Warden repairs and verify actual visible8/8.
2. Compose world art preload with existing art loading; keep startup/retry usable on missing art. Use new panorama as far background, existing landmarks and city architecture remain.
3. Real NEON with stylized vivid cores: narrow hot tube, restrained colored bloom, luminous sign face and flicker, smooth colored falloff. Foreground MUST receive local colored lighting: painted characters, metal railings/cargo, pavement and props near signs/lights, not only background halo. Prefer bounded visible light sources, mask tint to foreground alpha so dark streets don't become giant flat circles. Separate ambient shadow from neon highlight. Small warm window pools, cyan utility/clinic, magenta club, red restricted warning, amber foundry. Light is connected to actual world sources and follows camera correctly; no arbitrary screen-center red/green wash.
4. Wet pavement reflections/broken streaks tied to lights; contact shadows ground feet and props; foreground steel bevels/materials using paintMaterial for renderer-owned platforms/cargo/buildings. Keep interaction indicators/territory/death UI legible, do not tint HUD. Scope foreground lighting only to world drawing beforeHUD. Cap sources/caches so performance remains playable. Canvas2D is sufficient; add a library only if essential.
5. Preserve actual collision platforms/ladder positions, doors/interiors, camera zoom, checkpoints, hostilities, existing VFX and bounded temporal trails. No universal bloomy fog.

Finish appropriate syntax/import/gameplay checks and report concise changed files + actual constraints. Root supplies assets and reviews actual game/lab/interiors and screenshots. Neither agent edits the other's owned files.

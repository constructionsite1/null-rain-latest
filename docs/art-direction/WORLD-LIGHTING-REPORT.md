# World lighting and surface report — NULL // RAIN

Role: Kilo (presentation). Owned files: `src/renderer.js`, `src/world-lighting.js` (new),
`src/combat-presentation.js`, `src/warden-sprites.js`, `src/actors.js`,
`animation-lab.html`, `src/animation-lab.js`, the narrow `src/main.js` loading/camera
slice. Not touched: `world-art.js`, `sprite-actors.js`, `human-actors.js`,
`character-rig.js`, `street.js`, `interiors.js`, `neon-architecture.js`, `game.js`,
`index.html`, `style.css`, tests, `.qa/`.

## 1. Lighting model (`src/world-lighting.js`)

Every light is derived from a real world source, so lighting tracks the architecture and
the camera instead of washing the frame.

- **Street registry** built once per world object (cached, gradients cached on the light):
  the eight authored neon signs, five shopfronts, street lanterns, the sodium lamp,
  awnings, service pipe, service vent and windows. Radii scale with the source size, so a
  340×180 billboard is a broad wash while a 24×42 lantern stays a point.
- **Interior registry**: rooms carry no decorations, so the interior branch lights them
  from the pendant fixtures their own painter already draws — diner `#ffd39a` ×4, hangout
  `#ffb0d8` ×3 plus one accent, barracks `#cfe9ee` ×2 + `#57e6dd` — each pooling on the
  room floor (`world.floor`), plus a low coloured wall wash from the room's own colour.
  Rooms are no longer unlit boxes.
- **Palette roles** derived from the authored source colour: magenta club, cyan utility /
  clinic, amber foundry, red restricted, warm window, shopfront — each with its own gain.
- **Ground connection**: each light finds the surface it actually illuminates (nearest
  platform top below it) and draws a soft shaft down to it plus a ground pool. No circles
  floating in open air, no screen-centre wash.
- **Wet pavement**: up to 4 broken vertical streaks hang below each pool, wobbling slowly,
  additive and short-lived. Tied to the light, drawn in world space so they follow the
  camera exactly.
- **Neon face**: signs get a **narrow luminous tube border** (2.4px core stroke + 1px hot
  inner stroke) with only a 16% interior wash, so painted lettering stays readable; a
  340×180 billboard never becomes a blank white panel. Only small fixtures (lamp, lantern,
  pendant) get a solid core. Bloom is a four-stop radial gradient (core → colour → dim →
  transparent) — the earlier draft created that gradient with no colour stops at all, which
  is why nothing lit up.
- **Flicker**: deterministic per light, ±flicker gain with an occasional short dip, clamped
  to 0.35–1.1. No strobing.
- **Ambient separated from highlight**: a shallow top-down ambient gradient darkens unlit
  geometry first; the neon pass is a separate additive pass afterwards. No universal fog.

## 2. Foreground character lighting

A halo around a source does not light a character, so characters render into one reusable
offscreen layer (`beginActorLayer`, one canvas reused across frames, resized only when the
view changes). Local sources are then applied to that layer with `source-atop`, so **only
character pixels take the colour** — no full-frame tint, no washed background, and no
label, territory marker, interface text or HUD pixel is ever tinted (labels stay on the
main context; the aim reticle is drawn after `render`). The layer is composited back with
`drawImage` at the camera origin, then the street neon pass adds its glow on top, so
characters receive both colour and bloom from the same source. If no DOM is available the
actors draw straight to the main context, unchanged.

Contact shadows ground every character and citizen (`addContact`, capped at 64, drawn as
soft ellipses) — including the Warden at 1.35× and drones at 0.5× so the boss reads heavy
and the drones read airborne.

Temporal echoes are drawn inside the same layer, so afterimages receive the local tint too.

## 3. Surfaces (`renderer.js`)

- Background: the painted panorama from the shared world-art module is used as the far
  background when available; otherwise the existing skyline plus the existing mirrored
  panorama tiles run unchanged. City layers, businesses, landmarks and layout are untouched.
- Renderer-owned geometry gains material paint through the shared `paintMaterial` bridge —
  see section 7 for the full list (street foundation, shop/safehouse frontage, service
  towers, freight containers, slabs, ledges) — with the vector detailing still drawn on top
  and a directional bevel added. Collision rectangles, ladders, doors, gates and safehouse
  frontage positions are unchanged.
- Freight containers keep the earlier identity work (lit extraction vents, dead Helix neon
  tags, stencils, rust) so the yard still reads as CINDER freight.

## 4. World art bridge and preloading

`world-art.js` is loaded through a tolerant dynamic import: absent or failing, every entry
point returns false and the previous visuals are used — startup and retry stay usable with
no art. When it lands, `preloadWorldArt()` is awaited automatically.
`preloadArt()` (re-exported from `renderer.js`, consumed by `main.js` and the lab) now
settles **character atlases + Warden + world art together**, resolves in ~1ms in Node with
no DOM, and never rejects. `worldArtStatus()` is re-exported for QA.

## 7. Final corrections from the first-screen review

1. **Actor layer blur.** The layer used to rasterise one source pixel per logical world
   pixel, so the device-pixel-ratio upscale blurred painted sprite edges. It now takes the
   scene scale from the live context transform (`ctx.getTransform().a`) and rasterises at
   that scale, capped at 2× so a 4K panel cannot blow up the buffer. The internal camera
   transform is preserved (`setTransform(scale,0,0,scale,-cam.x*scale,-cam.y*scale)`) and
   the layer is composited back into the **same logical rectangle**
   (`drawImage(layer, cam.x, cam.y, width, height)`). Per-light `source-atop` masks are
   unchanged, so only character pixels take colour. Full original source RGB is preserved —
   the sprite pipeline copies painted RGB and only masks alpha.
2. **Renderer-owned surfaces textured, after their opaque bases.** The special wide street
   foundation branch (which used to `return` before any material work) paints wet
   `pavement` on the slab and rough `foundation` on the cut face. Shop/safehouse frontages
   paint `brick` on the wall band, `plaster` on the shutter field and `corrugated` on the
   roller door; the door leaf paints `metal` and the lit window strip paints `glass` —
   all **after** their own opaque fills, with bevels added on the dominant faces. Service
   towers paint `metal`, freight `corrugated`, slabs `plaster`, low ledges `foundation`.
   Room doors paint `metal` frame, `corrugated` door leaf and `glass` vision panel, and the
   room header plate paints `metal`. Geometry, labels, doors and collision untouched.
3. **The SAFEHOUSE panel is the checkpoint interactable, not the shop decoration.** The
   big cyan panel is drawn by `interactable()` for `type:'checkpoint'`, so that branch now
   paints a `metal` main frame, a `corrugated` shutter field with ribs and stiles, and a
   `glass` SYNC screen — each after its own base fill — plus a lit top lip and a shadowed
   base. Labels (`SAVED / SAFEHOUSE`, `SYNC`) and the interaction geometry are unchanged.
4. **Interior floors textured after the opaque fill.** `render()` filled every interior
   platform with an opaque `#283b45`/`#57615e` after `drawInterior()` had already textured
   the room, so the dominant floor slab read flat in the actual diner. Interior platforms
   are now filled first and textured afterwards: `wood` for the diner and hangout,
   `metal` for the watch house, `pavement` for small non-solid ledges, with a lit top edge
   and shadowed base. The authored `y = 880` floor geometry is untouched.
5. **Neon pools anchored on the real pavement.** `groundBelow()` used to skip a platform
   whose top was level with the source (`top < y+24`) and seeded its search from `y+200`,
   so a storefront ending at y 2140 dropped its pool below the playable street. It now
   accepts tops level with the source and searches unbounded, falling back to a short 120px
   drop only when nothing is below. Verified on the real world data: **176 sources, maximum
   pool drop 330px** — every pool sits on a real surface.
6. **Shopfronts emit from their sign band.** A `shop` decoration lights its signboard
   (top 26px, centred, 84% width) with the narrow `edge` tube profile, not an imaginary
   full-building-height face, so no solid panel is ever drawn over shop art.
7. **Separate gradient cache keys.** Cached gradients keep their creation transform, so
   camera/zoom changes must invalidate them — but the world pass (scale 1) and the actor
   layer (scene scale) previously shared **one** key, which meant each pass cleared the
   other's gradients every frame. They now have independent keys
   (`GRAD_KEYS.world` / `GRAD_KEYS.actor`) and only invalidate their own gradients, so on a
   stationary camera both caches stay warm and per-frame reconstruction is gone.
8. **Combat effects above characters.** Characters, their local neon tint, contact
   shadows, ambient separation and the street neon pass are composited **before**
   projectiles, slash sweeps, impacts, sparks, steam and puddles.

QA helper: `lightSnapshot(world)` returns each source's emitter rect, `bottom`, `poolY`,
`reach`, `role` and `tube` profile, so the registry is verifiable without a browser
(`diner` 5, `barracks` 4, `hangout` 5 fixtures, all pooling on room floor 880).

## 8. Preserved

Camera zoom (440 default, `-`/`=`), cursor world projection, rooms/interiors, collision
platforms, ladders, doors, checkpoints, hostile logic, territorial labels, all VFX, the
bounded temporal echo ring and its frozen painted-frame bridge, save schema, camera zoom
and the existing red Gunslinger echo palette. No mechanics, no new dependency, no
simulation change. Lighting is drawn only inside world drawing and is capped at 10 visible
lights, 4 streaks per light and 64 contact shadows per frame; gradients are cached per
light, and there are no per-frame image reads.

## 9. Checks

- `node --check` clean: renderer, world-lighting, actors, combat-presentation,
  warden-sprites, main, animation-lab, world-art, sprite-actors.
- Real import graph: `import('./src/renderer.js')` resolves actors → human-actors →
  character-rig, sprite-actors, warden-sprites, world-art; `preloadArt()` resolved in ~1ms
  with 2 parts; `preloadWorldArt`/`paintSurface`/`paintPanorama` return safe falsy values
  when art is unavailable.
- Lighting registry verified against **real world data**: `createWorld()` yields 176 sources
  with a maximum pool drop of 330px, roles distributed utility 75 / club 32 / foundry 31 /
  window 20 / restricted 18. Interiors: diner 5, hangout 5, barracks 4 fixtures, all pooling
  on the room floor 880.
- Material ordering invariants asserted against the source: shop `glass` and door `metal`
  paints both occur after the `#21353a` door fill, and the interior platform paint occurs
  after the `#283b45`/`#57615e` opaque fill.
- `npm test` → **62 pass / 0 fail**.
- No browser automation was run. Sprite crispness, material visibility, pool placement on
  screen and gradient warmth are verified by construction and data, not visually — root's
  actual-browser pass remains the gate.

## 10. Review asks and constraints

1. Root browser review needed for: sprite edge crispness at the new scene-scale layer,
   material coverage on the safehouse frontage and street foundation, pool placement on the
   real pavement, shop sign-band emitters, effect layering over bodies, and the eight Warden
   frames.
2. `paintMaterial` is applied to renderer-owned geometry only (street foundation, shop and
   safehouse frontage, service towers, freight, slabs, ledges). OpenCode owns
   street/interior materials; both use the same shared helper, so nothing double-paints.
3. The actor layer now costs one canvas at up to 2× scene scale plus a composite per frame
   and per-light `source-atop` fills. If frame time regresses, the dials are `MAX_LIGHTS`
   (10) and the 2× oversample cap in `clampScale`.
4. Bloom/streak/pool alphas were tuned without a browser. If the result reads strong, the
   values live in three places: `ROLE_GAIN`, the `PROFILE` table, and the alpha literals in
   `drawLighting`/`drawSourceFace`/`lightActorLayer`.
5. Gradient caches are dropped whenever the camera, view size or layer scale changes. That
   costs a few gradient rebuilds on a zone jump or zoom, which is the intended trade.
6. Warden status is unchanged from the previous delivery: largest-component isolation,
   in-cell packing, foot-anchor `sizeOk` bounds, and `wardenDiagnostics()` reporting all
   eight frames — 8/8 still needs root's actual-browser confirmation.
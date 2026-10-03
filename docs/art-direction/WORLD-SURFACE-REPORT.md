# WORLD-SURFACE-REPORT — photopixel materials (OpenCode)

Owned: **NEW `src/world-art.js`** plus texture call sites in `src/neon-architecture.js`,
`src/street.js`, `src/interiors.js`. Renderer, lighting, actors and the lab are Kilo's and were
not touched. No layout, collision, save or mechanic changes.

## Shared exports (Kilo imports these)

```js
import { preloadWorldArt, onWorldArtReady, worldArtStatus,
         paintMaterial, drawPaintedPanorama, MATERIALS } from './world-art.js';

await preloadWorldArt();   // resolves only when BOTH images are terminal
                            // (loaded / error / unsupported), never an interim status
onWorldArtReady(status => …);   // fires once, returns unsubscribe
worldArtStatus();               // { settled, ready, panorama, atlas{…}, pan{…}, materials }
paintMaterial(c, kind, x, y, w, h, { alpha, seed, scale, bevel });
drawPaintedPanorama(c, game, width, height);
```
`kind` accepts an index or `brick, plaster, metal, corrugated, wood, pavement, glass, foundation`
(aliases: concrete/gunmetal/freight/planks/asphalt/road/rubble). Both entry points return
`false` while art is pending, so callers keep their existing visuals — startup and retry stay
usable with missing art.

## What was applied (existing geometry only)

* **Facades** — `masonry()` in `neon-architecture.js` is the shared wall painter for the whole city,
  so one call site textures every building: brick→brick, panel→metal, corrugated→corrugated,
  render/tile→plaster, lath→wood, buttress→foundation. Existing flat fills, trim, string courses,
  balconies, signs, awnings and district colour personality are untouched; the atlas is a surface
  pass over them at α≈0.56 plus a bevel, so walls gain painted roughness and edge wear instead of
  becoming one uniform texture.
* **Shop interiors** — `shell()` in `street.js`: plaster back wall, boarded floor strip.
* **All three rooms** — `drawInterior()` in `interiors.js`, full wall **and** floor coverage:
  watch-house/barracks → metal wall + pavement floor, diner → brick wall + wood floor,
  hangout/club → wood wall + wood floor (themes are `diner`/`barracks`/`hangout`; the earlier
  unreachable `clinic` check is gone).

## Implementation notes

* **Tile cache**: one cropped canvas per (material, world size, variant), built once at load.
  `scale` genuinely changes material size — the repeat is quantised to 32/48/64/96/128 world px,
  so different walls/props can carry believable sizes. Atlas cells are inset 2px to drop the baked
  black gutter that would otherwise repeat.
* **Full coverage, no mirrored half-panels**: the pattern phase is world-aligned and seeded, then
  the fill rect is computed to cover the clipped target *exactly* in that shifted space. The
  context is never mirrored (an earlier mirrored fill left wide panels half-painted); variation
  comes from a seeded phase plus a 180°-rotated cached tile variant.
* **No per-frame image reads** and no screen-wide noise overlay; textures are applied to world
  geometry, at low α, before lighting so neon contrast survives.
* **Panorama**: far background only, horizontally wrapping parallax at 0.22×, seated on the
  horizon with a light atmospheric veil so heroes stay legible. Existing landmarks and city
  architecture draw over it.

## Integration requests (Kilo)

1. Compose `preloadWorldArt()` into startup/loading next to `preloadSprites()`; both are
   idempotent and Node-safe.
2. Call `drawPaintedPanorama(c, game, width, height)` as the first background pass, before
   existing city architecture; parallax factors are single constants if you want to tune them.
3. Renderer-owned surfaces (platforms, cargo, foreground steel) can call `paintMaterial` directly;
   keep it before the HUD and before neon lighting.

## Known limitations

* Materials are tiled surfaces, not unique painted panels: very large blank walls will show
  repeat at α≈0.5. Variation comes from per-address seeds and the two tile variants.
* The interior materials cover the back wall and floor bands; side walls use the existing fills.
* Load-time analysis is one-off per sheet; a blocked canvas read degrades to `false` (no texture).

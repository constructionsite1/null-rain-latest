# Actual first-screen review — final corrections

Fresh debug tab5 is running Gunslinger,360logical view. No fresh browser errors. New wall brick texture visible; local cyan light affects painted residents and hero. However the large safehouse wall/shutter and street foundation remain visibly FLAT/vector, dominating this screen. User likes city layout but wants realistic photopixel rendering: texture those EXISTING surfaces rather than change their shape. Neon bloom core/labels preserved after last fix.

## Kilo final corrections
- Foreground actor layer renders at1 source pixel per logical world pixel then main canvas upscales it, noticeably blurring the detailed sprites compared to the previous direct draw. Render layer at physical scene scale (or2x bounded oversampling) and composite to same logical rectangle. Preserve internal camera transform and per-light masks. Crisp detailed photopixel character edges, not fuzzy stretched low-res.
- Texture renderer-owned safehouse/shop wall, shutter/door/glass, decorative towerwalls, and SPECIAL wide street platform/foundation branch that currently returns before generic slab texture. Wet pavement and rough underpass concrete should visibly match new painterly materials while geometry/labels stay intact. Do not change layout or gameplay.
- groundBelow excludes a platform exactly at source bottom (top<y+24). Storefront source bottom is2140, so current pool falls to2340 below playable street. Anchor source-connected reflections/illumination on actual2140pavement. Shop emitter should be its sign/window, not an imaginary whole-building-height neon face. Keep source cores narrow.
- Cached CanvasGradients retain creation transform; invalidate/recreate on camera/zoom or use local light sprites. Verify zoom and zone camera jump, no light pinned to screen.
- Composite lit characters before bullets/slashes/hit sparks so foreground effects aren't hidden by bodies. Retain contacts, HUD sharpness, interiors and8/8Warden.

## OpenCode final motion corrections
- Current breathing shift depends on LIVE t even for ghost draws. Capture the actual breathing/weight transform in the sprite descriptor and replay it verbatim for ghosts; no time-dependent changes in frozen history.
- Distance-driven gait helps. Add restrained eased visual pose transitions if practical (<=50ms for locomotion/aim changes, no parry/attack input delay). Keep foot placement stable and don't stretch silhouettes. If drawing previous+current frame briefly, exact blend weights and both source descriptors must be frozen in echoes. No double bodies beyond brief transition.
- The literal half-sector frame bias only changes frame selection phase, not smoothing by itself. Explain actual improvement honestly in report. Preserve repaired supplement own-reference scale and civilian role art.

Finish reports/checks once, root reviews actual game/interiors/lab after delivery.

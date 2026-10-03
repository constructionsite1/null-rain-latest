# Combat presentation delivery — camera, lab, painted integration, effects

> Superseded in part by `WORLD-LIGHTING-REPORT.md` (source-connected neon, foreground
> character lighting, material surfaces, world-art preload). Everything below still stands;
> the lighting pass now runs inside `render()` after the character layer.

Role: Kilo (presentation / camera / effects). Owned files touched: `src/renderer.js`,
`src/actors.js`, new `src/combat-presentation.js`, new `src/warden-sprites.js`,
`animation-lab.html`, new `src/animation-lab.js`, and the authorised narrow
`src/main.js` camera/loading slice. Not touched: `human-actors.js`, `character-rig.js`,
`sprite-actors.js`, `game.js`, `index.html`, `style.css`, interiors, tests, `.qa/`.

## 1. Camera and framing (`src/main.js`)

- Logical view height is now zoom-driven: `VIEW.h = 440` default (inside the requested
  420–480 band), `min 320 / max 640 / step 40`. Logical width still derives from the
  window aspect, so every window shape keeps the same vertical framing.
- Zoom keys: `-` / `=` (also `[` `]`, numpad). Persisted in the existing
  `null-rain-settings-v1` blob — **no game-save format change**.
- One camera rule for everything: `desiredCamera()` / `frameCamera()` are now used by
  start, retry, the room event, `resize()` and the follow lerp, so nothing can reframe
  from a stale logical size. Previously start/retry/QA-teleport each had their own
  hardcoded basis and `resize()` never reframed at all.
- Preserved: world-pixel physics, hitboxes, `mouse.world(camera)` cursor projection
  (aim.js derives its projection from the same logical size, so aiming tracks the new
  zoom with no change), room entry/exit, retry, HUD (DOM, untouched), title pan.
- Follow lerp look-ahead is now `min(90, logicalW*.11)` world px so it does not dominate
  the narrower frame.

## 2. Animation lab (`animation-lab.html`, `src/animation-lab.js`)

Fixed the director-confirmed defect: placement used to translate by *unscaled* actor
coordinates and *then* scale, so feet spilled below the panels and travelling actors
drifted out of their cells. Order is now anchor → scale → cancel actor offset, and every
cell clips to its own rectangle:

```
c.translate(cellCentreX, groundY); c.scale(s, s); c.translate(-(a.x + w/2), -(a.y + h));
```

Scale is per actor height (`min(2.8, (cellH-74)/(actorH+10))`), so the 86px Warden and
the 26px drone both fit their panels instead of sharing one factor. Per-stage actors keep
their own rig memory, so idle / walk / run / dash are genuinely different states. One
persistent actor per stage, one frame clock, and the stage scripts only mutate their own
synthetic actor.

Also: fixed the interrupted global replace (`let CLOCK.dt = CLOCK.CLOCK.dt` and
`const CLOCK = { CLOCK.dt: 0 }` were invalid — the file could not even parse), removed the
technical module names from the user-facing header/footer, and added an `ART READY`
badge that resolves through the same `preloadArt()` the game uses.

Cells: idle, walk, run, dash, jump, crouch, climb, strike 1/2/3, parry, fire, reload,
hit, death, **run-fire, air-fire, crouch-fire, cylinder reload, sidearm, magazine reload**,
Warden patrol / windup / charge / phase 2, drone patrol / scan / burst, Helix guard, Helix
heavy, resident, plus a wide bay running the real dash → time-fracture → blink echo cycle.
Controls: pause, reset, single step, build switch (buttons or 1–4).

**Supplement showcase.** The new painted action poses are driven through the real human
renderer by state only — the lab never chooses art itself. Run-fire (`vx` + `attackTimer`
with `lastAttackKind:'pulse'`), air-fire (`grounded:false` + firing), crouch-fire
(`crouching` + firing), the four-stage cylinder reload (`reloadTimer` over a 2.2s
`reloadDuration`, `reloadWeapon:'pulse'`), Chronoblade sidearm (a cell that walks the four
painted contexts — standing, running, crouch, airborne — while firing), magazine reload and
the two climb reaches (alternating `ldir` and `vx`). Those six cells are pinned to their own
identity (`fixed:'gun'` / `fixed:'blade'`) and tinted with that character's accent, so the
showcase shows the Gunslinger and Chronoblade action art regardless of which character is
selected in the header; the header switch still drives every non-pinned cell.

## 3. Frozen painted sprite bridge (`src/combat-presentation.js`)

The echo system no longer re-solves a pose. At capture time it stores:

- the rig's published gait snapshot (own object, copied), and
- `spriteFrameSnapshot(player, t)` from `sprite-actors.js`, **copied** into a fresh
  `{sprite, face}` record.

At draw time `applyPose()` writes that record into the private copy actor's render
memory, so `drawSpriteHuman` replays the exact painted frame and facing that was on
screen. Copies are tinted through a 168px offscreen pad (`source-atop` gradient, two or
three additive passes) so a painted figure becomes a green/red ghost without a second
character pipeline. If the sprite contract is missing the bridge degrades to the rig
snapshot and then to plain silhouettes; no path throws.

Emission is bounded (max 6 copies + 2 blink streaks), distance-spaced (21px dash / 31px
fracture), emitted only while travelling, and the whole history is dropped on teleport
(blink keeps one streak between the two real positions), restart, world/interior change
and a paused or reversed clock. Rendering mutates nothing — verified below. Echo accents
follow the painted reference identities: Chronoblade green, **Gunslinger red**
(`#ffe2dc` core / `#e2453f` mid / `#6b1a16` edge — the old amber palette was wrong for the
red-lined duster and red-lit revolver), Netrunner violet and Breaker amber.

## 4. Painted Warden (`src/warden-sprites.js` + `src/actors.js`)

`assets/characters/warden-painted-v1.png` (1774×887 → 4×2 cells of 443.5²) is read as a
transparent 8-pose atlas: 0 idle, 1 strideA, 2 strideB, 3 cleaverWindup, 4 lowCharge,
5 cleaverSweep, 6 stagger, 7 rage.

**Renderer defects found in root review and fixed in this pass:**

1. **Painted RGB preserved.** The repack copied alpha-white (255,255,255), which bleached
   every texture. The repack now copies the source `data[q..q+2]` verbatim and masks only
   the alpha channel with the isolated figure label, so painted materials, shading and the
   red powered joints survive.
2. **Local crop anchors.** `f.cx`/`f.foot` are absolute source pixels, and the repack was
   subtracting them as if they were local — that pushed crops off their cells and made
   frames disappear. Placement now uses `localCx = f.cx - f.x` and
   `localFoot = f.foot - f.y`; the normalised anchors are `ax = localCx/f.w`,
   `ay = localFoot/f.h`. Because `cellW = maxW+4` and `cellH = maxH+6`, the crop always
   fits inside its cell, so the per-cell clip was removed entirely — nothing is erased.
3. **Inverse scale.** The draw path multiplied by `refPx/WORLD_H`, i.e. it used
   *pixels-per-world-unit* where a *destination* factor was required, which produced a boss
   thousands of pixels tall. The sheet now stores one constant
   `unitsPerPixel = WORLD_H / refPx` (86 world pixels per standing source pixel) and the
   destination is `dw = fig.sw * unitsPerPixel`, `dh = fig.sh * unitsPerPixel`. The standing
   pose measures exactly 86 world pixels; every other pose keeps its own measured foot line,
   so a wind-up or low charge is not renormalised into an upright rectangle.
   `bodyPx` for the scale reference is measured from **solid** pixels only, so the soft glow
   halo cannot inflate the standing height.
4. **Largest connected component, not the first strongest pixel.** `isolate()` seeded from the
   first maximum-alpha pixel in the cell, so a detached speck or a bright cleaver tip could
   become the entire "actor" — which is why charge (cleaverSweep) and phase 2 could render as
   nothing but the red core glow. Isolation now labels **every** solid component in the cell,
   keeps the **largest by pixel count** as the body, absorbs components whose bounding box
   touches it within 6px (a held cleaver is not a second actor) while refusing any speck over
   a third of the body, then runs the bounded soft-glow pass from that body only.
5. **Scale reference hardened.** `refPx` still comes from the standing pose, but if that pose
   measures as a fragment — outside 0.6×–1.6× the median body height across all eight poses —
   the median is used instead and `refSource` reports `median` instead of `standing`, so one
   bad frame can no longer inflate or shrink the whole boss.
6. **Packing is wholly in-cell.** Each crop is centred in its own cell
   (`i*cellW + round((cellW-f.w)/2)`), which guarantees `srcInBounds` for every pose by
   construction. Anchors only affect destination placement, because `ax`/`ay` are normalised
   against the crop itself. The anchor subtraction that produced negative source x for
   forward-leaning poses is gone.
7. **Corrected `sizeOk` bound.** The old check required `abs(-dh*ay) < WORLD_H*.5`, but a
   correct standing body anchored at its foot has `dh*ay` around 86 — so healthy frames were
   being reported invalid (hence 3/8). `sizeOk`/`anchorOk` now express what a full body
   anchored at its foot actually looks like: the anchor lies inside its crop
   (`ax, ay ∈ [0,1]`), the destination is positive, and the drawn height stays within two
   actor heights. The draw guard uses the identical bounds, so the audit and the renderer can
   never disagree. `8/8` is reported only when every frame has a present figure, valid source
   bounds, a sane destination and real visible alpha.
8. **Defects are reported, not skipped.** `noteDefect()` records isolation failures *and*
   draw-guard rejections (`no-figure`, `src-bounds`, `dst-size`, `anchor`, `bad-scale`), logs
   them once via `console.warn`, and surfaces them in `wardenDiagnostics().guardRejects` plus
   the lab header (`n/8 BOSS FRAMES · <pose names> · guard <count>`). The boss shows the
   standing frame meanwhile rather than disappearing.
9. **Painted path is exclusive once the atlas is measured.** `actors.js` calls the painted
   body first and returns; the geometric body is only reachable while the sheet is unmeasured
   or failed, and is never drawn on top of the painted figure.

In-browser audit: the lab header shows `n/8 BOSS FRAMES`, names any bad pose and flags guard
rejections; `wardenDiagnostics()` returns the full rows (`bodyPx`, `bodyWorldPx`, `solidPx`,
`maxAlpha`, `alphaOk`, source rect, `srcInBounds`, destination, `anchorOk`, `sizeOk`).

Lab showcase also switched to the definitive reference identity: the Gunslinger accent is red
(`#e2453f`) and its showcase weapon is `pistol`, the same name the real HUD uses.

Other Warden properties: standalone Node-safe loader (`preloadWarden()`, `wardenStatus()`,
`injectWarden()`) composed into `preloadArt()`; same isolation approach as the human atlases
(solid-core flood fill plus a bounded soft-glow pass per nominal cell, then a clean repack);
poses derived only from existing boss fields (`telegraph`, `charge`, `cooldown`, `phase`,
`stun`, `flash`, `dead`, `hp`) so `w/h`, hitboxes, attacks, phases, telegraph timings, boss
bar and status labels are untouched; a restrained local additive powered-core glow that
swells through the wind-up and an additive hit bloom that never repaints the figure.

Drones were also rebuilt as compact surveillance machines: ducted rotors with spinning
blades and blur discs, a gimballed lens that tracks `e.aim` with a short scan cone, whip
antenna and district livery (`w/h` 38/26 unchanged).

## 5. Local effects (`src/renderer.js`, `src/combat-presentation.js`)

All existing effect records are still the source of truth; the painters are new:

- **slash** — crescent sweep: deep body / mid / hot leading edge, restrained bloom, speed
  lines, tip sparks. The authored cyan `#8afff0` reads as Chronoblade green for the blade
  build and stays cyan for everyone else.
- **ring** — small radii (`<=20`) become muzzle/point flashes (hot core + radial spikes);
  `>=22` in `#fff7c4` become the parry flash (crescent + deflect sparks); everything else
  stays a clean expanding ring.
- **noise / explosion** — hot core, ragged crack ring, shards, layered shockwave.
- **beam** — additive core with a travelling head spark.
- **text** — shadowed float; a `HEADSHOT` label gets its own impact burst.
- **sparks** — particles now draw as short velocity-aligned streaks with a hot core.
- **hit response** — enemies get an additive bloom from the existing `e.flash` timer.
- **time fracture** — corner-weighted green vignette, sliced edge bands, drifting
  temporal streaks. No full-screen wash and no strong flashing: the middle of the frame
  stays clean so painted art, shots and hazards keep full contrast.

`render(c,s,width,height)`, `renderDossier`, `renderPortrait`, `drawActor`, `drawCivilian`,
`drawHuman`/`drawResident` re-exports and the neutral/hostile, health and territorial
labels are all unchanged. Freight containers keep their geometry and gain vertical seams,
a lit extraction vent or a dead Helix neon tag, so the yard keeps its district personality.

## 6. Loading integration

`preloadArt()` (re-exported from `renderer.js`) awaits the human atlases and the Warden
atlas, never rejects, and resolves immediately when art is unavailable. `main.js` holds
`#loading` until it settles, re-renders the title portraits once art is ready, and defers
`start()` by one promise if the player deploys first. No gameplay waits on art.

## 7. Verification

- `node --check` clean: actors, renderer, combat-presentation, warden-sprites, main,
  animation-lab, sprite-actors.
- **Real module import graph** (not syntax alone): `import('./src/renderer.js')` pulls
  actors → human-actors → character-rig, sprite-actors and warden-sprites with no link
  error; `renderer` exports `preloadArt, render, renderDossier, renderPortrait`;
  `actors` exports `drawActor, drawCivilian, drawHuman, drawPortrait, drawResident`;
  `preloadArt()` resolved in 1–5 ms with both parts and every name `main.js` imports from
  `game/audio/world/hints/aim/dialogue/territories/renderer` resolves. Both sprite systems
  reach a terminal state in Node (`unsupported`/`settled`), i.e. a missing DOM never hangs
  or throws.
- Warden pose mapping probed in Node against real boss fields: `telegraph .5 → 4 lowCharge`,
  `charge → 5 cleaverSweep`, `phase 2 → 7 rage` — the three poses that rendered blank before.
- `npm test` → **62 pass / 0 fail** (geometry, hitboxes, routes, security, territories,
  interiors, combat). Save formats untouched.
- A temporary Node-only Canvas mock (since removed, no mock tooling left in the tree)
  confirmed: 24 frames of dash + fracture render without throwing, `save`/`restore`
  balanced 13373/13373, **rendering mutates no simulation object**, paused and
  re-rooted players clear the echo history, all eight Warden phases and four drone states
  draw, every effect painter plus the fracture overlay and dossier run, blink between two
  world positions draws, the live rig publishes real gait (`sp=540, u=0.946`) while an
  unseeded copy actor reads an empty snapshot — which is exactly the defect the frozen
  snapshot bridge fixes.
- Atlas dimensions read from the real PNG headers: gunslinger 1448×1086 (4×3),
  chronoblade 1448×1086 (4×3), enemies 1254×1254 (4×4), movement 1254×1254 (4×4),
  warden 1774×887 (4×2).

**No browser automation was run, so none of this is visual sign-off.** In particular the
five Warden fixes above are verified by construction and by the guards themselves, not by
looking at the boss: the RGB copy, the local-anchor arithmetic, the inverse factor and the
per-frame `srcInBounds`/`sizeOk` rows are produced by code that only runs against a real
decoded atlas in a browser.

## 8. Limitations and review asks

1. Browser QA is required: painted humans, the eight painted Warden frames (read
   `wardenDiagnostics()` or the lab's `n/8 BOSS FRAMES` line — charge/cleaverSweep is the
   concrete blocker root will re-check), echo frames during dash/fracture, camera framing at
   1280×720, interiors at the new zoom.
2. The supplement poses (run/air/crouch fire, staged cylinder reload, climb reaches,
   sidearm, magazine reload) are exercised in the lab by driving actor state only. Whether a
   given cell shows the intended painted frame depends on `sprite-actors.js` selecting it
   from that state — that mapping is OpenCode's, so if a cell still shows the wrong frame the
   state contract, not the lab, is what needs adjusting.
2. The same `refPx/WORLD_H` inversion was confirmed by root in the human pipeline; that
   role owns `sprite-actors.js`, so it is untouched here and my echo bridge simply consumes
   whatever frame/facing it publishes.
3. Interiors were authored against a 720-tall view; at 440 they show roughly half the room
   width. Geometry and collision are unchanged, but a pass over the three rooms plus the
   street yards is worth doing before sign-off.
4. The Warden atlas is 8 poses for 3 boss states plus idle/stride/stagger/rage; there is
   no distinct low-charge-to-sweep transition frame, so the charge reads as a pose swap.
5. If the atlas 404s in the shipped build the boss falls back to the old geometric body —
   a deliberate director decision, not a silent default.
6. Zoom keys (`-`/`=`) are new input; nothing else in the game used them.
7. No integration request for other roles. `sprite-actors.js` exports were used exactly as
   published (`preloadSprites`, `spriteStatus`, `spriteFrameSnapshot`); if that contract
   changes name, the echo bridge falls back to the rig snapshot instead of breaking. The
   human pipeline's own scale/family-row corrections are theirs; nothing here depends on the
   old inverted factor.
8. Confirmed by root: the new `actions-painted-v1.png` and `civilians-painted-v1.png` do have
   transparent corners, and painted RGB is retained verbatim in the Warden repack — the
   repack only ever masks alpha with the isolated figure label.
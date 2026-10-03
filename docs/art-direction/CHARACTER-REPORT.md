# CHARACTER-REPORT — painted humans (OpenCode)

Owned: `src/human-actors.js`, `src/character-rig.js`, `src/sprite-actors.js`, this report.
No Kilo-owned file touched. `drawHuman` / `drawResident` signatures and hitboxes unchanged.

## Visible art

Heroes, villains and residents are drawn from the painted atlases in `assets/characters/`.
The procedural rig in `character-rig.js` remains only as the pre-load / missing-art fallback.

| type | painted identity | frames |
|---|---|---|
| player `gun` | gunslinger (red-lined duster, revolver) | idle, 8-frame run, jump, dash, crouchAim, aimFwd/Up/Down, reload, hurt |
| player `blade` | chronoblade (near-black, green implants) | idle, 8-frame run, jump, dash, crouch, parry, windup + 3 cuts |
| player `ghost` | enemies row 2 (tech, cyan) | idle, walkA/B, aim |
| player `tank` | enemies row 3 (heavy) | idle, walkA/B, aim |
| `guard`/`sniper`/`heavy`/`gang` | enemies rows 1/2/3/0 | idle, walkA/B, aim |
| residents | civilians rows vendor/courier/commuter/resident | idle, walkA/B, startled |

Supplemental `actions-painted-v1` (16 frames) covers states the main sheets cannot:
gunslinger **run-fire L/R** (alternating feet while shooting), **air-fire**, **crouch-fire**,
**4-stage cylinder reload** (open→eject→insert→close); chronoblade **standing/running/crouch/air
sidearm**, **magazine reload**, **climb reach L/R**, **hurt**. Climb reaches are drawn as painted
(no forced horizontal orientation). Staged reload advances on `reloadTimer/reloadDuration`;
steep aim-up/down keeps the vertical aim art instead of the run-fire frame, so the cursor
direction survives in both facings. Attacks, parry and reload stay immediate — no input delay.

## Scale and anchor model

`unitsPerPixel = WORLD_H / refPx`, i.e. **world units per source pixel** (never the inverse):
* Heroes/enemies: one constant scale per family from the standing reference, so crouch/dash/lunge
  compress naturally (gunslinger idle 54u, dash 33u; chronoblade idle 54u, windup 56u).
* Enemy families each use **their own row's** standing reference, not row 0.
* Supplemental sheet: each block derives its scale from **its own upright frame** —
  gun block = reload-open (251px → 0.215 u/px), chronoblade block = sidearm-idle (249px → 0.217).
  Measured: reload-open 54.4u, run-fire 54.4/51.2u, air-fire 48.4u, crouch-fire 35.5u — no shrink
  to ~39u, and compression is retained.
* Movement sheet: units inherited from the matched hero sheet scaled by that sheet's own run-frame
  mean, so the 8-frame cycle matches the main sheet's run size instead of shrinking ~15%.
* Foot line = lowest solid-alpha row; horizontal anchor = alpha centroid of the upper body
  (torso), both **crop-local**. One frozen descriptor carries `units` and `phase`.

Load-time figure isolation (RGB preserved, only alpha masked): cell-restricted largest
solid-component cores, then one global nearest-core overflow expansion for the sword/coat bleed
the painter left, repacked into uniform clean cells. 2px inset drops the baked gutter.

## Motion smoothing (final)

* **Distance-driven stride**: one stride length drives both the gait phase and the leg geometry.
  Measured residual foot slip per stride: **0.22px at 72 px/s, 0.35px at 115 px/s, 0.88px at
  290 px/s** (an earlier draft of this report claimed ≤0.35px at all speeds, which was wrong for
  run speed). Before this change slip reached ~17px per stride at 290 px/s.
* **Breathing is captured, not recomputed**: the sub-pixel bob (≤0.34px) and foot-pivot rotation
  (≤0.009 rad) are computed **once on the live pass** and stored inside the frame descriptor
  (`bobY`, `rot`). Draw time applies only what the descriptor carries, so a ghost can never pick
  up the live clock — this was a real bug caught in browser review, where frozen echoes still
  breathed. Never a scale change, so anchors stay planted and nothing stretches.
* **Restrained eased frame transitions**: locomotion and aim changes cross-fade for at most
  **50ms** (`BLEND_MS`), drawing the previous and current cell at complementary alpha from the
  same foot anchor. Committed actions (`snap: true`) — katana windup/cuts, parry, dash, all
  supplemental fire/reload/climb/sidearm frames and any frame with a recoil kick — swap
  immediately, so there is **no attack or parry latency and no input delay**. Blending is skipped
  across sheets so a mixed half-state can never appear.
* **Frozen history is complete**: the echo descriptor carries `{set, index, name, units, phase,
  bobY, rot, kick, tilt, snap, face, blend, prevSprite}`. `SNAP_KEYS` now includes `prevSprite`
  and `blend`, so `seedClone` reproduces **both** source frames and the exact blend weight. Ghost
  draws never advance memory, so a frozen echo stays frozen.
* **Honest note on the frame bias**: the half-sector dwell bias is a *frame-selection phase*
  change — it decides which painted frame is held longest around its nominal pose. It reduces
  strobing between silhouettes but is **not smoothing by itself**. The actual smoothing comes from
  the distance-driven stride (foot slip eliminated), the captured-transform fix, and the 50ms
  eased transition above.


## Integration contract (unchanged names)

```js
preloadSprites() / onSpritesReady(cb) / spriteStatus() / spriteManifest()
currentFrame(kind, e, t, opts) / injectSheet(id, img)     // sprite-actors.js
SNAP_KEYS, seedClone(clone, snap, t), rigMemory(e,t,true), isDown(e)  // character-rig.js
```
`SNAP_KEYS` includes `sprite`, `face`, `atkOn`, `landVy`, `pose`. Kilo: call `preloadSprites()`
once at boot; historical copies should go through `seedClone`.

## Verification

Checked against **real decoded atlas pixels** through the real `measureSheet`/`pickFrame`/draw path
(all six atlases measured: 12/12/16/16/16/16 figures isolated, units-per-pixel 0.142–0.226):
* 15 state descriptors audited for sheet, index, `snap`, transition id and destination size —
  committed actions (fire, reload, dash, hurt, cut, parry, climb, sidearm) all report
  `snap: true`; locomotion/aim report `snap: false` and are allowed to ease.
* A gait frame change produces a **distinct** transition id (movement sheet cells differ), so run
  frames actually blend instead of silently swapping.
* 40 live draw frames produced 39 real transitions, **0 recursive** `prevSprite` chains, captured
  `bobY`/`rot` present on every frame, and canvas `globalAlpha` restored after blended draws.
* Destination heights stay in a believable band (idle ~54u, dash 33u, crouch-fire ~36u).

## Known limitations

* Frame budget is the painter's: heroes 12, enemies 4/family, run 8/hero, actions 16, civilians 4.
  Enemy dash/air/crouch reuse the `aim` frame (only the player Breaker/Netrunner reach those).
* Weapon rotation is impossible with baked art — aim is expressed by frame choice plus a small
  whole-body kick.
* Repack is a one-off ~1.5M px analysis per sheet at load; blocked canvas reads fall back to raw
  padded crops.
* Cadence timing is rig-driven, so painted frames may run slightly off the painter's intended
  timing; per-atlas timing constants are the next lever.

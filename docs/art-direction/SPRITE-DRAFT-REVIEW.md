# Director sprite draft acceptance warnings

Actual images READY; read PAINTED-ASSETS-READY.md and inspect them. Your first sprite-actors draft has confirmed structural problems to fix before delivery:
1. SHEETS.enemies has duplicate rows key: numeric rows4 is overwritten by ['punk','corp','tech','heavy']; grid division/loop breaks. Rename family list to rowNames, keep numeric rows.
2. Alpha-trimming then scaling EVERY frame to actor height makes crouch/dash/jump body as tall as idle. Preserve one pixels-per-world-unit scale from standing reference/body height for each atlas family, then each pose naturally compresses. Foot anchors per-frame (not half bounding box for sword/sweepingcoat) must align actual body to hitbox/ground.
3. Sprite padding is approximate; blade weapons cross nominal cells. Avoid cut-off swords or neighboring frame limbs by inspect actual crops/custom source rectangles if needed.
4. A fourth movement atlas is being generated, assets/characters/movement-painted-v1.png:4cols x4rows, top8 frames Gunslinger run cycle, bottom8 Chronoblade run. Use when ready for genuine alternate-foot motion, not static idle or only3 similar running silhouettes. Preserve constant scale/foot anchoring.
5. Ensure gun reload/aim/movement combines visibly; avoid taking a running frame with lowered gun and painting a floating second gun. Direction cursor both faces and actual projectile origin should agree visually. Moderate normal actor size through Kilo camera, not inflated visual outside collision body.
6. Final report must publish frozen sprite frame + facing + pose metadata contract and preload hooks. Kilo owns main/camera/loading/effects and is reading your module.

User latest: very close to references, only here-and-there differences. Painted artwork is the target, procedural draft rejected. Do not declare done from numeric tests.

7. CRITICAL confirmed screenshot: EVERY hero pose renders idle. pickFrame uses if(def.rows) for enemy family branch, but ALL sheets have numeric rows! Only enemy rowNames should trigger enemy branch (or sheetID). Hero frame lookup uses sh.cells[fr.row][fr.index] but index is flat0..11, so must derive source row=floor(index/cols), column=index%cols for heroes. Enemy family index stays rowNames+0..3. Fix both.

Fourth movement atlas IS NOW READY in project.

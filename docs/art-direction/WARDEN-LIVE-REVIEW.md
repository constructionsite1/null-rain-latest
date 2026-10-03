# Real browser review after previous repairs

Final audit correction: validate.sizeOk currently requires abs(-dh*ay)<WORLD_H*.5. A correct standing sprite anchored at its feet has dh*ay about86, not less43. This marks healthy frames invalid. Use a bound appropriate to a full body anchored at its foot (within roughly two actor heights), matching actual draw guard. Report8/8 only for genuinely valid visible frames. Fix the strongest-component selection if pixel-alpha probe finds tiny isolated bodies. Also lab build gun accent should be RED and gun primary weapon 'pistol' in showcase, consistent with definitive reference/revolver and real HUD. These are presentation-only changes.

Fresh animation-lab reload: painted patrol, windup, rage now visible. CHARGE still disappears at frame 1019: only red glow/shadow/healthbar remains. This is a concrete blocker, not accepted by syntax checks.

Inspect isolate(): it takes FIRST strongest alpha pixel, not LARGEST connected solid component. A disconnected fragment can become the entire actor. Current repack sx uses `(cellW-f.w)/2-localCx` which can be negative for first column; draw guard then skips it. Correct packing should place the bounding crop wholly within its cell, independently of anchor. Anchors affect destination placement ONLY. Ensure all eight source rectangles are valid and each retains the main human body, including poses 4/5 in lower row. Use strongest COMPONENT, not arbitrary first pixel. Root will review actual charge after delivery.

New supplement and civilian PNGs DO have transparent corners. Root sampled alpha: actions corner0/10686 transparent samples; civilians corner0/13055 transparent samples. Retain painted RGB.

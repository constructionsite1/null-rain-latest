# Remaining painted renderer acceptance defects

Director actual/code review after RGB/local-anchor repairs:
- HUMAN scale is inverted. sh.scale currently refPx / WORLD_H (~6 originalpx/worldunit), but blitFigure MULTIPLIES sourcewidth by this, producing thousands-of-world-pixels figures! Canvas draw destination scale must be WORLD_H / refPx. Pick a clear convention: pixelsPerUnit vs unitsPerPixel. Movement fam.scale similarly should be world/source, not source/world. Frame standing destination body height must equal actor h54 (plus limited outfit overhang), not 54*36. Assert actual drawImage destination sizes numerically. Don't only check syntax.
- Enemy dispatch after flat hero fix ignores id.row, using floor(i/cols), which is0 for every enemy0..3frame. Corp/tech/heavy all become punk. Source row for enemy rowNames is id.row; heroesfloor(flatIndex/cols). Columnenemyindex or heromodulo. Eachfamily needs standing reference scale consistent with own row (not row0punk for all). Other player builds preserve cyan tech/heavy identity.

Kilo copied your OLD broken repack algorithm into warden-sprites.js: it sets RGBwhite, global f.cx/foot placement and invertedscale. These are Kilo-owned repairs. Root sends same defect notes there. OpenCode must repair HUMANS only.

After fixes, publish CHARACTER-REPORT.md then finish; root reloads actual browser. Rendered size/colored artwork/family selection are mandatory gates. Preserve frame metadata and actual corpse/reload/pose snapshots. No repeated custom tooling.

# Warden actual renderer defects to fix promptly

Root code review: warden-sprites.js copied the prior broken human repack pipeline. Correct these BEFORE reporting painted boss complete:
1. img.data RGB currently255white. Preserve source data RGB at p*4..+2; only mask alpha by isolated figure label. Painted realistic textures must remain.
2. f.cx/f.foot absolute source coordinates; repack dx/dy must use local crop anchors (f.cx-f.x),(f.foot-f.y). Normalized ax=localCx/f.w, ay=localFoot/f.h. Source rectangle is actual destination croporigin, within clean canvas. Do not erase/clip most cells.
3. sheet.scale=refPx/WORLD_H is pixels/worldunit; drawImage destination factor must INVERSE= WORLD_H/refPx. Current multiply makes painted boss several thousand pixels tall! Use clear unitsPerPixel. One constant scale for all8poses; body standing at actor86worldheight. Assert actual destination sizes. Real materials should remain colored.
4. Actorwrapper must actually call painted path before oldgeometric. Root will reject geometryfallback when assetready. All8frames nonempty, no neighboringparts.
5. Fresh browser main error missingrendererpreloadArt export was fixed in your latest patch. Lab previousCLOCK.CLOCK errors fixed, validate fresh load through module import graph not syntax alone. Main preload must resolve after masksready.

Human role receives same scale/familyrow corrections. Don'tedititsfiles. Finish Warden, bridge and maincamera/report. Rootbrowserreview next. No mocks/broadtooling.

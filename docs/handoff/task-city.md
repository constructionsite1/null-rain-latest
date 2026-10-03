# Task: more intricate city & neighborhoods (renderer)
Profile: visual
## Files
src/renderer.js ONLY.
## Goal
Make the city feel denser and more intricate: multiple procedural parallax layers of distinct neighborhoods per x-region of the 7200-wide level (e.g. market district with stalls/awnings/hanging lanterns, residential stacks with laundry lines, AC units, balconies and lit windows, industrial zone with pipes/tanks/cranes, corporate towers with holo-billboards). Add animated details: flickering neon signs (original text, no real brands), rain streaks, steam vents, blinking antenna lights, passing hover-cars in the background, puddle reflections. Use deterministic seeded randomness (no Math.random per frame for layout) and cache static layers to offscreen canvases where possible so performance stays smooth. Don't change gameplay geometry or collision.

## Hard rules
- Project: NULL // RAIN, vanilla ES modules + Canvas 2D, no deps, no build. Read HANDOFF.md first (it is in this worktree root).
- Edit ONLY the files listed under "Files". Do not touch other files.
- Time box: finish and COMMIT within 13 minutes. Small, working, committed beats ambitious and broken.
- Run `npm test` before committing; all tests must still pass. Do not weaken tests.
- Commit with `git add -A && git commit -m "<summary>"` on the current branch. Do not push, do not merge.
- Keep code style consistent (files are compact, dense one-liners are fine).


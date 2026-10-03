# Task: neighborhood intricacy in level layout
Profile: general
## Files
src/world.js ONLY.
## Goal
Add more intricate neighborhoods to the authored level WITHOUT breaking routes: extra optional one-way platforms (balconies, fire escapes, awnings), extra ladders to rooftop nooks, more shadow zones for stealth, decorative objects (check which object types renderer already draws), and a couple of optional side alleys with a pickup reward. Do not move or remove existing platforms, gates, relays, spawns, extraction or the Warden. tests/routes.test.mjs must still pass. Add named sub-neighborhood zones if the zone system supports names.

## Hard rules
- Project: NULL // RAIN, vanilla ES modules + Canvas 2D, no deps, no build. Read HANDOFF.md first (it is in this worktree root).
- Edit ONLY the files listed under "Files". Do not touch other files.
- Time box: finish and COMMIT within 13 minutes. Small, working, committed beats ambitious and broken.
- Run `npm test` before committing; all tests must still pass. Do not weaken tests.
- Commit with `git add -A && git commit -m "<summary>"` on the current branch. Do not push, do not merge.
- Keep code style consistent (files are compact, dense one-liners are fine).

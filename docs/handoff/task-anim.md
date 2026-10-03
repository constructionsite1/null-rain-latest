# Task: character animations
Profile: visual
## Files
src/actors.js ONLY.
## Goal
Improve animations for player and enemies at gameplay scale: smoother run cycle with arm swing and body bob, anticipation/squash on jump, stretch in air, landing squash, dash afterimage/lean, distinct attack swing arcs per build (katana slash trail, arc-lightning flicker for netrunner, punch impact for brute, muzzle recoil for gunslinger), idle breathing, coat/scarf secondary motion, hit flinch, enemy alert pose and stunned stars/sparks, death collapse. Use only existing player/enemy fields described in HANDOFF.md (attackTimer, dashTimer, combo, vy, onGround etc. — read src/actors.js and src/game.js to check names). Do not change the function signatures the renderer calls.

## Hard rules
- Project: NULL // RAIN, vanilla ES modules + Canvas 2D, no deps, no build. Read HANDOFF.md first (it is in this worktree root).
- Edit ONLY the files listed under "Files". Do not touch other files.
- Time box: finish and COMMIT within 13 minutes. Small, working, committed beats ambitious and broken.
- Run `npm test` before committing; all tests must still pass. Do not weaken tests.
- Commit with `git add -A && git commit -m "<summary>"` on the current branch. Do not push, do not merge.
- Keep code style consistent (files are compact, dense one-liners are fine).

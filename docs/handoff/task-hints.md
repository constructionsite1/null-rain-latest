# Task: hints panel + tutorial option
Profile: general
## Files
src/main.js, index.html, style.css (and optionally a NEW file src/hints.js)
## Goal
1. A **Hints panel at the top-right of the HUD**, ON by default (persist toggle in the existing settings localStorage key `null-rain-settings-v1`, default true). Toggle key: **G** and a checkbox in the title/pause menu. Content depends on the chosen build (blade/ghost/tank/gun – see SKILLS export in src/game.js for real names/costs): build name, one-line playstyle, and Q / C / V ability explanations with their keys, plus 1 rotating contextual tip (e.g. near ladder, alarm raised, low health, energy low) derived from game state each frame (cheap checks only). Compact, semi-transparent, readable, must not overlap other HUD elements; collapse to a small "G: hints" tab when off.
2. A **Tutorial option** on the title screen: a "Tutorial: ON/OFF" choice (default ON) shown when starting a new game. When ON, show a step-by-step guided overlay sequence (move, jump/double jump, dash, crouch/drop, attack, aim with right mouse, abilities Q/C/V for the chosen build, interact E, decoy F, map M) — each step advances when the player performs the action (detect via input state in main.js) or presses Enter to skip step; Esc/"Skip tutorial" ends it. Persist "tutorial done" in settings so it is not forced again.
Do not change simulation logic in game.js.

## Hard rules
- Project: NULL // RAIN, vanilla ES modules + Canvas 2D, no deps, no build. Read HANDOFF.md first (it is in this worktree root).
- Edit ONLY the files listed under "Files". Do not touch other files.
- Time box: finish and COMMIT within 13 minutes. Small, working, committed beats ambitious and broken.
- Run `npm test` before committing; all tests must still pass. Do not weaken tests.
- Commit with `git add -A && git commit -m "<summary>"` on the current branch. Do not push, do not merge.
- Keep code style consistent (files are compact, dense one-liners are fine).


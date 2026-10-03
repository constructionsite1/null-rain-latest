# Task: dialogue system
Profile: general
## Files
NEW file src/dialogue.js, plus a MINIMAL hook in src/main.js (import + call update/render per frame + feed it game.events), small additions to style.css/index.html if needed (append only, keep isolated with a .dlg- class prefix).
## Goal
Add in-world story dialogue: a bottom-of-screen dialogue box with speaker name, portrait-colour tag, typewriter text, advance with Enter/E-not-needed (auto-advance after reading time, Enter to skip). Characters: a handler voice on comms ("VEX", cyan), the Warden (magenta), plus build-specific player replies (blade/ghost/tank/gun have different personalities). Trigger lines from existing Game.events types (zone, hack, lore, upgrade, levelup, ending, death, save) and on mission start. Each trigger fires once per run (track a Set). Write 30+ original, punchy cyberpunk lines; no copyrighted names. Dialogue must not pause the game and must not block input. Keep it in its own module exporting e.g. `createDialogue(root)` with `onEvent(ev, game)`, `update(dt)`.

## Hard rules
- Project: NULL // RAIN, vanilla ES modules + Canvas 2D, no deps, no build. Read HANDOFF.md first (it is in this worktree root).
- Edit ONLY the files listed under "Files". Do not touch other files.
- Time box: finish and COMMIT within 13 minutes. Small, working, committed beats ambitious and broken.
- Run `npm test` before committing; all tests must still pass. Do not weaken tests.
- Commit with `git add -A && git commit -m "<summary>"` on the current branch. Do not push, do not merge.
- Keep code style consistent (files are compact, dense one-liners are fine).

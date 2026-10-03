# Director review notes — revisit after agents finish

Do not edit implementation as director; give targeted follow-ups to the owning CLI roles. Notes below refer to an unfinished agent draft and may be repaired before delivery.

## Character rig first draft (character-rig.js)

- First-draft swing call was repaired in the rewritten rig: current call is `swing(A,ap,combo)`. Still visually check three combo strikes; no need to fix this call again.
- Draft landing detection checks prior vy < -120 at the moment grounded, whereas a normal landing follows positive downward vy. Review using grounded transitions / previous descent and confirm a visible landing absorption.
- `shootPose` currently selects ready before run/walk; inspect whether ranged actors lose their gait. Phase-two Gunslinger must walk/run AND aim/fire, not stand in a rigid gun pose while translating.
- Ghost memory is a WeakMap keyed by actor object. If Kilo's afterimage history uses cloned snapshots, those clones don't inherit the live pose memory. Need a clear render-only pose snapshot contract or equivalent so copies depict the past articulated pose, not a fresh idle memory. Check green copies while running in time fracture and jumping, not only low dash poses.
- Rewritten drawHuman maps held arc to art `ghost`, but only the `emitter` branch draws the emitter; inspect whether Arc Netrunner currently falls through to rifle art. Character-role repair if confirmed.
- Feet: authored toe rotations are near zero for a flat stance, but FK currently uses sin(toe) for toe X and -cos(toe) for toe Y. That points the boot UP at zero instead of forward along the floor. Confirm in the enlarged showcase, keep ankle above the sole, and make idle/stance soles horizontal and planted. Current numerical probe has toe Y about -7.6 while heel is near 0, which is a warning sign.

## Completed director browser checks

All three building entrances render after Kilo's local rect and mixed-call repairs: diner, restricted watch house, neutral Wire social club. No browser errors in isolated review tab. Proof assets/diner-interior-preview.png and assets/social-club-preview.png. Geometry and simulation tests pass (62); these do not prove animation correctness.

## Next stage framing

Normal 1280x720 gameplay has very small actors. Review the actual game as well as the enlarged showcase. Gunslinger brief suggests a closer logical camera with aim/cursor consistency preserved; presentation agent can be assigned narrow main.js ownership for this during phase two.

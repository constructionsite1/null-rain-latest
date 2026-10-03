# Director review of the final motion draft
Before claiming delivery, review these concrete risks in the new code:
- paintOne must isolate each frame transform with save/restore; otherwise previous frame bob/rotation carries into the current draw.
- Transition IDs must include sheet and moveKey/actual frame index. A fixed set:name for all movement frames never blends gait frame changes.
- A previous descriptor must be a shallow snapshot without prevSprite recursively retained. Otherwise rapid changes build an unbounded history chain that echo cloning serializes.
- fr.snap must actually be set by frame resolver for attack/parry/fire/reload/dash/hurt. Comments alone do not suppress blends.
- Restore canvas globalAlpha even when alpha=1. Avoid unintended translucent current image after previous draw.
- Check actual lab after load, original sprites remain correctly scaled and visible. Do not claim foot slip <=0.35px for all speeds; earlier 290-speed estimate was .88px.

Observed pickFrame currently drops st.snap from all three descriptor return paths: propagate it or action suppression never works. runFamily needs actual row/col or figure identity in transition key.

Resident drawing now captures bobY/rot but never applies them and draws previous with alpha1-blend then current at fullalpha; use isolated paintOne for each and correct complementary weights. Panic should snap instantly. Frozen face must remain actual facing rather than force1 if outer facing contract uses it.

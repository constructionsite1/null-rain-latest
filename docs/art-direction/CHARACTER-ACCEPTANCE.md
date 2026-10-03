# Director acceptance repairs before Gunslinger

Keep your owned character files only. The director has confirmed these issues in the unfinished draft:

1. Landing: rigMemory checks vyPre < -140, but normal downward falls have positive vy. A probe airborne vy400 -> grounded true vy0 returns land=-9. Track actual airborne-to-grounded transition after descent; publish a landing once, not repeatedly while grounded. Keep jump launch from falsely landing. Make the landing absorption visible.
2. Arc sidearm mapping: drawHuman maps held arc to art ghost, but weapon art expects emitter. Check and repair this regression.
3. Temporal history integration: Kilo combat-presentation.js copies SNAP_KEYS from rigMemory(e,t,true) and injects them into ghost clone memory. It currently omits atkOn and sm/smi. Define a straightforward export/render-only snapshot contract that preserves the EXACT prior pose without advancing live actor animation. Coordinate through docs; do not edit Kilo files. Avoid smoothing on fresh clones causing idle/running drift.
4. Real player death is hp<=0, not necessarily e.dead. Review collapse triggering. Do not change gameplay state.
5. Preserve articulated lower-body gait while shooting/ranged aiming, as well as air/crouch attack arm motions. This is especially essential for the Gunslinger next phase; ensure no rigid pose translating across the ground.

Boot toe orientation and attack-duration latch were repaired during the draft. Do not redo them unless actual review finds another issue. Run focused numerical landing/jump checks and syntax checks; report limitations honestly. Director performs real browser review using Kilo's animation lab.

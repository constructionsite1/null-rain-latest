# Root static review before world delivery

Rooms are themes diner, barracks, hangout. Current `theme==='clinic'` is unreachable, maps barracks to wood. Use metal/plaster for watch-house, brick/wood for diner, wood/plaster for club. Make ALL3 textures cover full wall area.

Character actual lab verified painted sidearm/mag reload/climbing, all8Warden frames visible and audit8/8 after fixes. No new errors in latest loaded session. Keep repairs intact.

world-art.js initial draft concerns to resolve before final:
- preloadWorldArt currently returns immediate status object while assets still loading. Shared contract specifies resolves terminal status. Return promise until both loaded/errored/unsupported so renderer/start loading actually waits. onReady callback listeners also needed, Node-safe.
- paintMaterial mirrors the CONTEXT for odd seed but fills only -T to w+2T, leaving much of a wide target uncovered on its right. Ensure the material covers ENTIRE clipped target for both mirrors. Clip is world coordinates, target-origin/transformed fill must remain contained and fully filled. No mirrored half-empty panels.
- T argument currently doesn't change pattern tile's96px repeat. Make declared scale work or honestly remove assumption; different props/walls should have believable material sizes. Crop ~2px at atlas grid tile borders to avoid baked black gutter repeat.
- No per-frame pixel reads/global noise overlays. Preserve texture color and neon contrast.

Root will review actual material coverage and colored foreground source illumination in street/rooms after final delivery.

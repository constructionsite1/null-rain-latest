# NULL // RAIN

## Scope
Build a polished playable first level of an original PC cyberpunk side-scrolling stealth action game. Current user priority is level 1, not completing the entire three-level campaign. No questions; make independent decisions. All project files stay in this folder. Target October 2, 2026, 4 pm IST. Resume heartbeat requested for 1:40 pm IST.

## Architecture
Vanilla JavaScript modules + Canvas 2D, no network dependencies. Fixed-scale side camera with smooth dead zone. Original procedural/vector art and Web Audio soundtrack. Four builds: Sandevistan katana, netrunner, brute, gunslinger. At most three choices per upgrade/weapon/ending screen.

Files: src/game.js simulation; src/renderer.js procedural rendering; src/world.js level data; src/audio.js procedural sound; src/main.js input/UI/bootstrap. index.html + style.css shell. server.mjs local static server. Tests in tests/.

## Contract (agents)
Coordinates world pixels, x/y top-left, y down. Player 28x54. World 7200x2400, floor y2140. Platforms {id,x,y,w,h,kind}, one-way except kind solid. Ladders {x,y,w,h}. Shadows {x,y,w,h}. Interactables {id,type,x,y,label,...}, position at standing feet (within 90px player center). types terminal,checkpoint,cache,upgrade,lore,exit. Enemy spawn {id,type,x,y,minX,maxX,dir}, x/y top-left; types guard,drone,sniper,heavy,boss. Objects mutate with active/open/done states. Gates {id,x,y,w,h,requires}, closed until required terminal IDs completed. World has zones {name,x,w,color}, decorations [], platforms,ladders,shadows,interactables,enemies,gates,spawn:{x,y},width,height.

Renderer export render(ctx,state,width,height). State {world,player,enemies,projectiles,particles,effects,camera:{x,y},time,slowTime,alarm,objective,mode,mapOpen}. camera top-left in world coords. Renderer may render background with missing world on menu; main will provide a populated state. Player {x,y,w,h,vx,vy,dir,grounded,crouching,hp,maxHp,energy,maxEnergy,build,weapon,attackTimer,dashTimer,invuln,anim,hidden}. Enemies same basic geometry plus type,hp,maxHp,dir,alert,state,stun,attackTimer,dead. Projectiles {x,y,vx,vy,color,enemy,r}; particles {x,y,vx,vy,life,maxLife,color,size}; effects {type,x,y,life,maxLife,dir,r,color}. Platforms and objects are live world data. All timings seconds. Build IDs blade,ghost,tank,gun. Effects types slash,ring,beam,explosion,noise,text; text effects have text.

## Status
Playable MVP implemented and browser verified. All source and the generated skyline are local. Agents completed renderer/world/audio and tests. Root integrated game simulation, UI, save system, launcher, menus, hacking and endings.

At the final audit, 77% of five-hour allowance was consumed. Resume automation id: resume-null-rain-at-1-40-pm; scheduled 1:40 pm IST October 2. User requested monitoring budget and preserving MVP. Do not expand into chapters 2/3 unless first-level quality warrants and user requests.

Verification: 11 gameplay unit regressions plus a full actual-control geometry route regression. Browser QA solved both hacking puzzles, reloaded and continued saved progress, triggered ability/pause in Warden encounter, and completed sanctuary ending. No console errors observed. Geometry test freezes enemies and uses invulnerability only to isolate route reachability; do not claim it was a human combat playthrough.

Current local server: node server.mjs on localhost:4173. START GAME.bat can relaunch it. README.md documents controls and scope. ASSETS.md records original built-in Imagegen panorama prompt and provenance.

Final audit COMPLETE. 14/14 tests pass. Fixed tank dash truncating existing protection, missing boss objective navigation, victory audio suspension, and narrow-screen tutorial/prompt overlap. Independent normal-health arena simulation defeated boss with all four builds; combat tuning is intentionally forgiving (Gunslinger fastest). Browser map checked. Final screenshot assets/gameplay-preview.jpg. Normal preview is reset to title screen and marked deliverable. Latest usage88%; no further expansion is needed. Goal achieved. Keep requested1:40pm heartbeat as a completion-aware check; first-level implementation is finished, so it should avoid duplicating work and disable itself at that check.

## 1:40 pm resume / latest user request

User clarified that stealth should be optimal but chaos must be a viable punished option, with alarm systems. Implemented district heat from witnessed loud attacks and confirmed sightings; Alert increases patrol movement35% and fire rate; Lockdown warns3 seconds and dispatches a capped response team (maximum3 extra units across the run). No mission-fail alarm and no new blocking gates. Breaking contact6 seconds begins cooling. Three repeatable physical substations jam alarms35 seconds while guards retain local detection/combat. Safehouses cannot heal/save during alert or nearby pursuit. Added heat HUD, siren, warning lighting and state persistence for dynamic response enemies. Separate QA save slot prevents test fixtures touching normal saves.

Security regressions and prior gameplay/route tests pass. Browser verified lockdown countdown/dispatch, physical substation puzzle, jammed heat0, and continued local enemy combat while jammed. No console errors. Alarm preview assets/alarm-preview.jpg. Latest changes complete; disable the consumed resume heartbeat. Current scope remains the finished first-level MVP.


## Combat and character overhaul delivered
User requested cursor-directed combat, SteamWorld Heist II-inspired character identity and smoother movement. Implemented precise mouse aim, RMB aim/capture and RMB+LMB sidearm, game reticle/target brackets; capture fallback for embedded browser. Three Q/C/V skills per build, melee combos/pogo, projectile parry, cloak/barrier, targeted blink/EMP, XP five levels and three two-rank talents. Articulated character art has mechanical faces, asymmetrical gear, animated aimed weapons, distinctive heavy/sniper/drone/Warden. Guards burst, snipers telegraph beams, heavies shield front and shockwave, Warden three patterns with armor and stun resistance. Jump buffer120ms and coyote110ms.
34/34 tests pass including complete geometry route, combat, XP/save and security. Browser verified launch, new HUD, cursor capture graceful fallback, XP level-up and talent purchase. Existing game tab became unresponsive to browser automation; fresh preview used. 94% of five-hour allowance used at final integration; no new expansion. README controls updated. First level remains deliverable; chapters2/3 still planned.

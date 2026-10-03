# Actual browser blocker: sprite repacking erases/loses painted art

Director loaded current actual animation lab. Most painted cells are BLANK, while a few fall back to old geometric art. This is rejected. Reading current buildClean shows concrete issues:

1. Repack creates image data with RGB255/255/255 for every pixel; never copies original RGB. That destroys painted textures/colors. Use source image data RGB at original i*4..i*4+2 with isolated alpha. Preserve all source painted RGB; don't render just a white mask.
2. f.cx and f.foot are GLOBAL original image coordinates. Repacked placement dx/dy must subtract local anchor relative to crop, i.e. f.cx-f.x and f.foot-f.y. Current dx=cellCenter-f.cx and dy=cellBottom-f.foot sends rows2/3 and right columns off canvas or clips them entirely.
3. Source rectangles f.sx/f.sy should be repacked destination crop origin. Normalized draw anchor should simply be local crop foot center (f.cx-f.x)/f.w and local footY(f.foot-f.y)/f.h, not your mix of destination dx plus original coordinates minus cell origin. Validate source rects inside sh.clean, all frames actual alpha bounds nonempty.
4. Hero flat index -> raw[floor(index/cols)][index%cols], enemy uses family row plus column. Constant scale all frames. Sprite frames should render painted materials, not white or blank shapes.

Do these exact repairs in your owned module. Test actual texture pixel/canvas logic if needed, but stop writing repeated geometry probes that miss visible art. Director will reload real browser after your delivery. Main currently has missing renderer preloadArt export (Kilo responsibility) so lab is only available review. No declaration of completion until painted art visible in all hero/enemy poses.

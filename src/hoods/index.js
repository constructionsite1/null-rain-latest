import bazaar from './bazaar.js';
import stacks from './stacks.js';
import yards from './yards.js';
import spires from './spires.js';
/** Procedural neighbourhoods appended east of the Rain Market, 1400 units each. */
export const HOODS = [bazaar, stacks, yards, spires];
export function attachHoods(world){
  let x0=world.width;
  for(const build of HOODS){const h=build(x0)||{};
    for(const k of ['platforms','ladders','shadows','decorations','pickups','zones','enemies'])if(h[k])world[k].push(...h[k]);
    if(h.objects&&h.objects!==h.decorations)world.decorations.push(...h.objects);
    x0+=1400;}
  world.width=x0;
}

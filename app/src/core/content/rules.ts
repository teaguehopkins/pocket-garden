import type { Grid, RuleDef } from '../types';
import { isEdge, lines } from '../board';
import { SPECIES } from './species';

// Flag rules (diag, canopy, shelf, heap) are checked where they apply;
// the rest score through hooks. v5 order is kept for seed compatibility.
const list: RuleDef[] = [
  { id: 'diag', name: 'Wide Wings', text: 'Animals also count diagonal neighbours.', v5: true, p1: true },
  { id: 'wet', name: 'Wet Meadow', text: 'Water also counts as a flower.', v5: true, p1: true,
    alsoIs: (_x, t, g) => t === 'flower' && g === 'water' },
  { id: 'canopy', name: 'High Canopy', text: 'Trees no longer shade.', v5: true, p1: true },
  { id: 'pollin', name: 'Pollination', text: 'Flowers +1 per adjacent animal.', v5: true, p1: true,
    cellAdd: (v) => (v.is(v.s, 'flower') ? v.ad.filter((x) => v.group(x) === 'animal').length : 0) },
  { id: 'myc', name: 'Mycelium', text: 'Fungi +1 per other fungus anywhere.', v5: true, p1: true,
    cellAdd: (v) => (v.group(v.s) === 'fungus' ? v.all().filter((x) => v.group(x) === 'fungus').length - 1 : 0) },
  { id: 'biodiv', name: 'Biodiversity', text: '+2 per different species in the garden.', v5: true, p1: true,
    bonus: (c) => 2 * new Set(realIds(c.grid)).size },
  { id: 'hedge', name: 'Hedgerow', text: 'Plants and trees on the outer edge +1.', v5: true, p1: true,
    cellAdd: (v) => (isEdge(v.ctx.board, v.i) && (v.group(v.s) === 'plant' || v.group(v.s) === 'tree') ? 1 : 0) },
  { id: 'center', name: 'Centrepiece', text: 'The centre squares score double.', v5: true, p1: true,
    postMul: (v) => (v.ctx.board.centre.includes(v.i) ? 2 : 1) },
  { id: 'mono', name: 'Rows of a Kind', text: '+4 per full row or column of one type (tree, flower, animal...).', v5: true, p1: true,
    bonus: (c) => {
      let b = 0;
      for (const L of lines(c.board)) {
        const ts = L.map((i) => c.grid[i]);
        if (ts.every((t) => t && SPECIES[t.s].group !== 'none') && new Set(ts.map((t) => SPECIES[t!.s].group)).size === 1) b += 4;
      }
      return b;
    } },
  { id: 'roots', name: 'Deep Roots', text: 'Trees +1 per adjacent plant or fungus.', v5: true, p1: true,
    cellAdd: (v) => (v.group(v.s) === 'tree' ? v.ad.filter((x) => v.group(x) === 'plant' || v.group(x) === 'fungus').length : 0) },
  { id: 'twins', name: 'Companion Planting', text: '+1 for every tile next to its own species.', v5: true, p1: true,
    cellAdd: (v) => (v.ad.includes(v.s) ? 1 : 0) },
  { id: 'bloom2', name: 'Second Bloom', text: 'Flowers score double in Autumn.', v5: true, p1: true,
    preMul: (v) => (v.ctx.season === 2 && v.is(v.s, 'flower') ? 2 : 1) },
  { id: 'shelf', name: 'Seed Catalogue', text: 'Shelf holds 4 packets and you see 1 more ahead.', v5: true, p1: true },
  { id: 'heap', name: 'Compost Heap', text: 'Compost twice per season.', v5: true },
  // Phase 1 rules (features.content). Keystones change how verbs or the bag work.
  { id: 'runners', name: 'Runners', text: 'Spreading plants spread twice.', p1: true, keystone: true },
  { id: 'swarm', name: 'Swarm', text: 'Tiles that grow stronger gain double.', p1: true, keystone: true },
  { id: 'early', name: 'Early Season', text: 'Peaking species also double the season before their peak.', p1: true, keystone: true },
  { id: 'seedswap', name: 'Seed Swap', text: 'Add 2 more packets of each species to your bag.', p1: true, keystone: true },
  { id: 'shed', name: 'Tool Shed', text: 'One more tool use each season.', p1: true },
  { id: 'marsh', name: 'Marsh', text: 'Frogs, Ducks and Reeds also count as water.', p1: true, keystone: true,
    alsoIs: (x, t) => t === 'water' && (x === 'frog' || x === 'duck' || x === 'reeds') },
  { id: 'fairy', name: 'Fairy Ring', text: 'Fungi also count as flowers.', p1: true, keystone: true,
    alsoIs: (_x, t, g) => t === 'flower' && g === 'fungus' },
  { id: 'wildflowers', name: 'Wildflowers', text: 'Plants also count as flowers.', p1: true, keystone: true,
    alsoIs: (_x, t, g) => t === 'flower' && g === 'plant' },
  { id: 'nest', name: 'Nest Boxes', text: 'Animals on the outer edge +2.', p1: true,
    cellAdd: (v) => (v.group(v.s) === 'animal' && isEdge(v.ctx.board, v.i) ? 2 : 0) },
  { id: 'quiet', name: 'Thicket', text: 'Tiles with no empty square beside them +1.', p1: true,
    cellAdd: (v) => (v.empties() === 0 ? 1 : 0) },
  { id: 'greenhouse', name: 'Greenhouse', text: 'Weather bonuses and penalties are doubled.', p1: true },
  { id: 'bumper', name: 'Bumper Crop', text: 'Sunny squares score triple instead of double.', p1: true },
  { id: 'monoculture', name: 'Allotment', text: '+3 for each species with 4 or more tiles.', p1: true,
    bonus: (c) => {
      const n = new Map<string, number>();
      for (const id of realIds(c.grid)) n.set(id, (n.get(id) ?? 0) + 1);
      return 3 * [...n.values()].filter((k) => k >= 4).length;
    } },
];

export function realIds(g: Grid): string[] {
  return g.flatMap((t) => (t && SPECIES[t.s].group !== 'none' ? [t.s] : []));
}

export const RULES: Record<string, RuleDef> = Object.fromEntries(list.map((r) => [r.id, r]));
export const ruleList = list;
export const v5Rules = () => list.filter((r) => r.v5).map((r) => r.id);
export const p1Rules = () => list.filter((r) => r.p1).map((r) => r.id);

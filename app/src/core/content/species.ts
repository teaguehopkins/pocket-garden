import type { SpeciesDef } from '../types';

// v5 species keep their order: the draft shuffles Object order, so changing it
// would change every seed. New species are appended after them.
const list: SpeciesDef[] = [
  { id: 'oak', name: 'Oak', icon: '🌳', group: 'tree', arch: ['woodland'], text: '3 pts. Shades neighbours.', shades: true, v5: true, p1: true,
    score: () => 3 },
  { id: 'willow', name: 'Willow', icon: '🌴', group: 'tree', arch: ['wetland', 'woodland'], text: '1 pt, +2 per adjacent water. Shades neighbours.', shades: true, v5: true, p1: true,
    score: (v) => 1 + 2 * v.cnt((x) => v.is(x, 'water')) },
  { id: 'birch', name: 'Birch', icon: '🌲', group: 'tree', arch: ['woodland'], text: '2 pts, +1 per adjacent tree. No shade.', v5: true, p1: true,
    score: (v) => 2 + v.cnt((x) => v.is(x, 'tree')) },
  { id: 'fern', name: 'Fern', icon: '🌿', group: 'plant', arch: ['woodland'], text: '1 pt, +2 per adjacent tree.', v5: true, p1: true,
    score: (v) => 1 + 2 * v.cnt((x) => v.is(x, 'tree')) },
  { id: 'moss', name: 'Moss', icon: '🌱', group: 'plant', arch: ['woodland', 'wetland'], text: '1 pt, +1 per adjacent Moss or Fern.', v5: true, p1: true,
    score: (v) => 1 + v.cnt((x) => x === 'moss' || x === 'fern'),
    revised: { text: '2 pts, +1 per adjacent plant or water. Spreads.', score: (v) => 2 + v.cnt((x) => v.is(x, 'plant') || v.is(x, 'water')) } },
  { id: 'mush', name: 'Mushroom', icon: '🍄', group: 'fungus', arch: ['woodland'], text: '+2 per adjacent tree or Fern.', v5: true, p1: true,
    score: (v) => 2 * v.cnt((x) => v.is(x, 'tree') || x === 'fern') },
  { id: 'truffle', name: 'Truffle', icon: '🟤', group: 'fungus', arch: ['woodland', 'wildlife'], text: '+3 per adjacent Oak.', v5: true, p1: true,
    score: (v) => 3 * v.cnt((x) => x === 'oak'),
    revised: { text: '1 pt, +3 per adjacent tree, +2 per adjacent animal.', score: (v) => 1 + 3 * v.cnt((x) => v.is(x, 'tree')) + 2 * v.cnt((x) => v.is(x, 'animal')) } },
  { id: 'sun', name: 'Sunflower', icon: '🌻', group: 'flower', arch: ['meadow'], text: '4 pts, but 0 next to a shading tree.', v5: true, p1: true,
    score: (v) => (v.shaded() ? 0 : 4) },
  { id: 'rose', name: 'Rose', icon: '🌹', group: 'flower', arch: ['meadow'], text: '1 pt, +1 per different species adjacent.', v5: true, p1: true,
    score: (v) => 1 + new Set(v.nb.filter((x) => x !== 'rose')).size },
  { id: 'clover', name: 'Clover', icon: '☘️', group: 'flower', arch: ['meadow'], text: '1 pt, +1 per adjacent Clover.', v5: true, p1: true,
    score: (v) => 1 + v.cnt((x) => x === 'clover') },
  { id: 'lily', name: 'Water Lily', icon: '🪷', group: 'flower', arch: ['wetland', 'meadow'], text: '1 pt, +2 per adjacent water.', v5: true, p1: true,
    score: (v) => 1 + 2 * v.cnt((x) => v.is(x, 'water')) },
  { id: 'tulip', name: 'Tulip', icon: '🌷', group: 'flower', arch: ['meadow'], text: '+1 per other flower in its row or column.', v5: true, p1: true,
    score: (v) => v.rowCol().filter((x) => v.is(x, 'flower')).length },
  { id: 'bee', name: 'Bee', icon: '🐝', group: 'animal', arch: ['wildlife', 'meadow'], text: '+2 per adjacent flower.', v5: true, p1: true,
    score: (v) => 2 * v.cnt((x) => v.is(x, 'flower')) },
  { id: 'fly', name: 'Butterfly', icon: '🦋', group: 'animal', arch: ['wildlife', 'meadow'], text: '+1 per flower in the garden (max 6).', v5: true, p1: true,
    score: (v) => Math.min(6, v.all().filter((x) => v.is(x, 'flower')).length) },
  { id: 'frog', name: 'Frog', icon: '🐸', group: 'animal', arch: ['wildlife', 'wetland'], text: '+3 per adjacent water.', v5: true, p1: true,
    score: (v) => 3 * v.cnt((x) => v.is(x, 'water')) },
  { id: 'hog', name: 'Hedgehog', icon: '🦔', group: 'animal', arch: ['wildlife', 'woodland'], text: '+3 per adjacent fungus.', v5: true, p1: true,
    score: (v) => 3 * v.cnt((x) => v.is(x, 'fungus')) },
  { id: 'snail', name: 'Snail', icon: '🐌', group: 'animal', arch: ['wildlife'], text: '2 pts, +2 if no animal is adjacent.', v5: true, p1: true,
    score: (v) => 2 + (v.cnt((x) => v.group(x) === 'animal') ? 0 : 2),
    revised: { text: '2 pts, +2 per adjacent plant or fungus.', score: (v) => 2 + 2 * v.cnt((x) => v.is(x, 'plant') || v.is(x, 'fungus')) } },
  { id: 'pond', name: 'Pond', icon: '💧', group: 'water', arch: ['wetland'], text: '2 pts.', v5: true, p1: true,
    score: () => 2 },
  { id: 'stream', name: 'Stream', icon: '🌊', group: 'water', arch: ['wetland'], text: '1 pt, +2 per adjacent Stream.', v5: true, p1: true,
    score: (v) => 1 + 2 * v.cnt((x) => x === 'stream') },
  // Not draftable: blockers and plot features.
  { id: 'rock', name: 'Rock', icon: '🪨', group: 'none', arch: [], text: 'Takes up a square.', hidden: true, score: () => 0 },
];

export const SPECIES: Record<string, SpeciesDef> = Object.fromEntries(list.map((s) => [s.id, s]));
export const speciesList = list;

export const v5Pool = () => list.filter((s) => s.v5).map((s) => s.id);
export const p1Pool = () => list.filter((s) => s.p1 && !s.hidden).map((s) => s.id);

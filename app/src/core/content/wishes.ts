import { lines } from '../board';
import { makeIs, isReal } from '../score';
import { SPECIES } from './species';
import type { ScoreCtx } from '../types';

export interface WishInfo {
  season: number;
  score: number;
  target: number;
}

export interface WishDef {
  id: string;
  text: string;
  /** checked after each season is scored; once true it stays true */
  check(ctx: ScoreCtx, cells: number[], info: WishInfo): boolean;
}

const ids = (c: ScoreCtx) => c.grid.filter(isReal).map((t) => t.s);
const countIs = (c: ScoreCtx, g: Parameters<ReturnType<typeof makeIs>>[1]) => {
  const is = makeIs(c);
  return ids(c).filter((x) => is(x, g)).length;
};

export const WISHES: WishDef[] = [
  { id: 'flowerline', text: 'A full row or column of flowers', check: (c) => {
    const is = makeIs(c);
    return lines(c.board).some((L) => L.every((i) => isReal(c.grid[i]) && is(c.grid[i]!.s, 'flower')));
  } },
  { id: 'bigtile', text: 'One tile scoring 12 or more', check: (_c, cells) => cells.some((x) => x >= 12) },
  { id: 'animals4', text: '4 different animals at once', check: (c) => new Set(ids(c).filter((x) => SPECIES[x].group === 'animal')).size >= 4 },
  { id: 'trees5', text: '5 trees at once', check: (c) => countIs(c, 'tree') >= 5 },
  { id: 'water4', text: '4 water tiles at once', check: (c) => countIs(c, 'water') >= 4 },
  { id: 'fungi3', text: '3 fungi at once', check: (c) => countIs(c, 'fungus') >= 3 },
  { id: 'full', text: 'Every square filled by Autumn', check: (c, _x, i) => i.season === 2 && c.board.mask.every((m, k) => !m || !!c.grid[k]) },
  { id: 'margin', text: 'Beat a season’s target by 15 or more', check: (_c, _x, i) => i.score - i.target >= 15 },
  { id: 'spring30', text: 'Score 30 or more in Spring', check: (_c, _x, i) => i.season === 0 && i.score >= 30 },
  { id: 'all6', text: 'All 6 drafted species in the garden at once', check: (c) => new Set(ids(c).filter((x) => !SPECIES[x].hidden)).size >= 6 },
  { id: 'nozero', text: 'No tile scoring 0 or less in Autumn', check: (c, cells, i) => i.season === 2 && c.grid.every((t, k) => !isReal(t) || cells[k] > 0) },
  { id: 'strong', text: 'A tile that has grown stronger by +2', check: (c) => c.grid.some((t) => (t?.b ?? 0) >= 2) },
];

export const wishById = (id: string) => WISHES.find((w) => w.id === id)!;

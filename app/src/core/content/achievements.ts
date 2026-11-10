// Named combos to discover. Checked after each season is scored; shown in the Almanac.
import { adj, lines } from '../board';
import { isReal } from '../score';
import type { LifeChange, RunEvent, RunState } from '../run';
import type { Grid } from '../types';
import { SPECIES } from './species';

export interface SeasonView {
  run: RunState;
  grid: Grid;
  cells: number[];
  season: number;
  score: number;
  target: number;
  life: LifeChange[];
  ended: boolean;
  won: boolean;
}

export interface AchievementDef {
  id: string;
  name: string;
  /** how to earn it, shown once known; a hint before */
  text: string;
  check(v: SeasonView): boolean;
}

const ids = (g: Grid) => g.filter(isReal).map((t) => t.s);
const at = (g: Grid, i: number) => (isReal(g[i]) ? g[i]!.s : null);
const nbr = (v: SeasonView, i: number) => adj(v.run.board, i).map((j) => at(v.grid, j)).filter((x): x is string => !!x);
const group = (x: string) => SPECIES[x].group;
const some = (v: SeasonView, f: (s: string, i: number) => boolean) => v.grid.some((t, i) => isReal(t) && f(t.s, i));

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'mighty-oak', name: 'Mighty Oaks', text: 'An Acorn grows into an Oak.', check: (v) => v.life.some((c) => c.kind === 'grew' && c.from === 'acorn') },
  { id: 'clover-carpet', name: 'Clover Carpet', text: '6 Clover in one garden.', check: (v) => ids(v.grid).filter((x) => x === 'clover').length >= 6 },
  { id: 'busy-bee', name: 'Busy Bee', text: 'A Bee scores 10 or more.', check: (v) => some(v, (s, i) => s === 'bee' && v.cells[i] >= 10) },
  { id: 'pond-life', name: 'Pond Life', text: 'A Frog and a Duck share a pond.', check: (v) => some(v, (s, i) => group(s) === 'water' && nbr(v, i).includes('frog') && nbr(v, i).includes('duck')) },
  { id: 'owls-wood', name: "Owl's Wood", text: 'An Owl surrounded by 3 trees.', check: (v) => some(v, (s, i) => s === 'owl' && nbr(v, i).filter((x) => group(x) === 'tree').length >= 3) },
  { id: 'hog-supper', name: "Hedgehog's Supper", text: 'A Hedgehog next to 3 fungi.', check: (v) => some(v, (s, i) => s === 'hog' && nbr(v, i).filter((x) => group(x) === 'fungus').length >= 3) },
  { id: 'sun-worship', name: 'Sun Worship', text: 'A Sunflower scores 12 or more.', check: (v) => some(v, (s, i) => s === 'sun' && v.cells[i] >= 12) },
  { id: 'rainbow', name: 'Rainbow Border', text: '5 different flowers in one garden.', check: (v) => new Set(ids(v.grid).filter((x) => group(x) === 'flower')).size >= 5 },
  { id: 'menagerie', name: 'Menagerie', text: '5 different animals in one garden.', check: (v) => new Set(ids(v.grid).filter((x) => group(x) === 'animal')).size >= 5 },
  { id: 'deep-roots', name: 'Deep Roots', text: 'A tile that has grown stronger by +3.', check: (v) => v.grid.some((t) => (t?.b ?? 0) >= 3) },
  { id: 'one-kind', name: 'All of a Kind', text: 'A full row or column of one species.', check: (v) => lines(v.run.board).some((L) => { const s = L.map((i) => at(v.grid, i)); return !!s[0] && s.every((x) => x === s[0]); }) },
  { id: 'spring-rush', name: 'Spring Rush', text: 'Score double the Spring target.', check: (v) => v.season === 0 && v.score >= 2 * v.target },
  { id: 'wild-tangle', name: 'Wild Tangle', text: 'Three things spread in one season.', check: (v) => v.life.filter((c) => c.kind === 'spread').length >= 3 },
  { id: 'every-wish', name: 'Every Wish', text: 'Grant all 3 wishes in one year.', check: (v) => v.ended && v.won && v.run.wishes.length === 3 && v.run.wishDone.every(Boolean) },
  { id: 'close-call', name: 'Close Call', text: 'Bloom a year by a single point in Autumn.', check: (v) => v.ended && v.won && v.score === v.target },
];

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);

/** Achievements earned by the events of one action. */
export function earned(run: RunState, events: RunEvent[]): string[] {
  const scored = events.find((e) => e.type === 'seasonScored');
  if (!scored || scored.type !== 'seasonScored') return [];
  const ended = events.find((e) => e.type === 'runEnded');
  const v: SeasonView = {
    run, grid: scored.grid, cells: scored.cells, season: scored.season, score: scored.score, target: scored.target,
    life: events.flatMap((e) => (e.type === 'life' ? [e as LifeChange] : [])),
    ended: !!ended, won: !!ended && ended.type === 'runEnded' && ended.won,
  };
  return ACHIEVEMENTS.filter((a) => a.check(v)).map((a) => a.id);
}

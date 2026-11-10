// The player's long-term record: v5 rank and totals, the Lane, the Almanac and achievements.
import { adj } from './board';
import { PLOTS } from './content/plots';
import { PLOT_WISHES, TEACHING_PLOT, UNLOCKS, poolAt, type Unlock } from './content/progress';
import { SPECIES } from './content/species';
import { MAX_RANK, type RunState } from './run';
import { isReal } from './score';
import type { Grid } from './types';
import type { LogEntry } from './stats';

export interface PlotRecord {
  blooms: number;
  best: number;
  /** the garden behind `best`, kept as a miniature on the Lane */
  bestGrid: Grid | null;
  /** wish stars, one per plot wish, kept once granted in a bloomed year */
  wishes: boolean[];
}
export interface SpeciesRecord {
  met: boolean;
  planted: number;
  bestTile: number;
  /** neighbour species counts across finished gardens */
  pairs: Record<string, number>;
}
export interface RuleRecord {
  met: boolean;
  taken: number;
  bloomed: number;
}

export interface Profile {
  v: 1;
  runs: number;
  years: number;
  best: number;
  rank: number;
  stars: number;
  /** best total per seed, key `${seed}` or `${seed}d` for daily */
  seedBest: Record<string, number>;
  tutorialDone: boolean;
  lane: Record<string, PlotRecord>;
  species: Record<string, SpeciesRecord>;
  rules: Record<string, RuleRecord>;
  /** achievement id -> date earned (YYYY-MM-DD) */
  achievements: Record<string, string>;
  /** one entry per finished garden, newest last (capped) */
  log: LogEntry[];
}

export const emptyProfile = (): Profile => ({
  v: 1, runs: 0, years: 0, best: 0, rank: 1, stars: 0, seedBest: {},
  tutorialDone: false, lane: {}, species: {}, rules: {}, achievements: {}, log: [],
});

const emptyPlot = (): PlotRecord => ({ blooms: 0, best: 0, bestGrid: null, wishes: [false, false, false] });
const emptySpecies = (): SpeciesRecord => ({ met: false, planted: 0, bestTile: 0, pairs: {} });
const emptyRule = (): RuleRecord => ({ met: false, taken: 0, bloomed: 0 });

export const laneStars = (p: Profile) => Object.values(p.lane).reduce((n, r) => n + r.wishes.filter(Boolean).length, 0);
export const laneMaxStars = () => PLOTS.length * 3;
export const currentPool = (p: Profile) => poolAt(laneStars(p));

/** Plots open on the Lane: the first always, then each once the one before has bloomed. */
export function openPlots(p: Profile): string[] {
  const out: string[] = [];
  for (let k = 0; k < PLOTS.length; k++) {
    if (k === 0 || (p.lane[PLOTS[k - 1].id]?.blooms ?? 0) > 0) out.push(PLOTS[k].id);
    else break;
  }
  return out;
}

export function favouritePair(r: SpeciesRecord | undefined): string | null {
  if (!r) return null;
  let best: string | null = null, n = 0;
  for (const [k, c] of Object.entries(r.pairs)) if (c > n) { best = k; n = c; }
  return best;
}

/** Note species and rules the player has now seen (offered or chosen). Returns the same object if nothing changed. */
export function markMet(p: Profile, s: RunState): Profile {
  const sp = [...s.offer, ...s.roster].filter((k) => !p.species[k]?.met);
  const ru = [...s.ruleOffer, ...s.rules].filter((k) => !p.rules[k]?.met);
  if (!sp.length && !ru.length) return p;
  const q = structuredClone(p);
  for (const k of sp) q.species[k] = { ...(q.species[k] ?? emptySpecies()), met: true };
  for (const k of ru) q.rules[k] = { ...(q.rules[k] ?? emptyRule()), met: true };
  return q;
}

/** Best single-tile scores from a scored season. */
export function recordSeason(p: Profile, grid: Grid, cells: number[]): Profile {
  const q = structuredClone(p);
  grid.forEach((t, i) => {
    if (!isReal(t) || t.f) return;
    const r = (q.species[t.s] ??= { ...emptySpecies(), met: true });
    r.bestTile = Math.max(r.bestTile, cells[i]);
  });
  return q;
}

export function addAchievements(p: Profile, ids: string[], date: string): { profile: Profile; fresh: string[] } {
  const fresh = ids.filter((id) => !p.achievements[id]);
  if (!fresh.length) return { profile: p, fresh };
  const q = structuredClone(p);
  for (const id of fresh) q.achievements[id] = date;
  return { profile: q, fresh };
}

export interface LaneChange {
  starsBefore: number;
  starsAfter: number;
  /** wish ids newly starred on this plot */
  newWishes: string[];
  /** plot newly opened on the Lane */
  plotOpened: string | null;
  /** star unlocks reached by this year */
  unlocked: Unlock[];
  /** a new best garden on this plot */
  plotBest: boolean;
  tutorialDone: boolean;
}

export interface RunOutcome {
  profile: Profile;
  rankUp: number | null;
  newBest: boolean;
  lane: LaneChange;
}

/** Record a finished run on the profile. */
export function recordRun(p0: Profile, s: RunState): RunOutcome {
  const p: Profile = { ...emptyProfile(), ...structuredClone(p0) };
  const starsBefore = laneStars(p);
  const openBefore = openPlots(p);
  const won = s.phase === 'won';
  p.runs++;
  let rankUp: number | null = null;
  if (won) {
    p.years++;
    p.stars += s.stars ?? 0;
    if (!s.daily && p.rank < MAX_RANK) rankUp = ++p.rank;
  }
  p.best = Math.max(p.best, s.banked);
  const key = `${s.seed}${s.daily ? 'd' : ''}`;
  const newBest = s.banked > (p.seedBest[key] ?? 0);
  if (newBest) p.seedBest[key] = s.banked;

  // Almanac: plantings, neighbours, rules.
  const grid = s.grid ?? [];
  grid.forEach((t, i) => {
    if (!isReal(t) || t.f) return;
    const r = (p.species[t.s] ??= { ...emptySpecies(), met: true });
    r.planted++;
    for (const j of adj(s.board, i)) {
      const n = grid[j];
      if (isReal(n) && SPECIES[n.s].group !== 'none') r.pairs[n.s] = (r.pairs[n.s] ?? 0) + 1;
    }
  });
  for (const id of s.rules ?? []) {
    const r = (p.rules[id] ??= { ...emptyRule(), met: true });
    r.taken++;
    if (won) r.bloomed++;
  }

  // The Lane.
  let newWishes: string[] = [];
  let plotBest = false;
  const plotWishes = s.plot ? PLOT_WISHES[s.plot] : undefined;
  if (s.plot && plotWishes && !s.daily && !s.shared) {
    const r = (p.lane[s.plot] ??= emptyPlot());
    if (won) {
      r.blooms++;
      if (s.banked > r.best) {
        r.best = s.banked;
        r.bestGrid = structuredClone(grid);
        plotBest = true;
      }
      s.wishes.forEach((id, k) => {
        const idx = plotWishes.indexOf(id);
        if (s.wishDone[k] && idx >= 0 && !r.wishes[idx]) {
          r.wishes[idx] = true;
          newWishes.push(id);
        }
      });
    }
  }
  const tutorialDone = s.plot === TEACHING_PLOT.id && !p0.tutorialDone;
  if (s.plot === TEACHING_PLOT.id) p.tutorialDone = true;

  const starsAfter = laneStars(p);
  const opened = openPlots(p).find((id) => !openBefore.includes(id)) ?? null;
  return {
    profile: p, rankUp, newBest,
    lane: {
      starsBefore, starsAfter, newWishes, plotOpened: opened, plotBest, tutorialDone,
      unlocked: UNLOCKS.filter((u) => u.stars > starsBefore && u.stars <= starsAfter),
    },
  };
}

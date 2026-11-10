// A run (one garden year) as a pure state machine: apply(state, action) -> { state, events }.
// With all feature flags off this reproduces the v5 prototype exactly, seed for seed.

import { rectBoard, adj, type Board } from './board';
import { p1Pool, SPECIES, v5Pool } from './content/species';
import { p1Rules, v5Rules } from './content/rules';
import { weatherIds } from './content/weather';
import { parsePlot, PLOTS, type PlotDef } from './content/plots';
import { WISHES, wishById } from './content/wishes';
import { Rng, SECOND_STREAM } from './rng';
import { cellScores, total } from './score';
import { V5_FEATURES, type Features, type Grid, type ScoreCtx, type Tile } from './types';

export const PER_SEASON = 5;
export const DRAFT_SIZE = 6;
export const SEASONS = ['Spring', 'Summer', 'Autumn'] as const;
export const V5_BASE: [number, number, number] = [16, 37, 64];
export const MAX_RANK = 10;
export const BAG_COPIES = 3;

export type Phase = 'draft' | 'rule' | 'play' | 'won' | 'lost';
export type ToolId = 'compost' | 'trowel' | 'replant';

export interface RunConfig {
  seed: number;
  daily?: boolean;
  rank?: number;
  features?: Features;
  /** plot id when features.plots */
  plot?: string;
  /** a plot not in the Lane (the teaching garden) */
  plotDef?: PlotDef;
  /** species and rules available (unlocks); default: the whole pool */
  pool?: Pool;
  /** fixed wishes (each Lane plot has its own) */
  wishes?: string[];
  /** plantings per season (default 5) */
  per?: number;
  /** species drafted (default 6) */
  draftSize?: number;
  /** fixed offers, weather and targets for the teaching garden */
  script?: RunScript;
}

export interface Pool {
  species: string[];
  rules: string[];
}

export interface RunScript {
  /** draft offers by pick number */
  offers?: string[][];
  /** rule offers by season */
  ruleOffers?: string[][];
  mods?: string[];
  targets?: number[];
}

export interface RunState {
  v: 1;
  seed: number;
  daily: boolean;
  rank: number;
  features: Features;
  /** RNG for the packet queue (v5 `R`) */
  rngA: number;
  /** RNG for weather, draft and rule offers (v5 `R2`) */
  rngB: number;
  plot: string | null;
  board: Board;
  targets: number[];
  mods: string[];
  roster: string[];
  offer: string[];
  ruleOffer: string[];
  rules: string[];
  queue: string[];
  /** packets left in the seed bag (features.bag) */
  bag: string[];
  grid: Grid;
  season: number;
  placed: number;
  results: number[];
  banked: number;
  phase: Phase;
  last: number;
  /** compost uses left this season (v5), or tool charges (features.tools) */
  rerolls: number;
  stars: number | null;
  wishes: string[];
  wishDone: boolean[];
  /** what changed at the last season end (features.life), for display */
  changes: LifeChange[];
  pool?: Pool | null;
  per?: number;
  draftSize?: number;
  script?: RunScript | null;
}

export type LifeChange =
  | { kind: 'grew'; cell: number; from: string; to: string }
  | { kind: 'spread'; from: number; cell: number; s: string }
  | { kind: 'scaled'; cell: number; s: string; by: number };

export type Action =
  | { type: 'draft'; id: string }
  | { type: 'rule'; id: string }
  | { type: 'plant'; slot: number; cell: number }
  | { type: 'compost' }
  | { type: 'trowel'; from: number; to: number }
  | { type: 'replant'; slot: number; cell: number }
  | { type: 'skip'; slot: number };

export type RunEvent =
  | { type: 'drafted'; id: string }
  | { type: 'ruleTaken'; id: string }
  | { type: 'planted'; id: string; cell: number; replaced?: string }
  | { type: 'composted' }
  | { type: 'moved'; from: number; to: number }
  | { type: 'seasonScored'; season: number; score: number; target: number; ok: boolean; cells: number[]; grid: Grid; bonus: number }
  | { type: 'wish'; id: string }
  | ({ type: 'life' } & LifeChange)
  | { type: 'runEnded'; won: boolean; banked: number; stars: number | null };

const rankTargets = (r: number) => V5_BASE.map((t) => Math.round(t * (1 + 0.03 * (r - 1))));

export const speciesPool = (s: Pick<RunState, 'features' | 'pool'>) => s.pool?.species ?? (s.features.content ? p1Pool() : v5Pool());
export const rulePool = (s: Pick<RunState, 'features' | 'pool'>) => s.pool?.rules ?? (s.features.content ? p1Rules() : v5Rules());
export const perSeason = (s: Pick<RunState, 'per'>) => s.per ?? PER_SEASON;
export const draftSize = (s: Pick<RunState, 'draftSize'>) => s.draftSize ?? DRAFT_SIZE;

function dealDraft(s: RunState, B: Rng) {
  const scripted = s.script?.offers?.[s.roster.length]?.filter((k) => !s.roster.includes(k));
  s.offer = scripted?.length ? scripted : B.pick(speciesPool(s).filter((k) => !s.roster.includes(k)), 3);
}
function dealRules(s: RunState, B: Rng) {
  const scripted = s.script?.ruleOffers?.[s.season]?.filter((k) => !s.rules.includes(k));
  s.ruleOffer = scripted?.length ? scripted : B.pick(rulePool(s).filter((k) => !s.rules.includes(k)), 3);
}

export function shelfN(s: RunState) {
  return s.rules.includes('shelf') ? 4 : 3;
}
export function aheadN(s: RunState) {
  const base = s.features.plots ? 3 : s.rank >= 5 ? 2 : 3;
  return base + (s.rules.includes('shelf') ? 1 : 0);
}
export function chargesPerSeason(s: RunState) {
  if (s.features.tools) return 1 + (s.rules.includes('shed') ? 1 : 0);
  return s.rank >= 7 ? 0 : s.rules.includes('heap') ? 2 : 1;
}

export function scoreCtx(s: RunState, grid = s.grid): ScoreCtx {
  const season = Math.min(s.season, 2);
  return { board: s.board, grid, rules: new Set(s.rules), season, weather: s.mods[season], features: s.features };
}

export function newRun(cfg: RunConfig): RunState {
  const features = cfg.features ?? V5_FEATURES;
  const daily = !!cfg.daily;
  const rank = daily ? 1 : cfg.rank ?? 1;
  const A = new Rng(cfg.seed), B = new Rng(cfg.seed ^ SECOND_STREAM);
  const mods = cfg.script?.mods ?? B.pick(weatherIds(), 3);
  let board = rectBoard(4, 4);
  let grid: Grid = Array(16).fill(null);
  let targets = daily ? [...V5_BASE] : rankTargets(rank);
  let plot: string | null = null;
  if (features.plots) {
    const def = cfg.plotDef ?? PLOTS.find((p) => p.id === cfg.plot) ?? PLOTS[B.int(PLOTS.length)];
    ({ board, grid } = parsePlot(def));
    targets = [...def.targets];
    plot = def.id;
  } else if (rank >= 3) {
    grid[B.int(16)] = { s: 'rock' };
  }
  const s: RunState = {
    v: 1, seed: cfg.seed, daily, rank, features, rngA: A.state, rngB: B.state,
    plot, board, targets, mods, roster: [], offer: [], ruleOffer: [], rules: [], queue: [], bag: [],
    grid, season: 0, placed: 0, results: [], banked: 0, phase: 'draft', last: -1, rerolls: 0, stars: null,
    wishes: [], wishDone: [], changes: [],
    pool: cfg.pool ?? null, per: cfg.per, draftSize: cfg.draftSize, script: cfg.script ?? null,
  };
  if (cfg.script?.targets) s.targets = [...cfg.script.targets];
  withRng(s, (_A, B) => {
    if (features.wishes) {
      s.wishes = cfg.wishes ? [...cfg.wishes] : B.pick(WISHES.map((w) => w.id), 3);
      s.wishDone = s.wishes.map(() => false);
    }
    dealDraft(s, B);
  });
  return s;
}

/** Run fn with live RNGs over s, writing their states back. */
function withRng(s: RunState, fn: (A: Rng, B: Rng) => void) {
  const A = new Rng(s.rngA), B = new Rng(s.rngB);
  fn(A, B);
  s.rngA = A.state;
  s.rngB = B.state;
}

function fillQueue(s: RunState, A: Rng) {
  const want = shelfN(s) + aheadN(s);
  while (s.queue.length < want) {
    if (s.features.bag) {
      if (!s.bag.length) break;
      s.queue.push(s.bag.splice(A.int(s.bag.length), 1)[0]);
    } else s.queue.push(s.roster[A.int(s.roster.length)]);
  }
}

export const emptySquares = (s: RunState) => s.grid.flatMap((t, i) => (!t && s.board.mask[i] ? [i] : []));
export const movable = (s: RunState, i: number) => !!s.grid[i] && !s.grid[i]!.f && SPECIES[s.grid[i]!.s].group !== 'none';

export function plantingsLeft(s: RunState) {
  return perSeason(s) - (s.placed % perSeason(s));
}

/** Change to this season's score if the packet in `slot` were planted on `cell` (Replant if occupied). */
export function preview(s: RunState, slot: number, cell: number): number {
  const ctx = scoreCtx(s);
  const g = [...s.grid];
  g[cell] = { s: s.queue[slot] };
  return total({ ...ctx, grid: g }) - total(ctx);
}

export function legal(s: RunState, a: Action): string | null {
  switch (a.type) {
    case 'draft':
      return s.phase === 'draft' && s.offer.includes(a.id) ? null : 'not offered';
    case 'rule':
      return s.phase === 'rule' && s.ruleOffer.includes(a.id) ? null : 'not offered';
    case 'plant':
      if (s.phase !== 'play') return 'not planting';
      if (a.slot < 0 || a.slot >= Math.min(shelfN(s), s.queue.length)) return 'no packet';
      if (!s.board.mask[a.cell] || s.grid[a.cell]) return 'square taken';
      return null;
    case 'compost':
      if (s.phase !== 'play' || s.rerolls <= 0) return 'no compost left';
      return null;
    case 'trowel':
      if (!s.features.tools || s.phase !== 'play' || s.rerolls <= 0) return 'no tool charge';
      if (!movable(s, a.from) || !s.board.mask[a.to] || s.grid[a.to]) return 'cannot move';
      return null;
    case 'replant':
      if (!s.features.tools || s.phase !== 'play' || s.rerolls <= 0) return 'no tool charge';
      if (a.slot < 0 || a.slot >= Math.min(shelfN(s), s.queue.length)) return 'no packet';
      if (!movable(s, a.cell)) return 'cannot replant there';
      return null;
    case 'skip':
      if (s.phase !== 'play') return 'not planting';
      if (a.slot < 0 || a.slot >= Math.min(shelfN(s), s.queue.length)) return 'no packet';
      return emptySquares(s).length ? 'there is still room' : null;
  }
}

export function apply(prev: RunState, a: Action): { state: RunState; events: RunEvent[] } {
  const err = legal(prev, a);
  if (err) throw new Error(`illegal ${a.type}: ${err}`);
  const s: RunState = structuredClone(prev);
  const ev: RunEvent[] = [];
  withRng(s, (A, B) => {
    switch (a.type) {
      case 'draft': {
        s.roster.push(a.id);
        ev.push({ type: 'drafted', id: a.id });
        if (s.roster.length < draftSize(s)) dealDraft(s, B);
        else {
          s.offer = [];
          if (s.features.bag) s.bag = s.roster.flatMap((k) => Array(BAG_COPIES).fill(k));
          s.phase = 'rule';
          dealRules(s, B);
        }
        break;
      }
      case 'rule': {
        s.rules.push(a.id);
        s.ruleOffer = [];
        ev.push({ type: 'ruleTaken', id: a.id });
        if (s.features.bag) applyBagRule(s, a.id);
        fillQueue(s, A);
        s.rerolls = chargesPerSeason(s);
        s.phase = 'play';
        break;
      }
      case 'compost': {
        const shelf = s.queue.splice(0, shelfN(s));
        if (s.features.bag) s.bag.push(...shelf);
        s.rerolls--;
        fillQueue(s, A);
        ev.push({ type: 'composted' });
        break;
      }
      case 'trowel': {
        s.grid[a.to] = s.grid[a.from];
        s.grid[a.from] = null;
        s.rerolls--;
        s.last = a.to;
        ev.push({ type: 'moved', from: a.from, to: a.to });
        break;
      }
      case 'plant':
      case 'replant':
      case 'skip': {
        const id = s.queue[a.slot];
        if (a.type === 'skip') {
          ev.push({ type: 'planted', id, cell: -1 });
        } else {
          const replaced = s.grid[a.cell]?.s;
          s.grid[a.cell] = { s: id };
          s.last = a.cell;
          if (a.type === 'replant') s.rerolls--;
          ev.push({ type: 'planted', id, cell: a.cell, ...(replaced ? { replaced } : {}) });
        }
        s.placed++;
        s.queue.splice(a.slot, 1);
        fillQueue(s, A);
        if (s.placed % perSeason(s) === 0) endSeason(s, A, B, ev);
        break;
      }
    }
  });
  return { state: s, events: ev };
}

function endSeason(s: RunState, A: Rng, B: Rng, ev: RunEvent[]) {
  const ctx = scoreCtx(s);
  const cells = cellScores(ctx);
  const sc = total(ctx);
  const target = s.targets[s.season];
  const ok = sc >= target;
  s.results.push(sc);
  s.banked += sc;
  ev.push({ type: 'seasonScored', season: s.season, score: sc, target, ok, cells, grid: structuredClone(s.grid), bonus: sc - cells.reduce((x, y) => x + y, 0) });
  if (s.features.wishes)
    s.wishes.forEach((id, k) => {
      if (!s.wishDone[k] && wishById(id).check(ctx, cells, { season: s.season, score: sc, target })) {
        s.wishDone[k] = true;
        ev.push({ type: 'wish', id });
      }
    });
  if (!ok || s.season === 2) {
    s.phase = ok ? 'won' : 'lost';
    if (ok) s.stars = s.features.wishes ? s.wishDone.filter(Boolean).length : marginStars(s);
    ev.push({ type: 'runEnded', won: ok, banked: s.banked, stars: s.stars });
    return;
  }
  if (s.features.life) {
    s.changes = seasonalLife(s, A);
    ev.push(...s.changes.map((c) => ({ type: 'life' as const, ...c })));
  }
  s.season++;
  s.phase = 'rule';
  dealRules(s, B);
}

function marginStars(s: RunState) {
  const ratio = s.results[2] / s.targets[2];
  return ratio >= 1.15 ? 3 : ratio >= 1.07 ? 2 : 1;
}

/** Season-end verbs: grow, scale, then spread (in square order). */
export function seasonalLife(s: RunState, A: Rng): LifeChange[] {
  const out: LifeChange[] = [];
  const g = s.grid;
  const tiles = g.flatMap((t, i) => (t && !t.f ? [[i, t] as [number, Tile]] : []));
  for (const [i, t] of tiles) {
    const v = SPECIES[t.s].verb;
    if (v?.kind === 'grow') {
      out.push({ kind: 'grew', cell: i, from: t.s, to: v.into });
      g[i] = { ...t, s: v.into };
    }
  }
  for (const [i, t] of tiles) {
    const v = SPECIES[t.s].verb;
    if (v?.kind === 'scale') {
      const near = adj(s.board, i).some((j) => g[j] && (SPECIES[g[j]!.s].group === v.when || !!SPECIES[g[j]!.s].also?.includes(v.when)));
      if (near) {
        const by = v.amount * (s.rules.includes('swarm') ? 2 : 1);
        g[i] = { ...g[i]!, b: (g[i]!.b ?? 0) + by };
        out.push({ kind: 'scaled', cell: i, s: t.s, by });
      }
    }
  }
  const times = s.rules.includes('runners') ? 2 : 1;
  for (const [i, t] of tiles) {
    if (SPECIES[t.s].verb?.kind !== 'spread') continue;
    for (let n = 0; n < times; n++) {
      const free = adj(s.board, i).filter((j) => !g[j]);
      if (!free.length) break;
      const j = free[A.int(free.length)];
      g[j] = { s: t.s };
      out.push({ kind: 'spread', from: i, cell: j, s: t.s });
    }
  }
  return out;
}

/** Rules that change the seed bag when taken. */
function applyBagRule(s: RunState, id: string) {
  if (id === 'seedswap') {
    // Add 2 more of every species already drafted: more choice, same plantings.
    for (const k of s.roster) s.bag.push(k, k);
  }
}

export function currentScore(s: RunState) {
  return total(scoreCtx(s));
}

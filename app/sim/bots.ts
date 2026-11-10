// Bots for balance sims. They see only what a player sees: the board, rules,
// weather, the visible queue and the bag contents. Rollouts reseed the RNGs so
// the planner cannot peek at future draws.

import { SPECIES } from '../src/core/content/species';
import { Rng } from '../src/core/rng';
import {
  apply, emptySquares, movable, scoreCtx, shelfN, type Action, type RunState,
} from '../src/core/run';
import { total } from '../src/core/score';

export interface Bot {
  name: string;
  act(s: RunState, r: Rng): Action;
}

const shelf = (s: RunState) => Math.min(shelfN(s), s.queue.length);

export function plantActions(s: RunState): Action[] {
  const out: Action[] = [];
  const empties = emptySquares(s);
  const seen = new Set<string>();
  for (let slot = 0; slot < shelf(s); slot++) {
    if (seen.has(s.queue[slot])) continue; // identical packets give identical moves
    seen.add(s.queue[slot]);
    if (empties.length) for (const cell of empties) out.push({ type: 'plant', slot, cell });
    else out.push({ type: 'skip', slot });
  }
  return out;
}

/** Immediate change in this season's score for each planting. */
function scoredPlants(s: RunState): { a: Action; d: number }[] {
  const ctx = scoreCtx(s);
  const base = total(ctx);
  return plantActions(s).map((a) => {
    if (a.type !== 'plant') return { a, d: 0 };
    const g = [...s.grid];
    g[a.cell] = { s: s.queue[a.slot] };
    return { a, d: total({ ...ctx, grid: g }) - base };
  });
}

function draftAffinity(s: RunState, id: string): number {
  const mine = SPECIES[id].arch;
  let a = 0;
  for (const k of s.roster) for (const x of SPECIES[k].arch) if (mine.includes(x)) a++;
  return a;
}

export function draftPick(s: RunState, r: Rng): Action {
  let best = s.offer[r.int(s.offer.length)], bv = -1;
  for (const id of s.offer) {
    const v = draftAffinity(s, id) + r.next() * 0.5;
    if (v > bv) { bv = v; best = id; }
  }
  return { type: 'draft', id: best };
}

export const randomBot: Bot = {
  name: 'random',
  act(s, r) {
    if (s.phase === 'draft') return { type: 'draft', id: s.offer[r.int(s.offer.length)] };
    if (s.phase === 'rule') return { type: 'rule', id: s.ruleOffer[r.int(s.ruleOffer.length)] };
    const acts = plantActions(s);
    return acts[r.int(acts.length)];
  },
};

function greedyPlay(s: RunState, r: Rng): Action {
  const sc = scoredPlants(s);
  let best = sc[0], ties = 1;
  for (const x of sc.slice(1)) {
    if (x.d > best.d) { best = x; ties = 1; }
    else if (x.d === best.d && r.int(++ties) === 0) best = x;
  }
  if (best.d <= 0 && s.rerolls > 0 && s.queue.length > shelfN(s)) return { type: 'compost' };
  return best.a;
}

function greedyRule(s: RunState, r: Rng): Action {
  // Pick the rule that makes the current garden score most right now.
  let best = s.ruleOffer[r.int(s.ruleOffer.length)], bv = -Infinity;
  for (const id of s.ruleOffer) {
    const v = total({ ...scoreCtx(s), rules: new Set([...s.rules, id]) });
    if (v > bv) { bv = v; best = id; }
  }
  return { type: 'rule', id: best };
}

export const greedyBot: Bot = {
  name: 'greedy',
  act(s, r) {
    if (s.phase === 'draft') return draftPick(s, r);
    if (s.phase === 'rule') return greedyRule(s, r);
    return greedyPlay(s, r);
  },
};

const live = (s: RunState) => s.phase === 'draft' || s.phase === 'rule' || s.phase === 'play';

/**
 * Play greedily from s until `seasons` more season-ends have happened (or the
 * year ends), with fresh RNG so the future is sampled, not known.
 */
function rollout(s: RunState, r: Rng, seasons: number): number {
  s = { ...s, rngA: (r.next() * 2 ** 32) | 0, rngB: (r.next() * 2 ** 32) | 0 };
  const stopAt = s.results.length + seasons;
  while (live(s) && s.results.length < stopAt) {
    const a = s.phase === 'rule' ? { type: 'rule' as const, id: s.ruleOffer[0] } : greedyPlay(s, r);
    s = apply(s, a).state;
  }
  return value(s);
}

/** How good a position is: losing is terrible; otherwise margin over targets plus the garden's current strength. */
function value(s: RunState): number {
  if (s.phase === 'lost') return -1000 + s.banked;
  let v = 0;
  s.results.forEach((x, k) => (v += Math.min(x - s.targets[k], 25)));
  if (s.phase === 'won') return 500 + v;
  return v + 0.5 * total(scoreCtx(s));
}

export interface PlannerOpts {
  /** candidate moves kept after the cheap prefilter */
  width: number;
  /** rollouts per candidate */
  rollouts: number;
  /** season-ends each rollout looks ahead */
  depth: number;
}

export function plannerBot(o: PlannerOpts = { width: 6, rollouts: 3, depth: 2 }): Bot {
  const evalAction = (s: RunState, a: Action, r: Rng) => {
    const next = apply(s, a).state;
    let v = 0;
    for (let k = 0; k < o.rollouts; k++) v += rollout(next, r, o.depth);
    return v / o.rollouts;
  };
  return {
    name: 'planner',
    act(s, r) {
      if (s.phase === 'draft') return draftPick(s, r);
      if (s.phase === 'rule') {
        let best: Action = { type: 'rule', id: s.ruleOffer[0] }, bv = -Infinity;
        for (const id of s.ruleOffer) {
          const v = evalAction(s, { type: 'rule', id }, r);
          if (v > bv) { bv = v; best = { type: 'rule', id }; }
        }
        return best;
      }
      const sc = scoredPlants(s).sort((x, y) => y.d - x.d);
      // Keep the top moves, plus a few that set up delayed payoffs (verbs) the delta can't see.
      const cands: Action[] = sc.slice(0, o.width).map((x) => x.a);
      for (const x of sc) {
        if (cands.length >= o.width + 3) break;
        if (x.a.type === 'plant' && SPECIES[s.queue[x.a.slot]].verb && !cands.includes(x.a)) cands.push(x.a);
      }
      if (s.rerolls > 0 && s.queue.length > shelfN(s)) cands.push({ type: 'compost' });
      if (s.features.tools && s.rerolls > 0) cands.push(...toolCandidates(s, sc[0]?.d ?? 0));
      let best = cands[0], bv = -Infinity;
      for (const a of cands) {
        const v = evalAction(s, a, r);
        if (v > bv) { bv = v; best = a; }
      }
      return best;
    },
  };
}

/** A small set of Trowel / Replant moves worth trying. */
function toolCandidates(s: RunState, bestPlant: number): Action[] {
  const out: Action[] = [];
  const ctx = scoreCtx(s);
  const base = total(ctx);
  const empties = emptySquares(s);
  // Replant: best single replacement.
  let rep: { a: Action; d: number } | null = null;
  for (let slot = 0; slot < shelf(s); slot++)
    for (let cell = 0; cell < s.grid.length; cell++) {
      if (!movable(s, cell)) continue;
      const g = [...s.grid];
      g[cell] = { s: s.queue[slot] };
      const d = total({ ...ctx, grid: g }) - base;
      if (!rep || d > rep.d) rep = { a: { type: 'replant', slot, cell }, d };
    }
  if (rep && (rep.d > bestPlant || !empties.length)) out.push(rep.a);
  // Trowel: best single move.
  let mv: { a: Action; d: number } | null = null;
  for (let from = 0; from < s.grid.length; from++) {
    if (!movable(s, from)) continue;
    for (const to of empties) {
      const g = [...s.grid];
      g[to] = g[from];
      g[from] = null;
      const d = total({ ...ctx, grid: g }) - base;
      if (!mv || d > mv.d) mv = { a: { type: 'trowel', from, to }, d };
    }
  }
  if (mv && mv.d > 0) out.push(mv.a);
  return out;
}

export function playRun(bot: Bot, s: RunState, seed: number): RunState {
  const r = new Rng(seed);
  while (live(s)) s = apply(s, bot.act(s, r)).state;
  return s;
}

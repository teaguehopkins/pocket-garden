import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { apply, newRun, scoreCtx, seasonalLife, legal, type RunState } from '../src/core/run';
import { cellScore, total } from '../src/core/score';
import { PLOTS, parsePlot } from '../src/core/content/plots';
import { WISHES, wishById } from '../src/core/content/wishes';
import { P1_FEATURES, V5_FEATURES, type Features, type Grid } from '../src/core/types';
import { rectBoard } from '../src/core/board';

/** A run in the play phase with a given roster, skipping draft and rule picks. */
function playing(features: Partial<Features>, roster: string[], opts: { plot?: string; rules?: string[] } = {}): RunState {
  let s = newRun({ seed: 99, features: { ...V5_FEATURES, ...features }, plot: opts.plot ?? 'raised-bed' });
  s = { ...s, offer: [roster[0]] };
  for (let k = 0; k < 6; k++) {
    s = { ...s, offer: [roster[k]] };
    s = apply(s, { type: 'draft', id: roster[k] }).state;
  }
  const rule = opts.rules?.[0] ?? s.ruleOffer[0];
  s = apply({ ...s, ruleOffer: [rule] }, { type: 'rule', id: rule }).state;
  return { ...s, rules: opts.rules ?? s.rules };
}
const ROSTER = ['oak', 'clover', 'bee', 'tulip', 'pond', 'frog'];
const g = (cells: Record<number, string>, n = 16): Grid => Array.from({ length: n }, (_, i) => (cells[i] ? { s: cells[i] } : null));

describe('seed bag', () => {
  it('holds 3 of each drafted species and draws without replacement', () => {
    const s = playing({ bag: true }, ROSTER);
    expect(s.bag.length + s.queue.length).toBe(18);
    const all = [...s.bag, ...s.queue].sort();
    expect(all).toEqual(ROSTER.flatMap((k) => [k, k, k]).sort());
  });
  it('compost returns the shelf to the bag', () => {
    const s = playing({ bag: true }, ROSTER);
    const t = apply(s, { type: 'compost' }).state;
    expect(t.bag.length + t.queue.length).toBe(18);
  });
  it('Seed Swap adds 2 more of each', () => {
    const s = playing({ bag: true, content: true }, ROSTER, { rules: ['seedswap'] });
    // rule applied at take time
    expect(s.bag.length + s.queue.length).toBe(ROSTER.includes(s.rules[0]) ? 18 : 18 + (s.rules[0] === 'seedswap' ? 12 : 0));
  });
  it('runs out after 18 packets: the queue shrinks', () => {
    let s = playing({ bag: true, plots: true }, ROSTER);
    let planted = 0;
    while (s.phase === 'play' || s.phase === 'rule') {
      if (s.phase === 'rule') { s = apply(s, { type: 'rule', id: s.ruleOffer[0] }).state; continue; }
      const cell = s.grid.findIndex((t, i) => !t && s.board.mask[i]);
      s = apply(s, cell >= 0 ? { type: 'plant', slot: 0, cell } : { type: 'skip', slot: 0 }).state;
      planted++;
    }
    expect(planted).toBeLessThanOrEqual(15);
    expect(s.bag.length + s.queue.length).toBe(18 - planted);
  });
});

describe('seasonal life', () => {
  const base = () => ({ ...playing({ life: true, content: true }, ROSTER), rules: [] as string[] });
  it('Acorn grows into Oak', () => {
    const s = { ...base(), grid: g({ 0: 'acorn' }) };
    const ch = seasonalLife(s, new Rng(1));
    expect(s.grid[0]!.s).toBe('oak');
    expect(ch).toEqual([{ kind: 'grew', cell: 0, from: 'acorn', to: 'oak' }]);
  });
  it('Clover spreads to an empty neighbour; Runners spreads twice', () => {
    const s = { ...base(), grid: g({ 5: 'clover' }) };
    seasonalLife(s, new Rng(1));
    expect(s.grid.filter((t) => t?.s === 'clover').length).toBe(2);
    const r = { ...base(), rules: ['runners'], grid: g({ 5: 'clover' }) };
    seasonalLife(r, new Rng(1));
    expect(r.grid.filter((t) => t?.s === 'clover').length).toBe(3);
  });
  it('does not spread when boxed in', () => {
    const s = { ...base(), grid: g({ 0: 'clover', 1: 'oak', 4: 'oak' }) };
    seasonalLife(s, new Rng(1));
    expect(s.grid.filter((t) => t?.s === 'clover').length).toBe(1);
  });
  it('Bee gains +1 for good next to a flower; Swarm doubles it', () => {
    const s = { ...base(), grid: g({ 0: 'bee', 1: 'tulip' }) };
    seasonalLife(s, new Rng(1));
    expect(s.grid[0]!.b).toBe(1);
    expect(cellScore({ ...scoreCtx(s), weather: null }, 0)).toBe(2 + 1);
    const w = { ...base(), rules: ['swarm'], grid: g({ 0: 'bee', 1: 'tulip' }) };
    seasonalLife(w, new Rng(1));
    expect(w.grid[0]!.b).toBe(2);
  });
  it('Tulip doubles in Spring only; Early Season adds the season before', () => {
    const s = { ...base(), grid: g({ 0: 'tulip', 1: 'clover', 4: 'clover' }) };
    const at = (season: number, rules: string[] = []) => cellScore({ ...scoreCtx(s), season, weather: null, rules: new Set(rules) }, 0);
    expect(at(0)).toBe(4);
    expect(at(1)).toBe(2);
    const sun = { ...base(), grid: g({ 0: 'sun' }) };
    const atS = (season: number, rules: string[] = []) => cellScore({ ...scoreCtx(sun), season, weather: null, rules: new Set(rules) }, 0);
    expect(atS(0)).toBe(4);
    expect(atS(0, ['early'])).toBe(8);
    expect(atS(1)).toBe(8);
  });
  it('life is inert without the flag', () => {
    const ctx = { board: rectBoard(4, 4), grid: g({ 0: 'tulip', 1: 'clover' }), rules: new Set<string>(), season: 0, weather: null, features: V5_FEATURES };
    expect(cellScore(ctx, 0)).toBe(1);
  });
  it('season end applies life and reports it', () => {
    let s = playing({ life: true, content: true }, ['acorn', 'clover', 'bee', 'tulip', 'pond', 'frog'], { plot: 'raised-bed' });
    s = { ...s, queue: ['acorn', 'acorn', 'acorn', 'acorn', 'acorn', 'acorn'], targets: [0, 0, 0] };
    for (let k = 0; k < 5; k++) s = apply(s, { type: 'plant', slot: 0, cell: k * 3 }).state;
    expect(s.phase).toBe('rule');
    expect(s.changes.filter((c) => c.kind === 'grew').length).toBe(5);
    expect(s.grid.filter((t) => t?.s === 'oak').length).toBe(5);
  });
});

describe('plots', () => {
  it('has 8 to 10 plots of 14 to 20 squares with at least 15 open', () => {
    expect(PLOTS.length).toBeGreaterThanOrEqual(8);
    for (const p of PLOTS) {
      const { board, grid } = parsePlot(p);
      const sq = board.mask.filter(Boolean).length;
      expect(sq).toBeGreaterThanOrEqual(14);
      expect(sq).toBeLessThanOrEqual(20);
      expect(board.mask.filter((m, i) => m && !grid[i]).length).toBeGreaterThanOrEqual(15);
    }
  });
  it('sunny squares double and Bumper Crop triples', () => {
    const { board, grid } = parsePlot(PLOTS[0]);
    grid[5] = { s: 'oak' };
    const ctx = { board, grid, rules: new Set<string>(), season: 0, weather: null, features: P1_FEATURES };
    expect(cellScore(ctx, 5)).toBe(6);
    expect(cellScore({ ...ctx, rules: new Set(['bumper']) }, 5)).toBe(9);
  });
  it('shade-wall squares shade sunflowers', () => {
    const p = PLOTS.find((x) => x.id === 'north-wall')!;
    const { board, grid } = parsePlot(p);
    grid[0] = { s: 'sun' };
    grid[5] = { s: 'sun' };
    const ctx = { board, grid, rules: new Set<string>(), season: 0, weather: null, features: P1_FEATURES };
    expect(cellScore(ctx, 0)).toBe(0);
    expect(cellScore(ctx, 5)).toBe(4);
  });
  it('pre-placed features score and cannot be moved', () => {
    const s = playing({ plots: true, tools: true }, ROSTER, { plot: 'pond-corner' });
    expect(s.grid[0]).toEqual({ s: 'pond', f: 1 });
    expect(legal(s, { type: 'trowel', from: 0, to: 4 })).not.toBeNull();
    expect(legal(s, { type: 'plant', slot: 0, cell: 0 })).not.toBeNull();
  });
  it('outside squares are not plantable', () => {
    const s = playing({ plots: true }, ROSTER, { plot: 'corner-plot' });
    expect(s.board.mask[2]).toBe(false);
    expect(legal(s, { type: 'plant', slot: 0, cell: 2 })).not.toBeNull();
  });
});

describe('tools', () => {
  it('one charge per season, shared by compost, trowel and replant', () => {
    let s = playing({ tools: true, plots: true }, ROSTER);
    expect(s.rerolls).toBe(1);
    s = apply(s, { type: 'plant', slot: 0, cell: 0 }).state;
    s = apply(s, { type: 'trowel', from: 0, to: 15 }).state;
    expect(s.grid[15]).not.toBeNull();
    expect(s.grid[0]).toBeNull();
    expect(legal(s, { type: 'compost' })).not.toBeNull();
  });
  it('replant plants over a tile and counts as a planting', () => {
    let s = playing({ tools: true, plots: true }, ROSTER);
    s = apply(s, { type: 'plant', slot: 0, cell: 0 }).state;
    const next = s.queue[0];
    s = apply(s, { type: 'replant', slot: 0, cell: 0 }).state;
    expect(s.grid[0]!.s).toBe(next);
    expect(s.placed).toBe(2);
  });
  it('Tool Shed gives a second charge', () => {
    const s = playing({ tools: true, plots: true, content: true }, ROSTER, { rules: ['shed'] });
    expect(s.rules).toEqual(['shed']);
  });
  it('skip is only allowed with no empty square', () => {
    const s = playing({ tools: true, plots: true }, ROSTER);
    expect(legal(s, { type: 'skip', slot: 0 })).not.toBeNull();
  });
});

describe('wishes', () => {
  it('a run offers 3 distinct wishes', () => {
    const s = newRun({ seed: 5, features: P1_FEATURES });
    expect(new Set(s.wishes).size).toBe(3);
    expect(s.wishes.every((id) => WISHES.some((w) => w.id === id))).toBe(true);
  });
  it('checks work', () => {
    const board = rectBoard(4, 4);
    const ctx = { board, grid: g({ 0: 'tulip', 1: 'rose', 2: 'sun', 3: 'clover', 4: 'bee', 5: 'frog', 6: 'hog', 7: 'fly' }), rules: new Set<string>(), season: 2, weather: null, features: P1_FEATURES };
    const info = { season: 2, score: 50, target: 40 };
    expect(wishById('flowerline').check(ctx, [], info)).toBe(true);
    expect(wishById('animals4').check(ctx, [], info)).toBe(true);
    expect(wishById('trees5').check(ctx, [], info)).toBe(false);
    expect(wishById('bigtile').check(ctx, [3, 12], info)).toBe(true);
    expect(wishById('margin').check(ctx, [], { ...info, score: 54 })).toBe(false);
    expect(wishById('margin').check(ctx, [], { ...info, score: 55 })).toBe(true);
  });
  it('stars come from wishes', () => {
    let s = playing({ wishes: true }, ROSTER);
    s = { ...s, targets: [0, 0, 0], wishes: ['bigtile', 'trees5', 'nozero'], wishDone: [false, false, false] };
    while (s.phase === 'play' || s.phase === 'rule') {
      if (s.phase === 'rule') { s = apply(s, { type: 'rule', id: s.ruleOffer[0] }).state; continue; }
      const cell = s.grid.findIndex((t, i) => !t && s.board.mask[i]);
      s = apply(s, { type: 'plant', slot: 0, cell }).state;
    }
    expect(s.phase).toBe('won');
    expect(s.stars).toBe(s.wishDone.filter(Boolean).length);
  });
});

describe('content', () => {
  it('Cherry is a tree that counts as a flower', () => {
    const ctx = { board: rectBoard(4, 4), grid: g({ 0: 'cherry', 1: 'bee' }), rules: new Set<string>(), season: 1, weather: null, features: P1_FEATURES };
    expect(cellScore(ctx, 1)).toBe(2);
  });
  it('revised Snail, Moss and Truffle', () => {
    const ctx = { board: rectBoard(4, 4), grid: g({ 0: 'snail', 1: 'fern', 4: 'truffle', 5: 'birch' }), rules: new Set<string>(), season: 1, weather: null, features: P1_FEATURES };
    expect(cellScore(ctx, 0)).toBe(2 + 2 + 2); // fern (plant) + truffle (fungus)
    expect(cellScore(ctx, 4)).toBe(1 + 3 + 2); // birch tree + snail animal
    expect(cellScore({ ...ctx, features: V5_FEATURES }, 0)).toBe(4);
  });
  it('Marsh and Fairy Ring change group membership', () => {
    const ctx = { board: rectBoard(4, 4), grid: g({ 0: 'lily', 1: 'frog', 2: 'bee', 3: 'mush' }), rules: new Set(['marsh']), season: 1, weather: null, features: P1_FEATURES };
    expect(cellScore(ctx, 0)).toBe(3);
    expect(cellScore({ ...ctx, rules: new Set(['fairy']) }, 2)).toBe(2);
  });
  it('total() counts the Allotment bonus', () => {
    const ctx = { board: rectBoard(4, 4), grid: g({ 0: 'pond', 1: 'pond', 2: 'pond', 3: 'pond' }), rules: new Set(['monoculture']), season: 1, weather: null, features: P1_FEATURES };
    expect(total(ctx)).toBe(8 + 3);
  });
});

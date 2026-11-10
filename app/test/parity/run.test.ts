import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/v5.json';
import { apply, newRun, type Action, type RunState } from '../../src/core/run';

const flat = (s: RunState) => s.grid.map((t) => t?.s ?? null);

describe('v5 full-run parity', () => {
  it.each(fixtures.runs.map((r, n) => [n, r] as const))('run %i', (_n, run) => {
    let s = newRun({ seed: run.seed, daily: run.daily, rank: run.rank });
    for (const step of run.steps) {
      const a = step.action as { type: string; pick?: string; slot?: number; cell?: number } | null;
      if (a) {
        const act: Action =
          a.type === 'draft' ? { type: 'draft', id: a.pick! }
          : a.type === 'takeRule' ? { type: 'rule', id: a.pick! }
          : a.type === 'compost' ? { type: 'compost' }
          : { type: 'plant', slot: a.slot!, cell: a.cell! };
        s = apply(s, act).state;
      }
      const f = step.state;
      expect(s.phase).toBe(f.phase);
      expect(s.mods).toEqual(f.mods);
      expect(s.targets).toEqual(f.targets);
      expect(s.roster).toEqual(f.roster);
      expect(s.rules).toEqual(f.ruleList);
      expect(flat(s)).toEqual(f.grid);
      expect(s.queue).toEqual(f.queue);
      expect(s.results).toEqual(f.results);
      expect(s.banked).toBe(f.banked);
      expect(s.placed).toBe(f.placed);
      if (f.phase === 'draft') expect(s.offer).toEqual(f.offer);
      if (f.phase === 'rule') expect(s.ruleOffer).toEqual(f.ruleOffer);
      if (f.phase === 'play') expect(s.rerolls).toBe(f.rerolls);
      if (f.phase === 'won') expect(s.stars).toBe(f.stars);
    }
  });
});

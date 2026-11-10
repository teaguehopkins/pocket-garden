import { describe, expect, it } from 'vitest';
import { apply, legal, newRun, type Action, type RunState } from '../src/core/run';
import { emptyProfile, recordRun } from '../src/core/profile';
import { loadProfile, loadRun, saveRun, type KV } from '../src/persist';
import { P1_FEATURES } from '../src/core/types';
import fixtures from './parity/fixtures/v5.json';

export function memKV(): KV & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

/** A fixed, simple policy: first offer, first legal square. */
function nextAction(s: RunState): Action {
  if (s.phase === 'draft') return { type: 'draft', id: s.offer[0] };
  if (s.phase === 'rule') return { type: 'rule', id: s.ruleOffer[0] };
  const cell = s.grid.findIndex((t, i) => !t && s.board.mask[i]);
  if (cell < 0) return { type: 'skip', slot: 0 };
  return { type: 'plant', slot: s.placed % 2, cell };
}

function playOut(s: RunState, kv?: KV, stopAt = Infinity): RunState {
  let n = 0;
  while ((s.phase === 'draft' || s.phase === 'rule' || s.phase === 'play') && n++ < stopAt) {
    const a = nextAction(s);
    expect(legal(s, a)).toBeNull();
    s = apply(s, a).state;
    if (kv) saveRun(kv, s);
  }
  return s;
}

describe('save and resume', () => {
  for (const [label, features] of [['v5', undefined], ['phase 1', P1_FEATURES]] as const) {
    it(`a run resumed from a save ends identically (${label})`, () => {
      const straight = playOut(newRun({ seed: 4242, features }));
      const kv = memKV();
      playOut(newRun({ seed: 4242, features }), kv, 10);
      const resumed = loadRun(kv)!;
      expect(resumed).not.toBeNull();
      expect(resumed.phase).toBe('play');
      expect(playOut(resumed)).toEqual(straight);
    });
  }

  it('same seed and actions give the same state', () => {
    expect(playOut(newRun({ seed: 7, rank: 6 }))).toEqual(playOut(newRun({ seed: 7, rank: 6 })));
  });

  it('drops unreadable or old saves', () => {
    const kv = memKV();
    kv.setItem('pg3-run', '{nope');
    expect(loadRun(kv)).toBeNull();
    kv.setItem('pg3-run', JSON.stringify({ v: 0, state: {} }));
    expect(loadRun(kv)).toBeNull();
  });

  it('migrates the v5 profile once', () => {
    const kv = memKV();
    kv.setItem('pg2-profile', JSON.stringify({ runs: 9, years: 4, best: 210, rank: 5, stars: 7 }));
    expect(loadProfile(kv)).toMatchObject({ runs: 9, years: 4, best: 210, rank: 5, stars: 7 });
    kv.setItem('pg2-profile', JSON.stringify({ runs: 99 }));
    expect(loadProfile(kv).runs).toBe(9);
  });
});

describe('v5 profile parity', () => {
  it.each(fixtures.runs.map((r, n) => [n, r] as const))('run %i', (_n, run) => {
    const last = run.steps.at(-1)!.state;
    const s = { phase: last.phase, stars: last.stars, banked: last.banked, seed: run.seed, daily: run.daily } as RunState;
    const p = recordRun({ ...emptyProfile(), rank: run.rank }, s).profile;
    expect({ runs: p.runs, years: p.years, best: p.best, rank: p.rank, stars: p.stars }).toEqual(run.profile);
  });
});

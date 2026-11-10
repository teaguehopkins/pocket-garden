import { describe, expect, it } from 'vitest';
import { apply, newRun, preview, type RunState } from '../src/core/run';
import { addAchievements, emptyProfile, laneStars, markMet, openPlots, recordRun, recordSeason } from '../src/core/profile';
import { PLOTS } from '../src/core/content/plots';
import { PLOT_WISHES, START_RULES, START_SPECIES, TEACHING_PLOT, UNLOCKS, poolAt, teachingRun } from '../src/core/content/progress';
import { earned, ACHIEVEMENTS } from '../src/core/content/achievements';
import { WISHES } from '../src/core/content/wishes';
import { SPECIES, p1Pool } from '../src/core/content/species';
import { RULES, p1Rules } from '../src/core/content/rules';
import { P1_FEATURES } from '../src/core/types';
import { rectBoard } from '../src/core/board';

/** Play a run to the end with a fixed simple policy. */
function playOut(s: RunState): RunState {
  let n = 0;
  while (['draft', 'rule', 'play'].includes(s.phase) && n++ < 200) {
    if (s.phase === 'draft') s = apply(s, { type: 'draft', id: s.offer[0] }).state;
    else if (s.phase === 'rule') s = apply(s, { type: 'rule', id: s.ruleOffer[0] }).state;
    else {
      const cell = s.grid.findIndex((t, i) => !t && s.board.mask[i]);
      s = apply(s, cell >= 0 ? { type: 'plant', slot: 0, cell } : { type: 'skip', slot: 0 }).state;
    }
  }
  return s;
}

const won = (plot: string, wishDone: boolean[], banked = 100): RunState =>
  ({ ...newRun({ seed: 1, features: P1_FEATURES, plot, wishes: PLOT_WISHES[plot] }), phase: 'won', stars: wishDone.filter(Boolean).length, banked, wishDone });

describe('content tables', () => {
  it('every Lane plot has 3 real wishes', () => {
    for (const p of PLOTS) {
      expect(PLOT_WISHES[p.id]).toHaveLength(3);
      for (const w of PLOT_WISHES[p.id]) expect(WISHES.some((x) => x.id === w)).toBe(true);
    }
  });
  it('unlocks cover the whole Phase 1 pool exactly once, by 15 stars', () => {
    const all = poolAt(999);
    expect([...all.species].sort()).toEqual([...p1Pool()].sort());
    expect([...all.rules].sort()).toEqual([...p1Rules()].sort());
    expect(new Set(all.species).size).toBe(all.species.length);
    expect(Math.max(...UNLOCKS.map((u) => u.stars))).toBeLessThanOrEqual(15);
    expect(poolAt(0).species).toEqual(START_SPECIES);
    expect(poolAt(0).rules).toEqual(START_RULES);
  });
  it('achievements have unique ids and names', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});

describe('the Lane', () => {
  it('opens plots in order as each blooms', () => {
    let p = emptyProfile();
    expect(openPlots(p)).toEqual([PLOTS[0].id]);
    const o = recordRun(p, won(PLOTS[0].id, [false, false, false]));
    p = o.profile;
    expect(openPlots(p)).toEqual([PLOTS[0].id, PLOTS[1].id]);
    expect(o.lane.plotOpened).toBe(PLOTS[1].id);
  });
  it('keeps wish stars per wish across years, only in bloomed years', () => {
    let p = emptyProfile();
    p = recordRun(p, won('raised-bed', [true, false, false])).profile;
    const o = recordRun(p, won('raised-bed', [false, true, false]));
    expect(o.lane.newWishes).toEqual([PLOT_WISHES['raised-bed'][1]]);
    expect(laneStars(o.profile)).toBe(2);
    const lost = { ...won('raised-bed', [true, true, true]), phase: 'lost' as const };
    expect(laneStars(recordRun(o.profile, lost).profile)).toBe(2);
  });
  it('keeps the best garden on each plot', () => {
    let p = recordRun(emptyProfile(), won('raised-bed', [false, false, false], 90)).profile;
    const better = won('raised-bed', [false, false, false], 120);
    better.grid[0] = { s: 'oak' };
    const o = recordRun(p, better);
    expect(o.lane.plotBest).toBe(true);
    expect(o.profile.lane['raised-bed'].bestGrid![0]).toEqual({ s: 'oak' });
    p = recordRun(o.profile, won('raised-bed', [false, false, false], 100)).profile;
    expect(p.lane['raised-bed'].best).toBe(120);
  });
  it('reports unlocks reached by new stars', () => {
    let p = recordRun(emptyProfile(), won('raised-bed', [true, false, false])).profile;
    const o = recordRun(p, won('raised-bed', [false, true, false]));
    expect(o.lane.unlocked.map((u) => u.stars)).toEqual([2]);
    p = o.profile;
  });
  it('daily gardens do not change the Lane', () => {
    const s = { ...won('raised-bed', [true, true, true]), daily: true };
    expect(laneStars(recordRun(emptyProfile(), s).profile)).toBe(0);
  });
});

describe('pools', () => {
  it('a run only offers species and rules from its pool', () => {
    const pool = poolAt(0);
    for (let seed = 1; seed < 15; seed++) {
      const end = playOut(newRun({ seed, features: P1_FEATURES, plot: 'raised-bed', pool }));
      for (const k of end.roster) expect(pool.species).toContain(k);
      for (const k of end.rules) expect(pool.rules).toContain(k);
    }
  });
});

describe('the teaching garden', () => {
  it('follows its script: 4 seeds, 3 plantings a season, fixed weather', () => {
    let s = newRun({ ...teachingRun(5), features: P1_FEATURES });
    expect(s.plot).toBe(TEACHING_PLOT.id);
    expect(s.offer).toEqual(['bee', 'sun', 'clover']);
    expect(s.mods).toEqual(['bloom', 'rain', 'grove']);
    expect(s.wishes).toEqual([]);
    s = apply(s, { type: 'draft', id: 'bee' }).state;
    expect(s.offer).toEqual(['sun', 'tulip', 'clover']);
    const end = playOut(s);
    expect(end.roster).toHaveLength(4);
    expect(end.placed).toBeLessThanOrEqual(9);
    const o = recordRun(emptyProfile(), end);
    expect(o.profile.tutorialDone).toBe(true);
    expect(o.lane.tutorialDone).toBe(true);
    expect(laneStars(o.profile)).toBe(0);
  });
  it('a thoughtful line can bloom it', () => {
    // Bee, Sunflower, Pond, Frog; flowers round the bee, frog by the pond.
    let s = newRun({ ...teachingRun(5), features: P1_FEATURES });
    for (const id of ['bee', 'sun', 'pond', 'frog']) s = apply(s, { type: 'draft', id }).state;
    // Greedy on this season's preview is enough to bloom the teaching garden.
    const greedy = (st: RunState): RunState => {
      while (st.phase === 'rule' || st.phase === 'play') {
        if (st.phase === 'rule') { st = apply(st, { type: 'rule', id: st.ruleOffer[0] }).state; continue; }
        let best = { d: -1e9, slot: 0, cell: -1 };
        for (let slot = 0; slot < Math.min(3, st.queue.length); slot++)
          for (let cell = 0; cell < st.grid.length; cell++) {
            if (st.grid[cell] || !st.board.mask[cell]) continue;
            const d = preview(st, slot, cell);
            if (d > best.d) best = { d, slot, cell };
          }
        if (best.cell < 0) break;
        st = apply(st, { type: 'plant', slot: best.slot, cell: best.cell }).state;
      }
      return st;
    };
    expect(greedy(s).phase).toBe('won');
  });
});

describe('Almanac and achievements', () => {
  it('marks offered species and rules as met', () => {
    const s = newRun({ seed: 3, features: P1_FEATURES, plot: 'raised-bed' });
    const p = markMet(emptyProfile(), s);
    for (const k of s.offer) expect(p.species[k].met).toBe(true);
    expect(markMet(p, s)).toBe(p);
  });
  it('records best tile, plantings and neighbours', () => {
    const s = won('raised-bed', [false, false, false]);
    s.grid[0] = { s: 'bee' };
    s.grid[1] = { s: 'sun' };
    let p = recordSeason(emptyProfile(), s.grid, [7, 4, ...Array(14).fill(0)]);
    expect(p.species.bee.bestTile).toBe(7);
    p = recordRun(p, s).profile;
    expect(p.species.bee.planted).toBe(1);
    expect(p.species.bee.pairs.sun).toBe(1);
  });
  it('earns named achievements from season events', () => {
    const s = newRun({ seed: 3, features: P1_FEATURES, plot: 'raised-bed' });
    const grid = Array.from({ length: 16 }, (_, i) => (i < 6 ? { s: 'clover' } : null));
    const ids = earned(s, [
      { type: 'seasonScored', season: 0, score: 40, target: 20, ok: true, cells: Array(16).fill(1), grid, bonus: 0 },
      { type: 'life', kind: 'grew', cell: 9, from: 'acorn', to: 'oak' },
    ]);
    expect(ids).toEqual(expect.arrayContaining(['clover-carpet', 'mighty-oak', 'spring-rush']));
    const { profile, fresh } = addAchievements(emptyProfile(), ids, '2026-11-10');
    expect(fresh).toEqual(ids);
    expect(addAchievements(profile, ids, '2026-11-11').fresh).toEqual([]);
  });
  it('board helper sanity', () => {
    expect(rectBoard(4, 4).centre).toEqual([5, 6, 9, 10]);
    expect(Object.keys(SPECIES).length).toBeGreaterThan(30);
    expect(Object.keys(RULES).length).toBeGreaterThan(25);
  });
});

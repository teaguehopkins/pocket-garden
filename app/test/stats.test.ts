import { describe, expect, it } from 'vitest';
import { BREAK_MS, appendLog, LOG_MAX, logEntry, modeOf, newMeta, summarize, tick, type LogEntry } from '../src/core/stats';
import { newRun } from '../src/core/run';
import { teachingRun, PLOT_WISHES, poolAt } from '../src/core/content/progress';
import { P1_FEATURES } from '../src/core/types';
import { exportStats, importStats } from '../src/savecode';

const entry = (o: Partial<LogEntry>): LogEntry => ({
  d: '2026-11-10', mode: 'lane', plot: 'raised-bed', won: true, results: [30, 60, 90], targets: [22, 54, 82],
  roster: ['bee', 'sun'], rules: ['pollin'], wishes: ['flowerline', 'animals4', 'full'], wishDone: [true, false, false],
  ms: 6 * 60000, breaks: 1, tools: { compost: 1, trowel: 0, replant: 0 }, f: '111111', ...o,
});

describe('run timing', () => {
  it('counts active time and treats long gaps as put-downs', () => {
    let m = newMeta(0);
    m = tick(m, 30_000);
    m = tick(m, 60_000);
    m = tick(m, 60_000 + BREAK_MS + 1);
    m = tick(m, 60_000 + BREAK_MS + 1 + 10_000);
    expect(m.ms).toBe(70_000);
    expect(m.breaks).toBe(1);
  });
});

describe('log entries', () => {
  it('know the mode of a run', () => {
    expect(modeOf(newRun({ ...teachingRun(1), features: P1_FEATURES }))).toBe('teach');
    expect(modeOf(newRun({ seed: 1, daily: true, features: P1_FEATURES }))).toBe('daily');
    expect(modeOf(newRun({ seed: 1, features: P1_FEATURES, plot: 'brook', shared: true }))).toBe('friend');
    expect(modeOf(newRun({ seed: 1, features: P1_FEATURES, plot: 'brook', pool: poolAt(0), wishes: PLOT_WISHES.brook }))).toBe('lane');
    expect(modeOf(newRun({ seed: 1, features: P1_FEATURES }))).toBe('lab');
  });
  it('record a finished run', () => {
    const s = { ...newRun({ seed: 1, features: P1_FEATURES, plot: 'brook', pool: poolAt(0) }), phase: 'lost' as const, results: [10] };
    const e = logEntry(s, { ...newMeta(0), ms: 1234.4, breaks: 2 }, '2026-11-10');
    expect(e).toMatchObject({ mode: 'lane', plot: 'brook', won: false, results: [10], ms: 1234, breaks: 2, f: '111111' });
  });
  it('keep at most LOG_MAX entries', () => {
    let log: LogEntry[] = [];
    for (let i = 0; i < LOG_MAX + 5; i++) log = appendLog(log, entry({ d: String(i) }));
    expect(log).toHaveLength(LOG_MAX);
    expect(log[0].d).toBe('5');
  });
});

describe('summaries', () => {
  it('pool gardens by plot, season, species, rule and wish', () => {
    const s = summarize([
      entry({}),
      entry({ won: false, results: [10], ms: 2 * 60000 }),
      entry({ won: false, results: [30, 40], ms: 14 * 60000, plot: 'brook' }),
      entry({ mode: 'daily', plot: 'brook', ms: 0 }),
    ]);
    expect(s.gardens).toBe(4);
    expect(s.bloomed).toBe(2);
    expect(s.wilted).toEqual([1, 1, 0]);
    expect(s.medianMinutes).toBe(6);
    expect(s.under10).toBeCloseTo(2 / 3);
    expect(s.byPlot['raised-bed']).toMatchObject({ n: 2, won: 1, best: 180, margin: [8] });
    expect(s.byPlot.brook).toMatchObject({ n: 1, won: 0 });
    expect(s.species.bee).toEqual({ n: 4, won: 2 });
    expect(s.wishes.flowerline).toEqual({ offered: 4, granted: 2 });
    expect(s.byMode.daily).toEqual({ n: 1, won: 1 });
  });
  it('handle no gardens', () => {
    expect(summarize([])).toMatchObject({ gardens: 0, medianMinutes: null, under10: null });
  });
});

describe('stats codes', () => {
  it('round-trip', async () => {
    const log = [entry({}), entry({ won: false })];
    const code = await exportStats(log);
    expect(code.startsWith('PGS1.')).toBe(true);
    expect(await importStats(`Here are my stats:\n${code}`.split('\n')[1])).toEqual(log);
  });
});

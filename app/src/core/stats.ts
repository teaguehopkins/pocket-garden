// Play stats kept on the device: one small entry per finished garden, and summaries of them.
// Nothing is sent anywhere; players can copy their stats to share by choice.
import type { RunState } from './run';

export type Mode = 'lane' | 'daily' | 'friend' | 'teach' | 'lab';

/** Timing and tool use for a run, kept by the UI alongside the run state. */
export interface RunMeta {
  /** active play time in ms (gaps over BREAK_MS don't count) */
  ms: number;
  /** times the garden was put down: long gaps or reopening the app mid-run */
  breaks: number;
  /** epoch ms of the last action */
  last: number;
  tools: { compost: number; trowel: number; replant: number };
}

export const BREAK_MS = 120_000;
export const LOG_MAX = 300;

export const newMeta = (now: number): RunMeta => ({ ms: 0, breaks: 0, last: now, tools: { compost: 0, trowel: 0, replant: 0 } });

/** Account for the time since the last action. */
export function tick(m: RunMeta, now: number): RunMeta {
  const dt = Math.max(0, now - m.last);
  return dt > BREAK_MS ? { ...m, breaks: m.breaks + 1, last: now } : { ...m, ms: m.ms + dt, last: now };
}

export interface LogEntry {
  /** date finished, YYYY-MM-DD */
  d: string;
  mode: Mode;
  plot: string | null;
  won: boolean;
  results: number[];
  targets: number[];
  roster: string[];
  rules: string[];
  wishes: string[];
  wishDone: boolean[];
  ms: number;
  breaks: number;
  tools: RunMeta['tools'];
  /** feature flags as a 6-character 0/1 string (bag, life, plots, tools, wishes, content) */
  f: string;
}

export function modeOf(s: RunState): Mode {
  if (s.plot === 'window-box') return 'teach';
  if (s.daily) return 'daily';
  if (s.shared) return 'friend';
  if (s.pool) return 'lane';
  return 'lab';
}

export function logEntry(s: RunState, m: RunMeta | undefined, date: string): LogEntry {
  const f = (['bag', 'life', 'plots', 'tools', 'wishes', 'content'] as const).map((k) => (s.features[k] ? '1' : '0')).join('');
  return {
    d: date, mode: modeOf(s), plot: s.plot, won: s.phase === 'won', results: [...s.results], targets: [...s.targets],
    roster: [...s.roster], rules: [...s.rules], wishes: [...s.wishes], wishDone: [...s.wishDone],
    ms: Math.round(m?.ms ?? 0), breaks: m?.breaks ?? 0, tools: { ...(m?.tools ?? { compost: 0, trowel: 0, replant: 0 }) }, f,
  };
}

export const appendLog = (log: LogEntry[], e: LogEntry) => [...log, e].slice(-LOG_MAX);

export interface Rate {
  n: number;
  won: number;
}
export interface Summary {
  gardens: number;
  bloomed: number;
  /** median active minutes per finished garden */
  medianMinutes: number | null;
  /** share of gardens finished in 10 minutes or less of active play */
  under10: number | null;
  breaksPerGarden: number;
  /** season where gardens wilted: [Spring, Summer, Autumn] */
  wilted: [number, number, number];
  byMode: Record<string, Rate>;
  byPlot: Record<string, Rate & { best: number; margin: number[] }>;
  species: Record<string, Rate>;
  rules: Record<string, Rate>;
  wishes: Record<string, { offered: number; granted: number }>;
  toolsPerGarden: { compost: number; trowel: number; replant: number };
  firstDay: string | null;
  lastDay: string | null;
}

const bump = (m: Record<string, Rate>, k: string, won: boolean) => {
  const r = (m[k] ??= { n: 0, won: 0 });
  r.n++;
  if (won) r.won++;
};
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const k = Math.floor(s.length / 2);
  return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2;
};

export function summarize(log: LogEntry[]): Summary {
  const s: Summary = {
    gardens: log.length, bloomed: 0, medianMinutes: null, under10: null, breaksPerGarden: 0, wilted: [0, 0, 0],
    byMode: {}, byPlot: {}, species: {}, rules: {}, wishes: {}, toolsPerGarden: { compost: 0, trowel: 0, replant: 0 },
    firstDay: log[0]?.d ?? null, lastDay: log.at(-1)?.d ?? null,
  };
  if (!log.length) return s;
  const timed = log.filter((e) => e.ms > 0).map((e) => e.ms / 60000);
  s.medianMinutes = median(timed);
  s.under10 = timed.length ? timed.filter((m) => m <= 10).length / timed.length : null;
  for (const e of log) {
    if (e.won) s.bloomed++;
    else s.wilted[Math.min(2, Math.max(0, e.results.length - 1))]++;
    s.breaksPerGarden += e.breaks / log.length;
    bump(s.byMode, e.mode, e.won);
    if (e.plot && e.mode === 'lane') {
      const p = (s.byPlot[e.plot] ??= { n: 0, won: 0, best: 0, margin: [] });
      p.n++;
      if (e.won) {
        p.won++;
        p.best = Math.max(p.best, e.results.reduce((a, b) => a + b, 0));
      }
      if (e.results.length === 3) p.margin.push(e.results[2] - e.targets[2]);
    }
    for (const k of e.roster) bump(s.species, k, e.won);
    for (const k of e.rules) bump(s.rules, k, e.won);
    e.wishes.forEach((w, i) => {
      const r = (s.wishes[w] ??= { offered: 0, granted: 0 });
      r.offered++;
      if (e.won && e.wishDone[i]) r.granted++;
    });
    for (const t of ['compost', 'trowel', 'replant'] as const) s.toolsPerGarden[t] += e.tools[t] / log.length;
  }
  return s;
}

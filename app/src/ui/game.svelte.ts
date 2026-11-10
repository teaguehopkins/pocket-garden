import { apply, newRun, type Action, type LifeChange, type RunEvent, type RunState } from '../core/run';
import { recordRun, type Profile } from '../core/profile';
import { PLOTS } from '../core/content/plots';
import { total } from '../core/score';
import { P1_FEATURES, V5_FEATURES, type Features, type Grid } from '../core/types';
import { loadProfile, loadRun, requestPersistence, saveProfile, saveRun, type KV } from '../persist';
import { sfx } from './sound';

const kv: KV = (() => {
  try {
    return window.localStorage;
  } catch {
    const m = new Map<string, string>();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
  }
})();

const FEATURES_KEY = 'pg3-features';
export const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

function loadFeatures(): Features {
  try {
    const f = JSON.parse(kv.getItem(FEATURES_KEY) ?? 'null');
    if (f && typeof f === 'object') return { ...V5_FEATURES, ...f };
  } catch { /* default */ }
  return { ...(PLOTS.length ? P1_FEATURES : V5_FEATURES) };
}

export type ToolMode = null | 'trowel' | 'replant';
export type SheetKind = null | 'rules' | 'weather' | 'wishes' | 'bag' | 'guide' | 'settings' | { species: string };

/** Everything the season-end tally needs to replay what happened. */
export interface Tally {
  season: number;
  score: number;
  target: number;
  ok: boolean;
  grid: Grid;
  cells: number[];
  bonus: number;
  rules: { id: string; delta: number }[];
  life: LifeChange[];
  gridAfter: Grid;
  wishes: string[];
  ended: boolean;
}

class Game {
  run = $state.raw<RunState | null>(null);
  profile = $state.raw<Profile>(loadProfile(kv));
  sel = $state<number | null>(null);
  tool = $state<ToolMode>(null);
  trowelFrom = $state<number | null>(null);
  events = $state.raw<RunEvent[]>([]);
  rankUp = $state<number | null>(null);
  newBest = $state(false);
  note = $state('');
  features = $state<Features>(loadFeatures());
  tally = $state.raw<Tally | null>(null);
  sheet = $state<SheetKind>(null);
  /** bumps on every planting so the board can replay the sprout animation */
  plantTick = $state(0);
  /** drag-to-plant: square under the finger */
  dragOver = $state<number | null>(null);

  constructor() {
    const saved = loadRun(kv);
    if (saved) this.run = saved;
    else this.start(Math.floor(Math.random() * 1e8), false);
    void requestPersistence();
  }

  setFeatures(f: Features) {
    this.features = f;
    try { kv.setItem(FEATURES_KEY, JSON.stringify(f)); } catch { /* ignore */ }
  }

  start(seed: number, daily: boolean) {
    const f = $state.snapshot(this.features);
    const plot = f.plots && PLOTS.length ? (daily ? undefined : PLOTS[(this.profile.rank - 1) % PLOTS.length].id) : undefined;
    this.run = newRun({ seed, daily, rank: this.profile.rank, features: f, plot });
    this.sel = null;
    this.tool = null;
    this.trowelFrom = null;
    this.events = [];
    this.rankUp = null;
    this.newBest = false;
    this.note = '';
    this.tally = null;
    this.sheet = null;
    saveRun(kv, this.run);
  }

  select(i: number | null) {
    this.sel = i;
    if (i !== null) sfx.select();
  }

  act(a: Action) {
    if (!this.run) return;
    sfx.unlock();
    const prev = this.run;
    const { state, events } = apply(prev, a);
    this.run = state;
    this.events = events;
    this.sel = null;
    this.tool = null;
    this.trowelFrom = null;
    if (a.type === 'plant' || a.type === 'replant') { sfx.plant(); this.plantTick++; }
    else if (a.type === 'draft' || a.type === 'rule') sfx.draft();
    else if (a.type === 'compost' || a.type === 'trowel') sfx.tool();
    const scored = events.find((e) => e.type === 'seasonScored');
    if (scored && scored.type === 'seasonScored') this.tally = buildTally(prev, state, events, scored);
    if (events.some((e) => e.type === 'runEnded')) {
      const o = recordRun(this.profile, state);
      this.profile = o.profile;
      this.rankUp = o.rankUp;
      this.newBest = o.newBest;
      saveProfile(kv, o.profile);
    }
    saveRun(kv, state);
  }

  closeTally() {
    this.tally = null;
  }
}

function buildTally(prev: RunState, s: RunState, events: RunEvent[], e: Extract<RunEvent, { type: 'seasonScored' }>): Tally {
  const ctx = { board: s.board, grid: e.grid, rules: new Set(prev.rules), season: e.season, weather: prev.mods[e.season], features: s.features };
  const rules = prev.rules
    .map((id) => {
      const without = new Set(prev.rules.filter((r) => r !== id));
      return { id, delta: total(ctx) - total({ ...ctx, rules: without }) };
    })
    .filter((r) => r.delta !== 0);
  return {
    season: e.season, score: e.score, target: e.target, ok: e.ok, grid: e.grid, cells: e.cells, bonus: e.bonus, rules,
    life: events.flatMap((x) => (x.type === 'life' ? [x as LifeChange] : [])),
    gridAfter: s.grid,
    wishes: events.flatMap((x) => (x.type === 'wish' ? [x.id] : [])),
    ended: events.some((x) => x.type === 'runEnded'),
  };
}

export const game = new Game();

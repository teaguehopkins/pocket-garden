import { apply, newRun, type Action, type RunEvent, type RunState } from '../core/run';
import { recordRun, type Profile } from '../core/profile';
import { PLOTS } from '../core/content/plots';
import { P1_FEATURES, V5_FEATURES, type Features } from '../core/types';
import { loadProfile, loadRun, requestPersistence, saveProfile, saveRun, type KV } from '../persist';

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
    saveRun(kv, this.run);
  }

  act(a: Action) {
    if (!this.run) return;
    const { state, events } = apply(this.run, a);
    this.run = state;
    this.events = events;
    this.sel = null;
    this.tool = null;
    this.trowelFrom = null;
    if (events.some((e) => e.type === 'runEnded')) {
      const o = recordRun(this.profile, state);
      this.profile = o.profile;
      this.rankUp = o.rankUp;
      this.newBest = o.newBest;
      saveProfile(kv, o.profile);
    }
    saveRun(kv, state);
  }
}

export const game = new Game();

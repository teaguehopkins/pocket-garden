import { apply, newRun, type Action, type LifeChange, type RunEvent, type RunState } from '../core/run';
import { addAchievements, currentPool, laneStars, markMet, recordRun, recordSeason, type LaneChange, type Profile } from '../core/profile';
import { PLOT_WISHES, poolAt, teachingRun } from '../core/content/progress';
import { decodeLink, type GardenLink } from '../core/link';
import type { SaveBundle } from '../savecode';
import { appendLog, logEntry, newMeta, tick } from '../core/stats';
import { earned } from '../core/content/achievements';
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
export type View = 'lane' | 'run' | 'almanac' | 'stats';
const live = (r: RunState | null) => !!r && (r.phase === 'draft' || r.phase === 'rule' || r.phase === 'play');
export const isLive = live;
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
  /** achievements first earned this season */
  achievements: string[];
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
  view = $state<View>('lane');
  /** what changed on the Lane after the last finished year */
  lane = $state.raw<LaneChange | null>(null);
  /** achievements earned during the current run */
  runAchievements = $state<string[]>([]);
  /** a friend's garden opened from a link, waiting to be played */
  challenge = $state.raw<GardenLink | null>(null);
  /** the friend's garden the current run is replaying */
  playingChallenge = $state.raw<GardenLink | null>(null);
  /** drag-to-plant: square under the finger */
  dragOver = $state<number | null>(null);

  constructor() {
    let saved = loadRun(kv);
    // Reopening the app mid-garden counts as one put-down.
    if (live(saved)) {
      saved = { ...saved!, meta: { ...(saved!.meta ?? newMeta(Date.now())), breaks: (saved!.meta?.breaks ?? 0) + 1, last: Date.now() } };
      saveRun(kv, saved);
    }
    if (saved) this.run = saved;
    this.challenge = readLinkFromUrl();
    if (live(saved)) this.view = this.challenge ? 'lane' : 'run';
    else if (!this.profile.tutorialDone && !this.challenge) this.startTeaching();
    void requestPersistence();
  }

  setFeatures(f: Features) {
    this.features = f;
    try { kv.setItem(FEATURES_KEY, JSON.stringify(f)); } catch { /* ignore */ }
  }

  private begin(r: RunState) {
    r = { ...r, meta: newMeta(Date.now()) };
    this.run = r;
    this.sel = null;
    this.tool = null;
    this.trowelFrom = null;
    this.events = [];
    this.rankUp = null;
    this.newBest = false;
    this.note = '';
    this.tally = null;
    this.sheet = null;
    this.lane = null;
    this.runAchievements = [];
    this.playingChallenge = null;
    this.view = 'run';
    this.profile = markMet(this.profile, r);
    saveProfile(kv, this.profile);
    saveRun(kv, r);
  }

  /** A garden on a Lane plot (or a plain bed when plots are switched off in the Lab). */
  startPlot(plot: string, seed = Math.floor(Math.random() * 1e8)) {
    const f = $state.snapshot(this.features);
    this.begin(newRun({
      seed, rank: this.profile.rank, features: f,
      plot: f.plots ? plot : undefined,
      wishes: f.plots ? PLOT_WISHES[plot] : undefined,
      pool: f.content ? currentPool(this.profile) : undefined,
      poolStars: laneStars(this.profile),
    }));
  }

  /** Today's garden: the same for everyone, full pool, any plot. */
  startDaily(seed = today()) {
    this.begin(newRun({ seed, daily: true, features: $state.snapshot(this.features) }));
  }

  /** Play a friend's garden: same plot, seed, pool and rules; it doesn't touch the Lane. */
  startChallenge(l: GardenLink) {
    this.begin(newRun({
      seed: l.seed, daily: l.daily, features: l.features, shared: !l.daily,
      plot: l.plot ?? undefined,
      wishes: l.plot && l.features.plots ? PLOT_WISHES[l.plot] : undefined,
      pool: l.stars !== null ? poolAt(l.stars) : undefined,
      poolStars: l.stars ?? undefined,
    }));
    this.playingChallenge = l;
    this.challenge = null;
  }

  /** Replace everything with a restored save. */
  restore(b: SaveBundle) {
    this.profile = { ...b.profile };
    saveProfile(kv, this.profile);
    this.run = b.run;
    saveRun(kv, b.run);
    this.tally = null;
    this.sheet = null;
    this.lane = null;
    this.view = live(b.run) ? 'run' : 'lane';
  }

  startTeaching() {
    this.begin(newRun({ ...teachingRun(Math.floor(Math.random() * 1e8)), features: $state.snapshot(this.features) }));
  }

  /** Lab: a garden with no plot or pool limits. */
  start(seed: number, daily: boolean) {
    if (daily) return this.startDaily(seed);
    const f = $state.snapshot(this.features);
    this.begin(newRun({ seed, rank: this.profile.rank, features: f }));
  }

  replay() {
    const r = this.run;
    if (!r) return;
    if (r.daily) this.startDaily(r.seed);
    else if (r.plot === 'window-box') this.startTeaching();
    else if (this.playingChallenge) this.startChallenge(this.playingChallenge);
    else if (r.shared) this.startChallenge({ seed: r.seed, plot: r.plot, daily: false, stars: r.poolStars ?? null, features: r.features, score: 0, won: false });
    else if (r.plot) this.startPlot(r.plot, r.seed);
    else this.start(r.seed, false);
  }

  select(i: number | null) {
    this.sel = i;
    if (i !== null) sfx.select();
  }

  act(a: Action) {
    if (!this.run) return;
    sfx.unlock();
    const prev = this.run;
    const now = Date.now();
    const meta = tick(prev.meta ?? newMeta(now), now);
    if (a.type === 'compost' || a.type === 'trowel' || a.type === 'replant') meta.tools = { ...meta.tools, [a.type]: meta.tools[a.type] + 1 };
    const res = apply(prev, a);
    const state: RunState = { ...res.state, meta };
    const events = res.events;
    this.run = state;
    this.events = events;
    this.sel = null;
    this.tool = null;
    this.trowelFrom = null;
    if (a.type === 'plant' || a.type === 'replant') { sfx.plant(); this.plantTick++; }
    else if (a.type === 'draft' || a.type === 'rule') sfx.draft();
    else if (a.type === 'compost' || a.type === 'trowel') sfx.tool();
    let p = markMet(this.profile, state);
    const scored = events.find((e) => e.type === 'seasonScored');
    if (scored && scored.type === 'seasonScored') {
      this.tally = buildTally(prev, state, events, scored);
      p = recordSeason(p, scored.grid, scored.cells);
      const got = addAchievements(p, earned(state, events), new Date().toISOString().slice(0, 10));
      p = got.profile;
      if (got.fresh.length) {
        this.runAchievements = [...this.runAchievements, ...got.fresh];
        this.tally = { ...this.tally, achievements: got.fresh };
      }
    }
    if (events.some((e) => e.type === 'runEnded')) {
      const o = recordRun(p, state);
      p = { ...o.profile, log: appendLog(o.profile.log ?? [], logEntry(state, meta, new Date().toISOString().slice(0, 10))) };
      this.rankUp = o.rankUp;
      this.newBest = o.newBest;
      this.lane = o.lane;
    }
    if (p !== this.profile) {
      this.profile = p;
      saveProfile(kv, p);
    }
    saveRun(kv, state);
  }

  closeTally() {
    this.tally = null;
  }
}

/** A friend's garden from `?g=`, removed from the address bar once read. */
function readLinkFromUrl(): GardenLink | null {
  try {
    const params = new URLSearchParams(location.search);
    const code = params.get('g');
    if (!code) return null;
    params.delete('g');
    const q = params.toString();
    history.replaceState(null, '', location.pathname + (q ? `?${q}` : '') + location.hash);
    return decodeLink(code);
  } catch {
    return null;
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
    achievements: [],
  };
}

export const game = new Game();

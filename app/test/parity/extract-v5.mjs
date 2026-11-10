// Runs the real v5 prototype (prototypes/garden.html) headless in a Node vm and
// records scoring and full-run traces as fixtures for the engine parity tests.
// Usage: npm run fixtures
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, '../../../prototypes/garden.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

function loadPrototype() {
  const mem = new Map();
  const ctx = {
    document: { getElementById: () => ({ innerHTML: '' }) },
    localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)) },
    navigator: {},
    Math, JSON, Set, Array, Object, Date,
  };
  vm.createContext(ctx);
  vm.runInContext(
    script +
      `;globalThis.__api={get S(){return S},newRun,draft,takeRule,choose,place,reroll,cellScore,total,bonus,SP,RULES,MODS,profile,store,shelfN,aheadN};`,
    ctx,
  );
  return { api: ctx.__api, mem };
}

// Small deterministic LCG for picking fixture inputs (independent of the game RNG).
function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

const { api, mem } = loadPrototype();
const species = Object.keys(api.SP);
const rules = Object.keys(api.RULES);
const mods = Object.keys(api.MODS);

// (a) Scoring fixtures
const R = lcg(12345);
const boards = [];
for (let n = 0; n < 600; n++) {
  const grid = Array.from({ length: 16 }, () => {
    const x = R();
    if (x < 0.25) return null;
    if (x < 0.3) return 'rock';
    return species[Math.floor(R() * species.length)];
  });
  const rs = rules.filter(() => R() < 0.25);
  const season = Math.floor(R() * 3);
  const mod = mods[Math.floor(R() * mods.length)];
  const C = { mod, rules: new Set(rs), season };
  boards.push({
    grid, rules: rs, season, mod,
    cells: grid.map((_, i) => api.cellScore(grid, i, C)),
    bonus: api.bonus(grid, C),
    total: api.total(grid, C),
  });
}

// (b) Full scripted runs
const snap = () => {
  const S = api.S;
  return {
    phase: S.phase, season: S.season, offer: S.offer ? [...S.offer] : null,
    ruleOffer: S.ruleOffer ? [...S.ruleOffer] : null, roster: [...S.roster], ruleList: [...S.ruleList],
    queue: [...S.queue], grid: [...S.grid], results: [...S.results], rerolls: S.rerolls ?? null,
    placed: S.placed, banked: S.banked, stars: S.stars ?? null, mods: [...S.mods], targets: [...S.targets],
  };
};
const runs = [];
const P = lcg(999);
for (let n = 0; n < 80; n++) {
  const daily = n % 5 === 0;
  const seed = daily ? 20261101 + n : Math.floor(P() * 1e8);
  const rank = 1 + (n % 10);
  mem.clear();
  api.store.set('pg2-profile', { runs: 0, years: 0, best: 0, rank, stars: 0 });
  api.newRun(seed, daily);
  const steps = [{ action: null, state: snap() }];
  let guard = 0;
  while (!['won', 'lost'].includes(api.S.phase) && guard++ < 200) {
    const S = api.S;
    let action;
    if (S.phase === 'draft') { action = { type: 'draft', pick: S.offer[Math.floor(P() * 3)] }; api.draft(action.pick); }
    else if (S.phase === 'rule') { action = { type: 'takeRule', pick: S.ruleOffer[Math.floor(P() * 3)] }; api.takeRule(action.pick); }
    else if (S.rerolls && P() < 0.12) { action = { type: 'compost' }; api.reroll(); }
    else {
      let slot = Math.floor(P() * api.shelfN());
      const empties = S.grid.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0);
      let cell = empties[Math.floor(P() * empties.length)];
      if (n % 2 === 1) {
        // greedy: biggest immediate total
        const C = { mod: S.mods[Math.min(S.season, 2)], rules: S.rules, season: Math.min(S.season, 2) };
        let best = -Infinity;
        for (let s = 0; s < api.shelfN(); s++) for (const c of empties) {
          const g = [...S.grid]; g[c] = S.queue[s];
          const v = api.total(g, C);
          if (v > best) { best = v; slot = s; cell = c; }
        }
      }
      action = { type: 'plant', slot, cell };
      api.choose(slot); api.place(cell);
    }
    steps.push({ action, state: snap() });
  }
  runs.push({ seed, daily, rank, steps, profile: api.profile() });
}

mkdirSync(resolve(here, 'fixtures'), { recursive: true });
writeFileSync(resolve(here, 'fixtures/v5.json'), JSON.stringify({ boards, runs }));
const won = runs.filter((r) => r.steps.at(-1).state.phase === 'won').length;
console.log(`wrote ${boards.length} boards, ${runs.length} runs (${won} won)`);

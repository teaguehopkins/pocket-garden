// Set each plot's season targets so the greedy bot wins about `--greedy` of the time.
//   npm run sim:calibrate -- --n 600 --greedy 0.3 --write
// Greedy play ignores targets, so one run with zero targets gives the score
// distribution; targets are the same quantile q of each season's scores,
// with q searched so that the joint pass rate hits the goal.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulate, parseFeatures, type SimArgs } from './cli';
import { PLOTS } from '../src/core/content/plots';

const argv = process.argv.slice(2);
const get = (k: string, d: string) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : d;
};
const n = Number(get('n', '600'));
const goal = Number(get('greedy', '0.3'));
const features = parseFeatures(get('features', 'p1'));
const plots = features.plots ? PLOTS.map((p) => p.id) : ['*'];

const a: SimArgs = {
  n: n * plots.length, bots: ['greedy'], features, featureLabel: get('features', 'p1'),
  rank: 1, plots: features.plots ? plots : null, label: 'calibrate', out: false, species: false, seed0: 777,
  targets: Object.fromEntries(plots.map((p) => [p, [0, 0, 0]])),
};
const recs = await simulate(a);

const quant = (xs: number[], q: number) => {
  const s = [...xs].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))];
};

const found: Record<string, number[]> = {};
for (const p of plots) {
  const rs = recs.filter((r) => (r.plot ?? '*') === p).map((r) => r.results);
  let best: { q: number; t: number[]; rate: number } | null = null;
  for (let q = 0.05; q <= 0.95; q += 0.005) {
    const t = [0, 1, 2].map((k) => quant(rs.map((r) => r[k]), q));
    const rate = rs.filter((r) => r.every((x, k) => x >= t[k])).length / rs.length;
    if (!best || Math.abs(rate - goal) < Math.abs(best.rate - goal)) best = { q, t, rate };
  }
  found[p] = best!.t;
  console.log(`${p.padEnd(12)} targets ${best!.t.join('/')}  greedy ≈ ${Math.round(best!.rate * 100)}%  (season quantile ${best!.q.toFixed(2)})`);
}

if (argv.includes('--write') && features.plots) {
  const file = resolve(dirname(fileURLToPath(import.meta.url)), '../src/core/content/plots.ts');
  let src = readFileSync(file, 'utf8');
  for (const [p, t] of Object.entries(found)) {
    src = src.replace(new RegExp(`(id: '${p}',[^\\n]*targets: )\\[[^\\]]*\\]`), `$1[${t.join(', ')}]`);
  }
  writeFileSync(file, src);
  console.log('updated plots.ts');
}

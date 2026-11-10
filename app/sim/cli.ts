// Balance sims. Example:
//   npm run sim -- --n 1000 --bots random,greedy,planner --features v5 --label v5-baseline --out
// Prints win rate, score spread and skill gap (planner minus greedy win rate).

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { greedyBot, plannerBot, playRun, randomBot, type Bot } from './bots';
import { newRun } from '../src/core/run';
import { PLOTS } from '../src/core/content/plots';
import { P1_FEATURES, V5_FEATURES, type Features } from '../src/core/types';

export interface SimArgs {
  n: number;
  bots: string[];
  features: Features;
  featureLabel: string;
  rank: number;
  plots: string[] | null;
  label: string;
  out: boolean;
  species: boolean;
  seed0: number;
  /** override plot targets, e.g. for calibration: plotId -> targets */
  targets?: Record<string, number[]>;
}

export interface RunRecord {
  bot: string;
  plot: string | null;
  won: boolean;
  results: number[];
  targets: number[];
  stars: number;
  wishes: number;
  roster: string[];
  rules: string[];
}

export function parseFeatures(spec: string): Features {
  if (spec === 'v5') return { ...V5_FEATURES };
  if (spec === 'p1' || spec === 'all') return { ...P1_FEATURES };
  const f = { ...V5_FEATURES };
  for (const k of spec.split(',').filter(Boolean)) {
    if (!(k in f)) throw new Error(`unknown feature ${k}`);
    (f as Record<string, boolean>)[k] = true;
  }
  return f;
}

export function makeBot(name: string): Bot {
  if (name === 'random') return randomBot;
  if (name === 'greedy') return greedyBot;
  if (name === 'planner') return plannerBot();
  if (name === 'planner-lite') return { ...plannerBot({ width: 4, rollouts: 2, depth: 1 }), name: 'planner-lite' };
  throw new Error(`unknown bot ${name}`);
}

const seedFor = (seed0: number, i: number) => (Math.imul(i + 1, 0x9e3779b1) ^ seed0) >>> 0;

/** Run games [from, to) for one bot. */
export function simChunk(a: SimArgs, botName: string, from: number, to: number): RunRecord[] {
  const bot = makeBot(botName);
  const out: RunRecord[] = [];
  for (let i = from; i < to; i++) {
    const seed = seedFor(a.seed0, i) % 1e8;
    const plot = a.plots ? a.plots[i % a.plots.length] : undefined;
    let s = newRun({ seed, rank: a.rank, features: a.features, plot });
    const t = a.targets?.[plot ?? '*'];
    if (t) s = { ...s, targets: [...t] };
    const end = playRun(bot, s, seed ^ 0x1234567);
    out.push({
      bot: botName, plot: end.plot, won: end.phase === 'won', results: end.results, targets: end.targets,
      stars: end.stars ?? 0, wishes: end.wishDone.filter(Boolean).length, roster: end.roster, rules: end.rules,
    });
  }
  return out;
}

/** Run all games across worker threads. */
export async function simulate(a: SimArgs): Promise<RunRecord[]> {
  const jobs: [string, number, number][] = [];
  const chunk = Math.max(10, Math.ceil(a.n / (availableParallelism() * 2)));
  for (const b of a.bots) for (let i = 0; i < a.n; i += chunk) jobs.push([b, i, Math.min(a.n, i + chunk)]);
  const workers = Math.min(availableParallelism(), jobs.length);
  const results: RunRecord[] = [];
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (jobs.length) {
        const job = jobs.shift()!;
        results.push(...(await runInWorker(a, job)));
      }
    }),
  );
  return results;
}

function runInWorker(a: SimArgs, job: [string, number, number]): Promise<RunRecord[]> {
  return new Promise((res, rej) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { a, job }, execArgv: ['--import', 'tsx'] });
    w.once('message', res);
    w.once('error', rej);
  });
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
function quantile(xs: number[], q: number) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

export function report(a: SimArgs, recs: RunRecord[]): string {
  const lines: string[] = [];
  const by = (b: string, plot?: string | null) => recs.filter((r) => r.bot === b && (plot === undefined || r.plot === plot));
  const winRate = (rs: RunRecord[]) => rs.filter((r) => r.won).length / Math.max(1, rs.length);
  lines.push(`# Sim: ${a.label}`, '', `${a.n} runs per bot · features: ${a.featureLabel} · rank ${a.rank}${a.plots ? ` · plots: ${a.plots.join(', ')}` : ''}`, '');
  lines.push('| bot | win | clear Spring | clear Summer | Autumn p10 / median / p90 | avg stars | avg wishes |', '|---|---|---|---|---|---|---|');
  for (const b of a.bots) {
    const rs = by(b);
    const autumn = rs.filter((r) => r.results.length === 3).map((r) => r.results[2]);
    lines.push(`| ${b} | ${pct(winRate(rs))} | ${pct(rs.filter((r) => r.results.length >= 2 || r.won).length / rs.length)} | ${pct(rs.filter((r) => r.results.length >= 3).length / rs.length)} | ${quantile(autumn, 0.1)} / ${quantile(autumn, 0.5)} / ${quantile(autumn, 0.9)} | ${(rs.reduce((x, r) => x + r.stars, 0) / rs.length).toFixed(2)} | ${(rs.reduce((x, r) => x + r.wishes, 0) / rs.length).toFixed(2)} |`);
  }
  const plannerName = a.bots.find((b) => b.startsWith('planner'));
  if (plannerName && a.bots.includes('greedy')) {
    lines.push('', `**Skill gap (${plannerName} − greedy): ${Math.round((winRate(by(plannerName)) - winRate(by('greedy'))) * 100)} points**`);
  }
  if (a.plots && a.plots.length > 1) {
    lines.push('', '| plot | targets | ' + a.bots.join(' | ') + ' | gap |', '|---|---|' + a.bots.map(() => '---|').join('') + '---|');
    for (const p of a.plots) {
      const t = recs.find((r) => r.plot === p)?.targets ?? [];
      const wr = a.bots.map((b) => winRate(by(b, p)));
      const gap = plannerName && a.bots.includes('greedy') ? Math.round((winRate(by(plannerName, p)) - winRate(by('greedy', p))) * 100) : NaN;
      lines.push(`| ${p} | ${t.join('/')} | ${wr.map(pct).join(' | ')} | ${gap} |`);
    }
  }
  if (a.species) {
    lines.push('', '## Species (non-random bots): drafted share and win rate when drafted', '', '| species | drafted | win when drafted |', '|---|---|---|');
    const smart = recs.filter((r) => r.bot !== 'random');
    const ids = [...new Set(smart.flatMap((r) => r.roster))].sort();
    for (const id of ids) {
      const has = smart.filter((r) => r.roster.includes(id));
      lines.push(`| ${id} | ${pct(has.length / smart.length)} | ${pct(winRate(has))} |`);
    }
    lines.push('', '## Rules: taken share and win rate when taken', '', '| rule | taken | win when taken |', '|---|---|---|');
    const rids = [...new Set(smart.flatMap((r) => r.rules))].sort();
    for (const id of rids) {
      const has = smart.filter((r) => r.rules.includes(id));
      lines.push(`| ${id} | ${pct(has.length / smart.length)} | ${pct(winRate(has))} |`);
    }
  }
  return lines.join('\n');
}

function parseArgs(argv: string[]): SimArgs {
  const get = (k: string, d: string) => {
    const i = argv.indexOf(`--${k}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
  };
  const featureLabel = get('features', 'v5');
  const features = parseFeatures(featureLabel);
  const plotsArg = get('plots', features.plots ? 'all' : '');
  return {
    n: Number(get('n', '500')),
    bots: get('bots', 'random,greedy,planner').split(','),
    features,
    featureLabel,
    rank: Number(get('rank', '1')),
    plots: plotsArg ? (plotsArg === 'all' ? PLOTS.map((p) => p.id) : plotsArg.split(',')) : null,
    label: get('label', featureLabel),
    out: argv.includes('--out'),
    species: argv.includes('--species'),
    seed0: Number(get('seed', '20261110')),
    targets: get('targets', '') ? { '*': get('targets', '').split('/').map(Number) } : undefined,
  };
}

if (!isMainThread) {
  const { a, job } = workerData as { a: SimArgs; job: [string, number, number] };
  parentPort!.postMessage(simChunk(a, ...job));
} else if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const a = parseArgs(process.argv.slice(2));
  const t0 = Date.now();
  const recs = await simulate(a);
  const md = report(a, recs) + `\n\n_${((Date.now() - t0) / 1000).toFixed(0)}s_\n`;
  console.log(md);
  if (a.out) {
    const here = dirname(fileURLToPath(import.meta.url));
    const day = new Date().toISOString().slice(0, 10);
    const file = resolve(here, 'results', `${day}-${a.label}.md`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, md);
    console.log(`wrote ${file}`);
  }
}

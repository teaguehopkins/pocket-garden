// Combine stats codes from playtesters into one report.
//   npm run stats -- playtest/*.txt        (files containing pasted messages with PGS1. codes)
//   npm run stats -- PGS1.xxxx PGS1.yyyy   (codes directly)
// Each code becomes one player; results are pooled and listed per player.
import { readFileSync, existsSync } from 'node:fs';
import { importStats } from '../src/savecode';
import { summarize, type LogEntry, type Rate } from '../src/core/stats';
import { PLOTS } from '../src/core/content/plots';
import { SPECIES } from '../src/core/content/species';
import { RULES } from '../src/core/content/rules';
import { wishById } from '../src/core/content/wishes';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Pass files or PGS codes.');
  process.exit(1);
}
const codes: string[] = [];
for (const a of args) {
  const text = existsSync(a) ? readFileSync(a, 'utf8') : a;
  codes.push(...(text.match(/PGS[01]\.[A-Za-z0-9_-]+/g) ?? []));
}
const players: LogEntry[][] = [];
for (const c of codes) players.push(await importStats(c));
const all = players.flat();
const s = summarize(all);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const rateCell = (r: Rate) => `${r.won}/${r.n} (${pct(r.won, r.n)})`;

const out: string[] = [];
out.push(`# Playtest stats`, '', `${players.length} player(s), ${s.gardens} gardens, ${s.firstDay} to ${s.lastDay}`, '');
out.push(`- Bloomed: ${s.bloomed}/${s.gardens} (${pct(s.bloomed, s.gardens)})`);
out.push(`- Median active play: ${s.medianMinutes?.toFixed(1) ?? '—'} min; within 10 min: ${s.under10 !== null ? pct(s.under10, 1) : '—'}`);
out.push(`- Put-downs per garden: ${s.breaksPerGarden.toFixed(2)}`);
out.push(`- Wilted in Spring / Summer / Autumn: ${s.wilted.join(' / ')}`);
out.push(`- Tools per garden: compost ${s.toolsPerGarden.compost.toFixed(2)}, trowel ${s.toolsPerGarden.trowel.toFixed(2)}, replant ${s.toolsPerGarden.replant.toFixed(2)}`, '');
out.push('## Per player', '', '| player | gardens | bloomed | median min | first → last |', '|---|---|---|---|---|');
players.forEach((log, i) => {
  const p = summarize(log);
  out.push(`| ${i + 1} | ${p.gardens} | ${pct(p.bloomed, p.gardens)} | ${p.medianMinutes?.toFixed(1) ?? '—'} | ${p.firstDay} → ${p.lastDay} |`);
});
out.push('', '## Lane plots (sim target: greedy bot ~30%)', '', '| plot | bloomed | avg Autumn margin |', '|---|---|---|');
for (const p of PLOTS) {
  const r = s.byPlot[p.id];
  if (!r) continue;
  const m = r.margin.length ? Math.round(r.margin.reduce((a, b) => a + b, 0) / r.margin.length) : null;
  out.push(`| ${p.name} | ${rateCell(r)} | ${m ?? '—'} |`);
}
out.push('', '## Species', '', '| species | picked | bloomed when picked |', '|---|---|---|');
for (const [k, r] of Object.entries(s.species).sort((a, b) => b[1].n - a[1].n)) out.push(`| ${SPECIES[k]?.name ?? k} | ${r.n} | ${pct(r.won, r.n)} |`);
out.push('', '## Rules', '', '| rule | taken | bloomed when taken |', '|---|---|---|');
for (const [k, r] of Object.entries(s.rules).sort((a, b) => b[1].n - a[1].n)) out.push(`| ${RULES[k]?.name ?? k} | ${r.n} | ${pct(r.won, r.n)} |`);
out.push('', '## Wishes', '', '| wish | granted / offered |', '|---|---|');
for (const [w, r] of Object.entries(s.wishes).sort((a, b) => b[1].offered - a[1].offered)) out.push(`| ${wishById(w)?.text ?? w} | ${r.granted}/${r.offered} |`);
console.log(out.join('\n'));

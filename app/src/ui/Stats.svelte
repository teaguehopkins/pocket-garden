<script lang="ts">
  // Your stats: kept on this phone only. "Copy my stats" lets a player share them by choice.
  import { PLOTS, plotById } from '../core/content/plots';
  import { RULES } from '../core/content/rules';
  import { SPECIES } from '../core/content/species';
  import { wishById } from '../core/content/wishes';
  import { summarize, type Rate } from '../core/stats';
  import { SEASONS } from '../core/run';
  import Tile from '../art/Tile.svelte';
  import { exportStats } from '../savecode';
  import { game } from './game.svelte';

  const log = $derived(game.profile.log ?? []);
  const s = $derived(summarize(log));
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
  const rate = (r: Rate) => pct(r.won, r.n);
  const sorted = (m: Record<string, Rate>) => Object.entries(m).sort((a, b) => b[1].n - a[1].n || b[1].won - a[1].won);
  let allSpecies = $state(false);
  let allRules = $state(false);
  const species = $derived(sorted(s.species));
  const rules = $derived(sorted(s.rules));
  const maxWilt = $derived(Math.max(1, ...s.wilted));
  const MODE_NAMES: Record<string, string> = { lane: 'Lane', daily: "Today's garden", friend: "Friends' gardens", teach: 'Window Box', lab: 'Lab' };
  const recent = $derived([...log].reverse().slice(0, 8));
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

  let copied = $state('');
  let fallback = $state('');
  function summaryText(): string {
    const lines = [
      `Pocket Garden stats (${s.firstDay} to ${s.lastDay})`,
      `${s.gardens} gardens, ${s.bloomed} bloomed (${pct(s.bloomed, s.gardens)})`,
      `Median play ${s.medianMinutes?.toFixed(1) ?? '—'} min; ${s.under10 !== null ? pct(s.under10, 1) : '—'} within 10 min; ${s.breaksPerGarden.toFixed(1)} put-downs per garden`,
      `Wilted in Spring ${s.wilted[0]}, Summer ${s.wilted[1]}, Autumn ${s.wilted[2]}`,
      ...PLOTS.filter((p) => s.byPlot[p.id]).map((p) => `${p.name}: ${s.byPlot[p.id].won}/${s.byPlot[p.id].n} bloomed`),
    ];
    return lines.join('\n');
  }
  async function copyStats() {
    copied = '';
    fallback = '';
    const code = await exportStats($state.snapshot(log));
    const text = `${summaryText()}\n\n${code}`;
    try {
      await navigator.clipboard.writeText(text);
      copied = 'Copied a summary and a stats code. Paste it in a message to share.';
    } catch {
      fallback = text;
    }
  }
</script>

<div class="head">
  <h2>Your stats</h2>
  <button class="chip" onclick={() => (game.view = 'lane')}>Back to the Lane</button>
</div>
<p class="dim">Kept on this phone only. Nothing is sent anywhere unless you copy it.</p>

{#if !log.length}
  <section class="card empty"><p>Finish a garden and your stats start here.</p></section>
{:else}
  <section class="tiles">
    <div class="card big"><b>{s.gardens}</b><span>gardens</span></div>
    <div class="card big"><b>{pct(s.bloomed, s.gardens)}</b><span>bloomed</span></div>
    <div class="card big"><b>{s.medianMinutes !== null ? s.medianMinutes.toFixed(1) : '—'}</b><span>median minutes</span></div>
    <div class="card big"><b>{s.breaksPerGarden.toFixed(1)}</b><span>put-downs each</span></div>
  </section>
  {#if s.under10 !== null}<p class="dim center">{pct(s.under10, 1)} of gardens took 10 minutes of play or less. Breaks over 2 minutes don't count.</p>{/if}

  <section class="card">
    <h3>Where gardens wilt</h3>
    <div class="bars">
      {#each SEASONS as n, i (n)}
        <span class="lbl">{n}</span>
        <span class="track"><span class="fill" style="width:{(s.wilted[i] / maxWilt) * 100}%"></span></span>
        <span class="num">{s.wilted[i]}</span>
      {/each}
    </div>
    <p class="dim">{s.bloomed} bloomed all year.</p>
  </section>

  {#if Object.keys(s.byPlot).length}
    <section class="card">
      <h3>The Lane</h3>
      <table>
        <thead><tr><th>Plot</th><th>Bloomed</th><th>Best</th><th title="Average Autumn score minus target">Autumn ±</th></tr></thead>
        <tbody>
          {#each PLOTS.filter((p) => s.byPlot[p.id]) as p (p.id)}
            {@const r = s.byPlot[p.id]}
            {@const m = avg(r.margin)}
            <tr><td>{p.name}</td><td>{r.won}/{r.n}</td><td>{r.best || '—'}</td><td class:neg={m !== null && m < 0}>{m === null ? '—' : `${m > 0 ? '+' : ''}${m}`}</td></tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}

  <section class="card">
    <h3>Ways you play</h3>
    <table>
      <tbody>
        {#each Object.entries(s.byMode) as [k, r] (k)}<tr><td>{MODE_NAMES[k] ?? k}</td><td>{r.n} played</td><td>{rate(r)} bloomed</td></tr>{/each}
      </tbody>
    </table>
    <p class="dim">Tools per garden: compost {s.toolsPerGarden.compost.toFixed(1)}, trowel {s.toolsPerGarden.trowel.toFixed(1)}, replant {s.toolsPerGarden.replant.toFixed(1)}.</p>
  </section>

  <section class="card">
    <h3>Seeds you pick</h3>
    <ul class="list">
      {#each allSpecies ? species : species.slice(0, 8) as [k, r] (k)}
        <li><span class="mini"><Tile id={k} size={26} /></span><span class="name">{SPECIES[k]?.name ?? k}</span><span>{r.n}×</span><span class="dim">{rate(r)} bloomed</span></li>
      {/each}
    </ul>
    {#if species.length > 8}<button class="chip" onclick={() => (allSpecies = !allSpecies)}>{allSpecies ? 'Show fewer' : `Show all ${species.length}`}</button>{/if}
  </section>

  <section class="card">
    <h3>Rules you take</h3>
    <ul class="list">
      {#each allRules ? rules : rules.slice(0, 8) as [k, r] (k)}
        <li><span class="mini seal">✦</span><span class="name">{RULES[k]?.name ?? k}</span><span>{r.n}×</span><span class="dim">{rate(r)} bloomed</span></li>
      {/each}
    </ul>
    {#if rules.length > 8}<button class="chip" onclick={() => (allRules = !allRules)}>{allRules ? 'Show fewer' : `Show all ${rules.length}`}</button>{/if}
  </section>

  {#if Object.keys(s.wishes).length}
    <section class="card">
      <h3>Wishes</h3>
      <ul class="list wishes">
        {#each Object.entries(s.wishes).sort((a, b) => b[1].offered - a[1].offered) as [w, r] (w)}
          <li><span class="name">{wishById(w)?.text ?? w}</span><span>{r.granted}/{r.offered}</span></li>
        {/each}
      </ul>
      <p class="dim">Granted in a bloomed year / times you had the wish.</p>
    </section>
  {/if}

  <section class="card">
    <h3>Recent gardens</h3>
    <ul class="list recent">
      {#each recent as e, i (i)}
        <li>
          <span class="dim">{e.d}</span>
          <span class="name">{e.mode === 'daily' ? "Today's garden" : plotById(e.plot ?? '')?.name ?? 'Garden'}</span>
          <span class:won={e.won}>{e.won ? 'Bloomed' : `Wilted ${SEASONS[Math.max(0, e.results.length - 1)].slice(0, 3)}`}</span>
          <span>{e.results.reduce((a, b) => a + b, 0)}</span>
        </li>
      {/each}
    </ul>
  </section>

  <button class="btn" onclick={copyStats}>Copy my stats</button>
  {#if copied}<p class="dim center" role="status">{copied}</p>{/if}
  {#if fallback}<textarea readonly rows="6" aria-label="Your stats" onfocus={(e) => (e.currentTarget as HTMLTextAreaElement).select()}>{fallback}</textarea>{/if}
{/if}

<style>
  .head { display: flex; justify-content: space-between; align-items: center; }
  .empty { text-align: center; }
  .center { text-align: center; }
  .tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .big { display: flex; flex-direction: column; align-items: center; padding: 12px 8px; }
  .big b { font: 700 var(--fs-xl) var(--font-display); font-variant-numeric: tabular-nums; }
  .big span { font-size: var(--fs-xs); color: var(--ink-dim); }
  section.card { display: flex; flex-direction: column; gap: 8px; }
  h3 { font-size: var(--fs-l); }
  .bars { display: grid; grid-template-columns: auto 1fr auto; gap: 6px 10px; align-items: center; font-size: var(--fs-s); }
  .track { height: 12px; border-radius: 6px; background: var(--surface-2); overflow: hidden; }
  .fill { display: block; height: 100%; background: var(--bad); border-radius: 6px; }
  .num { font-variant-numeric: tabular-nums; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: var(--fs-s); font-variant-numeric: tabular-nums; }
  th { text-align: left; font-weight: 700; color: var(--ink-dim); font-size: var(--fs-xs); padding: 4px 4px 6px 0; }
  td { padding: 5px 4px 5px 0; border-top: 1px solid var(--line); }
  td.neg { color: var(--bad); }
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; font-size: var(--fs-s); }
  .list li { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto 90px; gap: 8px; align-items: center; padding: 4px 0; border-top: 1px solid var(--line); font-variant-numeric: tabular-nums; }
  .list li:first-child { border-top: 0; }
  .list.wishes li { grid-template-columns: minmax(0, 1fr) auto; }
  .list.recent li { grid-template-columns: 84px minmax(0, 1fr) auto 36px; }
  .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mini { width: 26px; height: 26px; display: inline-grid; place-items: center; }
  .seal { color: var(--verb); font-size: 16px; }
  .won { color: var(--good); font-weight: 700; }
  textarea { width: 100%; font: 12px/1.4 ui-monospace, monospace; border-radius: var(--r-s); border: 1.5px solid var(--line); background: var(--surface-2); color: var(--ink); padding: 8px; overflow-wrap: anywhere; }
</style>

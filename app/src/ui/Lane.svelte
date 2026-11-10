<script lang="ts">
  // The Lane: a street of plots, opened in order. Each keeps a miniature of your best garden there.
  import { PLOTS } from '../core/content/plots';
  import { PLOT_WISHES, nextUnlock } from '../core/content/progress';
  import { RULES } from '../core/content/rules';
  import { SPECIES } from '../core/content/species';
  import { wishById } from '../core/content/wishes';
  import { ACHIEVEMENTS } from '../core/content/achievements';
  import { laneMaxStars, laneStars, openPlots } from '../core/profile';
  import { SEASONS, newRun } from '../core/run';
  import { P1_FEATURES } from '../core/types';
  import Tile from '../art/Tile.svelte';
  import Board from './Board.svelte';
  import { game, isLive, today } from './game.svelte';

  const p = $derived(game.profile);
  const stars = $derived(laneStars(p));
  const open = $derived(openPlots(p));
  const next = $derived(nextUnlock(stars));
  const shown = $derived(PLOTS.slice(0, Math.min(PLOTS.length, open.length + 1)));
  const hidden = $derived(PLOTS.length - shown.length);
  const dailyBest = $derived(p.seedBest[`${today()}d`]);
  const current = $derived(isLive(game.run) ? game.run : null);
  const earnedCount = $derived(Object.keys(p.achievements).length);

  // A plot's starting layout, for drawing the bed before any garden has bloomed there.
  const layout = (id: string) => newRun({ seed: 0, features: P1_FEATURES, plot: id });
  const plotName = (id: string | null) => PLOTS.find((x) => x.id === id)?.name ?? 'Window Box';

  let confirmFor = $state<string | null>(null);
  function plant(id: string) {
    if (current && confirmFor !== id) { confirmFor = id; return; }
    confirmFor = null;
    if (id === 'friend' && game.challenge) game.startChallenge(game.challenge);
    else if (id === 'daily') game.startDaily();
    else game.startPlot(id);
  }
  const ch = $derived(game.challenge);
</script>

{#if ch}
  <section class="card friend" aria-label="A friend's garden">
    <b>A friend shared a garden</b>
    <p>{ch.daily ? "Today's garden" : plotName(ch.plot)}: they {ch.won ? 'bloomed all year' : 'got'} with <b>{ch.score}</b> points. Same seeds, same weather. Can you beat it?</p>
    <p class="dim">Friends' gardens don't change your Lane.</p>
    <div class="row">
      <button class="btn" onclick={() => plant('friend')}>{confirmFor === 'friend' ? 'Replace current?' : 'Play it'}</button>
      <button class="btn ghost" onclick={() => (game.challenge = null)}>Not now</button>
    </div>
  </section>
{/if}

<section class="card summary">
  <div class="totals">
    <div><span class="big stars">★ {stars}</span><span class="dim"> / {laneMaxStars()} wish stars</span></div>
    <button class="chip" onclick={() => (game.view = 'almanac')}>Almanac · {earnedCount}/{ACHIEVEMENTS.length}</button>
  </div>
  {#if next}
    {@const need = next.stars - stars}
    <div class="next">
      <span class="dim">{need} more star{need === 1 ? '' : 's'} adds</span>
      {#each next.species ?? [] as k (k)}<span class="newsp" title={SPECIES[k].name}><Tile id={k} size={28} /></span>{/each}
      {#if next.rules?.length}<span class="dim">{next.rules.map((r) => RULES[r].name).join(', ')}</span>{/if}
    </div>
  {:else}
    <p class="dim">Every species and rule is in your seed tin.</p>
  {/if}
</section>

{#if current}
  <button class="card continue" onclick={() => (game.view = 'run')}>
    <b>Continue your garden</b>
    <span class="dim">{current.daily ? "Today's garden" : plotName(current.plot)} · {current.phase === 'draft' ? 'choosing seeds' : SEASONS[Math.min(current.season, 2)]}</span>
  </button>
{/if}

<button class="card daily" onclick={() => plant('daily')}>
  <span><b>Today's garden</b><span class="dim">The same seeds and weather for everyone today.{dailyBest ? ` Your best: ${dailyBest}.` : ''}</span></span>
  <span class="go">{confirmFor === 'daily' ? 'Replace current?' : dailyBest ? 'Again' : 'Plant'}</span>
</button>

<h2 class="street">The Lane</h2>
<ol class="lane">
  {#each shown as plot, k (plot.id)}
    {@const rec = p.lane[plot.id]}
    {@const isOpen = open.includes(plot.id)}
    {@const base = layout(plot.id)}
    <li class="plot" class:locked={!isOpen}>
      <span class="stone" aria-hidden="true">{k + 1}</span>
      <div class="card inner">
        <div class="mini"><Board run={base} grid={rec?.bestGrid ?? base.grid} compact weather={false} /></div>
        <div class="txt">
          <h3>{plot.name}</h3>
          {#if isOpen}
            <p class="dim">{plot.twist}</p>
            <ul class="wishes">
              {#each PLOT_WISHES[plot.id] as w, i (w)}
                <li class:done={rec?.wishes[i]}>{rec?.wishes[i] ? '★' : '☆'} {wishById(w).text}</li>
              {/each}
            </ul>
            <div class="foot">
              <span class="dim">{rec?.blooms ? `Best ${rec.best} · bloomed ${rec.blooms}×` : 'Not bloomed yet'}</span>
              <button class="btn" onclick={() => plant(plot.id)}>{confirmFor === plot.id ? 'Replace current?' : 'Plant'}</button>
            </div>
          {:else}
            <p class="dim">Bloom {PLOTS[k - 1].name} to open this plot.</p>
          {/if}
        </div>
      </div>
    </li>
  {/each}
</ol>
{#if hidden > 0}<p class="dim more">{hidden} more plot{hidden === 1 ? '' : 's'} further down the lane.</p>{/if}

<button class="btn ghost" onclick={() => game.startTeaching()}>Replay the Window Box (teaching garden)</button>

<style>
  .summary { display: flex; flex-direction: column; gap: 8px; }
  .friend { display: flex; flex-direction: column; gap: 6px; box-shadow: var(--shadow), inset 0 0 0 3px var(--verb); }
  .friend > b { font: 600 var(--fs-l) var(--font-display); color: var(--verb); }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .totals { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
  .big { font: 700 var(--fs-xl) var(--font-display); }
  .next { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .newsp { display: inline-block; width: 28px; height: 28px; }
  .continue, .daily { border: 0; text-align: left; cursor: pointer; display: flex; gap: 8px; color: var(--ink); }
  .continue { flex-direction: column; box-shadow: var(--shadow), inset 0 0 0 3px var(--accent); }
  .continue b, .daily b { font: 600 var(--fs-l) var(--font-display); display: block; }
  .daily { justify-content: space-between; align-items: center; background: var(--gold-soft); }
  .daily > span:first-child { display: flex; flex-direction: column; }
  .go { font: 700 var(--fs-m) var(--font-display); color: var(--ink); white-space: nowrap; }
  .street { margin-top: 6px; }
  .lane { list-style: none; margin: 0; padding: 0 0 0 22px; display: flex; flex-direction: column; gap: 14px; position: relative; }
  .lane::before { content: ''; position: absolute; left: 9px; top: 10px; bottom: 10px; width: 4px; border-radius: 2px; background: repeating-linear-gradient(180deg, var(--wood-light) 0 10px, transparent 10px 18px); opacity: 0.8; }
  .plot { position: relative; }
  .stone { position: absolute; left: -24px; top: 14px; width: 26px; height: 26px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #e6e0d6, #a59a8c 70%); color: #3a3128; font: 700 12px/26px var(--font-display); text-align: center; box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2); }
  .inner { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 12px; padding: 12px; }
  .locked .inner { opacity: 0.6; }
  .locked .mini { filter: grayscale(0.7); }
  .txt { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  h3 { font-size: var(--fs-l); }
  .wishes { list-style: none; margin: 0; padding: 0; font-size: var(--fs-xs); color: var(--ink-dim); }
  .wishes .done { color: var(--gold); font-weight: 700; }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
  .foot .btn { min-height: 38px; padding: 8px 16px; }
  .more { text-align: center; }
</style>

<script lang="ts">
  import { SPECIES } from '../core/content/species';
  import { plotById } from '../core/content/plots';
  import { WEATHER } from '../core/content/weather';
  import { wishById } from '../core/content/wishes';
  import { DRAFT_SIZE, SEASONS, type RunState } from '../core/run';
  import Tile from '../art/Tile.svelte';
  import Board from './Board.svelte';
  import { game } from './game.svelte';
  import { spText, verbGlyph, verbText } from './text';

  let { run }: { run: RunState } = $props();
  const plot = $derived(run.plot ? plotById(run.plot) : null);
</script>

<section class="card intro">
  <div class="plotrow">
    <div class="mini"><Board {run} compact weather={false} /></div>
    <div class="about">
      <h2>{plot?.name ?? 'The garden'}</h2>
      {#if plot}<p class="dim">{plot.twist}</p>{/if}
      <div class="sky">
        {#each SEASONS as n, i (n)}
          <span><b>{n}</b> {WEATHER[run.mods[i]].name}: {WEATHER[run.mods[i]].text}</span>
        {/each}
      </div>
    </div>
  </div>
  {#if run.features.wishes && run.wishes.length}
    <div class="wishes"><span class="tag">Wishes</span>{#each run.wishes as w (w)}<span>☆ {wishById(w).text}</span>{/each}</div>
  {/if}
</section>

<div class="head">
  <h2>Choose your seeds</h2>
  <span class="count">{run.roster.length + 1} of {DRAFT_SIZE}</span>
</div>
<p class="dim">Only the seeds you choose grow this year{run.features.bag ? ': 3 packets of each go in your bag' : ''}.</p>
{#if run.roster.length}
  <div class="roster" aria-label="Chosen so far">{#each run.roster as k (k)}<span title={SPECIES[k].name}><Tile id={k} size={34} /></span>{/each}</div>
{/if}

<div class="offers">
  {#each run.offer as k (run.roster.length + k)}
    {@const sp = SPECIES[k]}
    <button class="offer" onclick={() => game.act({ type: 'draft', id: k })}>
      <span class="art"><Tile id={k} size={68} live /></span>
      <span class="txt">
        <b>{sp.name} <span class="tag">{sp.group}</span></b>
        <span class="dim">{spText(k, run)}</span>
        {#if run.features.life && sp.verb}<span class="vb"><i>{verbGlyph(sp.verb)}</i> {verbText(sp.verb)}</span>{/if}
        <span class="arch">{sp.arch.join(' · ')}</span>
      </span>
    </button>
  {/each}
</div>

<style>
  .intro { display: flex; flex-direction: column; gap: 10px; }
  .plotrow { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 12px; align-items: start; }
  .about { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .sky { display: flex; flex-direction: column; font-size: var(--fs-xs); color: var(--ink-dim); margin-top: 4px; }
  .sky b { color: var(--ink); font-family: var(--font-display); font-weight: 600; }
  .wishes { display: flex; flex-direction: column; gap: 2px; font-size: var(--fs-s); border-top: 1.5px dashed var(--line); padding-top: 8px; }
  .head { display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; }
  .count { font: 600 var(--fs-m) var(--font-display); color: var(--accent); }
  .roster { display: flex; gap: 4px; flex-wrap: wrap; }
  .offers { display: flex; flex-direction: column; gap: 10px; }
  .offer {
    border: 0;
    background: var(--surface);
    border-radius: var(--r-l);
    box-shadow: var(--shadow);
    padding: 10px 12px 10px 8px;
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 8px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    animation: deal var(--t-slow) var(--ease-pop) backwards;
    transition: transform var(--t-fast) var(--ease-out);
  }
  .offer:nth-child(2) { animation-delay: 60ms; }
  .offer:nth-child(3) { animation-delay: 120ms; }
  .offer:active { transform: scale(0.98); }
  .art { display: grid; place-items: center; background: var(--soil); border-radius: var(--r-m); padding: 4px; box-shadow: inset 0 3px 0 rgba(0, 0, 0, 0.18); }
  .txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .txt b { font: 600 var(--fs-l) var(--font-display); }
  .vb { font-size: var(--fs-s); color: var(--verb); font-weight: 700; }
  .vb i { font-style: normal; display: inline-block; width: 16px; height: 16px; border-radius: 8px; background: var(--verb); color: #fff; text-align: center; line-height: 16px; font-size: 10px; }
  .arch { font-size: var(--fs-xs); color: var(--ink-dim); text-transform: capitalize; }
  @keyframes deal { from { transform: translateY(18px) scale(0.96); opacity: 0; } }
</style>

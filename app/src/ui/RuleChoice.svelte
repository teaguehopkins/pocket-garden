<script lang="ts">
  import { SPECIES } from '../core/content/species';
  import { RULES } from '../core/content/rules';
  import { SEASONS, type RunState } from '../core/run';
  import Tile from '../art/Tile.svelte';
  import Board from './Board.svelte';
  import { game } from './game.svelte';
  import { ruleName } from './text';

  let { run }: { run: RunState } = $props();
  const first = $derived(!run.results.length);
</script>

{#if !first}
  <section class="card summary">
    <p><b>{SEASONS[run.season - 1]} scored {run.results.at(-1)}</b> of {run.targets[run.season - 1]}. The garden carries over; {SEASONS[run.season]} needs {run.targets[run.season]}.</p>
    <Board {run} weather={false} />
  </section>
{/if}

<h2>{first ? 'Pick your first garden rule' : 'Pick a new rule'}</h2>
<p class="dim">Rules stack for the rest of the year.</p>
<div class="roster">{#each run.roster as k (k)}<span title={SPECIES[k].name}><Tile id={k} size={34} /></span>{/each}</div>
{#if run.rules.length}
  <div class="chips">{#each run.rules as k (k)}<button class="chip rule" onclick={() => (game.sheet = 'rules')}>{ruleName(k)}</button>{/each}</div>
{/if}

<div class="offers">
  {#each run.ruleOffer as k (run.season + k)}
    <button class="offer" onclick={() => game.act({ type: 'rule', id: k })}>
      <span class="seal" aria-hidden="true">✦</span>
      <span class="txt">
        <b>{RULES[k].name}{#if RULES[k].keystone} <span class="tag key">keystone</span>{/if}</b>
        <span>{RULES[k].text}</span>
      </span>
    </button>
  {/each}
</div>

<style>
  .summary { display: flex; flex-direction: column; gap: 10px; }
  .roster { display: flex; gap: 4px; flex-wrap: wrap; }
  .offers { display: flex; flex-direction: column; gap: 10px; }
  .offer {
    border: 0;
    background: var(--surface);
    border-radius: var(--r-l);
    box-shadow: var(--shadow);
    padding: 14px;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    animation: deal var(--t-slow) var(--ease-pop) backwards;
  }
  .offer:nth-child(2) { animation-delay: 60ms; }
  .offer:nth-child(3) { animation-delay: 120ms; }
  .offer:active { transform: scale(0.98); }
  .seal { width: 44px; height: 44px; border-radius: 22px; display: grid; place-items: center; font-size: 22px; color: #fff; background: radial-gradient(circle at 35% 30%, #c3a8ff, var(--verb) 60%, #4e3591); box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2); }
  .txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .txt b { font: 600 var(--fs-l) var(--font-display); color: var(--verb); }
  .key { color: var(--verb); }
  @keyframes deal { from { transform: translateY(18px) scale(0.96); opacity: 0; } }
</style>

<script lang="ts">
  import { plotById } from '../core/content/plots';
  import type { RunState } from '../core/run';
  import Almanac from './Almanac.svelte';
  import Board from './Board.svelte';
  import Lane from './Lane.svelte';
  import Draft from './Draft.svelte';
  import Result from './Result.svelte';
  import RuleChoice from './RuleChoice.svelte';
  import Sheets from './Sheets.svelte';
  import Shelf from './Shelf.svelte';
  import Status from './Status.svelte';
  import Tally from './Tally.svelte';
  import { game } from './game.svelte';
  import { applyTheme } from './settings.svelte';
  import { ruleName } from './text';

  const run = $derived(game.run as RunState);
  const inRun = $derived(game.view === 'run' && !!game.run);
  const plot = $derived(run?.plot ? plotById(run.plot) : null);
  const wishCount = $derived(run?.wishDone.filter(Boolean).length ?? 0);

  applyTheme();
  $effect(() => {
    // Sky and accent follow the season (drafting shows Spring).
    document.documentElement.dataset.season = String(!inRun || run.phase === 'draft' ? 0 : Math.min(run.season, 2));
  });
</script>

<div class="app">
  <header class="bar">
    <div class="brand">
      <h1>Pocket Garden</h1>
      {#if inRun}<span class="dim">{run.daily ? "Today's garden" : plot ? plot.name : `Rank ${run.rank}`}</span>{/if}
    </div>
    <div class="icons">
      {#if inRun}
        <button class="icon" onclick={() => (game.view = 'lane')} aria-label="The Lane">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3L12 3Z" /></svg>
        </button>
      {/if}
      <button class="icon" onclick={() => (game.sheet = 'guide')} aria-label="Field guide">?</button>
      <button class="icon" onclick={() => (game.sheet = 'settings')} aria-label="Settings">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.4 4.6-.1-2.2 2-1.6-2-3.4-2.4 1a8 8 0 0 0-1.9-1.1L15.6 3h-4l-.4 2.6c-.7.3-1.3.6-1.9 1.1l-2.4-1-2 3.4 2 1.6a8 8 0 0 0 0 2.2l-2 1.6 2 3.4 2.4-1c.6.5 1.2.8 1.9 1.1l.4 2.6h4l.4-2.6c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.4-2-1.6Z" /></svg>
      </button>
    </div>
  </header>

  {#if !inRun}
    {#if game.view === 'almanac'}<Almanac />{:else}<Lane />{/if}
  {:else if run.phase === 'draft'}
    <Draft {run} />
  {:else if run.phase === 'rule'}
    <RuleChoice {run} />
  {:else if run.phase === 'play'}
    <Status {run} />
    <div class="chips">
      {#if run.features.wishes && run.wishes.length}<button class="chip" onclick={() => (game.sheet = 'wishes')}><span class="stars">★</span> Wishes {wishCount}/3</button>{/if}
      {#each run.rules as k (k)}<button class="chip rule" onclick={() => (game.sheet = 'rules')}>✦ {ruleName(k)}</button>{/each}
    </div>
    <Board {run} interactive />
    <Shelf {run} />
  {:else}
    <Result {run} />
  {/if}
</div>

{#if game.tally && inRun}<Tally tally={game.tally} {run} />{/if}
<Sheets run={inRun ? run : null} />

<style>
  .bar { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .brand { display: flex; flex-direction: column; min-width: 0; }
  h1 { font-size: var(--fs-l); font-weight: 700; color: var(--ink); line-height: 1.1; }
  .brand .dim { font-size: var(--fs-xs); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .icons { display: flex; gap: 6px; }
  .icon { width: 40px; height: 40px; border-radius: 20px; border: 0; background: var(--surface); box-shadow: 0 2px 0 var(--line); font: 700 var(--fs-m) var(--font-display); cursor: pointer; display: grid; place-items: center; color: var(--ink); }
</style>

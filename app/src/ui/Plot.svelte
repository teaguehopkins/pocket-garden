<script lang="ts">
  import { SPECIES } from '../core/content/species';
  import { movable, preview, scoreCtx, type RunState } from '../core/run';
  import { cellScores } from '../core/score';
  import { game } from './game.svelte';
  import { verbTag } from './text';

  let { run, interactive }: { run: RunState; interactive: boolean } = $props();

  const scores = $derived(cellScores(scoreCtx(run)));
  const centre = $derived(run.rules.includes('center') ? new Set(run.board.centre) : new Set<number>());
  const deltas = $derived(
    interactive && game.sel !== null && game.tool !== 'trowel'
      ? run.grid.map((t, i) => {
          if (!run.board.mask[i]) return null;
          if (game.tool === 'replant') return movable(run, i) ? preview(run, game.sel!, i) : null;
          return t ? null : preview(run, game.sel!, i);
        })
      : run.grid.map(() => null),
  );

  function tap(i: number) {
    if (!interactive) return;
    const t = run.grid[i];
    if (game.tool === 'trowel') {
      if (game.trowelFrom === null) {
        if (movable(run, i)) game.trowelFrom = i;
      } else if (!t && run.board.mask[i]) game.act({ type: 'trowel', from: game.trowelFrom, to: i });
      else if (movable(run, i)) game.trowelFrom = i;
      return;
    }
    if (game.sel === null) return;
    if (game.tool === 'replant') {
      if (movable(run, i)) game.act({ type: 'replant', slot: game.sel, cell: i });
      return;
    }
    if (!t && run.board.mask[i]) game.act({ type: 'plant', slot: game.sel, cell: i });
  }

  function label(i: number) {
    const t = run.grid[i];
    if (!run.board.mask[i]) return 'Outside the plot';
    if (t) return `${SPECIES[t.s].name}, ${scores[i]} points`;
    const d = deltas[i];
    return d === null ? 'Empty' : `Plant here, ${d} points`;
  }
</script>

<div class="plot" style="--w:{run.board.w}" data-testid="plot">
  {#each run.grid as t, i (i)}
    {@const fx = run.board.fx[i]}
    {@const d = deltas[i]}
    <button
      class="cell"
      class:void={!run.board.mask[i]}
      class:ctr={centre.has(i)}
      class:sunny={fx === 'sunny'}
      class:shade={fx === 'shade'}
      class:fixed={t?.f}
      class:last={i === run.last && !!t}
      class:can={d !== null && !t}
      class:can-replant={d !== null && !!t}
      class:from={game.trowelFrom === i}
      aria-label={label(i)}
      data-cell={i}
      onclick={() => tap(i)}
    >
      {#if t}
        {SPECIES[t.s].icon}
        {#if SPECIES[t.s].group !== 'none'}<span class="pts">{scores[i]}</span>{/if}
        {#if run.features.life && SPECIES[t.s].verb && !t.f}<span class="later" title={verbTag(SPECIES[t.s].verb)}>later</span>{/if}
        {#if t.b}<span class="bon">+{t.b}</span>{/if}
        {#if d !== null}<span class="delta" class:neg={d < 0} style="position:absolute;top:2px;right:4px;font-size:12px">{d >= 0 ? '+' : ''}{d}</span>{/if}
      {:else if d !== null}
        <span class="delta" class:neg={d < 0}>{d >= 0 ? '+' : ''}{d}</span>
      {:else if fx === 'sunny'}
        <span class="dim" style="font-size:11px">sunny ×2</span>
      {:else if fx === 'shade'}
        <span class="dim" style="font-size:11px">shade</span>
      {/if}
    </button>
  {/each}
</div>

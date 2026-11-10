<script lang="ts">
  import { SPECIES } from '../core/content/species';
  import { movable, preview, scoreCtx, type RunState } from '../core/run';
  import { cellScores } from '../core/score';
  import type { Grid } from '../core/types';
  import Tile from '../art/Tile.svelte';
  import Weather from './Weather.svelte';
  import { game } from './game.svelte';
  import { verbGlyph, verbTag } from './text';

  let {
    run,
    interactive = false,
    grid = run.grid,
    scores,
    popped,
    current = -1,
    changed,
    weather = true,
    compact = false,
  }: {
    run: RunState;
    interactive?: boolean;
    grid?: Grid;
    /** fixed scores to show (tally); otherwise computed live */
    scores?: number[];
    /** tally: squares whose score has been counted so far (others hide their badge) */
    popped?: Set<number>;
    current?: number;
    /** squares that changed between seasons (sprout animation) */
    changed?: Set<number>;
    weather?: boolean;
    compact?: boolean;
  } = $props();

  const live = $derived(scores ?? cellScores(scoreCtx(run, grid)));
  const centre = $derived(run.rules.includes('center') ? new Set(run.board.centre) : new Set<number>());
  const deltas = $derived(
    interactive && game.sel !== null && game.tool !== 'trowel'
      ? grid.map((t, i) => {
          if (!run.board.mask[i]) return null;
          if (game.tool === 'replant') return movable(run, i) ? preview(run, game.sel!, i) : null;
          return t ? null : preview(run, game.sel!, i);
        })
      : grid.map(() => null),
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
    if (game.sel === null) {
      if (t && SPECIES[t.s].group !== 'none') game.sheet = { species: t.s };
      return;
    }
    if (game.tool === 'replant') {
      if (movable(run, i)) game.act({ type: 'replant', slot: game.sel, cell: i });
      return;
    }
    if (!t && run.board.mask[i]) game.act({ type: 'plant', slot: game.sel, cell: i });
  }

  function label(i: number) {
    const t = grid[i];
    if (!run.board.mask[i]) return 'Outside the plot';
    if (t) return `${SPECIES[t.s].name}, ${live[i]} points${t.b ? `, +${t.b} grown` : ''}`;
    const d = deltas[i];
    const fx = run.board.fx[i] ? ` (${run.board.fx[i]})` : '';
    return d === null ? `Empty square${fx}` : `Plant here${fx}: ${d >= 0 ? '+' : ''}${d} this season`;
  }
</script>

<div class="bed" class:compact style="--w:{run.board.w}" data-testid="plot">
  <div class="grid">
    {#each grid as t, i (i)}
      {@const fx = run.board.fx[i]}
      {@const d = deltas[i]}
      {@const sp = t ? SPECIES[t.s] : null}
      {#if !run.board.mask[i]}
        <div class="cell void" aria-hidden="true"></div>
      {:else}
        <button
          class="cell"
          class:sunny={fx === 'sunny'}
          class:shade={fx === 'shade'}
          class:ctr={centre.has(i)}
          class:can={d !== null && !t}
          class:can-replant={d !== null && !!t}
          class:from={game.trowelFrom === i}
          class:current={current === i}
          class:over={interactive && game.dragOver === i}
          class:interactive
          aria-label={label(i)}
          data-cell={i}
          onclick={() => tap(i)}
        >
          {#if fx === 'sunny' && !t}<span class="fxmark" aria-hidden="true">☀</span>{/if}
          {#if t && sp}
            {#key (i === run.last && interactive ? game.plantTick : 0) + (changed?.has(i) ? 1000 : 0)}
              <span class="piece" class:sprout={(i === run.last && interactive && game.plantTick > 0) || changed?.has(i)}>
                <Tile id={t.s} size="100%" live={!compact} />
              </span>
            {/key}
            {#if sp.group !== 'none' && !compact && (!popped || popped.has(i))}
              <span class="badge" class:neg={live[i] < 0} class:zero={live[i] === 0} class:pop={popped?.has(i)}>{live[i]}</span>
            {/if}
            {#if run.features.life && sp.verb && !t.f && !compact}
              <span class="later" title={verbTag(sp.verb)}>{verbGlyph(sp.verb)}</span>
            {/if}
            {#if t.b && !compact}<span class="grown">+{t.b}</span>{/if}
            {#if d !== null}<span class="delta onTile" class:neg={d < 0}>{d >= 0 ? '+' : ''}{d}</span>{/if}
          {:else if d !== null}
            <span class="delta" class:neg={d < 0}>{d >= 0 ? '+' : ''}{d}</span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
  {#if weather}<Weather id={run.mods[Math.min(run.season, 2)]} />{/if}
</div>

<style>
  .bed {
    position: relative;
    background: linear-gradient(180deg, var(--wood-light), var(--wood) 30%, var(--wood-dark));
    border-radius: var(--r-l);
    padding: 10px;
    box-shadow: 0 6px 0 var(--wood-dark), 0 14px 24px rgba(0, 0, 0, 0.18);
    overflow: hidden;
    isolation: isolate;
  }
  .bed.compact { padding: 6px; border-radius: var(--r-m); box-shadow: 0 3px 0 var(--wood-dark); }
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--w), minmax(0, 1fr));
    gap: 6px;
    background: var(--soil-dark);
    border-radius: 14px;
    padding: 6px;
    box-shadow: inset 0 4px 0 rgba(0, 0, 0, 0.22);
  }
  .compact .grid { gap: 3px; padding: 3px; border-radius: 9px; }
  .cell {
    position: relative;
    aspect-ratio: 1;
    min-width: 0;
    max-width: 100%;
    border: 0;
    padding: 0;
    border-radius: 12px;
    background: radial-gradient(120% 90% at 40% 25%, var(--soil-hi), transparent 60%), var(--soil);
    box-shadow: inset 0 3px 0 rgba(0, 0, 0, 0.18);
    display: grid;
    place-items: center;
    cursor: default;
    transition: transform var(--t-fast) var(--ease-out), box-shadow var(--t-fast);
  }
  .compact .cell { border-radius: 6px; }
  .cell.void { background: transparent; box-shadow: none; }
  .cell.interactive { cursor: pointer; }
  .cell.sunny { background: radial-gradient(circle at 50% 45%, rgba(255, 214, 90, 0.55), transparent 70%), var(--soil); }
  .cell.shade { background: repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.16) 0 6px, transparent 6px 12px), var(--soil-dark); }
  .cell.ctr::after { content: ''; position: absolute; inset: 3px; border-radius: 9px; border: 2px dotted var(--gold); opacity: 0.8; pointer-events: none; }
  .fxmark { font-size: 18px; color: #ffd75a; opacity: 0.8; }
  .cell.can { box-shadow: inset 0 0 0 2.5px var(--preview), inset 0 3px 0 rgba(0, 0, 0, 0.18); }
  .cell.can:active { transform: scale(0.94); }
  .cell.can-replant { box-shadow: inset 0 0 0 2.5px var(--preview-neg); cursor: pointer; }
  .cell.over { transform: scale(1.08); box-shadow: inset 0 0 0 3px var(--accent), 0 0 0 3px var(--preview); }
  .cell.from { box-shadow: inset 0 0 0 3px var(--verb); }
  .cell.current { box-shadow: 0 0 0 3px var(--gold), 0 0 18px var(--gold); z-index: 2; transform: scale(1.06); }
  .piece { position: absolute; inset: 4%; display: block; }
  .piece :global(svg) { width: 100%; height: 100%; }
  .badge {
    position: absolute;
    right: -3px;
    bottom: -3px;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border-radius: 12px;
    background: var(--badge);
    color: var(--badge-ink);
    font: 700 13px/24px var(--font-display);
    text-align: center;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.22);
    font-variant-numeric: tabular-nums;
    z-index: 1;
  }
  .badge.zero { opacity: 0.7; }
  .badge.neg { color: var(--bad); }
  .badge.pop { animation: pop var(--t-med) var(--ease-pop); }
  .later {
    position: absolute;
    left: -2px;
    top: -2px;
    width: 18px;
    height: 18px;
    border-radius: 9px;
    background: var(--verb);
    color: #fff;
    font: 700 11px/18px var(--font-display);
    text-align: center;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
  }
  .grown {
    position: absolute;
    right: -3px;
    top: -3px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--gold);
    color: #2b2118;
    font: 700 10px/16px var(--font-display);
  }
  .delta {
    font: 700 clamp(14px, 4.6vw, 20px) var(--font-display);
    color: var(--preview);
    text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
  }
  .delta.neg { color: var(--preview-neg); }
  .delta.onTile { position: absolute; top: 2px; left: 0; right: 0; text-align: center; font-size: 14px; z-index: 2; }
  .sprout { animation: sprout var(--t-slow) var(--ease-pop); transform-origin: 50% 90%; }
  @keyframes sprout { from { transform: scale(0.2) translateY(20%); opacity: 0; } 60% { opacity: 1; } }
  @keyframes pop { from { transform: scale(0.2); } }
</style>

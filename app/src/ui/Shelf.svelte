<script lang="ts">
  import { SPECIES } from '../core/content/species';
  import { aheadN, emptySquares, shelfN, type RunState } from '../core/run';
  import Tile from '../art/Tile.svelte';
  import { game } from './game.svelte';
  import { spText, verbGlyph, verbText } from './text';

  let { run }: { run: RunState } = $props();
  const shelf = $derived(run.queue.slice(0, shelfN(run)));
  const ahead = $derived(run.queue.slice(shelfN(run), shelfN(run) + aheadN(run)));
  const noRoom = $derived(emptySquares(run).length === 0);

  // Drag-to-plant: press a packet and drag it onto a square. A short press is a normal tap.
  let drag = $state<{ slot: number; x: number; y: number; sx: number; sy: number; moving: boolean } | null>(null);
  let swallowClick = false;
  function down(e: PointerEvent, slot: number) {
    if (game.tool) return;
    drag = { slot, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moving: false };
  }
  function cellAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest('[data-cell]') as HTMLElement | null;
    return el ? Number(el.dataset.cell) : null;
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!drag.moving && Math.hypot(drag.x - drag.sx, drag.y - drag.sy) > 12) {
      drag.moving = true;
      game.select(drag.slot);
    }
    if (drag.moving) {
      e.preventDefault();
      const c = cellAt(drag.x, drag.y - 56);
      game.dragOver = c !== null && !run.grid[c] && run.board.mask[c] ? c : null;
    }
  }
  function up() {
    if (!drag) return;
    if (drag.moving) {
      swallowClick = true;
      const c = game.dragOver;
      game.dragOver = null;
      if (c !== null) game.act({ type: 'plant', slot: drag.slot, cell: c });
    }
    drag = null;
  }

  function choose(i: number) {
    if (swallowClick) { swallowClick = false; return; }
    game.select(game.sel === i ? null : i);
    if (game.tool === 'trowel') game.tool = null;
  }
  function setTool(t: 'trowel' | 'replant') {
    game.tool = game.tool === t ? null : t;
    game.trowelFrom = null;
  }
  const hint = $derived(
    game.tool === 'trowel'
      ? game.trowelFrom === null ? 'Trowel: tap a tile to move.' : 'Now tap an empty square.'
      : game.tool === 'replant'
        ? game.sel !== null ? 'Replant: tap a tile to plant over it.' : 'Replant: pick a packet first.'
        : noRoom ? 'No empty squares. Replant over a tile, or let a packet go to seed.'
          : game.sel !== null ? "Tap a square. Numbers show this season's change." : 'Pick a packet to plant.',
  );
</script>

<svelte:window onpointermove={move} onpointerup={up} onpointercancel={() => { drag = null; game.dragOver = null; }} />

{#if drag?.moving}
  <div class="dragghost" style="left:{drag.x}px;top:{drag.y - 56}px" aria-hidden="true"><Tile id={run.queue[drag.slot]} size={64} /></div>
{/if}

<p class="hint dim" aria-live="polite">{hint}</p>

<div class="packets" style="--cols:{shelf.length || 1}">
  {#each shelf as k, i (i + k)}
    {@const sp = SPECIES[k]}
    <button class="pk" class:sel={game.sel === i} onclick={() => choose(i)} onpointerdown={(e) => down(e, i)} data-testid="packet" aria-pressed={game.sel === i}>
      <span class="art"><Tile id={k} size={52} live={game.sel === i} /></span>
      <b>{sp.name}</b>
      <span class="tx">{spText(k, run)}</span>
      {#if run.features.life && sp.verb}<span class="vb"><i>{verbGlyph(sp.verb)}</i>{verbText(sp.verb)}</span>{/if}
    </button>
  {/each}
</div>

<div class="row2">
  <div class="soon" aria-label="Coming up">
    <span class="dim">Next</span>
    {#each ahead as k, n (n)}<span class="mini" title={SPECIES[k].name}><Tile id={k} size={28} /></span>{/each}
  </div>
  {#if run.features.bag}
    <button class="chip" onclick={() => (game.sheet = 'bag')}>Bag · {run.bag.length}</button>
  {/if}
</div>

{#if run.features.tools}
  <div class="tools">
    <button class="btn ghost" disabled={!run.rerolls} onclick={() => game.act({ type: 'compost' })}>Compost</button>
    <button class="btn ghost" class:on={game.tool === 'trowel'} disabled={!run.rerolls} onclick={() => setTool('trowel')}>Trowel</button>
    <button class="btn ghost" class:on={game.tool === 'replant'} disabled={!run.rerolls} onclick={() => setTool('replant')}>Replant</button>
  </div>
  <p class="dim tooluses">{run.rerolls} tool use{run.rerolls === 1 ? '' : 's'} left this season</p>
{:else}
  <button class="btn ghost" disabled={!run.rerolls} onclick={() => game.act({ type: 'compost' })}>Compost the shelf ({run.rerolls} left this season)</button>
{/if}
{#if noRoom && game.sel !== null}
  <button class="btn ghost" onclick={() => game.act({ type: 'skip', slot: game.sel! })}>Let {SPECIES[run.queue[game.sel]].name} go to seed</button>
{/if}

<style>
  .dragghost { position: fixed; z-index: 50; width: 64px; height: 64px; margin: -32px 0 0 -32px; pointer-events: none; filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.3)); transform: scale(1.1); }
  .pk { touch-action: none; }
  .hint { min-height: 1.4em; text-align: center; }
  .packets { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 8px; }
  .pk {
    border: 0;
    background: var(--surface);
    border-radius: var(--r-m);
    padding: 8px 8px 10px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    cursor: pointer;
    box-shadow: var(--shadow);
    transition: transform var(--t-med) var(--ease-pop), box-shadow var(--t-med);
  }
  .pk.sel { transform: translateY(-8px) rotate(-1.5deg); box-shadow: var(--shadow-lift), inset 0 0 0 3px var(--accent); }
  .pk:active { transform: translateY(-2px) scale(0.98); }
  .art { align-self: center; height: 52px; }
  .pk b { font: 600 var(--fs-m) var(--font-display); line-height: 1.15; }
  .tx { font-size: var(--fs-xs); color: var(--ink-dim); line-height: 1.3; }
  .vb { font-size: var(--fs-xs); color: var(--verb); font-weight: 700; line-height: 1.25; }
  .vb i { font-style: normal; display: inline-block; width: 15px; height: 15px; border-radius: 8px; background: var(--verb); color: #fff; text-align: center; line-height: 15px; font-size: 10px; margin-right: 3px; }
  .row2 { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .soon { display: flex; align-items: center; gap: 4px; background: var(--surface); border-radius: var(--r-pill); padding: 3px 10px; box-shadow: 0 2px 0 var(--line); min-width: 0; overflow: hidden; }
  .mini { display: inline-block; width: 28px; height: 28px; }
  .tools { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tools .btn { padding: 10px 6px; font-size: var(--fs-s); }
  .tooluses { text-align: center; margin-top: -4px; }
</style>

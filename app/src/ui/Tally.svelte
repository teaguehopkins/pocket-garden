<script lang="ts">
  // The season-end scoring moment: tiles count up one by one with rising notes,
  // rules that helped flash, the bar fills toward the target, then the garden lives.
  import { SPECIES } from '../core/content/species';
  import { wishById } from '../core/content/wishes';
  import { SEASONS, type RunState } from '../core/run';
  import { isReal } from '../core/score';
  import Board from './Board.svelte';
  import { game, type Tally } from './game.svelte';
  import { reducedMotion } from './settings.svelte';
  import { sfx } from './sound';
  import { ruleName } from './text';

  let { tally, run }: { tally: Tally; run: RunState } = $props();

  const order = $derived(tally.grid.flatMap((t, i) => (isReal(t) && !(t.f && tally.cells[i] === 0) ? [i] : [])));
  type Stage = 'tiles' | 'rules' | 'verdict' | 'life' | 'done';
  let stage = $state<Stage>('tiles');
  let shown = $state(0);
  let popped = $state(new Set<number>());
  let running = $state(0);
  let current = $state(-1);
  const timers: ReturnType<typeof setTimeout>[] = [];
  const step = reducedMotion() ? 0 : 150;

  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

  function finishAll() {
    timers.forEach(clearTimeout);
    timers.length = 0;
    popped = new Set(order);
    shown = order.length;
    running = tally.score;
    current = -1;
    stage = tally.life.length && !tally.ended ? 'life' : 'done';
  }

  $effect(() => {
    let t = 300;
    order.forEach((i, k) => {
      later(t, () => {
        popped = new Set([...popped, i]);
        current = i;
        shown = k + 1;
        running += tally.cells[i];
        sfx.tally(k);
      });
      t += step;
    });
    later(t + 100, () => {
      current = -1;
      stage = 'rules';
      if (tally.bonus || tally.rules.length) sfx.bonus();
      running = tally.score;
    });
    t += tally.rules.length || tally.bonus ? 650 : 200;
    later(t, () => {
      stage = 'verdict';
      if (tally.ok) sfx.pass();
      else sfx.fail();
    });
    if (tally.life.length && !tally.ended) {
      t += 1100;
      later(t, () => {
        stage = 'life';
        sfx.grow();
      });
    }
    return () => timers.forEach(clearTimeout);
  });

  const lifeCells = $derived(new Set(tally.life.map((c) => c.cell)));
  const fill = $derived(Math.min(1, running / Math.max(1, tally.target)));
  const atEnd = $derived(stage === 'done' || stage === 'life' || stage === 'verdict');
  const verdictShown = $derived(stage === 'verdict' || stage === 'life' || stage === 'done');

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') atEnd ? game.closeTally() : finishAll();
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="tally" role="dialog" aria-modal="true" aria-label="{SEASONS[tally.season]} scoring" data-testid="tally">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="inner" onclick={() => (atEnd ? null : finishAll())}>
    <header>
      <h2>{SEASONS[tally.season]} scoring</h2>
      <div class="total"><b>{running}</b><span>/ {tally.target}</span></div>
    </header>
    <div class="bar"><span style="transform:scaleX({fill})" class:ok={running >= tally.target}></span><i style="left:100%"></i></div>

    {#if stage === 'life'}
      <Board {run} grid={tally.gridAfter} changed={lifeCells} weather={false} />
    {:else}
      <Board {run} grid={tally.grid} scores={tally.cells} {popped} {current} weather={false} />
    {/if}

    <div class="rules" class:show={stage !== 'tiles'}>
      {#each tally.rules as r (r.id)}
        <span class="chip rule flash">{ruleName(r.id)} {r.delta > 0 ? '+' : ''}{r.delta}</span>
      {/each}
    </div>

    {#if verdictShown}
      <div class="verdict" class:ok={tally.ok}>
        {#if tally.ok}
          <h3>{tally.ended ? 'Your garden bloomed all year!' : `${SEASONS[tally.season]} cleared`}</h3>
          <p>{tally.score} of {tally.target} needed{tally.score - tally.target > 0 ? ` · ${tally.score - tally.target} to spare` : ''}.</p>
        {:else}
          <h3>The garden wilted</h3>
          <p>{tally.score} of {tally.target} needed.</p>
        {/if}
        {#each tally.wishes as w (w)}<p class="wish">★ Wish granted: {wishById(w).text}</p>{/each}
      </div>
    {/if}

    {#if stage === 'life'}
      <ul class="life">
        {#each tally.life as c, n (n)}
          <li>
            {#if c.kind === 'grew'}{SPECIES[c.from].name} grew into {SPECIES[c.to].name}
            {:else if c.kind === 'spread'}{SPECIES[c.s].name} spread to a new square
            {:else}{SPECIES[c.s].name} grew stronger (+{c.by}){/if}
          </li>
        {/each}
      </ul>
    {/if}

    <div class="actions">
      {#if atEnd}
        <button class="btn" onclick={() => game.closeTally()}>{tally.ended ? 'See the year' : 'Continue'}</button>
      {:else}
        <button class="btn ghost" onclick={finishAll}>Skip</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .tally {
    position: fixed;
    inset: 0;
    z-index: 30;
    background: linear-gradient(180deg, var(--sky), var(--sky-2));
    overflow: auto;
    animation: fade var(--t-med) var(--ease-out);
  }
  .inner {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100%;
    padding-block: max(16px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-bottom, 0px));
    padding-left: max(14px, env(safe-area-inset-left, 0px));
    padding-right: max(14px, env(safe-area-inset-right, 0px));
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  header { display: flex; justify-content: space-between; align-items: baseline; }
  .total { font-family: var(--font-display); font-variant-numeric: tabular-nums; display: flex; gap: 4px; align-items: baseline; }
  .total b { font-size: 46px; line-height: 1; }
  .total span { font-size: var(--fs-l); color: var(--ink-dim); font-weight: 600; }
  .bar { position: relative; height: 14px; border-radius: 7px; background: var(--surface); box-shadow: inset 0 2px 0 rgba(0, 0, 0, 0.08); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); transform-origin: left; transition: transform 160ms var(--ease-out); }
  .bar span.ok { background: var(--good); }
  .rules { display: flex; flex-wrap: wrap; gap: 6px; min-height: 34px; opacity: 0; transition: opacity var(--t-med); }
  .rules.show { opacity: 1; }
  .rules.show .flash { animation: flash 700ms var(--ease-pop); }
  .verdict { background: var(--surface); border-radius: var(--r-l); padding: 14px; box-shadow: var(--shadow); animation: rise var(--t-slow) var(--ease-pop); border-left: 0; }
  .verdict h3 { font-size: var(--fs-l); color: var(--bad); }
  .verdict.ok h3 { color: var(--good); }
  .wish { color: var(--gold); font-weight: 700; margin-top: 4px; }
  .life { margin: 0; padding-left: 20px; font-size: var(--fs-s); animation: rise var(--t-slow) var(--ease-out); }
  .actions { display: flex; flex-direction: column; margin-top: auto; }
  @keyframes flash { 0% { transform: scale(0.6); } 60% { transform: scale(1.12); box-shadow: 0 0 0 4px var(--gold-soft); } }
  @keyframes rise { from { transform: translateY(16px); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
</style>

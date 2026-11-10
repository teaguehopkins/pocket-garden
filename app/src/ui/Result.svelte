<script lang="ts">
  import { SPECIES } from '../core/content/species';
  import { plotById } from '../core/content/plots';
  import { wishById } from '../core/content/wishes';
  import { SEASONS, type RunState } from '../core/run';
  import Board from './Board.svelte';
  import { game, today } from './game.svelte';
  import { ruleName } from './text';

  let { run }: { run: RunState } = $props();
  const won = $derived(run.phase === 'won');
  const plot = $derived(run.plot ? plotById(run.plot) : null);

  function share() {
    const s = run;
    const w = s.board.w;
    const map = s.grid.map((t, i) => (!s.board.mask[i] ? '⬜' : t ? SPECIES[t.s].icon : '🟫'));
    let rows = '';
    for (let r = 0; r < s.board.h; r++) rows += map.slice(r * w, r * w + w).join('') + '\n';
    const where = s.daily ? `daily ${s.seed}` : plot ? plot.name : `rank ${s.rank}`;
    const txt = `Pocket Garden · ${where}\n${won ? 'Bloomed ' + '★'.repeat(s.stars ?? 0) : 'Wilted'} · ${s.banked} pts (${s.results.join(' / ')})\nRules: ${s.rules.map(ruleName).join(', ')}\n${rows}`;
    navigator.clipboard?.writeText(txt).then(
      () => (game.note = 'Copied your garden. Paste it anywhere.'),
      () => (game.note = txt),
    );
  }
</script>

<section class="card result" data-testid="result">
  <h2>{won ? 'Your garden bloomed all year' : `The garden wilted in ${SEASONS[run.season]}`}</h2>
  {#if won}<p class="stars big" aria-label="{run.stars} of 3 stars">{'★'.repeat(run.stars ?? 0)}<span class="off">{'★'.repeat(3 - (run.stars ?? 0))}</span></p>{/if}
  <p class="sum"><b>{run.banked}</b> points <span class="dim">({run.results.join(' + ')}){game.newBest ? ' · best on this seed' : ''}</span></p>
  {#if run.features.wishes && run.wishes.length}
    <ul class="wishes">
      {#each run.wishes as w, k (w)}<li class:done={run.wishDone[k]}>{run.wishDone[k] ? '★' : '☆'} {wishById(w).text}</li>{/each}
    </ul>
  {/if}
  {#if game.rankUp}<p class="rank">Journey rank {game.rankUp}{plot ? '. A new plot is waiting.' : '.'}</p>{/if}
</section>

<Board {run} weather={false} />

<div class="row">
  <button class="btn" onclick={share}>Copy garden</button>
  <button class="btn ghost" onclick={() => game.start(run.seed, run.daily)}>Replay seed</button>
</div>
{#if game.note}<p class="dim note">{game.note}</p>{/if}

<section class="rest">
  <p class="resting">The garden is resting. Start another whenever you like.</p>
  <div class="modes">
    <button class="mode" onclick={() => game.start(Math.floor(Math.random() * 1e8), false)}><b>New garden</b><span class="dim">Journey rank {game.profile.rank}</span></button>
    <button class="mode" onclick={() => game.start(today(), true)}><b>Daily garden</b><span class="dim">Same seeds for everyone today</span></button>
  </div>
</section>

<style>
  .result { display: flex; flex-direction: column; gap: 6px; text-align: center; align-items: center; animation: rise var(--t-slow) var(--ease-pop); }
  .result h2 { font-size: var(--fs-xl); }
  .big { font-size: 34px; line-height: 1; }
  .off { color: var(--surface-2); }
  .sum { font-family: var(--font-display); font-size: var(--fs-l); }
  .sum b { font-size: var(--fs-xl); }
  .wishes { list-style: none; padding: 0; margin: 4px 0 0; font-size: var(--fs-s); text-align: left; }
  .wishes .done { color: var(--gold); font-weight: 700; }
  .rank { color: var(--accent); font-weight: 700; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .note { white-space: pre-wrap; text-align: center; }
  .rest { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
  .resting { text-align: center; font-family: var(--font-display); color: var(--ink-dim); }
  .modes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .mode { border: 0; background: var(--surface); border-radius: var(--r-m); box-shadow: var(--shadow); padding: 12px; text-align: left; display: flex; flex-direction: column; gap: 2px; cursor: pointer; }
  .mode b { font: 600 var(--fs-m) var(--font-display); }
  @keyframes rise { from { transform: translateY(16px) scale(0.97); opacity: 0; } }
</style>

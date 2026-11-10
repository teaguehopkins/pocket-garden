<script lang="ts">
  // The resting screen after a year: how it went, what changed on the Lane, and nothing that starts by itself.
  import { SPECIES } from '../core/content/species';
  import { RULES } from '../core/content/rules';
  import { plotById } from '../core/content/plots';
  import { wishById } from '../core/content/wishes';
  import { achievementById } from '../core/content/achievements';
  import { laneStars } from '../core/profile';
  import { SEASONS, type RunState } from '../core/run';
  import Tile from '../art/Tile.svelte';
  import Board from './Board.svelte';
  import { game } from './game.svelte';
  import { ruleName } from './text';

  let { run }: { run: RunState } = $props();
  const won = $derived(run.phase === 'won');
  const plot = $derived(run.plot ? plotById(run.plot) : null);
  const lane = $derived(game.lane);
  const unlockedSpecies = $derived(lane?.unlocked.flatMap((u) => u.species ?? []) ?? []);
  const unlockedRules = $derived(lane?.unlocked.flatMap((u) => u.rules ?? []) ?? []);
  const changed = $derived(
    !!lane && (lane.newWishes.length > 0 || lane.plotOpened !== null || lane.unlocked.length > 0 || lane.plotBest || lane.tutorialDone || game.runAchievements.length > 0),
  );

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
  {#if won && run.wishes.length}<p class="stars big" aria-label="{run.stars} of 3 wishes">{'★'.repeat(run.stars ?? 0)}<span class="off">{'★'.repeat(3 - (run.stars ?? 0))}</span></p>{/if}
  <p class="sum"><b>{run.banked}</b> points <span class="dim">({run.results.join(' + ')}){game.newBest ? ' · best on this seed' : ''}</span></p>
  {#if run.features.wishes && run.wishes.length}
    <ul class="wishes">
      {#each run.wishes as w, k (w)}<li class:done={run.wishDone[k]}>{run.wishDone[k] ? '★' : '☆'} {wishById(w).text}</li>{/each}
    </ul>
    {#if !won && run.wishDone.some(Boolean)}<p class="dim">Wishes only count in a year that blooms.</p>{/if}
  {/if}
</section>

<Board {run} weather={false} />

{#if changed && lane}
  <section class="card changes" aria-label="What changed on the Lane">
    <h3>On the Lane</h3>
    {#if lane.tutorialDone}<p>The Lane is open. Your first plot, the Raised Bed, is waiting.</p>{/if}
    {#if lane.newWishes.length}<p class="gold">★ {lane.newWishes.length} new wish star{lane.newWishes.length === 1 ? '' : 's'} on {plot?.name}: {lane.newWishes.map((w) => wishById(w).text.toLowerCase()).join('; ')}. {laneStars(game.profile)} in all.</p>{/if}
    {#if lane.plotBest}<p>This is now your best garden on {plot?.name}. It stays there as the plot's miniature.</p>{/if}
    {#if lane.plotOpened}<p>A new plot has opened: <b>{plotById(lane.plotOpened)?.name}</b>. {plotById(lane.plotOpened)?.twist}</p>{/if}
    {#if unlockedSpecies.length}
      <div class="new"><span>New seeds in your tin:</span>{#each unlockedSpecies as k (k)}<span class="sp"><Tile id={k} size={36} /><small>{SPECIES[k].name}</small></span>{/each}</div>
    {/if}
    {#if unlockedRules.length}<p>New rules may now turn up: {unlockedRules.map((r) => RULES[r].name).join(', ')}.</p>{/if}
    {#each game.runAchievements as a (a)}<p class="verb">✿ {achievementById(a)?.name}: {achievementById(a)?.text}</p>{/each}
  </section>
{/if}

<p class="resting">The garden is resting. Come back whenever you like.</p>
<div class="row">
  <button class="btn" onclick={() => (game.view = 'lane')}>Back to the Lane</button>
  <button class="btn ghost" onclick={() => game.replay()}>Replay this seed</button>
</div>
<button class="btn ghost" onclick={share}>Copy garden</button>
{#if game.note}<p class="dim note">{game.note}</p>{/if}

<style>
  .result { display: flex; flex-direction: column; gap: 6px; text-align: center; align-items: center; animation: rise var(--t-slow) var(--ease-pop); }
  .result h2 { font-size: var(--fs-xl); }
  .big { font-size: 34px; line-height: 1; }
  .off { color: var(--surface-2); }
  .sum { font-family: var(--font-display); font-size: var(--fs-l); }
  .sum b { font-size: var(--fs-xl); }
  .wishes { list-style: none; padding: 0; margin: 4px 0 0; font-size: var(--fs-s); text-align: left; }
  .wishes .done { color: var(--gold); font-weight: 700; }
  .changes { display: flex; flex-direction: column; gap: 6px; font-size: var(--fs-s); animation: rise var(--t-slow) var(--ease-out) 200ms backwards; }
  .changes h3 { font-size: var(--fs-l); }
  .gold { color: var(--gold); font-weight: 700; }
  .new { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .sp { display: inline-flex; flex-direction: column; align-items: center; font-size: var(--fs-xs); }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .note { white-space: pre-wrap; text-align: center; }
  .resting { text-align: center; font-family: var(--font-display); color: var(--ink-dim); margin-top: 6px; }
  @keyframes rise { from { transform: translateY(16px) scale(0.97); opacity: 0; } }
</style>

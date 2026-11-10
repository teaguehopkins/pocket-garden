<script lang="ts">
  import { WEATHER } from '../core/content/weather';
  import { PER_SEASON, SEASONS, currentScore, type RunState } from '../core/run';
  import { game } from './game.svelte';

  let { run }: { run: RunState } = $props();
  const season = $derived(Math.min(run.season, 2));
  const score = $derived(currentScore(run));
  const target = $derived(run.targets[season]);
  const done = $derived(run.phase === 'play' ? run.placed % PER_SEASON : 0);
  const fill = $derived(Math.min(1, score / Math.max(1, target)));
</script>

<section class="card status" aria-label="Season">
  <div class="top">
    <div class="name">
      <h2>{SEASONS[season]}</h2>
      <button class="chip weather" onclick={() => (game.sheet = 'weather')}>{WEATHER[run.mods[season]].name} · {WEATHER[run.mods[season]].text}</button>
    </div>
    <div class="score" aria-live="polite">
      <b data-testid="score">{score}</b><span>/ {target}</span>
    </div>
  </div>
  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={target} aria-valuenow={score} aria-label="Score toward target">
    <span style="transform:scaleX({fill})" class:ok={score >= target}></span>
  </div>
  <div class="foot">
    <span class="dots" aria-label="{PER_SEASON - done} plantings left">
      {#each Array(PER_SEASON) as _, k (k)}<i class:on={k < done}></i>{/each}
      <span class="dim">{PER_SEASON - done} to plant</span>
    </span>
    <span class="ledger">
      {#each SEASONS as n, i (n)}
        {@const r = run.results[i]}
        <span class="pill" class:now={i === season && r === undefined} class:ok={r !== undefined && r >= run.targets[i]} class:bad={r !== undefined && r < run.targets[i]} title="{n}: {r ?? '—'} / {run.targets[i]}">
          {n.slice(0, 3)} {r !== undefined ? (r >= run.targets[i] ? '✓' : '✗') : run.targets[i]}
        </span>
      {/each}
    </span>
  </div>
</section>

<style>
  .status { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .name { display: flex; flex-direction: column; gap: 4px; min-width: 0; align-items: flex-start; }
  h2 { font-size: var(--fs-xl); line-height: 1; }
  .weather { min-height: 28px; padding: 4px 10px; font-size: var(--fs-xs); max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .score { display: flex; align-items: baseline; gap: 4px; font-family: var(--font-display); font-variant-numeric: tabular-nums; }
  .score b { font-size: var(--fs-xxl); line-height: 1; font-weight: 700; }
  .score span { color: var(--ink-dim); font-size: var(--fs-l); font-weight: 600; }
  .bar { height: 10px; border-radius: 5px; background: var(--surface-2); overflow: hidden; box-shadow: inset 0 2px 0 rgba(0, 0, 0, 0.08); }
  .bar span { display: block; height: 100%; background: var(--accent); transform-origin: left; transition: transform var(--t-slow) var(--ease-out); border-radius: 5px; }
  .bar span.ok { background: var(--good); }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
  .dots { display: inline-flex; align-items: center; gap: 4px; }
  .dots i { width: 10px; height: 10px; border-radius: 5px; background: var(--surface-2); box-shadow: inset 0 0 0 1.5px var(--line); }
  .dots i.on { background: var(--accent); box-shadow: none; }
  .dots .dim { margin-left: 4px; }
  .ledger { display: inline-flex; gap: 4px; }
  .pill { font: 600 var(--fs-xs) var(--font-display); padding: 2px 8px; border-radius: var(--r-pill); background: var(--surface-2); color: var(--ink-dim); font-variant-numeric: tabular-nums; }
  .pill.now { background: var(--accent); color: var(--accent-ink); }
  .pill.ok { color: var(--good); }
  .pill.bad { color: var(--bad); }
</style>

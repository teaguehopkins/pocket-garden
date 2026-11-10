<script lang="ts">
  import { WEATHER } from '../core/content/weather';
  import { SEASONS, type RunState } from '../core/run';
  let { run }: { run: RunState } = $props();
</script>

<div class="ledger">
  {#each SEASONS as name, i (name)}
    {@const r = run.results[i]}
    <div class="sea" class:now={r === undefined && i === run.season && run.phase === 'play'} class:ok={r !== undefined && r >= run.targets[i]} class:bad={r !== undefined && r < run.targets[i]}>
      {name}
      <b>{r === undefined ? `need ${run.targets[i]}` : `${r} / ${run.targets[i]}`}</b>
      <span class="mod">{WEATHER[run.mods[i]].name}</span>
      <span class="dim" style="font-size:11px">{WEATHER[run.mods[i]].text}</span>
    </div>
  {/each}
</div>

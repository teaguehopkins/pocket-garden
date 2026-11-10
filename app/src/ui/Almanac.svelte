<script lang="ts">
  // The Almanac: species and rules you have met, with your records, and the combos you have found.
  import { ACHIEVEMENTS } from '../core/content/achievements';
  import { UNLOCKS } from '../core/content/progress';
  import { ruleList } from '../core/content/rules';
  import { speciesList } from '../core/content/species';
  import { currentPool } from '../core/profile';
  import Tile from '../art/Tile.svelte';
  import { game } from './game.svelte';

  type Tab = 'species' | 'rules' | 'combos';
  let tab = $state<Tab>('species');
  const p = $derived(game.profile);
  const pool = $derived(currentPool(p));
  const species = speciesList.filter((s) => s.p1 && !s.hidden);
  const rules = ruleList.filter((r) => r.p1);
  const unlockStars = (id: string) => UNLOCKS.find((u) => u.species?.includes(id) || u.rules?.includes(id))?.stars;
  const metSpecies = $derived(species.filter((s) => p.species[s.id]?.met).length);
  const metRules = $derived(rules.filter((r) => p.rules[r.id]?.met).length);
  const found = $derived(Object.keys(p.achievements).length);
</script>

<div class="head">
  <h2>Almanac</h2>
  <button class="chip" onclick={() => (game.view = 'lane')}>Back to the Lane</button>
</div>

<div class="tabs" role="tablist">
  <button role="tab" aria-selected={tab === 'species'} class:on={tab === 'species'} onclick={() => (tab = 'species')}>Species {metSpecies}/{species.length}</button>
  <button role="tab" aria-selected={tab === 'rules'} class:on={tab === 'rules'} onclick={() => (tab = 'rules')}>Rules {metRules}/{rules.length}</button>
  <button role="tab" aria-selected={tab === 'combos'} class:on={tab === 'combos'} onclick={() => (tab = 'combos')}>Combos {found}/{ACHIEVEMENTS.length}</button>
</div>

{#if tab === 'species'}
  <div class="grid">
    {#each species as s (s.id)}
      {@const rec = p.species[s.id]}
      {@const avail = pool.species.includes(s.id)}
      {#if rec?.met}
        <button class="entry" onclick={() => (game.sheet = { species: s.id })}>
          <span class="art"><Tile id={s.id} size={52} /></span>
          <b>{s.name}</b>
          <span class="dim">{rec.bestTile ? `best ${rec.bestTile}` : 'not grown yet'}</span>
        </button>
      {:else}
        <div class="entry unknown">
          <span class="art"><span class="sil"><Tile id={s.id} size={52} /></span></span>
          <b>?</b>
          <span class="dim">{avail ? 'not met yet' : `at ★ ${unlockStars(s.id)}`}</span>
        </div>
      {/if}
    {/each}
  </div>
{:else if tab === 'rules'}
  <ul class="list">
    {#each rules as r (r.id)}
      {@const rec = p.rules[r.id]}
      <li class="card row" class:unknown={!rec?.met}>
        {#if rec?.met}
          <b>{r.name}{#if r.keystone} <span class="tag">keystone</span>{/if}</b>
          <span>{r.text}</span>
          <span class="dim">{rec.taken ? `Taken ${rec.taken}× · bloomed ${rec.bloomed}×` : 'Seen, never taken'}</span>
        {:else}
          <b>?</b><span class="dim">{pool.rules.includes(r.id) ? 'Not met yet' : `Arrives at ★ ${unlockStars(r.id)}`}</span>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <ul class="list">
    {#each ACHIEVEMENTS as a (a.id)}
      {@const when = p.achievements[a.id]}
      <li class="card row" class:unknown={!when}>
        <b>{when ? '✿' : '○'} {a.name}</b>
        <span>{a.text}</span>
        {#if when}<span class="dim">Found {when}</span>{/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .head { display: flex; justify-content: space-between; align-items: center; }
  .tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; background: var(--surface); border-radius: var(--r-pill); padding: 4px; box-shadow: var(--shadow); }
  .tabs button { border: 0; background: transparent; border-radius: var(--r-pill); padding: 8px 4px; font: 600 var(--fs-s) var(--font-display); cursor: pointer; color: var(--ink-dim); }
  .tabs button.on { background: var(--accent); color: var(--accent-ink); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
  .entry { border: 0; background: var(--surface); border-radius: var(--r-m); box-shadow: var(--shadow); padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; text-align: center; min-width: 0; }
  .entry b { font: 600 var(--fs-s) var(--font-display); }
  .entry .dim { font-size: var(--fs-xs); }
  .art { background: var(--soil); border-radius: 12px; padding: 3px; }
  .unknown { cursor: default; }
  .sil { display: block; filter: brightness(0) opacity(0.35); }
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .row { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; font-size: var(--fs-s); }
  .row b { font: 600 var(--fs-m) var(--font-display); color: var(--verb); }
  .row.unknown { opacity: 0.75; }
  .row.unknown b { color: var(--ink-dim); }
</style>

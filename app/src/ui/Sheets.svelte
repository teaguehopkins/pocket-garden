<script lang="ts">
  import { SPECIES, speciesList } from '../core/content/species';
  import { RULES, ruleList } from '../core/content/rules';
  import { WEATHER } from '../core/content/weather';
  import { wishById } from '../core/content/wishes';
  import { SEASONS, rulePool, speciesPool, type RunState } from '../core/run';
  import type { Features } from '../core/types';
  import Tile from '../art/Tile.svelte';
  import Sheet from './Sheet.svelte';
  import { game } from './game.svelte';
  import { saveSettings, settings } from './settings.svelte';
  import { favouritePair } from '../core/profile';
  import { spText, verbGlyph, verbText } from './text';

  let { run: maybeRun }: { run: RunState | null } = $props();
  // Outside a run (Lane, Almanac) sheets describe things using the current game version.
  const run = $derived(maybeRun ?? ({ features: game.features, pool: null, rules: [], wishes: [], wishDone: [], roster: [], bag: [], queue: [], mods: [], targets: [], season: 0 } as unknown as RunState));
  const close = () => (game.sheet = null);
  const kind = $derived(game.sheet);
  const bag = $derived.by(() => {
    const m = new Map<string, number>();
    for (const k of run.roster) m.set(k, 0);
    for (const k of run.bag) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m];
  });
  const FEATURE_LABELS: [keyof Features, string][] = [
    ['bag', 'Seed bag'], ['life', 'Seasonal life'], ['plots', 'Plots'], ['tools', 'Tools'], ['wishes', 'Wishes'], ['content', 'New species and rules'],
  ];
  const title = $derived(
    kind === null ? '' : typeof kind === 'object' ? SPECIES[kind.species].name
      : { rules: 'Garden rules', weather: 'Weather this year', wishes: 'Wishes', bag: 'Seed bag', guide: 'Field guide', settings: 'Settings' }[kind],
  );
</script>

{#snippet speciesRow(id: string)}
  {@const sp = SPECIES[id]}
  <div class="sprow">
    <span class="art"><Tile {id} size={44} /></span>
    <span><b>{sp.name}</b> <span class="tag">{sp.group}</span><br /><span class="dim">{spText(id, run)}</span>
      {#if run.features.life && sp.verb}<br /><span class="verb">{verbGlyph(sp.verb)} {verbText(sp.verb)}</span>{/if}</span>
  </div>
{/snippet}

{#if kind !== null}
  <Sheet {title} onclose={close}>
    {#if typeof kind === 'object'}
      {@render speciesRow(kind.species)}
      {@const rec = game.profile.species[kind.species]}
      {@const fav = favouritePair(rec)}
      {#if rec}
        <dl class="recs">
          <dt>Planted</dt><dd>{rec.planted} time{rec.planted === 1 ? '' : 's'} in finished gardens</dd>
          <dt>Best tile</dt><dd>{rec.bestTile ? `${rec.bestTile} points` : '—'}</dd>
          <dt>Favourite neighbour</dt><dd>{fav ? SPECIES[fav].name : '—'}</dd>
        </dl>
      {/if}
    {:else if kind === 'rules'}
      {#if !run.rules.length}<p class="dim">No rules yet.</p>{/if}
      {#each run.rules as id (id)}<div class="rule"><b>{RULES[id].name}</b><span>{RULES[id].text}</span></div>{/each}
    {:else if kind === 'weather'}
      {#each SEASONS as n, i (n)}
        <div class="rule" class:now={i === Math.min(run.season, 2)}><b>{n}: {WEATHER[run.mods[i]].name}</b><span>{WEATHER[run.mods[i]].text}. Needs {run.targets[i]}.</span></div>
      {/each}
    {:else if kind === 'wishes'}
      {#each run.wishes as w, k (w)}<p class:done={run.wishDone[k]}>{run.wishDone[k] ? '★' : '☆'} {wishById(w).text}</p>{/each}
      <p class="dim">Wishes are optional. Each one granted is a star if the garden blooms all year.</p>
    {:else if kind === 'bag'}
      <p class="dim">{run.bag.length} packets left in the bag, plus {run.queue.length} on the shelf and in line.</p>
      <div class="bag">{#each bag as [k, n] (k)}<span class:empty={!n}><Tile id={k} size={40} /><b>×{n}</b></span>{/each}</div>
    {:else if kind === 'guide'}
      <h3>Species</h3>
      {#each speciesList.filter((s) => speciesPool(run).includes(s.id)) as s (s.id)}{@render speciesRow(s.id)}{/each}
      <h3>Rules</h3>
      {#each ruleList.filter((r) => rulePool(run).includes(r.id)) as r (r.id)}<div class="rule"><b>{r.name}</b><span>{r.text}</span></div>{/each}
    {:else if kind === 'settings'}
      <label class="toggle"><input type="checkbox" bind:checked={settings.sound} onchange={saveSettings} /> Sound</label>
      <label class="toggle"><input type="checkbox" bind:checked={settings.haptics} onchange={saveSettings} /> Vibration</label>
      <div class="seg" role="radiogroup" aria-label="Theme">
        {#each ['system', 'light', 'dark'] as const as t (t)}
          <label><input type="radio" name="theme" value={t} bind:group={settings.theme} onchange={saveSettings} /> {t === 'system' ? 'Match device' : t === 'light' ? 'Day' : 'Dusk'}</label>
        {/each}
      </div>
      <h3>Lab: game version for new gardens</h3>
      <div class="lab">
        {#each FEATURE_LABELS as [k, label] (k)}
          <label class="toggle"><input type="checkbox" checked={game.features[k]} onchange={() => game.setFeatures({ ...game.features, [k]: !game.features[k] })} /> {label}</label>
        {/each}
      </div>
      <button class="btn ghost" onclick={() => game.start(Math.floor(Math.random() * 1e8), false)}>Start a new garden now</button>
      <p class="dim">{game.profile.runs} gardens · {game.profile.years} full years · {game.profile.stars} ★ · best {game.profile.best}</p>
    {/if}
  </Sheet>
{/if}

<style>
  h3 { font-size: var(--fs-m); margin-top: 6px; }
  .recs { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; margin: 0; font-size: var(--fs-s); background: var(--surface-2); border-radius: var(--r-s); padding: 10px 12px; }
  .recs dt { color: var(--ink-dim); }
  .recs dd { margin: 0; font-weight: 700; }
  .sprow { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 10px; align-items: center; font-size: var(--fs-s); }
  .sprow b { font-family: var(--font-display); font-size: var(--fs-m); font-weight: 600; }
  .art { background: var(--soil); border-radius: 12px; padding: 4px; display: grid; place-items: center; }
  .rule { display: flex; flex-direction: column; background: var(--surface-2); border-radius: var(--r-s); padding: 10px 12px; font-size: var(--fs-s); }
  .rule b { font-family: var(--font-display); font-weight: 600; font-size: var(--fs-m); color: var(--verb); }
  .rule.now { box-shadow: inset 0 0 0 2px var(--accent); }
  .done { color: var(--gold); font-weight: 700; }
  .bag { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .bag span { display: flex; align-items: center; gap: 6px; background: var(--surface-2); border-radius: var(--r-s); padding: 6px; font-family: var(--font-display); }
  .bag .empty { opacity: 0.45; }
  .toggle { display: flex; align-items: center; gap: 10px; min-height: 40px; font-size: var(--fs-m); }
  .toggle input, .seg input { width: 20px; height: 20px; accent-color: var(--accent); }
  .seg { display: flex; gap: 14px; flex-wrap: wrap; }
  .seg label { display: flex; align-items: center; gap: 6px; min-height: 40px; }
  .lab { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; }
  .lab .toggle { font-size: var(--fs-s); }
</style>

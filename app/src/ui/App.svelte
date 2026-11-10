<script lang="ts">
  import { SPECIES, speciesList } from '../core/content/species';
  import { ruleList } from '../core/content/rules';
  import { plotById } from '../core/content/plots';
  import { wishById } from '../core/content/wishes';
  import {
    DRAFT_SIZE, SEASONS, aheadN, currentScore, emptySquares, plantingsLeft, shelfN, speciesPool, rulePool, type RunState,
  } from '../core/run';
  import type { Features } from '../core/types';
  import Ledger from './Ledger.svelte';
  import Plot from './Plot.svelte';
  import { game, today } from './game.svelte';
  import { ruleName, ruleText, spText, verbText } from './text';

  const run = $derived(game.run as RunState);
  const plot = $derived(run.plot ? plotById(run.plot) : null);
  const sel = $derived(game.sel !== null ? run.queue[game.sel] : null);
  const bagCounts = $derived.by(() => {
    const m = new Map<string, number>();
    for (const k of run.roster) m.set(k, 0);
    for (const k of run.bag) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m];
  });
  const noRoom = $derived(run.phase === 'play' && emptySquares(run).length === 0);

  function choose(i: number) {
    if (i >= shelfN(run)) return;
    game.sel = game.sel === i ? null : i;
    if (game.tool === 'trowel') game.tool = null;
  }
  function setTool(t: 'trowel' | 'replant') {
    game.tool = game.tool === t ? null : t;
    game.trowelFrom = null;
  }

  function share() {
    const s = run;
    const w = s.board.w;
    const map = s.grid.map((t, i) => (!s.board.mask[i] ? '⬜' : t ? SPECIES[t.s].icon : '🟫'));
    let rows = '';
    for (let r = 0; r < s.board.h; r++) rows += map.slice(r * w, r * w + w).join('') + '\n';
    const where = s.daily ? `daily ${s.seed}` : plot ? plot.name : `rank ${s.rank}`;
    const txt = `Pocket Garden ${where}\n${s.phase === 'won' ? 'Bloomed ' + '★'.repeat(s.stars ?? 0) : 'Wilted'} · ${s.banked} pts (${s.results.join(' / ')})\nRules: ${s.rules.map(ruleName).join(', ')}\n${rows}`;
    navigator.clipboard?.writeText(txt).then(
      () => (game.note = 'Copied garden to clipboard.'),
      () => (game.note = txt),
    );
  }

  function toggle(k: keyof Features) {
    game.setFeatures({ ...game.features, [k]: !game.features[k] });
  }
  const FEATURE_LABELS: [keyof Features, string][] = [
    ['bag', 'Seed bag'], ['life', 'Seasonal life'], ['plots', 'Plots'], ['tools', 'Tools'], ['wishes', 'Wishes'], ['content', 'New species and rules'],
  ];
</script>

<main id="app">
  <div class="top">
    <h1>Pocket Garden</h1>
    <span class="dim">{run.daily ? `Daily ${run.seed}` : `Journey · rank ${run.rank}`}{plot ? ` · ${plot.name}` : ''}</span>
  </div>

  <Ledger {run} />
  {#if plot && run.phase === 'draft'}<p class="dim"><b>{plot.name}:</b> {plot.twist}</p>{/if}

  {#if run.features.wishes && run.wishes.length}
    <div class="wishes" aria-label="Wishes">
      {#each run.wishes as id, k (id)}
        <span class="wish" class:done={run.wishDone[k]}>{run.wishDone[k] ? '★' : '☆'} {wishById(id).text}</span>
      {/each}
    </div>
  {/if}

  {#if run.phase === 'draft'}
    <h2>Choose your seeds · {run.roster.length + 1} of {DRAFT_SIZE}</h2>
    <p class="dim">
      Only the species you draft appear this year{run.features.bag ? ', 3 packets of each in your seed bag' : ' on your shelf'}. Plan for the weather above.
    </p>
    <div class="roster" aria-label="Your species">{#each run.roster as k (k)}<span title={SPECIES[k].name}>{SPECIES[k].icon}</span>{/each}</div>
    <div class="choice">
      {#each run.offer as k (k)}
        <button class="opt" onclick={() => game.act({ type: 'draft', id: k })}>
          <span class="ic">{SPECIES[k].icon}</span>
          <b>{SPECIES[k].name} <span class="tag">{SPECIES[k].group}</span></b>
          <span class="dim">{spText(k, run)}{#if run.features.life && SPECIES[k].verb} <span class="verb" style="color:var(--rule)">{verbText(SPECIES[k].verb)}</span>{/if}</span>
        </button>
      {/each}
    </div>
  {:else if run.phase === 'rule'}
    {@const first = !run.results.length}
    {#if !first}
      <div class="msg">
        <p><b>{SEASONS[run.season - 1]} scored {run.results.at(-1)}.</b> The garden carries over. {SEASONS[run.season]} needs {run.targets[run.season]}.</p>
        {#if run.changes.length}
          <ul class="changes">
            {#each run.changes as c, n (n)}
              <li>
                {#if c.kind === 'grew'}{SPECIES[c.from].icon} {SPECIES[c.from].name} grew into {SPECIES[c.to].name} {SPECIES[c.to].icon}
                {:else if c.kind === 'spread'}{SPECIES[c.s].icon} {SPECIES[c.s].name} spread to a new square
                {:else}{SPECIES[c.s].icon} {SPECIES[c.s].name} grew stronger (+{c.by}){/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
    <h2>{first ? 'Pick your first garden rule' : 'Pick a new garden rule'}</h2>
    <p class="dim">Rules stack for the rest of the year. Your seeds:</p>
    <div class="roster">{#each run.roster as k (k)}<span title={SPECIES[k].name}>{SPECIES[k].icon}</span>{/each}</div>
    {#if run.rules.length}<div class="rules">{#each run.rules as k (k)}<span class="rchip">{ruleName(k)}: {ruleText(k)}</span>{/each}</div>{/if}
    <div class="choice">
      {#each run.ruleOffer as k (k)}
        <button class="opt rule" onclick={() => game.act({ type: 'rule', id: k })}>
          <span class="ic">✦</span><b>{ruleName(k)}</b><span class="dim">{ruleText(k)}</span>
        </button>
      {/each}
    </div>
  {:else}
    {#if run.rules.length}<div class="rules">{#each run.rules as k (k)}<span class="rchip">{ruleName(k)}: {ruleText(k)}</span>{/each}</div>{/if}
    <div class="scoreline">
      <span class="dim">{SEASONS[Math.min(run.season, 2)]} score now{run.phase === 'play' ? ` · ${plantingsLeft(run)} plantings left` : ''}</span>
      <span class="big" data-testid="score">{currentScore(run)}</span>
    </div>
    <Plot {run} interactive={run.phase === 'play'} />

    {#if run.phase === 'play'}
      <p class="dim">
        {#if game.tool === 'trowel'}{game.trowelFrom === null ? 'Trowel: tap a tile to move.' : 'Now tap an empty square.'}
        {:else if game.tool === 'replant'}{sel ? 'Replant: tap a tile to plant over it.' : 'Replant: pick a packet first.'}
        {:else if noRoom}No empty squares. Plant over a tile with Replant, or let a packet go to seed.
        {:else if sel}Tap a square to plant. Numbers show the change to this season's score{run.features.life ? '; "later" tiles pay off at season end' : ''}.
        {:else}Pick a packet from the shelf. The next in line slides on.{/if}
      </p>
      <div class="packets" style="--cols:{shelfN(run)}">
        {#each run.queue.slice(0, shelfN(run)) as k, i (i)}
          <button class="pk" class:sel={game.sel === i} onclick={() => choose(i)} data-testid="packet">
            <span class="ic">{SPECIES[k].icon}</span><b>{SPECIES[k].name}</b>
            <span class="tx">{spText(k, run)}</span>
            {#if run.features.life && SPECIES[k].verb}<span class="verb">{verbText(SPECIES[k].verb)}</span>{/if}
          </button>
        {/each}
      </div>
      <div class="soon">
        <span class="dim">Coming up</span>
        {#each run.queue.slice(shelfN(run), shelfN(run) + aheadN(run)) as k, n (n)}
          {#if n}<span class="dim">›</span>{/if}<span class="sn">{SPECIES[k].icon}<small>{SPECIES[k].name}</small></span>
        {/each}
      </div>
      {#if run.features.bag}
        <details>
          <summary>Seed bag: {run.bag.length} packets left</summary>
          <div class="bagline">{#each bagCounts as [k, n] (k)}<span>{SPECIES[k].icon}<small>×{n}</small></span>{/each}</div>
        </details>
      {/if}
      {#if run.features.tools}
        <span class="dim">Tools · {run.rerolls} use{run.rerolls === 1 ? '' : 's'} left this season</span>
        <div class="tools">
          <button class="btn ghost" disabled={!run.rerolls} onclick={() => game.act({ type: 'compost' })}>Compost shelf</button>
          <button class="btn ghost" class:on={game.tool === 'trowel'} disabled={!run.rerolls} onclick={() => setTool('trowel')}>Trowel</button>
          <button class="btn ghost" class:on={game.tool === 'replant'} disabled={!run.rerolls} onclick={() => setTool('replant')}>Replant</button>
        </div>
      {:else}
        <button class="btn ghost" disabled={!run.rerolls} onclick={() => game.act({ type: 'compost' })}>Compost the shelf ({run.rerolls} left this season)</button>
      {/if}
      {#if noRoom && game.sel !== null}
        <button class="btn ghost" onclick={() => game.act({ type: 'skip', slot: game.sel! })}>Let {SPECIES[run.queue[game.sel]].name} go to seed</button>
      {/if}
    {:else}
      <div class="msg" data-testid="result">
        <p>
          <b>{run.phase === 'won' ? `Your garden bloomed all year. ${'★'.repeat(run.stars ?? 0)}${'☆'.repeat(3 - (run.stars ?? 0))}` : `The garden wilted in ${SEASONS[run.season]}.`}</b>
          Total {run.banked} points{game.newBest ? ' · new best on this seed' : ''}.
        </p>
        {#if run.phase === 'won'}<p class="dim">{run.features.wishes ? 'One star per wish granted.' : "Stars: 2 for beating Autumn's target by 7%, 3 for 15%."}</p>{/if}
        {#if game.rankUp}<p class="hi">Journey rank {game.rankUp}.</p>{/if}
        {#if game.note}<p class="dim" style="white-space:pre-wrap">{game.note}</p>{/if}
        <div class="row">
          <button class="btn" onclick={share}>Copy garden</button>
          <button class="btn ghost" onclick={() => game.start(run.seed, run.daily)}>Replay this seed</button>
        </div>
        <p class="dim">The garden is resting. Start another when you like.</p>
        <div class="modes">
          <button class="mode" onclick={() => game.start(Math.floor(Math.random() * 1e8), false)}><b>New journey garden</b><span class="dim">Rank {game.profile.rank}. Win a year to rank up.</span></button>
          <button class="mode" onclick={() => game.start(today(), true)}><b>Daily garden</b><span class="dim">Same weather, seeds and rule offers for everyone today.</span></button>
        </div>
      </div>
    {/if}
  {/if}

  <details>
    <summary>All species and rules</summary>
    <div class="guide">
      {#each speciesList.filter((s) => speciesPool(run).includes(s.id)) as s (s.id)}
        <span>{s.icon}</span><span><b>{s.name}</b> <span class="tag">{s.group}</span>: {spText(s.id, run)} {#if run.features.life && s.verb}<i>{verbText(s.verb)}</i>{/if}</span>
      {/each}
      {#each ruleList.filter((r) => rulePool(run).includes(r.id)) as r (r.id)}
        <span>✦</span><span><b>{r.name}</b>: {r.text}</span>
      {/each}
    </div>
  </details>

  <details>
    <summary>Lab: game version for new gardens</summary>
    <div class="lab">
      {#each FEATURE_LABELS as [k, label] (k)}
        <label><input type="checkbox" checked={game.features[k]} onchange={() => toggle(k)} /> {label}</label>
      {/each}
    </div>
    <div class="row" style="margin-top:8px">
      <button class="btn ghost" onclick={() => game.start(Math.floor(Math.random() * 1e8), false)}>Start a new garden now</button>
    </div>
  </details>

  <p class="dim">
    {game.profile.runs} gardens · {game.profile.years} full years · {game.profile.stars} ★ · best {game.profile.best}
  </p>
</main>

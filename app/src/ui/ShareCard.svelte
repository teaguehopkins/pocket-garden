<script lang="ts">
  // Off-screen SVG of a finished garden, 1080×1350, used to make the share image.
  // Text is drawn afterwards on a canvas so it can use the app's own font.
  import { SPECIES } from '../core/content/species';
  import { scoreCtx, type RunState } from '../core/run';
  import { cellScores, isReal } from '../core/score';
  import Tile from '../art/Tile.svelte';

  let { run }: { run: RunState } = $props();
  const W = 1080, H = 1350, TOP = 330, PAD = 70;
  // The card is mounted once per share, so reading `run` up front is fine.
  const r0 = (() => run)();
  const b = r0.board;
  const cell = Math.floor(Math.min((W - 2 * PAD - 60) / b.w, (H - TOP - 160 - 60) / b.h));
  const gw = cell * b.w, gh = cell * b.h;
  const x0 = (W - gw) / 2, y0 = TOP + 30;
  const scores = cellScores(scoreCtx(r0));
  const sky = ['#d4efe2', '#cfe7f2', '#f3dcc3'][Math.min(r0.season, 2)];
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox="0 0 {W} {H}">
  <rect width={W} height={H} fill={sky} />
  <rect x={x0 - 30} y={y0 - 30} width={gw + 60} height={gh + 70} rx="44" fill="#8c5a2b" />
  <rect x={x0 - 30} y={y0 - 30} width={gw + 60} height={gh + 56} rx="44" fill="#c08446" />
  <rect x={x0 - 12} y={y0 - 12} width={gw + 24} height={gh + 24} rx="28" fill="#533826" />
  {#each run.grid as t, i (i)}
    {@const x = x0 + (i % b.w) * cell}
    {@const y = y0 + Math.floor(i / b.w) * cell}
    {#if b.mask[i]}
      <rect x={x + 5} y={y + 5} width={cell - 10} height={cell - 10} rx="22" fill={b.fx[i] === 'sunny' ? '#8a6238' : b.fx[i] === 'shade' ? '#4a3221' : '#6b4a33'} />
      {#if t}
        <g transform="translate({x + cell * 0.06} {y + cell * 0.04})"><Tile id={t.s} size={cell * 0.88} /></g>
        {#if isReal(t) && SPECIES[t.s].group !== 'none'}
          <circle cx={x + cell - 26} cy={y + cell - 26} r="22" fill="#fffaf0" />
          <text x={x + cell - 26} y={y + cell - 18} text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="24" fill="#2b2118">{scores[i]}</text>
        {/if}
      {/if}
    {/if}
  {/each}
</svg>

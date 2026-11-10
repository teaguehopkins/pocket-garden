<script lang="ts">
  // One clay piece per species, drawn in a 100×100 box with the ground line at y≈86.
  // Groups carry motion classes (sway, bob, flap, ripple, blink, wiggle) used by the living board.
  let { id, size = 64, live = false, label }: { id: string; size?: number | string; live?: boolean; label?: string } = $props();

  // Hedgehog spikes along the top of its back.
  const spikes = Array.from({ length: 11 }, (_, k) => {
    const a = Math.PI * (1.08 + (k / 10) * 0.84);
    const cx = 54 + 33 * Math.cos(a), cy = 78 + 38 * Math.sin(a);
    const ox = 10 * Math.cos(a), oy = 10 * Math.sin(a);
    const px = -4 * Math.sin(a), py = 4 * Math.cos(a);
    return `${cx + px},${cy + py} ${cx + ox},${cy + oy} ${cx - px},${cy - py}`;
  });
  const lavender = [
    { x: 34, top: 22, tilt: -8 },
    { x: 50, top: 14, tilt: 0 },
    { x: 66, top: 22, tilt: 8 },
  ];
</script>

<svg class="tile" class:live viewBox="0 0 100 100" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
  {#if id === 'oak'}
    <ellipse cx="52" cy="88" rx="30" ry="7" fill="url(#g-shadow)" />
    <path d="M44 58 L42 86 Q50 90 58 86 L56 58Z" fill="url(#g-trunk)" />
    <g class="bob">
      <circle cx="33" cy="48" r="18" fill="url(#g-leaf)" /><circle cx="67" cy="46" r="19" fill="url(#g-leaf)" /><circle cx="50" cy="30" r="21" fill="url(#g-leaf)" />
      <ellipse cx="43" cy="21" rx="7" ry="4" fill="#fff" opacity=".35" />
    </g>
  {:else if id === 'willow'}
    <ellipse cx="50" cy="88" rx="32" ry="7" fill="url(#g-shadow)" />
    <path d="M46 50 L45 86 Q50 89 55 86 L54 50Z" fill="url(#g-trunk)" />
    <g class="sway">
      {#each [18, 26, 34, 42, 58, 66, 74, 82] as x, k (x)}
        <path d="M{x} 40 Q{x + (k < 4 ? -4 : 4)} 60 {x + (k < 4 ? -2 : 2)} {72 + (k % 3) * 4}" stroke="#86b83c" stroke-width="5" stroke-linecap="round" fill="none" />
      {/each}
    </g>
    <ellipse cx="50" cy="38" rx="34" ry="22" fill="url(#g-leaf2)" />
    <ellipse cx="40" cy="28" rx="10" ry="5" fill="#fff" opacity=".3" />
  {:else if id === 'birch'}
    <ellipse cx="50" cy="88" rx="22" ry="6" fill="url(#g-shadow)" />
    <rect x="45" y="34" width="10" height="53" rx="4" fill="url(#g-birch)" />
    <g fill="#2a2522"><rect x="45" y="50" width="5" height="2.5" rx="1" /><rect x="50" y="62" width="5" height="2.5" rx="1" /><rect x="45" y="74" width="4" height="2" rx="1" /></g>
    <g class="sway">
      <ellipse cx="50" cy="38" rx="24" ry="26" fill="url(#g-leaf2)" /><ellipse cx="50" cy="18" rx="15" ry="15" fill="url(#g-leaf2)" />
      <ellipse cx="43" cy="22" rx="5" ry="3" fill="#fff" opacity=".35" />
    </g>
  {:else if id === 'fern'}
    <ellipse cx="50" cy="88" rx="28" ry="6" fill="url(#g-shadow)" />
    <g class="sway">
      {#each [-38, -19, 0, 19, 38] as a (a)}
        <g transform="rotate({a} 50 86)">
          <path d="M50 86 C43 68 43 44 50 22 C57 44 57 68 50 86Z" fill="url(#g-leafdark)" />
          <path d="M50 82 L50 28" stroke="#a6e27c" stroke-width="1.6" opacity=".7" />
          <path d="M50 70 l-5 -5 M50 60 l-5 -5 M50 50 l-4 -4 M50 70 l5 -5 M50 60 l5 -5 M50 50 l4 -4" stroke="#a6e27c" stroke-width="1.2" opacity=".6" />
        </g>
      {/each}
    </g>
  {:else if id === 'moss'}
    <ellipse cx="50" cy="88" rx="36" ry="6" fill="url(#g-shadow)" />
    {#each [[30, 78, 11], [43, 71, 13], [58, 70, 14], [72, 77, 11], [50, 81, 11], [36, 84, 8], [65, 84, 8]] as [x, y, r], k (k)}
      <circle cx={x} cy={y} r={r} fill="url(#g-leaf)" />
    {/each}
    <g fill="#d9f08a" opacity=".8"><circle cx="40" cy="64" r="2" /><circle cx="56" cy="62" r="2.4" /><circle cx="68" cy="70" r="1.8" /><circle cx="30" cy="72" r="1.6" /></g>
  {:else if id === 'mush'}
    <ellipse cx="50" cy="88" rx="24" ry="6" fill="url(#g-shadow)" />
    <path d="M42 58 Q39 84 44 87 L56 87 Q61 84 58 58Z" fill="url(#g-cream)" />
    <g class="bob">
      <path d="M16 62 Q18 24 50 22 Q82 24 84 62 Q50 72 16 62Z" fill="url(#g-capred)" />
      <g fill="#fffaf0"><circle cx="35" cy="42" r="5" /><circle cx="55" cy="34" r="6" /><circle cx="69" cy="50" r="4" /><circle cx="46" cy="54" r="4" /><circle cx="27" cy="55" r="3" /></g>
    </g>
  {:else if id === 'truffle'}
    <ellipse cx="50" cy="84" rx="36" ry="9" fill="var(--soil-dark, #533826)" />
    <circle cx="38" cy="72" r="14" fill="url(#g-seed)" /><circle cx="60" cy="70" r="16" fill="url(#g-seed)" /><circle cx="50" cy="58" r="12" fill="url(#g-seed)" />
    <g fill="#2e1c0c" opacity=".55"><circle cx="34" cy="68" r="1.6" /><circle cx="42" cy="76" r="1.4" /><circle cx="58" cy="64" r="1.8" /><circle cx="66" cy="74" r="1.5" /><circle cx="50" cy="54" r="1.4" /><circle cx="54" cy="60" r="1.2" /></g>
    <ellipse cx="46" cy="52" rx="4" ry="2.4" fill="#fff" opacity=".22" />
  {:else if id === 'sun'}
    <ellipse cx="50" cy="88" rx="18" ry="5" fill="url(#g-shadow)" />
    <path d="M50 52 Q48 72 50 88" stroke="url(#g-stem)" stroke-width="7" stroke-linecap="round" fill="none" />
    <ellipse cx="36" cy="72" rx="12" ry="6" fill="url(#g-leaf)" transform="rotate(-25 36 72)" /><ellipse cx="64" cy="66" rx="11" ry="5.5" fill="url(#g-leaf)" transform="rotate(25 64 66)" />
    <g class="sway" style="transform-origin:50px 52px">
      {#each [0, 40, 80, 120, 160, 200, 240, 280, 320] as a (a)}
        <ellipse cx="50" cy="16" rx="8" ry="12" fill="url(#g-petal)" transform="rotate({a} 50 36)" />
      {/each}
      <circle cx="50" cy="36" r="12" fill="url(#g-seed)" /><circle cx="46" cy="32" r="3" fill="#fff" opacity=".25" />
    </g>
  {:else if id === 'rose'}
    <ellipse cx="50" cy="88" rx="20" ry="5" fill="url(#g-shadow)" />
    <path d="M50 56 Q52 72 50 88" stroke="url(#g-stem)" stroke-width="5" stroke-linecap="round" fill="none" />
    <ellipse cx="38" cy="72" rx="10" ry="5" fill="url(#g-leafdark)" transform="rotate(-30 38 72)" /><ellipse cx="62" cy="76" rx="9" ry="4.5" fill="url(#g-leafdark)" transform="rotate(30 62 76)" />
    <g class="sway" style="transform-origin:50px 56px">
      <ellipse cx="34" cy="42" rx="11" ry="14" fill="url(#g-red)" transform="rotate(-20 34 42)" /><ellipse cx="66" cy="42" rx="11" ry="14" fill="url(#g-red)" transform="rotate(20 66 42)" />
      <circle cx="50" cy="38" r="18" fill="url(#g-red)" />
      <path d="M50 30 a7 7 0 1 1 -6 9 a5 5 0 1 0 8 -4" stroke="#9c2216" stroke-width="2.6" fill="none" stroke-linecap="round" />
      <path d="M38 46 Q50 58 62 46" stroke="#9c2216" stroke-width="2.2" fill="none" opacity=".6" />
    </g>
  {:else if id === 'clover'}
    <ellipse cx="50" cy="88" rx="28" ry="6" fill="url(#g-shadow)" />
    <path d="M50 50 L50 82" stroke="url(#g-stem)" stroke-width="4" />
    <circle cx="35" cy="72" r="11" fill="url(#g-leaf)" /><circle cx="65" cy="72" r="11" fill="url(#g-leaf)" /><circle cx="50" cy="80" r="11" fill="url(#g-leaf)" />
    <g stroke="#d9f08a" stroke-width="1.6" opacity=".7" fill="none"><path d="M29 72 q6 -4 12 0" /><path d="M59 72 q6 -4 12 0" /><path d="M44 80 q6 -4 12 0" /></g>
    <g class="sway" style="transform-origin:50px 50px">
      <circle cx="50" cy="36" r="20" fill="url(#g-white)" /><circle cx="50" cy="36" r="20" fill="url(#g-pink)" opacity=".35" />
      <g stroke="#e6a7bd" stroke-width="2" stroke-linecap="round"><path d="M50 22 v6" /><path d="M40 28 l4 4" /><path d="M60 28 l-4 4" /><path d="M38 38 h6" /><path d="M62 38 h-6" /><path d="M44 44 l3 -3" /><path d="M56 44 l-3 -3" /></g>
    </g>
  {:else if id === 'lily'}
    <ellipse cx="50" cy="70" rx="40" ry="17" fill="url(#g-water)" opacity=".55" />
    <ellipse cx="50" cy="68" rx="34" ry="13" fill="url(#g-leaf)" />
    <path d="M50 68 L84 64 L84 72Z" fill="url(#g-water)" opacity=".9" />
    <g class="bob">
      {#each [-60, -30, 0, 30, 60] as a (a)}
        <ellipse cx="50" cy="40" rx="7" ry="15" fill="url(#g-pink)" transform="rotate({a} 50 56)" />
      {/each}
      <circle cx="50" cy="52" r="6" fill="url(#g-petal)" />
    </g>
  {:else if id === 'tulip'}
    <ellipse cx="50" cy="88" rx="18" ry="5" fill="url(#g-shadow)" />
    <path d="M50 54 Q49 72 50 88" stroke="url(#g-stem)" stroke-width="5" stroke-linecap="round" fill="none" />
    <path d="M50 86 Q30 76 32 56 Q42 70 50 86Z" fill="url(#g-leaf)" /><path d="M50 86 Q70 74 66 58 Q58 72 50 86Z" fill="url(#g-leaf)" />
    <g class="sway" style="transform-origin:50px 56px">
      <path d="M34 22 Q32 52 50 56 Q68 52 66 22 L58 32 L50 18 L42 32Z" fill="url(#g-red)" />
      <path d="M50 20 L50 50" stroke="#ff9a8a" stroke-width="2" opacity=".5" />
    </g>
  {:else if id === 'bee'}
    <ellipse cx="50" cy="90" rx="16" ry="4" fill="url(#g-shadow)" />
    <g class="hover">
      <g class="flap"><ellipse cx="44" cy="34" rx="10" ry="15" fill="#fff" opacity=".8" stroke="#cfe7f2" stroke-width="1.5" transform="rotate(-20 44 34)" /><ellipse cx="58" cy="34" rx="9" ry="14" fill="#fff" opacity=".8" stroke="#cfe7f2" stroke-width="1.5" transform="rotate(20 58 34)" /></g>
      <ellipse cx="52" cy="56" rx="22" ry="16" fill="url(#g-bee)" />
      <path d="M46 41 Q42 56 46 71" stroke="#2a2522" stroke-width="6" fill="none" /><path d="M58 41 Q54 56 58 71" stroke="#2a2522" stroke-width="6" fill="none" />
      <path d="M73 52 L82 56 L73 60Z" fill="#2a2522" />
      <circle cx="29" cy="56" r="10" fill="url(#g-black)" />
      <circle cx="26" cy="53" r="2.6" fill="#fff" />
      <path d="M26 47 Q22 38 16 38 M30 46 Q30 38 26 34" stroke="#2a2522" stroke-width="2" fill="none" stroke-linecap="round" />
    </g>
  {:else if id === 'fly'}
    <ellipse cx="50" cy="90" rx="18" ry="4" fill="url(#g-shadow)" />
    <g class="hover">
      <g class="flap">
        <ellipse cx="32" cy="38" rx="17" ry="15" fill="url(#g-purple)" transform="rotate(-15 32 38)" /><ellipse cx="68" cy="38" rx="17" ry="15" fill="url(#g-purple)" transform="rotate(15 68 38)" />
        <ellipse cx="36" cy="64" rx="12" ry="11" fill="url(#g-pink)" /><ellipse cx="64" cy="64" rx="12" ry="11" fill="url(#g-pink)" />
        <g fill="#fff" opacity=".85"><circle cx="28" cy="36" r="4" /><circle cx="72" cy="36" r="4" /><circle cx="36" cy="66" r="2.6" /><circle cx="64" cy="66" r="2.6" /></g>
      </g>
      <ellipse cx="50" cy="52" rx="4.5" ry="20" fill="url(#g-black)" />
      <path d="M48 33 Q42 20 36 18 M52 33 Q58 20 64 18" stroke="#2a2522" stroke-width="2" fill="none" stroke-linecap="round" />
    </g>
  {:else if id === 'frog'}
    <ellipse cx="50" cy="86" rx="36" ry="8" fill="url(#g-shadow)" />
    <ellipse cx="24" cy="78" rx="12" ry="6" fill="#4d9a30" /><ellipse cx="76" cy="78" rx="12" ry="6" fill="#4d9a30" />
    <ellipse cx="50" cy="63" rx="32" ry="22" fill="url(#g-frog)" />
    <ellipse cx="50" cy="71" rx="18" ry="10" fill="#e8f5b0" opacity=".85" />
    <circle cx="34" cy="41" r="12" fill="url(#g-frog)" /><circle cx="66" cy="41" r="12" fill="url(#g-frog)" />
    <g class="blink" style="transform-origin:50px 40px">
      <circle cx="34" cy="40" r="8" fill="url(#g-eye)" /><circle cx="66" cy="40" r="8" fill="url(#g-eye)" />
      <circle cx="35" cy="41" r="4" fill="#20251c" /><circle cx="67" cy="41" r="4" fill="#20251c" /><circle cx="33" cy="38" r="1.6" fill="#fff" /><circle cx="65" cy="38" r="1.6" fill="#fff" />
    </g>
    <path d="M40 59 Q50 65 60 59" stroke="#2d6b1c" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <ellipse cx="38" cy="51" rx="3" ry="2" fill="#ff9aa2" opacity=".6" /><ellipse cx="62" cy="51" rx="3" ry="2" fill="#ff9aa2" opacity=".6" />
  {:else if id === 'hog'}
    <ellipse cx="52" cy="88" rx="36" ry="7" fill="url(#g-shadow)" />
    <g fill="#4a3220">{#each spikes as p, k (k)}<polygon points={p} />{/each}</g>
    <path d="M18 82 Q20 42 56 40 Q86 42 88 82Z" fill="url(#g-furbrown)" />
    <g stroke="#5a3e26" stroke-width="2" stroke-linecap="round" opacity=".6"><path d="M44 52 l4 -6" /><path d="M58 50 l3 -6" /><path d="M70 56 l4 -5" /><path d="M52 62 l3 -6" /></g>
    <ellipse cx="24" cy="72" rx="14" ry="11" fill="url(#g-cream)" />
    <circle cx="11" cy="73" r="3.6" fill="#2a2522" />
    <circle cx="24" cy="67" r="2.4" fill="#2a2522" /><ellipse cx="22" cy="80" rx="5" ry="3" fill="#ff9aa2" opacity=".5" />
  {:else if id === 'snail'}
    <ellipse cx="50" cy="88" rx="38" ry="6" fill="url(#g-shadow)" />
    <path d="M12 84 Q16 70 34 72 L82 76 Q90 82 82 86 L18 87Z" fill="url(#g-grey)" />
    <g stroke="#7a838a" stroke-width="3" stroke-linecap="round"><path d="M22 74 L16 56" /><path d="M28 73 L28 56" /></g>
    <circle cx="16" cy="55" r="3.6" fill="url(#g-grey)" /><circle cx="28" cy="55" r="3.6" fill="url(#g-grey)" />
    <circle cx="16" cy="55" r="1.4" fill="#2a2522" /><circle cx="28" cy="55" r="1.4" fill="#2a2522" />
    <circle cx="58" cy="56" r="22" fill="url(#g-shell)" />
    <path d="M58 56 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0" stroke="#93561f" stroke-width="2.6" fill="none" />
    <ellipse cx="50" cy="40" rx="6" ry="3" fill="#fff" opacity=".35" />
  {:else if id === 'pond'}
    <ellipse cx="50" cy="58" rx="43" ry="31" fill="#8c7a66" />
    <ellipse cx="50" cy="56" rx="38" ry="26" fill="url(#g-water)" />
    <ellipse cx="38" cy="46" rx="12" ry="4" fill="#fff" opacity=".45" />
    <g class="ripple"><ellipse cx="60" cy="64" rx="10" ry="4" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" /></g>
    <circle cx="13" cy="70" r="6" fill="url(#g-stone)" /><circle cx="85" cy="44" r="7" fill="url(#g-stone)" /><circle cx="80" cy="77" r="5" fill="url(#g-stone)" />
  {:else if id === 'stream'}
    <path d="M0 36 Q25 26 50 36 T100 36 L100 72 Q75 82 50 72 T0 72Z" fill="url(#g-water)" />
    <g class="ripple" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6">
      <path d="M12 48 q8 -5 16 0" /><path d="M52 56 q8 -5 16 0" /><path d="M30 64 q8 -5 16 0" /><path d="M72 44 q8 -5 16 0" />
    </g>
    <circle cx="8" cy="80" r="5" fill="url(#g-stone)" /><circle cx="90" cy="26" r="5" fill="url(#g-stone)" /><circle cx="60" cy="84" r="4" fill="url(#g-stone)" />
  {:else if id === 'rock'}
    <ellipse cx="50" cy="86" rx="36" ry="7" fill="url(#g-shadow)" />
    <path d="M16 82 Q12 56 32 46 Q52 32 70 44 Q90 56 84 82Z" fill="url(#g-stone)" />
    <path d="M44 50 L50 62 L46 72" stroke="#7d7366" stroke-width="2" fill="none" stroke-linecap="round" />
    <ellipse cx="38" cy="50" rx="8" ry="4" fill="#fff" opacity=".3" />
    <circle cx="70" cy="56" r="5" fill="url(#g-leaf)" />
  {:else if id === 'acorn'}
    <ellipse cx="50" cy="88" rx="20" ry="5" fill="url(#g-shadow)" />
    <path d="M70 58 Q86 52 84 36 Q76 40 74 34 Q66 40 68 48 Q62 50 70 58Z" fill="url(#g-leaf)" />
    <ellipse cx="50" cy="64" rx="16" ry="21" fill="url(#g-capbrown)" />
    <path d="M32 50 Q34 32 50 32 Q66 32 68 50 Q50 57 32 50Z" fill="url(#g-seed)" />
    <g fill="#2e1c0c" opacity=".5"><circle cx="40" cy="44" r="1.4" /><circle cx="48" cy="40" r="1.4" /><circle cx="56" cy="42" r="1.4" /><circle cx="62" cy="47" r="1.4" /><circle cx="44" cy="49" r="1.4" /><circle cx="54" cy="49" r="1.4" /></g>
    <rect x="48" y="24" width="4" height="10" rx="2" fill="#6a4220" />
    <ellipse cx="44" cy="62" rx="4" ry="7" fill="#fff" opacity=".25" />
  {:else if id === 'reeds'}
    <ellipse cx="50" cy="88" rx="26" ry="6" fill="url(#g-shadow)" />
    <g class="sway">
      <path d="M30 88 Q24 60 18 40" stroke="url(#g-stem)" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M72 88 Q80 62 86 46" stroke="url(#g-stem)" stroke-width="4" fill="none" stroke-linecap="round" />
      {#each [[38, 26], [50, 16], [62, 24]] as [x, top] (x)}
        <path d="M{x} 88 L{x} {top + 18}" stroke="url(#g-stem)" stroke-width="3.5" />
        <rect x={x - 5} y={top} width="10" height="22" rx="5" fill="url(#g-seed)" />
        <path d="M{x} {top} l0 -8" stroke="#3d7f26" stroke-width="2" stroke-linecap="round" />
      {/each}
    </g>
  {:else if id === 'cherry'}
    <ellipse cx="52" cy="88" rx="28" ry="7" fill="url(#g-shadow)" />
    <path d="M45 58 L43 86 Q50 90 57 86 L55 58Z" fill="url(#g-trunk)" />
    <path d="M50 64 L36 52 M52 62 L66 50" stroke="#7a4a24" stroke-width="3" stroke-linecap="round" />
    <g class="bob">
      <circle cx="33" cy="46" r="17" fill="url(#g-blossom)" /><circle cx="67" cy="44" r="18" fill="url(#g-blossom)" /><circle cx="50" cy="28" r="20" fill="url(#g-blossom)" />
      <g fill="#fff" opacity=".9"><circle cx="40" cy="24" r="2.4" /><circle cx="58" cy="32" r="2" /><circle cx="28" cy="44" r="2" /><circle cx="70" cy="40" r="2.4" /><circle cx="48" cy="40" r="1.8" /></g>
    </g>
  {:else if id === 'poppy'}
    <ellipse cx="50" cy="88" rx="18" ry="5" fill="url(#g-shadow)" />
    <path d="M50 48 Q42 68 52 88" stroke="#4f8a35" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <path d="M52 88 Q66 70 70 62" stroke="#4f8a35" stroke-width="3" fill="none" stroke-linecap="round" />
    <ellipse cx="72" cy="58" rx="5" ry="7" fill="url(#g-leaf)" transform="rotate(30 72 58)" />
    <g class="sway" style="transform-origin:50px 48px">
      <circle cx="38" cy="32" r="14" fill="url(#g-red)" /><circle cx="62" cy="32" r="14" fill="url(#g-red)" /><circle cx="40" cy="48" r="12" fill="url(#g-red)" /><circle cx="60" cy="48" r="12" fill="url(#g-red)" />
      <circle cx="50" cy="40" r="7" fill="url(#g-black)" />
      <g fill="#2a2522"><circle cx="42" cy="36" r="1.4" /><circle cx="58" cy="36" r="1.4" /><circle cx="44" cy="46" r="1.4" /><circle cx="56" cy="46" r="1.4" /></g>
    </g>
  {:else if id === 'lavender'}
    <ellipse cx="50" cy="88" rx="24" ry="5" fill="url(#g-shadow)" />
    <path d="M50 88 Q36 80 30 70 M50 88 Q64 80 70 70 M50 88 Q44 76 42 66 M50 88 Q56 76 58 66" stroke="#8fae86" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <g class="sway">
      {#each lavender as l (l.x)}
        <g transform="rotate({l.tilt} 50 88)">
          <path d="M{l.x} 88 L{l.x} {l.top + 4}" stroke="url(#g-stem)" stroke-width="2.6" />
          {#each [0, 1, 2, 3, 4, 5] as k (k)}
            <ellipse cx={l.x} cy={l.top + k * 6} rx={5 - k * 0.3} ry="4" fill="url(#g-purple)" />
          {/each}
        </g>
      {/each}
    </g>
  {:else if id === 'fountain'}
    <ellipse cx="50" cy="88" rx="32" ry="6" fill="url(#g-shadow)" />
    <path d="M18 62 Q20 84 50 86 Q80 84 82 62Z" fill="url(#g-stone)" />
    <ellipse cx="50" cy="62" rx="32" ry="9" fill="url(#g-stone)" />
    <ellipse cx="50" cy="62" rx="27" ry="6.5" fill="url(#g-water)" />
    <rect x="45" y="34" width="10" height="28" rx="3" fill="url(#g-stone)" />
    <ellipse cx="50" cy="34" rx="12" ry="4" fill="url(#g-stone)" />
    <g class="ripple" stroke="#9fe3ff" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M50 30 Q50 12 36 24 Q32 30 34 46" stroke-dasharray="4 5" /><path d="M50 30 Q50 12 64 24 Q68 30 66 46" stroke-dasharray="4 5" />
    </g>
  {:else if id === 'bracket'}
    <ellipse cx="50" cy="88" rx="38" ry="6" fill="url(#g-shadow)" />
    <rect x="12" y="58" width="74" height="28" rx="13" fill="url(#g-log)" />
    <ellipse cx="80" cy="72" rx="8" ry="14" fill="url(#g-capbrown)" />
    <ellipse cx="80" cy="72" rx="4" ry="8" fill="none" stroke="#6a4220" stroke-width="1.6" />
    <g stroke="#5e3b1b" stroke-width="1.6" opacity=".5"><path d="M20 66 H60" /><path d="M24 78 H66" /></g>
    {#each [[26, 58, 13], [46, 54, 11], [62, 58, 9], [36, 44, 8]] as [x, y, r], k (k)}
      <path d="M{x - r} {y} Q{x} {y - r * 0.9} {x + r} {y}Z" fill="url(#g-orange)" />
      <path d="M{x - r + 2} {y - 1} Q{x} {y - r * 0.6} {x + r - 2} {y - 1}" stroke="#fff4dc" stroke-width="1.4" fill="none" opacity=".7" />
    {/each}
  {:else if id === 'ladybird'}
    <ellipse cx="52" cy="86" rx="30" ry="6" fill="url(#g-shadow)" />
    <circle cx="26" cy="64" r="11" fill="url(#g-black)" />
    <path d="M22 56 Q16 46 10 46 M28 54 Q28 44 24 38" stroke="#2a2522" stroke-width="2" fill="none" stroke-linecap="round" />
    <ellipse cx="54" cy="62" rx="28" ry="23" fill="url(#g-red)" />
    <path d="M30 62 H82" stroke="#2a2522" stroke-width="2.4" />
    <g fill="#2a2522"><circle cx="46" cy="50" r="5" /><circle cx="66" cy="50" r="5" /><circle cx="44" cy="72" r="4.4" /><circle cx="64" cy="73" r="4.4" /><circle cx="76" cy="62" r="3.4" /></g>
    <circle cx="23" cy="61" r="2" fill="#fff" />
    <ellipse cx="50" cy="44" rx="8" ry="3" fill="#fff" opacity=".35" />
  {:else if id === 'duck'}
    <ellipse cx="54" cy="88" rx="34" ry="6" fill="url(#g-shadow)" />
    <path d="M78 58 L92 46 L88 66Z" fill="url(#g-duck)" />
    <ellipse cx="56" cy="66" rx="32" ry="18" fill="url(#g-duck)" />
    <path d="M30 60 Q28 48 32 40" stroke="url(#g-duck)" stroke-width="14" fill="none" stroke-linecap="round" />
    <path d="M24 56 Q30 60 38 58" stroke="#fff" stroke-width="3" fill="none" />
    <circle cx="32" cy="36" r="13" fill="url(#g-duckhead)" />
    <ellipse cx="17" cy="40" rx="9" ry="4.4" fill="url(#g-orange)" />
    <circle cx="30" cy="32" r="2.4" fill="#141110" /><circle cx="29" cy="31" r=".9" fill="#fff" />
    <ellipse cx="62" cy="64" rx="17" ry="9" fill="url(#g-white)" stroke="#cfc8b8" stroke-width="1.5" />
    <path d="M50 64 Q60 70 74 64" stroke="#5d7fbf" stroke-width="3" fill="none" />
  {:else if id === 'owl'}
    <ellipse cx="50" cy="88" rx="26" ry="6" fill="url(#g-shadow)" />
    <path d="M30 30 L28 14 L40 26Z M70 30 L72 14 L60 26Z" fill="url(#g-furbrown)" />
    <ellipse cx="50" cy="56" rx="26" ry="30" fill="url(#g-furbrown)" />
    <ellipse cx="50" cy="66" rx="16" ry="18" fill="url(#g-cream)" />
    <g stroke="#a08560" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M44 60 l3 3 l3 -3 l3 3 l3 -3" /><path d="M44 70 l3 3 l3 -3 l3 3 l3 -3" /></g>
    <g class="blink" style="transform-origin:50px 42px">
      <circle cx="39" cy="42" r="10" fill="url(#g-white)" stroke="#f2902a" stroke-width="3" /><circle cx="61" cy="42" r="10" fill="url(#g-white)" stroke="#f2902a" stroke-width="3" />
      <circle cx="40" cy="43" r="4.6" fill="#141110" /><circle cx="60" cy="43" r="4.6" fill="#141110" /><circle cx="38.5" cy="41" r="1.4" fill="#fff" /><circle cx="58.5" cy="41" r="1.4" fill="#fff" />
    </g>
    <path d="M47 51 L53 51 L50 57Z" fill="url(#g-orange)" />
    <g stroke="#f2902a" stroke-width="3" stroke-linecap="round"><path d="M42 85 v4 M46 85 v4" /><path d="M54 85 v4 M58 85 v4" /></g>
  {:else if id === 'squirrel'}
    <ellipse cx="54" cy="88" rx="32" ry="6" fill="url(#g-shadow)" />
    <g class="sway" style="transform-origin:62px 84px">
      <path d="M58 86 Q92 84 90 50 Q88 20 66 24 Q50 28 60 40 Q74 44 72 58 Q70 72 56 74Z" fill="url(#g-fur)" />
      <path d="M66 32 Q82 34 82 52" stroke="#ffd2a0" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round" />
    </g>
    <ellipse cx="42" cy="68" rx="16" ry="18" fill="url(#g-fur)" />
    <ellipse cx="40" cy="72" rx="9" ry="12" fill="url(#g-cream)" />
    <circle cx="36" cy="44" r="13" fill="url(#g-fur)" />
    <path d="M30 34 L28 22 L38 31Z" fill="url(#g-fur)" />
    <circle cx="31" cy="42" r="2.6" fill="#141110" /><circle cx="23.5" cy="47" r="2" fill="#141110" />
    <ellipse cx="38" cy="64" rx="5" ry="6" fill="url(#g-capbrown)" /><path d="M33 60 Q38 56 43 60Z" fill="url(#g-seed)" />
  {:else if id === 'fox'}
    <ellipse cx="50" cy="90" rx="28" ry="5" fill="url(#g-shadow)" />
    <path d="M22 40 L18 10 L42 30Z M78 40 L82 10 L58 30Z" fill="url(#g-fur)" />
    <path d="M24 34 L22 18 L36 30Z M76 34 L78 18 L64 30Z" fill="#5a2a10" />
    <path d="M16 34 Q50 20 84 34 L78 58 Q66 84 50 88 Q34 84 22 58Z" fill="url(#g-fur)" />
    <path d="M20 46 Q30 64 50 88 Q36 60 20 46Z M80 46 Q70 64 50 88 Q64 60 80 46Z" fill="url(#g-white)" />
    <path d="M30 52 Q50 74 70 52 Q66 82 50 88 Q34 82 30 52Z" fill="url(#g-white)" />
    <g class="blink" style="transform-origin:50px 46px"><ellipse cx="38" cy="46" rx="3.6" ry="4.6" fill="#141110" /><ellipse cx="62" cy="46" rx="3.6" ry="4.6" fill="#141110" /></g>
    <circle cx="50" cy="78" r="5" fill="url(#g-black)" />
  {:else if id === 'worm'}
    <ellipse cx="50" cy="86" rx="38" ry="8" fill="var(--soil-dark, #533826)" opacity=".7" />
    <g class="wiggle">
      <path d="M14 80 Q26 56 44 70 T74 64 Q84 60 84 46" stroke="url(#g-worm)" stroke-width="13" fill="none" stroke-linecap="round" />
      <g stroke="#b85c66" stroke-width="1.8" opacity=".55" stroke-linecap="round"><path d="M24 66 l6 5" /><path d="M38 62 l-2 7" /><path d="M52 72 l2 -7" /><path d="M66 66 l2 -7" /><path d="M78 58 l7 2" /></g>
      <circle cx="80" cy="44" r="1.8" fill="#141110" /><circle cx="87" cy="45" r="1.8" fill="#141110" />
    </g>
  {:else}
    <circle cx="50" cy="60" r="20" fill="url(#g-leaf)" />
  {/if}
</svg>

<style>
  .tile {
    display: block;
    overflow: visible;
  }
  .tile :global(g) {
    transform-box: fill-box;
  }
  @media (prefers-reduced-motion: no-preference) {
    .live .bob { animation: bob 4.2s ease-in-out infinite; transform-origin: 50% 100%; }
    .live .sway { animation: sway 3.6s ease-in-out infinite; transform-origin: 50% 100%; }
    .live .flap { animation: flap 0.22s ease-in-out infinite alternate; transform-origin: 50% 100%; }
    .live .hover { animation: hover 2.4s ease-in-out infinite; }
    .live .ripple { animation: ripple 3s ease-in-out infinite; }
    .live .blink { animation: blink 5.5s infinite; }
    .live .wiggle { animation: wiggle 2.8s ease-in-out infinite; transform-origin: 50% 100%; }
  }
  @keyframes bob { 50% { transform: translateY(-1.5px) scale(1.015); } }
  @keyframes sway { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
  @keyframes flap { to { transform: scaleY(0.72); } }
  @keyframes hover { 50% { transform: translateY(-3px); } }
  @keyframes ripple { 0%, 100% { transform: translateX(0); opacity: 0.9; } 50% { transform: translateX(3px); opacity: 0.55; } }
  @keyframes blink { 0%, 94%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
  @keyframes wiggle { 50% { transform: scaleX(0.95) translateX(1px); } }
</style>

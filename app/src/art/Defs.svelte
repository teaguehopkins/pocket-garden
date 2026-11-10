<script lang="ts">
  // Shared gradients for every clay tile. Mounted once; tiles reference url(#g-*).
  // Radial gradients are lit from the top left to give the soft clay volume.
  const RADIAL: [string, string[]][] = [
    ['leaf', ['#a6e27c', '#4fae3e', '#2d7a2a']],
    ['leaf2', ['#d9f08a', '#9ccc4a', '#628f2a']],
    ['leafdark', ['#7cc06a', '#2f8a46', '#1d5c30']],
    ['petal', ['#ffe680', '#ffc21a', '#e8960a']],
    ['red', ['#ff8a7a', '#e8402e', '#a8241a']],
    ['pink', ['#ffd3e2', '#f39ab9', '#d66d95']],
    ['purple', ['#d9c2ff', '#9a72e0', '#6a44b0']],
    ['white', ['#ffffff', '#f1ede4', '#d7d0c2']],
    ['seed', ['#9a6a3a', '#6a4220', '#3e2610']],
    ['frog', ['#b6ec6a', '#63b33c', '#3d7f26']],
    ['water', ['#a8e8ff', '#3fa3d8', '#2479b0']],
    ['eye', ['#ffffff', '#ffffff', '#dfe6d8']],
    ['stone', ['#d6d0c6', '#a59a8c', '#7d7366']],
    ['capred', ['#ff9a80', '#e0452e', '#a62a1a']],
    ['capbrown', ['#d3a272', '#9c6a3c', '#6a4220']],
    ['cream', ['#fffbe8', '#f1e3c2', '#d2bf96']],
    ['fur', ['#ffb36b', '#ea7a28', '#b5521a']],
    ['furbrown', ['#b88a62', '#85603f', '#5a3e26']],
    ['grey', ['#d8dde0', '#a6aeb4', '#7a838a']],
    ['shell', ['#f5c27a', '#cf8a3e', '#93561f']],
    ['black', ['#5a5450', '#2a2522', '#141110']],
    ['bee', ['#ffe680', '#ffcc1a', '#e09a0a']],
    ['blossom', ['#ffe7f0', '#ffb3cf', '#e57fa7']],
    ['worm', ['#ffc4c4', '#e88a8f', '#b85c66']],
    ['duck', ['#ffffff', '#efece4', '#cfc8b8']],
    ['duckhead', ['#6fd08a', '#1f8a4a', '#0f5a2e']],
    ['orange', ['#ffc27a', '#f2902a', '#c2621a']],
  ];
</script>

<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    {#each RADIAL as [id, stops] (id)}
      <radialGradient id="g-{id}" cx=".38" cy=".3" r=".85">
        <stop offset="0" stop-color={stops[0]} />
        <stop offset=".6" stop-color={stops[1]} />
        <stop offset="1" stop-color={stops[2]} />
      </radialGradient>
    {/each}
    <linearGradient id="g-trunk" x1="0" x2="1"><stop offset="0" stop-color="#a06a3a" /><stop offset="1" stop-color="#6b4220" /></linearGradient>
    <linearGradient id="g-birch" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#cfc8ba" /></linearGradient>
    <linearGradient id="g-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a87444" /><stop offset="1" stop-color="#6a4220" /></linearGradient>
    <linearGradient id="g-stem" x1="0" x2="1"><stop offset="0" stop-color="#6fb64a" /><stop offset="1" stop-color="#3d7f26" /></linearGradient>
    <radialGradient id="g-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".32" /><stop offset="1" stop-color="#000" stop-opacity="0" /></radialGradient>
  </defs>
</svg>

<script lang="ts">
  // Dev view of every tile: open /#gallery
  import { speciesList } from '../core/content/species';
  import Tile from './Tile.svelte';
</script>

<main class="gal">
  {#each speciesList as s (s.id)}
    <figure><div class="bed"><Tile id={s.id} size={72} live /></div><figcaption>{s.name}</figcaption></figure>
  {/each}
</main>

<style>
  .gal { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 10px; padding: 16px; background: var(--sky); min-height: 100vh; }
  figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; font: 500 12px var(--font-display); color: var(--ink); }
  .bed { background: var(--soil); border-radius: 14px; padding: 4px; box-shadow: inset 0 6px 0 rgba(0,0,0,.12); }
</style>

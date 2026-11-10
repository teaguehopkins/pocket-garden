<script lang="ts">
  import type { Snippet } from 'svelte';
  let { title, onclose, children }: { title: string; onclose: () => void; children: Snippet } = $props();
  let panel: HTMLDivElement;
  $effect(() => {
    panel?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onclose();
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });
</script>

<div class="scrim" onclick={onclose} aria-hidden="true"></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label={title} tabindex="-1" bind:this={panel}>
  <div class="grab" aria-hidden="true"></div>
  <header><h2>{title}</h2><button class="close" onclick={onclose} aria-label="Close">✕</button></header>
  <div class="body">{@render children()}</div>
</div>

<style>
  .scrim { position: fixed; inset: 0; background: rgba(20, 14, 8, 0.4); z-index: 40; animation: fade var(--t-med) var(--ease-out); }
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0 auto;
    max-width: 480px;
    max-height: 78vh;
    overflow: auto;
    z-index: 41;
    background: var(--surface);
    color: var(--ink);
    border-radius: var(--r-l) var(--r-l) 0 0;
    padding: 8px max(16px, env(safe-area-inset-right, 0px)) max(20px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.25);
    animation: up var(--t-med) var(--ease-out);
    outline: none;
  }
  .grab { width: 40px; height: 5px; border-radius: 3px; background: var(--line); margin: 0 auto 8px; }
  header { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; }
  .close { border: 0; background: var(--surface-2); width: 36px; height: 36px; border-radius: 18px; cursor: pointer; font-size: 14px; }
  .body { display: flex; flex-direction: column; gap: 10px; }
  @keyframes up { from { transform: translateY(40%); opacity: 0; } }
  @keyframes fade { from { opacity: 0; } }
</style>

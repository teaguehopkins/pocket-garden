<script lang="ts">
  // Ambient weather drawn over the bed. Purely decorative; frozen when reduced motion is on.
  let { id }: { id: string } = $props();
  // Deterministic scatter so the overlay doesn't jump between renders.
  const bits = Array.from({ length: 14 }, (_, k) => ({
    x: (k * 37) % 100,
    d: ((k * 53) % 40) / 10,
    s: 0.7 + ((k * 29) % 10) / 20,
  }));
</script>

<div class="wx {id}" aria-hidden="true">
  {#if id === 'rain'}
    {#each bits as b, k (k)}<i class="drop" style="left:{b.x}%;animation-delay:-{b.d}s;--s:{b.s}"></i>{/each}
  {:else if id === 'bloom'}
    {#each bits.slice(0, 9) as b, k (k)}<i class="petal" style="left:{b.x}%;animation-delay:-{b.d * 2}s;--s:{b.s}"></i>{/each}
  {:else if id === 'wild'}
    {#each bits.slice(0, 6) as b, k (k)}<i class="leaf" style="top:{(b.x * 0.8 + 5) % 90}%;animation-delay:-{b.d * 2.5}s;--s:{b.s}"></i>{/each}
  {:else if id === 'gloom'}
    <i class="mist a"></i><i class="mist b"></i>
  {:else if id === 'grove'}
    {#each bits.slice(0, 6) as b, k (k)}<i class="dapple" style="left:{b.x}%;top:{(b.x * 1.7) % 85}%;animation-delay:-{b.d}s;--s:{b.s}"></i>{/each}
  {:else if id === 'heat'}
    <i class="rays"></i><i class="haze"></i>
  {/if}
</div>

<style>
  .wx { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; border-radius: inherit; }
  i { position: absolute; display: block; }
  .drop { top: -10%; width: 2px; height: 14px; border-radius: 2px; background: rgba(170, 215, 255, 0.75); transform: rotate(14deg) scale(var(--s)); animation: rain 1.1s linear infinite; }
  .petal { top: -8%; width: 10px; height: 7px; border-radius: 60% 40% 60% 40%; background: #ffb3cf; opacity: 0.85; transform: scale(var(--s)); animation: petal 7s linear infinite; }
  .leaf { left: -8%; width: 12px; height: 7px; border-radius: 100% 0; background: #e8a23a; opacity: 0.85; transform: scale(var(--s)); animation: leaf 8s linear infinite; }
  .mist { left: -30%; width: 160%; height: 40%; border-radius: 50%; background: radial-gradient(closest-side, rgba(255, 255, 255, 0.35), transparent); animation: mist 16s ease-in-out infinite alternate; }
  .mist.a { top: 10%; }
  .mist.b { top: 52%; animation-duration: 21s; animation-direction: alternate-reverse; }
  .dapple { width: 70px; height: 50px; border-radius: 50%; background: radial-gradient(closest-side, rgba(220, 255, 170, 0.32), transparent); transform: scale(var(--s)); animation: dapple 5s ease-in-out infinite alternate; }
  .rays { inset: -20% 30% 0 -40%; background: linear-gradient(115deg, var(--light) 0 22%, transparent 22% 34%, var(--light) 34% 42%, transparent 42%); animation: rays 6s ease-in-out infinite; }
  .haze { inset: 0; background: linear-gradient(180deg, rgba(255, 170, 60, 0.12), transparent 60%); }
  .wx.rain, .wx.gloom { background: rgba(120, 150, 190, 0.08); }

  @keyframes rain { to { transform: translate(-30px, 520px) rotate(14deg) scale(var(--s)); } }
  @keyframes petal { to { transform: translate(-40px, 520px) rotate(540deg) scale(var(--s)); } }
  @keyframes leaf { to { transform: translate(520px, 40px) rotate(720deg) scale(var(--s)); } }
  @keyframes mist { to { transform: translateX(18%); } }
  @keyframes dapple { to { opacity: 0.4; transform: translate(10px, 6px) scale(var(--s)); } }
  @keyframes rays { 50% { opacity: 0.55; } }
  @media (prefers-reduced-motion: reduce) {
    i { animation: none !important; }
    .drop, .petal, .leaf { display: none; }
  }
</style>

// Share a finished garden: an image of the board, a short text summary and a "beat my garden" link.
import { mount, unmount } from 'svelte';
import { PLOTS } from '../core/content/plots';
import { encodeLink, linkFor } from '../core/link';
import { SEASONS, type RunState } from '../core/run';
import ShareCard from './ShareCard.svelte';

export function gardenUrl(run: RunState): string {
  const base = location.origin + location.pathname;
  return `${base}?g=${encodeLink(linkFor(run))}`;
}

export function gardenText(run: RunState): string {
  const where = run.daily ? "today's garden" : PLOTS.find((p) => p.id === run.plot)?.name ?? 'my garden';
  const won = run.phase === 'won';
  const stars = won && run.wishes.length ? ` ${'★'.repeat(run.stars ?? 0)}${'☆'.repeat(3 - (run.stars ?? 0))}` : '';
  return won
    ? `My Pocket Garden on ${where} bloomed all year with ${run.banked} points${stars}. Can you beat it?`
    : `My Pocket Garden on ${where} wilted in ${SEASONS[run.season]} with ${run.banked} points. Can you do better?`;
}

/** Render the garden to a PNG using the clay tiles. */
export async function gardenImage(run: RunState): Promise<Blob> {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:1080px;height:1350px;pointer-events:none';
  document.body.appendChild(host);
  const card = mount(ShareCard, { target: host, props: { run } });
  try {
    await Promise.resolve();
    const svg = host.querySelector('svg')!;
    // Tiles reference shared gradients; copy them into the card so the image is self-contained.
    const defs = document.querySelector('svg > defs');
    if (defs) svg.insertBefore(defs.cloneNode(true), svg.firstChild);
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.decoding = 'async';
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    try {
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('could not draw the garden'));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1350;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    try { await document.fonts.load('700 64px Fredoka'); } catch { /* fall back */ }
    const ink = '#2b2118';
    const won = run.phase === 'won';
    const where = run.daily ? "Today's garden" : PLOTS.find((p) => p.id === run.plot)?.name ?? 'Pocket Garden';
    g.textAlign = 'center';
    g.fillStyle = ink;
    g.font = '600 40px Fredoka, sans-serif';
    g.fillText(`Pocket Garden · ${where}`, 540, 90);
    g.font = '700 84px Fredoka, sans-serif';
    g.fillText(won ? 'Bloomed all year' : `Wilted in ${SEASONS[run.season]}`, 540, 190);
    g.font = '600 52px Fredoka, sans-serif';
    const stars = won && run.wishes.length ? `   ${'★'.repeat(run.stars ?? 0)}${'☆'.repeat(3 - (run.stars ?? 0))}` : '';
    g.fillText(`${run.banked} points${stars}`, 540, 268);
    g.font = '500 34px Fredoka, sans-serif';
    g.fillStyle = '#6d5d4c';
    g.fillText('Can you beat my garden?', 540, 1300);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('no image'))), 'image/png'));
  } finally {
    unmount(card);
    host.remove();
  }
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'image';

/** Use the phone's share sheet with the image when possible; otherwise copy the text and link. */
export async function shareGarden(run: RunState): Promise<{ result: ShareResult; image?: string }> {
  const text = gardenText(run);
  const url = gardenUrl(run);
  let png: Blob | null = null;
  try { png = await gardenImage(run); } catch { /* text only */ }
  const file = png ? new File([png], 'pocket-garden.png', { type: 'image/png' }) : null;
  try {
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: `${text} ${url}` });
      return { result: 'shared' };
    }
    if (navigator.share) {
      await navigator.share({ text, url });
      return { result: 'shared' };
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return { result: 'cancelled' };
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return { result: 'copied', image: png ? URL.createObjectURL(png) : undefined };
  } catch {
    return { result: 'image', image: png ? URL.createObjectURL(png) : undefined };
  }
}

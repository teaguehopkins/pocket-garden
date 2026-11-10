// "Beat my garden" links: everything needed to replay the same garden, in a URL-safe code.
import { PLOTS } from './content/plots';
import type { RunState } from './run';
import type { Features } from './types';

export interface GardenLink {
  seed: number;
  plot: string | null;
  daily: boolean;
  /** Lane stars that set the species/rule pool; null = full pool */
  stars: number | null;
  features: Features;
  /** the sender's total, to beat */
  score: number;
  won: boolean;
}

const FEATURE_KEYS: (keyof Features)[] = ['bag', 'life', 'plots', 'tools', 'wishes', 'content'];

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function encodeLink(l: GardenLink): string {
  const f = FEATURE_KEYS.map((k) => (l.features[k] ? '1' : '0')).join('');
  return b64url(JSON.stringify([1, l.seed, l.plot ?? '', l.daily ? 1 : 0, l.stars ?? -1, f, l.score, l.won ? 1 : 0]));
}

export function decodeLink(code: string): GardenLink | null {
  try {
    const a = JSON.parse(unb64url(code));
    if (!Array.isArray(a) || a[0] !== 1) return null;
    const [, seed, plot, daily, stars, f, score, won] = a;
    if (typeof seed !== 'number' || typeof f !== 'string' || f.length !== FEATURE_KEYS.length) return null;
    if (plot && !PLOTS.some((p) => p.id === plot)) return null;
    const features = Object.fromEntries(FEATURE_KEYS.map((k, i) => [k, f[i] === '1'])) as unknown as Features;
    return { seed, plot: plot || null, daily: daily === 1, stars: stars >= 0 ? stars : null, features, score: Number(score) || 0, won: won === 1 };
  } catch {
    return null;
  }
}

/** The link for a finished run. */
export function linkFor(s: RunState): GardenLink {
  return { seed: s.seed, plot: s.plot, daily: s.daily, stars: s.pool ? (s.poolStars ?? null) : null, features: s.features, score: s.banked, won: s.phase === 'won' };
}

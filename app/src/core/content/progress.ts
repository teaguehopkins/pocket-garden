// Long-term progress: the Lane of plots, star-gated unlocks and the teaching garden.
// Everything unlocks at fixed star totals from play; nothing is random.
import { TEACHING_PLOT } from './plots';
import type { RunConfig } from '../run';

/** Each Lane plot's three wishes. Stars are kept per wish, so different years can fill them in. */
export const PLOT_WISHES: Record<string, [string, string, string]> = {
  'raised-bed': ['flowerline', 'animals4', 'full'],
  'pond-corner': ['water4', 'bigtile', 'nozero'],
  'stone-path': ['fungi3', 'all6', 'margin'],
  'old-oak': ['trees5', 'fungi3', 'strong'],
  'north-wall': ['flowerline', 'nozero', 'spring30'],
  brook: ['water4', 'strong', 'margin'],
  'long-border': ['flowerline', 'full', 'all6'],
  'corner-plot': ['trees5', 'animals4', 'bigtile'],
  'sun-trap': ['bigtile', 'spring30', 'full'],
  'lily-pond': ['water4', 'all6', 'strong'],
};

/** Species and rules available from the start, then more at fixed Lane star totals. */
export const START_SPECIES = ['oak', 'birch', 'fern', 'mush', 'sun', 'rose', 'clover', 'tulip', 'bee', 'fly', 'frog', 'hog', 'pond', 'lily'];
export const START_RULES = ['diag', 'wet', 'pollin', 'myc', 'hedge', 'center', 'roots', 'twins', 'bloom2', 'shelf', 'shed', 'biodiv'];

export interface Unlock {
  stars: number;
  species?: string[];
  rules?: string[];
}

export const UNLOCKS: Unlock[] = [
  { stars: 2, species: ['acorn', 'willow', 'stream'] },
  { stars: 3, rules: ['canopy', 'mono', 'quiet'] },
  { stars: 4, species: ['moss', 'truffle', 'snail', 'ladybird'] },
  { stars: 5, rules: ['greenhouse', 'nest', 'seedswap'] },
  { stars: 6, species: ['reeds', 'duck', 'poppy'] },
  { stars: 8, rules: ['runners', 'swarm', 'early'] },
  { stars: 9, species: ['cherry', 'lavender', 'fountain'] },
  { stars: 11, rules: ['marsh', 'fairy', 'wildflowers'] },
  { stars: 12, species: ['owl', 'squirrel', 'bracket'] },
  { stars: 14, rules: ['bumper', 'monoculture'] },
  { stars: 15, species: ['fox', 'worm'] },
];

export function poolAt(stars: number): { species: string[]; rules: string[] } {
  const species = [...START_SPECIES], rules = [...START_RULES];
  for (const u of UNLOCKS) if (u.stars <= stars) {
    species.push(...(u.species ?? []));
    rules.push(...(u.rules ?? []));
  }
  return { species, rules };
}

export const nextUnlock = (stars: number) => UNLOCKS.find((u) => u.stars > stars) ?? null;

export { TEACHING_PLOT };

export const teachingRun = (seed: number): Omit<RunConfig, 'features'> => ({
  seed,
  plotDef: TEACHING_PLOT,
  per: 3,
  draftSize: 4,
  wishes: [],
  pool: { species: ['sun', 'bee', 'clover', 'pond', 'frog', 'acorn', 'tulip', 'oak'], rules: ['pollin', 'twins', 'hedge', 'wet'] },
  script: {
    // Each pick teaches one idea: neighbours, then water, then things that change over time.
    offers: [['bee', 'sun', 'clover'], ['sun', 'tulip', 'clover'], ['frog', 'pond', 'oak'], ['pond', 'acorn', 'frog']],
    ruleOffers: [['pollin', 'twins', 'hedge'], ['wet', 'twins', 'hedge'], ['twins', 'hedge', 'pollin']],
    mods: ['bloom', 'rain', 'grove'],
    targets: [6, 16, 30],
  },
});

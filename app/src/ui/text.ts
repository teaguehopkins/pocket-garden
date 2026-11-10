import { SPECIES } from '../core/content/species';
import { RULES } from '../core/content/rules';
import type { RunState } from '../core/run';
import type { Verb } from '../core/types';
import { SEASONS } from '../core/run';

export const spText = (id: string, s: Pick<RunState, 'features'>) => {
  const sp = SPECIES[id];
  return s.features.content && sp.revised ? sp.revised.text : sp.text;
};

export function verbText(v: Verb | undefined): string {
  if (!v) return '';
  switch (v.kind) {
    case 'grow': return `Grows into ${SPECIES[v.into].name} next season.`;
    case 'spread': return 'Spreads to an empty neighbour each season.';
    case 'scale': return `+${v.amount} for good each season it ends next to a ${v.when}.`;
    case 'peak': return `Doubles in ${SEASONS[v.season]}.`;
  }
}

export const verbTag = (v: Verb | undefined) => (v ? { grow: 'grows', spread: 'spreads', scale: 'grows stronger', peak: `peaks ${SEASONS[(v as { season: number }).season ?? 0]}` }[v.kind] : '');

export const ruleName = (id: string) => RULES[id]?.name ?? id;
export const ruleText = (id: string) => RULES[id]?.text ?? '';

export const verbGlyph = (v: Verb | undefined) => (v ? { grow: '↑', spread: '✳', scale: '+', peak: '☀' }[v.kind] : '');

// Scoring: port of the v5 cellScore / bonus / total.
// Per square: base × pre-multipliers + weather + rule adds + tile bonus, then × post-multipliers.

import { adj, dia, rowCol } from './board';
import { RULES } from './content/rules';
import { SPECIES } from './content/species';
import { WEATHER } from './content/weather';
import type { CellView, Grid, Group, RuleDef, ScoreCtx, SpeciesDef } from './types';

export const groupOf = (x: string): Group => SPECIES[x].group;
export const isReal = (t: { s: string } | null | undefined): t is { s: string } => !!t && SPECIES[t.s].group !== 'none';

function activeRules(ctx: ScoreCtx): RuleDef[] {
  const out: RuleDef[] = [];
  for (const id of ctx.rules) if (RULES[id]) out.push(RULES[id]);
  return out;
}

export function speciesScoreFn(sp: SpeciesDef, ctx: ScoreCtx) {
  return ctx.features.content && sp.revised ? sp.revised.score : sp.score;
}

export function makeIs(ctx: ScoreCtx, rules = activeRules(ctx)) {
  const extra = rules.filter((r) => r.alsoIs);
  return (x: string, t: Group): boolean => {
    const g = SPECIES[x].group;
    if (g === 'none') return false;
    if (g === t) return true;
    for (const r of extra) if (r.alsoIs!(x, t, g)) return true;
    return false;
  };
}

export function shadesSq(x: string, ctx: ScoreCtx): boolean {
  return !ctx.rules.has('canopy') && !!SPECIES[x].shades;
}

export function cellView(ctx: ScoreCtx, i: number, rules = activeRules(ctx), is = makeIs(ctx, rules)): CellView | null {
  const { grid, board } = ctx;
  const tile = grid[i];
  if (!isReal(tile)) return null;
  const s = tile.s;
  let idx = adj(board, i);
  if (ctx.rules.has('diag') && SPECIES[s].group === 'animal') idx = idx.concat(dia(board, i));
  const nb = idx.map((j) => grid[j]).filter(isReal).map((t) => t.s);
  const ad = adj(board, i).map((j) => grid[j]).filter(isReal).map((t) => t.s);
  let allCache: string[] | null = null;
  return {
    i, s, tile, ctx, nb, ad,
    cnt: (p) => nb.filter(p).length,
    is,
    group: groupOf,
    shaded: () => board.fx[i] === 'shade' || nb.some((x) => shadesSq(x, ctx)),
    rowCol: () => {
      const { row, col } = rowCol(board, i);
      return [...row, ...col].map((j) => grid[j]).filter(isReal).map((t) => t.s);
    },
    all: () => (allCache ??= grid.filter(isReal).map((t) => t.s)),
  };
}

export function cellScore(ctx: ScoreCtx, i: number, rules = activeRules(ctx), is = makeIs(ctx, rules)): number {
  const v = cellView(ctx, i, rules, is);
  if (!v) return 0;
  const sp = SPECIES[v.s];
  let x = speciesScoreFn(sp, ctx)(v);
  for (const r of rules) if (r.preMul) x *= r.preMul(v);
  if (ctx.features.life && sp.verb?.kind === 'peak' && sp.verb.season === ctx.season) x *= 2;
  if (ctx.weather) x += WEATHER[ctx.weather].add(sp.group);
  for (const r of rules) if (r.cellAdd) x += r.cellAdd(v);
  if (v.tile.b) x += v.tile.b;
  for (const r of rules) if (r.postMul) x *= r.postMul(v);
  if (ctx.board.fx[i] === 'sunny') x *= 2;
  return x;
}

export function bonus(ctx: ScoreCtx, rules = activeRules(ctx)): number {
  let b = 0;
  for (const r of rules) if (r.bonus) b += r.bonus(ctx);
  return b;
}

export function cellScores(ctx: ScoreCtx): number[] {
  const rules = activeRules(ctx), is = makeIs(ctx, rules);
  return ctx.grid.map((_, i) => cellScore(ctx, i, rules, is));
}

export function total(ctx: ScoreCtx): number {
  const rules = activeRules(ctx), is = makeIs(ctx, rules);
  let t = 0;
  for (let i = 0; i < ctx.grid.length; i++) t += cellScore(ctx, i, rules, is);
  return t + bonus(ctx, rules);
}

export const withGrid = (ctx: ScoreCtx, grid: Grid): ScoreCtx => ({ ...ctx, grid });

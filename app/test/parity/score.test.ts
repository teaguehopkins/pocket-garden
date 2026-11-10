import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/v5.json';
import { rectBoard } from '../../src/core/board';
import { bonus, cellScores, total } from '../../src/core/score';
import { V5_FEATURES, type Grid, type ScoreCtx } from '../../src/core/types';

export const toGrid = (g: (string | null)[]): Grid => g.map((s) => (s ? { s } : null));

describe('v5 scoring parity', () => {
  it.each(fixtures.boards.map((b, n) => [n, b] as const))('board %i', (_n, b) => {
    const ctx: ScoreCtx = { board: rectBoard(4, 4), grid: toGrid(b.grid), rules: new Set(b.rules), season: b.season, weather: b.mod, features: V5_FEATURES };
    expect(cellScores(ctx)).toEqual(b.cells);
    expect(bonus(ctx)).toBe(b.bonus);
    expect(total(ctx)).toBe(b.total);
  });
});

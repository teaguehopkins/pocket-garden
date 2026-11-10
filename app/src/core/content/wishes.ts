import type { ScoreCtx } from '../types';

export interface WishDef {
  id: string;
  name: string;
  text: string;
  /** checked after each season is scored; once true it stays true */
  check(ctx: ScoreCtx, cells: number[]): boolean;
}

export const WISHES: WishDef[] = [];
export const wishById = (id: string) => WISHES.find((w) => w.id === id)!;

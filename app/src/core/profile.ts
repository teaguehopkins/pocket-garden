import { MAX_RANK, type RunState } from './run';

export interface Profile {
  v: 1;
  runs: number;
  years: number;
  best: number;
  rank: number;
  stars: number;
  /** best total per seed, key `${seed}` or `${seed}d` for daily */
  seedBest: Record<string, number>;
}

export const emptyProfile = (): Profile => ({ v: 1, runs: 0, years: 0, best: 0, rank: 1, stars: 0, seedBest: {} });

export interface RunOutcome {
  profile: Profile;
  rankUp: number | null;
  newBest: boolean;
}

/** v5 finish(): record a finished run on the profile. */
export function recordRun(p0: Profile, s: RunState): RunOutcome {
  const p: Profile = structuredClone(p0);
  p.runs++;
  let rankUp: number | null = null;
  if (s.phase === 'won') {
    p.years++;
    p.stars += s.stars ?? 0;
    if (!s.daily && p.rank < MAX_RANK) rankUp = ++p.rank;
  }
  p.best = Math.max(p.best, s.banked);
  const key = `${s.seed}${s.daily ? 'd' : ''}`;
  const newBest = s.banked > (p.seedBest[key] ?? 0);
  if (newBest) p.seedBest[key] = s.banked;
  return { profile: p, rankUp, newBest };
}

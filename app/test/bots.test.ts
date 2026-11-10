import { describe, expect, it } from 'vitest';
import { greedyBot, plannerBot, playRun, randomBot } from '../sim/bots';
import { newRun } from '../src/core/run';
import { P1_FEATURES } from '../src/core/types';
import { PLOTS } from '../src/core/content/plots';

describe('bots play legal full runs', () => {
  for (const bot of [randomBot, greedyBot, plannerBot({ width: 3, rollouts: 1, depth: 1 })])
    for (const [label, features] of [['v5', undefined], ['p1', P1_FEATURES]] as const)
      it(`${bot.name} (${label})`, () => {
        for (let k = 0; k < 3; k++) {
          const end = playRun(bot, newRun({ seed: 100 + k, features, plot: PLOTS[k].id }), k);
          expect(['won', 'lost']).toContain(end.phase);
        }
      });
});

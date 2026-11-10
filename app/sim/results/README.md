# Sim results

Win rates for the greedy bot (always takes the biggest preview number) and the planner (rollouts that look two seasons ahead). **Skill gap** = planner win rate − greedy win rate. Each configuration below has targets calibrated so greedy wins about 30%, so the gaps are comparable (`fair-*` files).

| configuration | targets | greedy | planner | gap |
|---|---|---|---|---|
| v5 | 16/42/74 | 30% | 63% | 32 |
| + seed bag | 16/42/74 | 29% | 62% | 33 |
| + seasonal life | 16/45/79 | 32% | 67% | 35 |
| + plots | per plot | 29% | 64% | 35 |
| + tools | per plot | 29% | 63% | 34 |
| full Phase 1 (+ new content, wishes) | per plot | 27% | 64% | 37 |

`v5-baseline` uses the prototype's own targets (16/37/64): greedy 43%, planner 75%.

Notes (2026-11-10):
- The planner already beats greedy by 32 points on v5, so the "preview solves the puzzle" diagnosis is weaker in sims than expected; the mechanics add about 5 points. Whether runs *feel* less stale is for the playtest.
- Tools barely change bot results; the planner rarely finds a Trowel or Replant better than planting.
- Wishes average about 1 of 3 for the planner; some may be too hard.
- Rules that look strong: Centrepiece, Biodiversity, Thicket. Weak: Early Season, Tool Shed, High Canopy. These per-rule numbers are confounded by which bot picks them.

Lane with the starting pool (`lane-start-pool`, 0 stars: 14 species, 12 rules, plot wishes): greedy 47%, planner 83%, gap 36. The early Lane is easier than the calibrated full-pool targets, which suits new players; it tightens as the pool grows. Revisit after playtests if the first plots feel too easy.

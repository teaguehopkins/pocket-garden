# Pocket Garden: checklist

See `PLAN.md` for the phases. Sim numbers live in `app/sim/results/`.

## Phase 0: Foundation (done)

- [x] Vite + TypeScript + Svelte 5 app in `app/`
- [x] Pure engine matching v5 exactly (600 boards, 80 full runs, RNG streams)
- [x] Save after every action; resume on load; profile migrated from `pg2-profile`
- [x] Bots (random, greedy, planner) and `npm run sim`; v5 baseline recorded
- [x] Minimal UI; e2e full run at 360px in light and dark with a reload mid-run
- [ ] **You:** play on a phone and kill the tab mid-run; check it resumes

## Phase 1: Depth and variety (built, needs your playtest)

All mechanics are on by default for new gardens. The Lab section in Settings (gear icon) toggles each one, so you can compare against v5.

- [x] Seed bag (18 packets, bag view)
- [x] Seasonal life: grow, spread, grow stronger, peak; "later" marks
- [x] 10 plots with features
- [x] Tools: Compost, Trowel, Replant
- [x] Rules: 13 new, including keystones
- [x] Wishes: 12, three per run, stars from wishes
- [x] 13 new species; Snail, Moss, Truffle revised
- [x] Plot targets calibrated by sim

### Playtest (15+ runs)

- [ ] **One more run:** after 15 runs, do you still want another?
- [ ] **Builds:** can you name distinct builds you went for (e.g. "acorn grove", "clover carpet", "frog marsh")?
- [ ] **Planning:** do you plant for "later" payoffs over the biggest number? Does that feel good or fiddly?
- [ ] **Bag:** do you check the bag? Does knowing what's left change your choices?
- [ ] **Tools:** which do you use? Is one tool per season right?
- [ ] **Wishes:** do they change your draft? Any that are never possible or always free?
- [ ] **Plots:** which plots feel different? Which feel the same as Raised Bed?
- [ ] **Difficulty:** which plots do you win or lose? (targets are set so a greedy bot wins about 30%)
- [ ] **Rules:** any never worth taking, or always taken?
- [ ] **Readability:** can you tell at a glance what each tile does now that there are more species?

## Phase 2: Look and feel (done)

Art direction: **B, Clay Diorama** (chosen 2026-11-10).

- [x] Design tokens (`app/src/art/tokens.css`): clay palette, season skies and accents, dusk dark mode, type, motion
- [x] Clay SVG tiles for all 32 species plus Rock (`app/src/art/Tile.svelte`; see `/#gallery`)
- [x] Living board: idle sway, bob, flutter, ripples and blinks; weather overlays (rain, petals, leaves, mist, dappled light, heat); sky shifts Spring to Summer to Autumn
- [x] Scoring tally: tiles count up with rising notes, helpful rules flash with their effect, bar fills, verdict, then growth and spreading
- [x] Touch feel: packets lift, pieces sprout when planted, drag-to-plant
- [x] Synthesised sound and vibration, each with a toggle; reduced motion respected
- [x] Layout: status card, rule and wish chips with detail sheets, board and shelf in the thumb zone, light and dark
- [x] Tally holds 60fps (median and p95 16.7ms) with the CPU throttled 4x in headless Chrome
- [x] **You:** one full run on a real phone: feels finished; sound and vibration good
- [x] **You:** tap is enough; drag kept as an option

## Parked

- **Drift Circuit (racer):** too easy; no reason to hold cards. Fix idea: hand carries over, draw 2/turn, harsher hazard combos.
- **Night Crew (heist):** felt like clicking with no decisions. Needs a redesign (shared stamina, route choices, moving guards) before retesting.

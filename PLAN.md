# Pocket Garden: from prototype to delightful game

## Context

`prototypes/garden.html` (v5) proves the loop: draft 6 species, stack 3 rule cards, plant 15 packets over three seasons. Your verdict is **fun, but it goes stale**. You want game feel, a real visual identity (custom SVG tiles), more depth and variety, and long-term progress, built as a proper project, and the game should bring joy **without being addictive or using dark patterns**.

### Why it goes stale (diagnosis from the code)

1. **The preview solves the puzzle.** Every empty square shows the exact score delta and all scoring is immediate and additive, so "tap the biggest number" is near-optimal. `todo.md` confirms it: random play scores ~63 in Autumn against a target of 64, thoughtful play ~73. Skill barely moves the outcome.
2. **Nothing happens over time.** Tiles never grow, spread, move or get replaced. Seasons differ only by one flat weather bonus.
3. **The board never changes.** Always 4×4, and 15 plantings fill 15 of 16 squares, so placement runs out of choices late.
4. **The queue is pure luck.** Packets are drawn uniformly with replacement (`fillQueue`), so you can't count on anything beyond the 3 visible.
5. **Rules mostly add points** rather than change how you play. Journey progression is only +3% targets.

The plan fixes depth first (in plain UI, measured with bots), then invests in art and feel once the tile set is stable, then meta-progression and shipping.

## Guiding additions to the PRD

- **New principle: "Joy, not compulsion."** No streaks that can be lost, no timers or energy, no notifications that nag, no random-reward unlocks, no ads or FOMO. Unlocks come at a deterministic pace from play. Every year ends at a natural stopping point with a calm "garden is resting" screen rather than an auto-queued next run. The daily is one garden; missing a day costs nothing.
- **Revised principle 4:** the live preview stays, but shows *this season's* change only. Delayed payoffs are marked, not computed, so planning beats greed.

## Phase 0: Foundation (no design changes)

Goal: v5 behaviour in a real project, with saves and a bot harness.

- **Stack:** Vite + TypeScript + Svelte 5 (built-in transitions and FLIP animation, tiny bundle), Vitest, `vite-plugin-pwa` (added in Phase 4). New `app/` directory; `prototypes/` stays as reference.
- **Pure engine** in `app/src/core/` with no DOM access:
  - `content/species.ts`, `rules.ts`, `weather.ts`, `plots.ts`: data-driven definitions replacing the `SP`/`RULES`/`MODS` tables and the `switch` in `cellScore`.
  - `score.ts`: port of `cellScore`, `bonus`, `total`, `adj`, `dia`.
  - `run.ts`: `apply(state, action) -> { state, events }`. State is plain JSON (RNG stored as its integer, not a closure as in `rng()` today). Events (`planted`, `tileScored`, `seasonEnded`, `grew`...) later drive animation and sound.
  - `rng.ts`: the existing mulberry32 generator, kept bit-identical so seeds stay reproducible.
- **Parity tests:** extract the prototype's scoring functions into a fixture script, generate totals for a few hundred random boards and rule sets, and assert the new engine matches.
- **Save/resume:** persist run state after every action (versioned, `localStorage`, plus `navigator.storage.persist()`); resume on load. Profile migrates from `pg2-profile`.
- **Bot harness** `app/sim/`: random, greedy (max delta) and lookahead bots; CLI prints win rate and score distribution per bot. **Key metric: skill gap** = planner win rate minus greedy win rate. v5 baseline recorded first.
- Minimal Svelte UI reproducing the current screens.

Exit: game plays as v5 on a phone, survives a tab kill mid-run, sim baseline numbers committed.

## Phase 1: Depth and variety (the staleness fix)

Each mechanic is added behind a flag, run through the bots, then playtested. Keep what raises the skill gap and feels good; cut the rest.

1. **Seed bag instead of random draws.** Drafting 6 species gives a bag of 18 packets (3 each); 15 are drawn per year. A "bag" view shows what's left. Luck becomes bounded and countable, and rules can now add or remove packets.
2. **Seasonal life: tiles that change over time.** Give roughly half the species a time verb, resolved at season end:
   - *Grow:* Acorn becomes Oak next season.
   - *Spread:* Clover seeds an adjacent empty square.
   - *Scale:* Bee gains +1 permanently per season spent next to a flower.
   - *Peak:* Tulip doubles in Spring, Sunflower in Summer, Mushroom in Autumn.
   These payoffs are not in the delta preview (a small "later" mark shows instead), which is what makes planning beat greed.
3. **Plots.** 8–10 layouts of 14–18 squares with pre-placed features: pond corner, stone path, old oak, sunny patch (double), shade wall. Replaces the rank-3 rock.
4. **Tools instead of a lone compost.** One charge per season, choose: *Compost* (replace the shelf), *Trowel* (move a tile), or *Replant* (plant over a tile). Gives late-game decisions when the board is full.
5. **Rules overhaul.** Grow 14 to ~24, cut dead picks, and add "keystone" rules that change verbs (e.g. "Spreading plants spread twice", "Animals may share a square with water").
6. **Wishes.** Each run shows 3 optional goals from the draft onward ("a full row of flowers", "one tile scoring 12+", "4 different animals"). Stars come from wishes, replacing the 7%/15% margin thresholds.
7. **Content:** 19 to ~30 species so each of the four archetypes (wetland, woodland, meadow, wildlife) has build-arounds and crossovers. Fix flagged dead picks (Snail, Moss, Truffle).
8. **Retune** targets so greedy wins ~30% and a planning bot ~70% on early plots.

Exit: skill gap at least 30 points in sims; you report "one more run" after 15+ runs and can name distinct builds.

## Phase 2: Look and feel

1. **Art direction first.** I mock 3 style options (same 4 tiles + a plot + one weather state each) as a single comparison page; you pick one. Then a design-token file (palette per season, type, radii, motion timings) and the full SVG tile set, built as Svelte components so parts can animate.
2. **Living board:** idle motion (sway, ripples, a bee drifting between flowers), ambient weather, and a palette that shifts Spring to Summer to Autumn.
3. **The scoring moment.** Season end plays as a sequenced tally: tiles pop one by one, points fly to the total, rule cards flash when they trigger, pitch rises with each step, then the target bar fills. This is the game's main payoff and is instant today.
4. **Touch feel:** packet lifts on select, seed drops and sprouts on plant, growth and spread animations between seasons, optional drag-to-plant.
5. **Sound and haptics:** small synthesised WebAudio set (no asset files), `navigator.vibrate` where supported, both with toggles. Honour `prefers-reduced-motion`.
6. **Layout pass:** board and shelf in the thumb zone at 360px, rules and weather collapsed to tappable chips with detail sheets, light and dark themes.

Exit: one full run looks and feels finished on a real phone at 60fps.

## Phase 3: Long-term progress (without hooks)

- **The Lane** replaces ranks 1–10: a street of plots unlocked in order, each with its own twist and 3 wish-stars. Each plot keeps a miniature of the best garden you grew there, so the lane itself becomes the persistent garden.
- **Almanac:** species and rules are catalogued as you meet them, with personal records per entry (best single-tile score, favourite pairing). New species and rules enter the pool at fixed star totals; starting with a small pool doubles as onboarding.
- **Achievements** for discovered combos, named and shown in the Almanac.
- **Onboarding:** first run on a tiny plot with a fixed teaching draft; no text tutorial.
- **Rest screen** after each year: result, what changed in the Lane, and no auto-start.

## Phase 4: Ship and share

- **PWA:** manifest, icons, service worker precache, offline verified. Hosting choice needed here (GitHub Pages or Cloudflare Pages are the simple options; service workers need HTTPS).
- **Sharing:** seed link that opens the same plot, draft and offers ("beat my garden"); result image rendered from the SVG board; text fallback as today.
- **Save safety:** export/import a save code, since there are no accounts.
- **Daily garden** on the new systems, with no streak counter.

## Phase 5: Tune with real players

Friends playtest build, lightweight local stats screen (no analytics by default), retune from real results, update `PRD.md` success metrics.

## Files

- New: `app/` (Vite project) with `src/core/`, `src/ui/`, `src/art/`, `sim/`, tests alongside.
- Updated as phases land: `PRD.md` (new principle, mechanics, Lane), `todo.md` (replaced by phase checklists), `README.md` (how to run).
- Reference only: `prototypes/garden.html`.

## Verification

- **Engine:** `vitest` parity suite against the v5 prototype (Phase 0), then unit tests per species, rule and season-end verb; determinism test (same seed + actions gives same state).
- **Balance:** `npm run sim` reports win rate and skill gap per bot and plot after every content change; numbers recorded in the repo.
- **Save/resume:** automated test that serialises mid-run, reloads and continues identically; manual tab-kill test on a phone.
- **UI:** run the dev server and drive a full run in a 360px-wide browser, light and dark, reduced motion on and off; check frame rate during the scoring tally.
- **PWA:** Lighthouse installability check and a full run in airplane mode.
- **Fun:** your playtest at the end of each phase against that phase's exit criteria; a phase does not close on sims alone.

## Open decisions (not blocking Phase 0)

- Hosting for the PWA (Phase 4).
- Whether the garden theme stays long-term (PRD risk); the art pass in Phase 2 is the point of commitment.

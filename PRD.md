# Pocket Garden — Product Requirements

*Status: draft · Last updated 2026-11-10 · Prototype: `prototypes/garden.html` (v5)*

## 1. Summary

Pocket Garden is a single-player, turn-based puzzle game for phones. Each run, the player drafts a handful of plant and animal species, picks rule cards that bend the scoring, and plants a small garden through three seasons, hitting a score target at the end of each. It is a mental challenge, not a test of reflexes, and every run can be put down at any moment and picked up later.

## 2. Problem and opportunity

Short, interruptible downtime (e.g. watching kids at the playground) is poorly served by most mobile games:

- Action games need sustained attention and punish looking away.
- Competitive card games like Hearthstone Battlegrounds deliver the drafting and synergy satisfaction we want, but impose turn timers and live opponents.
- Many casual puzzle games give no sense of building toward anything.

The opportunity is the depth of a draft-and-synergy game with none of the time pressure.

## 3. Target player and context

- **Who:** an adult who enjoys strategy/card games (Battlegrounds, roguelike deckbuilders) but has fragmented free time.
- **Where:** on a phone, one-handed, outdoors, often with patchy or no connectivity.
- **How:** in bursts of 1–2 minutes, interrupted unpredictably, with attention split with something more important (kids).

## 4. Goals

| Goal | What it means |
|---|---|
| Mental challenge | Decisions about planning and synergy decide the outcome. No mechanical precision, no timing. |
| No time pressure | No turn timers, no real-time elements, no penalty for leaving mid-decision. |
| Interruptible | Every action saves. A run can stop and resume at any point. |
| Offline | Fully playable with no connection. |
| Sense of achievement | Clear wins (clearing a season, finishing a year, earning stars) and visible mastery. |
| Sense of progress | Something that grows across runs: rank, collection, records. |
| Shareable | Results and progress are easy to share with friends. |
| Variety | Each run is a different puzzle, so the game stays interesting after many plays. |

### Non-goals

- Real-time multiplayer or PvP.
- Reflex, dexterity or timing challenges.
- Long, reading-heavy tutorials or story content.
- Monetisation design (deferred until the core loop is proven).

## 5. Design principles

1. **Plan, don't react.** Show the player what is coming (packet queue, season weather) so success comes from planning rather than luck. *Learned from playtests: random offers made planning "a crap shoot"; the visible queue fixed it.*
2. **Every run is a new puzzle.** Variety comes from the draft and the rules, not only from higher numbers. *Learned from playtests: rising targets alone became boring.*
3. **Combos you discover.** The core thrill is finding synergies and rule-breaking combinations.
4. **Readable at a glance.** Icons, short rule text, and a live score preview on every square. Glance, think, tap.
5. **Hard but fair.** Thoughtful play should beat a greedy strategy. Difficulty is tuned with simulated bots, then checked against real play.

## 6. Core loop

One run is a "garden year", targeting about 5–10 minutes in total:

1. **Draft.** Pick 6 of 19 species, one at a time from 3 offers. All three seasons' weather is visible while drafting. Only drafted species appear during the run.
2. **First rule.** Pick 1 of 3 rule cards (e.g. "Animals also count diagonal neighbours").
3. **Plant a season.** Plant 5 packets on a 4×4 plot. Choose from a shelf of 3, with the next 3 visible in a queue. Each empty square shows how much the season's score would change. Composting replaces the shelf once per season.
4. **Score the season.** The whole garden is scored under that season's weather and active rules, and must meet the target. Missing it ends the run.
5. **Repeat** for Summer and Autumn, picking a new rule card after each season cleared. The garden carries over; rules stack.
6. **Result.** Total score, 1–3 stars based on the margin over Autumn's target, rank change, share card.

### Key systems

- **Species:** 19 species across 6 types (tree, plant, fungus, flower, animal, water). Scoring depends on neighbours, rows/columns or the whole garden.
- **Weather:** one modifier per season (e.g. "Water +2 each"), shown from the start.
- **Rule cards:** 14 rules that change scoring or the shelf. 3 per run, stacking.
- **Packet queue:** a shelf plus a visible preview, so the player can set up for packets that are coming.

## 7. Progression and replayability

- **Journey mode:** random seed. Ranks 1–10; each year won ranks up. Higher ranks raise targets 3% and add constraints (rock at rank 3, shorter preview at 5, no composting at 7).
- **Daily garden:** same seed, weather, draft and rule offers for everyone that day, so results are comparable.
- **Stars and records:** stars per year, best score per seed, lifetime totals.
- **Future:** collection and discovery (species and rules unlocked or catalogued over time), achievements for specific combos, and a persistent garden or map that grows across runs.

## 8. Sharing

- **Now:** copy a text summary: mode/seed, result, stars, rules and an emoji grid of the garden.
- **Planned:** a share link that opens the same seed ("beat my garden"), a result image, and an optional friends leaderboard for the daily.
- Sharing must work without accounts; anything that needs accounts is optional.

## 9. Platform and technical requirements

- **Platform:** mobile web, delivered as an installable PWA (offline via service worker, home-screen install). Revisit a native wrapper (e.g. Capacitor) only if store distribution becomes important.
- **Layout:** portrait, one-thumb reachable, works from about 360px wide, light and dark themes.
- **Persistence:** auto-save after every action, including in the middle of a run. Progress is stored on the device; cross-device sync is optional and later.
- **Determinism:** seeded randomness so daily and shared seeds reproduce exactly.
- **Performance:** instant load from cache, no network needed during play.

## 10. Success metrics

For the prototype, measured through playtesting:

- A playtester finishes a run in a single sitting of 10 minutes or less, with interruptions.
- Playtesters say they are pursuing a build plan ("I'm going for frogs and water") during the draft.
- Year-win rate at rank 1 is about 50–70% for engaged players; higher ranks are hard but reachable.
- Playtesters want "one more run" after 10+ runs (boredom has set in later than in v4).

For launch, measured with analytics:

- D1 / D7 retention.
- Average runs per session.
- Share rate per completed run.
- Proportion of players who return for the daily.

## 11. Risks and open questions

- **Staleness:** do the draft and rules give enough variety, or does the 4×4 plot still feel the same after a while? Mitigations: plot shapes, pre-placed features, more species and rules.
- **Balance:** stacking rules can make scores balloon or make some picks always correct. Tune from real play data.
- **Readability:** with more species and rules, can a glance still tell the player what's happening?
- **Resume reliability:** browser storage can be cleared, so a lost run or lost progress would hurt the sense of progress.
- **Theme:** is the garden theme what we want long-term? The mechanics could carry another setting.
- **Open:** do we need accounts at all? What does "shareable progress" mean beyond sharing results?

## 12. Roadmap

1. **Playtest v5** (see `todo.md`) and retune.
2. **Content pass:** cut/buff rules and species; trial plot variations.
3. **Resilience:** save in-progress runs; first-run onboarding with a teaching draft.
4. **PWA:** installable offline build with its own hosting.
5. **Sharing:** seed links and result images.
6. **Meta-progression:** collection, achievements, persistent garden.

## Appendix: explored alternatives

- **Drift Circuit (spaceship racer):** draft ship parts, race with cards. Too easy; no reason to hold cards. Parked.
- **Night Crew (heist):** draft a crew, clear rooms. Felt like clicking without decisions. Parked.

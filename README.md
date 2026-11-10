# Pocket Garden

A turn-based garden puzzle game for phones. See `PRD.md` for the product, `PLAN.md` for the roadmap and `todo.md` for the current checklist.

## The app (`app/`)

Vite + TypeScript + Svelte 5. Requires Node 22+.

```sh
cd app
npm install
npm run dev        # dev server, also reachable from a phone on the same Wi-Fi
npm test           # engine, parity, save/resume and Phase 1 unit tests
npm run e2e        # Playwright: full runs at 360px, light and dark (uses system Chrome)
npm run sim -- --n 500 --bots random,greedy,planner --features p1
npm run sim:calibrate -- --n 600 --greedy 0.3 --write   # set plot targets
```

**Playing on a phone:** `npm run dev` prints a `Network:` URL (e.g. `http://192.168.1.20:5173`). Open it on a phone on the same network. Saves live in that browser.

**Game versions:** the *Lab* section at the bottom of the screen toggles each Phase 1 mechanic for new gardens (seed bag, seasonal life, plots, tools, wishes, new species and rules). All off is exactly the v5 prototype.

### Layout

- `src/core/`: pure game engine, no DOM. `run.ts` is the state machine (`apply(state, action) -> { state, events }`), `score.ts` the scoring, `content/` the species, rules, weather, plots and wishes tables.
- `src/ui/`: Svelte screens. `src/persist.ts`: saves after every action.
- `sim/`: bots (random, greedy, planner) and the balance CLI. Results are kept in `sim/results/`.
- `test/parity/`: `extract-v5.mjs` runs `prototypes/garden.html` headless to produce fixtures; the engine must match them exactly (`npm run fixtures` regenerates).
- `art-mocks/`: Phase 2 art-direction comparison page.

## Prototypes

Single-file HTML prototypes, open in a browser to play.

- `prototypes/garden.html`: Pocket Garden v5, the reference for the app's v5 mode.
- `prototypes/racer.html`: Drift Circuit (parked).
- `prototypes/heist.html`: Night Crew (parked).

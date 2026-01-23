# LETO — Build Plan (Codex)

## Milestones

M1 — Repository scaffold
- Vite + React + TypeScript setup
- Project structure per spec
- Licensing + attribution files

M2 — Data + scenario layer
- FIRMS + GDACS adapters with caching
- Scenario presets for AU and Africa
- About/Data panel

M3 — Propagation engine (worker)
- SGP4 (TLE) and circular orbit propagation
- AOI access + station contacts
- Heatmap + revisit metrics

M4 — UI integration
- Map view with incidents, tracks, footprints, AOI, stations
- Timeline and metrics panels
- Status bar and warnings

M5 — Tests + validation
- Unit tests for orbit/footprint/contacts/scoring
- Validation mode scenario and checks

## Ticket breakdown (mapped to files)

- Scaffold + tooling
  - `package.json`, `vite.config.ts`, `tsconfig.json`, `.eslintrc.cjs`
- Licence + attribution
  - `LICENSE`, `NOTICE`, `README.md`
- Documentation
  - `docs/spec.md`, `docs/codex.md`
- Data adapters
  - `src/data/cache.ts`, `src/data/firms.ts`, `src/data/gdacs.ts`, `public/sample/*`
- Scenarios
  - `src/data/scenarios.ts`
- Engine core
  - `src/engine/constants.ts`, `src/engine/geometry.ts`, `src/engine/orbit.ts`, `src/engine/compute.ts`
- Worker
  - `src/workers/protocol.ts`, `src/workers/engineWorker.ts`
- UI
  - `src/ui/App.tsx`, `src/ui/MapView.tsx`, `src/ui/ScenarioEditor.tsx`, `src/ui/MetricsPanel.tsx`, `src/ui/Timeline.tsx`, `src/ui/StatusBar.tsx`, `src/ui/DataPanel.tsx`, `src/ui/store.ts`, `src/ui/styles.css`
- Tests
  - `tests/engine.test.ts`

## Dev commands

- Install: `pnpm install`
- Dev server: `pnpm run dev`
- Build: `pnpm run build`
- Preview: `pnpm run preview`
- Test: `pnpm test`
- Lint: `pnpm run lint`

## Worker message protocol

Types
- Request
  - `{ type: 'run', scenario, incidents }`
- Progress
  - `{ type: 'progress', value }`
- Result
  - `{ type: 'result', output }`

Example

```json
{ "type": "run", "scenario": { "id": "au-bushfire", "name": "AU Bushfire" }, "incidents": [] }
```

```json
{ "type": "progress", "value": 42 }
```

```json
{ "type": "result", "output": { "scenarioId": "au-bushfire", "generatedUtc": "2026-01-10T00:00:00Z" } }
```

## Change rules

- Maintain deterministic UTC handling. Always use ISO UTC timestamps.
- Keep propagation and metric calculations inside the worker.
- Avoid non-deterministic randomness in outputs; seed any sampling if added.
- If a new data source is added, update About/Data panel and README attribution.
- Preserve the AOI rectangle behaviour unless adding polygon support behind a feature flag.

## Future extensions prompts

- Add polygon AOI and point-in-polygon access checks.
- Scenario comparison mode with side-by-side metrics.
- Link budget modelling and data-rate-aware downlink scheduling.
- “Any-sat downlink” aggregation across constellation.
- PDF export for incident briefings and pass plans.

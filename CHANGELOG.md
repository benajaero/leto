# Changelog

All notable changes to LETO will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` for open-source collaboration
- `SECURITY.md` for vulnerability reporting
- `PROJECT_LIFECYCLE.md` for weekly automated maintenance rhythm
- `CHANGELOG.md` (this file) to track project evolution

### Changed
- CSS import order fixed for Vite build compatibility

## [0.1.0] — 2026-04-25

### Added
- MVP satellite emergency response planner
- Scenario editor with slider-driven controls and grid-style coordinate inputs
- AOI access events, revisit metrics, coverage heatmap
- Ground station AOS/LOS window calculations
- Incident serviceability scoring aligned with spec
- Layer toggles and timeline windows
- Scenario import/export (JSON)
- Data attribution panel with live source timestamps
- Configurable footprint half-angle for sensor modelling
- Heatmap grid aligned with incident metadata
- Open-source licence (CC BY-SA 4.0)

### Engineering
- TLE + SGP4 orbit propagation via `satellite.js`
- Zustand state management
- Deck.gl + MapLibre GL mapping stack
- Tailwind CSS styling
- Vitest test suite with engine tests
- GitHub Actions CI and Pages deployment
- ESLint + TypeScript strict mode

---

[unreleased]: https://github.com/benajaero/leto/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/benajaero/leto/commits/v0.1.0

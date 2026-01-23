# LETO — Satellite Emergency Response Planner

LETO is a web-first decision cockpit that fuses live/near-real-time disaster feeds with satellite access, revisit, and downlink timelines. It gives planners a fast, UTC-accurate view of what can be seen, when it can be seen, and how quickly it can be delivered across Australia and Africa.

Built for clarity under pressure: rapid scenario setup, deterministic timing, and transparent data latency.

## Quick start

```bash
npm install
npm run dev
```

Run tests:

```bash
npm test
```

## What you can do

- Load ready-made scenarios for AU bushfires and Africa flood/cyclone response.
- Paste TLEs or generate circular orbits, add ground stations, and set AOI/time windows.
- See access windows, contact windows, revisit stats, and incident serviceability scores.
- Track data freshness with live source timestamps and offline/cache warnings.

## CI/CD

- CI runs lint, tests, and build on every push and pull request to `main`.
- CD deploys the `dist` build to GitHub Pages on `main`. The workflow sets `VITE_BASE_PATH` to the repository name so assets resolve correctly.

## Licence

This repository is licensed under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). If you share or adapt the software or documentation, you must attribute LETO and distribute derivatives under the same licence.

See `LICENSE` for the full legal code.

## Attribution & Data Sources

- NASA FIRMS (Active Fire data, near real-time). Latency varies by product and region. Check timestamps.
- GDACS (Global Disaster Alert and Coordination System) alerts feed.
- Optional/when configured: Digital Earth Australia Hotspots.

Data sources may be delayed, corrected, or removed. The UI surfaces the last observed timestamps for transparency.

## Disclaimer

Decision-support only. Not a sole source for response or operational decision-making.

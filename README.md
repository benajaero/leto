# LETO - Satellite Emergency Response Planner

[![CI](https://github.com/benajaero/leto/actions/workflows/ci.yml/badge.svg)](https://github.com/benajaero/leto/actions/workflows/ci.yml)
[![Deploy Pages](https://github.com/benajaero/leto/actions/workflows/pages.yml/badge.svg)](https://github.com/benajaero/leto/actions/workflows/pages.yml)
[![Licence: CC BY-SA 4.0](https://img.shields.io/badge/Licence-CC%20BY--SA%204.0-1a7f37.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

LETO (Low-Earth Triage & Operations) is a web-first decision cockpit that fuses live/near-real-time disaster feeds with satellite access, revisit, and downlink timelines. It gives planners a fast, UTC-accurate view of what can be seen, when it can be seen, and how quickly it can be delivered across Australia and Africa.

Built for clarity under pressure: rapid scenario setup, deterministic timing, and transparent data latency.

## Background (why this matters)

- Satellites keep working when ground infrastructure fails, and they are already embedded in global disaster response mechanisms like the International Charter. [International Charter](https://www.disasterscharter.org/)
- Australia's emergency coordination actively uses satellite-derived products and activates international mechanisms. [Geoscience Australia](https://www.ga.gov.au/)
- Near-real-time fire detection exists but has real latency; global FIRMS data are typically available within ~3 hours of observation. [NASA Earthdata FIRMS](https://earthdata.nasa.gov/learn/find-data/near-real-time/firms)
- Multi-hazard alerting (floods, cyclones) is available via GDACS and is suitable for incident overlays. [GDACS](https://www.gdacs.org/)
- Rapid mapping services (e.g., Copernicus EMS) operate on hours-days timelines, so "time-to-information" is a meaningful planning metric. [Copernicus EMS](https://mapping.emergency.copernicus.eu/)

LETO is not a mapping provider; it is a mission + ops decision layer: given satellites/constellations and ground stations, it estimates time-to-observation and time-to-downlink for live incidents.

## Quick start

```bash
pnpm install
pnpm run dev
```

Run tests:

```bash
pnpm test
```

## What you can do

- Load ready-made scenarios for AU bushfires and Africa flood/cyclone response.
- Paste TLEs or generate circular orbits, add ground stations, and set AOI/time windows.
- See access windows, contact windows, revisit stats, and incident serviceability scores.
- Track data freshness with live source timestamps and offline/cache warnings.

## Data sources and constraints

- NASA FIRMS active fires (near real-time; global latency can be hours). [NASA Earthdata FIRMS](https://earthdata.nasa.gov/learn/find-data/near-real-time/firms)
- GDACS global hazard alerts (floods, cyclones, other hazards). [GDACS](https://www.gdacs.org/)
- Optional: Digital Earth Australia Hotspots (national hotspot product for AU). [DEA Hotspots](https://www.ga.gov.au/dea/products/dea-hotspots)

Key constraints are explicit in the UI: data freshness, staleness warnings, and cached/offline mode. External feeds can fail or rate-limit; LETO degrades gracefully and preserves attribution.

## Modelling notes (engineering context)

- Orbit propagation uses TLE + SGP4, the standard approach for public element sets. [CelesTrak](https://celestrak.org/)
- LEO revisit and downlink planning depend on access geometry and station elevation masks (simple LOS model). [SSC](https://sscspace.com/)
- SSO-style orbits are common for EO due to consistent local solar time, which shapes revisit patterns. [ESA](https://www.esa.int/)
- The tool targets accessibility gaps highlighted by calls for open constellation/system simulators and browser-first tooling. [ESA Connectivity](https://connectivity.esa.int/), [MIT DSpace](https://dspace.mit.edu/)

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

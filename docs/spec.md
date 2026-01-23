# LETO — Project Specification

## 1) Product overview + non-goals
LETO is a web-based Satellite Emergency Response Planner for Australia and Africa. It combines live/near-real-time disaster incident feeds (fires, floods, cyclones) with satellite access timelines (coverage, revisit, downlink) so response teams can prioritise observation opportunities and data delivery.

Goals
- Provide a fast planning view of satellite access over an Area of Interest (AOI) with a clear, deterministic UTC timeline.
- Overlay near-real-time incidents from public feeds and compute time-to-observation/downlink estimates.
- Offer a scenario editor so planners can compare constellations, stations, and time horizons.

Non-goals (explicitly out of scope for MVP)
- Operational tasking, commanding, or live mission control integration.
- Certified orbit determination or high-fidelity line-of-sight modelling.
- Polygon AOIs, terrain-based masking, or link budgets.

## 2) System architecture diagram (ASCII)

+--------------------+         +-------------------------+
| React UI (Vite)    |  post   | Web Worker (engine)     |
| - scenario editor  +-------->+ - propagation (SGP4)    |
| - map & timeline   |  msg    | - access + metrics      |
| - data panels      |<--------+ - progress updates      |
+---------+----------+         +-------------+-----------+
          |                                      |
          | fetch                                | uses
          v                                      v
+--------------------+                    +--------------+
| Data adapters      |                    | satellite.js |
| - FIRMS (CSV)      |                    | SGP4 + ECI   |
| - GDACS (RSS/XML)  |                    +--------------+
+--------------------+

## 3) Data model (schemas)

Scenario
- id: string
- name: string
- startTimeUtc: ISO string (UTC)
- horizonHours: 6 | 12 | 24
- timestepSec: 30 | 60 | 120
- aoi: { latMin, latMax, lonMin, lonMax }
- satellites: TLE or Circular orbit
- stations: { id, name, lat, lon, maskDeg }

Satellite (TLE)
- id, name
- line1, line2

Satellite (Circular)
- id, name
- altitudeKm, inclinationDeg, raanDeg, meanAnomalyDeg

Incident
- id, source (FIRMS | GDACS)
- type, severity?, confidence?
- lat, lon
- observedUtc
- label

Engine output
- satellites: { track[], aoiAccess[], stationContacts[] }
- revisit: { passCount, avgGapMinutes, maxGapMinutes }
- heatmap: { lat, lon, count }[]
- incidentMetrics: { tobsMinutes, tdlMinutes, score }
- warnings: string[]

## 4) Algorithms

Propagation
- TLE propagation uses satellite.js (SGP4) with deterministic UTC timestamps.
- Circular orbit propagation uses a two-body approximation with mean motion n = sqrt(mu/a^3). ECI coordinates are rotated by RAAN and inclination. Earth rotation is applied via GMST for ECI->ECF conversion.

Footprint
- Each track point uses a fixed sensor half-angle (25°) for the MVP.
- Ground footprint radius (km):
  - psi = acos((Re / (Re + h)) * cos(theta))
  - radius = Re * psi

AOI access detection
- AOI is defined as a rectangle in lat/lon (no antimeridian crossing for MVP).
- For each timestep, compute the closest point on the AOI rectangle to the satellite subpoint.
- Access = distance(subpoint, closest point) <= footprint radius.

AOS/LOS for ground stations
- Convert satellite ECI to ECF for each timestep.
- Compute elevation angle at station location using satellite.js look angle utility.
- AOS/LOS windows are produced by thresholding elevation >= maskDeg.

Coverage heatmap
- AOI is subdivided into a grid of 0.5° x 0.5° cells.
- A cell is counted if any satellite footprint covers its centre at a timestep.

Incident observation + downlink
- Tobs: earliest timestep when satellite footprint covers the incident location.
- Tdl: earliest station contact start time after Tobs (per-satellite).
- The earliest (best) observation across satellites is reported.

## 5) Serviceability score definition
The MVP uses a simple weighted score bounded to 0–100:

- tobsScore = max(0, 50 − 0.8 × Tobs_minutes)
- tdlScore = max(0, 35 − 0.5 × Tdl_minutes) (0 if no downlink)
- revisitPenalty = min(15, 0.05 × maxGapMinutes)
- score = clamp(tobsScore + tdlScore + (15 − revisitPenalty), 0, 100)

This favours faster first observation and earlier downlink, with a modest penalty for long revisit gaps.

## 6) UX flows

1. Load a preset scenario or create a new one in the Scenario Editor.
2. Configure AOI rectangle, time window, timestep, satellites, and stations.
3. Data feeds load in the background and incidents appear on the map.
4. The worker computes access windows and metrics, streaming progress to the status bar.
5. Click an incident to view timing details and ranking in the Metrics panel.
6. Use filters to limit incidents by age and confidence/severity.

## 7) Acceptance criteria checklist

- [ ] App runs with `npm install` and `npm run dev`.
- [ ] Tests run with `npm test`.
- [ ] FIRMS and GDACS feeds are fetched, parsed, cached, and attributed.
- [ ] Scenario editor supports TLE and circular orbits.
- [ ] AOI access windows and revisit metrics are computed.
- [ ] Ground station AOS/LOS windows are computed with elevation mask.
- [ ] Coverage heatmap is generated and summarised.
- [ ] Incident Tobs/Tdl + serviceability score computed.
- [ ] Worker sends progress updates during long runs.
- [ ] In-app About/Data panel lists sources and timestamps.
- [ ] Licence and attribution are present in repository and UI.

## 8) Validation approach + limitations

Validation mode includes a sample TLE (ISS) and Melbourne station; the next pass window is a sanity check only. The model is simplified:
- AOI access uses a rectangle and a spherical Earth.
- No terrain, clouds, or sensor geometry beyond a fixed half-angle.
- Downlink assumes any station can downlink immediately during contact.

Results are for planning and prioritisation, not operational tasking.

## 9) Licensing & attribution

- This repository is licensed under CC BY-SA 4.0 (see `LICENSE`).
- Third-party dependencies are under their own licences.
- Data sources: NASA FIRMS, GDACS, optional Digital Earth Australia Hotspots.
- In-app attribution is mandatory and includes timestamps and latency notes.

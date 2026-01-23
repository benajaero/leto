LETO — Satellite Emergency Response Planner

Project Specification (spec.md)
Version: v1 (MVP) • Date: 24 Jan 2026 • Licence: CC BY-SA 4.0

1. Product Overview
1.1 Purpose

LETO is a browser-based mission design + operations decision support tool that links live/near-real-time disaster incident feeds (fires / floods / cyclones) to satellite access timelines (coverage, revisit, and downlink contact opportunities). It helps users answer:

When is the next opportunity to observe an incident area?

How large are the coverage gaps over the next 6–24 hours?

How quickly can data plausibly be downlinked to a ground station?

Which orbit/constellation configuration improves time-to-information?

1.2 Target Users

Emergency management analysts (triage + planning)

EO/space mission engineers (trade studies)

Humanitarian coordinators (serviceability ranking + briefings)

Ground segment planners (contact windows)

1.3 MVP Outputs (what the user gets)

AOI access events (start/end UTC windows)

Revisit metrics (average / maximum gap)

Coverage heatmap (coarse grid) over AOI

Ground station AOS/LOS windows

Time-to-first-observation per incident

Time-to-downlink per incident (earliest contact after observation)

“Event Serviceability Score” (0–100) for ranking incidents

2. Scope
2.1 In Scope (MVP)

Incident layers

Active fires: NASA FIRMS (primary)

Multi-hazard markers: GDACS events (flood / cyclone markers)

Optional (AU comparison): Digital Earth Australia Hotspots

Space + ground modelling

Satellite definition:

Import from TLE (paste)

Simple generated circular orbit satellites (altitude + inclination presets)

Orbit propagation:

TLE satellites: SGP4-based

Simple satellites: two-body circular approximation (documented)

Coverage modelling:

Footprint (configurable sensor half-angle or equivalent swath model)

AOI access detection (satellite footprint intersects AOI)

Ground stations:

Configurable stations (lat/lon, elevation mask)

AOS/LOS line-of-sight contact windows

Earliest downlink after observation

UI

Map/Globe view (incidents + orbits/tracks + footprints)

Timeline view (next access + downlink windows)

Metrics view (revisit stats + serviceability ranking)

Scenario editor (satellites, AOI, stations, time window)

Status/warnings (stale data, stale TLE, offline/cached data)

2.2 Not In Scope (v1)

Sensor radiometry, clouds, atmospheric correction

Commercial tasking workflows / pricing / licensing integration

Inter-satellite links and network routing optimisation

Detailed RF link budget (optional later as simplified estimator)

High-fidelity perturbations beyond SGP4/TLE (for TLE satellites SGP4 is the model)

3. Success Criteria
3.1 User-facing

A user can load a scenario and see:

incidents (fires + hazard markers),

satellite orbits/tracks/footprints,

and a ranked list of incidents with time-to-information metrics.

3.2 Performance (targets)

20 satellites, 24h horizon, 60s timestep:

compute access + revisit + downlink windows in ≤ 2–5 seconds on a typical laptop-class machine

UI remains responsive (heavy compute runs in a worker)

3.3 Trust & transparency

Every incident layer shows:

source name,

observed/updated timestamp (UTC),

and a clear data-latency note / disclaimer.

4. System Architecture
4.1 High-level components

UI (React): views, editor, visual overlays

Engine (Worker): propagation, coverage, access events, metrics

Data (Fetch + Cache): FIRMS/GDACS fetchers, local caching, freshness checks

Storage: scenario JSON, cached feeds in browser storage

4.2 Architecture diagram (ASCII)
             +-----------------------+
             |       UI (React)      |
             |  Map | Timeline | KPI |
             +----------+------------+
                        |
                        | postMessage (scenario + requests)
                        v
             +-----------------------+
             |   Engine Worker       |
             | Propagation (SGP4)    |
             | Coverage + Access     |
             | AOS/LOS + Metrics     |
             +----------+------------+
                        ^
                        | results (events, grids, scores)
                        |
+-----------------------+----------------------+
|              Data Layer (UI thread)          |
| FIRMS fetch -> cache -> freshness + parsing  |
| GDACS fetch -> cache -> freshness + parsing  |
+----------------------------------------------+

5. Data Model
5.1 Scenario

scenario_id: string

name: string

time_window: { start_utc, horizon_hours, timestep_seconds }

aoi: { type: "rect"|"poly", coords: ... } (poly optional v1; rect required)

satellites: Satellite[]

ground_stations: GroundStation[]

display: { show_tracks, show_footprints, layer_toggles... }

5.2 Satellite

TLE satellite

type: "tle"

sat_id: string

name: string

tle1: string

tle2: string

tle_epoch_utc: datetime (derived)

footprint: { half_angle_deg: number }

Generated circular satellite (MVP convenience)

type: "simple"

name: string

altitude_km: number

inclination_deg: number

raan_deg: number

mean_anomaly_deg: number

footprint: { half_angle_deg: number }

5.3 Ground Station

station_id: string

name: string

lat_deg: number

lon_deg: number

elevation_mask_deg: number

5.4 Incident

Common shape:

incident_id: string

source: "FIRMS"|"GDACS"|"DEA"

hazard_type: "fire"|"flood"|"cyclone"|...

lat_deg, lon_deg: number

observed_time_utc: datetime

ingested_time_utc: datetime

severity: number|string|null

properties: Record<string, any>

5.5 Engine outputs

access_events[]: { sat_id, aoi_id, start_utc, end_utc, max_elevation_est? }

station_contacts[]: { sat_id, station_id, aos_utc, los_utc, max_el_deg }

revisit_stats: { avg_gap_s, max_gap_s, passes_count }

heatmap_grid: { bounds, cell_size_km, values[] }

incident_metrics[]: { incident_id, t_first_obs_s, t_first_downlink_s, score_0_100 }

6. Algorithms and Engineering Methods
6.1 Time handling

All engine computations in UTC.

UI may display local time optionally, but stored and exported values remain UTC.

6.2 Orbit propagation

TLE satellites

Use SGP4 propagation per standard practice for TLEs.

Output at each timestep: ECI position → convert to lat/lon/alt (WGS84 or spherical approximation; document which is used).

Simple satellites

Two-body circular orbit approximation:

mean motion from altitude

propagate true anomaly via timestep

rotate by inclination + RAAN

This is explicitly “educational/trade-study level”, not for precision conjunction analysis.

6.3 Footprint model

Footprint radius derived from satellite altitude and sensor half-angle (simplified spherical Earth geometry).

Output: ground footprint circle (centre at subsatellite point; radius in km or angular degrees).

6.4 AOI access detection

Represent AOI as rectangle (lat/lon bounds) for MVP.

Access at timestep t if footprint circle intersects AOI:

cheap check: distance from subsatellite to AOI bounding box < footprint radius.

Derive access windows by detecting contiguous timestep runs and refining boundaries via linear interpolation.

6.5 Ground station contact (AOS/LOS)

Compute elevation angle of satellite as seen from station at each timestep.

Contact when elevation ≥ elevation_mask.

Detect AOS/LOS transitions, compute max elevation over window.

6.6 Coverage heatmap

Discretise AOI into a coarse lat/lon grid.

For each cell centre and each timestep:

mark “covered” if within any satellite footprint

Heatmap value options:

coverage fraction over horizon (0–1)

or revisit gap approximation per cell (optional later)

6.7 Time-to-information metrics

For each incident point:

Time-to-first-observation (Tobs): earliest access event where incident is inside footprint (point-in-circle).

Time-to-downlink (Tdl): earliest ground station contact after that observation (same satellite or any satellite; MVP can start with “same satellite” and extend to “any satellite” if cheap).

Score: see below.

6.8 Event Serviceability Score (0–100)

Goal: one number to rank incidents by “how quickly we can plausibly service this with the current constellation + ground segment”.

Define:

Tobs = seconds to first observation (cap at horizon)

Tdl = seconds to first downlink (cap at horizon)

Gmax = maximum revisit gap over AOI (seconds) (or per incident vicinity if implemented)

Normalise:

n_obs = clamp(Tobs / Tobs_ref, 0, 1)

n_dl = clamp(Tdl / Tdl_ref, 0, 1)

n_gap = clamp(Gmax / Gmax_ref, 0, 1)

Score:

score = 100 * (1 - (0.45*n_obs + 0.40*n_dl + 0.15*n_gap))

Defaults (documented, adjustable in UI later):

Tobs_ref = 6 hours

Tdl_ref = 8 hours

Gmax_ref = 12 hours

If no observation/downlink in horizon → set score to 0 and label “Unserviceable in horizon”.

7. UX and Flows
7.1 Primary screens

Map/Globe

layers toggle (FIRMS, GDACS, optional DEA)

satellites list with visibility toggles

footprints/tracks rendering

click incident → highlight and show metrics

Timeline

for selected incident or AOI:

observation windows

downlink windows (per station)

“next 6 hours” focus plus horizon selector

Metrics

AOI revisit stats

coverage heatmap summary (min/avg/max)

incident ranking table (score, Tobs, Tdl)

Scenario Editor

add TLE satellites (paste)

add simple satellites (altitude + inclination)

add stations

select AOI rectangle

time window + timestep

7.2 Warnings / status

Stale incident feed warning (last update > threshold)

Stale TLE warning (epoch age > threshold)

Offline mode warning (using cached data)

8. Requirements Checklist (MVP Acceptance)
8.1 Functional acceptance (high level)

Load FIRMS fires and display with timestamps + attribution.

Load GDACS events and display markers with event metadata.

Import TLE satellites and propagate positions over horizon.

Generate simple satellites and propagate over horizon.

Render tracks + footprints.

Define AOI rectangle and compute access events.

Compute revisit metrics and display them.

Compute contact windows for each station.

Compute incident Tobs/Tdl and serviceability score.

Timeline view shows next observation + downlink windows.

Scenario save/load JSON.

8.2 Non-functional acceptance

Runs via npm install + npm run dev.

Worker-based compute keeps UI responsive.

Unit tests for core engine functions pass.

Attribution visible in UI and documented.

9. Validation Approach
9.1 Propagation validation (SGP4 path)

Compare a small set of propagated outputs against a trusted SGP4 reference library using the same TLE.

Sanity checks:

positions change smoothly over timesteps

predicted next-pass window over a city roughly matches known pass predictions from a public tracker (documented as “sanity”, not absolute truth).

9.2 Geometry validation

Footprint radius increases with altitude and half-angle (monotonic tests).

AOS/LOS transitions behave sensibly as elevation mask changes.

9.3 Data validation

Ensure incident timestamps parse correctly and remain in UTC.

Cache logic: show last ingested time clearly.

10. Limitations (must be stated in-app)

FIRMS is near real-time but not instantaneous; users must interpret timestamps and latency notes.

SGP4 + TLE gives reasonable predictions but can drift, particularly if TLEs are stale.

Coverage/heatmap and AOI access are simplified; this is decision support, not certified operational tooling.

11. Security, Privacy, and Safety

No PII required.

No user accounts needed for MVP.

Clear “not sole source of truth” disclaimer.

12. Licensing & Attribution

Repository licensed CC BY-SA 4.0 (root LICENSE and NOTICE/ATTRIBUTION required).

Dependencies remain under their own licences.

Incident layers must display source attribution + timestamps in UI.

13. Roadmap (post-MVP)

Polygon AOI drawing

Scenario comparison (A/B) with metric deltas

“Any-satellite downlink” (relay-like simplification)

Link budget “quick estimator”

More hazards (rainfall, river height feeds where appropriate)

Better orbit presets (SSO helper / constellation generator)

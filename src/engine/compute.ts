import type {
  AOIRect,
  EngineOutput,
  Incident,
  RevisitMetrics,
  SatelliteDef,
  Scenario
} from './types';
import type { SatelliteOutput, TrackPoint, AccessWindow, IncidentMetrics } from './types';
import { footprintRadiusKm, haversineKm, closestPointOnRect } from './geometry';
import { parseTleSatrec, propagateCircularOrbit, propagateTle, elevationDeg } from './orbit';

const FOOTPRINT_HALF_ANGLE_DEG = 25;
const HEATMAP_RESOLUTION_DEG = 0.5;

export type ProgressCallback = (value: number) => void;

function generateTimes(start: Date, horizonHours: number, timestepSec: number): Date[] {
  const total = horizonHours * 3600;
  const times: Date[] = [];
  for (let t = 0; t <= total; t += timestepSec) {
    times.push(new Date(start.getTime() + t * 1000));
  }
  return times;
}

function computeAccessWindows(flags: boolean[], times: Date[], elevations?: number[]): AccessWindow[] {
  const windows: AccessWindow[] = [];
  let openIndex: number | null = null;
  let maxEl = -90;
  for (let i = 0; i < flags.length; i += 1) {
    if (flags[i]) {
      if (openIndex === null) {
        openIndex = i;
        maxEl = elevations ? elevations[i] : -90;
      } else if (elevations) {
        maxEl = Math.max(maxEl, elevations[i]);
      }
    }
    if (!flags[i] && openIndex !== null) {
      windows.push({
        startUtc: times[openIndex].toISOString(),
        endUtc: times[i - 1].toISOString(),
        maxElevationDeg: elevations ? maxEl : undefined
      });
      openIndex = null;
      maxEl = -90;
    }
  }
  if (openIndex !== null) {
    windows.push({
      startUtc: times[openIndex].toISOString(),
      endUtc: times[times.length - 1].toISOString(),
      maxElevationDeg: elevations ? maxEl : undefined
    });
  }
  return windows;
}

function revisitFromWindows(windows: AccessWindow[]): RevisitMetrics {
  if (windows.length === 0) {
    return { passCount: 0, avgGapMinutes: 0, maxGapMinutes: 0 };
  }
  const gaps: number[] = [];
  for (let i = 1; i < windows.length; i += 1) {
    const prevEnd = new Date(windows[i - 1].endUtc).getTime();
    const nextStart = new Date(windows[i].startUtc).getTime();
    gaps.push((nextStart - prevEnd) / 60000);
  }
  const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const max = gaps.length ? Math.max(...gaps) : 0;
  return { passCount: windows.length, avgGapMinutes: avg, maxGapMinutes: max };
}

function aoiIntersects(aoi: AOIRect, subpoint: { lat: number; lon: number }, footprintKm: number): boolean {
  const closest = closestPointOnRect(subpoint, aoi);
  const distance = haversineKm(subpoint, closest);
  return distance <= footprintKm;
}

function scoreServiceability(tobsMinutes: number | null, tdlMinutes: number | null, maxGapMinutes: number): number {
  if (tobsMinutes === null) {
    return 0;
  }
  const tobsScore = Math.max(0, 50 - tobsMinutes * 0.8);
  const tdlScore = tdlMinutes === null ? 0 : Math.max(0, 35 - tdlMinutes * 0.5);
  const revisitPenalty = Math.min(15, maxGapMinutes * 0.05);
  const score = Math.max(0, Math.min(100, tobsScore + tdlScore + (15 - revisitPenalty)));
  return Math.round(score);
}

function buildHeatmap(aoi: AOIRect, tracks: TrackPoint[]): { lat: number; lon: number; count: number }[] {
  const cells: { lat: number; lon: number; count: number }[] = [];
  for (let lat = aoi.latMin; lat <= aoi.latMax; lat += HEATMAP_RESOLUTION_DEG) {
    for (let lon = aoi.lonMin; lon <= aoi.lonMax; lon += HEATMAP_RESOLUTION_DEG) {
      cells.push({ lat: lat + HEATMAP_RESOLUTION_DEG / 2, lon: lon + HEATMAP_RESOLUTION_DEG / 2, count: 0 });
    }
  }
  for (const track of tracks) {
    for (const cell of cells) {
      const distance = haversineKm({ lat: track.lat, lon: track.lon }, { lat: cell.lat, lon: cell.lon });
      if (distance <= track.footprintKm) {
        cell.count += 1;
      }
    }
  }
  return cells;
}

export function computeScenario(
  scenario: Scenario,
  incidents: Incident[],
  onProgress?: ProgressCallback
): EngineOutput {
  const start = new Date(scenario.startTimeUtc);
  const times = generateTimes(start, scenario.horizonHours, scenario.timestepSec);
  const warnings: string[] = [];

  const allTracks: TrackPoint[] = [];
  const satellitesOutput: SatelliteOutput[] = [];

  scenario.satellites.forEach((sat, idx) => {
    const satrec = sat.type === 'tle' ? parseTleSatrec(sat) : null;
    const track: TrackPoint[] = [];
    const aoiFlags: boolean[] = [];
    const stationFlags: Record<string, boolean[]> = {};
    const stationElevations: Record<string, number[]> = {};

    scenario.stations.forEach((station) => {
      stationFlags[station.id] = [];
      stationElevations[station.id] = [];
    });

    times.forEach((time, timeIndex) => {
      const point = sat.type === 'tle' ? propagateTle(satrec!, time) : propagateCircularOrbit(sat, start, time);
      if (!point || !point.ecf) {
        aoiFlags.push(false);
        scenario.stations.forEach((station) => {
          stationFlags[station.id].push(false);
          stationElevations[station.id].push(-90);
        });
      } else {
        const footprintKm = footprintRadiusKm(point.altKm, FOOTPRINT_HALF_ANGLE_DEG);
        const subpoint = { lat: point.lat, lon: point.lon };
        track.push({
          timeUtc: time.toISOString(),
          lat: point.lat,
          lon: point.lon,
          altKm: point.altKm,
          footprintKm
        });
        aoiFlags.push(aoiIntersects(scenario.aoi, subpoint, footprintKm));
        scenario.stations.forEach((station) => {
          const el = elevationDeg(station, point.ecf!, time);
          stationFlags[station.id].push(el >= station.maskDeg);
          stationElevations[station.id].push(el);
        });
      }

      if (onProgress && timeIndex % 50 === 0) {
        const pct = Math.round(((idx + timeIndex / times.length) / scenario.satellites.length) * 100);
        onProgress(Math.min(100, pct));
      }
    });

    const aoiAccess = computeAccessWindows(aoiFlags, times);
    const stationContacts: Record<string, AccessWindow[]> = {};
    scenario.stations.forEach((station) => {
      stationContacts[station.id] = computeAccessWindows(stationFlags[station.id], times, stationElevations[station.id]);
    });

    satellitesOutput.push({
      id: sat.id,
      name: sat.name,
      track,
      aoiAccess,
      stationContacts
    });
    allTracks.push(...track);
  });

  const revisit = revisitFromWindows(
    satellitesOutput.flatMap((sat) => sat.aoiAccess)
  );

  const heatmap = buildHeatmap(scenario.aoi, allTracks);

  const incidentMetrics: IncidentMetrics[] = incidents.map((incident) => {
    let bestTobs: number | null = null;
    let bestTdl: number | null = null;
    let servingSatellite: string | undefined;

    satellitesOutput.forEach((satOut) => {
      const obs = satOut.track.find((point) => {
        const distance = haversineKm({ lat: point.lat, lon: point.lon }, { lat: incident.lat, lon: incident.lon });
        return distance <= point.footprintKm;
      });
      if (obs) {
        const obsTime = new Date(obs.timeUtc).getTime();
        const tobs = (obsTime - start.getTime()) / 60000;
        let tdl: number | null = null;
        const contactWindows = Object.values(satOut.stationContacts).flat();
        const contact = contactWindows.find((window) => new Date(window.startUtc).getTime() >= obsTime);
        if (contact) {
          tdl = (new Date(contact.startUtc).getTime() - start.getTime()) / 60000;
        }
        if (bestTobs === null || tobs < bestTobs) {
          bestTobs = tobs;
          bestTdl = tdl;
          servingSatellite = satOut.name;
        }
      }
    });

    const score = scoreServiceability(bestTobs, bestTdl, revisit.maxGapMinutes);
    return {
      incidentId: incident.id,
      tobsMinutes: bestTobs,
      tdlMinutes: bestTdl,
      score,
      servingSatellite
    };
  });

  return {
    scenarioId: scenario.id,
    generatedUtc: new Date().toISOString(),
    satellites: satellitesOutput,
    revisit,
    heatmap,
    incidentMetrics,
    warnings
  };
}

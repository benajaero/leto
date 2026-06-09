import { describe, it, expect } from 'vitest';
import { computeScenario } from '../src/engine/compute';
import type { Scenario } from '../src/engine/types';

describe('Engine performance benchmark', () => {
  const baseScenario: Omit<Scenario, 'startTimeUtc'> = {
    id: 'benchmark',
    name: 'Benchmark',
    horizonHours: 24,
    timestepSec: 60,
    aoi: { latMin: -38, latMax: -24, lonMin: 140, lonMax: 154 },
    satellites: [
      {
        id: 'sentinel-2a',
        name: 'Sentinel-2A',
        type: 'tle',
        line1: '1 40697U 15028A   26009.52083333  .00000678  00000-0  36758-4 0  9991',
        line2: '2 40697  98.5694  22.1575 0001221  97.7023 262.4312 14.30887254479401'
      }
    ],
    stations: [
      { id: 'canberra', name: 'Canberra', lat: -35.3, lon: 149.1, maskDeg: 10 }
    ]
  };

  function makeScenario(timestepSec: number, satCount: number, stationCount: number): Scenario {
    const sats = Array.from({ length: satCount }, (_, i) => ({
      ...baseScenario.satellites[0],
      id: `sat-${i}`,
      name: `Sat-${i}`
    }));
    const stations = Array.from({ length: stationCount }, (_, i) => ({
      ...baseScenario.stations[0],
      id: `station-${i}`,
      name: `Station-${i}`,
      lon: 149.1 + i * 2
    }));
    return {
      ...baseScenario,
      startTimeUtc: new Date(Date.UTC(2026, 0, 10, 0, 0, 0)).toISOString(),
      timestepSec,
      satellites: sats,
      stations
    };
  }

  it('24h / 60s / 1 sat / 1 station completes in < 3s', () => {
    const scenario = makeScenario(60, 1, 1);
    const incidents = [{ id: 'bench', source: 'FIRMS' as const, type: 'Fire', lat: -35, lon: 145, observedUtc: scenario.startTimeUtc, label: 'Bench' }];
    const t0 = performance.now();
    const output = computeScenario(scenario, incidents);
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(3000);
    expect(output.satellites.length).toBe(1);
    expect(output.incidentMetrics.length).toBe(1);
    console.log(`Benchmark 24h/60s/1sat/1st: ${(t1 - t0).toFixed(1)}ms`);
  });

  it('24h / 30s / 1 sat / 1 station completes in < 5s', () => {
    const scenario = makeScenario(30, 1, 1);
    const incidents = [{ id: 'bench', source: 'FIRMS' as const, type: 'Fire', lat: -35, lon: 145, observedUtc: scenario.startTimeUtc, label: 'Bench' }];
    const t0 = performance.now();
    const output = computeScenario(scenario, incidents);
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(5000);
    expect(output.satellites.length).toBe(1);
    console.log(`Benchmark 24h/30s/1sat/1st: ${(t1 - t0).toFixed(1)}ms`);
  });

  it('24h / 60s / 3 sats / 2 stations completes in < 8s', () => {
    const scenario = makeScenario(60, 3, 2);
    const incidents = Array.from({ length: 20 }, (_, i) => ({
      id: `bench-${i}`,
      source: 'FIRMS' as const,
      type: 'Fire',
      lat: -35 + (i % 5) * 0.5,
      lon: 145 + (i % 5) * 0.5,
      observedUtc: scenario.startTimeUtc,
      label: 'Bench'
    }));
    const t0 = performance.now();
    const output = computeScenario(scenario, incidents);
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(8000);
    expect(output.satellites.length).toBe(3);
    console.log(`Benchmark 24h/60s/3sat/2st: ${(t1 - t0).toFixed(1)}ms`);
  });

  it('progress callback fires incrementally', () => {
    const scenario = makeScenario(60, 1, 1);
    const incidents: import('../src/engine/types').Incident[] = [];
    const progressValues: number[] = [];
    computeScenario(scenario, incidents, (v) => progressValues.push(v));
    expect(progressValues.length).toBeGreaterThan(0);
    expect(progressValues[progressValues.length - 1]).toBeGreaterThanOrEqual(90);
  });
});

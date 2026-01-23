import { describe, it, expect } from 'vitest';
import { parseTleSatrec, propagateTle, propagateCircularOrbit } from '../src/engine/orbit';
import { footprintRadiusKm } from '../src/engine/geometry';
import { computeScenario } from '../src/engine/compute';
import type { Scenario } from '../src/engine/types';

describe('TLE propagation', () => {
  it('propagates without NaNs and position changes', () => {
    const satrec = parseTleSatrec({
      id: 'iss',
      name: 'ISS',
      type: 'tle',
      line1: '1 25544U 98067A   26009.50486111  .00006372  00000-0  12164-3 0  9992',
      line2: '2 25544  51.6426  65.3566 0002895  87.9932  55.9276 15.50637785429944'
    });
    const t1 = propagateTle(satrec, new Date(Date.UTC(2026, 0, 10, 0, 0, 0)));
    const t2 = propagateTle(satrec, new Date(Date.UTC(2026, 0, 10, 0, 10, 0)));
    expect(t1).toBeTruthy();
    expect(t2).toBeTruthy();
    expect(Number.isFinite(t1!.lat)).toBe(true);
    expect(Number.isFinite(t2!.lat)).toBe(true);
    expect(t1!.lat).not.toBe(t2!.lat);
  });
});

describe('AOS/LOS detection', () => {
  it('produces station contacts for a simple orbit', () => {
    const scenario: Scenario = {
      id: 'test',
      name: 'Test',
      startTimeUtc: new Date(Date.UTC(2026, 0, 10, 0, 0, 0)).toISOString(),
      horizonHours: 6,
      timestepSec: 120,
      aoi: { latMin: -5, latMax: 5, lonMin: 100, lonMax: 110 },
      satellites: [
        {
          id: 'circular',
          name: 'Circular',
          type: 'circular',
          altitudeKm: 550,
          inclinationDeg: 0,
          raanDeg: 0,
          meanAnomalyDeg: 0
        }
      ],
      stations: [{ id: 'station', name: 'Equator', lat: 0, lon: 105, maskDeg: 5 }]
    };
    const output = computeScenario(scenario, []);
    const contacts = output.satellites[0].stationContacts.station;
    expect(contacts.length).toBeGreaterThan(0);
  });
});

describe('Footprint radius', () => {
  it('increases with altitude for same half-angle', () => {
    const r1 = footprintRadiusKm(400, 25);
    const r2 = footprintRadiusKm(700, 25);
    expect(r2).toBeGreaterThan(r1);
  });
});

describe('Serviceability scoring', () => {
  it('scores higher for faster observation/downlink', () => {
    const scenario: Scenario = {
      id: 'test-score',
      name: 'Score',
      startTimeUtc: new Date(Date.UTC(2026, 0, 10, 0, 0, 0)).toISOString(),
      horizonHours: 6,
      timestepSec: 60,
      aoi: { latMin: -5, latMax: 5, lonMin: 100, lonMax: 110 },
      satellites: [
        {
          id: 'circular',
          name: 'Circular',
          type: 'circular',
          altitudeKm: 550,
          inclinationDeg: 0,
          raanDeg: 0,
          meanAnomalyDeg: 0
        }
      ],
      stations: [{ id: 'station', name: 'Equator', lat: 0, lon: 105, maskDeg: 5 }]
    };
    const incidents = [
      { id: 'near', source: 'FIRMS', type: 'Fire', lat: 0, lon: 105, observedUtc: scenario.startTimeUtc, label: 'Near' },
      { id: 'far', source: 'FIRMS', type: 'Fire', lat: 4, lon: 105, observedUtc: scenario.startTimeUtc, label: 'Far' }
    ];
    const output = computeScenario(scenario, incidents);
    const nearScore = output.incidentMetrics.find((metric) => metric.incidentId === 'near')!.score;
    const farScore = output.incidentMetrics.find((metric) => metric.incidentId === 'far')!.score;
    expect(nearScore).toBeGreaterThanOrEqual(0);
    expect(nearScore).toBeLessThanOrEqual(100);
    expect(nearScore).toBeGreaterThanOrEqual(farScore);
  });
});

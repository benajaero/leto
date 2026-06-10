import type { Scenario } from '@/lib/engine/types';

// Scenarios use current UTC time so passes are always relative to "now"
function nowRoundedToHour(): string {
  const d = new Date();
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

export const scenarios: Scenario[] = [
  {
    id: 'au-bushfire-quick',
    name: 'AU Bushfire — Quick Start',
    startTimeUtc: nowRoundedToHour(),
    horizonHours: 12,
    timestepSec: 60,
    aoi: { latMin: -38, latMax: -24, lonMin: 140, lonMax: 154 },
    satellites: [
      {
        id: 'sat-optical-1',
        name: 'LETO-Optical-1',
        type: 'circular',
        altitudeKm: 550,
        inclinationDeg: 97.5,
        raanDeg: 40,
        meanAnomalyDeg: 10
      }
    ],
    stations: [
      { id: 'station-canberra', name: 'Canberra', lat: -35.3, lon: 149.1, maskDeg: 10 }
    ]
  },
  {
    id: 'au-bushfire',
    name: 'AU Bushfire — Full',
    startTimeUtc: nowRoundedToHour(),
    horizonHours: 12,
    timestepSec: 60,
    aoi: { latMin: -38, latMax: -24, lonMin: 140, lonMax: 154 },
    satellites: [
      {
        id: 'sat-optical-1',
        name: 'LETO-Optical-1',
        type: 'circular',
        altitudeKm: 550,
        inclinationDeg: 97.5,
        raanDeg: 40,
        meanAnomalyDeg: 10
      },
      {
        id: 'sat-radar-1',
        name: 'LETO-Radar-1',
        type: 'circular',
        altitudeKm: 620,
        inclinationDeg: 98,
        raanDeg: 120,
        meanAnomalyDeg: 220
      },
      {
        id: 'sat-optical-2',
        name: 'LETO-Optical-2',
        type: 'circular',
        altitudeKm: 500,
        inclinationDeg: 97.2,
        raanDeg: 60,
        meanAnomalyDeg: 90
      }
    ],
    stations: [
      { id: 'station-canberra', name: 'Canberra', lat: -35.3, lon: 149.1, maskDeg: 10 },
      { id: 'station-alice', name: 'Alice Springs', lat: -23.7, lon: 133.9, maskDeg: 10 }
    ]
  },
  {
    id: 'africa-flood-cyclone',
    name: 'Africa Flood/Cyclone',
    startTimeUtc: nowRoundedToHour(),
    horizonHours: 12,
    timestepSec: 60,
    aoi: { latMin: -22, latMax: -10, lonMin: 30, lonMax: 42 },
    satellites: [
      {
        id: 'sat-optical-3',
        name: 'LETO-Optical-2',
        type: 'circular',
        altitudeKm: 500,
        inclinationDeg: 97.2,
        raanDeg: 60,
        meanAnomalyDeg: 90
      },
      {
        id: 'sat-radar-2',
        name: 'LETO-Radar-2',
        type: 'circular',
        altitudeKm: 700,
        inclinationDeg: 98.5,
        raanDeg: 150,
        meanAnomalyDeg: 300
      },
      {
        id: 'sat-optical-4',
        name: 'LETO-Optical-3',
        type: 'circular',
        altitudeKm: 550,
        inclinationDeg: 97.5,
        raanDeg: 80,
        meanAnomalyDeg: 45
      }
    ],
    stations: [
      { id: 'station-nairobi', name: 'Nairobi', lat: -1.3, lon: 36.8, maskDeg: 10 },
      { id: 'station-maputo', name: 'Maputo', lat: -25.9, lon: 32.6, maskDeg: 10 }
    ]
  },
  {
    id: 'validation',
    name: 'Validation Mode',
    startTimeUtc: nowRoundedToHour(),
    horizonHours: 6,
    timestepSec: 60,
    aoi: { latMin: -38, latMax: -30, lonMin: 144, lonMax: 150 },
    satellites: [
      {
        id: 'sat-iss',
        name: 'ISS (sample TLE)',
        type: 'tle',
        line1: '1 25544U 98067A   26161.00000000  .00006372  00000-0  12164-3 0  9992',
        line2: '2 25544  51.6426  65.3566 0002895  87.9932  55.9276 15.50637785429944'
      }
    ],
    stations: [
      { id: 'station-melbourne', name: 'Melbourne', lat: -37.8, lon: 144.9, maskDeg: 10 }
    ]
  }
];

import type { SatelliteDef, GroundStation } from '@/lib/engine/types';

export const availableSatellites: SatelliteDef[] = [
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
    id: 'sat-optical-2',
    name: 'LETO-Optical-2',
    type: 'circular',
    altitudeKm: 500,
    inclinationDeg: 97.2,
    raanDeg: 60,
    meanAnomalyDeg: 90
  },
  {
    id: 'sat-optical-3',
    name: 'LETO-Optical-3',
    type: 'circular',
    altitudeKm: 550,
    inclinationDeg: 97.5,
    raanDeg: 80,
    meanAnomalyDeg: 45
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
    id: 'sat-radar-2',
    name: 'LETO-Radar-2',
    type: 'circular',
    altitudeKm: 700,
    inclinationDeg: 98.5,
    raanDeg: 150,
    meanAnomalyDeg: 300
  },
  {
    id: 'sat-iss',
    name: 'ISS (sample TLE)',
    type: 'tle',
    line1: '1 25544U 98067A   26161.00000000  .00006372  00000-0  12164-3 0  9992',
    line2: '2 25544  51.6426  65.3566 0002895  87.9932  55.9276 15.50637785429944'
  },
];

export const availableStations: GroundStation[] = [
  { id: 'station-canberra', name: 'Canberra', lat: -35.3, lon: 149.1, maskDeg: 10 },
  { id: 'station-alice', name: 'Alice Springs', lat: -23.7, lon: 133.9, maskDeg: 10 },
  { id: 'station-nairobi', name: 'Nairobi', lat: -1.3, lon: 36.8, maskDeg: 10 },
  { id: 'station-maputo', name: 'Maputo', lat: -25.9, lon: 32.6, maskDeg: 10 },
  { id: 'station-melbourne', name: 'Melbourne', lat: -37.8, lon: 144.9, maskDeg: 10 },
];

export const presetAOIs = [
  { name: 'Southeast Australia', aoi: { latMin: -38, latMax: -24, lonMin: 140, lonMax: 154 } },
  { name: 'Southern Africa', aoi: { latMin: -22, latMax: -10, lonMin: 30, lonMax: 42 } },
  { name: 'Southeast Asia', aoi: { latMin: -8, latMax: 18, lonMin: 95, lonMax: 142 } },
  { name: 'South America', aoi: { latMin: -35, latMax: 5, lonMin: -75, lonMax: -35 } },
  { name: 'Mediterranean', aoi: { latMin: 30, latMax: 45, lonMin: -10, lonMax: 40 } },
];

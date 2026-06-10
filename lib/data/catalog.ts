import type { SatelliteDef, GroundStation } from '@/lib/engine/types';

export const availableSatellites: SatelliteDef[] = [
  {
    id: 'sat-sentinel-2a',
    name: 'Sentinel-2A',
    type: 'tle',
    line1: '1 40697U 15028A   26009.52083333  .00000678  00000-0  36758-4 0  9991',
    line2: '2 40697  98.5694  22.1575 0001221  97.7023 262.4312 14.30887254479401'
  },
  {
    id: 'sat-sentinel-1a',
    name: 'Sentinel-1A',
    type: 'tle',
    line1: '1 39634U 14016A   26009.54652778  .00000139  00000-0  13169-4 0  9999',
    line2: '2 39634  98.1814  28.6282 0001427  91.8430 268.2888 14.59190710476765'
  },
  {
    id: 'sat-iss',
    name: 'ISS',
    type: 'tle',
    line1: '1 25544U 98067A   26009.50486111  .00006372  00000-0  12164-3 0  9992',
    line2: '2 25544  51.6426  65.3566 0002895  87.9932  55.9276 15.50637785429944'
  },
  {
    id: 'sat-leto-optical-1',
    name: 'LETO-Optical-1',
    type: 'circular',
    altitudeKm: 550,
    inclinationDeg: 97.5,
    raanDeg: 40,
    meanAnomalyDeg: 10
  },
  {
    id: 'sat-leto-optical-2',
    name: 'LETO-Optical-2',
    type: 'circular',
    altitudeKm: 500,
    inclinationDeg: 97.2,
    raanDeg: 60,
    meanAnomalyDeg: 90
  },
  {
    id: 'sat-leto-radar-1',
    name: 'LETO-Radar-1',
    type: 'circular',
    altitudeKm: 620,
    inclinationDeg: 98,
    raanDeg: 120,
    meanAnomalyDeg: 220
  },
  {
    id: 'sat-leto-radar-2',
    name: 'LETO-Radar-2',
    type: 'circular',
    altitudeKm: 700,
    inclinationDeg: 98.5,
    raanDeg: 150,
    meanAnomalyDeg: 300
  },
];

export const availableStations: GroundStation[] = [
  { id: 'station-canberra', name: 'Canberra', lat: -35.3, lon: 149.1, maskDeg: 10 },
  { id: 'station-alice-springs', name: 'Alice Springs', lat: -23.7, lon: 133.9, maskDeg: 10 },
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

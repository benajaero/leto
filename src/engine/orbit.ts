import * as satellite from 'satellite.js';
import { DEG2RAD, EARTH_RADIUS_KM, MU_EARTH, RAD2DEG } from './constants';
import type { GroundStation, SatelliteCircular, SatelliteTle } from './types';

export type PropagatedPoint = {
  lat: number;
  lon: number;
  altKm: number;
  eci?: { x: number; y: number; z: number };
  ecf?: { x: number; y: number; z: number };
};

export function parseTleSatrec(tle: SatelliteTle): satellite.SatRec {
  return satellite.twoline2satrec(tle.line1, tle.line2);
}

export function tleEpochUtc(satrec: satellite.SatRec): string {
  const year = satrec.epochyr < 57 ? 2000 + satrec.epochyr : 1900 + satrec.epochyr;
  const dayOfYear = satrec.epochdays;
  const epoch = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  epoch.setUTCDate(epoch.getUTCDate() + Math.floor(dayOfYear) - 1);
  const dayFraction = dayOfYear - Math.floor(dayOfYear);
  epoch.setUTCHours(epoch.getUTCHours() + dayFraction * 24);
  return epoch.toISOString();
}

export function propagateTle(
  satrec: satellite.SatRec,
  time: Date
): PropagatedPoint | null {
  const positionAndVelocity = satellite.propagate(satrec, time);
  if (!positionAndVelocity.position) {
    return null;
  }
  const gmst = satellite.gstime(time);
  const geodetic = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
  const ecf = satellite.eciToEcf(positionAndVelocity.position, gmst);
  return {
    lat: geodetic.latitude * RAD2DEG,
    lon: geodetic.longitude * RAD2DEG,
    altKm: geodetic.height,
    eci: {
      x: positionAndVelocity.position.x,
      y: positionAndVelocity.position.y,
      z: positionAndVelocity.position.z
    },
    ecf: { x: ecf.x, y: ecf.y, z: ecf.z }
  };
}

export function propagateCircularOrbit(
  orbit: SatelliteCircular,
  epoch: Date,
  time: Date
): PropagatedPoint {
  const a = EARTH_RADIUS_KM + orbit.altitudeKm;
  const n = Math.sqrt(MU_EARTH / (a * a * a));
  const dt = (time.getTime() - epoch.getTime()) / 1000;
  const m0 = orbit.meanAnomalyDeg * DEG2RAD;
  const M = m0 + n * dt;
  const cosM = Math.cos(M);
  const sinM = Math.sin(M);
  const r = a;
  const xP = r * cosM;
  const yP = r * sinM;
  const raan = orbit.raanDeg * DEG2RAD;
  const inc = orbit.inclinationDeg * DEG2RAD;
  const cosR = Math.cos(raan);
  const sinR = Math.sin(raan);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  const x = cosR * xP - sinR * cosI * yP;
  const y = sinR * xP + cosR * cosI * yP;
  const z = sinI * yP;

  const gmst = satellite.gstime(time);
  const ecf = satellite.eciToEcf({ x, y, z }, gmst);
  const geodetic = satellite.eciToGeodetic({ x, y, z }, gmst);
  return {
    lat: geodetic.latitude * RAD2DEG,
    lon: geodetic.longitude * RAD2DEG,
    altKm: geodetic.height,
    eci: { x, y, z },
    ecf: { x: ecf.x, y: ecf.y, z: ecf.z }
  };
}

export function elevationDeg(station: GroundStation, ecf: { x: number; y: number; z: number }, time: Date): number {
  const observerGd = {
    longitude: station.lon * DEG2RAD,
    latitude: station.lat * DEG2RAD,
    height: 0
  };
  const gmst = satellite.gstime(time);
  const look = satellite.ecfToLookAngles(observerGd, ecf, gmst);
  return look.elevation * RAD2DEG;
}

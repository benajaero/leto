import { DEG2RAD, EARTH_RADIUS_KM, RAD2DEG } from './constants';
import type { AOIRect, LatLon } from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = (b.lat - a.lat) * DEG2RAD;
  const dLon = (b.lon - a.lon) * DEG2RAD;
  const lat1 = a.lat * DEG2RAD;
  const lat2 = b.lat * DEG2RAD;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

export function closestPointOnRect(point: LatLon, rect: AOIRect): LatLon {
  return {
    lat: clamp(point.lat, rect.latMin, rect.latMax),
    lon: clamp(point.lon, rect.lonMin, rect.lonMax)
  };
}

export function rectContains(point: LatLon, rect: AOIRect): boolean {
  return (
    point.lat >= rect.latMin &&
    point.lat <= rect.latMax &&
    point.lon >= rect.lonMin &&
    point.lon <= rect.lonMax
  );
}

export function footprintRadiusKm(altKm: number, halfAngleDeg: number): number {
  const theta = halfAngleDeg * DEG2RAD;
  const ratio = (EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altKm)) * Math.cos(theta);
  const clamped = clamp(ratio, -1, 1);
  const psi = Math.acos(clamped);
  return EARTH_RADIUS_KM * psi;
}

export function bearingDeg(from: LatLon, to: LatLon): number {
  const lat1 = from.lat * DEG2RAD;
  const lat2 = to.lat * DEG2RAD;
  const dLon = (to.lon - from.lon) * DEG2RAD;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * RAD2DEG;
  return (brng + 360) % 360;
}

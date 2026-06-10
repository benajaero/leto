import type { Incident } from '@/lib/engine/types';
import { loadCache, loadStaleCache, saveCache, isOffline } from '@/lib/data/cache';

const CACHE_KEY = 'leto_usgs_cache';

function parseQuakes(geojson: any, ingestedUtc: string): Incident[] {
  if (!geojson?.features) return [];
  return geojson.features
    .map((f: any) => {
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) return null;
      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      const mag = Number(f.properties?.mag);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(mag)) return null;
      const time = new Date(f.properties?.time).toISOString();
      const place = f.properties?.place || 'Unknown';
      return {
        id: `usgs-${f.id}`,
        source: 'USGS' as const,
        type: 'Earthquake',
        hazardType: 'earthquake',
        severity: Math.round(mag * 10),
        confidence: Math.min(100, Math.round(mag * 15)),
        lat,
        lon,
        observedUtc: time,
        ingestedUtc,
        label: `M${mag.toFixed(1)} ${place}`,
      } as Incident;
    })
    .filter(Boolean) as Incident[];
}

export async function fetchUsgs(): Promise<{
  incidents: Incident[];
  fetchedUtc: string;
  fromCache: boolean;
  sourceUrl: string;
  offline: boolean;
}> {
  const offline = isOffline();
  const cache = loadCache<Incident[]>(CACHE_KEY, 15);

  if (offline) {
    const stale = cache ?? loadStaleCache<Incident[]>(CACHE_KEY);
    const incidents = stale
      ? stale.data.map((inc) => ({ ...inc, ingestedUtc: inc.ingestedUtc ?? stale.fetchedUtc }))
      : [];
    return { incidents, fetchedUtc: stale?.fetchedUtc ?? new Date().toISOString(), fromCache: true, sourceUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', offline: true };
  }

  if (cache) {
    const incidents = cache.data.map((inc) => ({ ...inc, ingestedUtc: inc.ingestedUtc ?? cache.fetchedUtc }));
    return { incidents, fetchedUtc: cache.fetchedUtc, fromCache: true, sourceUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', offline: false };
  }

  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
    const json = await res.json();
    const nowUtc = new Date().toISOString();
    const incidents = parseQuakes(json, nowUtc);
    const saved = saveCache(CACHE_KEY, incidents, 15);
    const withIngested = incidents.map((inc) => ({ ...inc, ingestedUtc: saved.fetchedUtc }));
    return { incidents: withIngested, fetchedUtc: saved.fetchedUtc, fromCache: false, sourceUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', offline: false };
  } catch {
    const stale = loadStaleCache<Incident[]>(CACHE_KEY);
    const incidents = stale
      ? stale.data.map((inc) => ({ ...inc, ingestedUtc: inc.ingestedUtc ?? stale.fetchedUtc }))
      : [];
    return { incidents, fetchedUtc: stale?.fetchedUtc ?? new Date().toISOString(), fromCache: true, sourceUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', offline: false };
  }
}

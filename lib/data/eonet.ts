import type { Incident } from '@/lib/engine/types';
import { loadCache, loadStaleCache, saveCache, isOffline } from '@/lib/data/cache';

const CACHE_KEY = 'leto_eonet_cache';

function parseEvents(geojson: any, ingestedUtc: string): Incident[] {
  if (!geojson?.features) return [];
  return geojson.features
    .map((f: any, i: number) => {
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) return null;
      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const date = f.properties?.date?.trim() || new Date().toISOString();
      const type = (f.properties?.categories?.[0]?.title || 'Event').toString();
      const title = f.properties?.title || `Event ${i}`;
      const severity = f.properties?.magnitude?.value ?? undefined;
      return {
        id: `eonet-${f.id || i}`,
        source: 'EONET' as const,
        type,
        hazardType: type.toLowerCase(),
        severity: severity !== undefined ? Math.round(severity * 10) : undefined,
        lat,
        lon,
        observedUtc: date,
        ingestedUtc,
        label: title,
      } as Incident;
    })
    .filter(Boolean) as Incident[];
}

export async function fetchEonet(): Promise<{
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
    return { incidents, fetchedUtc: stale?.fetchedUtc ?? new Date().toISOString(), fromCache: true, sourceUrl: 'https://eonet.gsfc.nasa.gov/api/v3/events', offline: true };
  }

  if (cache) {
    const incidents = cache.data.map((inc) => ({ ...inc, ingestedUtc: inc.ingestedUtc ?? cache.fetchedUtc }));
    return { incidents, fetchedUtc: cache.fetchedUtc, fromCache: true, sourceUrl: 'https://eonet.gsfc.nasa.gov/api/v3/events', offline: false };
  }

  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50');
    if (!res.ok) throw new Error(`EONET HTTP ${res.status}`);
    const json = await res.json();
    const nowUtc = new Date().toISOString();
    const incidents = parseEvents(json, nowUtc);
    const saved = saveCache(CACHE_KEY, incidents, 15);
    const withIngested = incidents.map((inc) => ({ ...inc, ingestedUtc: saved.fetchedUtc }));
    return { incidents: withIngested, fetchedUtc: saved.fetchedUtc, fromCache: false, sourceUrl: 'https://eonet.gsfc.nasa.gov/api/v3/events', offline: false };
  } catch {
    const stale = loadStaleCache<Incident[]>(CACHE_KEY);
    const incidents = stale
      ? stale.data.map((inc) => ({ ...inc, ingestedUtc: inc.ingestedUtc ?? stale.fetchedUtc }))
      : [];
    return { incidents, fetchedUtc: stale?.fetchedUtc ?? new Date().toISOString(), fromCache: true, sourceUrl: 'https://eonet.gsfc.nasa.gov/api/v3/events', offline: false };
  }
}

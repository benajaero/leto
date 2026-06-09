import type { Incident } from '@/lib/engine/types';
import { loadCache, loadStaleCache, saveCache, isOffline } from '@/lib/data/cache';

const CACHE_KEY = 'leto_firms_cache';
const SAMPLE_URL = '/sample/firms.csv';

function parseCsv(text: string, ingestedUtc: string): Incident[] {
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift();
  if (!header) return [];
  const fields = header.split(',');
  const idx = (name: string) => fields.indexOf(name);
  return lines
    .map((line, i) => {
      const parts = line.split(',');
      const lat = Number(parts[idx('latitude')]);
      const lon = Number(parts[idx('longitude')]);
      const date = parts[idx('acq_date')];
      const time = parts[idx('acq_time')].padStart(4, '0');
      const confidence = Number(parts[idx('confidence')]);
      const observedUtc = `${date}T${time.slice(0, 2)}:${time.slice(2)}:00Z`;
      return {
        id: `firms-${i}-${lat}-${lon}`,
        source: 'FIRMS',
        type: 'Fire',
        hazardType: 'fire',
        confidence,
        lat,
        lon,
        observedUtc,
        ingestedUtc,
        label: `Fire ${confidence}`
      } as Incident;
    })
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
}

export async function fetchFirms(
  bounds?: { latMin: number; latMax: number; lonMin: number; lonMax: number }
): Promise<{ incidents: Incident[]; fetchedUtc: string; fromCache: boolean; sourceUrl: string; offline: boolean }> {
  const offline = isOffline();
  const cache = loadCache<Incident[]>(CACHE_KEY, 30);

  if (offline) {
    const stale = cache ?? loadStaleCache<Incident[]>(CACHE_KEY);
    const incidents = stale
      ? stale.data.map((incident) => ({ ...incident, ingestedUtc: incident.ingestedUtc ?? stale.fetchedUtc }))
      : [];
    return {
      incidents,
      fetchedUtc: stale?.fetchedUtc ?? new Date().toISOString(),
      fromCache: true,
      sourceUrl: SAMPLE_URL,
      offline: true
    };
  }

  if (cache) {
    const incidents = cache.data.map((incident) => ({ ...incident, ingestedUtc: incident.ingestedUtc ?? cache.fetchedUtc }));
    return { incidents, fetchedUtc: cache.fetchedUtc, fromCache: true, sourceUrl: SAMPLE_URL, offline: false };
  }

  const apiKey = (import.meta as any).env?.VITE_FIRMS_API_KEY as string | undefined;
  let url = SAMPLE_URL;
  if (apiKey && bounds) {
    const { latMin, latMax, lonMin, lonMax } = bounds;
    url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${lonMin},${latMin},${lonMax},${latMax}/1`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const stale = loadStaleCache<Incident[]>(CACHE_KEY);
      const incidents = stale
        ? stale.data.map((incident) => ({ ...incident, ingestedUtc: incident.ingestedUtc ?? stale.fetchedUtc }))
        : [];
      return {
        incidents,
        fetchedUtc: stale?.fetchedUtc ?? new Date().toISOString(),
        fromCache: true,
        sourceUrl: url,
        offline: false
      };
    }
    const text = await response.text();
    const nowUtc = new Date().toISOString();
    const incidents = parseCsv(text, nowUtc);
    const saved = saveCache(CACHE_KEY, incidents, 30);
    const withIngested = incidents.map((incident) => ({ ...incident, ingestedUtc: saved.fetchedUtc }));
    return { incidents: withIngested, fetchedUtc: saved.fetchedUtc, fromCache: false, sourceUrl: url, offline: false };
  } catch {
    const stale = loadStaleCache<Incident[]>(CACHE_KEY);
    const incidents = stale
      ? stale.data.map((incident) => ({ ...incident, ingestedUtc: incident.ingestedUtc ?? stale.fetchedUtc }))
      : [];
    return {
      incidents,
      fetchedUtc: stale?.fetchedUtc ?? new Date().toISOString(),
      fromCache: true,
      sourceUrl: url,
      offline: false
    };
  }
}

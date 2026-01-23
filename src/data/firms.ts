import type { Incident } from '../engine/types';
import { loadCache, saveCache } from './cache';

const CACHE_KEY = 'leto_firms_cache';
const SAMPLE_URL = '/sample/firms.csv';

function parseCsv(text: string): Incident[] {
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
        confidence,
        lat,
        lon,
        observedUtc,
        label: `Fire ${confidence}`
      } as Incident;
    })
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
}

export async function fetchFirms(bounds?: { latMin: number; latMax: number; lonMin: number; lonMax: number }): Promise<{ incidents: Incident[]; fetchedUtc: string; fromCache: boolean; sourceUrl: string }>{
  const cache = loadCache<Incident[]>(CACHE_KEY);
  if (cache) {
    return { incidents: cache.data, fetchedUtc: cache.fetchedUtc, fromCache: true, sourceUrl: SAMPLE_URL };
  }

  const apiKey = import.meta.env.VITE_FIRMS_API_KEY as string | undefined;
  let url = SAMPLE_URL;
  if (apiKey && bounds) {
    const { latMin, latMax, lonMin, lonMax } = bounds;
    url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${lonMin},${latMin},${lonMax},${latMax}/1`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const cached = cache ? cache.data : [];
    return { incidents: cached, fetchedUtc: cache?.fetchedUtc ?? new Date().toISOString(), fromCache: true, sourceUrl: url };
  }
  const text = await response.text();
  const incidents = parseCsv(text);
  const saved = saveCache(CACHE_KEY, incidents);
  return { incidents, fetchedUtc: saved.fetchedUtc, fromCache: false, sourceUrl: url };
}

import type { Incident } from '../engine/types';
import { loadCache, saveCache } from './cache';

const CACHE_KEY = 'leto_gdacs_cache';
const SAMPLE_URL = '/sample/gdacs.xml';
const LIVE_URL = 'https://www.gdacs.org/xml/rss.xml';

function parseXml(xmlText: string, ingestedUtc: string): Incident[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const items = Array.from(doc.getElementsByTagName('item'));
  return items
    .map((item) => {
      const guid = item.getElementsByTagName('guid')[0]?.textContent ?? `gdacs-${Math.random()}`;
      const title = item.getElementsByTagName('title')[0]?.textContent ?? 'GDACS Event';
      const hazard = item.getElementsByTagName('gdacs:hazard')[0]?.textContent ?? 'Unknown';
      const severityText = item.getElementsByTagName('gdacs:severity')[0]?.textContent ?? '0';
      const point = item.getElementsByTagName('georss:point')[0]?.textContent ?? '';
      const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent ?? new Date().toUTCString();
      const [latStr, lonStr] = point.split(' ');
      const lat = Number(latStr);
      const lon = Number(lonStr);
      return {
        id: guid,
        source: 'GDACS',
        type: hazard,
        hazardType: hazard.toLowerCase(),
        severity: Number(severityText),
        lat,
        lon,
        observedUtc: new Date(pubDate).toISOString(),
        ingestedUtc,
        label: title
      } as Incident;
    })
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
}

export async function fetchGdacs(): Promise<{ incidents: Incident[]; fetchedUtc: string; fromCache: boolean; sourceUrl: string }>{
  const cache = loadCache<Incident[]>(CACHE_KEY);
  if (cache) {
    const incidents = cache.data.map((incident) => ({ ...incident, ingestedUtc: incident.ingestedUtc ?? cache.fetchedUtc }));
    return { incidents, fetchedUtc: cache.fetchedUtc, fromCache: true, sourceUrl: SAMPLE_URL };
  }
  let url = LIVE_URL;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('GDACS fetch failed');
    }
    const xmlText = await response.text();
    const nowUtc = new Date().toISOString();
    const incidents = parseXml(xmlText, nowUtc);
    const saved = saveCache(CACHE_KEY, incidents);
    const withIngested = incidents.map((incident) => ({ ...incident, ingestedUtc: saved.fetchedUtc }));
    return { incidents: withIngested, fetchedUtc: saved.fetchedUtc, fromCache: false, sourceUrl: url };
  } catch {
    const response = await fetch(SAMPLE_URL);
    const xmlText = await response.text();
    const nowUtc = new Date().toISOString();
    const incidents = parseXml(xmlText, nowUtc);
    const saved = saveCache(CACHE_KEY, incidents);
    const withIngested = incidents.map((incident) => ({ ...incident, ingestedUtc: saved.fetchedUtc }));
    return { incidents: withIngested, fetchedUtc: saved.fetchedUtc, fromCache: false, sourceUrl: SAMPLE_URL };
  }
}

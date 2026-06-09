export type Cached<T> = {
  fetchedUtc: string;
  data: T;
  ttlMinutes?: number;
};

export function loadCache<T>(key: string, ttlMinutes = 60): Cached<T> | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Cached<T>;
    const ageMinutes = (Date.now() - new Date(parsed.fetchedUtc).getTime()) / 60000;
    const effectiveTtl = parsed.ttlMinutes ?? ttlMinutes;
    if (ageMinutes > effectiveTtl) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadStaleCache<T>(key: string): Cached<T> | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Cached<T>;
  } catch {
    return null;
  }
}

export function saveCache<T>(key: string, data: T, ttlMinutes = 60): Cached<T> {
  const cached = { fetchedUtc: new Date().toISOString(), data, ttlMinutes } as Cached<T>;
  localStorage.setItem(key, JSON.stringify(cached));
  return cached;
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

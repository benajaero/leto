export type Cached<T> = {
  fetchedUtc: string;
  data: T;
};

export function loadCache<T>(key: string): Cached<T> | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Cached<T>;
  } catch {
    return null;
  }
}

export function saveCache<T>(key: string, data: T): Cached<T> {
  const cached = { fetchedUtc: new Date().toISOString(), data } as Cached<T>;
  localStorage.setItem(key, JSON.stringify(cached));
  return cached;
}

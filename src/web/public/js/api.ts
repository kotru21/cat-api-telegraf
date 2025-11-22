import { Cat, LeaderboardEntry, UserProfile } from './types.js';

// Centralized API helper functions for frontend
// Lightweight fetch wrapper with JSON + error handling

interface CacheEntry<T> {
  ts: number;
  ttl: number;
  data: T;
}

const API_CACHE = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 15_000;

function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL) {
  API_CACHE.set(key, { ts: Date.now(), ttl, data });
}

function getCache<T>(key: string): T | null {
  const entry = API_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    API_CACHE.delete(key);
    return null;
  }
  return entry.data as T;
}

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  cache?: boolean;
  ttl?: number;
  credentials?: RequestCredentials;
}

export async function fetchJSON<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    cache = false,
    ttl,
    credentials = 'include',
  } = options;

  const cacheKey = cache ? `${method}:${path}:${body ? JSON.stringify(body) : ''}` : null;
  if (cache && cacheKey) {
    const cached = getCache<T>(cacheKey);
    if (cached) return cached;
  }

  const init: RequestInit = {
    method,
    headers: { Accept: 'application/json', ...headers },
    credentials,
  };
  if (body) {
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(path, init);
  } catch (networkError) {
    const msg = networkError instanceof Error ? networkError.message : String(networkError);
    throw new Error(`NETWORK_ERROR:${msg}`);
  }

  if (!response.ok) {
    let errPayload = null;
    try {
      errPayload = await response.json();
    } catch {
      // ignore
    }
    const msg = errPayload?.error || errPayload?.message || `HTTP ${response.status}`;
    const error = new Error(msg) as Error & { status: number; payload: unknown };
    error.status = response.status;
    error.payload = errPayload;
    throw error;
  }

  if (response.status === 204) return null as T;

  let data: T;
  try {
    data = await response.json();
  } catch (parseError) {
    const msg = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`INVALID_JSON_RESPONSE:${msg}`);
  }

  if (cache && cacheKey) setCache(cacheKey, data, ttl ?? DEFAULT_TTL);
  return data;
}

// Domain specific helpers
export const getLeaderboard = () =>
  fetchJSON<LeaderboardEntry[]>('/api/leaderboard', { cache: true });
export const getRandomImages = (count = 3) =>
  fetchJSON<Cat[]>(`/api/random-images?count=${count}`, { cache: false });
export const getProfile = () => fetchJSON<UserProfile>('/api/profile', { cache: false });
export const getUserLikes = () => fetchJSON<Cat[]>('/api/mylikes', { cache: false });
export const getUserLikesCount = () =>
  fetchJSON<{ count: number }>('/api/user/likes/count', { cache: false });
export const addLike = (catId: string) =>
  fetchJSON<{ success: boolean }>('/api/like', { method: 'POST', body: { catId } });
export const deleteLike = (catId: string) =>
  fetchJSON<void>('/api/like', { method: 'DELETE', body: { catId } });
export const getCatDetails = (id: string) =>
  fetchJSON<Cat>(`/api/cat/${encodeURIComponent(id)}`, { cache: true, ttl: 60_000 });
export const getSimilarCats = (feature: string, value: string) =>
  fetchJSON(
    `/api/similar?feature=${encodeURIComponent(feature)}&value=${encodeURIComponent(value)}`,
    { cache: false },
  );

// Generic ws builder (not yet used directly here)
export function buildWsUrl(path = '/wss') {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}${path}`;
}

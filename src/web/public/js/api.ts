// Centralized API helper functions for frontend
// Lightweight fetch wrapper with JSON + error handling

const API_CACHE = new Map<string, { ts: number; ttl: number; data: any }>(); // key -> { ts, ttl, data }
const DEFAULT_TTL = 15_000; // 15s cache for relatively static endpoints like leaderboard

function setCache(key: string, data: any, ttl = DEFAULT_TTL) {
  API_CACHE.set(key, { ts: Date.now(), ttl, data });
}

function getCache(key: string) {
  const entry = API_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    API_CACHE.delete(key);
    return null;
  }
  return entry.data;
}

export async function fetchJSON(
  path: string,
  {
    method = "GET",
    headers = {},
    body,
    cache = false,
    ttl,
    credentials = "include",
  }: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    cache?: boolean;
    ttl?: number;
    credentials?: RequestCredentials;
  } = {}
) {
  const cacheKey = cache
    ? `${method}:${path}:${body ? JSON.stringify(body) : ""}`
    : null;
  if (cache && cacheKey) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  const init: RequestInit = {
    method,
    headers: { Accept: "application/json", ...headers },
    credentials,
  };
  if (body) {
    // @ts-ignore
    init.headers["Content-Type"] = "application/json";
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(path, init);
  } catch (networkError: any) {
    throw new Error(`NETWORK_ERROR:${networkError.message}`);
  }

  if (!response.ok) {
    // Attempt to parse error JSON
    let errPayload = null;
    try {
      errPayload = await response.json();
    } catch (_) {}
    const msg =
      errPayload?.error || errPayload?.message || `HTTP ${response.status}`;
    const error: any = new Error(msg);
    error.status = response.status;
    error.payload = errPayload;
    throw error;
  }

  // Empty 204
  if (response.status === 204) return null;

  let data;
  try {
    data = await response.json();
  } catch (parseError: any) {
    throw new Error(`INVALID_JSON_RESPONSE:${parseError.message}`);
  }

  if (cache && cacheKey) setCache(cacheKey, data, ttl ?? DEFAULT_TTL);
  return data;
}

// Domain specific helpers
export const getLeaderboard = () =>
  fetchJSON("/api/leaderboard", { cache: true });
export const getRandomImages = (count = 3) =>
  fetchJSON(`/api/random-images?count=${count}`, { cache: false });
export const getProfile = () => fetchJSON("/api/profile", { cache: false });
export const getUserLikes = () => fetchJSON("/api/mylikes", { cache: false });
export const getUserLikesCount = () =>
  fetchJSON("/api/user/likes/count", { cache: false });
export const deleteLike = (catId: string) =>
  fetchJSON("/api/like", { method: "DELETE", body: { catId } });
export const getCatDetails = (id: string) =>
  fetchJSON(`/api/cat/${encodeURIComponent(id)}`, { cache: true, ttl: 60_000 });
export const getSimilarCats = (feature: string, value: string) =>
  fetchJSON(
    `/api/similar?feature=${encodeURIComponent(
      feature
    )}&value=${encodeURIComponent(value)}`,
    { cache: false }
  );

// Generic ws builder (not yet used directly here)
export function buildWsUrl(path = "/wss") {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${path}`;
}

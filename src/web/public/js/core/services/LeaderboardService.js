import { getLeaderboard } from "/js/api.js";
import store, { setState, emit, getState } from "/js/core/state/store.js";

// Normalizer to keep UI decoupled from backend shape
export function normalizeRow(row, index = 0) {
  // Canonical shape. Backend returns msg rows: { id, breed_name, count, image_url }
  return {
    position: row.rank != null ? row.rank : index + 1,
    catId: row.id,
    breedName: row.breed_name || "Unknown Breed",
    likes:
      row.likes != null ? row.likes : row.count != null ? row.count : undefined,
    change: 0,
    imageUrl: row.image_url || "",
  };
}

let lastLoadTs = 0;
const CACHE_TTL = 15_000; // ms same as API default

export async function loadLeaderboard({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastLoadTs < CACHE_TTL && getState().leaderboard.length) {
    return getState().leaderboard;
  }
  emit("leaderboard:loading");
  setState({ loading: { leaderboard: true }, errors: { leaderboard: null } });
  try {
    const raw = await getLeaderboard();
    const data = Array.isArray(raw)
      ? raw.map((r, i) => normalizeRow(r, i))
      : [];
    lastLoadTs = Date.now();
    setState({ leaderboard: data, loading: { leaderboard: false } });
    emit("leaderboard:loaded", data);
    return data;
  } catch (err) {
    console.error("Leaderboard load failed", err);
    setState({ loading: { leaderboard: false }, errors: { leaderboard: err } });
    emit("leaderboard:error", err);
    throw err;
  }
}

export default { loadLeaderboard };

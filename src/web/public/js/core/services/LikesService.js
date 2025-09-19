import { getUserLikes, getUserLikesCount, deleteLike } from "/js/api.js";
import store, { setState, emit, getState } from "/js/core/state/store.js";

export function normalizeLike(row) {
  return {
    catId: row.cat_id || row.id || row.catId,
    breedName: row.breed_name || "Unknown",
    imageUrl: row.image_url || row.imageUrl || "",
    likes: row.likes_count || row.count || 0,
  };
}

let lastLikesTs = 0;
const LIKES_TTL = 10_000;

export async function loadLikes({ force = false } = {}) {
  const now = Date.now();
  const st = getState();
  if (!force && now - lastLikesTs < LIKES_TTL && st.likes.length)
    return st.likes;
  emit("likes:loading");
  setState({ loading: { likes: true }, errors: { likes: null } });
  try {
    const raw = await getUserLikes();
    const data = Array.isArray(raw) ? raw.map(normalizeLike) : [];
    lastLikesTs = Date.now();
    setState({ likes: data, loading: { likes: false } });
    emit("likes:updated", data);
    // refresh count
    try {
      const { count } = await getUserLikesCount();
      setState({ likesCount: count });
      emit("likes:count", count);
    } catch (_) {}
    return data;
  } catch (err) {
    console.error("Load likes failed", err);
    setState({ loading: { likes: false }, errors: { likes: err } });
    emit("likes:error", err);
    throw err;
  }
}

export async function removeLike(catId) {
  const prev = getState().likes;
  const next = prev.filter((l) => String(l.catId) !== String(catId));
  setState({ likes: next, likesCount: Math.max(0, getState().likesCount - 1) });
  emit("like:removed", { catId });
  try {
    await deleteLike(catId);
    emit("likes:updated", getState().likes);
  } catch (err) {
    console.error("Remove like failed, rolling back", err);
    setState({ likes: prev, likesCount: prev.length });
    emit("likes:error", err);
    throw err;
  }
}

export default { loadLikes, removeLike };

// Lightweight pub-sub store with event bus
// Usage:
// import store from '/js/core/state/store.js'
// store.subscribe(s => s.leaderboard, data => { ... })
// store.emit('leaderboard:loading')

const listeners = new Set(); // selector-based subscribers
const eventMap = new Map(); // eventName -> Set(handlers)

const state = {
  leaderboard: [],
  likes: [],
  profile: null,
  likesCount: 0,
  loading: { leaderboard: false, likes: false, profile: false },
  errors: { leaderboard: null, likes: null, profile: null },
  meta: {},
};

function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.is(a[k], b[k])) return false;
  return true;
}

export function getState() {
  return state;
}

export function setState(patch) {
  const prev = { ...state };
  Object.entries(patch).forEach(([k, v]) => {
    if (v && typeof v === "object" && !Array.isArray(v) && state[k]) {
      state[k] = { ...state[k], ...v };
    } else {
      state[k] = v;
    }
  });
  // notify listeners whose selector result changed
  listeners.forEach((entry) => {
    try {
      const nextSel = entry.selector(state);
      if (!shallowEqual(entry.lastValue, nextSel)) {
        entry.lastValue = Array.isArray(nextSel)
          ? [...nextSel]
          : nextSel && typeof nextSel === "object"
          ? { ...nextSel }
          : nextSel;
        entry.cb(nextSel, prev);
      }
    } catch (e) {
      console.error("Store subscriber error", e);
    }
  });
}

export function subscribe(selector, cb) {
  const entry = { selector, cb, lastValue: selector(state) };
  listeners.add(entry);
  return () => listeners.delete(entry);
}

export function on(eventName, handler) {
  if (!eventMap.has(eventName)) eventMap.set(eventName, new Set());
  eventMap.get(eventName).add(handler);
  return () => off(eventName, handler);
}

export function off(eventName, handler) {
  const set = eventMap.get(eventName);
  if (set) set.delete(handler);
}

export function emit(eventName, payload) {
  const set = eventMap.get(eventName);
  if (set) {
    set.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        console.error("Event handler error", e);
      }
    });
  }
}

const store = { getState, setState, subscribe, on, off, emit };
export default store;

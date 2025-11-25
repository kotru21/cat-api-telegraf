// Lightweight pub-sub store with event bus
// Usage:
// import store from '/js/core/state/store.js'
// store.subscribe(s => s.leaderboard, data => { ... })
// store.emit('leaderboard:loading')

/* eslint-disable @typescript-eslint/no-explicit-any -- frontend store is intentionally loosely typed */

export interface AppState {
  leaderboard: unknown[];
  likes: unknown[];
  profile: unknown | null;
  likesCount: number;
  loading: {
    leaderboard?: boolean;
    likes?: boolean;
    profile?: boolean;
    catDetails?: boolean;
  };
  errors: {
    leaderboard?: unknown | null;
    likes?: unknown | null;
    profile?: unknown | null;
    catDetails?: unknown | null;
  };
  meta: Record<string, unknown>;
  catDetails?: unknown | null;
  [key: string]: unknown; // Allow dynamic keys for now to fix TS7053
}

type Selector<T> = (state: AppState) => T;
type SubscriberCallback<T> = (newValue: T, prevState: AppState) => void;

interface ListenerEntry<T> {
  selector: Selector<T>;
  cb: SubscriberCallback<T>;
  lastValue: T;
}

type EventHandler = (payload?: unknown) => void;

const listeners = new Set<ListenerEntry<unknown>>(); // selector-based subscribers
const eventMap = new Map<string, Set<EventHandler>>(); // eventName -> Set(handlers)

const state: AppState = {
  leaderboard: [],
  likes: [],
  profile: null,
  likesCount: 0,
  loading: { leaderboard: false, likes: false, profile: false },
  errors: { leaderboard: null, likes: null, profile: null },
  meta: {},
};

function shallowEqual(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.is(a[k], b[k])) return false;
  return true;
}

export function getState() {
  return state;
}

export function setState(patch: Partial<AppState>) {
  const prev = { ...state };
  Object.entries(patch).forEach(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && state[k]) {
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
          : nextSel && typeof nextSel === 'object'
            ? { ...nextSel }
            : nextSel;
        entry.cb(nextSel, prev);
      }
    } catch (e) {
      console.error('Store subscriber error', e);
    }
  });
}

export function subscribe<T>(selector: Selector<T>, cb: SubscriberCallback<T>) {
  const entry = { selector, cb, lastValue: selector(state) } as ListenerEntry<unknown>;
  listeners.add(entry);
  return () => listeners.delete(entry);
}

export function on(eventName: string, handler: EventHandler) {
  if (!eventMap.has(eventName)) eventMap.set(eventName, new Set());
  eventMap.get(eventName)!.add(handler);
  return () => off(eventName, handler);
}

export function off(eventName: string, handler: EventHandler) {
  const set = eventMap.get(eventName);
  if (set) set.delete(handler);
}

export function emit(eventName: string, payload?: any) {
  const set = eventMap.get(eventName);
  if (set) {
    set.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        console.error('Event handler error', e);
      }
    });
  }
}

const store = { getState, setState, subscribe, on, off, emit };
export default store;

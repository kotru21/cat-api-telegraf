import { describe, it, expect } from 'bun:test';
import store, { subscribe } from '../../src/web/public/js/core/state/store.ts';
import type { AppState } from '../../src/web/public/js/core/state/store.ts';

describe('store basic', () => {
  it('updates state and notifies subscriber when selected slice changes', () => {
    const events: Array<AppState['meta']> = [];
    const unsub = subscribe(
      (s) => s.meta,
      (val) => {
        events.push(val);
      },
    );
    store.setState({ meta: { version: 2 } });
    unsub();
    expect(events.some((v) => v && v.version === 2)).toBe(true);
  });

  it('does not notify if slice unchanged', () => {
    let count = 0;
    const unsub = subscribe(
      (s) => s.meta,
      () => {
        count++;
      },
    );
    store.setState({ leaderboard: [] }); // meta не меняется
    unsub();
    expect(count).toBe(0);
  });
});

// Lifecycle registry for future SPA-like navigation or dynamic re-init
// registerCleanup(fn) -> stores cleanup callbacks (event listeners unsub, intervals, etc.)
// runCleanups() -> executes & clears all registered callbacks

const cleanups = new Set<Function>();

export function registerCleanup(fn: Function) {
  if (typeof fn !== "function") return () => {};
  cleanups.add(fn);
  return () => cleanups.delete(fn);
}

export function runCleanups() {
  for (const fn of Array.from(cleanups)) {
    try {
      fn();
    } catch (e) {
      console.error("Cleanup error", e);
    }
    cleanups.delete(fn);
  }
}

export default { registerCleanup, runCleanups };

/**
 * @template T
 * @typedef {{ get(): T; set(partial: Partial<T>): void; subscribe(fn: () => void): () => void }} Store
 */

/**
 * Create a reactive store with get/set/subscribe.
 * @template T
 * @param {T} initial - Initial state value.
 * @returns {Store<T>} The store instance.
 */
export function createStore(initial) {
  /** @type {T} */
  let state = { ...initial };
  /** @type {Set<() => void>} */
  const listeners = new Set();

  return {
    /** @returns {T} */
    get() {
      return state;
    },

    /**
     * Merge a partial update into the current state and notify subscribers.
     * @param {Partial<T>} partial
     */
    set(partial) {
      state = { ...state, ...partial };
      listeners.forEach(fn => { if (typeof fn === 'function') fn(); });
    },

    /**
     * Subscribe to state changes. Returns an unsubscribe function.
     * @param {() => void} fn
     * @returns {() => void}
     */
    subscribe(fn) {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
  };
}

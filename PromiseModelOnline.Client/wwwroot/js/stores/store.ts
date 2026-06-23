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
export function createStore<T>(initial: T) {
  /** @type {T} */
  let state = { ...initial };
  /** @type {Set<() => void>} */
  const listeners = new Set();

  return {
    /**
     * Get the current state.
     * @returns {T} The current state value.
     */
    get: () => state,

    /**
     * Merge a partial update into the current state and notify subscribers.
     * @param {Partial<T>} partial - The partial state update.
     */
    set(partial: Partial<T>) {
      state = { ...state, ...partial };
      for (const function_ of listeners) { if (typeof function_ === 'function') function_(); }
    },

    /**
     * Subscribe to state changes. Returns an unsubscribe function.
     * @param {() => void} function_ - The listener function.
     * @returns {() => void} The unsubscribe function.
     */
    subscribe(function_: () => void) {
      listeners.add(function_);
      return () => { listeners.delete(function_); };
    },
  };
}

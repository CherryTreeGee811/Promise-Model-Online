import { createStore } from './store.ts';

const AUTH_STORAGE_KEY = 'pmo.auth';

/**
 * @typedef {{ isAuthenticated: boolean; username: string | null; userId: number | null }} AuthState
 */

/**
 * @returns {AuthState}
 */
function loadFromStorage() {
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        isAuthenticated: !!parsed.isAuthenticated,
        username: parsed.username || null,
        userId: parsed.userId ?? null,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { isAuthenticated: false, username: null, userId: null };
}

/**
 * Persist auth state to sessionStorage.
 * @param {AuthState} state
 */
function saveToStorage(state) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures
  }
}

/** @type {import('./store.ts').Store<AuthState>} */
export const authStore = createStore(loadFromStorage());

const originalSet = authStore.set.bind(authStore);
authStore.set = (partial) => {
  originalSet(partial);
  saveToStorage(authStore.get());
};

/**
 * Check whether the user is currently authenticated.
 * @returns {boolean}
 */
export function isLoggedIn() {
  return authStore.get().isAuthenticated;
}

/**
 * Get the current user's display name.
 * @returns {string | null}
 */
export function getUsername() {
  return authStore.get().username;
}

/**
 * Get the current user's numeric ID.
 * @returns {number | null}
 */
export function getUserId() {
  return authStore.get().userId;
}

import { createStore } from './store.ts';

const AUTH_STORAGE_KEY = 'pmo.auth';

/**
 * @typedef {{ isAuthenticated: boolean; username: string | null; userId: number | null }} AuthState
 */

/**
 * @returns {AuthState} The deserialized auth state, or a default unauthenticated state.
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
 * @param {AuthState} state - The auth state to persist.
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
/**
 * Update the auth state and persist it to sessionStorage.
 * @param {Partial<AuthState>} partial - The partial state update.
 */
authStore.set = (partial) => {
  originalSet(partial);
  saveToStorage(authStore.get());
};

/**
 * Check whether the user is currently authenticated.
 * @returns {boolean} Whether the user is logged in.
 */
export function isLoggedIn() {
  return authStore.get().isAuthenticated;
}

/**
 * Get the current user's display name.
 * @returns {string | null} The username, or null if not authenticated.
 */
export function getUsername() {
  return authStore.get().username;
}

/**
 * Get the current user's numeric ID.
 * @returns {number | null} The user ID, or null if not authenticated.
 */
export function getUserId() {
  return authStore.get().userId;
}

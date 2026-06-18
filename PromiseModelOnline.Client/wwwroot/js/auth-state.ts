/**
 * @file Legacy auth-state shim that delegates to the reactive auth store.
 * All exports kept for backward compatibility. New code should import
 * directly from `stores/auth.ts` for subscription support.
 */

import { authStore } from './stores/auth.ts';

export { authStore, isLoggedIn, getUsername, getUserId } from './stores/auth.ts';

/**
 * Update authentication state and persist to session storage.
 * @param {object} state - Authentication state object.
 * @param {boolean} state.isAuthenticated - Whether the user is authenticated.
 * @param {string | null} [state.username] - The user's username.
 * @param {number | null} [state.userId] - The user's ID.
 */
export function setAuthState(state: { isAuthenticated: boolean; username?: string | null; userId?: number | null }): void {
    authStore.set({
        isAuthenticated: !!state.isAuthenticated,
        username: state.username || undefined,
        userId: state.userId ?? undefined,
    });
}

/**
 * Clear all authentication state.
 */
export function clearAuth(): void {
    authStore.set({ isAuthenticated: false, username: undefined, userId: undefined });
    authStore.set({ isAuthenticated: false, username: undefined, userId: undefined });
}

/**
 * @file Legacy auth-state shim that delegates to the reactive auth store.
 * All exports kept for backward compatibility. New code should import
 * directly from `stores/auth.ts` for subscription support.
 */

import { authStore } from './stores/auth.ts';

export { authStore, isLoggedIn, getUsername, getUserId } from './stores/auth.ts';

/**
 * Update authentication state and persist to session storage.
 * @param {{ isAuthenticated: boolean; username?: string | null; userId?: number | null }} state
 * @param state.isAuthenticated
 * @param state.username
 * @param state.userId
 */
export function setAuthState(state: { isAuthenticated: boolean; username?: string | null; userId?: number | null }): void {
    authStore.set({
        isAuthenticated: !!state.isAuthenticated,
        username: state.username || null,
        userId: state.userId ?? null,
    });
}

/**
 * Clear all authentication state.
 */
export function clearAuth(): void {
    authStore.set({ isAuthenticated: false, username: null, userId: null });
}

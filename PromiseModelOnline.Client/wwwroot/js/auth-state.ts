const AUTH_STORAGE_KEY = 'pmo.auth';

let isAuthenticated = false;
let username: string | null = null;
let userId: number | null = null;

/**
 * Restore authentication state from session storage on module load.
 * Called immediately at module init time to rehydrate auth state.
 */
function loadFromStorage(): void {
    try {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            isAuthenticated = !!parsed.isAuthenticated;
            username = parsed.username || null;
            userId = parsed.userId ?? null;
        }
    } catch {
        // Ignore storage errors
    }
}

/**
 * Persist the current authentication state to session storage.
 * Called automatically whenever auth state changes.
 */
function saveToStorage(): void {
    try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated, username, userId }));
    } catch {
        // Ignore storage failures
    }
}

/**
 * Update the authentication state and persist it.
 * @param state - The authentication state to set.
 */
export function setAuthState(state: { isAuthenticated: boolean; username?: string | null; userId?: number | null }): void {
    isAuthenticated = !!state.isAuthenticated;
    username = state.username || null;
    userId = state.userId ?? null;
    saveToStorage();
}

/**
 * Clear all authentication state and remove from storage.
 * Also removes the persisted entry from sessionStorage.
 */
export function clearAuth(): void {
    isAuthenticated = false;
    username = null;
    userId = null;
    try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
        // Ignore storage failures
    }
}

/**
 * Check whether the user is currently authenticated.
 * @returns True if the user has an active session.
 */
export function isLoggedIn(): boolean {
    return isAuthenticated;
}

/**
 * Get the current user's display name.
 * @returns The display name, or null if not authenticated.
 */
export function getUsername(): string | null {
    return username;
}

/**
 * Get the current user's numeric ID.
 * @returns The user ID, or null if not authenticated.
 */
export function getUserId(): number | null {
    return userId;
}

loadFromStorage();

const AUTH_STORAGE_KEY = 'pmo.auth';

let isAuthenticated = false;
let username = null;
let userId = null;

/** Restore authentication state from session storage on module load. */
function loadFromStorage() {
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

/** Persist the current authentication state to session storage. */
function saveToStorage() {
    try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated, username, userId }));
    } catch {
        // Ignore storage failures
    }
}

/**
 * Update the authentication state and persist it.
 * @param {object} params
 * @param {boolean} params.isAuthenticated - Whether the user is logged in.
 * @param {string|null} params.username - The user's display name.
 * @param {number|null} params.userId - The user's numeric ID.
 */
export function setAuthState({ isAuthenticated: auth, username: name, userId: id }) {
    isAuthenticated = !!auth;
    username = name || null;
    userId = id ?? null;
    saveToStorage();
}

/** Clear all authentication state and remove from storage. */
export function clearAuth() {
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
 * @returns {boolean} True if the user has an active session.
 */
export function isLoggedIn() {
    return isAuthenticated;
}

/**
 * Get the current user's display name.
 * @returns {string|null} The display name, or null if not authenticated.
 */
export function getUsername() {
    return username;
}

/**
 * Get the current user's numeric ID.
 * @returns {number|null} The user ID, or null if not authenticated.
 */
export function getUserId() {
    return userId;
}

loadFromStorage();

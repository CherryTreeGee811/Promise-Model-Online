const AUTH_STORAGE_KEY = 'pmo.auth';

let isAuthenticated = false;
let username = null;

function loadFromStorage() {
    try {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            isAuthenticated = !!parsed.isAuthenticated;
            username = parsed.username || null;
        }
    } catch {
        // Ignore storage errors
    }
}

function saveToStorage() {
    try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated, username }));
    } catch {
        // Ignore storage failures
    }
}

export function setAuthState({ isAuthenticated: auth, username: name }) {
    isAuthenticated = !!auth;
    username = name || null;
    saveToStorage();
}

export function clearAuth() {
    isAuthenticated = false;
    username = null;
    try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
        // Ignore storage failures
    }
}

export function clearTokens() {
    clearAuth();
}

export function isLoggedIn() {
    return isAuthenticated;
}

export function getUsername() {
    return username;
}

loadFromStorage();

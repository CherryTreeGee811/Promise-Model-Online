<<<<<<< HEAD
const AUTH_STORAGE_KEY = 'pmo.auth';

let isAuthenticated = false;
let username = null;
let userId = null;

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

function saveToStorage() {
    try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated, username, userId }));
    } catch {
        // Ignore storage failures
    }
}

export function setAuthState({ isAuthenticated: auth, username: name, userId: id }) {
    isAuthenticated = !!auth;
    username = name || null;
    userId = id ?? null;
    saveToStorage();
}

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

export function isLoggedIn() {
    return isAuthenticated;
}

export function getUsername() {
    return username;
}

export function getUserId() {
    return userId;
}

loadFromStorage();
||||||| 1bedf4f
=======
const ACCESS_TOKEN_STORAGE_KEY = 'pmo.accessToken';
let accessToken = null;

function readStoredAccessToken() {
    try {
        return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setTokens(access) {
    accessToken = access;

    try {
        if (access) {
            sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, access);
        } else {
            sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        }
    } catch {
        // Ignore storage failures and keep the in-memory token as the source of truth.
    }
}

export function getAccessToken() {
    if (accessToken) {
        return accessToken;
    }

    accessToken = readStoredAccessToken();
    return accessToken;
}

export function clearTokens() {
    accessToken = null;

    try {
        sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    } catch {
        // Ignore storage failures.
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

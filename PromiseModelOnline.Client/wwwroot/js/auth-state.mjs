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
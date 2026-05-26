import { getAccessToken } from './auth/auth-state.mjs';
import { tryRefresh, login } from './auth/oidc.mjs';
import { API_BASE, AUTH_BASE } from './config.mjs';

// ============================
// ✅ INTERNAL TOKEN HANDLING
// ============================

async function refreshAccessToken() {
    const success = await tryRefresh(); // uses HTTP‑only cookie
    return success ? getAccessToken() : null;
}

// ============================
// ✅ CORE AUTH FETCH (DO NOT EXPORT DIRECTLY)
// ============================

async function doAuthFetch(url, options, token) {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });
}

// ============================
// ✅ REDIRECT TO LOGIN (CENTRALIZED)
// ============================

function redirectToLogin() {
    login();
}

// ============================
// ✅ MAIN AUTH FETCH (EXPORT)
// ============================

export async function authFetch(path, options = {}) {
    // ✅ Always resolve through gateway
    const url = `${API_BASE}${path}`;

    let token = getAccessToken();

    // ✅ Ensure token exists
    if (!token) {
        token = await refreshAccessToken();

        if (!token) {
            redirectToLogin();
            throw new Error("Not authenticated");
        }
    }

    // ✅ First request
    let response = await doAuthFetch(url, options, token);

    // ✅ Retry once on 401
    if (response.status === 401) {
        token = await refreshAccessToken();

        if (!token) {
            redirectToLogin();
            throw new Error("Not authenticated");
        }

        response = await doAuthFetch(url, options, token);
    }

    return response;
}

// ============================
// ✅ JSON HELPER (RECOMMENDED)
// ============================

export async function authFetchJson(path, options = {}) {
    const response = await authFetch(path, options);

    if (response.status === 204) return null;

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error: ${response.status} - ${text}`);
    }

    return response.json();
}

// ============================
// ✅ CONVENIENCE METHODS (DRY)
// ============================

export const get = (path) =>
    authFetchJson(path);

export const post = (path, body) =>
    authFetchJson(path, {
        method: "POST",
        body: JSON.stringify(body)
    });

export const put = (path, body) =>
    authFetchJson(path, {
        method: "PUT",
        body: JSON.stringify(body)
    });

export const patch = (path, body) =>
    authFetchJson(path, {
        method: "PATCH",
        body: JSON.stringify(body)
    });

export const del = (path) =>
    authFetchJson(path, {
        method: "DELETE"
    });
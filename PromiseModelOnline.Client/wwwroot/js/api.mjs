let cachedAuth = null;
let cachedUser = null;


// ============================
// ✅ CORE FETCH (BFF / COOKIE-BASED)
// ============================

export async function authFetch(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        credentials: "include",
        headers: {
            ...options.headers,
            // Add this header so the Gateway knows not to 302 redirect
            "X-Requested-With": "XMLHttpRequest"
        }
    });

    if (response.status === 401) {
        cachedAuth = false;
        cachedUser = null;

        // Redirect to the Gateway's /login endpoint. 
        // This will trigger the Gateway's ChallengeAsync("oidc") logic.
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
        
        // Stop execution so the frontend doesn't try to process an empty response
        return new Promise(() => {});
    }

    return response;
}

// ============================
// ✅ JSON HELPER
// ============================

export async function authFetchJson(path, options = {}) {
    const response = await authFetch(path, options);

    if (!response) return;

    if (response.status === 204) return null;

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error: ${response.status} - ${text}`);
    }

    return response.json();
}

// ============================
// ✅ AUTH CHECK (FIXED)
// ============================

export async function isAuthenticated() {
    try {
        const res = await authFetch("/api/users/me");

        const isAuth = res.status === 200;

        // ✅ ALWAYS update from backend
        cachedAuth = isAuth;

        return isAuth;
    } catch {
        cachedAuth = false;
        return false;
    }
}

// ============================
// ✅ CURRENT USER (FIXED)
// ============================

export async function getCurrentUser() {
    try {
        const res = await authFetch("/api/users/me");

        if (res.status !== 200) {
            cachedAuth = false;
            cachedUser = null;
            return null;
        }

        const user = await res.json();

        cachedUser = user;
        cachedAuth = true;

        return user;

    } catch {
        cachedAuth = false;
        cachedUser = null;
        return null;
    }
}

// ============================
// ✅ CONVENIENCE METHODS
// ============================

export const get = (path) => authFetchJson(path);

export const post = (path, body) =>
    authFetchJson(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

export const put = (path, body) =>
    authFetchJson(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

export const patch = (path, body) =>
    authFetchJson(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

export const del = (path) =>
    authFetchJson(path, {
        method: "DELETE"
    });

// ============================
// ✅ CACHE CONTROL
// ============================

export function clearAuthCache() {
    cachedAuth = null;
}

export function clearUserCache() {
    cachedUser = null;
}

export function clearAllAuth() {
    cachedAuth = null;
    cachedUser = null;
}
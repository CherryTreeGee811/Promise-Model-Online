import { API_BASE, ACCOUNT_BASE } from "./config.mjs";

let cachedAuth = null;
let cachedUser = null;

function normalizePath(base, path, clientName) {
    if (!path) {
        return base;
    }

    if (typeof path !== "string") {
        throw new Error(`${clientName} path must be a string.`);
    }

    if (/^https?:\/\//i.test(path)) {
        throw new Error(`External URLs are not allowed in ${clientName}: ${path}`);
    }

    if (path.startsWith("//")) {
        throw new Error(`Invalid ${clientName} path "${path}".`);
    }

    if (path === base || path.startsWith(`${base}/`)) {
        return path;
    }

    const baseWithoutSlash = base.replace(/\/+$/, "");

    if (path.startsWith("/")) {
        return `${baseWithoutSlash}${path}`;
    }

    return `${baseWithoutSlash}/${path}`;
}

async function parseJsonResponse(response, errorPrefix) {
    if (response.status === 204) {
        return null;
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`${errorPrefix}: ${response.status} - ${text}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        return null;
    }

    return response.json();
}

function redirectToLogin() {
    cachedAuth = false;
    cachedUser = null;

    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
}

export function createApiClient({
    base,
    name,
    onUnauthorized = redirectToLogin
}) {
    async function request(path, options = {}) {
        const response = await fetch(normalizePath(base, path, name), {
            ...options,
            credentials: "include",
            headers: {
                ...options.headers,
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        if (response.status === 401) {
            onUnauthorized(response);
            return new Promise(() => {});
        }

        return response;
    }

    async function json(path, options = {}) {
        const response = await request(path, options);
        return parseJsonResponse(response, `${name} error`);
    }

    return {
        request,
        json,

        get: (path) => json(path),

        post: (path, body) =>
            json(path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }),

        put: (path, body) =>
            json(path, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }),

        patch: (path, body) =>
            json(path, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }),

        del: (path, body = undefined) =>
            json(path, {
                method: "DELETE",
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined
            })
    };
}

export const appApi = createApiClient({
    base: API_BASE,
    name: "API"
});

export const accountApi = createApiClient({
    base: ACCOUNT_BASE,
    name: "Account"
});

// Backward-compatible exports for existing feature modules.
// Existing modules can continue importing { get, post, put, patch, del }.
export const get = appApi.get;
export const post = appApi.post;
export const put = appApi.put;
export const patch = appApi.patch;
export const del = appApi.del;

export async function authFetch(path, options = {}) {
    return appApi.request(path, options);
}

export async function authFetchJson(path, options = {}) {
    return appApi.json(path, options);
}

export async function isAuthenticated() {
    try {
        const res = await authFetch("/users/me");
        const isAuth = res.status === 200;
        cachedAuth = isAuth;
        return isAuth;
    } catch {
        cachedAuth = false;
        return false;
    }
}

export async function getCurrentUser() {
    try {
        const res = await authFetch("/users/me");

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

export async function logout() {
    const response = await fetch("/logout", {
        method: "POST",
        credentials: "include",
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    });

    clearAllAuth();

    return response;
}

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
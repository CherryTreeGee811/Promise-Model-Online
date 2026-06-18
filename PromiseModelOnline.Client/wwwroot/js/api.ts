import { authStore } from './stores/auth.ts';

/**
 * Perform a GET request and parse JSON response.
 * @param {string} url - The API endpoint URL.
 * @returns {Promise<T | null>} The parsed JSON body, or null for 204 No Content.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiGet<T = unknown>(url: string): Promise<T | null> {
  const response = await apiFetch(url);
  if (response.status === 204) return undefined as T;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/**
 * Perform a GET request and return an empty array on null.
 * @param {string} url - The API endpoint URL.
 * @returns {Promise<T[]>} The parsed JSON array, or empty array.
 */
export async function apiGetList<T = unknown>(url: string): Promise<T[]> {
  const data = await apiGet<T[]>(url);
  return data ?? [];
}

/**
 * Perform a POST request with a JSON body.
 * @param {string} url - The API endpoint URL.
 * @param {unknown} body - The request payload.
 * @returns {Promise<T | null>} The parsed JSON response, or null for 204.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiPost<T = unknown>(url: string, body: unknown): Promise<T | null> {
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 204) return undefined as T;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/**
 * Perform a PUT request with a JSON body.
 * @param {string} url - The API endpoint URL.
 * @param {unknown} body - The request payload.
 * @returns {Promise<boolean>} True on success.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiPut(url: string, body: unknown): Promise<boolean> {
  const response = await apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return true;
}

/**
 * Perform a PATCH request with a JSON body.
 * @param {string} url - The API endpoint URL.
 * @param {unknown} body - The request payload.
 * @returns {Promise<T | null>} The parsed JSON response, or null for 204.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiPatch<T = unknown>(url: string, body: unknown): Promise<T | null> {
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 204) return undefined as T;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/**
 * Perform a DELETE request.
 * @param {string} url - The API endpoint URL.
 * @returns {Promise<boolean>} True on success.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiDelete(url: string): Promise<boolean> {
  const response = await apiFetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return true;
}

/**
 * Build a project-scoped API URL from owner slug, project slug, and optional path.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} path - Optional additional path segment.
 * @returns {string} The constructed URL.
 */
export function projectUrl(owner: string, project: string, path = ''): string {
  return `/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}${path}`;
}

/**
 * Core fetch wrapper that includes credentials, sets JSON accept headers,
 * and redirects to /login on 401 responses.
 * @param {string} url - The URL to fetch.
 * @param {Record<string, unknown>} options - Additional fetch options.
 * @returns {Promise<Response>} The fetch Response.
 * @throws {Error} If the server returns 401 (redirects to login).
 */
export async function apiFetch(url: string, options: Record<string, unknown> = {}): Promise<Response> {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            ...options.headers as Record<string, string>,
        }
    });

    if (response.status === 401) {
        authStore.set({ isAuthenticated: false, username: undefined, userId: undefined });
        if (!location.pathname.startsWith('/login')) {
            location.assign('/login');
        }
        throw new Error('Unauthorized');
    }

    return response;
}

export { apiFetch as authFetch };

/**
 * Check whether the user has an active session by calling /api/users/me.
 * Restores authentication state on successful response.
 * @returns {Promise<boolean>} True if the user has a valid session.
 */
export async function checkSession() {
    try {
        const response = await fetch('/api/users/me', {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            authStore.set({ isAuthenticated: true, username: data.name, userId: data.userId });
            return true;
        }
    } catch {
        // No session
    }

    authStore.set({ isAuthenticated: false, username: undefined, userId: undefined });
    return false;
}

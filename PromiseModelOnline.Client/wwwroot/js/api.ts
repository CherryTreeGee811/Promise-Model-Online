import { setAuthState, clearAuth } from './auth-state.ts';

/**
 * Perform a GET request and parse JSON response.
 * @param url - The API endpoint URL.
 * @returns The parsed JSON body, or null for 204 No Content.
 * @throws Error if the HTTP response is not OK.
 */
export async function apiGet(url: string): Promise<unknown> {
  const res = await apiFetch(url);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Perform a GET request and return an empty array on null.
 * @param url - The API endpoint URL.
 * @returns The parsed JSON array, or empty array.
 */
export async function apiGetList(url: string): Promise<unknown[]> {
  const data = await apiGet(url);
  return (data as unknown[]) ?? [];
}

/**
 * Perform a POST request with a JSON body.
 * @param url - The API endpoint URL.
 * @param body - The request payload.
 * @returns The parsed JSON response, or null for 204.
 * @throws Error if the HTTP response is not OK.
 */
export async function apiPost(url: string, body: unknown): Promise<unknown> {
  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Perform a PUT request with a JSON body.
 * @param url - The API endpoint URL.
 * @param body - The request payload.
 * @returns True on success.
 * @throws Error if the HTTP response is not OK.
 */
export async function apiPut(url: string, body: unknown): Promise<boolean> {
  const res = await apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

/**
 * Perform a PATCH request with a JSON body.
 * @param {string} url - The API endpoint URL.
 * @param {object} body - The request payload.
 * @returns {Promise<object|null>} The parsed JSON response, or null for 204.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiPatch(url: string, body: unknown): Promise<unknown> {
  const res = await apiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Perform a DELETE request.
 * @param {string} url - The API endpoint URL.
 * @returns {Promise<boolean>} True on success.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiDelete(url: string): Promise<boolean> {
  const res = await apiFetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

/**
 * Build a project-scoped API URL from owner slug, project slug, and optional path.
 * @param owner - The project owner's slug.
 * @param project - The project's slug.
 * @param path - Optional additional path segment.
 * @returns The constructed URL.
 */
export function projectUrl(owner: string, project: string, path = ''): string {
  return `/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}${path}`;
}

/**
 * Core fetch wrapper that includes credentials, sets JSON accept headers,
 * and redirects to /login on 401 responses.
 * @param url - The URL to fetch.
 * @param options - Additional fetch options.
 * @returns The fetch Response.
 * @throws Error if the server returns 401 (redirects to login).
 */
export async function apiFetch(url: string, options: Record<string, unknown> = {}): Promise<Response> {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        }
    });

    if (response.status === 401) {
        clearAuth();
        if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
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
            setAuthState({ isAuthenticated: true, username: data.name, userId: data.userId });
            return true;
        }
    } catch {
        // No session
    }

    clearAuth();
    return false;
}

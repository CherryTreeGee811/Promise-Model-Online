import { authStore } from './stores/auth.ts';

/**
 * Perform a GET request and parse JSON response.
 * @param {string} url - The API endpoint URL.
 * @returns {Promise<T | undefined>} The parsed JSON body, or null for 204 No Content.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiGet<T = unknown>(url: string): Promise<T | undefined> {
  const response = await apiFetch(url);
  if (response.status === 204) return;
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
 * @returns {Promise<T | undefined>} The parsed JSON response, or null for 204.
 * @throws {Error} If the HTTP response is not OK.
 */
async function apiMutate<T = unknown>(url: string, body: unknown | undefined, method: string, isReturnJson: boolean): Promise<T | undefined | boolean> {
  const options: Record<string, unknown> = { method };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await apiFetch(url, options);
  if (isReturnJson && response.status === 204) return;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return isReturnJson ? response.json() : true;
}

/**
 * Perform a POST request with a JSON body.
 * @param {string} url - The API endpoint URL.
 * @param {unknown} body - The request payload.
 * @returns {Promise<T | undefined>} The parsed JSON response, or null for 204.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiPost<T = unknown>(url: string, body: unknown): Promise<T | undefined> {
  return apiMutate<T>(url, body, 'POST', true) as Promise<T | undefined>;
}

/**
 * Perform a PUT request with a JSON body.
 * @param {string} url - The API endpoint URL.
 * @param {unknown} body - The request payload.
 * @returns {Promise<boolean>} True on success.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiPut(url: string, body: unknown): Promise<boolean> {
  return apiMutate(url, body, 'PUT', false) as Promise<boolean>;
}

/**
 * Perform a PATCH request with a JSON body.
 * @param {string} url - The API endpoint URL.
 * @param {unknown} body - The request payload.
 * @returns {Promise<T | undefined>} The parsed JSON response, or null for 204.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiPatch<T = unknown>(url: string, body: unknown): Promise<T | undefined> {
  return apiMutate<T>(url, body, 'PATCH', true) as Promise<T | undefined>;
}

/**
 * Perform a DELETE request.
 * @param {string} url - The API endpoint URL.
 * @returns {Promise<boolean>} True on success.
 * @throws {Error} If the HTTP response is not OK.
 */
export async function apiDelete(url: string): Promise<boolean> {
  return apiMutate(url, undefined, 'DELETE', false) as Promise<boolean>;
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

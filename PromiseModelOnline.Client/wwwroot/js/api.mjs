import { setAuthState, clearAuth } from './auth-state.mjs';

export async function apiGet(url) {
  const res = await apiFetch(url);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiGetList(url) {
  const data = await apiGet(url);
  return data ?? [];
}

export async function apiPost(url, body) {
  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPut(url, body) {
  const res = await apiFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

export async function apiPatch(url, body) {
  const res = await apiFetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiDelete(url) {
  const res = await apiFetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

/*
====================================
API FETCH (credentials-based, no tokens)
====================================
*/
export async function apiFetch(url, options = {}) {
    let response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            ...options.headers,
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

/* SESSION CHECK (restore auth on page load) */
export async function checkSession() {
    try {
        const response = await fetch('/api/users/me', {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            setAuthState({ isAuthenticated: true, username: data.name });
            return true;
        }
    } catch {
        // No session
    }

    clearAuth();
    return false;
}

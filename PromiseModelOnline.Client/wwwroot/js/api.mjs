import { setAuthState, clearAuth } from './auth-state.mjs';

/*
====================================
LOGIN
====================================
*/
export function getToken() {
    window.location.href = '/login';
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

/*
====================================
LOGOUT
====================================
*/
export function requestLogout() {
    window.location.href = '/logout';
}

/*
====================================
REGISTER
====================================
*/
export function registerUser() {
    window.location.href = '/account/register';
}

/*
====================================
CHANGE PASSWORD
====================================
*/
export function changePassword(currentPassword, newPassword, confirmPassword) {
    return apiFetch('/account/me/password', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword
        })
    }).then(async response => {
        if (response.ok) return true;

        const data = await response.json();
        throw new Error(data.message || 'Change password failed');
    });
}

/*
====================================
SESSION CHECK (restore auth on page load)
====================================
*/
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

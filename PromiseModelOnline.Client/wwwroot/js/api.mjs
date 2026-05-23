import { setTokens, getAccessToken, clearTokens } from './auth-state.mjs';
import { routeHandler } from './router.mjs';

export const base = "https://localhost:8000";

function redirectToLogin() {
    const navContentDiv = document.getElementById('main-menu');
    const contentDiv = document.getElementById('content');

    window.history.pushState({}, '', '/login');
    routeHandler(navContentDiv, contentDiv);
}

/*
====================================
LOGIN
====================================
*/
export function getToken(username, password) {
    const login_url = `${base}/api/sessions`;

    return fetch(login_url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include', // ✅ REQUIRED
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => {
        if (response.ok) return response.json();

        if (response.status === 401) {
            throw new Error("Unauthorized");
        }

        throw new Error(`HTTP error! status: ${response.status}`);
    })
    .then(data => {
        if (data && data.accessToken) {
            setTokens(data.accessToken);
        }
    });
}

/*
====================================
REFRESH TOKEN
====================================
*/
export async function refreshAccessToken() {
    const res = await fetch(`${base}/api/access-tokens`, {
        method: 'POST',
        credentials: 'include' // ✅ cookie automatically sent
    });

    if (!res.ok) return null;

    const data = await res.json();
    setTokens(data.accessToken);

    return data.accessToken;
}

/*
====================================
AUTH FETCH (AUTO REFRESH)
====================================
*/
export async function authFetch(url, options = {}) {
    let token = getAccessToken();

    if (!token) {
        // Only redirect if we KNOW user is not logged in
        if (!window.location.pathname.startsWith('/login')) {
            redirectToLogin();
        }

        throw new Error("Missing auth token");
    }

    let response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    if (response.status !== 401) return response;

    // 🔁 try refresh
    token = await refreshAccessToken();

    if (!token) {
        redirectToLogin();
        return;
    }

    // 🔁 retry request
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });
}

/*
====================================
LOGOUT
====================================
*/
export function requestLogout() {
    const accessToken = getAccessToken();
    const logout_url = `${base}/api/sessions/current`;

    return fetch(logout_url, {
        method: 'DELETE',
        mode: 'cors',
        credentials: 'include', // ✅ important
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(() => {
        clearTokens();
        redirectToLogin();
    });
}

/*
====================================
REGISTER
====================================
*/
export function registerUser(username, email, password) {
    const register_url = `${base}/api/users`;

    return fetch(register_url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: username, email, password }),
    })
    .then(response => {
        if (response.ok) return response.json();

        if (response.status === 409) {
            return response.json().then(data => {
                throw new Error(data.message || "User exists");
            });
        }

        throw new Error("Registration failed");
    });
}

/*
====================================
CHANGE PASSWORD
====================================
*/
export function changePassword(currentPassword, newPassword, confirmPassword) {
    return authFetch(`${base}/api/users/me`, {
        method: 'PATCH',
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
        throw new Error(data.message || "Change password failed");
    });
}
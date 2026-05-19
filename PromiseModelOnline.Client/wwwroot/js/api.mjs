// API base URL for login.
export const base = "https://localhost:8000";

export function getToken(username, password) {
    const login_url = `${base}/api/sessions`
    const body = JSON.stringify({
        username: `${username}`,
        password: `${password}`
    });

    return fetch(login_url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: body,
    })
        .then(response => {
            if (response.ok) {
                if (response.status === 204) {
                    return true;
                } else {
                    return response.json();
                }
            } else if (response.status == 401) {
                document.getElementById("login-link").click();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        })
        .then(data => {
            if (data && data.accessToken && data.refreshToken) {
                document.cookie = `accessToken=${data.accessToken}; path=/; SameSite=Strict;`;
                document.cookie = `refreshToken=${data.refreshToken}; path=/; SameSite=Strict;`;
            }
        })
        .catch(error => {
            throw error;
        });
}

export function requestLogout(token) {
    const logout_url = `${base}/api/sessions/current`
    const accessToken = getAccessTokenFromCookie();

    return fetch(logout_url, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify({ refreshToken: token })
    })
    .then(response => {
        if (response.ok) {
            if (response.status === 204) {
                return true;
            } else {
                return response.json();
            }
        } else if (response.status == 401) {
            document.getElementById("login-link").click();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    })
    .catch(error => {
        throw error;
    });
}

export function registerUser(username, email, password) {
    const register_url = `${base}/api/users`;
    const body = JSON.stringify({
        userName: username,
        email: email,
        password: password
    });

    return fetch(register_url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: body,
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 409) {
                return response.json().then(data => {
                    const error = new Error(data.message || "Username or email already exists.");
                    error.statusCode = 409;
                    throw error;
                });
            } else if (response.status === 400) {
                return response.json().then(data => {
                    const error = new Error(data.message || "Invalid registration data.");
                    error.statusCode = 400;
                    throw error;
                });
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        })
        .catch(error => {
            throw error;
        });
}

import { getAccessTokenFromCookie } from './parser.mjs';

export function changePassword(currentPassword, newPassword, confirmPassword) {
    const change_url = `${base}/api/users/me`;
    const token = getAccessTokenFromCookie();

    const body = JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
    });

    return fetch(change_url, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': 'en-CA',
            'Authorization': `Bearer ${token}`,
        },
        body: body,
    })
        .then(response => {
            if (response.ok) {
                if (response.status === 204) {
                    return true;
                } else {
                    return response.json();
                }
            } else if (response.status === 401) {
                document.getElementById("login-link").click();
            } else if (response.status === 400) {
                return response.json().then(data => {
                    const error = new Error(data.message || "Invalid request.");
                    error.statusCode = 400;
                    throw error;
                });
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        })
        .catch(error => {
            throw error;
        });
}
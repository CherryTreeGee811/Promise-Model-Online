// API base URL for login.
export const base = "https://localhost:8000";

export function getToken(username, password) {
    const login_url = `${base}/auth/login`
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
            if (data && data.token) {
                document.cookie = `token=${data.token}; path=/; SameSite=Strict;`;
            }
        })
        .catch(error => {
            throw error;
        });
}
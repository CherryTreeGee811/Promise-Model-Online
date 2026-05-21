import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

export function getPromiseById(promiseId) {
    const url = `${base}/api/promises/${promiseId}`;
    const token = getAccessTokenFromCookie();

    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                document.getElementById("login-link")?.click();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

export function getEpicsByPromise(promiseId) {
    const url = `${base}/api/epics?promiseId=${promiseId}`;
    const token = getAccessTokenFromCookie();

    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        }
    })
    .then(response => {
        if (response.ok) {
            if (response.status === 204) return [];
            return response.json();
        } else if (response.status === 401) {
            document.getElementById("login-link").click();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    });
}

export async function addPromise(promise) {
    const url = `${base}/api/promises`;
    const token = getAccessTokenFromCookie();

    const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify(promise)
    });

    if (res.ok) {
        if (res.status === 204) return null;
        return res.json();
    } else if (res.status === 401) {
        document.getElementById("login-link")?.click();
    } else {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
}

export async function updatePromise(promise) {
    const url = `${base}/api/promises/${promise.id}`;
    const token = getAccessTokenFromCookie();

    const res = await fetch(url, {
        method: 'PUT',
        mode: 'cors',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
        },
        body: JSON.stringify(promise)
    });

    if (res.ok) {
        return true;
    } else if (res.status === 401) {
        document.getElementById("login-link")?.click();
    } else {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
}
import { authFetch, base } from '../api.mjs';

/*
====================================
GET PROMISE
====================================
*/
export function getPromiseById(promiseId) {
    return authFetch(`${base}/api/promises/${promiseId}`)
        .then(handleJson);
}

/*
====================================
GET EPICS
====================================
*/
export function getEpicsByPromise(promiseId) {
    return authFetch(`${base}/api/epics?promiseId=${promiseId}`)
        .then(handleJsonOrEmpty);
}

/*
====================================
CREATE PROMISE
====================================
*/
export async function addPromise(promise) {
    const res = await authFetch(`${base}/api/promises/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(promise)
    });

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

/*
====================================
UPDATE PROMISE
====================================
*/
export async function updatePromise(promise) {
    const res = await authFetch(`${base}/api/promises/${promise.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(promise)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return true;
}

/*
====================================
HELPERS
====================================
*/

function handleJson(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

export async function updatePromiseDescription(promiseId, description) {
    const res = await authFetch(`${base}/api/promises/${promiseId}/description`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ description }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function handleJsonOrEmpty(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    if (response.status === 204) return [];

    return response.json();
}

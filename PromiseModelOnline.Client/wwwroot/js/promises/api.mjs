<<<<<<< HEAD
import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

export const getPromise = (owner, project, promiseSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}`);
export const getPromiseById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/by-id/${id}`);
export const getEpicsByPromise = (owner, project, promiseSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics?promiseSeq=${promiseSeq}`);
export const createPromise = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/create`, data);
export const updatePromise = (owner, project, promiseSeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}`, data);
export const updatePromiseDescription = (owner, project, promiseSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}/description`, { description });
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

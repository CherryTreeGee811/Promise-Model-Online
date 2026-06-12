<<<<<<< HEAD
import { apiGet, apiGetList, apiPost, apiPatch } from '../api.mjs';

export const getStridesByIteration = (owner, project, iterationId) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides?iterationId=${iterationId}`);
export const getStrides = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides`);
export const getMomentsByStride = (owner, project, strideId) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?strideId=${strideId}`);
export const getUnassignedMoments = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?unassigned=true`);
export const getMomentsByIteration = (owner, project, iterationId, unassigned = false) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?iterationId=${iterationId}${unassigned ? '&unassigned=true' : ''}`);
export const getIterations = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`);

export const createStride = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides`, data);

export async function getProjectMembers(owner, project) {
    const res = await apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/members`);
    return res ?? [];
}

export async function getMyPermission(owner, project) {
    const res = await apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);
    if (!res) return null;
    return res.permission ?? null;
}

export const updateStride = (owner, project, strideId, data) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides/${strideId}`, data);
export const progressStride = (owner, project, strideId) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides/${strideId}/progress`);
export const triggerDeadlineNotificationRuns = () => apiPost('/api/deadline-notification-runs', {});
||||||| 1bedf4f
=======
import { authFetch, base } from '../api.mjs';

/*
====================================
STRIDES
====================================
*/

export function getStridesByIteration(iterationId) {
    return authFetch(`${base}/api/strides?iterationId=${iterationId}`)
        .then(handleJsonOrEmpty);
}

export function getAllStrides() {
    return authFetch(`${base}/api/strides`)
        .then(handleJsonOrEmpty);
}

/*
====================================
MOMENTS
====================================
*/

export function getMomentsByStride(strideId) {
    return authFetch(`${base}/api/moments?strideId=${strideId}`)
        .then(handleJsonOrEmpty);
}

export function getBacklogMoments(projectId) {
    return authFetch(`${base}/api/moments?projectId=${projectId}&unassigned=true`)
        .then(handleJsonOrEmpty);
}

export function getMomentsByIteration(iterationId, unassigned = false) {
    return authFetch(
        `${base}/api/moments?iterationId=${iterationId}${unassigned ? '&unassigned=true' : ''}`
    ).then(handleJsonOrEmpty);
}

/*
====================================
ITERATIONS
====================================
*/

export function getIterationsByProject(projectId) {
    return authFetch(`${base}/api/iterations?projectId=${projectId}`)
        .then(handleJsonOrEmpty);
}

/*
====================================
PROJECT MEMBERS / PERMISSIONS
====================================
*/

export async function getProjectMembers(projectId) {
    const res = await authFetch(`${base}/api/projects/${projectId}/members`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getMyPermission(projectId) {
    const res = await authFetch(`${base}/api/projects/${projectId}/my-permission`);

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

/*
====================================
UPDATES
====================================
*/

export async function updateMomentOwner(momentId, userId) {
    const res = await authFetch(`${base}/api/moments/${momentId}/owner`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function progressStride(strideId) {
    const res = await authFetch(`${base}/api/strides/${strideId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progressUnfinishedMoments: true })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function sendDeadlineNotifications() {
    const res = await authFetch(`${base}/api/deadline-notification-runs`, {
        method: 'POST'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/*
====================================
HELPERS
====================================
*/

function handleJsonOrEmpty(response) {
    if (response.ok) {
        if (response.status === 204) return [];
        return response.json();
    }

    throw new Error(`HTTP error! status: ${response.status}`);
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

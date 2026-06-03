import { authFetch } from '../api.mjs';

/*
====================================
STRIDES
====================================
*/

export function getStridesByIteration(iterationId) {
    return authFetch(`/api/strides?iterationId=${iterationId}`)
        .then(handleJsonOrEmpty);
}

export async function createStride(stride) {
    const res = await authFetch(`/api/strides`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(stride)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

export function getAllStrides() {
    return authFetch(`/api/strides`)
        .then(handleJsonOrEmpty);
}

/*
====================================
MOMENTS
====================================
*/

export function getMomentsByStride(strideId) {
    return authFetch(`/api/moments?strideId=${strideId}`)
        .then(handleJsonOrEmpty);
}

export function getBacklogMoments(projectId) {
    return authFetch(`/api/moments?projectId=${projectId}&unassigned=true`)
        .then(handleJsonOrEmpty);
}

export function getMomentsByIteration(iterationId, unassigned = false) {
    return authFetch(
        `/api/moments?iterationId=${iterationId}${unassigned ? '&unassigned=true' : ''}`
    ).then(handleJsonOrEmpty);
}

/*
====================================
ITERATIONS
====================================
*/

export function getIterationsByProject(projectId) {
    return authFetch(`/api/iterations?projectId=${projectId}`)
        .then(handleJsonOrEmpty);
}

/*
====================================
PROJECT MEMBERS / PERMISSIONS
====================================
*/

export async function getProjectMembers(projectId) {
    const res = await authFetch(`/api/projects/${projectId}/members`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getMyPermission(projectId) {
    const res = await authFetch(`/api/projects/${projectId}/my-permission`);

    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = (await res.text()).trim();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/*
====================================
UPDATES
====================================
*/

export async function updateMomentOwner(momentId, userId) {
    const res = await authFetch(`/api/moments/${momentId}/owner`, {
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
    const res = await authFetch(`/api/strides/${strideId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progressUnfinishedMoments: true })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function sendDeadlineNotifications() {
    const res = await authFetch(`/api/deadline-notification-runs`, {
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
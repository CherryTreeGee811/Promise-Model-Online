import { get, post, patch } from '../api.mjs';

/*
====================================
STRIDES
====================================
*/

export function getStridesByIteration(iterationId) {
    return get(`/strides?iterationId=${iterationId}`);
}

export function getAllStrides() {
    return get(`/strides`);
}

/*
====================================
MOMENTS
====================================
*/

export function getMomentsByStride(strideId) {
    return get(`/moments?strideId=${strideId}`);
}

export function getBacklogMoments(projectId) {
    return get(`/moments?projectId=${projectId}&unassigned=true`);
}

export function getMomentsByIteration(iterationId, unassigned = false) {
    return get(
        `/moments?iterationId=${iterationId}${unassigned ? '&unassigned=true' : ''}`
    );
}

/*
====================================
ITERATIONS
====================================
*/

export function getIterationsByProject(projectId) {
    return get(`/iterations?projectId=${projectId}`);
}

/*
====================================
PROJECT MEMBERS / PERMISSIONS
====================================
*/

export function getProjectMembers(projectId) {
    return get(`/projects/${projectId}/members`);
}

export async function getMyPermission(projectId) {
    try {
        return await get(`/projects/${projectId}/my-permission`);
    } catch (err) {
        // ✅ Handle 204-like scenario gracefully
        if (err.message.includes('204')) return null;
        throw err;
    }
}

/*
====================================
UPDATES
====================================
*/

export function updateMomentOwner(momentId, userId) {
    return patch(`/moments/${momentId}/owner`, { userId });
}

export function progressStride(strideId) {
    return patch(`/strides/${strideId}`, {
        progressUnfinishedMoments: true
    });
}

export function sendDeadlineNotifications() {
    return post(`/deadline-notification-runs`);
}
``
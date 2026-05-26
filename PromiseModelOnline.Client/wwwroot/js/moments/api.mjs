import { get, post, patch } from '../api.mjs';

/*
====================================
GET MOMENT
====================================
*/

export function getMomentById(momentId) {
    return get(`/moments/${momentId}`);
}

/*
====================================
MOVE MOMENT
====================================
*/

export function moveMomentToStride(momentId, targetStrideId) {
    return patch(`/moments/${momentId}/stride-assignment`, {
        strideId: targetStrideId
    });
}

/*
====================================
STATUS / ESTIMATE / TYPE
====================================
*/

export function updateMomentStatus(momentId, newStatus) {
    return patch(`/moments/${momentId}/status`, {
        newStatus
    });
}

export function updateMomentEstimate(momentId, estimate) {
    return patch(`/moments/${momentId}/estimate`, {
        estimate
    });
}

export function updateMomentType(momentId, newType) {
    return patch(`/moments/${momentId}/type`, {
        newType
    });
}

/*
====================================
OWNER
====================================
*/

export function updateMomentOwner(momentId, userId) {
    return patch(`/moments/${momentId}/owner`, {
        userId
    });
}

/*
====================================
TASKS
====================================
*/

export function getMyTasks() {
    return get(`/moments/assigned-to-me`);
}

/*
====================================
CREATE MOMENT
====================================
*/

export function addMoment(moment) {
    return post(`/moments`, moment);
}
``
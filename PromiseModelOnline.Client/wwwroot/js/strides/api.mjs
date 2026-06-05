import { apiGet, apiGetList, apiPost, apiPatch } from '../api.mjs';

export const getStridesByIteration = iterationId => apiGetList(`/api/strides?iterationId=${iterationId}`);
export const getAllStrides = () => apiGetList('/api/strides');
export const getMomentsByStride = strideId => apiGetList(`/api/moments?strideId=${strideId}`);
export const getBacklogMoments = projectId => apiGetList(`/api/moments?projectId=${projectId}&unassigned=true`);
export const getMomentsByIteration = (iterationId, unassigned = false) => apiGetList(`/api/moments?iterationId=${iterationId}${unassigned ? '&unassigned=true' : ''}`);
export const getIterationsByProject = projectId => apiGetList(`/api/iterations?projectId=${projectId}`);

export const createStride = stride => apiPost('/api/strides', stride);

export async function getProjectMembers(projectId) {
    const res = await apiGet(`/api/projects/${projectId}/members`);
    return res ?? [];
}

export async function getMyPermission(projectId) {
    const res = await apiGet(`/api/projects/${projectId}/my-permission`);
    return res ?? null;
}

export const progressStride = strideId => apiPatch(`/api/strides/${strideId}`, { progressUnfinishedMoments: true });
export const sendDeadlineNotifications = () => apiPost('/api/deadline-notification-runs', {});

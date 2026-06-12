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

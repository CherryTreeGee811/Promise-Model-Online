import { apiGet, apiGetList, apiPost,  } from '../api.ts';

export const getStridesByIteration = (owner: string, project: string, iterationId: string | number) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides?iterationId=${iterationId}`);
export const getStrides = (owner: string, project: string) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides`);
export const getMomentsByStride = (owner: string, project: string, strideId: string | number) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?strideId=${strideId}`);
export const getMomentsByIteration = (owner: string, project: string, iterationId: string | number, isUnassigned = false) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?iterationId=${iterationId}${isUnassigned ? '&unassigned=true' : ''}`);
export const getIterations = (owner: string, project: string) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`);
export const createStride = (owner: string, project: string, data: Record<string, unknown>) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides`, data);

/**
 * Fetches the list of members for a project via GET API.
 * @param {string} owner - The project owner's username.
 * @param {string} project - The project slug.
 * @returns {Promise<unknown[]>} The list of project members, or an empty array if none.
 */
export async function getProjectMembers(owner: string, project: string) {
    const response = await apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/members`);
    return response ?? [];
}

/**
 * Fetches the current user's permission level for a project via GET API.
 * @param {string} owner - The project owner's username.
 * @param {string} project - The project slug.
 * @returns {Promise<unknown | undefined>} The permission value, or undefined if the request fails.
 */
export async function getMyPermission(owner: string, project: string) {
    const response = await apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);
    if (!response) return;
    return (response as Record<string, unknown>).permission;
}

export const progressStride = (owner: string, project: string, strideId: string | number) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides/${strideId}/progress`, {});

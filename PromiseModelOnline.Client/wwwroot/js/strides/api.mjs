import { apiGet, apiGetList, apiPost, apiPatch } from '../api.ts';

/**
 * Fetch all strides for a given iteration.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {number|string} iterationId - The iteration ID.
 * @returns {Promise<Array>} The list of strides in the iteration.
 */
export const getStridesByIteration = (owner, project, iterationId) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides?iterationId=${iterationId}`);
/**
 * Fetch all strides for a project.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<Array>} The list of strides.
 */
export const getStrides = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides`);
/**
 * Fetch all moments assigned to a specific stride.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {number|string} strideId - The stride ID.
 * @returns {Promise<Array>} The list of moments in the stride.
 */
export const getMomentsByStride = (owner, project, strideId) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?strideId=${strideId}`);
/**
 * Fetch all unassigned moments for a project.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<Array>} The list of unassigned moments.
 */
export const getUnassignedMoments = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?unassigned=true`);
/**
 * Fetch moments for a given iteration, optionally filtering to unassigned only.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {number|string} iterationId - The iteration ID.
 * @param {boolean} [unassigned=false] - Whether to return only unassigned moments.
 * @returns {Promise<Array>} The list of moments.
 */
export const getMomentsByIteration = (owner, project, iterationId, unassigned = false) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?iterationId=${iterationId}${unassigned ? '&unassigned=true' : ''}`);
/**
 * Fetch all iterations for a project.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<Array>} The list of iterations.
 */
export const getIterations = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`);

/**
 * Create a new stride in a project.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {Object} data - The stride creation payload.
 * @returns {Promise<Object>} The created stride.
 */
export const createStride = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides`, data);

/**
 * Fetch the member list for a project.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<Array>} The list of project members.
 */
export async function getProjectMembers(owner, project) {
    const res = await apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/members`);
    return res ?? [];
}

/**
 * Fetch the current user's permission level for a project.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @returns {Promise<string|null>} The permission level string, or null if unavailable.
 */
export async function getMyPermission(owner, project) {
    const res = await apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/my-permission`);
    if (!res) return null;
    return res.permission ?? null;
}

/**
 * Update an existing stride.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {number|string} strideId - The stride ID.
 * @param {Object} data - The fields to update.
 * @returns {Promise<Object>} The updated stride.
 */
export const updateStride = (owner, project, strideId, data) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides/${strideId}`, data);
/**
 * Progress a stride to its next status.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {number|string} strideId - The stride ID.
 * @returns {Promise<Object>} The progressed stride.
 */
export const progressStride = (owner, project, strideId) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/strides/${strideId}/progress`);
/**
 * Trigger a batch run of deadline notifications.
 * @returns {Promise<Object>} The API response.
 */
export const triggerDeadlineNotificationRuns = () => apiPost('/api/deadline-notification-runs', {});

import { apiGet, apiGetList, apiPost } from '../api.mjs';

/**
 * Fetch all iterations for a project.
 * @param {string} owner - The owner slug.
 * @param {string} project - The project slug.
 * @returns {Promise<Array>} Array of iteration objects.
 */
export const getIterations = (owner, project) => apiGetList(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`);
/**
 * Create a new iteration for a project.
 * @param {string} owner - The owner slug.
 * @param {string} project - The project slug.
 * @param {Object} data - The iteration creation data.
 * @returns {Promise<Object>} The created iteration object.
 */
export const createIteration = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations`, data);
/**
 * Fetch burndown data for a specific iteration.
 * @param {string} owner - The owner slug.
 * @param {string} project - The project slug.
 * @param {number} iterationId - The iteration ID.
 * @returns {Promise<Array>} Array of burndown data points.
 */
export const getBurndown = (owner, project, iterationId) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/iterations/${iterationId}/burndown`);

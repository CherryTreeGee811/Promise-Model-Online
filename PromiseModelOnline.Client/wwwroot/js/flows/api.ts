import { apiGet, apiPost, apiPut, apiPatch } from '../api.ts';

/**
 * Fetch a flow by its sequence number.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} flowSeq - The flow's sequence number.
 * @returns {Promise<object>} The flow data.
 */
export const getFlow = (owner, project, flowSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}`);
/**
 * Fetch a flow by its internal ID.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} id - The flow's internal ID.
 * @returns {Promise<object>} The flow data.
 */
export const getFlowById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/by-id/${id}`);
/**
 * Fetch moments belonging to a flow.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} flowSeq - The flow's sequence number.
 * @returns {Promise<object[]>} The list of moments.
 */
export const getMoments = (owner, project, flowSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/moments?flowSeq=${flowSeq}`);
/**
 * Create a new flow.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} data - The flow creation payload.
 * @returns {Promise<object>} The created flow.
 */
export const createFlow = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/create`, data);
/**
 * Update an existing flow.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} flowSeq - The flow's sequence number.
 * @param {object} data - The updated flow data.
 * @returns {Promise<object>} The updated flow.
 */
export const updateFlow = (owner, project, flowSeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}`, data);
/**
 * Update the description of a flow.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} flowSeq - The flow's sequence number.
 * @param {string} description - The new description text.
 * @returns {Promise<object>} The updated flow.
 */
export const updateFlowDescription = (owner, project, flowSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows/${flowSeq}/description`, { description });

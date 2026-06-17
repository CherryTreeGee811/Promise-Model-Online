import { apiGet, apiPost, apiPut, apiPatch } from '../api.ts';

/**
 * Fetch a promise by its sequence number.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} promiseSeq - The promise's sequence number.
 * @returns {Promise<object>} The promise data.
 */
export const getPromise = (owner, project, promiseSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}`);
/**
 * Fetch a promise by its internal ID.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} id - The promise's internal ID.
 * @returns {Promise<object>} The promise data.
 */
export const getPromiseById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/by-id/${id}`);
/**
 * Fetch epics belonging to a promise.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} promiseSeq - The promise's sequence number.
 * @returns {Promise<object[]>} The list of epics.
 */
export const getEpicsByPromise = (owner, project, promiseSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics?promiseSeq=${promiseSeq}`);
/**
 * Create a new promise.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} data - The promise creation payload.
 * @returns {Promise<object>} The created promise.
 */
export const createPromise = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/create`, data);
/**
 * Update an existing promise.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} promiseSeq - The promise's sequence number.
 * @param {object} data - The updated promise data.
 * @returns {Promise<object>} The updated promise.
 */
export const updatePromise = (owner, project, promiseSeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}`, data);
/**
 * Update the description of a promise.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} promiseSeq - The promise's sequence number.
 * @param {string} description - The new description text.
 * @returns {Promise<object>} The updated promise.
 */
export const updatePromiseDescription = (owner, project, promiseSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/promises/${promiseSeq}/description`, { description });

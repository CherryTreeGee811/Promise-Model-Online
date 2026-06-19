import { apiGet, apiPost, apiPatch } from '../api.ts';

/**
 * Fetch an epic by its sequence number.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} epicSeq - The epic's sequence number.
 * @returns {Promise<object>} The epic data.
 */
export const getEpic = (owner, project, epicSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/${epicSeq}`);
/**
 * Fetch an epic by its internal ID.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} id - The epic's internal ID.
 * @returns {Promise<object>} The epic data.
 */
export const getEpicById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/by-id/${id}`);
/**
 * Fetch journeys belonging to an epic.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} epicSeq - The epic's sequence number.
 * @returns {Promise<object[]>} The list of journeys.
 */
export const getJourneys = (owner, project, epicSeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys?epicSeq=${epicSeq}`);
/**
 * Create a new epic.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} data - The epic creation payload.
 * @returns {Promise<object>} The created epic.
 */
export const createEpic = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/create`, data);
/**
 * Update an existing epic.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} epicSeq - The epic's sequence number.
 * @param {object} data - The updated epic data.
 * @returns {Promise<object>} The updated epic.
 */

/**
 * Update the description of an epic.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} epicSeq - The epic's sequence number.
 * @param {string} description - The new description text.
 * @returns {Promise<object>} The updated epic.
 */
export const updateEpicDescription = (owner, project, epicSeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/epics/${epicSeq}/description`, { description });

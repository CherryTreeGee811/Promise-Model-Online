import { apiGet, apiPost, apiPut, apiPatch } from '../api.mjs';

/**
 * Fetch a journey by its sequence number.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} journeySeq - The journey's sequence number.
 * @returns {Promise<object>} The journey data.
 */
export const getJourney = (owner, project, journeySeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/${journeySeq}`);
/**
 * Fetch a journey by its internal ID.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} id - The journey's internal ID.
 * @returns {Promise<object>} The journey data.
 */
export const getJourneyById = (owner, project, id) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/by-id/${id}`);
/**
 * Fetch flows belonging to a journey.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} journeySeq - The journey's sequence number.
 * @returns {Promise<object[]>} The list of flows.
 */
export const getFlows = (owner, project, journeySeq) => apiGet(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/flows?journeySeq=${journeySeq}`);
/**
 * Create a new journey.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} data - The journey creation payload.
 * @returns {Promise<object>} The created journey.
 */
export const createJourney = (owner, project, data) => apiPost(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/create`, data);
/**
 * Update an existing journey.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} journeySeq - The journey's sequence number.
 * @param {object} data - The updated journey data.
 * @returns {Promise<object>} The updated journey.
 */
export const updateJourney = (owner, project, journeySeq, data) => apiPut(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/${journeySeq}`, data);
/**
 * Update the description of a journey.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {number|string} journeySeq - The journey's sequence number.
 * @param {string} description - The new description text.
 * @returns {Promise<object>} The updated journey.
 */
export const updateJourneyDescription = (owner, project, journeySeq, description) => apiPatch(`/api/projects/${encodeURIComponent(owner)}/${encodeURIComponent(project)}/journeys/${journeySeq}/description`, { description });

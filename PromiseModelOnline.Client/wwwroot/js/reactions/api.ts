import { apiGet, apiPost, apiPatch, apiDelete } from '../api.ts';

/**
 * Fetch reactions for a given parent entity.
 * @param {string} _owner - The owner slug (unused).
 * @param {string} _project - The project slug (unused).
 * @param {string} parentType - The parent entity type.
 * @param {number} itemId - The parent entity ID.
 * @returns {Promise<Array>} Array of reaction objects.
 */
export const getReactions = (_owner, _project, parentType, itemId) => apiGet(`/api/reactions?type=${parentType}&itemId=${itemId}`);
/**
 * Add a new reaction.
 * @param {string} _owner - The owner slug (unused).
 * @param {string} _project - The project slug (unused).
 * @param {object} data - The reaction data containing parentType, parentId, and emote.
 * @returns {Promise<object>} The created reaction object.
 */
export const addReaction = (_owner, _project, data) => apiPost('/api/reactions', data);
/**
 * Update an existing reaction (e.g. change emote).
 * @param {string} _owner - The owner slug (unused).
 * @param {string} _project - The project slug (unused).
 * @param {number} reactionId - The reaction ID to update.
 * @returns {Promise<object>} The updated reaction object.
 */
export const updateReaction = (_owner, _project, reactionId) => apiPatch(`/api/reactions/${reactionId}`, {});
/**
 * Delete a reaction by ID.
 * @param {string} _owner - The owner slug (unused).
 * @param {string} _project - The project slug (unused).
 * @param {number} reactionId - The reaction ID to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export const deleteReaction = (_owner, _project, reactionId) => apiDelete(`/api/reactions/${reactionId}`);

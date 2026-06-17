import { apiGet, apiPost } from '../api.ts';

/**
 * Fetch comments for a parent entity.
 * @param {string} _owner - The owner slug (unused).
 * @param {string} _project - The project slug (unused).
 * @param {string} parentType - The parent entity type.
 * @param {number} parentId - The parent entity ID.
 * @returns {Promise<Array>} The list of comments.
 */
export const getComments = (_owner, _project, parentType, parentId) => apiGet(`/api/comments?type=${parentType}&parentId=${parentId}`);
/**
 * Add a comment to a parent entity.
 * @param {string} _owner - The owner slug (unused).
 * @param {string} _project - The project slug (unused).
 * @param {Object} data - The comment payload.
 * @returns {Promise<Object>} The created comment.
 */
export const addComment = (_owner, _project, data) => apiPost('/api/comments', data);

import { apiGet, apiPost } from '../api.ts';

/**
 * Fetch comments for a parent entity.
 * @param {string} _owner - The owner slug (unused).
 * @param {string} _project - The project slug (unused).
 * @param {string} parentType - The parent entity type.
 * @param {number} parentId - The parent entity ID.
 * @returns {Promise<Array>} The list of comments.
 */
export const getComments = (_owner: string, _project: string, parentType: string, parentId: string | number) => apiGet(`/api/comments?type=${parentType}&parentId=${parentId}`);
/**
 * Add a comment to a parent entity.
 * @param {string} _owner - The owner slug (unused).
 * @param {string} _project - The project slug (unused).
 * @param {object} data - The comment payload.
 * @returns {Promise<object>} The created comment.
 */
export const addComment = (_owner: string, _project: string, data: Record<string, unknown>) => apiPost('/api/comments', data);

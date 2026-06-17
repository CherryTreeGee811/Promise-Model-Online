import { apiGet, apiPatch } from '../api.ts';

/**
 * Fetch all pending invitations for the current user.
 * @returns {Promise<Array>} Array of pending invitation objects.
 */
export const getPendingInvitations = () => apiGet('/api/permissions/pending');
/**
 * Accept a pending invitation by permission ID.
 * @param {number} permissionId - The permission ID to accept.
 * @returns {Promise<Object>} The API response.
 */
export const acceptInvitation = permissionId => apiPatch(`/api/permissions/${permissionId}`, { status: 'Active' });

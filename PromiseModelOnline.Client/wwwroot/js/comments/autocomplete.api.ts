import { apiGet } from '../api.ts';

/**
 * Search for users within a project for @-mention autocomplete.
 * @param {string} parentType - The parent entity type.
 * @param {number|string} parentId - The parent entity ID.
 * @param {string} search - The search term to filter users.
 * @returns {Promise<Array>} A promise resolving to matching user objects.
 */
export function searchUsers(parentType, parentId, search) {
  const params = new URLSearchParams({ parentType, parentId, search });
  return apiGet(`/api/comments/search-users?${params}`);
}

/**
 * Search for entities in the hierarchy for comment linking.
 * @param {string} parentType - The parent entity type.
 * @param {number|string} parentId - The parent entity ID.
 * @param {string} search - The search term to filter entities.
 * @returns {Promise<Array>} A promise resolving to matching entity objects.
 */
export function searchPromises(parentType, parentId, search) {
  const params = new URLSearchParams({ parentType, parentId, search });
  return apiGet(`/api/comments/search-promises?${params}`);
}

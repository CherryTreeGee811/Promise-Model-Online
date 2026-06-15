import { apiGet } from '../api.mjs';

/**
 * Search for users within a project for @-mention autocomplete.
 * @param {*} parentType - TODO
 * @param {*} parentId - TODO
 * @param {*} searchTerm - TODO
 */
export function searchUsers(parentType, parentId, search) {
  const params = new URLSearchParams({ parentType, parentId, search });
  return apiGet(`/api/comments/search-users?${params}`);
}

/**
 * Search for entities in the hierarchy for comment linking.
 * @param {*} parentType - TODO
 * @param {*} parentId - TODO
 * @param {*} searchTerm - TODO
 */
export function searchPromises(parentType, parentId, search) {
  const params = new URLSearchParams({ parentType, parentId, search });
  return apiGet(`/api/comments/search-promises?${params}`);
}

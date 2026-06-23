import { apiGet } from '../api.ts';

/**
 * Searches users by name for the mention autocomplete (`@` trigger).
 * @param {string} parentType - The type of parent entity (e.g. 'moment').
 * @param {string | number} parentId - The ID of the parent entity.
 * @param {string} search - The partial user name to search for.
 * @returns {Promise<Record<string, unknown>[]>} A promise resolving to matching user records.
 */
export function searchUsers(parentType: string, parentId: string | number, search: string) {
  const parameters = new URLSearchParams({ parentType, parentId: String(parentId), search });
  return apiGet(`/api/comments/search-users?${parameters}`);
}

/**
 * Searches promises by statement for the #-reference autocomplete.
 * @param {string} parentType - The type of parent entity (e.g. 'moment').
 * @param {string | number} parentId - The ID of the parent entity.
 * @param {string} search - The partial promise statement to search for.
 * @returns {Promise<Record<string, unknown>[]>} A promise resolving to matching promise records.
 */
export function searchPromises(parentType: string, parentId: string | number, search: string) {
  const parameters = new URLSearchParams({ parentType, parentId: String(parentId), search });
  return apiGet(`/api/comments/search-promises?${parameters}`);
}

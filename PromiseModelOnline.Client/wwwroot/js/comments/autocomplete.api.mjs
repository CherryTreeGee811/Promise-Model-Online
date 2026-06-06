import { apiGet } from '../api.mjs';

export function searchUsers(parentType, parentId, search) {
  const params = new URLSearchParams({ parentType, parentId, search });
  return apiGet(`/api/comments/search-users?${params}`);
}

export function searchPromises(parentType, parentId, search) {
  const params = new URLSearchParams({ parentType, parentId, search });
  return apiGet(`/api/comments/search-promises?${params}`);
}

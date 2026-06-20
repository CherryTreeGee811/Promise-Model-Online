import { apiGet } from '../api.ts';

export function searchUsers(parentType: string, parentId: string | number, search: string) {
  const parameters = new URLSearchParams({ parentType, parentId: String(parentId), search });
  return apiGet(`/api/comments/search-users?${parameters}`);
}

export function searchPromises(parentType: string, parentId: string | number, search: string) {
  const parameters = new URLSearchParams({ parentType, parentId: String(parentId), search });
  return apiGet(`/api/comments/search-promises?${parameters}`);
}

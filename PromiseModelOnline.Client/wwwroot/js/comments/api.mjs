import { apiGet, apiPost } from '../api.mjs';

export const getComments = (_owner, _project, parentType, parentId) => apiGet(`/api/comments?type=${parentType}&parentId=${parentId}`);
export const addComment = (_owner, _project, data) => apiPost('/api/comments', data);

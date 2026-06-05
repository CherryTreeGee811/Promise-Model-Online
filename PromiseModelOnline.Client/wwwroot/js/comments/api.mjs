import { apiGet, apiPost } from '../api.mjs';

export const getComments = (parentType, parentId) => apiGet(`/api/comments?type=${parentType}&parentId=${parentId}`);
export const postComment = (parentType, parentId, text, parentCommentId = null) => apiPost('/api/comments', { text, parentType, parentId, parentCommentId });

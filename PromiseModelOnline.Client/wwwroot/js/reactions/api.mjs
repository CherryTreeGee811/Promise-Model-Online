import { apiGet, apiPost, apiPatch, apiDelete } from '../api.mjs';

export const getReactions = (_owner, _project, parentType, itemId) => apiGet(`/api/reactions?type=${parentType}&itemId=${itemId}`);
export const addReaction = (_owner, _project, data) => apiPost('/api/reactions', data);
export const updateReaction = (_owner, _project, reactionId) => apiPatch(`/api/reactions/${reactionId}`, {});
export const deleteReaction = (_owner, _project, reactionId) => apiDelete(`/api/reactions/${reactionId}`);

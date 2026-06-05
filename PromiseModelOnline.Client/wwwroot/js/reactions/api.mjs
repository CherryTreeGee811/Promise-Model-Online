import { apiGet, apiPost, apiPatch, apiDelete } from '../api.mjs';

export const getReactions = (parentType, parentId) => apiGet(`/api/reactions?type=${parentType}&itemId=${parentId}`);
export const createReaction = (parentType, parentId, emote) => apiPost('/api/reactions', { emote, stackItemType: parentType, stackItemId: parentId });
export const updateReaction = (reactionId, emote) => apiPatch(`/api/reactions/${reactionId}`, { emote });
export const deleteReaction = reactionId => apiDelete(`/api/reactions/${reactionId}`);

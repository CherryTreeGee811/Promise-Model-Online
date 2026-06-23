import { apiGet, apiPost, apiPatch,  } from '../api.ts';

export const getReactions = (_owner: string, _project: string, parentType: string, itemId: string | number) => apiGet(`/api/reactions?type=${parentType}&itemId=${itemId}`);
export const addReaction = (_owner: string, _project: string, data: Record<string, unknown>) => apiPost('/api/reactions', data);
export const updateReaction = (_owner: string, _project: string, reactionId: string | number, emote?: string) => apiPatch(`/api/reactions/${reactionId}`, emote ? { emote } : {});

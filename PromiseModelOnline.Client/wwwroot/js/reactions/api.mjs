import { get, post, patch, del } from '../api.mjs';
import { API_BASE } from '../config.mjs';

/*
====================================
GET REACTIONS
====================================
*/

export function getReactions(parentType, parentId) {
    return get(`/${API_BASE}/reactions?type=${parentType}&itemId=${parentId}`);
}

/*
====================================
CREATE REACTION
====================================
*/
export function createReaction(parentType, parentId, emote) {
    return post(`/${API_BASE}/reactions`, {
        emote,
        stackItemType: parentType,
        stackItemId: parentId
    });
}

/*
====================================
UPDATE REACTION
====================================
*/
export function updateReaction(reactionId, emote) {
    return patch(`/${API_BASE}/reactions/${reactionId}`, {
        emote
    });
}

/*
====================================
DELETE REACTION
====================================
*/

export function deleteReaction(reactionId) {
    return del(`/${API_BASE}/reactions/${reactionId}`);
}
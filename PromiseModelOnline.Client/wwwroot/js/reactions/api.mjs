import { get, post, patch, del } from '../api.mjs';

/*
====================================
GET REACTIONS
====================================
*/
export function getReactions(parentType, parentId) {
    return get(`/reactions?type=${parentType}&itemId=${parentId}`);
}

/*
====================================
CREATE REACTION
====================================
*/
export function createReaction(parentType, parentId, emote) {
    return post(`/reactions`, {
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
    return patch(`/reactions/${reactionId}`, {
        emote
    });
}

/*
====================================
DELETE REACTION
====================================
*/
export function deleteReaction(reactionId) {
    return del(`/reactions/${reactionId}`);
}
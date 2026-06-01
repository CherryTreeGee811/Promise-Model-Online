import { get, post, patch, del } from "../api.mjs";

/*
====================================
GET REACTIONS
====================================
*/
export function getReactions(parentType, parentId) {
    return get(
        `/reactions?type=${encodeURIComponent(parentType)}&itemId=${parentId}`
    );
}

/*
====================================
CREATE REACTION
====================================
*/
export function createReaction(parentType, parentId, emote) {
    return post(`/reactions`, {
        stackItemType: parentType,
        stackItemId: parentId,
        emote
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
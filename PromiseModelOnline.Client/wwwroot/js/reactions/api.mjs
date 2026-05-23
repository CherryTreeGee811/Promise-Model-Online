import { authFetch, base } from '../api.mjs';

/*
====================================
GET REACTIONS
====================================
*/
export async function getReactions(parentType, parentId) {
    const res = await authFetch(`${base}/api/reactions?type=${parentType}&itemId=${parentId}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/*
====================================
CREATE REACTION
====================================
*/
export async function createReaction(parentType, parentId, emote) {
    const res = await authFetch(`${base}/api/reactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            emote,
            stackItemType: parentType,
            stackItemId: parentId
        })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/*
====================================
UPDATE REACTION
====================================
*/
export async function updateReaction(reactionId, emote) {
    const res = await authFetch(`${base}/api/reactions/${reactionId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emote })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/*
====================================
DELETE REACTION
====================================
*/
export async function deleteReaction(reactionId) {
    const res = await authFetch(`${base}/api/reactions/${reactionId}`, {
        method: 'DELETE'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
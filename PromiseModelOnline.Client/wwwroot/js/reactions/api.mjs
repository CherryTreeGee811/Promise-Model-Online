<<<<<<< HEAD
import { apiGet, apiPost, apiPatch, apiDelete } from '../api.mjs';

export const getReactions = (_owner, _project, parentType, itemId) => apiGet(`/api/reactions?type=${parentType}&itemId=${itemId}`);
export const addReaction = (_owner, _project, data) => apiPost('/api/reactions', data);
export const updateReaction = (_owner, _project, reactionId) => apiPatch(`/api/reactions/${reactionId}`, {});
export const deleteReaction = (_owner, _project, reactionId) => apiDelete(`/api/reactions/${reactionId}`);
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

export async function getReactions(parentType, parentId) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/reactions?type=${parentType}&itemId=${parentId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function upsertReaction(parentType, parentId, emote) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/reactions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ emote, stackItemType: parentType, stackItemId: parentId })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function deleteReaction(reactionId) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/reactions/${reactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
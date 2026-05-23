import { getAccessToken } from '../auth-state.mjs';
import { base } from '../api.mjs';

export async function getComments(parentType, parentId) {
    const url = `${base}/api/comments?type=${encodeURIComponent(parentType)}&parentId=${parentId}`;
    const token = getAccessToken();
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function postComment(parentType, parentId, text, parentCommentId = null) {
    const url = `${base}/api/comments`;
    const token = getAccessToken();
    const body = JSON.stringify({ text, parentType, parentId, parentCommentId });
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
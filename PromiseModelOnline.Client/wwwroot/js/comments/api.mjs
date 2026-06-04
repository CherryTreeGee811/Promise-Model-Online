import { apiFetch } from '../api.mjs';

export async function getComments(parentType, parentId) {
    const url = `/api/comments?type=${encodeURIComponent(parentType)}&parentId=${parentId}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function postComment(parentType, parentId, text, parentCommentId = null) {
    const body = JSON.stringify({ text, parentType, parentId, parentCommentId });
    const res = await apiFetch('/api/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

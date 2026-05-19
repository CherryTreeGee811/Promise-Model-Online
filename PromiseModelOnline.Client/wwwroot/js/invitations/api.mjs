import { getAccessTokenFromCookie } from '../parser.mjs';
import { base } from '../api.mjs';

export async function getPendingInvitations() {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/permissions/pending`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function acceptInvitation(permissionId) {
    const token = getAccessTokenFromCookie();
    const res = await fetch(`${base}/api/permissions/${permissionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ status: 'Active' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
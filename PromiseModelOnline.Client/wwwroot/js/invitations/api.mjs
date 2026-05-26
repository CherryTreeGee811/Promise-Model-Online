import { authFetch, base } from '../api.mjs';

/*
====================================
PENDING INVITATIONS
====================================
*/

export async function getPendingInvitations() {
    const res = await authFetch(`${base}/api/permissions/pending`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}

/*
====================================
ACCEPT INVITATION
====================================
*/

export async function acceptInvitation(permissionId) {
    const res = await authFetch(`${base}/api/permissions/${permissionId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Active' })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
}
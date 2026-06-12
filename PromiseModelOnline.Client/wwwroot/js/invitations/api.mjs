<<<<<<< HEAD
import { apiGet, apiPatch } from '../api.mjs';

export const getPendingInvitations = () => apiGet('/api/permissions/pending');
export const acceptInvitation = permissionId => apiPatch(`/api/permissions/${permissionId}`, { status: 'Active' });
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

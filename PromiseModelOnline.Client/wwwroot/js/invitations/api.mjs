import { get, patch } from '../api.mjs';

/*
====================================
PENDING INVITATIONS
====================================
*/

export function getPendingInvitations() {
    return get(`/permissions/pending`);
}

/*
====================================
ACCEPT INVITATION
====================================
*/

export function acceptInvitation(permissionId) {
    return patch(`/permissions/${permissionId}`, {
        status: 'Active'
    });
}
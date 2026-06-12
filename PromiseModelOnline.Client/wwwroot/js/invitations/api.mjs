import { apiGet, apiPatch } from '../api.mjs';

export const getPendingInvitations = () => apiGet('/api/permissions/pending');
export const acceptInvitation = permissionId => apiPatch(`/api/permissions/${permissionId}`, { status: 'Active' });

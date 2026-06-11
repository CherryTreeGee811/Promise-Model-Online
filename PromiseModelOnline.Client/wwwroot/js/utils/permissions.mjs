import { getMyPermission } from '../projects/api.mjs';

const PERMISSION_HIERARCHY = { View: 0, Comment: 1, Edit: 2, Owner: 3 };

export function canComment(permissionLevel) {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= PERMISSION_HIERARCHY.Comment;
}

export function canEdit(permissionLevel) {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= PERMISSION_HIERARCHY.Edit;
}

export function isAtLeast(permissionLevel, minimum) {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= (PERMISSION_HIERARCHY[minimum] ?? 0);
}

export async function fetchMyPermission(owner, project) {
    try {
        const data = await getMyPermission(owner, project);
        if (!data) return { permission: null, isOwner: false };
        if (typeof data === 'string') {
            return { permission: data, isOwner: data === 'Owner' };
        }
        return {
            permission: data.permission ?? null,
            isOwner: data.isOwner === true,
        };
    } catch {
        return { permission: null, isOwner: false };
    }
}

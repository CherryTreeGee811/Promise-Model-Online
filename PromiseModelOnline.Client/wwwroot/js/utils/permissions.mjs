import { getMyPermission } from '../projects/api.mjs';

const PERMISSION_HIERARCHY = { View: 0, Comment: 1, Edit: 2, Owner: 3 };

/**
 * Check if a permission level allows commenting.
 * @param {string} permissionLevel - The permission level string.
 * @returns {boolean} True if the user can comment.
 */
export function canComment(permissionLevel) {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= PERMISSION_HIERARCHY.Comment;
}

/**
 * Check if a permission level allows editing.
 * @param {string} permissionLevel - The permission level string.
 * @returns {boolean} True if the user can edit.
 */
export function canEdit(permissionLevel) {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= PERMISSION_HIERARCHY.Edit;
}

/**
 * Check if a permission level meets a minimum threshold.
 * @param {string} permissionLevel - The current permission level.
 * @param {string} minimum - The minimum required level.
 * @returns {boolean} True if the level meets the threshold.
 */
export function isAtLeast(permissionLevel, minimum) {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= (PERMISSION_HIERARCHY[minimum] ?? 0);
}

/**
 * Fetch the current user's permission for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<{permission: string|null, isOwner: boolean}>}
 */
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

import { getMyPermission } from '../projects/api.ts';

const PERMISSION_HIERARCHY: Record<string, number> = { View: 0, Comment: 1, Edit: 2, Owner: 3 };

/**
 * Check whether a permission level is at least "Comment".
 * @param {string} permissionLevel - The user's permission level string.
 * @returns {boolean} True if the user can comment.
 */
/**
 * Check whether a permission level is at least "Edit".
 * @param {string} permissionLevel - The user's permission level string.
 * @returns {boolean} True if the user can edit.
 */
/**
 * Check whether a permission level meets or exceeds a required minimum.
 * @param {string} permissionLevel - The user's permission level string.
 * @param {string} minimum - The required minimum permission level.
 * @returns {boolean} True if the user's level is at least the minimum.
 */
export function isAtLeast(permissionLevel: string, minimum: string): boolean {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= (PERMISSION_HIERARCHY[minimum] ?? 0);
}

interface PermissionResult {
    permission: string | undefined;
    isOwner: boolean;
    [key: string]: unknown;
}

/**
 * Fetch the current user's permission for a project from the API.
 * @param {string} owner - Project owner slug.
 * @param {string} project - Project slug.
 * @returns {Promise<PermissionResult>} A PermissionResult with permission level and owner flag.
 */
export async function fetchMyPermission(owner: string, project: string): Promise<PermissionResult> {
    try {
        const data = await getMyPermission(owner, project);
        if (!data) return { permission: undefined, isOwner: false };
        if (typeof data === 'string') {
            return { permission: data, isOwner: data === 'Owner' };
        }
        return {
            permission: data.permission ?? undefined,
            isOwner: data.isOwner === true,
        };
    } catch {
        return { permission: undefined, isOwner: false };
    }
}

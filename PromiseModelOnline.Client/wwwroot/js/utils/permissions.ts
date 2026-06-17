// @ts-nocheck
import { getMyPermission } from '../projects/api.ts';

const PERMISSION_HIERARCHY: Record<string, number> = { View: 0, Comment: 1, Edit: 2, Owner: 3 };

/**
 * Check whether a permission level is at least "Comment".
 * @param permissionLevel - The user's permission level string.
 * @returns True if the user can comment.
 */
export function canComment(permissionLevel: string): boolean {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= PERMISSION_HIERARCHY.Comment;
}

/**
 * Check whether a permission level is at least "Edit".
 * @param permissionLevel - The user's permission level string.
 * @returns True if the user can edit.
 */
export function canEdit(permissionLevel: string): boolean {
    return (PERMISSION_HIERARCHY[permissionLevel] ?? 0) >= PERMISSION_HIERARCHY.Edit;
}

/**
 * Check whether a permission level meets or exceeds a required minimum.
 * @param permissionLevel - The user's permission level string.
 * @param minimum - The required minimum permission level.
 * @returns True if the user's level is at least the minimum.
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
 * @param owner - Project owner slug.
 * @param project - Project slug.
 * @returns A PermissionResult with permission level and owner flag.
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

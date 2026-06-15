import { getUsername } from './auth-state.mjs';

/**
 * Get the current user's display name from the auth state.
 * @returns {string|null} The display name, or null if not authenticated.
 */
export function getCurrentUserName() {
    return getUsername();
}

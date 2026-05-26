import { patch, del } from '../api.mjs';

/**
 * Change the current user's password.
 */
export function changePassword(currentPassword, newPassword, confirmPassword) {
    return patch(`/users/me`, {
        currentPassword,
        newPassword,
        confirmPassword
    }).then(() => true);
}

/**
 * Delete the current user's account.
 */
export function deleteAccount(password) {
    return del(`/users/me`, {
        password
    }).then(() => true);
}
import { accountApi, logout as bffLogout } from "../api.mjs";

export function changePassword(currentPassword, newPassword, confirmPassword) {
    return accountApi.patch("/me/password", {
        currentPassword,
        newPassword,
        confirmPassword
    }).then(() => true);
}

export function deleteAccount(password) {
    return accountApi.del("/me", {
        password
    }).then(() => true);
}

export function logout() {
    return bffLogout();
}

export async function changePasswordAndLogout(currentPassword, newPassword, confirmPassword) {
    await changePassword(currentPassword, newPassword, confirmPassword);
    await logout();
    return true;
}
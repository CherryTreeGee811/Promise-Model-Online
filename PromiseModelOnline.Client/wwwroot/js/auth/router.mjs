import { loadTemplate } from '../router.mjs';
import { login, handleCallback, logout } from './oidc.mjs';
import { loadChangePasswordForm } from './change-password.mjs';
import { getAccessToken } from './auth-state.mjs';

/**
 * Handles all routes starting with /auth
 */
export function handleAuthRoutes(path, navContentDiv, contentDiv) {

    // ✅ OAuth login (standard)
    if (path === '/auth/login') {
        sessionStorage.setItem("oidc_return_url", "/");
        login();
        return;
    }

    // ✅ OAuth register (same flow, auth decides UI)
    if (path === '/auth/register') {
        sessionStorage.setItem("oidc_return_url", "/");
        login(); // can optionally add prompt param later
        return;
    }

    // ✅ Logout
    if (path === '/auth/logout') {
        logout();
        return;
    }

    // ✅ Callback (OAuth code exchange)
    if (path === '/auth/callback') {
        handleCallback()
            .catch(err => {
                contentDiv.innerHTML = `
                    <h1>Login failed</h1>
                    <p>${err.message}</p>
                `;
            });
        return;
    }

    // ✅ Protected route example
    if (path === '/auth/change-password') {
        if (!getAccessToken()) {
            sessionStorage.setItem("oidc_return_url", path);
            login();
            return;
        }

        loadTemplate("auth/change-password.html", contentDiv)
            .then(() => loadChangePasswordForm(navContentDiv, contentDiv))
            .catch(error => console.error('Error loading change password form:', error));

        return;
    }

    // ✅ fallback
    contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
}
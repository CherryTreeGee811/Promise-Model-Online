import { loadHomePage } from './home.mjs';
import { loadNavTemplate } from './navigation/router.mjs';
import { getAccessToken } from './auth/auth-state.mjs';
import { login, tryRefresh } from './auth/oidc.mjs';
import { handleAuthRoutes } from './auth/router.mjs';
import { handleProjectRoutes } from './projects/router.mjs';
import { handleMomentRoutes } from './moments/router.mjs';
import { handleFlowRoutes } from './flows/router.mjs';
import { handleJourneyRoutes } from './journeys/router.mjs';
import { handleEpicRoutes } from './epics/router.mjs';
import { handlePromiseRoutes } from './promises/router.mjs';
import { handleNotificationsRoutes } from './notifications/router.mjs';
import { handleInvitationsRoute } from './invitations/router.mjs';
import { handleIterationRoutes } from './iterations/router.mjs';
import { getRoleFromToken, getNameFromToken } from './auth/parser.mjs';

document.addEventListener("DOMContentLoaded", async () => {
    const contentDiv = document.getElementById("content");
    const navContentDiv = document.getElementById("main-menu");

    // 1. Silent token refresh
    const path = window.location.pathname;
    const isAuthCallback = path === '/auth/callback';
    if (!getAccessToken() && !isAuthCallback) {
        try {
            const refreshed = await tryRefresh();
            if (!refreshed) { /* will be caught by route guards */ }
        } catch { /* ignore */ }
    }

    // 2. Handle browser back/forward
    window.addEventListener("popstate", () => routeHandler(navContentDiv, contentDiv));

    // 3. Initial route
    routeHandler(navContentDiv, contentDiv);
});

export function loadTemplate(templateName, contentDiv) {
    return fetch(`/templates/${templateName}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            contentDiv.innerHTML = html;
            return Promise.resolve();
        })
        .catch(error => {
            contentDiv.innerHTML = `<h1>Error loading template</h1><p>${error.message}</p>`;
            return Promise.reject(error);
        });
}

export function routeHandler(navContentDiv, contentDiv) {
    let path = window.location.pathname;

    // Delegate all /auth/* routes to the auth router
    if (path.startsWith('/auth')) {
        handleAuthRoutes(path, navContentDiv, contentDiv);
        return;
    }

    loadNavTemplate(navContentDiv, contentDiv);

    function requireAuth() {
        if (!getAccessToken()) {
            sessionStorage.setItem("oidc_return_url", path);
            login();
            return false;
        }
        return true;
    }

    switch (true) {
        case path == '/':
            loadTemplate("home.html", contentDiv).then(() => loadHomePage());
            break;

        case path.startsWith('/projects') && path.includes('/iterations'):
            if (requireAuth()) handleIterationRoutes(path, navContentDiv, contentDiv);
            break;

        case path.startsWith('/projects'):
            if (requireAuth()) handleProjectRoutes(path, navContentDiv, contentDiv);
            break;

        case path.startsWith('/moments/'):
            if (requireAuth()) handleMomentRoutes(path, navContentDiv, contentDiv);
            break;

        case path.startsWith('/flows/'):
            if (requireAuth()) handleFlowRoutes(path, navContentDiv, contentDiv);
            break;

        case path.startsWith('/journeys/'):
            if (requireAuth()) handleJourneyRoutes(path, navContentDiv, contentDiv);
            break;

        case path.startsWith('/epics/'):
            if (requireAuth()) handleEpicRoutes(path, navContentDiv, contentDiv);
            break;

        case path.startsWith('/promises/'):
            if (requireAuth()) handlePromiseRoutes(path, navContentDiv, contentDiv);
            break;

        case path.startsWith('/notifications'):
            if (requireAuth()) handleNotificationsRoutes(path, navContentDiv, contentDiv);
            break;

        case path.startsWith('/invitations'):
            if (requireAuth()) handleInvitationsRoute(path, contentDiv);
            break;

        default:
            contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
    }
}
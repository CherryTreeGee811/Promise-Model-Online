import { loadHomePage } from './home.mjs';
import { loadNavTemplate } from './navigation/router.mjs';

import { handleProjectRoutes } from './projects/router.mjs';
import { handleMomentRoutes } from './moments/router.mjs';
import { handleFlowRoutes } from './flows/router.mjs';
import { handleJourneyRoutes } from './journeys/router.mjs';
import { handleEpicRoutes } from './epics/router.mjs';
import { handlePromiseRoutes } from './promises/router.mjs';
import { handleNotificationsRoutes } from './notifications/router.mjs';
import { handleInvitationsRoute } from './invitations/router.mjs';
import { handleIterationRoutes } from './iterations/router.mjs';
import { isAuthenticated } from './api.mjs';
import { loadChangePasswordForm } from './auth/change-password.mjs';

// ============================
// ✅ INIT
// ============================

document.addEventListener("DOMContentLoaded", async () => {
    const contentDiv = document.getElementById("content");
    const navContentDiv = document.getElementById("main-menu");

    // ✅ Handle browser navigation
    window.addEventListener("popstate", () =>
        routeHandler(navContentDiv, contentDiv)
    );

    // ✅ Initial route
    routeHandler(navContentDiv, contentDiv);
});

// ============================
// ✅ TEMPLATE LOADER
// ============================

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

// ============================
// ✅ ROUTER
// ============================

export async function routeHandler(navContentDiv, contentDiv) {
    let path = window.location.pathname;

    loadNavTemplate(navContentDiv, contentDiv);

    // ✅ BFF-style auth guard
    async function requireAuth(callback) {
        const auth = await isAuthenticated();

        if (!auth) {
            window.location.href = `/login?returnUrl=${encodeURIComponent(path)}`;
            return;
        }

        callback();
    }

    switch (true) {

        case path === '/':
            loadTemplate("home.html", contentDiv)
                .then(() => loadHomePage());
            break;

        case path.startsWith('/projects') && path.includes('/iterations'):
            await requireAuth(() =>
                handleIterationRoutes(path, navContentDiv, contentDiv)
            );
            break;

        case path.startsWith('/projects'):
            await requireAuth(() =>
                handleProjectRoutes(path, navContentDiv, contentDiv)
            );
            break;

        case path.startsWith('/moments/'):
            await requireAuth(() =>
                handleMomentRoutes(path, navContentDiv, contentDiv)
            );
            break;

        case path.startsWith('/flows/'):
            await requireAuth(() =>
                handleFlowRoutes(path, navContentDiv, contentDiv)
            );
            break;

        case path.startsWith('/journeys/'):
            await requireAuth(() =>
                handleJourneyRoutes(path, navContentDiv, contentDiv)
            );
            break;

        case path.startsWith('/epics/'):
            await requireAuth(() =>
                handleEpicRoutes(path, navContentDiv, contentDiv)
            );
            break;

        case path.startsWith('/promises/'):
            await requireAuth(() =>
                handlePromiseRoutes(path, navContentDiv, contentDiv)
            );
            break;

        case path.startsWith('/notifications'):
            await requireAuth(() =>
                handleNotificationsRoutes(path, navContentDiv, contentDiv)
            );
            break;

        case path.startsWith('/invitations'):
            await requireAuth(() =>
                handleInvitationsRoute(path, contentDiv)
            );
            break;
        
        case path === '/change-password':
            await requireAuth(() =>
                loadTemplate("auth/change-password.html", contentDiv)
                    .then(() => loadChangePasswordForm(navContentDiv, contentDiv))
            );
            break;


        default:
            contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
    }
}
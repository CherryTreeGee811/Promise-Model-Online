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
import { escapeHtml } from "./utils/html.mjs";
import { handleKnowledgeBaseRoutes } from './knowledge-base/router.mjs';

// ============================
// ✅ INIT
// ============================

document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById("content");
    const navContentDiv = document.getElementById("main-menu");

    window.addEventListener("popstate", () =>
        routeHandler(navContentDiv, contentDiv)
    );

    routeHandler(navContentDiv, contentDiv);
});

// ============================
// ✅ NAVIGATION API
// ============================

export function navigate(path, navContentDiv, contentDiv) {
    window.history.pushState({}, "", path);
    return routeHandler(navContentDiv, contentDiv);
}

// ============================
// ✅ TEMPLATE LOADER (Async)
// ============================

export async function loadTemplate(templateName, contentDiv) {
    try {
        const response = await fetch(`/templates/${templateName}`, {
            credentials: "same-origin",
            headers: {
                "Accept": "text/html"
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load template: ${templateName}`);
        }

        contentDiv.innerHTML = await response.text();
    } catch (error) {
        contentDiv.innerHTML = `
            <h1>Error loading template</h1>
            <p>${escapeHtml(error.message)}</p>
        `;
        throw error;
    }
}

// ============================
// ✅ AUTH GUARD
// ============================

async function requireAuth(path) {
    const auth = await isAuthenticated();

    if (!auth) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(path)}`;
        return false;
    }

    return true;
}

// ============================
// ✅ ROUTES (DRY + EXTENSIBLE)
// ============================

const routes = [

    {
        match: p => p === '/',
        auth: false,
        handler: async ({ contentDiv }) => {
            await loadTemplate("home.html", contentDiv);
            loadHomePage();
        }
    },

    {
        match: p => p.startsWith('/projects') && p.includes('/iterations'),
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handleIterationRoutes(path, navContentDiv, contentDiv)
    },

    {
        match: p => p.startsWith('/projects'),
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handleProjectRoutes(path, navContentDiv, contentDiv)
    },

    {
        match: p => p.startsWith('/moments'),
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handleMomentRoutes(path, navContentDiv, contentDiv)
    },

    {
        match: p => p.startsWith('/flows'),
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handleFlowRoutes(path, navContentDiv, contentDiv)
    },

    {
        match: p => p.startsWith('/journeys'),
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handleJourneyRoutes(path, navContentDiv, contentDiv)
    },

    {
        match: p => p.startsWith('/epics'),
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handleEpicRoutes(path, navContentDiv, contentDiv)
    },

    {
        match: p => p.startsWith('/promises'),
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handlePromiseRoutes(path, navContentDiv, contentDiv)
    },

    {
        match: p => p.startsWith('/notifications'),
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handleNotificationsRoutes(path, navContentDiv, contentDiv)
    },

    {
        match: p => p.startsWith('/invitations'),
        auth: true,
        handler: ({ path, contentDiv }) =>
            handleInvitationsRoute(path, contentDiv)
    },

    {
        match: p => p === '/change-password',
        auth: true,
        handler: async ({ navContentDiv, contentDiv }) => {
            await loadTemplate("auth/change-password.html", contentDiv);
            loadChangePasswordForm(navContentDiv, contentDiv);
        }
    },
    {
        match: p => p === '/knowledge-base',
        auth: true,
        handler: ({ path, navContentDiv, contentDiv }) =>
            handleKnowledgeBaseRoutes(path, navContentDiv, contentDiv)
    }
];

// ============================
// ✅ ROUTER
// ============================

export async function routeHandler(navContentDiv, contentDiv) {
    const path = window.location.pathname;

    await loadNavTemplate(navContentDiv, contentDiv);

    const route = routes.find(r => r.match(path));

    if (!route) {
        contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
        return;
    }

    if (route.auth) {
        const allowed = await requireAuth(path);
        if (!allowed) return;
    }

    try {
        await route.handler({ path, navContentDiv, contentDiv });
    } catch (err) {
        console.error(err);
        contentDiv.innerHTML = `<h1>Error loading page</h1>`;
    }
}
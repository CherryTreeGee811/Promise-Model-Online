import { loadHomePage } from './home.mjs';
import { loadNavTemplate, initNavEventDelegation } from './navigation/router.mjs';
import { clearAuth, isLoggedIn } from './auth-state.mjs';
import { stopNotificationPolling } from './notifications/badge.mjs';
import { checkSession } from './api.mjs';
import { handleProjectRoutes } from './projects/router.mjs';
import { handleMomentRoutes } from './moments/router.mjs';
import { handleFlowRoutes } from './flows/router.mjs';
import { handleJourneyRoutes } from './journeys/router.mjs';
import { handleEpicRoutes } from './epics/router.mjs';
import { handlePromiseRoutes } from './promises/router.mjs';
import { handleNotificationsRoutes } from './notifications/router.mjs';
import { handleInvitationsRoute } from './invitations/router.mjs';
import { handleIterationRoutes } from './iterations/router.mjs';
import { handleKnowledgeBaseRoutes } from './knowledge-base/router.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.getElementById('content');
    const navContentDiv = document.getElementById('main-menu');

    await checkSession();

    initNavEventDelegation(navContentDiv, contentDiv);

    document.getElementById('home-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate('/', navContentDiv, contentDiv);
    });

    window.addEventListener('popstate', () => {
        routeHandler(navContentDiv, contentDiv);
    });

    routeHandler(navContentDiv, contentDiv);
});

export function navigate(path, navContentDiv, contentDiv) {
    window.history.pushState({}, '', path);
    return routeHandler(navContentDiv, contentDiv);
}

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

    if (path === '/login' || path === '/logout' || path === '/register') {
        window.location.href = path;
        return;
    }

    loadNavTemplate(navContentDiv, contentDiv);

    switch (true) {
        case path == '/':
            loadTemplate('home.html', contentDiv).then(() => {
                return loadHomePage();
            });
            break;
        case path.startsWith('/projects') && path.includes('/iterations'):
            handleIterationRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/projects'):
            handleProjectRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/moments/'):
            handleMomentRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/flows/'):
            handleFlowRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/journeys/'):
            handleJourneyRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/epics/'):
            handleEpicRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/promises/'):
            handlePromiseRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/notifications'):
            handleNotificationsRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/invitations'):
            handleInvitationsRoute(path, contentDiv);
            break;
        case path == '/change-password':
            if (!isLoggedIn()) {
                navigate('/login', navContentDiv, contentDiv);
                break;
            }
            window.location.href = '/account/change-password';
            break;
        case path == '/knowledge-base':
            handleKnowledgeBaseRoutes(path, navContentDiv, contentDiv);
            break;
        default:
            contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
}

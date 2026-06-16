import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadNotificationsPage } from './list.mjs';

/**
 * Handle notification-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 * @returns {void}
 */
export function handleNotificationsRoutes(path, navContentDiv, contentDiv) {
    if (path === '/notifications') {
        loadTemplate('notifications/list.html', contentDiv)
            .then(() => loadNotificationsPage(contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'notifications'));
    } else {
        showNotFound(contentDiv);
    }
}
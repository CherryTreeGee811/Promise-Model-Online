import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.ts';

import { loadNotificationsPage } from './list.ts';

/**
 * Handle notification-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export function handleNotificationsRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    if (path === '/notifications') {
        loadTemplate('notifications/list.html', contentDiv)
            .then(() => loadNotificationsPage(contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'notifications'));
    } else {
        showNotFound(contentDiv);
    }
}

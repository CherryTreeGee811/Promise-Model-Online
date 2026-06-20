import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.ts';

import { loadNotificationsPage } from './list.ts';

/**
 * Handle notification-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} _navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export async function handleNotificationsRoutes(path: string, _navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    if (path === '/notifications') {
        try {
            await loadTemplate('notifications/list.html', contentDiv);
            await loadNotificationsPage(contentDiv);
        } catch {
            await loadTemplateWithError(contentDiv, 'notifications')();
        }
    } else {
        showNotFound(contentDiv);
    }
}

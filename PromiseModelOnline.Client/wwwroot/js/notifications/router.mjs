import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadNotificationsPage } from './list.mjs';

export function handleNotificationsRoutes(path, navContentDiv, contentDiv) {
    if (path === '/notifications') {
        loadTemplate('notifications/list.html', contentDiv)
            .then(() => loadNotificationsPage(contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'notifications'));
    } else {
        showNotFound(contentDiv);
    }
}
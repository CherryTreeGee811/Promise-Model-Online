import { loadTemplate } from '../router.mjs';
import { loadNotificationsPage } from './list.mjs';

export function handleNotificationsRoutes(path, navContentDiv, contentDiv) {
    if (path === '/notifications') {
        loadTemplate('notifications/list.html', contentDiv)
            .then(() => loadNotificationsPage(contentDiv))
            .catch(err => {
                console.error(err);
                contentDiv.innerHTML = '<h1>Error loading notifications</h1>';
            });
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
}
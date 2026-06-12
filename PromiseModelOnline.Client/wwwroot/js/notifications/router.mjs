<<<<<<< HEAD
import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadNotificationsPage } from './list.mjs';

export function handleNotificationsRoutes(path, navContentDiv, contentDiv) {
    if (path === '/notifications') {
        loadTemplate('notifications/list.html', contentDiv)
            .then(() => loadNotificationsPage(contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'notifications'));
    } else {
        showNotFound(contentDiv);
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}
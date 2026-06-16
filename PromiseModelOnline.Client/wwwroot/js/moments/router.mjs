import { loadTemplate, loadTemplateWithError, handleDetailRoute, showNotFound } from '../router.mjs';
import { loadMomentDetail } from './detail.mjs';
import { loadMyTasksPage } from './my-tasks.mjs';

/**
 * Handle moment-related routes, including the my-tasks page and moment detail.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @returns {void}
 */
export function handleMomentRoutes(path, navContentDiv, contentDiv) {
    if (path === '/moments/my-tasks') {
        loadTemplate('moments/my-tasks.html', contentDiv)
            .then(() => loadMyTasksPage(navContentDiv, contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'my tasks'));
        return;
    }

    if (!handleDetailRoute(path, contentDiv, 'moments', 'moments/detail.html', loadMomentDetail, navContentDiv, 'moment')) {
        showNotFound(contentDiv);
    }
}
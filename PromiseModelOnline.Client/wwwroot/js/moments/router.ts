import { loadTemplate, loadTemplateWithError, isDetailRoute, showNotFound } from '../router.ts';

import { loadMomentDetail } from './detail.ts';
import { loadMyTasksPage } from './my-tasks.ts';

/**
 * Handle moment-related routes, including the my-tasks page and moment detail.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 */
export async function handleMomentRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    if (path === '/moments/my-tasks') {
        try {
            await loadTemplate('moments/my-tasks.html', contentDiv);
            await loadMyTasksPage(navContentDiv, contentDiv);
        } catch {
            await loadTemplateWithError(contentDiv, 'my tasks')();
        }
        return;
    }

    if (!isDetailRoute(path, contentDiv, 'moments', 'moments/detail.html', loadMomentDetail, navContentDiv, 'moment')) {
        showNotFound(contentDiv);
    }
}

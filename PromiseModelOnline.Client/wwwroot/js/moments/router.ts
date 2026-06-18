import { loadTemplate, loadTemplateWithError, handleDetailRoute, showNotFound } from '../router.ts';

import { loadMomentDetail } from './detail.ts';
import { loadMyTasksPage } from './my-tasks.ts';

/**
 * Handle moment-related routes, including the my-tasks page and moment detail.
 * @param path - The URL path to match.
 * @param navContentDiv - Navigation container for client-side routing.
 * @param contentDiv - Content container for client-side routing.
 */
export function handleMomentRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
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

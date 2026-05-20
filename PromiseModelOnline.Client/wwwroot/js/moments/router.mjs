import { loadTemplate } from '../router.mjs';
import { loadMomentDetail } from './detail.mjs';
import { loadMyTasksPage } from './my-tasks.mjs';

export function handleMomentRoutes(path, navContentDiv, contentDiv) {
    // Match /moments/my-tasks FIRST to avoid being caught by the generic /moments/{id} pattern
    if (path === '/moments/my-tasks') {
        loadTemplate('moments/my-tasks.html', contentDiv)
            .then(() => loadMyTasksPage(contentDiv))
            .catch(err => {
                console.error('Error loading my tasks:', err);
                contentDiv.innerHTML = '<h1>Error loading my tasks</h1>';
            });
        return;
    }

    // Match /moments/{id}
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 2 && segments[0] === 'moments') {
        const momentId = segments[1];
        loadTemplate('moments/detail.html', contentDiv)
            .then(() => loadMomentDetail(momentId, contentDiv))
            .catch(err => {
                console.error('Error loading moment detail:', err);
                contentDiv.innerHTML = '<h1>Error loading moment</h1>';
            });
        return;
    }

    contentDiv.innerHTML = '<h1>404 Not Found</h1>';
}
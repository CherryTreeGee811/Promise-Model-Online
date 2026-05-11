import { loadTemplate } from '../router.mjs';
import { loadEpicDetail } from './detail.mjs';

export function handleEpicRoutes(path, navContentDiv, contentDiv) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 2 && segments[0] === 'epics') {
        const epicId = segments[1];
        loadTemplate('epics/detail.html', contentDiv)
            .then(() => loadEpicDetail(epicId, contentDiv))
            .catch(err => {
                console.error('Error loading epic detail:', err);
                contentDiv.innerHTML = '<h1>Error loading epic</h1>';
            });
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
}
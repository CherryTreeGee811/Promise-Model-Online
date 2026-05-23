import { loadTemplate } from '../router.mjs';
import { loadPromiseDetail } from './detail.mjs';

export function handlePromiseRoutes(path, navContentDiv, contentDiv) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 2 && segments[0] === 'promises') {
        const promiseId = segments[1];
        loadTemplate('promises/detail.html', contentDiv)
            .then(() => loadPromiseDetail(promiseId, navContentDiv, contentDiv))
            .catch(err => {
                console.error('Error loading promise detail:', err);
                contentDiv.innerHTML = '<h1>Error loading promise</h1>';
            });
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
}
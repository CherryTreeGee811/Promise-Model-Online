import { loadTemplate } from '../router.mjs';
import { loadMomentDetail } from './detail.mjs';

/**
 * Handles routes under /moments/...
 * Currently supports viewing a single moment: /moments/{id}
 */
export function handleMomentRoutes(path, navContentDiv, contentDiv) {
    const segments = path.split('/').filter(Boolean); // e.g. ["moments", "42"]
    if (segments.length === 2 && segments[0] === 'moments') {
        const momentId = segments[1];
        loadTemplate('moments/detail.html', contentDiv)
            .then(() => loadMomentDetail(momentId, contentDiv))
            .catch(err => {
                console.error('Error loading moment detail:', err);
                contentDiv.innerHTML = '<h1>Error loading moment</h1>';
            });
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
}
import { loadTemplate } from '../router.mjs';
import { loadIterationHistory } from './list.mjs';

/**
 * Handles all iteration-related routes.
 * 
 * Supported routes:
 *  - /projects/:projectId/iterations
 */
export function handleIterationRoutes(path, navContentDiv, contentDiv) {
    const match = path.match(/^\/projects\/(\d+)\/iterations$/);

    if (match) {
        const projectId = parseInt(match[1], 10);

        return loadTemplate('iteration-history.html', contentDiv)
            .then(() => {
                loadIterationHistory(projectId);
            })
            .catch(err => {
                console.error('Failed to load iteration history page', err);
                contentDiv.innerHTML = '<h1>Error loading iteration history</h1>';
            });
    }
}
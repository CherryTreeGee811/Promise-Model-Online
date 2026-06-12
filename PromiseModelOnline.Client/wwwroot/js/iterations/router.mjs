<<<<<<< HEAD
import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadIterationHistory } from './list.mjs';

export function handleIterationRoutes(path, navContentDiv, contentDiv) {
    const match = path.match(/^\/projects\/(\d+)\/iterations$/);
    if (match) {
        loadTemplate('iterations/list.html', contentDiv)
            .then(() => loadIterationHistory(parseInt(match[1], 10)))
            .catch(loadTemplateWithError(contentDiv, 'iteration history'));
    } else {
        showNotFound(contentDiv);
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}
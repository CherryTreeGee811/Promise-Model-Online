import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadIterationHistory } from './list.mjs';

/**
 * Handle iteration-related routes.
 * @param {*} path - TODO
 * @param {*} navContentDiv - TODO
 * @param {*} contentDiv - TODO
 */
export function handleIterationRoutes(path, navContentDiv, contentDiv) {
    const match = path.match(/^\/projects\/(\d+)\/iterations$/);
    if (match) {
        loadTemplate('iterations/list.html', contentDiv)
            .then(() => loadIterationHistory(parseInt(match[1], 10)))
            .catch(loadTemplateWithError(contentDiv, 'iteration history'));
    } else {
        showNotFound(contentDiv);
    }
}
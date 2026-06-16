import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadIterationHistory } from './list.mjs';

/**
 * Handle iteration-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 * @returns {void}
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
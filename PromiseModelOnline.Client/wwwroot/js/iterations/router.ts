import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.ts';

import { loadIterationHistory } from './list.ts';

/**
 * Handle iteration-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export function handleIterationRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const match = path.match(/^\/projects\/(\d+)\/iterations$/);
    if (match) {
        loadTemplate('iterations/list.html', contentDiv)
            .then(() => (loadIterationHistory as any)(parseInt(match[1], 10)))
            .catch(loadTemplateWithError(contentDiv, 'iteration history'));
    } else {
        showNotFound(contentDiv);
    }
}

import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.ts';

import { loadIterationHistory } from './list.ts';

/**
 * Handle iteration-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export async function handleIterationRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const match = /^\/projects\/(\d+)\/iterations$/.exec(path);
    if (match) {
        try {
            await loadTemplate('iterations/list.html', contentDiv);
            (loadIterationHistory as any)(parseInt(match[1], 10));
        } catch {
            await loadTemplateWithError(contentDiv, 'iteration history')();
        }
    } else {
        showNotFound(contentDiv);
    }
}

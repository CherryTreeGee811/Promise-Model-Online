import { loadTemplate, loadTemplateWithError } from '../router.ts';

import { loadStridesList } from './list.ts';

/**
 * Load the strides page for a given route.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {Record<string, unknown>} permission - The user's permission object.
 */
export async function loadStridesPage(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: Record<string, unknown>): Promise<void> {
    try {
        await loadTemplate('strides/list.html', contentDiv);
        await loadStridesList(owner, project, navContentDiv, contentDiv, permission);
    } catch {
        void (async () => { try { await loadTemplateWithError(contentDiv, 'strides')(); } catch (error) { dispatchEvent(new ErrorEvent('error', { message: String(error) })); } })();
    }
}

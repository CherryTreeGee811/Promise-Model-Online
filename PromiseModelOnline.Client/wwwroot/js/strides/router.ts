import { loadTemplate, loadTemplateWithError } from '../router.ts';

import { loadStridesList } from './list.ts';

/**
 * Load the strides page for a given route.
 * @param owner - The owner (username or organization).
 * @param project - The project slug.
 * @param navContentDiv - The navigation content container.
 * @param contentDiv - The main content container.
 * @param permission - The user's permission object.
 */
export function loadStridesPage(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: Record<string, unknown>): void {
    loadTemplate('strides/list.html', contentDiv)
        .then(() => loadStridesList(owner, project, navContentDiv, contentDiv, permission))
        .catch(loadTemplateWithError(contentDiv, 'strides'));
}

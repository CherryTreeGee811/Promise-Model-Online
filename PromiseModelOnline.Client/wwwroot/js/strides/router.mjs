import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadStridesList } from './list.mjs';

/**
 * Load the strides page for a given route.
 * @param {string} owner - The owner (username or organization).
 * @param {string} project - The project slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {Object} permission - The user's permission object.
 */
export function loadStridesPage(owner, project, navContentDiv, contentDiv, permission) {
    loadTemplate('strides/list.html', contentDiv)
        .then(() => loadStridesList(owner, project, navContentDiv, contentDiv, permission))
        .catch(loadTemplateWithError(contentDiv, 'strides'));
}
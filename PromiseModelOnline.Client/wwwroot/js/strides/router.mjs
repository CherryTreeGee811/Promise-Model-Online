import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadStridesList } from './list.mjs';

/**
 * Load the strides page for a given route.
 * @param {*} path - TODO
 * @param {*} navContentDiv - TODO
 * @param {*} contentDiv - TODO
 */
export function loadStridesPage(owner, project, navContentDiv, contentDiv, permission) {
    loadTemplate('strides/list.html', contentDiv)
        .then(() => loadStridesList(owner, project, navContentDiv, contentDiv, permission))
        .catch(loadTemplateWithError(contentDiv, 'strides'));
}
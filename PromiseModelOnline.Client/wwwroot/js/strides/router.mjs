import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadStridesList } from './list.mjs';

export function loadStridesPage(owner, project, navContentDiv, contentDiv, permission) {
    loadTemplate('strides/list.html', contentDiv)
        .then(() => loadStridesList(owner, project, navContentDiv, contentDiv, permission))
        .catch(loadTemplateWithError(contentDiv, 'strides'));
}
import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadStridesList } from './list.mjs';

export function loadStridesPage(owner, project, navContentDiv, contentDiv) {
    loadTemplate('strides/list.html', contentDiv)
        .then(() => loadStridesList(owner, project, navContentDiv, contentDiv))
        .catch(loadTemplateWithError(contentDiv, 'strides'));
}
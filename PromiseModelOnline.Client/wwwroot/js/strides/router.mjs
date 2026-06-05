import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadStridesList } from './list.mjs';

export function loadStridesPage(projectId, navContentDiv, contentDiv) {
    loadTemplate('strides/list.html', contentDiv)
        .then(() => loadStridesList(projectId, navContentDiv, contentDiv))
        .catch(loadTemplateWithError(contentDiv, 'strides'));
}
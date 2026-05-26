import { loadTemplate } from '../router.mjs';
import { loadStridesList } from './list.mjs';

export function loadStridesPage(projectId, navContentDiv, contentDiv) {
    loadTemplate('strides/list.html', contentDiv)
        .then(() => {
            loadStridesList(projectId, navContentDiv, contentDiv);
        })
        .catch(err => {
            console.error('Error loading strides template:', err);
            contentDiv.innerHTML = '<h1>Error loading page</h1>';
        });
}
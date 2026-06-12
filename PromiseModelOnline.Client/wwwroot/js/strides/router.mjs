<<<<<<< HEAD
import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadStridesList } from './list.mjs';

export function loadStridesPage(owner, project, navContentDiv, contentDiv, permission) {
    loadTemplate('strides/list.html', contentDiv)
        .then(() => loadStridesList(owner, project, navContentDiv, contentDiv, permission))
        .catch(loadTemplateWithError(contentDiv, 'strides'));
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
}
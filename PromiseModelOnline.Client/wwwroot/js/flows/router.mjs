<<<<<<< HEAD
import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadFlowDetail } from './detail.mjs';

export function handleFlowRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'flows', 'flows/detail.html', loadFlowDetail, navContentDiv, 'flow')) {
    showNotFound(contentDiv);
  }
||||||| 1bedf4f
=======
import { loadTemplate } from '../router.mjs';
import { loadFlowDetail } from './detail.mjs';

export function handleFlowRoutes(path, navContentDiv, contentDiv) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 2 && segments[0] === 'flows') {
        const flowId = segments[1];
        loadTemplate('flows/detail.html', contentDiv)
            .then(() => loadFlowDetail(flowId, navContentDiv, contentDiv))
            .catch(err => {
                console.error('Error loading flow detail:', err);
                contentDiv.innerHTML = '<h1>Error loading flow</h1>';
            });
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
}
<<<<<<< HEAD
import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadPromiseDetail } from './detail.mjs';

export function handlePromiseRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'promises', 'promises/detail.html', loadPromiseDetail, navContentDiv, 'promise')) {
    showNotFound(contentDiv);
  }
||||||| 1bedf4f
=======
import { loadTemplate } from '../router.mjs';
import { loadPromiseDetail } from './detail.mjs';

export function handlePromiseRoutes(path, navContentDiv, contentDiv) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 2 && segments[0] === 'promises') {
        const promiseId = segments[1];
        loadTemplate('promises/detail.html', contentDiv)
            .then(() => loadPromiseDetail(promiseId, navContentDiv, contentDiv))
            .catch(err => {
                console.error('Error loading promise detail:', err);
                contentDiv.innerHTML = '<h1>Error loading promise</h1>';
            });
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
}
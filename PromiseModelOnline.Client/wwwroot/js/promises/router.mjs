import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadPromiseDetail } from './detail.mjs';

export function handlePromiseRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'promises', 'promises/detail.html', loadPromiseDetail, navContentDiv, 'promise')) {
    showNotFound(contentDiv);
  }
}
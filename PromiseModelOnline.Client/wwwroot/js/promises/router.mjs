import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadPromiseDetail } from './detail.mjs';

/**
 * Handle promise-related routes.
 * @param {*} path - TODO
 * @param {*} navContentDiv - TODO
 * @param {*} contentDiv - TODO
 */
export function handlePromiseRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'promises', 'promises/detail.html', loadPromiseDetail, navContentDiv, 'promise')) {
    showNotFound(contentDiv);
  }
}
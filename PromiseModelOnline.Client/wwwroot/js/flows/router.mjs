import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadFlowDetail } from './detail.mjs';

/**
 * Handle flow-related routes.
 * @param {*} path - TODO
 * @param {*} navContentDiv - TODO
 * @param {*} contentDiv - TODO
 */
export function handleFlowRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'flows', 'flows/detail.html', loadFlowDetail, navContentDiv, 'flow')) {
    showNotFound(contentDiv);
  }
}
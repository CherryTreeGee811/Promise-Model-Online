import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadPromiseDetail } from './detail.mjs';

/**
 * Handle promise-related routes by delegating to the shared route handler.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @returns {void}
 */
export function handlePromiseRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'promises', 'promises/detail.html', loadPromiseDetail, navContentDiv, 'promise')) {
    showNotFound(contentDiv);
  }
}
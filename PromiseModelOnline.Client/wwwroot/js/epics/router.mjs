import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadEpicDetail } from './detail.mjs';

/**
 * Handle epic-related routes by delegating to the shared route handler.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @returns {void}
 */
export function handleEpicRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'epics', 'epics/detail.html', loadEpicDetail, navContentDiv, 'epic')) {
    showNotFound(contentDiv);
  }
}
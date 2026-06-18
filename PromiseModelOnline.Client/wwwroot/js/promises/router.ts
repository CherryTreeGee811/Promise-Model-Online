import { handleDetailRoute, showNotFound } from '../router.ts';

import { loadPromiseDetail } from './detail.ts';

/**
 * Handle promise-related routes by delegating to the shared route handler.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 */
export function handlePromiseRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
  if (!handleDetailRoute(path, contentDiv, 'promises', 'promises/detail.html', loadPromiseDetail, navContentDiv, 'promise')) {
    showNotFound(contentDiv);
  }
}

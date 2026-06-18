import { isDetailRoute, showNotFound } from '../router.ts';

import { loadFlowDetail } from './detail.ts';

/**
 * Handle flow-related routes by delegating to the shared route handler.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 */
export function handleFlowRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
  if (!isDetailRoute(path, contentDiv, 'flows', 'flows/detail.html', loadFlowDetail, navContentDiv, 'flow')) {
    showNotFound(contentDiv);
  }
}

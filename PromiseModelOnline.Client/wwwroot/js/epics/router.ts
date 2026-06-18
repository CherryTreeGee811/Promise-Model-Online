import { handleDetailRoute, showNotFound } from '../router.ts';

import { loadEpicDetail } from './detail.ts';

/**
 * Handle epic-related routes by delegating to the shared route handler.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 */
export function handleEpicRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
  if (!handleDetailRoute(path, contentDiv, 'epics', 'epics/detail.html', loadEpicDetail, navContentDiv, 'epic')) {
    showNotFound(contentDiv);
  }
}

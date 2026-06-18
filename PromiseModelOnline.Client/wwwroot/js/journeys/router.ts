import { handleDetailRoute, showNotFound } from '../router.ts';

import { loadJourneyDetail } from './detail.ts';

/**
 * Handle journey-related routes by delegating to the shared route handler.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 */
export function handleJourneyRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
  if (!handleDetailRoute(path, contentDiv, 'journeys', 'journeys/detail.html', loadJourneyDetail, navContentDiv, 'journey')) {
    showNotFound(contentDiv);
  }
}

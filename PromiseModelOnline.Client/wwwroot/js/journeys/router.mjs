import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadJourneyDetail } from './detail.mjs';

/**
 * Handle journey-related routes by delegating to the shared route handler.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @returns {void}
 */
export function handleJourneyRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'journeys', 'journeys/detail.html', loadJourneyDetail, navContentDiv, 'journey')) {
    showNotFound(contentDiv);
  }
}
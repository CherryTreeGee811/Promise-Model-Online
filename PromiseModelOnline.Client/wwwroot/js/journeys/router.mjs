import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadJourneyDetail } from './detail.mjs';

/**
 * Handle journey-related routes.
 * @param {*} path - TODO
 * @param {*} navContentDiv - TODO
 * @param {*} contentDiv - TODO
 */
export function handleJourneyRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'journeys', 'journeys/detail.html', loadJourneyDetail, navContentDiv, 'journey')) {
    showNotFound(contentDiv);
  }
}
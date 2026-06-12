import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadJourneyDetail } from './detail.mjs';

export function handleJourneyRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'journeys', 'journeys/detail.html', loadJourneyDetail, navContentDiv, 'journey')) {
    showNotFound(contentDiv);
  }
}
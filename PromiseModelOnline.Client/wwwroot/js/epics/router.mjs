import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadEpicDetail } from './detail.mjs';

export function handleEpicRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'epics', 'epics/detail.html', loadEpicDetail, navContentDiv, 'epic')) {
    showNotFound(contentDiv);
  }
}
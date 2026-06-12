import { handleDetailRoute, showNotFound } from '../router.mjs';
import { loadFlowDetail } from './detail.mjs';

export function handleFlowRoutes(path, navContentDiv, contentDiv) {
  if (!handleDetailRoute(path, contentDiv, 'flows', 'flows/detail.html', loadFlowDetail, navContentDiv, 'flow')) {
    showNotFound(contentDiv);
  }
}
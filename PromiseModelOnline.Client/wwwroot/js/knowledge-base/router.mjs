import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadKnowledgeBase } from './detail.mjs';

/**
 * Handle knowledge-base-related routes.
 * @param {*} path - TODO
 * @param {*} navContentDiv - TODO
 * @param {*} contentDiv - TODO
 */
export function handleKnowledgeBaseRoutes(path, navContentDiv, contentDiv) {
    loadTemplate("knowledge-base.html", contentDiv)
        .then(() => loadKnowledgeBase())
        .catch(loadTemplateWithError(contentDiv, 'knowledge base'));
}

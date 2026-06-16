import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadKnowledgeBase } from './detail.mjs';

/**
 * Handle knowledge-base-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 * @returns {void}
 */
export function handleKnowledgeBaseRoutes(path, navContentDiv, contentDiv) {
    loadTemplate("knowledge-base.html", contentDiv)
        .then(() => loadKnowledgeBase())
        .catch(loadTemplateWithError(contentDiv, 'knowledge base'));
}

import { loadTemplate, loadTemplateWithError } from '../router.ts';

import { loadKnowledgeBase } from './detail.ts';

/**
 * Handle knowledge-base-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export function handleKnowledgeBaseRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    loadTemplate("knowledge-base.html", contentDiv)
        .then(() => loadKnowledgeBase())
        .catch(loadTemplateWithError(contentDiv, 'knowledge base'));
}

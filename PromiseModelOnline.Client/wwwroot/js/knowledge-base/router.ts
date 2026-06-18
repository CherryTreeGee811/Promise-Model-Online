import { loadTemplate, loadTemplateWithError } from '../router.ts';

import { loadKnowledgeBase } from './detail.ts';

/**
 * Handle knowledge-base-related routes.
 * @param path - The URL path to match.
 * @param navContentDiv - The navigation content container element.
 * @param contentDiv - The main content container element.
 */
export function handleKnowledgeBaseRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    loadTemplate("knowledge-base.html", contentDiv)
        .then(() => loadKnowledgeBase())
        .catch(loadTemplateWithError(contentDiv, 'knowledge base'));
}

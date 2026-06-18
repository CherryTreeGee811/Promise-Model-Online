import { loadTemplate, loadTemplateWithError } from '../router.ts';

import { loadKnowledgeBase } from './detail.ts';

/**
 * Handle knowledge-base-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export async function handleKnowledgeBaseRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        await loadTemplate("knowledge-base.html", contentDiv);
        await loadKnowledgeBase();
    } catch {
        await loadTemplateWithError(contentDiv, 'knowledge base')();
    }
}

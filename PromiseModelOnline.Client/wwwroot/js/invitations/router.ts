import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.ts';

import { loadInvitationsPage } from './list.ts';

/**
 * Handle invitation-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export async function handleInvitationsRoute(path: string, contentDiv: HTMLElement): Promise<void> {
    if (path === '/invitations') {
        try {
            await loadTemplate('invitations/list.html', contentDiv);
            loadInvitationsPage(contentDiv);
        } catch {
            await loadTemplateWithError(contentDiv, 'invitations')();
        }
    } else {
        showNotFound(contentDiv);
    }
}

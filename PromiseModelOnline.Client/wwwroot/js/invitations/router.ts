import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.ts';

import { loadInvitationsPage } from './list.ts';

/**
 * Handle invitation-related routes.
 * @param path - The URL path to match.
 * @param contentDiv - The main content container element.
 */
export function handleInvitationsRoute(path: string, contentDiv: HTMLElement): void {
    if (path === '/invitations') {
        loadTemplate('invitations/list.html', contentDiv)
            .then(() => loadInvitationsPage(contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'invitations'));
    } else {
        showNotFound(contentDiv);
    }
}

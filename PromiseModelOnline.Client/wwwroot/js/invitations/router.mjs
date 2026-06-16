import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadInvitationsPage } from './list.mjs';

/**
 * Handle invitation-related routes.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} contentDiv - The main content container element.
 * @returns {void}
 */
export function handleInvitationsRoute(path, contentDiv) {
    if (path === '/invitations') {
        loadTemplate('invitations/list.html', contentDiv)
            .then(() => loadInvitationsPage(contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'invitations'));
    } else {
        showNotFound(contentDiv);
    }
}
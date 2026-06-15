import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadInvitationsPage } from './list.mjs';

/**
 * Handle invitation-related routes.
 * @param {*} path - TODO
 * @param {*} contentDiv - TODO
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
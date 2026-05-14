import { loadTemplate } from '../router.mjs';
import { loadInvitationsPage } from './list.mjs';

export function handleInvitationsRoute(path, contentDiv) {
    if (path === '/invitations') {
        loadTemplate('invitations/list.html', contentDiv)
            .then(() => loadInvitationsPage(contentDiv))
            .catch(err => {
                console.error(err);
                contentDiv.innerHTML = '<h1>Error loading invitations</h1>';
            });
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
}
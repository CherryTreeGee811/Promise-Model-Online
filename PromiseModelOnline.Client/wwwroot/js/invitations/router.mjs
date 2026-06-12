<<<<<<< HEAD
import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadInvitationsPage } from './list.mjs';

export function handleInvitationsRoute(path, contentDiv) {
    if (path === '/invitations') {
        loadTemplate('invitations/list.html', contentDiv)
            .then(() => loadInvitationsPage(contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'invitations'));
    } else {
        showNotFound(contentDiv);
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}
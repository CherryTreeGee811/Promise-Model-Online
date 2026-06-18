// @ts-nocheck
import { renderEmptyStateSection } from '../utils/empty-table.ts';
import { escapeHtml } from '../utils/html.ts';

import { getPendingInvitations, acceptInvitation } from './api.ts';

/**
 * Load the invitations listing page.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export function loadInvitationsPage(contentDiv) {
    const listDiv = /** @type {HTMLElement} */ (document.getElementById('invitations-list'));
    const errorEl = /** @type {HTMLElement} */ (document.getElementById('error-text'));

    /** Fetch and render pending invitations. */
    async function refresh() {
        try {
            const invitations = await getPendingInvitations();

            if (!invitations || invitations.length === 0) {
                listDiv.innerHTML = renderEmptyStateSection({
                    icon: 'bi-envelope',
                    title: 'No pending invitations.',
                    description: 'When someone invites you to a project, it will appear here.',
                });
                return;
            }

            listDiv.innerHTML = `
                <table class="table table-sm table-striped table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Permission</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invitations.map(inv => `
                            <tr>
                                <td>${escapeHtml(inv.projectName)}</td>
                                <td>${inv.level}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary accept-btn" data-permission-id="${inv.permissionId}" type="button">Accept</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            document.querySelectorAll('.accept-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = parseInt(/** @type {string} */(btn.dataset.permissionId), 10);
                    try {
                        await acceptInvitation(id);
                        const y = window.scrollY;
                        const row = btn.closest('tr');
                        row?.remove();

                        const remaining = listDiv.querySelectorAll('tbody tr').length;
                        if (remaining === 0) {
                            listDiv.innerHTML = renderEmptyStateSection({
                                icon: 'bi-envelope',
                                title: 'No pending invitations.',
                                description: 'When someone invites you to a project, it will appear here.',
                            });
                        }
                        window.scrollTo(0, y);
                    } catch (err) {
                        alert('Failed to accept invitation');
                        console.error(err);
                    }
                });
            });
        } catch (err) {
            errorEl.textContent = 'Failed to load invitations.';
        }
    }

    refresh();
}

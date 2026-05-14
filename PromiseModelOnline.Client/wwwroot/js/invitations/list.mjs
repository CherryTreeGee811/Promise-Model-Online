import { getPendingInvitations, acceptInvitation } from './api.mjs';

export function loadInvitationsPage(contentDiv) {
    const listDiv = document.getElementById('invitations-list');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    async function refresh() {
        loadingEl.textContent = 'Loading invitations…';
        try {
            const invitations = await getPendingInvitations();
            loadingEl.textContent = '';
            if (!invitations || invitations.length === 0) {
                listDiv.innerHTML = '<p class="no-items">No pending invitations.</p>';
                return;
            }

            listDiv.innerHTML = `
                <table class="promisemodel-table">
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
                                    <button class="accept-btn" data-permission-id="${inv.permissionId}">Accept</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            document.querySelectorAll('.accept-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = parseInt(btn.dataset.permissionId, 10);
                    try {
                        await acceptInvitation(id);
                        refresh(); // reload list
                    } catch (err) {
                        alert('Failed to accept invitation');
                        console.error(err);
                    }
                });
            });
        } catch (err) {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load invitations.';
        }
    }

    refresh();
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}
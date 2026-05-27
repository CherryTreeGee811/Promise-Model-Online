import { getPendingInvitations, acceptInvitation } from './api.mjs';

export function loadInvitationsPage(contentDiv) {
    const listDiv = document.getElementById('invitations-list');
    const errorEl = document.getElementById('error-text');
    

    async function refresh() {
        try {
            const invitations = await getPendingInvitations();
            
            if (!invitations || invitations.length === 0) {
                listDiv.innerHTML = '<p class="no-items">No pending invitations.</p>';
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
                    const id = parseInt(btn.dataset.permissionId, 10);
                    try {
                        await acceptInvitation(id);
                        // Inline DOM update (no full list reload)
                        const y = window.scrollY;
                        const row = btn.closest('tr');
                        row?.remove();

                        const remaining = listDiv.querySelectorAll('tbody tr').length;
                        if (remaining === 0) {
                            listDiv.innerHTML = '<p class="no-items">No pending invitations.</p>';
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

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}
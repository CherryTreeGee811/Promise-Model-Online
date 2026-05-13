import { getProjectPermissions, inviteUserToProject, revokePermission } from './api.mjs';

export function loadSharePage(projectId, contentDiv) {
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');
    const successEl = document.getElementById('success-text');
    const section = document.getElementById('permissions-section');

    async function refreshPermissions() {
        try {
            const permissions = await getProjectPermissions(projectId);
            loadingEl.textContent = '';
            successEl.textContent = '';
            section.innerHTML = `
                <h2>Current Permissions</h2>
                <table class="promisemodel-table">
                    <thead><tr><th>User</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>${permissions.map(p => `
                        <tr>
                            <td>${escapeHtml(p.userName)}</td>
                            <td>${p.level}</td>
                            <td>${p.status}</td>
                            <td><button class="revoke-btn" data-permission-id="${p.id}">Revoke</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
                <h3>Invite a User</h3>
                <form id="invite-form">
                    <label>Email: <input type="email" id="invite-email" required></label>
                    <label>Permission:
                        <select id="invite-level">
                            <option value="View">View</option>
                            <option value="Comment">Comment</option>
                            <option value="Edit">Edit</option>
                        </select>
                    </label>
                    <button type="submit" class="view-btn">Send Invitation</button>
                </form>`;

            document.querySelectorAll('.revoke-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = parseInt(btn.dataset.permissionId);
                    if (confirm('Revoke this permission?')) {
                        await revokePermission(id);
                        refreshPermissions();
                    }
                });
            });
            document.getElementById('invite-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('invite-email').value.trim();
                const level = document.getElementById('invite-level').value;
                if (!email) return;
                try {
                    await inviteUserToProject(email, projectId, level);
                    successEl.textContent = 'Invitation sent.';
                    refreshPermissions();
                } catch (err) {
                    errorEl.textContent = 'Failed to invite user: ' + err.message;
                }
            });
        } catch (err) {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load permissions.';
        }
    }
    refreshPermissions();
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
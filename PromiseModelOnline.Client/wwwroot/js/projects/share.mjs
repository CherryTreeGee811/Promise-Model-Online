import { getProjectPermissions, inviteUserToProject, revokePermission } from './api.mjs';

export function loadSharePage(projectId, contentDiv) {
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');
    const successEl = document.getElementById('success-text');
    const section = document.getElementById('permissions-section');

    function bindRevokeButton(btn) {
        if (!btn || btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.permissionId);
            if (!Number.isFinite(id)) return;
            if (!confirm('Revoke this permission?')) return;
            try {
                await revokePermission(id);
                const y = window.scrollY;
                btn.closest('tr')?.remove();
                successEl.textContent = 'Permission revoked.';
                window.scrollTo(0, y);
            } catch (err) {
                errorEl.textContent = 'Failed to revoke permission.';
                console.error(err);
            }
        });
    }

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
                        <tr data-permission-id="${p.id}">
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
                bindRevokeButton(btn);
            });
            document.getElementById('invite-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('invite-email').value.trim();
                const level = document.getElementById('invite-level').value;
                if (!email) return;
                try {
                    const created = await inviteUserToProject(email, projectId, level);
                    const tbody = section.querySelector('table.promisemodel-table tbody');
                    if (tbody && created) {
                        const y = window.scrollY;
                        const row = document.createElement('tr');
                        row.dataset.permissionId = created.id;
                        row.innerHTML = `
                            <td>${escapeHtml(created.userName)}</td>
                            <td>${created.level}</td>
                            <td>${created.status}</td>
                            <td><button class="revoke-btn" data-permission-id="${created.id}">Revoke</button></td>
                        `;
                        tbody.appendChild(row);
                        bindRevokeButton(row.querySelector('.revoke-btn'));
                        window.scrollTo(0, y);
                    }
                    successEl.textContent = 'Invitation sent.';
                    document.getElementById('invite-email').value = '';
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
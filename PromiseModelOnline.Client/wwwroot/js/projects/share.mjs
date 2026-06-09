import { getPermissions, inviteUser, removePermission } from './api.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { renderEmptyTableRow } from '../utils/empty-table.mjs';

export function loadSharePage(owner, project, contentDiv) {
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
                await removePermission(owner, project, id);
                const y = window.scrollY;
                btn.closest('tr')?.remove();
                successEl.textContent = 'Permission revoked.';
                successEl.classList.remove('d-none');
                window.scrollTo(0, y);
            } catch (err) {
                errorEl.textContent = 'Failed to revoke permission.';
                errorEl.classList.remove('d-none');
                console.error(err);
            }
        });
    }

    async function refreshPermissions() {
            try {
                const permissions = await getPermissions(owner, project);
                loadingEl.classList.add('d-none');
                errorEl.classList.add('d-none');
                successEl.classList.add('d-none');
                const tbodyHtml = permissions && permissions.length > 0
                    ? permissions.map(p => `
                        <tr data-permission-id="${p.id}">
                            <td>${escapeHtml(p.userName)}</td>
                            <td>${p.level}</td>
                            <td>${p.status}</td>
                            <td><button class="btn btn-outline-danger btn-sm revoke-btn" data-permission-id="${p.id}">Revoke</button></td>
                        </tr>`).join('')
                    : renderEmptyTableRow({
                        icon: 'bi-share',
                        title: 'No permissions configured',
                        description: 'Invite a user above to share this project.',
                        colspan: 4,
                    });

                section.innerHTML = `
                <h2>Current Permissions</h2>
                <table class="table table-striped table-sm promisemodel-table">
                    <thead><tr><th>User</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>${tbodyHtml}</tbody>
                </table>
                <h3 class="mt-4">Invite a User</h3>
                <form id="invite-form" class="row g-2 align-items-center">
                    <div class="col-auto">
                        <label class="visually-hidden" for="invite-email">Email</label>
                        <input type="email" id="invite-email" class="form-control form-control-sm" placeholder="email@example.com" required>
                    </div>
                    <div class="col-auto">
                        <label class="visually-hidden" for="invite-level">Permission</label>
                        <select id="invite-level" class="form-select form-select-sm">
                            <option value="View">View</option>
                            <option value="Comment">Comment</option>
                            <option value="Edit">Edit</option>
                        </select>
                    </div>
                    <div class="col-auto">
                        <button type="submit" class="btn btn-primary btn-sm">Send Invitation</button>
                    </div>
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
                    const created = await inviteUser(owner, project, { email, level });
                    const tbody = section.querySelector('table.promisemodel-table tbody');
                    if (tbody && created) {
                        tbody.querySelector('.inline-table-empty-row')?.remove();
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
                    successEl.classList.remove('d-none');
                    document.getElementById('invite-email').value = '';
                } catch (err) {
                    errorEl.textContent = 'Failed to invite user: ' + (err.message || err);
                    errorEl.classList.remove('d-none');
                }
            });
        } catch (err) {
            loadingEl.classList.add('d-none');
            errorEl.textContent = 'Failed to load permissions.';
            errorEl.classList.remove('d-none');
        }
    }
    refreshPermissions();
}

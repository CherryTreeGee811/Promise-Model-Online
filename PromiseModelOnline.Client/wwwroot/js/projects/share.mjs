import { getPermissions, inviteUser, removePermission, searchUsers } from './api.mjs';
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

    let acState = { items: [], highlightedIndex: -1, open: false };

    function closeAutocomplete() {
        const dropdown = document.getElementById('invite-autocomplete');
        if (dropdown) {
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
        }
        acState = { items: [], highlightedIndex: -1, open: false };
    }

    function renderAutocomplete() {
        const dropdown = document.getElementById('invite-autocomplete');
        if (!dropdown) return;
        dropdown.innerHTML = '';
        for (let i = 0; i < acState.items.length; i++) {
            const item = acState.items[i];
            const el = document.createElement('div');
            el.className = 'comment-autocomplete__item' + (i === acState.highlightedIndex ? ' comment-autocomplete__item--highlight' : '');
            el.role = 'option';
            el.ariaSelected = String(i === acState.highlightedIndex);
            el.textContent = item.name + ' (' + item.email + ')';
            el.dataset.index = i;
            el.addEventListener('mousedown', function (e) {
                e.preventDefault();
                selectAutocompleteItem(parseInt(this.dataset.index, 10));
            });
            dropdown.appendChild(el);
        }
        if (acState.items.length > 0) {
            const highlighted = dropdown.children[acState.highlightedIndex];
            if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
        }
    }

    function selectAutocompleteItem(index) {
        const item = acState.items[index];
        if (!item) return;
        const input = document.getElementById('invite-email');
        if (input) {
            input.value = item.email;
        }
        closeAutocomplete();
        input?.focus();
    }

    async function fetchAutocompleteSuggestions(query) {
        if (query.length < 1) {
            closeAutocomplete();
            return;
        }
        let results;
        try {
            results = await searchUsers(query);
        } catch {
            closeAutocomplete();
            return;
        }
        if (results && results.length > 0) {
            acState.items = results;
            acState.highlightedIndex = 0;
            acState.open = true;
            const dropdown = document.getElementById('invite-autocomplete');
            if (dropdown) {
                dropdown.style.display = 'block';
            }
            renderAutocomplete();
        } else {
            closeAutocomplete();
        }
    }

    function setupInviteAutocomplete() {
        const input = document.getElementById('invite-email');
        const dropdown = document.getElementById('invite-autocomplete');
        if (!input || !dropdown) return;

        let debounceTimer = null;

        input.addEventListener('input', function () {
            if (debounceTimer) clearTimeout(debounceTimer);
            const val = this.value.trim();
            if (!val) {
                closeAutocomplete();
                return;
            }
            debounceTimer = setTimeout(function () {
                fetchAutocompleteSuggestions(val);
            }, 200);
        });

        input.addEventListener('keydown', function (e) {
            if (!acState.open || acState.items.length === 0) return;
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    acState.highlightedIndex = (acState.highlightedIndex + 1) % acState.items.length;
                    renderAutocomplete();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    acState.highlightedIndex = (acState.highlightedIndex - 1 + acState.items.length) % acState.items.length;
                    renderAutocomplete();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (acState.highlightedIndex >= 0) {
                        selectAutocompleteItem(acState.highlightedIndex);
                    }
                    break;
                case 'Tab':
                    if (acState.highlightedIndex >= 0) {
                        selectAutocompleteItem(acState.highlightedIndex);
                    } else {
                        closeAutocomplete();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    closeAutocomplete();
                    break;
            }
        });

        input.addEventListener('blur', function () {
            setTimeout(function () {
                if (document.activeElement !== dropdown && !dropdown.contains(document.activeElement)) {
                    closeAutocomplete();
                }
            }, 150);
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
                    <div class="col-auto position-relative">
                        <label class="visually-hidden" for="invite-email">Email or username</label>
                        <input type="text" id="invite-email" class="form-control form-control-sm" placeholder="Enter name or email" required autocomplete="off">
                        <div id="invite-autocomplete" class="comment-autocomplete" role="listbox" style="display:none;"></div>
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
                    closeAutocomplete();
                } catch (err) {
                    errorEl.textContent = 'Failed to invite user: ' + (err.message || err);
                    errorEl.classList.remove('d-none');
                }
            });

            setupInviteAutocomplete();
        } catch (err) {
            loadingEl.classList.add('d-none');
            errorEl.textContent = 'Failed to load permissions.';
            errorEl.classList.remove('d-none');
        }
    }
    refreshPermissions();
}

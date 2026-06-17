import { getPermissions, inviteUser, removePermission, searchUsers } from './api.ts';
import { escapeHtml } from '../utils/html.mjs';
import { renderEmptyTableRow } from '../utils/empty-table.mjs';

/**
 * Ensure a Bootstrap modal element exists in the DOM, creating it if necessary.
 * @param {string} modalId - The ID for the modal element.
 * @param {string} modalMarkup - The HTML markup for the modal.
 * @returns {HTMLElement|null} The modal element, or null if creation failed.
 */
function ensureModal(modalId, modalMarkup) {
    let modalEl = document.getElementById(modalId);
    if (modalEl) return modalEl;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalMarkup.trim();
    modalEl = wrapper.firstElementChild;
    if (modalEl) document.body.appendChild(modalEl);
    return modalEl;
}

/**
 * Ensure the revoke-permission confirmation modal exists in the DOM.
 * @returns {HTMLElement|null} The modal element.
 */
function ensureRevokeModal() {
    return ensureModal('revoke-modal', `
        <div class="modal fade" id="revoke-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Revoke Permission</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-0" id="revoke-modal-text">Revoke this permission?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="revoke-modal-confirm">Revoke</button>
                    </div>
                </div>
            </div>
        </div>
    `);
}

/**
 * Load the project sharing and permissions page with invite/revoke controls.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {object} permission - The current user's permission object.
 */
export function loadSharePage(owner, project, contentDiv, permission) {
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');
    const successEl = document.getElementById('success-text');
    const section = document.getElementById('permissions-section');

    /**
     * Bind a click handler to a revoke button to open the confirmation modal.
     * @param {HTMLElement} btn - The revoke button element.
     */
    function bindRevokeButton(btn) {
        if (!btn || btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.permissionId);
            if (!Number.isFinite(id)) return;

            const modalEl = ensureRevokeModal();
            const confirmButton = modalEl.querySelector('#revoke-modal-confirm');
            if (!confirmButton) return;

            const nextButton = confirmButton.cloneNode(true);
            confirmButton.parentElement.replaceChild(nextButton, confirmButton);
            nextButton.addEventListener('click', async () => {
                nextButton.disabled = true;
                try {
                    await removePermission(owner, project, id);
                    window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.hide();
                    const y = window.scrollY;
                    btn.closest('tr')?.remove();
                    successEl.textContent = 'Permission revoked.';
                    successEl.classList.remove('d-none');
                    window.scrollTo(0, y);
                } catch (err) {
                    errorEl.textContent = 'Failed to revoke permission.';
                    errorEl.classList.remove('d-none');
                    console.error(err);
                } finally {
                    nextButton.disabled = false;
                }
            }, { once: true });

            window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.show();
        });
    }

    let acState = { items: [], highlightedIndex: -1, open: false };

    /**
     * Close the invite user autocomplete dropdown.
     */
    function closeAutocomplete() {
        const dropdown = document.getElementById('invite-autocomplete');
        if (dropdown) {
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
        }
        acState = { items: [], highlightedIndex: -1, open: false };
    }

    /**
     * Render the user search autocomplete dropdown items.
     */
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

    /**
     * Select an item from the autocomplete dropdown and populate the email input.
     * @param {number} index - The index of the selected item.
     */
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

    /**
     * Fetch user search suggestions for autocomplete based on the query string.
     * @param {string} query - The search query (minimum 1 character).
     */
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

    /**
     * Set up the invite email input with keyboard-driven autocomplete behavior.
     */
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

    /**
     * Open the invite-user modal with form, autocomplete, and submit handling.
     * @param {{owner: string, project: string, onInvited: function}} config - Invite configuration.
     */
    function openInviteModal({ owner, project, onInvited }) {
        const modalEl = ensureModal('invite-modal', `
            <div class="modal fade" id="invite-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <form id="invite-modal-form">
                            <div class="modal-header">
                                <h5 class="modal-title">Invite a User</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3 position-relative">
                                    <label class="form-label" for="invite-email">Email or username</label>
                                    <input type="text" id="invite-email" class="form-control" placeholder="Enter name or email" required autocomplete="off">
                                    <div id="invite-autocomplete" class="comment-autocomplete" role="listbox" style="display:none;"></div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label" for="invite-level">Permission</label>
                                    <select id="invite-level" class="form-select">
                                        <option value="View">View</option>
                                        <option value="Comment">Comment</option>
                                        <option value="Edit">Edit</option>
                                    </select>
                                </div>
                                <div id="invite-modal-error" class="text-danger small d-none"></div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary" id="invite-modal-submit">Send Invitation</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `);

        const form = modalEl?.querySelector('#invite-modal-form');
        const emailInput = modalEl?.querySelector('#invite-email');
        const levelSelect = modalEl?.querySelector('#invite-level');
        const errorEl = modalEl?.querySelector('#invite-modal-error');
        const submitBtn = modalEl?.querySelector('#invite-modal-submit');
        if (!form || !emailInput || !levelSelect || !errorEl || !submitBtn) return;

        form.replaceWith(form.cloneNode(true));

        const liveForm = modalEl.querySelector('#invite-modal-form');
        const liveEmailInput = modalEl.querySelector('#invite-email');
        const liveLevelSelect = modalEl.querySelector('#invite-level');
        const liveErrorEl = modalEl.querySelector('#invite-modal-error');
        const liveSubmitBtn = modalEl.querySelector('#invite-modal-submit');

        liveEmailInput.value = '';
        liveLevelSelect.value = 'View';
        liveErrorEl.textContent = '';
        liveErrorEl.classList.add('d-none');
        liveSubmitBtn.disabled = false;
        liveSubmitBtn.textContent = 'Send Invitation';
        closeAutocomplete();

        setupInviteAutocomplete();

        liveForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = liveEmailInput.value.trim();
            const level = liveLevelSelect.value;
            if (!email) return;

            liveSubmitBtn.disabled = true;
            liveSubmitBtn.textContent = 'Sending...';
            liveErrorEl.classList.add('d-none');

            try {
                await inviteUser(owner, project, { email, level });
                window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.hide();
                successEl.textContent = 'Invitation sent.';
                successEl.classList.remove('d-none');
                await onInvited?.();
            } catch (err) {
                liveErrorEl.textContent = err?.message || 'Failed to invite user.';
                liveErrorEl.classList.remove('d-none');
            } finally {
                liveSubmitBtn.disabled = false;
                liveSubmitBtn.textContent = 'Send Invitation';
            }
        });

        window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.show();
    }

    /**
     * Refresh the permissions list from the server and re-render the table.
     */
    async function refreshPermissions() {
            try {
                const isOwner = permission?.isOwner === true;
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
                            <td>${isOwner ? `<button class="btn btn-outline-danger btn-sm revoke-btn" data-permission-id="${p.id}">Revoke</button>` : '-'}</td>
                        </tr>`).join('')
                    : renderEmptyTableRow({
                        icon: 'bi-share',
                        title: 'No permissions configured',
                        description: isOwner ? 'Invite a user to get started.' : '',
                        colspan: 4,
                        button: isOwner ? {
                            text: 'Invite',
                            icon: 'bi-plus-circle',
                            id: 'empty-state-invite-btn',
                        } : undefined,
                    });

                section.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h2>Current Permissions</h2>
                    ${isOwner ? '<button id="invite-btn-top" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Invite</button>' : ''}
                </div>
                <table class="table table-striped table-sm promisemodel-table">
                    <thead><tr><th>User</th><th>Level</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>${tbodyHtml}</tbody>
                </table>
                ${!isOwner ? '<p class="text-muted mt-4">Only the project owner can manage permissions.</p>' : ''}`;

            document.querySelectorAll('.revoke-btn').forEach(btn => {
                bindRevokeButton(btn);
            });

            const topInviteBtn = document.getElementById('invite-btn-top');
            topInviteBtn?.addEventListener('click', () => {
                openInviteModal({ owner, project, onInvited: refreshPermissions });
            });
            const emptyInviteBtn = document.getElementById('empty-state-invite-btn');
            emptyInviteBtn?.addEventListener('click', () => {
                openInviteModal({ owner, project, onInvited: refreshPermissions });
            });
        } catch (err) {
            loadingEl.classList.add('d-none');
            errorEl.textContent = 'Failed to load permissions.';
            errorEl.classList.remove('d-none');
        }
    }
    refreshPermissions();
}

// @ts-nocheck
import { renderEmptyTableRow } from '../utils/empty-table.ts';
import { escapeHtml } from '../utils/html.ts';

import { getPermissions, inviteUser, removePermission, searchUsers } from './api.ts';

/**
 * Ensure a modal element exists in the DOM, creating and appending it if needed.
 * @param {string} modalId - The modal element's ID.
 * @param {string} modalMarkup - The HTML markup for the modal.
 * @returns {HTMLElement | null} The modal element, or null if creation failed.
 */
function ensureModal(modalId: string, modalMarkup: string): HTMLElement | null {
    let modalEl = document.getElementById(modalId) as HTMLElement | null;
    if (modalEl) return modalEl;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalMarkup.trim();
    modalEl = wrapper.firstElementChild as HTMLElement | null;
    if (modalEl) document.body.appendChild(modalEl);
    return modalEl;
}

/**
 * Ensure the revoke confirmation modal exists in the DOM.
 * @returns {HTMLElement | null} The revoke modal element, or null.
 */
function ensureRevokeModal(): HTMLElement | null {
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
 * Load the share/permissions page for a project, including the permission table and invite modal.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {{ isOwner?: boolean } | null} permission - The current user's permission object for the project.
 */
export function loadSharePage(owner: string, project: string, contentDiv: HTMLElement, permission: { isOwner?: boolean } | null): void {
    const errorEl = document.getElementById('error-text') as HTMLElement | null;
    const loadingEl = document.getElementById('loading-text') as HTMLElement | null;
    const successEl = document.getElementById('success-text') as HTMLElement | null;
    const section = document.getElementById('permissions-section') as HTMLElement | null;

    interface AutocompleteState {
        items: { name: string; email: string }[];
        highlightedIndex: number;
        open: boolean;
    }

    let acState: AutocompleteState = { items: [], highlightedIndex: -1, open: false };

    /**
     * Close the autocomplete dropdown and reset state.
     */
    function closeAutocomplete(): void {
        const dropdown = document.getElementById('invite-autocomplete') as HTMLElement | null;
        if (dropdown) {
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
        }
        acState = { items: [], highlightedIndex: -1, open: false };
    }

    /**
     * Render the autocomplete dropdown items from state.
     */
    function renderAutocomplete(): void {
        const dropdown = document.getElementById('invite-autocomplete') as HTMLElement | null;
        if (!dropdown) return;
        dropdown.innerHTML = '';
        for (let i = 0; i < acState.items.length; i++) {
            const item = acState.items[i];
            const el = document.createElement('div');
            el.className = 'comment-autocomplete__item' + (i === acState.highlightedIndex ? ' comment-autocomplete__item--highlight' : '');
            el.role = 'option';
            el.ariaSelected = String(i === acState.highlightedIndex);
            el.textContent = item.name + ' (' + item.email + ')';
            el.dataset.index = String(i);
            el.addEventListener('mousedown', function (e) {
                e.preventDefault();
                selectAutocompleteItem(parseInt(this.dataset.index!, 10));
            });
            dropdown.appendChild(el);
        }
        if (acState.items.length > 0) {
            const highlighted = dropdown.children[acState.highlightedIndex] as HTMLElement | null;
            if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Select an autocomplete suggestion and populate the email input.
     * @param {number} index - The index of the selected item.
     */
    function selectAutocompleteItem(index: number): void {
        const item = acState.items[index];
        if (!item) return;
        const input = document.getElementById('invite-email') as HTMLInputElement | null;
        if (input) {
            input.value = item.email;
        }
        closeAutocomplete();
        input?.focus();
    }

    /**
     * Fetch autocomplete suggestions from the API and render the dropdown.
     * @param {string} query - The search query.
     * @returns {Promise<void>}
     */
    async function fetchAutocompleteSuggestions(query: string): Promise<void> {
        if (query.length < 1) {
            closeAutocomplete();
            return;
        }
        let results: { name: string; email: string }[];
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
            const dropdown = document.getElementById('invite-autocomplete') as HTMLElement | null;
            if (dropdown) {
                dropdown.style.display = 'block';
            }
            renderAutocomplete();
        } else {
            closeAutocomplete();
        }
    }

    /**
     * Set up event handlers for the invite email autocomplete input.
     */
    function setupInviteAutocomplete(): void {
        const input = document.getElementById('invite-email') as HTMLInputElement | null;
        const dropdown = document.getElementById('invite-autocomplete') as HTMLElement | null;
        if (!input || !dropdown) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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
     * Open the invite user modal and set up event handlers.
     * @param {object} config - Configuration for the modal.
     * @param {string} config.owner - The project owner's slug.
     * @param {string} config.project - The project's slug.
     * @param {() => Promise<void>} config.onInvited - Callback after a successful invitation.
     */
    function openInviteModal(config: { owner: string; project: string; onInvited: () => Promise<void> }): void {
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

        const form = modalEl?.querySelector('#invite-modal-form') as HTMLFormElement | null;
        const emailInput = modalEl?.querySelector('#invite-email') as HTMLInputElement | null;
        const levelSelect = modalEl?.querySelector('#invite-level') as HTMLSelectElement | null;
        const errorEl = modalEl?.querySelector('#invite-modal-error') as HTMLElement | null;
        const submitBtn = modalEl?.querySelector('#invite-modal-submit') as HTMLButtonElement | null;
        if (!form || !emailInput || !levelSelect || !errorEl || !submitBtn) return;

        form.replaceWith(form.cloneNode(true));

        const liveForm = modalEl!.querySelector('#invite-modal-form') as HTMLFormElement;
        const liveEmailInput = modalEl!.querySelector('#invite-email') as HTMLInputElement;
        const liveLevelSelect = modalEl!.querySelector('#invite-level') as HTMLSelectElement;
        const liveErrorEl = modalEl!.querySelector('#invite-modal-error') as HTMLElement;
        const liveSubmitBtn = modalEl!.querySelector('#invite-modal-submit') as HTMLButtonElement;

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
                window.bootstrap?.Modal?.getOrCreateInstance(modalEl!)?.hide();
                if (successEl) {
                    successEl.textContent = 'Invitation sent.';
                    successEl.classList.remove('d-none');
                }
                await config.onInvited?.();
            } catch (err) {
                liveErrorEl.textContent = (err as Error)?.message || 'Failed to invite user.';
                liveErrorEl.classList.remove('d-none');
            } finally {
                liveSubmitBtn.disabled = false;
                liveSubmitBtn.textContent = 'Send Invitation';
            }
        });

        window.bootstrap?.Modal?.getOrCreateInstance(modalEl!)?.show();
    }

    /**
     * Refresh the permissions table from the API.
     * @returns {Promise<void>}
     */
    async function refreshPermissions(): Promise<void> {
        try {
            const isOwner = permission?.isOwner === true;
            const permissions = await getPermissions(owner, project);
            if (loadingEl) loadingEl.classList.add('d-none');
            if (errorEl) errorEl.classList.add('d-none');
            if (successEl) successEl.classList.add('d-none');
            const tbodyHtml = permissions && permissions.length > 0
                ? permissions.map((p: { id: string; userName: string; level: string; status: string }) => `
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

            if (section) {
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
            }

            document.querySelectorAll('.revoke-btn').forEach(btn => {
                bindRevokeButton(btn as HTMLElement);
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
            if (loadingEl) loadingEl.classList.add('d-none');
            if (errorEl) {
                errorEl.textContent = 'Failed to load permissions.';
                errorEl.classList.remove('d-none');
            }
        }
    }

    /**
     * Bind click handler to a revoke permission button.
     * @param {HTMLElement} btn - The revoke button element.
     */
    function bindRevokeButton(btn: HTMLElement): void {
        if (!btn || btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.permissionId!, 10);
            if (!Number.isFinite(id)) return;

            const modalEl = ensureRevokeModal()!;
            const confirmButton = modalEl.querySelector('#revoke-modal-confirm') as HTMLButtonElement;
            if (!confirmButton) return;

            const nextButton = confirmButton.cloneNode(true) as HTMLButtonElement;
            confirmButton.parentElement!.replaceChild(nextButton, confirmButton);
            nextButton.addEventListener('click', async () => {
                nextButton.disabled = true;
                try {
                    await removePermission(owner, project, id);
                    window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.hide();
                    const y = window.scrollY;
                    btn.closest('tr')?.remove();
                    if (successEl) {
                        successEl.textContent = 'Permission revoked.';
                        successEl.classList.remove('d-none');
                    }
                    window.scrollTo(0, y);
                } catch (err) {
                    if (errorEl) {
                        errorEl.textContent = 'Failed to revoke permission.';
                        errorEl.classList.remove('d-none');
                    }
                    console.error(err);
                } finally {
                    nextButton.disabled = false;
                }
            }, { once: true });

            window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.show();
        });
    }

    refreshPermissions();
}

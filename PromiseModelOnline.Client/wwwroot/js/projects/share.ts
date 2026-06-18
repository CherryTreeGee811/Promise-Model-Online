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
    let modalElement = document.querySelector(`#${CSS.escape(modalId)}`) as HTMLElement | null;
    if (modalElement) return modalElement;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalMarkup.trim();
    modalElement = wrapper.firstElementChild as HTMLElement | null;
    if (modalElement) document.body.append(modalElement);
    return modalElement;
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
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const loadingElement = document.querySelector('#loading-text') as HTMLElement | null;
    const successElement = document.querySelector('#success-text') as HTMLElement | null;
    const section = document.querySelector('#permissions-section') as HTMLElement | null;

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
        const dropdown = document.querySelector('#invite-autocomplete') as HTMLElement | null;
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
        const dropdown = document.querySelector('#invite-autocomplete') as HTMLElement | null;
        if (!dropdown) return;
        dropdown.innerHTML = '';
        for (let index = 0; index < acState.items.length; index++) {
            const item = acState.items[index];
            const element = document.createElement('div');
            element.className = 'comment-autocomplete__item' + (index === acState.highlightedIndex ? ' comment-autocomplete__item--highlight' : '');
            element.role = 'option';
            element.ariaSelected = String(index === acState.highlightedIndex);
            element.textContent = item.name + ' (' + item.email + ')';
            element.dataset.index = String(index);
            element.addEventListener('mousedown', (event) => {
                event.preventDefault();
                selectAutocompleteItem(parseInt(element.dataset.index!, 10));
            });
            dropdown.append(element);
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
        const input = document.querySelector('#invite-email') as HTMLInputElement | null;
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
        if (query.length === 0) {
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
            const dropdown = document.querySelector('#invite-autocomplete') as HTMLElement | null;
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
        const input = document.querySelector('#invite-email') as HTMLInputElement | null;
        const dropdown = document.querySelector('#invite-autocomplete') as HTMLElement | null;
        if (!input || !dropdown) return;

        let debounceTimer: ReturnType<typeof setTimeout> | undefined;

        input.addEventListener('input', () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            const value = input.value.trim();
            if (!value) {
                closeAutocomplete();
                return;
            }
            debounceTimer = setTimeout(function () {
                fetchAutocompleteSuggestions(value);
            }, 200);
        });

        input.addEventListener('keydown', (event) => {
            if (!acState.open || acState.items.length === 0) return;
            switch (event.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    acState.highlightedIndex = (acState.highlightedIndex + 1) % acState.items.length;
                    renderAutocomplete();
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    acState.highlightedIndex = (acState.highlightedIndex - 1 + acState.items.length) % acState.items.length;
                    renderAutocomplete();
                    break;
                }
                case 'Enter': {
                    e.preventDefault();
                    if (acState.highlightedIndex >= 0) {
                        selectAutocompleteItem(acState.highlightedIndex);
                    }
                    break;
                }
                case 'Tab': {
                    if (acState.highlightedIndex >= 0) {
                        selectAutocompleteItem(acState.highlightedIndex);
                    } else {
                        closeAutocomplete();
                    }
                    break;
                }
                case 'Escape': {
                    e.preventDefault();
                    closeAutocomplete();
                    break;
                }
            }
        });

        input.addEventListener('blur', () => {
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
        const modalElement = ensureModal('invite-modal', `
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

        const form = modalElement?.querySelector('#invite-modal-form') as HTMLFormElement | null;
        const emailInput = modalElement?.querySelector('#invite-email') as HTMLInputElement | null;
        const levelSelect = modalElement?.querySelector('#invite-level') as HTMLSelectElement | null;
        const errorElement_ = modalElement?.querySelector('#invite-modal-error') as HTMLElement | null;
        const submitButton = modalElement?.querySelector('#invite-modal-submit') as HTMLButtonElement | null;
        if (!form || !emailInput || !levelSelect || !errorElement_ || !submitButton) return;

        form.replaceWith(form.cloneNode(true));

        const liveForm = modalElement!.querySelector('#invite-modal-form') as HTMLFormElement;
        const liveEmailInput = modalElement!.querySelector('#invite-email') as HTMLInputElement;
        const liveLevelSelect = modalElement!.querySelector('#invite-level') as HTMLSelectElement;
        const liveErrorElement = modalElement!.querySelector('#invite-modal-error') as HTMLElement;
        const liveSubmitButton = modalElement!.querySelector('#invite-modal-submit') as HTMLButtonElement;

        liveEmailInput.value = '';
        liveLevelSelect.value = 'View';
        liveErrorElement.textContent = '';
        liveErrorElement.classList.add('d-none');
        liveSubmitButton.disabled = false;
        liveSubmitButton.textContent = 'Send Invitation';
        closeAutocomplete();

        setupInviteAutocomplete();

        liveForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = liveEmailInput.value.trim();
            if (!email) return;

            const level = liveLevelSelect.value;

            liveSubmitButton.disabled = true;
            liveSubmitButton.textContent = 'Sending...';
            liveErrorElement.classList.add('d-none');

            try {
                await inviteUser(owner, project, { email, level });
                globalThis.bootstrap?.Modal?.getOrCreateInstance(modalElement!)?.hide();
                if (successElement) {
                    successElement.textContent = 'Invitation sent.';
                    successElement.classList.remove('d-none');
                }
                await config.onInvited?.();
            } catch (error) {
                liveErrorElement.textContent = (error as Error)?.message || 'Failed to invite user.';
                liveErrorElement.classList.remove('d-none');
            } finally {
                liveSubmitButton.disabled = false;
                liveSubmitButton.textContent = 'Send Invitation';
            }
        });

        globalThis.bootstrap?.Modal?.getOrCreateInstance(modalElement!)?.show();
    }

    /**
     * Refresh the permissions table from the API.
     * @returns {Promise<void>}
     */
    async function refreshPermissions(): Promise<void> {
        try {
            const isOwner = permission?.isOwner === true;
            const permissions = await getPermissions(owner, project);
            if (loadingElement) loadingElement.classList.add('d-none');
            if (errorElement) errorElement.classList.add('d-none');
            if (successElement) successElement.classList.add('d-none');
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
                ${isOwner ? '' : '<p class="text-muted mt-4">Only the project owner can manage permissions.</p>'}`;
            }

            for (const button of document.querySelectorAll('.revoke-btn')) {
                bindRevokeButton(button as HTMLElement);
            }

            const topInviteButton = document.querySelector('#invite-btn-top');
            topInviteButton?.addEventListener('click', () => {
                openInviteModal({ owner, project, onInvited: refreshPermissions });
            });
            const emptyInviteButton = document.querySelector('#empty-state-invite-btn');
            emptyInviteButton?.addEventListener('click', () => {
                openInviteModal({ owner, project, onInvited: refreshPermissions });
            });
        } catch {
            if (loadingElement) loadingElement.classList.add('d-none');
            if (errorElement) {
                errorElement.textContent = 'Failed to load permissions.';
                errorElement.classList.remove('d-none');
            }
        }
    }

    /**
     * Bind click handler to a revoke permission button.
     * @param {HTMLElement} button - The revoke button element.
     */
    function bindRevokeButton(button: HTMLElement): void {
        if (!button || button.dataset.bound === '1') return;
        button.dataset.bound = '1';
        button.addEventListener('click', async () => {
            const id = parseInt(button.dataset.permissionId!, 10);
            if (!Number.isFinite(id)) return;

            const modalElement = ensureRevokeModal()!;
            const confirmButton = modalElement.querySelector('#revoke-modal-confirm') as HTMLButtonElement;
            if (!confirmButton) return;

            const nextButton = confirmButton.cloneNode(true) as HTMLButtonElement;
            confirmButton.parentElement!.replaceChild(nextButton, confirmButton);
            nextButton.addEventListener('click', async () => {
                nextButton.disabled = true;
                try {
                    await removePermission(owner, project, id);
                    globalThis.bootstrap?.Modal?.getOrCreateInstance(modalElement)?.hide();
                    const y = window.scrollY;
                    btn.closest('tr')?.remove();
                    if (successElement) {
                        successElement.textContent = 'Permission revoked.';
                        successElement.classList.remove('d-none');
                    }
                    window.scrollTo(0, y);
                } catch (error) {
                    if (errorElement) {
                        errorElement.textContent = 'Failed to revoke permission.';
                        errorElement.classList.remove('d-none');
                    }
                    console.error(error);
                } finally {
                    nextButton.disabled = false;
                }
            }, { once: true });

            globalThis.bootstrap?.Modal?.getOrCreateInstance(modalElement)?.show();
        });
    }

    refreshPermissions();
}

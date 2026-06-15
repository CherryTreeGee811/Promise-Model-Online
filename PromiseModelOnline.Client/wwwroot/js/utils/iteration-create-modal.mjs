import { createIteration } from '../iterations/api.mjs';

/**
 * Ensure a modal element exists in the DOM, creating it if necessary.
 * @param {string} modalId - The modal element ID.
 * @param {string} modalMarkup - The HTML markup for the modal.
 * @returns {HTMLElement|null} The modal element.
 */
function ensureModal(modalId, modalMarkup) {
    let modalEl = document.getElementById(modalId);
    if (modalEl) return modalEl;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalMarkup.trim();
    modalEl = wrapper.firstElementChild;

    if (modalEl) {
        document.body.appendChild(modalEl);
    }

    return modalEl;
}

/**
 * Open a modal dialog for creating a new iteration.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {Function} onCreated - Callback invoked after successful creation.
 */
export function openIterationCreateModal(owner, project, onCreated) {
    const modalEl = ensureModal('iteration-create-modal', `
        <div class="modal fade" id="iteration-create-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <form id="iteration-create-form">
                        <div class="modal-header">
                            <h5 class="modal-title">Create Iteration</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <label class="form-label" for="iteration-create-name">Name</label>
                            <input id="iteration-create-name" class="form-control" type="text" maxlength="200" required placeholder="Iteration 1">
                            <div id="iteration-create-error" class="text-danger small mt-2 d-none"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="iteration-create-submit">Create Iteration</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `);

    const form = modalEl?.querySelector('#iteration-create-form');
    const nameInput = modalEl?.querySelector('#iteration-create-name');
    const errorEl = modalEl?.querySelector('#iteration-create-error');
    const submitBtn = modalEl?.querySelector('#iteration-create-submit');
    if (!form || !nameInput || !errorEl || !submitBtn) return;

    form.replaceWith(form.cloneNode(true));

    const liveForm = modalEl.querySelector('#iteration-create-form');
    const liveNameInput = modalEl.querySelector('#iteration-create-name');
    const liveErrorEl = modalEl.querySelector('#iteration-create-error');
    const liveSubmitBtn = modalEl.querySelector('#iteration-create-submit');

    liveNameInput.value = '';
    liveErrorEl.textContent = '';
    liveErrorEl.classList.add('d-none');
    liveSubmitBtn.disabled = false;
    liveSubmitBtn.textContent = 'Create Iteration';

    liveForm.addEventListener('submit', async event => {
        event.preventDefault();

        const name = liveNameInput.value.trim();
        if (!name) {
            liveErrorEl.textContent = 'Iteration name is required.';
            liveErrorEl.classList.remove('d-none');
            liveNameInput.focus();
            return;
        }

        liveSubmitBtn.disabled = true;
        liveSubmitBtn.textContent = 'Creating...';

        try {
            await createIteration(owner, project, { name });
            window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.hide();
            await onCreated?.();
        } catch (error) {
            liveErrorEl.textContent = error?.message || 'Failed to create iteration.';
            liveErrorEl.classList.remove('d-none');
        } finally {
            liveSubmitBtn.disabled = false;
            liveSubmitBtn.textContent = 'Create Iteration';
        }
    });

    window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.show();
}

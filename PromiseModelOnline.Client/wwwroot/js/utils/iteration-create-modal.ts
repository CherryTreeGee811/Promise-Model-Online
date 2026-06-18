// @ts-nocheck
import { createIteration } from '../iterations/api.ts';

/**
 *
 * @param modalId
 * @param modalMarkup
 */
function ensureModal(modalId: string, modalMarkup: string): HTMLElement | null {
    let modalEl = document.getElementById(modalId);
    if (modalEl) return modalEl;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalMarkup.trim();
    modalEl = wrapper.firstElementChild as HTMLElement | null;

    if (modalEl) {
        document.body.appendChild(modalEl);
    }

    return modalEl;
}

/**
 * Open a Bootstrap modal for creating a new iteration.
 * The modal DOM is created on first invocation and reused.
 * @param owner - Project owner slug.
 * @param project - Project slug.
 * @param onCreated - Async callback invoked after successful creation.
 */
export function openIterationCreateModal(owner: string, project: string, onCreated: () => Promise<void> | void): void {
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
    const nameInput = modalEl?.querySelector('#iteration-create-name') as HTMLInputElement | null;
    const errorEl = modalEl?.querySelector('#iteration-create-error');
    const submitBtn = modalEl?.querySelector('#iteration-create-submit') as HTMLButtonElement | null;
    if (!form || !nameInput || !errorEl || !submitBtn) return;

    form.replaceWith(form.cloneNode(true));

    const liveForm = modalEl.querySelector('#iteration-create-form') as HTMLFormElement;
    const liveNameInput = modalEl.querySelector('#iteration-create-name') as HTMLInputElement;
    const liveErrorEl = modalEl.querySelector('#iteration-create-error') as HTMLElement;
    const liveSubmitBtn = modalEl.querySelector('#iteration-create-submit') as HTMLButtonElement;

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
            (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl)?.hide();
            await onCreated?.();
        } catch (error: any) {
            liveErrorEl.textContent = error?.message || 'Failed to create iteration.';
            liveErrorEl.classList.remove('d-none');
        } finally {
            liveSubmitBtn.disabled = false;
            liveSubmitBtn.textContent = 'Create Iteration';
        }
    });

    (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl)?.show();
}

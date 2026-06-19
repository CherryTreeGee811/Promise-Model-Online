import { createIteration } from '../iterations/api.ts';
import { ensureModal } from './html.ts';

/**
 * Open a Bootstrap modal for creating a new iteration.
 * The modal DOM is created on first invocation and reused.
 * @param {string} owner - Project owner slug.
 * @param {string} project - Project slug.
 * @param {() => Promise<void> | void} onCreated - Async callback invoked after successful creation.
 */
export function openIterationCreateModal(owner: string, project: string, onCreated: () => Promise<void> | void): void {
    const modalElement = ensureModal('iteration-create-modal', `
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

    const form = modalElement?.querySelector('#iteration-create-form');
    const nameInput = modalElement?.querySelector('#iteration-create-name') as HTMLInputElement | null;
    const errorElement = modalElement?.querySelector('#iteration-create-error');
    const submitButton = modalElement?.querySelector('#iteration-create-submit') as HTMLButtonElement | null;
    if (!form || !nameInput || !errorElement || !submitButton) return;

    form.replaceWith(form.cloneNode(true));

    const liveForm = modalElement!.querySelector('#iteration-create-form') as HTMLFormElement;
    const liveNameInput = modalElement!.querySelector('#iteration-create-name') as HTMLInputElement;
    const liveErrorElement = modalElement!.querySelector('#iteration-create-error') as HTMLElement;
    const liveSubmitButton = modalElement!.querySelector('#iteration-create-submit') as HTMLButtonElement;

    liveNameInput.value = '';
    liveErrorElement.textContent = '';
    liveErrorElement.classList.add('d-none');
    liveSubmitButton.disabled = false;
    liveSubmitButton.textContent = 'Create Iteration';

    liveForm.addEventListener('submit', async event => {
        event.preventDefault();

        const name = liveNameInput.value.trim();
        if (!name) {
            liveErrorElement.textContent = 'Iteration name is required.';
            liveErrorElement.classList.remove('d-none');
            liveNameInput.focus();
            return;
        }

        liveSubmitButton.disabled = true;
        liveSubmitButton.textContent = 'Creating...';

        try {
            await createIteration(owner, project, { name });
            (globalThis as any).bootstrap?.Modal?.getOrCreateInstance(modalElement)?.hide();
            await onCreated?.();
        } catch (error: any) {
            liveErrorElement.textContent = error?.message || 'Failed to create iteration.';
            liveErrorElement.classList.remove('d-none');
        } finally {
            liveSubmitButton.disabled = false;
            liveSubmitButton.textContent = 'Create Iteration';
        }
    });

    (globalThis as any).bootstrap?.Modal?.getOrCreateInstance(modalElement)?.show();
}

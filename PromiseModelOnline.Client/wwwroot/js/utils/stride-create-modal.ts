import { createStride } from '../strides/api.ts';

/**
 * Ensure a modal element exists in the DOM, creating it from markup if needed.
 * @param {string} modalId - The ID of the modal element.
 * @param {string} modalMarkup - The HTML markup for the modal.
 * @returns {HTMLElement } The modal element, or null if creation failed.
 */
function ensureModal(modalId: string, modalMarkup: string): HTMLElement | null {
    let modalElement = document.querySelector('#' + modalId) as HTMLElement | null;
    if (modalElement) return modalElement;

    const parser = new DOMParser();
    const document_ = parser.parseFromString(modalMarkup.trim(), 'text/html');
    modalElement = document_.body.firstElementChild as HTMLElement | null;

    if (modalElement) {
        document.body.append(modalElement);
    }

    return modalElement;
}

/**
 * Format a date as a string for use in a date input value (YYYY-MM-DD).
 * @param {Date | string} date - The date to format.
 * @returns {string} The formatted date string.
 */
function formatDateInputValue(date: Date | string): string {
    return new Date(date).toISOString().slice(0, 10);
}

/**
 * Add a number of days to a date.
 * @param {Date} date - The starting date.
 * @param {number} days - Number of days to add.
 * @returns {Date} The new date.
 */
function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

interface StrideDefaults {
    startDate: string;
    endDate: string;
    durationDays: number;
}

/**
 * Calculate default start and end dates and duration for a new stride.
 * @param {Array<{ endDate?: string }>} existingStrides - Existing strides to derive the next start date from.
 * @returns {StrideDefaults} The stride defaults object.
 */
function getNewStrideDefaults(existingStrides: Array<{ endDate?: string }> = []): StrideDefaults {
    const now = new Date();
    const strideDurationDays = 14;

    const latestEndDate = Array.isArray(existingStrides) && existingStrides.length > 0
        ? existingStrides
            .map(stride => new Date(stride?.endDate ?? ''))
            .filter(date => Number.isFinite(date.getTime()))
            .toSorted((left, right) => right.getTime() - left.getTime())[0]
        : undefined;

    const startDate = latestEndDate ? addDays(latestEndDate, 1) : now;
    const endDate = addDays(startDate, strideDurationDays - 1);

    return {
        startDate: formatDateInputValue(startDate),
        endDate: formatDateInputValue(endDate),
        durationDays: strideDurationDays,
    };
}

interface StrideCreateOptions {
    owner: string;
    project: string;
    iterationId: number;
    iterations?: Array<{ id: number; name: string }>;
    existingStrides?: Array<{ endDate?: string }>;
    onCreated: () => Promise<void> | void;
}

/**
 * Open a Bootstrap modal for creating a new stride.
 * The modal DOM is created on first invocation and reused.
 * @param {StrideCreateOptions} root0 - Configuration options.
 * @param {string} root0.owner - Project owner slug.
 * @param {string} root0.project - Project slug.
 * @param {number} root0.iterationId - Pre-selected iteration ID.
 * @param {Array<{ id: number; name: string }>} root0.iterations - Available iterations for the select dropdown.
 * @param {Array<{ endDate?: string }>} root0.existingStrides - Existing strides for auto-calculating date defaults.
 * @param {() => Promise<void> | void} root0.onCreated - Async callback invoked after successful creation.
 */
export function openStrideCreateModal({
    owner,
    project,
    iterationId,
    iterations = [],
    existingStrides = [],
    onCreated,
}: StrideCreateOptions): void {
    const modalElement = ensureModal('stride-create-modal', `
        <div class="modal fade" id="stride-create-modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <form id="stride-create-form">
                        <div class="modal-header">
                            <h5 class="modal-title">Create Stride</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label" for="stride-create-name">Name</label>
                                    <input id="stride-create-name" class="form-control" type="text" maxlength="200" required placeholder="Stride 1">
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label" for="stride-create-iteration">Iteration</label>
                                    <select id="stride-create-iteration" class="form-select"></select>
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label" for="stride-create-duration">Duration Days</label>
                                    <input id="stride-create-duration" class="form-control" type="number" min="1" step="1" value="14">
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label" for="stride-create-start">Start Date</label>
                                    <input id="stride-create-start" class="form-control" type="date" required>
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label" for="stride-create-end">End Date</label>
                                    <input id="stride-create-end" class="form-control" type="date" required>
                                </div>
                            </div>
                            <div id="stride-create-error" class="text-danger small mt-3 d-none"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="stride-create-submit">Create Stride</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `);

    const form = modalElement?.querySelector('#stride-create-form');
    const nameInput = modalElement?.querySelector('#stride-create-name') as HTMLInputElement | null;
    const iterationSelect = modalElement?.querySelector('#stride-create-iteration') as HTMLSelectElement | null;
    const durationInput = modalElement?.querySelector('#stride-create-duration') as HTMLInputElement | null;
    const startInput = modalElement?.querySelector('#stride-create-start') as HTMLInputElement | null;
    const endInput = modalElement?.querySelector('#stride-create-end') as HTMLInputElement | null;
    const errorElement = modalElement?.querySelector('#stride-create-error');
    const submitButton = modalElement?.querySelector('#stride-create-submit') as HTMLButtonElement | null;
    if (!form || !nameInput || !iterationSelect || !durationInput || !startInput || !endInput || !errorElement || !submitButton) return;

    form.replaceWith(form.cloneNode(true));

    const liveForm = modalElement!.querySelector('#stride-create-form') as HTMLFormElement;
    const liveNameInput = modalElement!.querySelector('#stride-create-name') as HTMLInputElement;
    const liveIterationSelect = modalElement!.querySelector('#stride-create-iteration') as HTMLSelectElement;
    const liveDurationInput = modalElement!.querySelector('#stride-create-duration') as HTMLInputElement;
    const liveStartInput = modalElement!.querySelector('#stride-create-start') as HTMLInputElement;
    const liveEndInput = modalElement!.querySelector('#stride-create-end') as HTMLInputElement;
    const liveErrorElement = modalElement!.querySelector('#stride-create-error') as HTMLElement;
    const liveSubmitButton = modalElement!.querySelector('#stride-create-submit') as HTMLButtonElement;

    const iterationList = Array.isArray(iterations) ? iterations : [];
    liveIterationSelect.replaceChildren();
    for (const iteration of iterationList) {
        const opt = document.createElement('option');
        opt.value = String(iteration.id);
        if (String(iteration.id) === String(iterationId)) opt.selected = true;
        opt.textContent = iteration.name;
        liveIterationSelect.append(opt);
    }

    const defaults = getNewStrideDefaults(existingStrides);
    liveNameInput.value = '';
    liveDurationInput.value = String(defaults.durationDays);
    liveStartInput.value = defaults.startDate;
    liveEndInput.value = defaults.endDate;
    liveErrorElement.textContent = '';
    liveErrorElement.classList.add('d-none');
    liveSubmitButton.disabled = false;
    liveSubmitButton.textContent = 'Create Stride';

    liveDurationInput.addEventListener('input', () => {
        const duration = Math.max(1, Number.parseInt(liveDurationInput.value, 10) || 1);
        const startDate = new Date(liveStartInput.value);
        if (!Number.isFinite(startDate.getTime())) return;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        liveEndInput.value = endDate.toISOString().slice(0, 10);
    });

    liveStartInput.addEventListener('change', () => {
        const duration = Math.max(1, Number.parseInt(liveDurationInput.value, 10) || 1);
        const startDate = new Date(liveStartInput.value);
        if (!Number.isFinite(startDate.getTime())) return;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        liveEndInput.value = endDate.toISOString().slice(0, 10);
    });

    liveForm.addEventListener('submit', async event => {
        event.preventDefault();

        const name = liveNameInput.value.trim();

        if (!name) {
            liveErrorElement.textContent = 'Stride name is required.';
            liveErrorElement.classList.remove('d-none');
            liveNameInput.focus();
            return;
        }

        const selectedIterationId = Number.parseInt(liveIterationSelect.value, 10);

        if (!selectedIterationId) {
            liveErrorElement.textContent = 'Select an iteration for this stride.';
            liveErrorElement.classList.remove('d-none');
            liveIterationSelect.focus();
            return;
        }

        const durationDays = Math.max(1, Number.parseInt(liveDurationInput.value, 10) || 1);
        const startDate = liveStartInput.value;
        const endDate = liveEndInput.value;
        liveSubmitButton.disabled = true;
        liveSubmitButton.textContent = 'Creating...';

        try {
            await createStride(owner, project, {
                name,
                iterationId: selectedIterationId,
                startDate,
                endDate,
                durationDays,
                isActive: true,
            });

            (globalThis as any).bootstrap?.Modal?.getOrCreateInstance(modalElement)?.hide();
            await onCreated?.();
        } catch (error: any) {
            liveErrorElement.textContent = error?.message || 'Failed to create stride.';
            liveErrorElement.classList.remove('d-none');
        } finally {
            liveSubmitButton.disabled = false;
            liveSubmitButton.textContent = 'Create Stride';
        }
    });

    (globalThis as any).bootstrap?.Modal?.getOrCreateInstance(modalElement)?.show();
}

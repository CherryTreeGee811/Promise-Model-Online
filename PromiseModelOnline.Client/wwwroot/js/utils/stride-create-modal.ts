import { createStride } from '../strides/api.ts';

import { ensureModal } from './html.ts';

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
 * Calculate and set the end date based on the start date and duration.
 * @param {HTMLInputElement} durationInput - The duration input element.
 * @param {HTMLInputElement} startInput - The start date input element.
 * @param {HTMLInputElement} endInput - The end date input element (value is set by this function).
 * @returns {void}
 */
function computeEndDate(durationInput: HTMLInputElement, startInput: HTMLInputElement, endInput: HTMLInputElement): void {
    const duration = Math.max(1, Number(durationInput.value) || 1);
    const startDate = new Date(startInput.value);
    if (!Number.isFinite(startDate.getTime())) return;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration - 1);
    endInput.value = endDate.toISOString().slice(0, 10);
}

/**
 * Open a Bootstrap modal for creating a new stride.
 * The modal DOM is created on first invocation and reused.
 * @param {object} options - Configuration options.
 * @param {string} options.owner - Project owner slug.
 * @param {string} options.project - Project slug.
 * @param {number} options.iterationId - Pre-selected iteration ID.
 * @param {Array<{ id: number; name: string }>} options.iterations - Available iterations for the select dropdown.
 * @param {Array<{ endDate?: string }>} options.existingStrides - Existing strides for auto-calculating date defaults.
 * @param {() => Promise<void> | void} options.onCreated - Async callback invoked after successful creation.
 */
interface StrideFormElements {
    form: HTMLFormElement;
    nameInput: HTMLInputElement;
    iterationSelect: HTMLSelectElement;
    durationInput: HTMLInputElement;
    startInput: HTMLInputElement;
    endInput: HTMLInputElement;
    errorElement: HTMLElement;
    submitButton: HTMLButtonElement;
}

/**
 * Query stride create modal for all form elements.
 * @param {HTMLElement} modalElement - The modal root element.
 * @returns {StrideFormElements | undefined} The form elements object, or undefined if any element is missing.
 */
function getStrideFormElements(modalElement: HTMLElement): StrideFormElements | undefined {
    const form = modalElement.querySelector('#stride-create-form') as HTMLFormElement | null;
    const nameInput = modalElement.querySelector('#stride-create-name') as HTMLInputElement | null;
    const iterationSelect = modalElement.querySelector('#stride-create-iteration') as HTMLSelectElement | null;
    const durationInput = modalElement.querySelector('#stride-create-duration') as HTMLInputElement | null;
    const startInput = modalElement.querySelector('#stride-create-start') as HTMLInputElement | null;
    const endInput = modalElement.querySelector('#stride-create-end') as HTMLInputElement | null;
    const errorElement = modalElement.querySelector('#stride-create-error') as HTMLElement | null;
    const submitButton = modalElement.querySelector('#stride-create-submit') as HTMLButtonElement | null;
    if (!form || !nameInput || !iterationSelect || !durationInput || !startInput || !endInput || !errorElement || !submitButton) return;
    return { form, nameInput, iterationSelect, durationInput, startInput, endInput, errorElement, submitButton };
}

/**
 * Populate an iteration select dropdown with options.
 * @param {HTMLSelectElement} select - The select element to populate.
 * @param {Array<{ id: number; name: string }>} iterations - Available iterations.
 * @param {number} selectedId - The ID of the iteration to pre-select.
 */
function populateIterationSelect(select: HTMLSelectElement, iterations: Array<{ id: number; name: string }>, selectedId: number): void {
    select.replaceChildren();
    for (const iteration of iterations) {
        const opt = document.createElement('option');
        opt.value = String(iteration.id);
        if (String(iteration.id) === String(selectedId)) opt.selected = true;
        opt.textContent = iteration.name;
        select.append(opt);
    }
}

/**
 * Handle stride create form submission.
 * @param {Event} event - The form submit event.
 * @param {StrideFormElements} elements - Validated form elements.
 * @param {string} owner - Project owner slug.
 * @param {string} project - Project slug.
 * @param {HTMLElement} modalElement - The modal element to hide on success.
 * @param {(() => Promise<void> | void) | undefined} onCreated - Optional async callback after creation.
 */
async function handleStrideSubmit(
    event: Event,
    elements: StrideFormElements,
    owner: string,
    project: string,
    modalElement: HTMLElement,
    onCreated: (() => Promise<void> | void) | undefined,
): Promise<void> {
    event.preventDefault();
    const { errorElement, submitButton } = elements;
    const name = elements.nameInput.value.trim();

    if (!name) {
        errorElement.textContent = 'Stride name is required.';
        errorElement.classList.remove('d-none');
        elements.nameInput.focus();
        return;
    }

    const selectedIterationId = Number(elements.iterationSelect.value);
    if (!selectedIterationId) {
        errorElement.textContent = 'Select an iteration for this stride.';
        errorElement.classList.remove('d-none');
        elements.iterationSelect.focus();
        return;
    }

    const durationDays = Math.max(1, Number(elements.durationInput.value) || 1);
    submitButton.disabled = true;
    submitButton.textContent = 'Creating...';

    try {
        await createStride(owner, project, {
            name,
            iterationId: selectedIterationId,
            startDate: elements.startInput.value,
            endDate: elements.endInput.value,
            durationDays,
            isActive: true,
        });
        bootstrap?.Modal?.getOrCreateInstance(modalElement)?.hide();
        await onCreated?.();
    } catch (error: unknown) {
        errorElement.textContent = (error as Record<string, unknown> | undefined)?.message as string || 'Failed to create stride.';
        errorElement.classList.remove('d-none');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Stride';
    }
}

/**
 * Open a Bootstrap modal for creating a new stride.
 * The modal DOM is created on first invocation and reused.
 * @param {StrideCreateOptions} options - Configuration options.
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

    if (!modalElement) return;
    const elements = getStrideFormElements(modalElement);
    if (!elements) return;

    elements.form.replaceWith(elements.form.cloneNode(true));
    const freshElements = getStrideFormElements(modalElement);
    if (!freshElements) return;

    const iterationList = Array.isArray(iterations) ? iterations : [];
    populateIterationSelect(freshElements.iterationSelect, iterationList, iterationId);

    const defaults = getNewStrideDefaults(existingStrides);
    freshElements.nameInput.value = '';
    freshElements.durationInput.value = String(defaults.durationDays);
    freshElements.startInput.value = defaults.startDate;
    freshElements.endInput.value = defaults.endDate;
    freshElements.errorElement.textContent = '';
    freshElements.errorElement.classList.add('d-none');
    freshElements.submitButton.disabled = false;
    freshElements.submitButton.textContent = 'Create Stride';

    freshElements.durationInput.addEventListener('input', () => computeEndDate(freshElements.durationInput, freshElements.startInput, freshElements.endInput));
    freshElements.startInput.addEventListener('change', () => computeEndDate(freshElements.durationInput, freshElements.startInput, freshElements.endInput));

    freshElements.form.addEventListener('submit', event => handleStrideSubmit(event, freshElements, owner, project, modalElement, onCreated));

    bootstrap?.Modal?.getOrCreateInstance(modalElement)?.show();
}

import { createStride } from '../strides/api.ts';
import { escapeHtml } from './html.mjs';

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
 * Format a date as YYYY-MM-DD for input[type=date] values.
 * @param {Date|string} date - The date to format.
 * @returns {string} The date formatted as YYYY-MM-DD.
 */
function formatDateInputValue(date) {
    return new Date(date).toISOString().slice(0, 10);
}

/**
 * Add a number of days to a date.
 * @param {Date} date - The starting date.
 * @param {number} days - The number of days to add.
 * @returns {Date} The new date.
 */
function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

/**
 * Compute default start/end dates for a new stride based on existing strides.
 * @param {Array} existingStrides - Existing stride objects with endDate.
 * @returns {{startDate: string, endDate: string, durationDays: number}}
 */
function getNewStrideDefaults(existingStrides = []) {
    const now = new Date();
    const strideDurationDays = 14;

    const latestEndDate = Array.isArray(existingStrides) && existingStrides.length > 0
        ? existingStrides
            .map(stride => new Date(stride?.endDate))
            .filter(date => Number.isFinite(date.getTime()))
            .sort((left, right) => right.getTime() - left.getTime())[0]
        : null;

    const startDate = latestEndDate ? addDays(latestEndDate, 1) : now;
    const endDate = addDays(startDate, strideDurationDays - 1);

    return {
        startDate: formatDateInputValue(startDate),
        endDate: formatDateInputValue(endDate),
        durationDays: strideDurationDays,
    };
}

/**
 * Open a modal dialog for creating a new stride.
 * @param {object} options
 * @param {string} options.owner - The project owner's slug.
 * @param {string} options.project - The project's slug.
 * @param {number} options.iterationId - The currently selected iteration ID.
 * @param {Array} [options.iterations] - Available iterations for the select dropdown.
 * @param {Array} [options.existingStrides] - Existing strides for default date computation.
 * @param {Function} options.onCreated - Callback invoked after successful creation.
 */
export function openStrideCreateModal({
    owner,
    project,
    iterationId,
    iterations = [],
    existingStrides = [],
    onCreated,
}) {
    const modalEl = ensureModal('stride-create-modal', `
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

    const form = modalEl?.querySelector('#stride-create-form');
    const nameInput = modalEl?.querySelector('#stride-create-name');
    const iterationSelect = modalEl?.querySelector('#stride-create-iteration');
    const durationInput = modalEl?.querySelector('#stride-create-duration');
    const startInput = modalEl?.querySelector('#stride-create-start');
    const endInput = modalEl?.querySelector('#stride-create-end');
    const errorEl = modalEl?.querySelector('#stride-create-error');
    const submitBtn = modalEl?.querySelector('#stride-create-submit');
    if (!form || !nameInput || !iterationSelect || !durationInput || !startInput || !endInput || !errorEl || !submitBtn) return;

    form.replaceWith(form.cloneNode(true));

    const liveForm = modalEl.querySelector('#stride-create-form');
    const liveNameInput = modalEl.querySelector('#stride-create-name');
    const liveIterationSelect = modalEl.querySelector('#stride-create-iteration');
    const liveDurationInput = modalEl.querySelector('#stride-create-duration');
    const liveStartInput = modalEl.querySelector('#stride-create-start');
    const liveEndInput = modalEl.querySelector('#stride-create-end');
    const liveErrorEl = modalEl.querySelector('#stride-create-error');
    const liveSubmitBtn = modalEl.querySelector('#stride-create-submit');

    const iterationList = Array.isArray(iterations) ? iterations : [];
    liveIterationSelect.innerHTML = iterationList.map(iteration => `
        <option value="${iteration.id}" ${String(iteration.id) === String(iterationId) ? 'selected' : ''}>
            ${escapeHtml(iteration.name)}
        </option>
    `).join('');

    const defaults = getNewStrideDefaults(existingStrides);
    liveNameInput.value = '';
    liveDurationInput.value = String(defaults.durationDays);
    liveStartInput.value = defaults.startDate;
    liveEndInput.value = defaults.endDate;
    liveErrorEl.textContent = '';
    liveErrorEl.classList.add('d-none');
    liveSubmitBtn.disabled = false;
    liveSubmitBtn.textContent = 'Create Stride';

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
        const selectedIterationId = Number.parseInt(liveIterationSelect.value, 10);
        const durationDays = Math.max(1, Number.parseInt(liveDurationInput.value, 10) || 1);
        const startDate = liveStartInput.value;
        const endDate = liveEndInput.value;

        if (!name) {
            liveErrorEl.textContent = 'Stride name is required.';
            liveErrorEl.classList.remove('d-none');
            liveNameInput.focus();
            return;
        }

        if (!selectedIterationId) {
            liveErrorEl.textContent = 'Select an iteration for this stride.';
            liveErrorEl.classList.remove('d-none');
            liveIterationSelect.focus();
            return;
        }

        liveSubmitBtn.disabled = true;
        liveSubmitBtn.textContent = 'Creating...';

        try {
            await createStride(owner, project, {
                name,
                iterationId: selectedIterationId,
                startDate,
                endDate,
                durationDays,
                isActive: true,
            });

            window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.hide();
            await onCreated?.();
        } catch (error) {
            liveErrorEl.textContent = error?.message || 'Failed to create stride.';
            liveErrorEl.classList.remove('d-none');
        } finally {
            liveSubmitBtn.disabled = false;
            liveSubmitBtn.textContent = 'Create Stride';
        }
    });

    window.bootstrap?.Modal?.getOrCreateInstance(modalEl)?.show();
}

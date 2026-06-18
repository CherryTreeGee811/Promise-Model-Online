// @ts-nocheck
import { getProject } from '../projects/api.ts';
import { getStridesByIteration } from '../strides/api.ts';
import { drawBurndownChart } from '../utils/burndown.ts';
import { renderEmptyStateSection } from '../utils/empty-table.ts';
import { escapeHtml, renderLoadingSpinner } from '../utils/html.ts';
import { openIterationCreateModal } from '../utils/iteration-create-modal.ts';

import { getIterations, getBurndown } from './api.ts';

/**
 * Format a date string into a locale date representation.
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string, or 'N/A' if the input is falsy.
 */
function formatDate(dateString) {
    return dateString ? new Date(dateString).toLocaleDateString('en-CA') : 'N/A';
}

/**
 * @typedef {{ id: number, name: string, createdAt: string }} Iteration
 * @typedef {{ id: number, name: string, startDate: string, endDate: string, durationDays: number }} Stride
 */

/**
 * Load the iteration history page with burndown charts.
 * @param {string} owner - The owner slug.
 * @param {string} project - The project slug.
 * @param {{ permission?: string }} permission - The user's permission object for this project.
 */
export async function loadIterationHistory(owner, project, permission) {
    const viewDiv = /** @type {HTMLElement} */ (document.querySelector('#iterations-view'));
    const listDiv = /** @type {HTMLElement} */ (document.querySelector('#iterations-list'));
    const detailDiv = /** @type {HTMLElement} */ (document.querySelector('#iteration-detail'));
    const errorElement = /** @type {HTMLElement} */ (document.querySelector('#error-text'));
    const projectTitle = /** @type {HTMLElement|null} */ (document.querySelector('#project-title'));
    const createIterationButton = /** @type {HTMLElement|null} */ (document.querySelector('#create-iteration-btn'));

    const canEdit = permission?.permission === 'Edit';

    detailDiv.classList.add('d-none');
    errorElement.textContent = '';

    if (createIterationButton) {
        if (!canEdit) {
            createIterationButton.classList.add('d-none');
        } else if (createIterationButton.dataset.bound !== '1') {
            createIterationButton.dataset.bound = '1';
            createIterationButton.addEventListener('click', async () => {
                openIterationCreateModal(owner, project, () => loadIterationHistory(owner, project, permission));
            });
        }
    }

    listDiv.innerHTML = renderLoadingSpinner('Loading iterations');

    const LOAD_TIMEOUT_MS = 15_000;

    const listTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Iteration list request timed out')), LOAD_TIMEOUT_MS);
    });

    const projectPromise = (async () => {
        try {
            return await getProject(owner, project);
        } catch {}
    })();

    try {
        const [projectData, iterations] = await Promise.race([
            Promise.all([
                projectPromise,
                getIterations(owner, project),
            ]),
            listTimeoutPromise,
        ]);

        if (projectTitle) {
            projectTitle.textContent = projectData?.name ?? `Project ${owner}/${project}`;
        }

        if (!iterations || iterations.length === 0) {
            listDiv.innerHTML = renderEmptyStateSection({
                icon: 'bi-arrow-repeat',
                title: 'No iterations found.',
                description: 'Create an iteration to start organizing your strides.',
            });
            return;
        }

        iterations.sort((a, b) => b.id - a.id);

        listDiv.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Created</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${iterations.map(index => `
                            <tr>
                                <td>${escapeHtml(index.name)}</td>
                                <td>${formatDate(index.createdAt)}</td>
                                <td>
                                    <button class="view-iteration-btn btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" data-iteration-id="${index.id}" type="button">
                                        <i class="bi bi-eye" aria-hidden="true"></i>
                                        View
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        for (const button of document.querySelectorAll('.view-iteration-btn')) {
            button.addEventListener('click', () => {
                const iterationId = parseInt(/** @type {string} */(button.dataset.iterationId), 10);
                const iteration = iterations.find(index => index.id === iterationId);
                showIterationDetail(iteration ?? { id: iterationId, name: `Iteration #${iterationId}` });
            });
        }
    } catch (error) {
        listDiv.innerHTML = '';
        errorElement.textContent = 'Failed to load iterations.';
        console.error(error);
    }

    /**
     * Display the detail view for a specific iteration, including burndown chart and strides.
     * @param {Iteration} iteration - The iteration object.
     */
    async function showIterationDetail(iteration) {
        const iterationId = iteration.id;

        viewDiv.classList.add('d-none');
        detailDiv.classList.remove('d-none');

        const titleElement = /** @type {HTMLElement} */ (document.querySelector('#iteration-title'));
        const burndownCanvas = /** @type {HTMLElement} */ (document.querySelector('#iteration-burndown-canvas'));
        const strideDetailsDiv = /** @type {HTMLElement} */ (document.querySelector('#stride-details'));

        titleElement.textContent = iteration.name;
        burndownCanvas.innerHTML = renderLoadingSpinner('Loading burndown chart');
        strideDetailsDiv.innerHTML = renderLoadingSpinner('Loading strides');

        const BURNDOWN_TIMEOUT_MS = 10_000;

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Burndown request timed out')), BURNDOWN_TIMEOUT_MS);
        });

        try {
            const points = await Promise.race([getBurndown(owner, project, iterationId), timeoutPromise]);
            if (points && points.length > 0) {
                drawBurndownChart(burndownCanvas, points);
            } else {
                burndownCanvas.innerHTML = renderEmptyStateSection({
                    icon: 'bi-graph-down',
                    title: 'No burndown data available for this iteration.',
                    description: 'Burndown data will appear once moments have status updates.',
                });
            }
        } catch (error) {
            console.error('Iteration burndown error', error);
            burndownCanvas.innerHTML = '<p class="error">Failed to load iteration burndown.</p>';
        }

        try {
            const strides = await getStridesByIteration(owner, project, iterationId);
            if (!strides || strides.length === 0) {
                strideDetailsDiv.innerHTML = renderEmptyStateSection({
                    icon: 'bi-kanban',
                    title: 'No strides in this iteration.',
                    description: 'Create strides to organize your work within this iteration.',
                });
                return;
            }

            strides.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            strideDetailsDiv.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-sm table-striped table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">Stride</th>
                                <th scope="col">Start Date</th>
                                <th scope="col">End Date</th>
                                <th scope="col">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${strides.map(s => `
                                <tr>
                                    <td>${escapeHtml(s.name)}</td>
                                    <td>${formatDate(s.startDate)}</td>
                                    <td>${formatDate(s.endDate)}</td>
                                    <td>${s.durationDays} days</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            strideDetailsDiv.innerHTML = '<p class="error">Failed to load strides.</p>';
            console.error(error);
        }
    }

    const backButton = document.querySelector('#back-to-iterations-btn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            detailDiv.classList.add('d-none');
            viewDiv.classList.remove('d-none');
        });
    }
}

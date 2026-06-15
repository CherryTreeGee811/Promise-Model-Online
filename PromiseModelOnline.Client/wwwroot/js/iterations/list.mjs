import { getProject } from '../projects/api.mjs';
import { getIterations, getBurndown } from './api.mjs';
import { getStridesByIteration } from '../strides/api.mjs';
import { drawBurndownChart } from '../utils/burndown.mjs';
import { escapeHtml, renderLoadingSpinner } from '../utils/html.mjs';
import { renderEmptyStateSection } from '../utils/empty-table.mjs';
import { openIterationCreateModal } from '../utils/iteration-create-modal.mjs';

/**
 * Load the iteration history page with burndown charts.
 * @param {*} owner - TODO
 * @param {*} project - TODO
 * @param {*} permission - TODO
 */
export function loadIterationHistory(owner, project, permission) {
    const viewDiv = document.getElementById('iterations-view');
    const listDiv = document.getElementById('iterations-list');
    const detailDiv = document.getElementById('iteration-detail');
    const errorEl = document.getElementById('error-text');
    const projectTitle = document.getElementById('project-title');
    const createIterationBtn = document.getElementById('create-iteration-btn');

    const canEdit = permission?.permission === 'Edit';

    detailDiv.classList.add('d-none');
    errorEl.textContent = '';

    if (createIterationBtn) {
        if (!canEdit) {
            createIterationBtn.classList.add('d-none');
        } else if (createIterationBtn.dataset.bound !== '1') {
            createIterationBtn.dataset.bound = '1';
            createIterationBtn.addEventListener('click', async () => {
                openIterationCreateModal(owner, project, () => loadIterationHistory(owner, project, permission));
            });
        }
    }

    listDiv.innerHTML = renderLoadingSpinner('Loading iterations');

    const LOAD_TIMEOUT_MS = 15000;

    const listTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Iteration list request timed out')), LOAD_TIMEOUT_MS)
    );

    Promise.race([
        Promise.all([
            getProject(owner, project).catch(() => null),
            getIterations(owner, project)
        ]),
        listTimeoutPromise
    ])
        .then(([projectData, iterations]) => {
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
                            ${iterations.map(i => `
                                <tr>
                                    <td>${escapeHtml(i.name)}</td>
                                    <td>${formatDate(i.createdAt)}</td>
                                    <td>
                                        <button class="view-iteration-btn btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" data-iteration-id="${i.id}" type="button">
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

            document.querySelectorAll('.view-iteration-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const iterationId = parseInt(btn.dataset.iterationId, 10);
                    const iteration = iterations.find(i => i.id === iterationId);
                    showIterationDetail(iteration ?? { id: iterationId, name: `Iteration #${iterationId}` });
                });
            });
        })
        .catch(err => {
            listDiv.innerHTML = '';
            errorEl.textContent = 'Failed to load iterations.';
            console.error(err);
        });

    function showIterationDetail(iteration) {
        const iterationId = iteration.id;

        viewDiv.classList.add('d-none');
        detailDiv.classList.remove('d-none');

        const titleEl = document.getElementById('iteration-title');
        const burndownCanvas = document.getElementById('iteration-burndown-canvas');
        const strideDetailsDiv = document.getElementById('stride-details');

        titleEl.textContent = iteration.name;
        burndownCanvas.innerHTML = renderLoadingSpinner('Loading burndown chart');
        strideDetailsDiv.innerHTML = renderLoadingSpinner('Loading strides');

        const BURNDOWN_TIMEOUT_MS = 10000;

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Burndown request timed out')), BURNDOWN_TIMEOUT_MS)
        );

        Promise.race([getBurndown(owner, project, iterationId), timeoutPromise])
            .then(points => {
                if (points && points.length > 0) {
                    drawBurndownChart(burndownCanvas, points);
                } else {
                    burndownCanvas.innerHTML = renderEmptyStateSection({
                        icon: 'bi-graph-down',
                        title: 'No burndown data available for this iteration.',
                        description: 'Burndown data will appear once moments have status updates.',
                    });
                }
            })
            .catch(err => {
                console.error('Iteration burndown error', err);
                burndownCanvas.innerHTML = '<p class="error">Failed to load iteration burndown.</p>';
            });

        getStridesByIteration(owner, project, iterationId)
            .then(strides => {
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
            })
            .catch(err => {
                strideDetailsDiv.innerHTML = '<p class="error">Failed to load strides.</p>';
                console.error(err);
            });
    }

    document.getElementById('back-to-iterations-btn').addEventListener('click', () => {
        detailDiv.classList.add('d-none');
        viewDiv.classList.remove('d-none');
    });
}

function formatDate(dateStr) {
    return dateStr ? new Date(dateStr).toLocaleDateString('en-CA') : 'N/A';
}

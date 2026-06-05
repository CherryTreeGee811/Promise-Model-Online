import { getProjectById } from '../projects/api.mjs';
import { getIterationsByProject, getIterationBurndown } from './api.mjs';
import { getStridesByIteration } from '../strides/api.mjs';
import { drawBurndownChart } from '../utils/burndown.mjs';
import { escapeHtml, renderLoadingSpinner } from '../utils/html.mjs';
import { openIterationCreateModal } from '../utils/iteration-create-modal.mjs';

export function loadIterationHistory(projectId) {
    const listDiv = document.getElementById('iterations-list');
    const detailDiv = document.getElementById('iteration-detail');
    const loadingEl = document.getElementById('iteration-loading');
    const errorEl = document.getElementById('error-text');
    const projectTitle = document.getElementById('project-title');
    const createIterationBtn = document.getElementById('create-iteration-btn');

    detailDiv.classList.add('d-none');
    errorEl.textContent = '';

    if (createIterationBtn && createIterationBtn.dataset.bound !== '1') {
        createIterationBtn.dataset.bound = '1';
        createIterationBtn.addEventListener('click', async () => {
            openIterationCreateModal(projectId, () => loadIterationHistory(projectId));
        });
    }

    listDiv.innerHTML = renderLoadingSpinner('Loading iterations');

    Promise.all([
        getProjectById(projectId).catch(() => null),
        getIterationsByProject(projectId)
    ])
        .then(([project, iterations]) => {
            if (projectTitle) {
                projectTitle.textContent = project?.name ?? `Project ${projectId}`;
            }

            if (!iterations || iterations.length === 0) {
                listDiv.innerHTML = '<p class="no-items">No iterations found.</p>';
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
                                    <td>${new Date(i.createdAt).toLocaleDateString('en-CA')}</td>
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

        listDiv.classList.add('d-none');
        detailDiv.classList.remove('d-none');
        if (loadingEl) loadingEl.hidden = false;

        const titleEl = document.getElementById('iteration-title');
        const burndownContainer = document.getElementById('iteration-burndown-container');
        const burndownCanvas = document.getElementById('iteration-burndown-canvas');
        const strideDetailsDiv = document.getElementById('stride-details');

        titleEl.textContent = iteration.name;
        burndownCanvas.innerHTML = '';
        strideDetailsDiv.innerHTML = renderLoadingSpinner('Loading strides');

        getIterationBurndown(iterationId)
            .then(points => {
                if (loadingEl) loadingEl.hidden = true;

                if (points && points.length > 0) {
                    drawBurndownChart(burndownCanvas, points);
                } else {
                    burndownContainer.innerHTML = `
                        <h3>Burndown</h3>
                        <p class="no-items">No burndown data available for this iteration.</p>
                    `;
                }
            })
            .catch(err => {
                console.error('Iteration burndown error', err);
                if (loadingEl) loadingEl.hidden = true;
                burndownContainer.innerHTML = `
                    <h3>Burndown</h3>
                    <p class="error">Failed to load iteration burndown.</p>
                `;
            });

        getStridesByIteration(iterationId)
            .then(strides => {
                if (!strides || strides.length === 0) {
                    strideDetailsDiv.innerHTML = '<p class="no-items">No strides in this iteration.</p>';
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
        listDiv.classList.remove('d-none');
    });
}

function formatDate(dateStr) {
    return dateStr ? new Date(dateStr).toLocaleDateString('en-CA') : 'N/A';
}

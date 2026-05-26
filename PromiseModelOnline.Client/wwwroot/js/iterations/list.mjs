import { getProjectById } from '../projects/api.mjs';
import { getIterationsByProject, getIterationBurndown } from './api.mjs';
import { getStridesByIteration } from '../strides/api.mjs';
import { drawBurndownChart } from '../utils/burndown.mjs';

export function loadIterationHistory(projectId) {
    const listDiv = document.getElementById('iterations-list');
    const detailDiv = document.getElementById('iteration-detail');
    const errorEl = document.getElementById('error-text');
    const projectTitle = document.getElementById('project-title');

    // Start with list visible, detail hidden
    listDiv.classList.remove('hidden');
    detailDiv.classList.add('hidden');

    listDiv.innerHTML = renderLoadingSpinner('Loading iterations');
    errorEl.textContent = '';

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

            // Sort newest first
            iterations.sort((a, b) => b.id - a.id);

            listDiv.innerHTML = `
                <table class="promisemodel-table">
                    <thead><tr><th>Name</th><th>Created</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${iterations.map(i => `
                            <tr>
                                <td>${escapeHtml(i.name)}</td>
                                <td>${new Date(i.createdAt).toLocaleDateString('en-CA')}</td>
                                <td><button class="view-iteration-btn btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" data-iteration-id="${i.id}" type="button">View</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Attach click listeners to View buttons
            document.querySelectorAll('.view-iteration-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const iterationId = parseInt(btn.dataset.iterationId, 10);
                    showIterationDetail(iterationId);
                });
            });
        })
        .catch(err => {
            listDiv.innerHTML = '';
            errorEl.textContent = 'Failed to load iterations.';
            console.error(err);
        });

    function showIterationDetail(iterationId) {
        // Hide list, show detail
        listDiv.classList.add('hidden');
        detailDiv.classList.remove('hidden');

        document.getElementById('iteration-title').textContent = `Iteration #${iterationId}`;
        const strideDetailsDiv = document.getElementById('stride-details');
        const canvas = document.getElementById('iteration-burndown-canvas');

        // Clear previous content
        strideDetailsDiv.innerHTML = '<p>Loading strides…</p>';

        // Draw iteration burndown
        getIterationBurndown(iterationId)
            .then(points => {
                if (points && points.length > 0) {
                    drawBurndownChart(canvas, points);
                } else {
                    const container = document.getElementById('iteration-burndown-container');
                    if (container) {
                        container.innerHTML += '<p class="no-items">No burndown data available for this iteration.</p>';
                    }
                }
            })
            .catch(err => {
                console.error('Iteration burndown error', err);
                const container = document.getElementById('iteration-burndown-container');
                if (container) {
                    container.innerHTML += '<p class="error">Failed to load iteration burndown.</p>';
                }
            });

        // Load strides for this iteration (no burndown charts)
        getStridesByIteration(iterationId)
            .then(strides => {
                if (!strides || strides.length === 0) {
                    strideDetailsDiv.innerHTML = '<p class="no-items">No strides in this iteration.</p>';
                    return;
                }

                // Sort by start date
                strides.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

                strideDetailsDiv.innerHTML = `
                    <table class="promisemodel-table">
                        <thead>
                            <tr>
                                <th>Stride</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Duration</th>
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
                `;
            })
            .catch(err => {
                strideDetailsDiv.innerHTML = '<p class="error">Failed to load strides.</p>';
                console.error(err);
            });
    }

    // Back button handler
    document.getElementById('back-to-iterations-btn').addEventListener('click', () => {
        detailDiv.classList.add('hidden');
        listDiv.classList.remove('hidden');
    });
}

function renderLoadingSpinner(message) {
    return `
        <div class="d-flex w-100 justify-content-center align-items-center py-5" aria-live="polite">
            <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(message)}">
                <span class="visually-hidden">${escapeHtml(message)}</span>
            </div>
        </div>
    `;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function formatDate(dateStr) {
    return dateStr ? new Date(dateStr).toLocaleDateString('en-CA') : 'N/A';
}
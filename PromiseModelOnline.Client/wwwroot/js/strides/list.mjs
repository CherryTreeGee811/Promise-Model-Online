import { getIterationsByProject, getStridesByIteration, getMomentsByStride, getMomentsByIteration } from './api.mjs';

export function loadStridesList(projectId, navContentDiv, contentDiv) {
    const strideBoard = document.getElementById('stride-board');
    const backlogSection = document.getElementById('backlog-section');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');
    const projectTitle = document.getElementById('project-title');

    loadingEl.textContent = 'Loading iterations and strides...';
    errorEl.textContent = '';
    strideBoard.innerHTML = '';
    if (backlogSection) backlogSection.innerHTML = '';

    // Step 1: Get iterations, find the latest one
    getIterationsByProject(projectId)
        .then(iterations => {
            if (!iterations || iterations.length === 0) {
                loadingEl.textContent = '';
                errorEl.textContent = 'No iterations found for this project.';
                return;
            }

            // Sort by ID descending to get the latest
            iterations.sort((a, b) => b.id - a.id);
            const latestIteration = iterations[0];

            projectTitle.innerHTML = `<h2>Project ID: ${projectId} – ${escapeHtml(latestIteration.name)}</h2>`;

            // Step 2: Fetch strides and backlog moments for the latest iteration
            return Promise.all([
                getStridesByIteration(latestIteration.id),
                getMomentsByIteration(latestIteration.id, true) // unassigned
            ]).then(([strides, backlogMoments]) => ({ strides, backlogMoments }));
        })
        .then(data => {
            if (!data) return;

            const { strides, backlogMoments } = data;
            loadingEl.textContent = '';

            if (!strides || strides.length === 0) {
                strideBoard.innerHTML = '<p>No strides found for this iteration.</p>';
            } else {
                // Fetch moments for each stride
                const stridePromises = strides.map(stride => {
                    return getMomentsByStride(stride.id)
                        .then(moments => ({ stride, moments }))
                        .catch(() => ({ stride, moments: [] }));
                });

                return Promise.all(stridePromises).then(results => ({ results, backlogMoments }));
            }
            return { results: [], backlogMoments };
        })
        .then(data => {
            if (!data) return;

            const { results, backlogMoments } = data;

            // Render stride cards
            results.forEach(({ stride, moments }) => {
                const card = document.createElement('div');
                card.className = 'stride-card';
                card.innerHTML = `
                    <div class="stride-header">
                        <h3>${escapeHtml(stride.name)}</h3>
                        <span class="stride-dates">${formatDate(stride.startDate)} – ${formatDate(stride.endDate)}</span>
                        <span class="stride-duration">(${stride.durationDays} days)</span>
                    </div>
                    <div class="stride-moments">
                        ${moments.length === 0 
                            ? '<p class="no-items">No moments assigned.</p>'
                            : `<table class="promisemodel-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Statement</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Effort</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${moments.map(m => `
                                        <tr>
                                            <td>${m.id}</td>
                                            <td>${escapeHtml(m.statement)}</td>
                                            <td>${m.type}</td>
                                            <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                            <td>${m.effortEstimate ?? '–'}</td>
                                            <td><a href="/moments/${m.id}" class="view-btn">View</a></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>`
                        }
                    </div>
                `;
                strideBoard.appendChild(card);
            });

            // Render Backlog
            if (backlogSection) {
                if (!backlogMoments || backlogMoments.length === 0) {
                    backlogSection.innerHTML = '<h2>Backlog</h2><p class="no-items">No unassigned moments.</p>';
                } else {
                    backlogSection.innerHTML = `
                        <h2>Backlog</h2>
                        <div class="backlog-card">
                            <table class="promisemodel-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Statement</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Effort</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${backlogMoments.map(m => `
                                        <tr>
                                            <td>${m.id}</td>
                                            <td>${escapeHtml(m.statement)}</td>
                                            <td>${m.type}</td>
                                            <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                            <td>${m.effortEstimate ?? '–'}</td>
                                            <td><a href="/moments/${m.id}" class="view-btn">View</a></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            }
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load data.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}
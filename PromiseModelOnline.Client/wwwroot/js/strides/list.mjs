import { getIterationsByProject, getStridesByIteration, getMomentsByStride, getMomentsByIteration } from './api.mjs';
import { moveMomentToStride, updateMomentStatus } from '../moments/api.mjs';

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

    getIterationsByProject(projectId)
        .then(iterations => {
            if (!iterations || iterations.length === 0) {
                loadingEl.textContent = '';
                errorEl.textContent = 'No iterations found for this project.';
                return;
            }
            iterations.sort((a, b) => b.id - a.id);
            const latestIteration = iterations[0];
            projectTitle.innerHTML = `<h2>Project ID: ${projectId} – ${escapeHtml(latestIteration.name)}</h2>`;

            return Promise.all([
                getStridesByIteration(latestIteration.id),
                getMomentsByIteration(latestIteration.id, true)
            ]).then(([strides, backlogMoments]) => ({ strides, backlogMoments }));
        })
        .then(data => {
            if (!data) return;
            const { strides, backlogMoments } = data;
            loadingEl.textContent = '';

            if (!strides || strides.length === 0) {
                strideBoard.innerHTML = '<p>No strides found for this iteration.</p>';
            } else {
                const stridePromises = strides.map(stride =>
                    getMomentsByStride(stride.id)
                        .then(moments => ({ stride, moments }))
                        .catch(() => ({ stride, moments: [] }))
                );
                return Promise.all(stridePromises).then(results => ({ results, backlogMoments, strides }));
            }
            return { results: [], backlogMoments, strides: [] };
        })
        .then(data => {
            if (!data) return;
            const { results, backlogMoments, strides: allStrides } = data;

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
                            : `<table class="promisemodel-table"><thead><tr><th>ID</th><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr></thead><tbody>
                                ${moments.map(m => `
                                    <tr>
                                        <td>${m.id}</td>
                                        <td>${escapeHtml(m.statement)}</td>
                                        <td>${m.type}</td>
                                        <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                        <td>${m.effortEstimate ?? '–'}</td>
                                        <td>
                                            <select class="status-dropdown" data-moment-id="${m.id}">
                                                <option value="Todo" ${m.status === 'Todo' ? 'selected' : ''}>Todo</option>
                                                <option value="InProgress" ${m.status === 'InProgress' ? 'selected' : ''}>InProgress</option>
                                                <option value="Blocked" ${m.status === 'Blocked' ? 'selected' : ''}>Blocked</option>
                                                <option value="Done" ${m.status === 'Done' ? 'selected' : ''}>Done</option>
                                            </select>
                                            <button class="move-to-backlog-btn" data-moment-id="${m.id}">Backlog</button>
                                            <a href="/moments/${m.id}" class="view-btn">View</a>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody></table>`
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
                    backlogSection.innerHTML = `<h2>Backlog</h2><div class="backlog-card"><table class="promisemodel-table"><thead><tr><th>ID</th><th>Statement</th><th>Type</th><th>Status</th><th>Effort</th><th>Actions</th></tr></thead><tbody>
                        ${backlogMoments.map(m => `
                            <tr>
                                <td>${m.id}</td>
                                <td>${escapeHtml(m.statement)}</td>
                                <td>${m.type}</td>
                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td>${m.effortEstimate ?? '–'}</td>
                                <td>
                                    <select class="backlog-target-stride" data-moment-id="${m.id}">
                                        ${allStrides.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
                                    </select>
                                    <button class="move-to-stride-from-backlog-btn" data-moment-id="${m.id}">Move</button>
                                    <a href="/moments/${m.id}" class="view-btn">View</a>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody></table></div>`;
                }
            }

            // Attach planning event listeners
            attachPlanningListeners(projectId, navContentDiv, contentDiv);
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load data.';
            console.error(err);
        });
}

function attachPlanningListeners(projectId, navContentDiv, contentDiv) {
    // Status dropdown changes
    document.querySelectorAll('.status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', async () => {
            const momentId = parseInt(dropdown.dataset.momentId, 10);
            const newStatus = dropdown.value;
            try {
                await updateMomentStatus(momentId, newStatus);
                loadStridesList(projectId, navContentDiv, contentDiv);
            } catch (err) {
                alert('Failed to update status');
                console.error(err);
            }
        });
    });

    // Move to Backlog buttons
    document.querySelectorAll('.move-to-backlog-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const momentId = parseInt(btn.dataset.momentId, 10);
            if (!confirm('Move this moment to the backlog?')) return;
            try {
                await moveMomentToStride(momentId, null);
                loadStridesList(projectId, navContentDiv, contentDiv);
            } catch (err) {
                alert('Failed to move moment');
                console.error(err);
            }
        });
    });

    // Move from Backlog to Stride
    document.querySelectorAll('.move-to-stride-from-backlog-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const momentId = parseInt(btn.dataset.momentId, 10);
            const select = document.querySelector(`.backlog-target-stride[data-moment-id="${momentId}"]`);
            const targetStrideId = select ? parseInt(select.value, 10) : null;
            if (!targetStrideId) return;
            if (!confirm(`Move this moment to the selected stride?`)) return;
            try {
                await moveMomentToStride(momentId, targetStrideId);
                loadStridesList(projectId, navContentDiv, contentDiv);
            } catch (err) {
                alert('Failed to move moment');
                console.error(err);
            }
        });
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
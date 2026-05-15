import { getIterationsByProject, getStridesByIteration, getMomentsByStride, getMomentsByIteration, getProjectMembers, getMyPermission, progressStride, getStrideBurndown } from './api.mjs';
import { moveMomentToStride, updateMomentStatus, updateMomentEstimate, updateMomentOwner } from '../moments/api.mjs';

/* ---------- T‑shirt size to numeric mapping ---------- */
const estimateValues = {
    XS: 1, S: 2, M: 3, L: 5, XL: 8, XXL: 13, XXXL: 21
};

function totalEffort(moments) {
    return moments.reduce((sum, m) => sum + (estimateValues[m.effortEstimate] || 0), 0);
}

/* ---------- Main export ---------- */
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

            const historyLink = document.getElementById('iteration-history-link');
            if (historyLink) {
                historyLink.href = `/projects/${projectId}/iterations`;
            }
            
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
                const effTotal = totalEffort(moments);
                card.innerHTML = `
                    <div class="stride-header">
                        <h3>${escapeHtml(stride.name)}</h3>
                        <span class="stride-dates">${formatDate(stride.startDate)} – ${formatDate(stride.endDate)}</span>
                        <span class="stride-duration">(${stride.durationDays} days)</span>
                        <span class="stride-countdown" data-end-date="${stride.endDate}"></span>
                        <span class="stride-total-effort">Total Effort: ${effTotal}</span>
                        <button class="progress-stride-btn" data-stride-id="${stride.id}" style="display:none;">Progress</button>
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
                                        <th>Owner</th>
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
                                            <td>
                                                <select class="estimate-dropdown" data-moment-id="${m.id}">
                                                    <option value="">–</option>
                                                    <option value="XS" ${m.effortEstimate === 'XS' ? 'selected' : ''}>XS</option>
                                                    <option value="S"  ${m.effortEstimate === 'S'  ? 'selected' : ''}>S</option>
                                                    <option value="M"  ${m.effortEstimate === 'M'  ? 'selected' : ''}>M</option>
                                                    <option value="L"  ${m.effortEstimate === 'L'  ? 'selected' : ''}>L</option>
                                                    <option value="XL" ${m.effortEstimate === 'XL' ? 'selected' : ''}>XL</option>
                                                    <option value="XXL"${m.effortEstimate === 'XXL'? 'selected' : ''}>XXL</option>
                                                    <option value="XXXL"${m.effortEstimate === 'XXXL'? 'selected' : ''}>XXXL</option>
                                                </select>
                                            </td>
                                            <td>
                                                <select class="owner-dropdown" data-moment-id="${m.id}" data-owner-id="${m.ownerId ?? ''}">
                                                    <option value="">Unassigned</option>
                                                </select>
                                            </td>
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
                                </tbody>
                            </table>`
                        }
                    </div>
                `;
                strideBoard.appendChild(card);

                // --- Burndown chart ---
                const canvas = document.createElement('canvas');
                canvas.className = 'burndown-canvas';
                canvas.width = 400;
                canvas.height = 200;
                card.appendChild(canvas);

                getStrideBurndown(stride.id)
                    .then(points => {
                        if (points && points.length > 0) {
                            drawBurndownChart(canvas, points);
                        }
                    })
                    .catch(err => console.error('Failed to load burndown', err));
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

            // Load project members and populate owner dropdowns
            getProjectMembers(projectId)
                .then(members => {
                    document.querySelectorAll('.owner-dropdown').forEach(dropdown => {
                        const currentOwnerId = dropdown.getAttribute('data-owner-id');
                        dropdown.innerHTML = '<option value="">Unassigned</option>' +
                            members.map(m => `<option value="${m.userId}">${escapeHtml(m.userName)}</option>`).join('');
                        if (currentOwnerId) {
                            dropdown.value = currentOwnerId;
                        }
                    });
                })
                .catch(err => console.error('Failed to load project members', err));

            // Fetch permission and update UI
            getMyPermission(projectId)
                .then(level => {
                    if (level !== 'Edit') {
                        document.querySelectorAll('.status-dropdown, .estimate-dropdown, .owner-dropdown, .move-to-backlog-btn, .move-to-stride-from-backlog-btn')
                            .forEach(el => el.disabled = true);
                    } else {
                        // Show progress buttons for Edit users
                        document.querySelectorAll('.progress-stride-btn').forEach(btn => btn.style.display = 'inline-block');
                    }
                })
                .catch(err => console.error('Failed to get permission', err));

            // Update countdowns
            updateCountdowns();

            // Attach planning event listeners
            attachPlanningListeners(projectId, navContentDiv, contentDiv);
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load data.';
            console.error(err);
        });
}

/* ---------- Event listeners ---------- */
function attachPlanningListeners(projectId, navContentDiv, contentDiv) {
    // Status dropdown
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

    // Estimate dropdown
    document.querySelectorAll('.estimate-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', async () => {
            const momentId = parseInt(dropdown.dataset.momentId, 10);
            const estimate = dropdown.value === '' ? null : dropdown.value;
            try {
                await updateMomentEstimate(momentId, estimate);
                loadStridesList(projectId, navContentDiv, contentDiv);
            } catch (err) {
                alert('Failed to update estimate');
                console.error(err);
            }
        });
    });

    // Owner dropdown
    document.querySelectorAll('.owner-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', async () => {
            const momentId = parseInt(dropdown.dataset.momentId, 10);
            const newOwnerId = dropdown.value ? parseInt(dropdown.value, 10) : null;
            try {
                await updateMomentOwner(momentId, newOwnerId);
                loadStridesList(projectId, navContentDiv, contentDiv);
            } catch (err) {
                alert('Failed to update owner');
                console.error(err);
            }
        });
    });

    // Move to Backlog
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

    // Progress Stride button
    document.querySelectorAll('.progress-stride-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const strideId = parseInt(btn.dataset.strideId, 10);
            if (!confirm('Move all unfinished moments to the next stride?')) return;
            try {
                await progressStride(strideId);
                loadStridesList(projectId, navContentDiv, contentDiv);
            } catch (err) {
                alert('Failed to progress stride');
                console.error(err);
            }
        });
    });
}

/* ---------- Burndown drawing ---------- */
function drawBurndownChart(canvas, points) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = 30;

    ctx.clearRect(0, 0, w, h);

    const maxEffort = Math.max(...points.map(p => Math.max(p.remainingEffort, p.idealRemaining)), 1);

    // Axes
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Ideal line (dashed)
    ctx.beginPath();
    ctx.strokeStyle = '#3498db';
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
        const x = pad + (i / (points.length - 1)) * (w - pad * 2);
        const y = h - pad - (p.idealRemaining / maxEffort) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual line
    ctx.beginPath();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
        const x = pad + (i / (points.length - 1)) * (w - pad * 2);
        const y = h - pad - (p.remainingEffort / maxEffort) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    const firstDate = points[0]?.date ? new Date(points[0].date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '';
    const lastDate = points[points.length - 1]?.date ? new Date(points[points.length - 1].date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '';
    ctx.fillText(firstDate, pad, h - pad + 15);
    ctx.fillText(lastDate, w - pad - 40, h - pad + 15);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Effort', -h / 2, 15);
    ctx.restore();
}

/* ---------- Helpers ---------- */
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

function updateCountdowns() {
    document.querySelectorAll('.stride-countdown').forEach(el => {
        const endDate = new Date(el.dataset.endDate);
        const now = new Date();
        const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            el.textContent = 'Ended';
            el.style.color = '#e74c3c';
        } else if (diffDays === 0) {
            el.textContent = 'Ends today';
            el.style.color = '#e67e22';
        } else if (diffDays <= 3) {
            el.textContent = `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
            el.style.color = '#e67e22';
        } else {
            el.textContent = `${diffDays} days left`;
            el.style.color = '#2ecc71';
        }
    });
}
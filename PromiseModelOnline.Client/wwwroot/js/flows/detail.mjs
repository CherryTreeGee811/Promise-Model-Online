import { getFlowById, getMomentsByFlow, updateFlow } from './api.mjs';
import { getJourneyById } from '../journeys/api.mjs';
import { loadComments } from '../comments/comments.mjs';

export function loadFlowDetail(flowId, contentDiv) {
    const detailDiv = document.getElementById('flow-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading flow...';
    errorEl.textContent = '';

    getFlowById(flowId)
        .then(flow => {
            loadingEl.textContent = '';
            detailDiv.innerHTML = `
                <div class="flow-detail-card">
                    <h2>${escapeHtml(flow.statement)}</h2>
                    <table class="detail-table">
                        <tr><th>ID</th><td>${flow.id}</td></tr>
                        <tr><th>Description</th><td>
                            <textarea id="description-input" rows="4" style="width:100%">${escapeHtml(flow.description || '')}</textarea>
                            <div style="margin-top:6px"><button id="save-desc" class="save-btn">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Journey</th>
                            <td id="flow-journey-cell">
                                <a href="/journeys/${flow.journeyId}" class="detail-link">Journey ${flow.journeyId}</a>
                            </td>
                        </tr>
                        <tr><th>Status</th><td id="flow-status-cell">${getStatusIcon(flow.statusColor)}</td></tr>
                        <tr><th>Created</th><td>${new Date(flow.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Moments</h3>
                    <div id="flow-moments-list">
                        <p>Loading moments...</p>
                    </div>
                    <div id="flow-comments"></div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

            // Load moments for this flow
            const momentsList = document.getElementById('flow-moments-list');
            getMomentsByFlow(flowId)
                .then(moments => {
                    if (!moments || moments.length === 0) {
                        momentsList.innerHTML = '<p class="no-items">No moments found for this flow.</p>';
                        return;
                    }
                    momentsList.innerHTML = `
                        <table class="promisemodel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Statement</th>
                                    <th>Type</th>
                                    <th>Status</th>
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
                                        <td><a href="/moments/${m.id}" class="view-btn">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                })
                .catch(() => {
                    momentsList.innerHTML = '<p class="error">Failed to load moments.</p>';
                });

            // Back button event
            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            // Load parent journey to show its status emoji
            const journeyCell = document.getElementById('flow-journey-cell');
            getJourneyById(flow.journeyId)
                .then(journey => {
                    const icon = getStatusIcon(journey.statusColor);
                    journeyCell.innerHTML = `<a href="/journeys/${journey.id}" class="detail-link">${escapeHtml(journey.statement)}</a> ${icon}`;
                })
                .catch(() => {
                    // leave link as-is
                });

            // Description save handler
            const saveBtn = document.getElementById('save-desc');
            const descMsg = document.getElementById('desc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = document.getElementById('description-input').value;
                    try {
                        const updated = { ...flow, description: newDesc };
                        await updateFlow(updated);
                        descMsg.textContent = 'Saved';
                    } catch (err) {
                        descMsg.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        saveBtn.disabled = false;
                    }
                });
            }

            const commentsContainer = document.getElementById('flow-comments');
            loadComments(commentsContainer, 'Flow', flowId);
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load flow details.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function getStatusIcon(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '🟢';
    if (normalized.includes('black') || normalized.includes('blocked')) return '⚫️';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '🟠';
    if (normalized.includes('red') || normalized.includes('todo')) return '🔴';
    return '⚪';
}
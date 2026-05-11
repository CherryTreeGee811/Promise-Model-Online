import { getFlowById, getMomentsByFlow } from './api.mjs';

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
                        <tr><th>Description</th><td>${escapeHtml(flow.description || '–')}</td></tr>
                        <tr>
                            <th>Journey</th>
                            <td>
                                <a href="/journeys/${flow.journeyId}" class="detail-link">Journey ${flow.journeyId}</a>
                            </td>
                        </tr>
                        <tr><th>Status Color</th><td>${escapeHtml(flow.statusColor || '–')}</td></tr>
                        <tr><th>Display Order</th><td>${flow.displayOrder}</td></tr>
                        <tr><th>Created</th><td>${new Date(flow.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Moments</h3>
                    <div id="flow-moments-list">
                        <p>Loading moments...</p>
                    </div>
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
                backLink.addEventListener('click', (e) => {
                    window.history.back();
                });
            }
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
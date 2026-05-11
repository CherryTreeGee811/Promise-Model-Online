import { getJourneyById, getFlowsByJourney } from './api.mjs';

export function loadJourneyDetail(journeyId, contentDiv) {
    const detailDiv = document.getElementById('journey-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading journey...';
    errorEl.textContent = '';

    getJourneyById(journeyId)
        .then(journey => {
            loadingEl.textContent = '';
            detailDiv.innerHTML = `
                <div class="journey-detail-card">
                    <h2>${escapeHtml(journey.statement)}</h2>
                    <table class="detail-table">
                        <tr><th>ID</th><td>${journey.id}</td></tr>
                        <tr><th>Description</th><td>${escapeHtml(journey.description || '–')}</td></tr>
                        <tr>
                            <th>Epic</th>
                            <td>
                                <a href="/epics/${journey.epicId}" class="detail-link">Epic ${journey.epicId}</a>
                            </td>
                        </tr>
                        <tr><th>Status Color</th><td>${escapeHtml(journey.statusColor || '–')}</td></tr>
                        <tr><th>Display Order</th><td>${journey.displayOrder}</td></tr>
                        <tr><th>Created</th><td>${new Date(journey.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${journey.updatedAt ? new Date(journey.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Flows</h3>
                    <div id="journey-flows-list">
                        <p>Loading flows...</p>
                    </div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

            const flowsList = document.getElementById('journey-flows-list');
            getFlowsByJourney(journeyId)
                .then(flows => {
                    if (!flows || flows.length === 0) {
                        flowsList.innerHTML = '<p class="no-items">No flows found for this journey.</p>';
                        return;
                    }
                    flowsList.innerHTML = `
                        <table class="promisemodel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Statement</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${flows.map(f => `
                                    <tr>
                                        <td>${f.id}</td>
                                        <td>${escapeHtml(f.statement)}</td>
                                        <td><a href="/flows/${f.id}" class="view-btn">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                })
                .catch(() => {
                    flowsList.innerHTML = '<p class="error">Failed to load flows.</p>';
                });

            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', (e) => {
                    window.history.back();
                });
            }
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load journey details.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}
import { getEpicById, getJourneysByEpic } from './api.mjs';
import { getPromiseById } from '../promises/api.mjs';
import { loadComments } from '../comments/comments.mjs';

export function loadEpicDetail(epicId, contentDiv) {
    const detailDiv = document.getElementById('epic-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading epic…';
    errorEl.textContent = '';

    getEpicById(epicId)
        .then(epic => {
            detailDiv.innerHTML = `
                <div class="epic-detail-card">
                    <h2>${escapeHtml(epic.statement)}</h2>
                    <table class="detail-table">
                        <tr><th>ID</th><td>${epic.id}</td></tr>
                        <tr><th>Description</th><td>${escapeHtml(epic.description || '–')}</td></tr>
                        <tr>
                            <th>Parent Promise</th>
                            <td id="epic-parent-promise">Loading…</td>
                        </tr>
                        <tr><th>Status Color</th><td>${escapeHtml(epic.statusColor || '–')}</td></tr>
                        <tr><th>Display Order</th><td>${epic.displayOrder}</td></tr>
                        <tr><th>Created</th><td>${new Date(epic.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${epic.updatedAt ? new Date(epic.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Journeys</h3>
                    <div id="epic-journeys-list">
                        <p>Loading journeys…</p>
                    </div>
                    <div id="epic-comments"></div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

            loadingEl.textContent = '';

            // Load parent promise name asynchronously
            const parentCell = document.getElementById('epic-parent-promise');
            getPromiseById(epic.productPromiseId)
                .then(promise => {
                    parentCell.innerHTML = `<a href="/promises/${promise.id}" class="detail-link">${escapeHtml(promise.statement)}</a>`;
                })
                .catch(() => {
                    parentCell.textContent = `Promise ${epic.productPromiseId}`;
                });

            // Load journeys
            const journeysList = document.getElementById('epic-journeys-list');
            getJourneysByEpic(epicId)
                .then(journeys => {
                    if (!journeys || journeys.length === 0) {
                        journeysList.innerHTML = '<p class="no-items">No journeys found for this epic.</p>';
                        return;
                    }
                    journeysList.innerHTML = `
                        <table class="promisemodel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Statement</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${journeys.map(j => `
                                    <tr>
                                        <td>${j.id}</td>
                                        <td>${escapeHtml(j.statement)}</td>
                                        <td><a href="/journeys/${j.id}" class="view-btn">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                })
                .catch(() => {
                    journeysList.innerHTML = '<p class="error">Failed to load journeys.</p>';
                });

            // Back button
            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            // Comments
            const commentsContainer = document.getElementById('epic-comments');
            loadComments(commentsContainer, 'Epic', epicId);
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load epic details.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}
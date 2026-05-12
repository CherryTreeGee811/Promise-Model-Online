import { getPromiseById, getEpicsByPromise } from './api.mjs';
import { loadComments } from '../comments/comments.mjs';

export function loadPromiseDetail(promiseId, contentDiv) {
    const detailDiv = document.getElementById('promise-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading promise…';
    errorEl.textContent = '';

    getPromiseById(promiseId)
        .then(promise => {
            detailDiv.innerHTML = `
                <div class="promise-detail-card">
                    <h2>${escapeHtml(promise.statement)}</h2>
                    <table class="detail-table">
                        <tr><th>ID</th><td>${promise.id}</td></tr>
                        <tr><th>Description</th><td>${escapeHtml(promise.description || '–')}</td></tr>
                        <tr><th>Status Color</th><td>${escapeHtml(promise.statusColor || '–')}</td></tr>
                        <tr><th>Created</th><td>${new Date(promise.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${promise.updatedAt ? new Date(promise.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Epics</h3>
                    <div id="promise-epics-list">
                        <p>Loading epics…</p>
                    </div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;
            
            const commentsContainer = document.createElement('div');
            commentsContainer.id = 'comments-section';
            detailDiv.appendChild(commentsContainer);
            loadComments(commentsContainer, 'Promise', promiseId);

            loadingEl.textContent = '';

            const epicsList = document.getElementById('promise-epics-list');
            getEpicsByPromise(promiseId)
                .then(epics => {
                    if (!epics || epics.length === 0) {
                        epicsList.innerHTML = '<p class="no-items">No epics found for this promise.</p>';
                        return;
                    }
                    epicsList.innerHTML = `
                        <table class="promisemodel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Statement</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${epics.map(e => `
                                    <tr>
                                        <td>${e.id}</td>
                                        <td>${escapeHtml(e.statement)}</td>
                                        <td><a href="/epics/${e.id}" class="view-btn">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                })
                .catch(() => {
                    epicsList.innerHTML = '<p class="error">Failed to load epics.</p>';
                });

            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load promise details.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}
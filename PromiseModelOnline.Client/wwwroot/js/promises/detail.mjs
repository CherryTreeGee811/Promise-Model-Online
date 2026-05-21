import { getPromiseById, getEpicsByPromise, updatePromise } from './api.mjs';
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
                        <tr><th>Description</th><td>
                            <textarea id="description-input" rows="4" style="width:100%">${escapeHtml(promise.description || '')}</textarea>
                            <div style="margin-top:6px"><button id="save-desc" class="save-btn">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr><th>Status</th><td id="promise-status-cell">${getStatusIcon(promise.statusColor)}</td></tr>
                        <tr><th>Created</th><td>${new Date(promise.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Updated</th><td>${promise.updatedAt ? new Date(promise.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Epics</h3>
                    <div id="promise-epics-list">
                        <p>Loading epics…</p>
                    </div>
                    <div id="promise-comments"></div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

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

            // Comments section
            const commentsContainer = document.getElementById('promise-comments');
            loadComments(commentsContainer, 'Promise', promiseId);
            
            const reactionsContainer = document.createElement('div');
            reactionsContainer.id = 'reactions-section';
            detailDiv.appendChild(reactionsContainer);
            loadReactions(reactionsContainer, 'Promise', promiseId);

            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            // Description save handler
            const saveBtn = document.getElementById('save-desc');
            const descMsg = document.getElementById('desc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = document.getElementById('description-input').value;
                    try {
                        const updated = { ...promise, description: newDesc };
                        await updatePromise(updated);
                        descMsg.textContent = 'Saved';
                    } catch (err) {
                        descMsg.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        saveBtn.disabled = false;
                    }
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

function getStatusIcon(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '🟢';
    if (normalized.includes('black') || normalized.includes('blocked')) return '⚫️';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '🟠';
    if (normalized.includes('red') || normalized.includes('todo')) return '🔴';
    return '⚪';
}
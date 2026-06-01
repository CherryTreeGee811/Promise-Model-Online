import { routeHandler } from '../router.mjs';
import { getPromiseById, getEpicsByPromise, updatePromise } from './api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { loadReactions } from '../reactions/reactions.mjs';
import { escapeHtml } from "../utils/html.mjs";
import { getStatusIcon } from "../utils/status.mjs";
import { formatDate } from "../utils/date.mjs";

export function loadPromiseDetail(promiseId, navContentDiv, contentDiv) {
    const detailDiv = document.getElementById('promise-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    loadingEl.textContent = 'Loading promise…';
    errorEl.textContent = '';

    getPromiseById(promiseId)
        .then(promise => {

            const createdDate = formatDate(promise.createdAt, '–');
            const updatedDate = formatDate(promise.updatedAt, '–');

            detailDiv.innerHTML = `
                <div class="promise-detail-card">
                    <h2>${escapeHtml(promise.statement)}</h2>

                    <table class="detail-table">
                        <tr>
                            <th>ID</th>
                            <td>${promise.id}</td>
                        </tr>

                        <tr>
                            <th>Description</th>
                            <td>
                                <textarea id="description-input" rows="4"></textarea>
                                <div class="save-btn-div">
                                    <button id="save-desc" class="save-btn">Save</button>
                                    <span id="desc-save-msg"></span>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <th>Status</th>
                            <td id="promise-status-cell">
                                ${getStatusIcon(promise.statusColor)}
                            </td>
                        </tr>

                        <tr>
                            <th>Created</th>
                            <td>${createdDate}</td>
                        </tr>

                        <tr>
                            <th>Updated</th>
                            <td>${updatedDate}</td>
                        </tr>
                    </table>

                    <h3>Epics</h3>
                    <div id="promise-epics-list">
                        <p>Loading epics…</p>
                    </div>

                    <div id="promise-comments"></div>

                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

            // ✅ SAFE: set textarea value via DOM (avoids HTML injection issues)
            const descInput = document.getElementById('description-input');
            if (descInput) {
                descInput.value = promise.description || '';
            }

            /* ---------- Epics ---------- */
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
                                        <td>
                                            <a href="/epics/${e.id}" data-epic-id="${e.id}" class="view-btn">View</a>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;

                    // ✅ SPA navigation for epics
                    epicsList.querySelectorAll('.view-btn[data-epic-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;

                            e.preventDefault();

                            const epicId = link.dataset.epicId;
                            window.history.pushState({}, '', `/epics/${epicId}`);

                            routeHandler(navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    epicsList.innerHTML = '<p class="error">Failed to load epics.</p>';
                });

            /* ---------- Comments ---------- */
            const commentsContainer = document.getElementById('promise-comments');
            loadComments(commentsContainer, 'Promise', promiseId);

            /* ---------- Reactions ---------- */
            const reactionsContainer = document.createElement('div');
            reactionsContainer.id = 'reactions-section';
            detailDiv.appendChild(reactionsContainer);

            loadReactions(reactionsContainer, 'Promise', promiseId);

            /* ---------- Back navigation ---------- */
            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            /* ---------- Save description ---------- */
            const saveBtn = document.getElementById('save-desc');
            const descMsg = document.getElementById('desc-save-msg');

            if (saveBtn && descInput) {
                saveBtn.addEventListener('click', async (e) => {
                    e.preventDefault();

                    descMsg.textContent = '';
                    saveBtn.disabled = true;

                    try {
                        const updated = {
                            ...promise,
                            description: descInput.value
                        };

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

            loadingEl.textContent = '';
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load promise details.';
            console.error(err);
        });
}
import { getPromiseById, getEpicsByPromise, updatePromiseDescription } from './api.mjs';
import { addEpic } from '../epics/api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { loadReactions } from '../reactions/reactions.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';

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
                    const tbody = renderTableWithInlineAddRow(epicsList, {
                        headers: ['Statement', 'Actions'],
                        items: epics || [],
                        emptyMessage: 'No epics found for this promise.',
                        renderItemRow: e => `
                            <tr data-epic-id="${e.id}">
                                <td>${escapeHtml(e.statement)}</td>
                                <td><a href="/epics/${e.id}" class="view-btn">View</a></td>
                            </tr>
                        `,
                        renderAddRow: () => `
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-epic-form" class="inline-add-form" style="margin:0;">
                                        <input id="add-epic-statement" type="text" maxlength="500" required placeholder="New Epic Statement..." style="width:100%;">
                                    </form>
                                </td>
                                <td>
                                    <button id="add-epic-submit" type="submit" form="add-epic-form" class="view-btn">Add</button>
                                    <span id="add-epic-msg"></span>
                                </td>
                            </tr>
                        `,
                    });

                    const form = epicsList.querySelector('#add-epic-form');
                    const statementInput = epicsList.querySelector('#add-epic-statement');
                    const msg = epicsList.querySelector('#add-epic-msg');
                    const submitBtn = epicsList.querySelector('#add-epic-submit');

                    if (form && statementInput && msg && submitBtn) {
                        form.addEventListener('submit', async event => {
                            event.preventDefault();
                            msg.textContent = '';

                            const statement = statementInput.value.trim();
                            if (!statement) {
                                msg.textContent = 'Statement is required.';
                                return;
                            }

                            submitBtn.disabled = true;

                            try {
                                const created = await addEpic({
                                    statement,
                                    productPromiseId: promiseId,
                                    displayOrder: (epics || []).length + 1,
                                });

                                if (created) {
                                    removeInlineEmptyRow(tbody);
                                    const row = document.createElement('tr');
                                    row.dataset.epicId = created.id;
                                    row.innerHTML = `
                                        <td>${escapeHtml(created.statement)}</td>
                                        <td><a href="/epics/${created.id}" class="view-btn">View</a></td>
                                    `;
                                    insertRowBeforeAddRow(tbody, row);
                                    statementInput.value = '';
                                }
                            } catch (err) {
                                msg.textContent = 'Failed to add epic.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
                            }
                        });
                    }
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

            resolveProjectIdForPromise(promise.id, getGraphProjectIdHintFromUrl())
                .then(projectId => {
                    const href = buildGraphViewHref(projectId, `promise-${promise.id}`);
                    upsertGraphViewButton(detailDiv, href);
                })
                .catch(error => {
                    console.error('Unable to resolve graph link for promise detail', error);
                });

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
                        const updated = await updatePromiseDescription(promiseId, newDesc);
                        promise.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
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
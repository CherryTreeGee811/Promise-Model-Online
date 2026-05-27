import { routeHandler } from '../router.mjs';
import { getPromiseById, getEpicsByPromise, updatePromiseDescription } from './api.mjs';
import { addEpic } from '../epics/api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { loadReactions } from '../reactions/reactions.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.mjs';

export function loadPromiseDetail(promiseId, navContentDiv, contentDiv) {
    const detailDiv = document.getElementById('promise-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('promise-detail-loading');

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    getPromiseById(promiseId)
        .then(promise => {
            if (loadingEl) loadingEl.hidden = true;

            detailDiv.innerHTML = `
                <div class="detail-card promise-detail-card">
                    <h2>${escapeHtml(promise.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th>Description</th><td>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea">${escapeHtml(promise.description || '')}</textarea>
                            <div class="field-actions"><button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
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
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button">← Back</button>
                </div>
            `;

            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
                nodeType: 'promise',
                nodeId: promiseId,
                projectIdHint: getGraphProjectIdHintFromUrl(),
            });
            const epicsList = document.getElementById('promise-epics-list');
            getEpicsByPromise(promiseId)
                .then(epics => {
                    patchChildMetrics(`promise-${promiseId}`, epics);
                    const tbody = renderTableWithInlineAddRow(epicsList, {
                        headers: ['Statement', 'Actions'],
                        items: epics || [],
                        emptyMessage: 'No epics found for this promise.',
                        renderItemRow: e => `
                            <tr data-epic-id="${e.id}">
                                <td>${escapeHtml(e.statement)}</td>
                                <td><a href="/epics/${e.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `,
                        renderAddRow: () => `
                            <tr data-inline-add-row="1">
                                <td>
                                    <form id="add-epic-form" class="inline-add-form">
                                        <input id="add-epic-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Epic Statement...">
                                    </form>
                                </td>
                                <td>
                                    <button id="add-epic-submit" type="submit" form="add-epic-form" class="btn btn-sm btn-outline-primary">Add</button>
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
                                        <td><a href="/epics/${created.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `;
                                    insertRowBeforeAddRow(tbody, row);
                                    statementInput.value = '';
                                    patchChildMetrics(`promise-${promiseId}`, [...(epics || []), created]);
                                }
                            } catch (err) {
                                msg.textContent = 'Failed to add epic.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
                            }
                        });
                    }

                    epicsList.innerHTML = `
                        <table class="table table-sm table-striped align-middle promisemodel-table">
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
                                        <td><a href="/epics/${e.id}" epic-id="${e.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                    
                    detailDiv.querySelectorAll('a[epic-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            // allow new tab behavior
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;

                            e.preventDefault();

                            const epicId = link.getAttribute('epic-id');
                            window.history.pushState({}, '', `/epics/${epicId}`);

                            routeHandler(navContentDiv, contentDiv);
                        });
                    });
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
                saveBtn.addEventListener('click', async (e) => {
                    e.preventDefault()
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = document.getElementById('description-input').value;
                    try {
                        const updated = await updatePromiseDescription(promiseId, newDesc);
                        promise.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        patchDetailStackGraphNode(`promise-${promiseId}`, {
                            description: promise.description,
                        });
                        descMsg.textContent = 'Saved';
                    } catch (err) {
                        descMsg.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        saveBtn.disabled = false;
                    }
                });
            }
            if (loadingEl) loadingEl.hidden = true;
        })
        .catch(err => {
            if (loadingEl) loadingEl.hidden = true;
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
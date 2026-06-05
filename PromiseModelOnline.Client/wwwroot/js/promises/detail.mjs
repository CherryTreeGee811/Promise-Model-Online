import { navigate } from '../router.mjs';
import { getPromiseById, getEpicsByPromise, updatePromiseDescription } from './api.mjs';
import { addEpic } from '../epics/api.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.mjs';
import { getStatusHtml, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.mjs';

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
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description">${escapeHtml(promise.description || '')}</textarea>
                            <div class="field-actions"><button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr><th scope="row">Status</th><td>${getStatusHtml(promise.statusColor)}</td></tr>
                        <tr><th scope="row">Created</th><td>${new Date(promise.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th scope="row">Updated</th><td>${promise.updatedAt ? new Date(promise.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Epics</h3>
                    <div id="promise-epics-list">
                        <p>Loading epics…</p>
                    </div>
                    <div id="promise-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
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
                                        <input id="add-epic-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Epic Statement..." aria-label="New epic statement">
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
                                    <th scope="col">Statement</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${epics.map(e => `
                                    <tr>
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

                            navigate(`/epics/${link.getAttribute('epic-id')}`, navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    epicsList.innerHTML = '<p class="error">Failed to load epics.</p>';
                });

            // Comments and reactions
            loadCommentsAndReactions(detailDiv, 'Promise', promiseId);

            resolveProjectIdForPromise(promise.id, getGraphProjectIdHintFromUrl())
                .then(projectId => {
                    const href = buildGraphViewHref(projectId, `promise-${promise.id}`);
                    upsertGraphViewButton(detailDiv, href);
                })
                .catch(error => {
                    console.error('Unable to resolve graph link for promise detail', error);
                });

            initBackLink();

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
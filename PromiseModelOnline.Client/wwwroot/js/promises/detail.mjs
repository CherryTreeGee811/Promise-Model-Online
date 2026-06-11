import { navigate } from '../router.mjs';
import { getPromise, getEpicsByPromise, updatePromiseDescription } from './api.mjs';
import { createEpic } from '../epics/api.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, getOwnerProjectFromPath, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.mjs';
import { getStatusHtml, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.mjs';
import { createCommentAutocomplete } from '../comments/autocomplete.mjs';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.mjs';
import { setupInlineEdit } from '../utils/inline-edit.mjs';

export function loadPromiseDetail(owner, project, promiseId, navContentDiv, contentDiv, permission) {
    const detailDiv = document.getElementById('promise-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('promise-detail-loading');

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    getPromise(owner, project, promiseId)
        .then(promise => Promise.all([
            Promise.resolve(promise),
            loadEntityLookupMap('Promise', promise.id, owner, project),
        ]))
        .then(([promise]) => {
            if (loadingEl) loadingEl.hidden = true;

            detailDiv.innerHTML = `
                <div class="detail-card promise-detail-card">
                    <h2>${escapeHtml(promise.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr><th scope="row"><label for="description-input">Description</label></th><td>
                            <div class="inline-edit-wrapper">
                                <p id="description-view" class="inline-edit-view">${formatCommentText(promise.description || '')}</p>
                                <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${escapeHtml(promise.description || '')}</textarea>
                            </div>
                            <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
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

            // Autocomplete + inline edit for description
            const descInput = document.getElementById('description-input');
            const descView = document.getElementById('description-view');
            const editBtn = document.getElementById('edit-desc-btn');
            const saveBtn = document.getElementById('save-desc');
            const cancelBtn = document.getElementById('cancel-desc');
            let editor = null;
            if (descInput && descView && editBtn) {
                createCommentAutocomplete(descInput, 'Promise', promise.id);
                editor = setupInlineEdit(descInput, descView, editBtn, saveBtn, cancelBtn);
            }

            mountDetailStackGraph({
                nodeType: 'promise',
                nodeId: promiseId,
                owner,
                project,
            });
            const epicsList = document.getElementById('promise-epics-list');
            getEpicsByPromise(owner, project, promiseId)
                .then(epics => {
                    patchChildMetrics(`promise-${promise.sequenceNumber}`, epics);
                    const tbody = renderTableWithInlineAddRow(epicsList, {
                        headers: ['Statement', 'Actions'],
                        items: epics || [],
                        emptyMessage: 'No epics found for this promise.',
                        renderItemRow: e => `
                            <tr data-epic-id="${e.id}">
                                <td>${escapeHtml(e.statement)}</td>
                                <td><a href="/${owner}/${project}/epics/${e.sequenceNumber}" epic-seq="${e.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
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
                                const created = await createEpic(owner, project, {
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
                                        <td><a href="/${owner}/${project}/epics/${created.sequenceNumber}" epic-seq="${created.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    `;
                                    insertRowBeforeAddRow(tbody, row);
                                    statementInput.value = '';
                                    patchChildMetrics(`promise-${promise.sequenceNumber}`, [...(epics || []), created]);
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
                                        <td><a href="/${owner}/${project}/epics/${e.sequenceNumber}" epic-id="${e.id}" epic-seq="${e.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
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

                            navigate(`/${owner}/${project}/epics/${link.getAttribute('epic-seq')}`, navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    epicsList.innerHTML = '<p class="error">Failed to load epics.</p>';
                });

            // Permission gating
            (function gatePromiseDetailControls() {
                const canEdit = permission?.permission === 'Edit';
                if (!canEdit) {
                    const editBtn = document.getElementById('edit-desc-btn');
                    const saveBtn = document.getElementById('save-desc');
                    const descInput = document.getElementById('description-input');
                    if (editBtn) { editBtn.disabled = true; editBtn.title = 'Requires Edit permission.'; }
                    if (saveBtn) { saveBtn.disabled = true; saveBtn.title = 'Requires Edit permission.'; }
                    if (descInput) descInput.disabled = true;

                    const addEpicInput = document.getElementById('add-epic-statement');
                    const addEpicSubmit = document.getElementById('add-epic-submit');
                    if (addEpicInput) addEpicInput.disabled = true;
                    if (addEpicSubmit) { addEpicSubmit.disabled = true; addEpicSubmit.title = 'Requires Edit permission.'; }
                }
            })();

            // Comments and reactions
            loadCommentsAndReactions(detailDiv, 'Promise', promise.id, owner, project, permission);

            const { owner: go, project: gp } = getOwnerProjectFromPath();
            if (go && gp) {
                const href = buildGraphViewHref(go, gp, `promise-${promise.sequenceNumber}`);
                upsertGraphViewButton(detailDiv, href);
            }

            initBackLink();

            // Description save handler
            const descMsg = document.getElementById('desc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', async (e) => {
                    e.preventDefault()
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = document.getElementById('description-input').value;
                    try {
                        const updated = await updatePromiseDescription(owner, project, promiseId, newDesc);
                        promise.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        patchDetailStackGraphNode(`promise-${promise.sequenceNumber}`, {
                            description: promise.description,
                        });
                        if (editor) editor.showSavedPopover(formatCommentText(promise.description || ''));
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
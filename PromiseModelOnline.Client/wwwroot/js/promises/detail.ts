// @ts-nocheck
import { navigate } from '../router.ts';
import { getPromise, getEpicsByPromise, updatePromiseDescription } from './api.ts';
import { createEpic } from '../epics/api.ts';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.ts';
import { escapeHtml } from '../utils/html.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.ts';
import { getStatusHtml, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';

export function loadPromiseDetail(owner: string, project: string, promiseId: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: { permission?: string } | null): void {
    const detailDiv = document.getElementById('promise-detail-content') as HTMLElement | null;
    const errorEl = document.getElementById('error-text') as HTMLElement | null;
    const loadingEl = document.getElementById('promise-detail-loading') as HTMLElement | null;

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl!.textContent = '';

    getPromise(owner, project, promiseId)
        .then(promise => Promise.all([
            Promise.resolve(promise),
            loadEntityLookupMap('Promise', promise.id, owner, project),
        ]))
        .then(([promise]) => {
            if (loadingEl) loadingEl.hidden = true;

            detailDiv!.innerHTML = `
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
                        <tr><th scope="row">Updated</th><td>${promise.updatedAt ? new Date(promise.updatedAt).toLocaleDateString('en-CA') : '&ndash;'}</td></tr>
                    </table>
                    <h3>Epics</h3>
                    <div id="promise-epics-list">
                        <p>Loading epics&hellip;</p>
                    </div>
                    <div id="promise-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">&larr;</span> Back</button>
                </div>
            `;

            if (loadingEl) loadingEl.hidden = true;

            const descInput = document.getElementById('description-input') as HTMLTextAreaElement | null;
            const descView = document.getElementById('description-view') as HTMLElement | null;
            const editBtn = document.getElementById('edit-desc-btn') as HTMLElement | null;
            const saveBtn = document.getElementById('save-desc') as HTMLElement | null;
            const cancelBtn = document.getElementById('cancel-desc') as HTMLElement | null;
            let editor: { showView?: (html: string) => void; showSavedPopover?: (html: string) => void } | null = null;
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
            const epicsList = document.getElementById('promise-epics-list') as HTMLElement | null;
            getEpicsByPromise(owner, project, promiseId)
                .then(epics => {
                    patchChildMetrics(`promise-${promise.sequenceNumber}`, epics);
                    const tbody = renderTableWithInlineAddRow(epicsList, {
                        headers: ['Statement', 'Actions'],
                        items: epics || [],
                        emptyMessage: 'No epics found for this promise.',
                        renderItemRow: (e: { id: string; sequenceNumber: string; statement: string }) => `
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
                    }) as HTMLTableSectionElement | null;

                    const form = epicsList?.querySelector('#add-epic-form') as HTMLFormElement | null;
                    const statementInput = epicsList?.querySelector('#add-epic-statement') as HTMLInputElement | null;
                    const msg = epicsList?.querySelector('#add-epic-msg') as HTMLElement | null;
                    const submitBtn = epicsList?.querySelector('#add-epic-submit') as HTMLButtonElement | null;

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

                    epicsList!.innerHTML = `
                        <table class="table table-sm table-striped align-middle promisemodel-table">
                            <thead>
                                <tr>
                                    <th scope="col">Statement</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${epics.map((e: { id: string; sequenceNumber: string; statement: string }) => `
                                    <tr>
                                        <td>${escapeHtml(e.statement)}</td>
                                        <td><a href="/${owner}/${project}/epics/${e.sequenceNumber}" epic-id="${e.id}" epic-seq="${e.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;

                    detailDiv!.querySelectorAll('a[epic-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if ((e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey || (e as MouseEvent).button === 1) return;

                            e.preventDefault();

                            navigate(`/${owner}/${project}/epics/${link.getAttribute('epic-seq')}`, navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    if (epicsList) epicsList.innerHTML = '<p class="error">Failed to load epics.</p>';
                });

            (function gatePromiseDetailControls() {
                const canEdit = permission?.permission === 'Edit';
                if (!canEdit) {
                    const editBtn = document.getElementById('edit-desc-btn') as HTMLButtonElement | null;
                    const saveBtn = document.getElementById('save-desc') as HTMLButtonElement | null;
                    const descInput = document.getElementById('description-input') as HTMLTextAreaElement | null;
                    if (editBtn) { editBtn.disabled = true; editBtn.title = 'Requires Edit permission.'; }
                    if (saveBtn) { saveBtn.disabled = true; saveBtn.title = 'Requires Edit permission.'; }
                    if (descInput) descInput.disabled = true;

                    const addEpicInput = document.getElementById('add-epic-statement') as HTMLInputElement | null;
                    const addEpicSubmit = document.getElementById('add-epic-submit') as HTMLButtonElement | null;
                    if (addEpicInput) addEpicInput.disabled = true;
                    if (addEpicSubmit) { addEpicSubmit.disabled = true; addEpicSubmit.title = 'Requires Edit permission.'; }
                }
            })();

            loadCommentsAndReactions(detailDiv!, 'Promise', promise.id, owner, project, permission);

            const { owner: go, project: gp } = getOwnerProjectFromPath();
            if (go && gp) {
                const href = buildGraphViewHref(go, gp, `promise-${promise.sequenceNumber}`);
                upsertGraphViewButton(detailDiv, href);
            }

            initBackLink();

            const descMsg = document.getElementById('desc-save-msg') as HTMLElement | null;
            if (saveBtn) {
                saveBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (descMsg) descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = (document.getElementById('description-input') as HTMLTextAreaElement).value;
                    try {
                        const updated = await updatePromiseDescription(owner, project, promiseId, newDesc);
                        promise.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        patchDetailStackGraphNode(`promise-${promise.sequenceNumber}`, {
                            description: promise.description,
                        });
                        if (editor && editor.showSavedPopover) editor.showSavedPopover(formatCommentText(promise.description || ''));
                    } catch (err) {
                        if (descMsg) descMsg.textContent = 'Save failed';
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
            if (errorEl) errorEl.textContent = 'Failed to load promise details.';
            console.error(err);
        });
}

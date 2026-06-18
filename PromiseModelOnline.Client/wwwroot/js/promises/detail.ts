// @ts-nocheck
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { createEpic } from '../epics/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { navigate } from '../router.ts';
import { getStatusHtml, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.ts';

import { getPromise, getEpicsByPromise, updatePromiseDescription } from './api.ts';

/**
 * Load and render the promise detail page with epics, graph, comments, and reactions.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} promiseId - The promise's sequence number.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @param {{ permission?: string } | null} permission - The user's permission object.
 */
export async function loadPromiseDetail(owner: string, project: string, promiseId: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: { permission?: string } | null): Promise<void> {
    const detailDiv = document.querySelector('#promise-detail-content') as HTMLElement | null;
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const loadingElement = document.querySelector('#promise-detail-loading') as HTMLElement | null;

    destroyDetailStackGraph();
    if (loadingElement) loadingElement.hidden = false;
    errorElement!.textContent = '';

    try {
        const promise = await getPromise(owner, project, promiseId);
        await loadEntityLookupMap('Promise', promise.id, owner, project);

        if (loadingElement) loadingElement.hidden = true;

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

        if (loadingElement) loadingElement.hidden = true;

        const descInput = document.querySelector('#description-input') as HTMLTextAreaElement | null;
        const descView = document.querySelector('#description-view') as HTMLElement | null;
        const editButton = document.querySelector('#edit-desc-btn') as HTMLElement | null;
        const saveButton = document.querySelector('#save-desc') as HTMLElement | null;
        const cancelButton = document.querySelector('#cancel-desc') as HTMLElement | null;
        let editor: { showView?: (html: string) => void; showSavedPopover?: (html: string) => void } | undefined;
        if (descInput && descView && editButton) {
            createCommentAutocomplete(descInput, 'Promise', promise.id);
            editor = setupInlineEdit(descInput, descView, editButton, saveButton, cancelButton);
        }

        mountDetailStackGraph({
            nodeType: 'promise',
            nodeId: promiseId,
            owner,
            project,
        });
        const epicsList = document.querySelector('#promise-epics-list') as HTMLElement | null;

        try {
            const epics = await getEpicsByPromise(owner, project, promiseId);
            patchChildMetrics(`promise-${promise.sequenceNumber}`, epics);
            const tbody = renderTableWithInlineAddRow(epicsList, {
                headers: ['Statement', 'Actions'],
                items: epics || [],
                emptyMessage: 'No epics found for this promise.',
                renderItemRow: (epic: { id: string; sequenceNumber: string; statement: string }) => `
                    <tr data-epic-id="${epic.id}">
                        <td>${escapeHtml(epic.statement)}</td>
                        <td><a href="/${owner}/${project}/epics/${epic.sequenceNumber}" epic-seq="${epic.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
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
            const message = epicsList?.querySelector('#add-epic-msg') as HTMLElement | null;
            const submitButton = epicsList?.querySelector('#add-epic-submit') as HTMLButtonElement | null;

            if (form && statementInput && message && submitButton) {
                form.addEventListener('submit', async event => {
                    event.preventDefault();
                    message.textContent = '';

                    const statement = statementInput.value.trim();
                    if (!statement) {
                        message.textContent = 'Statement is required.';
                        return;
                    }

                    submitButton.disabled = true;

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
                    } catch (error) {
                        message.textContent = 'Failed to add epic.';
                        console.error(error);
                    } finally {
                        submitButton.disabled = false;
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
                        ${epics.map((epic: { id: string; sequenceNumber: string; statement: string }) => `
                            <tr>
                                <td>${escapeHtml(epic.statement)}</td>
                                <td><a href="/${owner}/${project}/epics/${epic.sequenceNumber}" epic-id="${epic.id}" epic-seq="${epic.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            for (const link of detailDiv!.querySelectorAll('a[epic-id]')) {
                link.addEventListener('click', (event) => {
                    if ((event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey || (event as MouseEvent).button === 1) return;

                    event.preventDefault();

                    navigate(`/${owner}/${project}/epics/${link.getAttribute('epic-seq')}`, navContentDiv, contentDiv);
                });
            };
        } catch {
            if (epicsList) epicsList.innerHTML = '<p class="error">Failed to load epics.</p>';
        }

        (function gatePromiseDetailControls() {
            const canEdit = permission?.permission === 'Edit';
            if (!canEdit) {
                const editButton = document.querySelector('#edit-desc-btn') as HTMLButtonElement | null;
                const saveButton_ = document.querySelector('#save-desc') as HTMLButtonElement | null;
                const descInput = document.querySelector('#description-input') as HTMLTextAreaElement | null;
                if (editButton) { editButton.disabled = true; editButton.title = 'Requires Edit permission.'; }
                if (saveButton_) { saveButton_.disabled = true; saveButton_.title = 'Requires Edit permission.'; }
                if (descInput) descInput.disabled = true;

                const addEpicInput = document.querySelector('#add-epic-statement') as HTMLInputElement | null;
                const addEpicSubmit = document.querySelector('#add-epic-submit') as HTMLButtonElement | null;
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

        const descMessage = document.querySelector('#desc-save-msg') as HTMLElement | null;
        if (saveButton) {
            saveButton.addEventListener('click', async (event) => {
                event.preventDefault();
                if (descMessage) descMessage.textContent = '';
                saveButton.disabled = true;
                const newDesc = (document.querySelector('#description-input') as HTMLTextAreaElement).value;
                try {
                    const updated = await updatePromiseDescription(owner, project, promiseId, newDesc);
                    promise.description = updated?.description ?? (newDesc.trim() ? newDesc : undefined);
                    patchDetailStackGraphNode(`promise-${promise.sequenceNumber}`, {
                        description: promise.description,
                    });
                    if (editor && editor.showSavedPopover) editor.showSavedPopover(formatCommentText(promise.description || ''));
                } catch (error) {
                    if (descMessage) descMessage.textContent = 'Save failed';
                    console.error(error);
                } finally {
                    saveButton.disabled = false;
                }
            });
        }
        if (loadingElement) loadingElement.hidden = true;
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        if (errorElement) errorElement.textContent = 'Failed to load promise details.';
        console.error(error);
    }
}

// @ts-nocheck
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { createJourney } from '../journeys/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { getPromiseById } from '../promises/api.ts';
import { navigate } from '../router.ts';
import { getStatusHtml, getStatusIcon, getStatusLabel, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.ts';

import { getEpic, getJourneys, updateEpicDescription } from './api.ts';

/** @typedef {{ id: number, sequenceNumber: number, statement: string, description?: string, statusColor?: string, createdAt: string, updatedAt?: string, productPromiseId: number }} Epic */

/**
 * Load and render the epic detail page with journeys, graph, comments, and reactions.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} epicId - The epic's sequence number.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @param {{ permission?: string }} permission - The user's permission object.
 */
export async function loadEpicDetail(owner, project, epicId, navContentDiv, contentDiv, permission) {
    const detailDiv = /** @type {HTMLElement} */ (document.querySelector('#epic-detail-content'));
    const errorElement = /** @type {HTMLElement} */ (document.querySelector('#error-text'));
    const loadingElement = /** @type {HTMLElement} */ (document.querySelector('#epic-detail-loading'));

    destroyDetailStackGraph();
    if (loadingElement) loadingElement.hidden = false;
    errorElement.textContent = '';

    try {
        const epic = await getEpic(owner, project, epicId);
        await loadEntityLookupMap('Epic', epic.id, owner, project);

        if (loadingElement) loadingElement.hidden = true;

        void mountDetailStackGraph({
            nodeType: 'epic',
            nodeId: epicId,
            owner,
            project,
        });

        detailDiv.innerHTML = `
            <div class="detail-card epic-detail-card">
                <h2>${escapeHtml(epic.statement)}</h2>
                <table class="table table-sm table-striped align-middle detail-table">
                    <tr><th scope="row"><label for="description-input">Description</label></th><td>
                        <div class="inline-edit-wrapper">
                            <p id="description-view" class="inline-edit-view">${formatCommentText(epic.description || '')}</p>
                            <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${escapeHtml(epic.description || '')}</textarea>
                        </div>
                        <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                    </td></tr>
                    <tr>
                        <th>Parent Promise</th>
                        <td id="epic-parent-promise">Loading…</td>
                    </tr>
                    <tr><th scope="row">Status</th><td>${getStatusHtml(epic.statusColor)}</td></tr>
                    <tr><th scope="row">Created</th><td>${new Date(epic.createdAt).toLocaleDateString('en-CA')}</td></tr>
                    <tr><th scope="row">Updated</th><td>${epic.updatedAt ? new Date(epic.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                </table>
                <h3>Journeys</h3>
                <div id="epic-journeys-list">
                    <p>Loading journeys…</p>
                </div>
                <div id="epic-comments"></div>
                <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
            </div>
        `;

        const descInput = /** @type {HTMLTextAreaElement} */ (document.querySelector('#description-input'));
        const descView = /** @type {HTMLElement} */ (document.querySelector('#description-view'));
        const editButton = /** @type {HTMLElement} */ (document.querySelector('#edit-desc-btn'));
        const saveButton = /** @type {HTMLElement} */ (document.querySelector('#save-desc'));
        const cancelButton = /** @type {HTMLElement} */ (document.querySelector('#cancel-desc'));
        let editor;
        if (descInput && descView && editButton) {
            createCommentAutocomplete(descInput, 'Epic', epic.id);
            editor = setupInlineEdit(descInput, descView, editButton, saveButton, cancelButton);
        }

        const parentCell = /** @type {HTMLElement} */ (document.querySelector('#epic-parent-promise'));
        try {
            const promise = await getPromiseById(owner, project, epic.productPromiseId);
            const icon = getStatusIcon(promise.statusColor);
            const label = getStatusLabel(promise.statusColor);
            parentCell.innerHTML = `<a href="/${owner}/${project}/promises/${promise.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(promise.statement)}</a> <span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;

            const link = parentCell.querySelector('a.detail-link');

            if (link) {
                link.addEventListener('click', (event) => {
                    if (event.ctrlKey || event.metaKey || event.button === 1) return;
                    event.preventDefault();
                    void navigate(link.getAttribute('href'), navContentDiv, contentDiv);
                });
            }
        } catch {
            parentCell.textContent = `Promise ${epic.productPromiseId}`;
        }

        const journeysList = /** @type {HTMLElement} */ (document.querySelector('#epic-journeys-list'));
        try {
            const journeys = await getJourneys(owner, project, epicId);
            patchChildMetrics(`epic-${epic.sequenceNumber}`, journeys);
            const tbody = renderTableWithInlineAddRow(journeysList, {
                headers: ['Statement', 'Actions'],
                items: journeys || [],
                emptyMessage: 'No journeys found for this epic.',
                renderItemRow: index => `
                    <tr data-journey-id="${index.id}">
                        <td>${escapeHtml(index.statement)}</td>
                        <td><a href="/${owner}/${project}/journeys/${index.sequenceNumber}" journey-id="${index.id}" journey-seq="${index.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                    </tr>
                `,
                renderAddRow: () => `
                    <tr data-inline-add-row="1">
                        <td>
                            <form id="add-journey-form" class="inline-add-form">
                                <input id="add-journey-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Journey Statement..." aria-label="New journey statement">
                            </form>
                        </td>
                        <td>
                            <button id="add-journey-submit" type="submit" form="add-journey-form" class="btn btn-sm btn-outline-primary">Add</button>
                            <span id="add-journey-msg"></span>
                        </td>
                    </tr>
                `,
            });

            const form = journeysList.querySelector('#add-journey-form');
            const statementInput = journeysList.querySelector('#add-journey-statement');
            const message = journeysList.querySelector('#add-journey-msg');
            const submitButton = journeysList.querySelector('#add-journey-submit');

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
                        const created = await createJourney(owner, project, {
                            statement,
                            epicId,
                            displayOrder: (journeys || []).length + 1,
                        });

                        if (created) {
                            removeInlineEmptyRow(tbody);
                            const row = document.createElement('tr');
                            row.dataset.journeyId = created.id;
                            row.innerHTML = `
                                <td>${escapeHtml(created.statement)}</td>
                                <td><a href="/${owner}/${project}/journeys/${created.sequenceNumber}" journey-id="${created.id}" journey-seq="${created.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            `;
                            insertRowBeforeAddRow(tbody, row);
                            statementInput.value = '';
                            patchChildMetrics(`epic-${epic.sequenceNumber}`, [...(journeys || []), created]);
                        }
                    } catch (error) {
                        message.textContent = 'Failed to add journey.';
                        console.error(error);
                    } finally {
                        submitButton.disabled = false;
                    }
                });
            }

            journeysList.innerHTML = `
                <table class="table table-sm table-striped align-middle promisemodel-table">
                    <thead>
                        <tr>
                            <th>Statement</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${journeys.map(index => `
                            <tr>
                                <td>${escapeHtml(index.statement)}</td>
                                <td><a href="/${owner}/${project}/journeys/${index.sequenceNumber}" journey-id="${index.id}" journey-seq="${index.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            for (const link of journeysList.querySelectorAll('a[journey-id]')) {
                link.addEventListener('click', (event) => {
                    if (event.ctrlKey || event.metaKey || event.button === 1) return;
                    event.preventDefault();
                    void navigate(`/${owner}/${project}/journeys/${link.getAttribute('journey-seq')}`, navContentDiv, contentDiv);
                });
            }
        } catch {
            journeysList.innerHTML = '<p class="error">Failed to load journeys.</p>';
        }

        initBackLink();
        (function gateEpicDetailControls() {
            const canEdit = permission?.permission === 'Edit';
            if (!canEdit) {
                const editButton = document.querySelector('#edit-desc-btn');
                const saveButton_ = document.querySelector('#save-desc');
                const descInput = document.querySelector('#description-input');
                if (editButton) { editButton.disabled = true; editButton.title = 'Requires Edit permission.'; }
                if (saveButton_) { saveButton_.disabled = true; saveButton_.title = 'Requires Edit permission.'; }
                if (descInput) descInput.disabled = true;

                const journeyStatementInput = document.querySelector('#add-journey-statement');
                const journeySubmitButton = document.querySelector('#add-journey-submit');
                if (journeyStatementInput) journeyStatementInput.disabled = true;
                if (journeySubmitButton) { journeySubmitButton.disabled = true; journeySubmitButton.title = 'Requires Edit permission.'; }
            }
        })();

        loadCommentsAndReactions(detailDiv, 'Epic', epic.id, owner, project, permission);

        const descMessage = document.querySelector('#desc-save-msg');
        if (saveButton) {
            saveButton.addEventListener('click', async (event) => {
                event.preventDefault();
                descMessage.textContent = '';
                saveButton.disabled = true;
                const newDesc = /** @type {HTMLTextAreaElement} */(document.querySelector('#description-input')).value;
                try {
                    const updated = await updateEpicDescription(owner, project, epicId, newDesc);
                    epic.description = updated?.description ?? (newDesc.trim() ? newDesc : undefined);
                    patchDetailStackGraphNode(`epic-${epic.sequenceNumber}`, {
                        description: epic.description,
                    });
                    if (editor) editor.showSavedPopover(formatCommentText(epic.description || ''));
                } catch (error) {
                    descMessage.textContent = 'Save failed';
                    console.error(error);
                } finally {
                    saveButton.disabled = false;
                }
            });
        }

        const { owner: go, project: gp } = getOwnerProjectFromPath();
        if (go && gp) {
            const href = buildGraphViewHref(go, gp, `epic-${epic.sequenceNumber}`);
            upsertGraphViewButton(detailDiv, href);
        }
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        errorElement.textContent = 'Failed to load epic details.';
        console.error(error);
    }
}

// @ts-nocheck
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { getEpicById } from '../epics/api.ts';
import { createFlow } from '../flows/api.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { navigate } from '../router.ts';
import { getStatusHtml, getStatusIcon, getStatusLabel, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.ts';

import { getJourney, getFlows, updateJourneyDescription } from './api.ts';

/** @typedef {{ id: number, sequenceNumber: number, statement: string, description?: string, statusColor?: string, createdAt: string, updatedAt?: string, epicId: number }} Journey */

/**
 * Load and render the journey detail page with flows, graph, comments, and reactions.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} journeyId - The journey's sequence number.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @param {{ permission?: string }} permission - The user's permission object.
 */
export async function loadJourneyDetail(owner, project, journeyId, navContentDiv, contentDiv, permission) {
    const detailDiv = /** @type {HTMLElement} */ (document.querySelector('#journey-detail-content'));
    const errorElement = /** @type {HTMLElement} */ (document.querySelector('#error-text'));
    const loadingElement = /** @type {HTMLElement} */ (document.querySelector('#journey-detail-loading'));

    destroyDetailStackGraph();
    if (loadingElement) loadingElement.hidden = false;
    errorElement.textContent = '';

    try {
        const journey = await getJourney(owner, project, journeyId);
        await loadEntityLookupMap('Journey', journey.id, owner, project);
        if (loadingElement) loadingElement.hidden = true;

        void mountDetailStackGraph({
            nodeType: 'journey',
            nodeId: journeyId,
            owner,
            project,
        });

        detailDiv.innerHTML = `
            <div class="detail-card journey-detail-card">
                <h2>${escapeHtml(journey.statement)}</h2>
                <table class="table table-sm table-striped align-middle detail-table">
                    <tr><th scope="row"><label for="description-input">Description</label></th><td>
                        <div class="inline-edit-wrapper">
                            <p id="description-view" class="inline-edit-view">${formatCommentText(journey.description || '')}</p>
                            <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${escapeHtml(journey.description || '')}</textarea>
                        </div>
                        <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                    </td></tr>
                    <tr>
                        <th>Epic</th>
                        <td id="journey-epic-cell">
                            <a href="/${owner}/${project}/epics/${journey.epicId}" class="detail-link link-primary text-decoration-none fw-semibold">Epic ${journey.epicId}</a>
                        </td>
                    </tr>
                    <tr><th scope="row">Status</th><td>${getStatusHtml(journey.statusColor)}</td></tr>
                    <tr><th scope="row">Created</th><td>${new Date(journey.createdAt).toLocaleDateString('en-CA')}</td></tr>
                    <tr><th scope="row">Updated</th><td>${journey.updatedAt ? new Date(journey.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                </table>
                <h3>Flows</h3>
                <div id="journey-flows-list">
                    <p>Loading flows...</p>
                </div>
                <div id="journey-comments"></div>
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
            createCommentAutocomplete(descInput, 'Journey', journey.id);
            editor = setupInlineEdit(descInput, descView, editButton, saveButton, cancelButton);
        }

        const epicLink = detailDiv.querySelector('a.detail-link[epic-id]');
        if (epicLink) {
            epicLink.addEventListener('click', (event) => {
                if (event.ctrlKey || event.metaKey || event.button === 1) return;
                event.preventDefault();
                void navigate(`/${owner}/${project}/epics/${epicLink.getAttribute('epic-seq')}`, navContentDiv, contentDiv);
            });
        }

        const flowsList = /** @type {HTMLElement} */ (document.querySelector('#journey-flows-list'));
        try {
            const flows = await getFlows(owner, project, journeyId);
            patchChildMetrics(`journey-${journey.sequenceNumber}`, flows);
            const tbody = renderTableWithInlineAddRow(flowsList, {
                headers: ['Statement', 'Actions'],
                items: flows || [],
                emptyMessage: 'No flows found for this journey.',
                renderItemRow: f => `
                    <tr data-flow-id="${f.id}">
                        <td>${escapeHtml(f.statement)}</td>
                        <td><a href="/${owner}/${project}/flows/${f.sequenceNumber}" flow-id="${f.id}" flow-seq="${f.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                    </tr>
                `,
                renderAddRow: () => `
                    <tr data-inline-add-row="1">
                        <td>
                            <form id="add-flow-form" class="inline-add-form">
                                <input id="add-flow-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Flow Statement..." aria-label="New flow statement">
                            </form>
                        </td>
                        <td>
                            <button id="add-flow-submit" type="submit" form="add-flow-form" class="btn btn-sm btn-outline-primary">Add</button>
                            <span id="add-flow-msg"></span>
                        </td>
                    </tr>
                `,
            });

            const form = flowsList.querySelector('#add-flow-form');
            const statementInput = flowsList.querySelector('#add-flow-statement');
            const message = flowsList.querySelector('#add-flow-msg');
            const submitButton = flowsList.querySelector('#add-flow-submit');

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
                        const created = await createFlow(owner, project, {
                            statement,
                            journeyId,
                            displayOrder: (flows || []).length + 1,
                        });

                        if (created) {
                            removeInlineEmptyRow(tbody);
                            const row = document.createElement('tr');
                            row.dataset.flowId = created.id;
                            row.innerHTML = `
                                <td>${escapeHtml(created.statement)}</td>
                                <td><a href="/${owner}/${project}/flows/${created.sequenceNumber}" flow-id="${created.id}" flow-seq="${created.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            `;
                            insertRowBeforeAddRow(tbody, row);
                            statementInput.value = '';
                            patchChildMetrics(`journey-${journey.sequenceNumber}`, [...(flows || []), created]);
                        }
                    } catch (error) {
                        message.textContent = 'Failed to add flow.';
                        console.error(error);
                    } finally {
                        submitButton.disabled = false;
                    }
                });
            }

            flowsList.innerHTML = `
                <table class="table table-sm table-striped align-middle promisemodel-table">
                    <thead>
                        <tr>
                            <th>Statement</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${flows.map(f => `
                            <tr>
                                <td>${escapeHtml(f.statement)}</td>
                                <td><a href="/${owner}/${project}/flows/${f.sequenceNumber}" flow-id="${f.id}" flow-seq="${f.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            for (const link of flowsList.querySelectorAll('a[flow-id]')) {
                link.addEventListener('click', (event) => {
                    if (event.ctrlKey || event.metaKey || event.button === 1) return;
                    event.preventDefault();
                    void navigate(`/${owner}/${project}/flows/${link.getAttribute('flow-seq')}`, navContentDiv, contentDiv);
                });
            }
        } catch {
            flowsList.innerHTML = '<p class="error">Failed to load flows.</p>';
        }

        initBackLink();

        const epicCell = /** @type {HTMLElement} */ (document.querySelector('#journey-epic-cell'));
        try {
            const epic = await getEpicById(owner, project, journey.epicId);
            const icon = getStatusIcon(epic.statusColor);
            const label = getStatusLabel(epic.statusColor);
            epicCell.innerHTML = `<a href="/${owner}/${project}/epics/${epic.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(epic.statement)}</a> <span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
            const link = epicCell.querySelector('a.detail-link');

            if (link) {
                link.addEventListener('click', (event) => {
                    if (event.ctrlKey || event.metaKey || event.button === 1) return;
                    event.preventDefault();
                    void navigate(link.getAttribute('href'), navContentDiv, contentDiv);
                });
            }
        } catch {}

        const descMessage = document.querySelector('#desc-save-msg');
        if (saveButton) {
            saveButton.addEventListener('click', async (event) => {
                event.preventDefault();
                descMessage.textContent = '';
                saveButton.disabled = true;
                const newDesc = /** @type {HTMLTextAreaElement} */(document.querySelector('#description-input')).value;
                try {
                    const updated = await updateJourneyDescription(owner, project, journeyId, newDesc);
                    journey.description = updated?.description ?? (newDesc.trim() ? newDesc : undefined);
                    patchDetailStackGraphNode(`journey-${journey.sequenceNumber}`, {
                        description: journey.description,
                    });
                    if (editor) editor.showSavedPopover(formatCommentText(journey.description || ''));
                } catch (error) {
                    descMessage.textContent = 'Save failed';
                    console.error(error);
                } finally {
                    saveButton.disabled = false;
                }
            });
        }

        (function gateJourneyDetailControls() {
            const canEdit = permission?.permission === 'Edit';
            if (!canEdit) {
                const editButton = document.querySelector('#edit-desc-btn');
                const saveButton = document.querySelector('#save-desc');
                const descInput = document.querySelector('#description-input');
                if (editButton) { editButton.disabled = true; editButton.title = 'Requires Edit permission.'; }
                if (saveButton) { saveButton.disabled = true; saveButton.title = 'Requires Edit permission.'; }
                if (descInput) descInput.disabled = true;

                const flowStatementInput = document.querySelector('#add-flow-statement');
                const flowSubmitButton = document.querySelector('#add-flow-submit');
                if (flowStatementInput) flowStatementInput.disabled = true;
                if (flowSubmitButton) { flowSubmitButton.disabled = true; flowSubmitButton.title = 'Requires Edit permission.'; }
            }
        })();

        loadCommentsAndReactions(detailDiv, 'Journey', journey.id, owner, project, permission);

        const { owner: go, project: gp } = getOwnerProjectFromPath();
        if (go && gp) {
            const href = buildGraphViewHref(go, gp, `journey-${journey.sequenceNumber}`);
            upsertGraphViewButton(detailDiv, href);
        }

        if (loadingElement) loadingElement.hidden = true;
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        errorElement.textContent = 'Failed to load journey details.';
        console.error(error);
    }
}

// @ts-nocheck
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { getJourneyById } from '../journeys/api.ts';
import { createMoment, updateMomentType } from '../moments/api.ts';
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

import { getFlow, getMoments, updateFlowDescription } from './api.ts';

/** @typedef {{ id: number, sequenceNumber: number, statement: string, description?: string, statusColor?: string, createdAt: string, updatedAt?: string, journeyId: number }} Flow */

/**
 * Load and render the flow detail page with moments, graph, comments, and reactions.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} flowId - The flow's sequence number.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @param {{ permission?: string }} permission - The user's permission object.
 */
export async function loadFlowDetail(owner, project, flowId, navContentDiv, contentDiv, permission) {
    const detailDiv = /** @type {HTMLElement} */ (document.querySelector('#flow-detail-content'));
    const errorElement = /** @type {HTMLElement} */ (document.querySelector('#error-text'));
    const loadingElement = /** @type {HTMLElement} */ (document.querySelector('#flow-detail-loading'));

    destroyDetailStackGraph();
    if (loadingElement) loadingElement.hidden = false;
    errorElement.textContent = '';

    try {
        const flow = await getFlow(owner, project, flowId);
        await loadEntityLookupMap('Flow', flow.id, owner, project);

        if (loadingElement) loadingElement.hidden = true;

        void mountDetailStackGraph({
            nodeType: 'flow',
            nodeId: flowId,
            owner,
            project,
        });

        detailDiv.innerHTML = `
            <div class="detail-card flow-detail-card">
                <h2>${escapeHtml(flow.statement)}</h2>
                <table class="table table-sm table-striped align-middle detail-table">
                    <tr><th scope="row"><label for="description-input">Description</label></th><td>
                        <div class="inline-edit-wrapper">
                            <p id="description-view" class="inline-edit-view">${formatCommentText(flow.description || '')}</p>
                            <button id="edit-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                            <textarea id="description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${escapeHtml(flow.description || '')}</textarea>
                        </div>
                        <div class="field-actions"><button id="cancel-desc" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                    </td></tr>
                    <tr>
                        <th>Journey</th>
                        <td id="flow-journey-cell">
                            <a href="/${owner}/${project}/journeys/${flow.journeyId}" class="detail-link link-primary text-decoration-none fw-semibold">Journey ${flow.journeyId}</a>
                        </td>
                    </tr>
                    <tr><th scope="row">Status</th><td>${getStatusHtml(flow.statusColor)}</td></tr>
                    <tr><th scope="row">Created</th><td>${new Date(flow.createdAt).toLocaleDateString('en-CA')}</td></tr>
                    <tr><th scope="row">Updated</th><td>${flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                </table>
                <h3>Moments</h3>
                <div id="flow-moments-list">
                    <p>Loading moments...</p>
                </div>
                <div id="flow-comments"></div>
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
            createCommentAutocomplete(descInput, 'Flow', flow.id);
            editor = setupInlineEdit(descInput, descView, editButton, saveButton, cancelButton);
        }

        const journeyLink = detailDiv.querySelector('.detail-link[journey-id]');
        if (journeyLink) {
            journeyLink.addEventListener('click', (event) => {
                if (event.ctrlKey || event.metaKey || event.button === 1) return;
                event.preventDefault();
                void navigate(`/${owner}/${project}/journeys/${journeyLink.getAttribute('journey-seq')}`, navContentDiv, contentDiv);
            });
        }

        const momentsList = /** @type {HTMLElement} */ (document.querySelector('#flow-moments-list'));
        try {
            const moments = await getMoments(owner, project, flowId);
            patchChildMetrics(`flow-${flow.sequenceNumber}`, moments);
            const tbody = renderTableWithInlineAddRow(momentsList, {
                headers: ['Statement', 'Type', 'Status', 'Actions'],
                items: moments || [],
                emptyMessage: 'No moments found for this flow.',
                renderItemRow: m => `
                    <tr data-moment-id="${m.sequenceNumber}">
                        <td>${escapeHtml(m.statement)}</td>
                        <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${m.sequenceNumber}" data-current-type="${m.type}" aria-label="Moment type"><option value="Story" ${m.type === 'Story' ? 'selected' : ''}>Story</option><option value="Job" ${m.type === 'Job' ? 'selected' : ''}>Job</option></select></td>
                        <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                        <td><a href="/${owner}/${project}/moments/${m.sequenceNumber}" moment-seq="${m.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                    </tr>
                `,
                renderAddRow: () => `
                    <tr data-inline-add-row="1">
                        <td>
                            <form id="add-moment-form" class="inline-add-form">
                                <input id="add-moment-statement" class="form-control form-control-sm" type="text" maxlength="500" required placeholder="New Moment Statement..." aria-label="New moment statement">
                            </form>
                        </td>
                        <td>
                            <select id="add-moment-type" class="form-select form-select-sm" form="add-moment-form">
                                <option value="Story">Story</option>
                                <option value="Job">Job</option>
                            </select>
                        </td>
                        <td><span class="status-badge status-todo">Todo</span></td>
                        <td>
                            <button id="add-moment-submit" type="submit" form="add-moment-form" class="btn btn-sm btn-outline-primary">Add</button>
                            <span id="add-moment-msg"></span>
                        </td>
                    </tr>
                `,
            });

            const form = momentsList.querySelector('#add-moment-form');
            const statementInput = momentsList.querySelector('#add-moment-statement');
            const typeSelect = momentsList.querySelector('#add-moment-type');
            const message = momentsList.querySelector('#add-moment-msg');
            const submitButton = momentsList.querySelector('#add-moment-submit');

            if (form && statementInput && typeSelect && message && submitButton) {
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
                        const created = await createMoment(owner, project, {
                            statement,
                            flowId,
                            type: typeSelect.value,
                            status: 'Todo',
                            displayOrder: (moments || []).length + 1,
                        });

                        if (created) {
                            removeInlineEmptyRow(tbody);
                            const row = document.createElement('tr');
                            row.dataset.momentId = created.id;
                            row.innerHTML = `
                                <td>${escapeHtml(created.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${created.sequenceNumber}" data-current-type="${created.type}" aria-label="Moment type"><option value="Story" ${created.type === 'Story' ? 'selected' : ''}>Story</option><option value="Job" ${created.type === 'Job' ? 'selected' : ''}>Job</option></select></td>
                                <td><span class="status-badge status-${(created.status || '').toLowerCase()}">${created.status}</span></td>
                                <td><a href="/${owner}/${project}/moments/${created.sequenceNumber}" moment-seq="${created.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            `;
                            insertRowBeforeAddRow(tbody, row);
                            statementInput.value = '';
                            typeSelect.value = 'Story';
                            patchChildMetrics(`flow-${flow.sequenceNumber}`, [...(moments || []), created]);
                        }
                    } catch (error) {
                        message.textContent = 'Failed to add moment.';
                        console.error(error);
                    } finally {
                        submitButton.disabled = false;
                    }
                });
            }

            momentsList.innerHTML = `
                <table class="table table-sm table-striped align-middle promisemodel-table">
                    <thead>
                        <tr>
                            <th>Statement</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${moments.map(m => `
                            <tr data-moment-id="${m.sequenceNumber}">
                                <td>${escapeHtml(m.statement)}</td>
                                <td><select class="form-select form-select-sm moment-type-select" data-moment-id="${m.sequenceNumber}" data-current-type="${m.type}" aria-label="Moment type"><option value="Story" ${m.type === 'Story' ? 'selected' : ''}>Story</option><option value="Job" ${m.type === 'Job' ? 'selected' : ''}>Job</option></select></td>
                                <td><span class="status-badge status-${(m.status || '').toLowerCase()}">${m.status}</span></td>
                                <td><a href="/${owner}/${project}/moments/${m.sequenceNumber}" moment-id="${m.id}" moment-seq="${m.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            momentsList.addEventListener('change', async (event) => {
                const target = /** @type {HTMLElement} */(event.target);
                if (target.matches('.moment-type-select')) {
                    const momentId = parseInt(/** @type {string} */(target.dataset.momentId), 10);
                    const newType = /** @type {HTMLSelectElement} */(target).value;
                    const previous = target.dataset.currentType || newType;
                    try {
                        await updateMomentType(owner, project, momentId, newType);
                        target.dataset.currentType = newType;
                    } catch (error) {
                        /** @type {HTMLSelectElement} */(target).value = previous;
                        console.error('Failed to update moment type:', error);
                    }
                }
            });

            for (const link of momentsList.querySelectorAll('a[moment-id]')) {
                link.addEventListener('click', (event) => {
                    if (event.ctrlKey || event.metaKey || event.button === 1) return;
                    event.preventDefault();
                    void navigate(`/${owner}/${project}/moments/${link.getAttribute('moment-seq')}`, navContentDiv, contentDiv);
                });
            }
        } catch {
            momentsList.innerHTML = '<p class="error">Failed to load moments.</p>';
        }

        initBackLink();

        const journeyCell = /** @type {HTMLElement} */ (document.querySelector('#flow-journey-cell'));
        try {
            const journey = await getJourneyById(owner, project, flow.journeyId);
            const icon = getStatusIcon(journey.statusColor);
            const label = getStatusLabel(journey.statusColor);
            journeyCell.innerHTML = `<a href="/${owner}/${project}/journeys/${journey.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(journey.statement)}</a> <span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;

            const link = journeyCell.querySelector('a.detail-link');
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
                    const updated = await updateFlowDescription(owner, project, flowId, newDesc);
                    flow.description = updated?.description ?? (newDesc.trim() ? newDesc : undefined);
                    patchDetailStackGraphNode(`flow-${flow.sequenceNumber}`, {
                        description: flow.description,
                    });
                    if (editor) editor.showSavedPopover(formatCommentText(flow.description || ''));
                } catch (error) {
                    descMessage.textContent = 'Save failed';
                    console.error(error);
                } finally {
                    saveButton.disabled = false;
                }
            });
        }

        (function gateFlowDetailControls() {
            const canEdit = permission?.permission === 'Edit';
            if (!canEdit) {
                const editButton = document.querySelector('#edit-desc-btn');
                const saveButton = document.querySelector('#save-desc');
                const descInput = document.querySelector('#description-input');
                if (editButton) { editButton.disabled = true; editButton.title = 'Requires Edit permission.'; }
                if (saveButton) { saveButton.disabled = true; saveButton.title = 'Requires Edit permission.'; }
                if (descInput) descInput.disabled = true;

                const momentStatementInput = document.querySelector('#add-moment-statement');
                const momentSubmitButton = document.querySelector('#add-moment-submit');
                if (momentStatementInput) momentStatementInput.disabled = true;
                if (momentSubmitButton) { momentSubmitButton.disabled = true; momentSubmitButton.title = 'Requires Edit permission.'; }

                const momentTypeSelect = document.querySelector('#add-moment-type');
                if (momentTypeSelect) momentTypeSelect.disabled = true;
            }
        })();

        loadCommentsAndReactions(detailDiv, 'Flow', flow.id, owner, project, permission);

        const { owner: go, project: gp } = getOwnerProjectFromPath();
        if (go && gp) {
            const href = buildGraphViewHref(go, gp, `flow-${flow.sequenceNumber}`);
            upsertGraphViewButton(detailDiv, href);
        }
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        errorElement.textContent = 'Failed to load flow details.';
        console.error(error);
    }
}

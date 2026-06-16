import { navigate } from '../router.mjs';
import { getJourney, getFlows, updateJourneyDescription } from './api.mjs';
import { createFlow } from '../flows/api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.mjs';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.mjs';
import { getStatusHtml, getStatusIcon, getStatusLabel, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.mjs';
import { createCommentAutocomplete } from '../comments/autocomplete.mjs';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.mjs';
import { setupInlineEdit } from '../utils/inline-edit.mjs';

/**
 * Load and render the journey detail page with flows, graph, comments, and reactions.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} journeyId - The journey's sequence number.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @param {object|null} permission - The user's permission object.
 * @returns {void}
 */
export function loadJourneyDetail(owner, project, journeyId, navContentDiv, contentDiv, permission) {
    const detailDiv = document.getElementById('journey-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('journey-detail-loading');

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    getJourney(owner, project, journeyId)
        .then(journey => Promise.all([
            Promise.resolve(journey),
            loadEntityLookupMap('Journey', journey.id, owner, project),
        ]))
        .then(([journey]) => {
            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
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

            // Autocomplete + inline edit for description
            const descInput = document.getElementById('description-input');
            const descView = document.getElementById('description-view');
            const editBtn = document.getElementById('edit-desc-btn');
            const saveBtn = document.getElementById('save-desc');
            const cancelBtn = document.getElementById('cancel-desc');
            let editor = null;
            if (descInput && descView && editBtn) {
                createCommentAutocomplete(descInput, 'Journey', journey.id);
                editor = setupInlineEdit(descInput, descView, editBtn, saveBtn, cancelBtn);
            }

            const epicLink = detailDiv.querySelector('a.detail-link[epic-id]');
            if (epicLink) {
                epicLink.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;

                    e.preventDefault();

                    navigate(`/${owner}/${project}/epics/${epicLink.getAttribute('epic-seq')}`, navContentDiv, contentDiv);
                });
            }
            
            const flowsList = document.getElementById('journey-flows-list');
            getFlows(owner, project, journeyId)
                .then(flows => {
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
                    const msg = flowsList.querySelector('#add-flow-msg');
                    const submitBtn = flowsList.querySelector('#add-flow-submit');

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
                            } catch (err) {
                                msg.textContent = 'Failed to add flow.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
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

                    flowsList.querySelectorAll('a[flow-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;
                            e.preventDefault();
                            navigate(`/${owner}/${project}/flows/${link.getAttribute('flow-seq')}`, navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    flowsList.innerHTML = '<p class="error">Failed to load flows.</p>';
                });

            initBackLink();

            // Load epic to show its status emoji
            const epicCell = document.getElementById('journey-epic-cell');
            getEpicById(owner, project, journey.epicId)
                .then(epic => {
                    const icon = getStatusIcon(epic.statusColor);
                    const label = getStatusLabel(epic.statusColor);
                    epicCell.innerHTML = `<a href="/${owner}/${project}/epics/${epic.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(epic.statement)}</a> <span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
                    const link = epicCell.querySelector('a.detail-link');

                    if (link) {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;

                            e.preventDefault();

                            navigate(link.getAttribute('href'), navContentDiv, contentDiv);
                        });
                    }
                })
                .catch(() => {
                    // keep default link
                });

            // Description save handler
            const descMsg = document.getElementById('desc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = document.getElementById('description-input').value;
                    try {
                        const updated = await updateJourneyDescription(owner, project, journeyId, newDesc);
                        journey.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        patchDetailStackGraphNode(`journey-${journey.sequenceNumber}`, {
                            description: journey.description,
                        });
                        if (editor) editor.showSavedPopover(formatCommentText(journey.description || ''));
                    } catch (err) {
                        descMsg.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        saveBtn.disabled = false;
                    }
                });
            }

            // Permission gating
            (function gateJourneyDetailControls() {
                const canEdit = permission?.permission === 'Edit';
                if (!canEdit) {
                    const editBtn = document.getElementById('edit-desc-btn');
                    const saveBtn = document.getElementById('save-desc');
                    const descInput = document.getElementById('description-input');
                    if (editBtn) { editBtn.disabled = true; editBtn.title = 'Requires Edit permission.'; }
                    if (saveBtn) { saveBtn.disabled = true; saveBtn.title = 'Requires Edit permission.'; }
                    if (descInput) descInput.disabled = true;

                    const addFlowInput = document.getElementById('add-flow-statement');
                    const addFlowSubmit = document.getElementById('add-flow-submit');
                    if (addFlowInput) addFlowInput.disabled = true;
                    if (addFlowSubmit) { addFlowSubmit.disabled = true; addFlowSubmit.title = 'Requires Edit permission.'; }
                }
            })();

            loadCommentsAndReactions(detailDiv, 'Journey', journey.id, owner, project, permission);

            const { owner: go, project: gp } = getOwnerProjectFromPath();
            if (go && gp) {
                const href = buildGraphViewHref(go, gp, `journey-${journey.sequenceNumber}`);
                upsertGraphViewButton(detailDiv, href);
            }

            if (loadingEl) loadingEl.hidden = true;
        })
        .catch(err => {
            if (loadingEl) loadingEl.hidden = true;
            errorEl.textContent = 'Failed to load journey details.';
            console.error(err);
        });
}

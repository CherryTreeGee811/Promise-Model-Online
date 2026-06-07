import { navigate } from '../router.mjs';
import { getJourneyById, getFlowsByJourney, updateJourneyDescription } from './api.mjs';
import { addFlow } from '../flows/api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';
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

export function loadJourneyDetail(journeyId, navContentDiv, contentDiv) {
    const detailDiv = document.getElementById('journey-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('journey-detail-loading');

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    Promise.all([
            getJourneyById(journeyId),
            loadEntityLookupMap('Journey', journeyId),
        ])
        .then(([journey]) => {
            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
                nodeType: 'journey',
                nodeId: journeyId,
                projectIdHint: getGraphProjectIdHintFromUrl(),
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
                            <div class="field-actions"><button id="save-desc" class="btn btn-primary btn-sm" type="button">Save</button> <span id="desc-save-msg"></span></div>
                        </td></tr>
                        <tr>
                            <th>Epic</th>
                            <td id="journey-epic-cell">
                                <a href="/epics/${journey.epicId}" epic-id="${journey.epicId}" class="detail-link link-primary text-decoration-none fw-semibold">Epic ${journey.epicId}</a>
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
            let editor = null;
            if (descInput && descView && editBtn) {
                createCommentAutocomplete(descInput, 'Journey', journeyId);
                editor = setupInlineEdit(descInput, descView, editBtn, saveBtn);
            }

            const epicLink = detailDiv.querySelector('a.detail-link[epic-id]');
            if (epicLink) {
                epicLink.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;

                    e.preventDefault();

                    navigate(`/epics/${epicLink.getAttribute('epic-id')}`, navContentDiv, contentDiv);
                });
            }
            
            const flowsList = document.getElementById('journey-flows-list');
            getFlowsByJourney(journeyId)
                .then(flows => {
                    patchChildMetrics(`journey-${journey.sequenceNumber}`, flows);
                    const tbody = renderTableWithInlineAddRow(flowsList, {
                        headers: ['Statement', 'Actions'],
                        items: flows || [],
                        emptyMessage: 'No flows found for this journey.',
                        renderItemRow: f => `
                            <tr data-flow-id="${f.id}">
                                <td>${escapeHtml(f.statement)}</td>
                                <td><a href="/flows/${f.id}" flow-id="${f.id}" class="btn btn-sm btn-outline-primary">View</a></td>
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
                                const created = await addFlow({
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
                                        <td><a href="/flows/${created.id}" flow-id="${created.id}" class="btn btn-sm btn-outline-primary">View</a></td>
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
                                        <td><a href="/flows/${f.id}" flow-id="${f.id}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;

                    flowsList.querySelectorAll('a[flow-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;
                            e.preventDefault();
                            navigate(`/flows/${link.getAttribute('flow-id')}`, navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    flowsList.innerHTML = '<p class="error">Failed to load flows.</p>';
                });

            initBackLink();

            // Load epic to show its status emoji
            const epicCell = document.getElementById('journey-epic-cell');
            getEpicById(journey.epicId)
                .then(epic => {
                    const icon = getStatusIcon(epic.statusColor);
                    const label = getStatusLabel(epic.statusColor);
                    epicCell.innerHTML = `<a href="/epics/${epic.id}" epic-id="${epic.id}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(epic.statement)}</a> <span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
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
                        const updated = await updateJourneyDescription(journeyId, newDesc);
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

            loadCommentsAndReactions(detailDiv, 'Journey', journeyId);

            getEpicById(journey.epicId)
                .then(epic => resolveProjectIdForPromise(epic.productPromiseId, getGraphProjectIdHintFromUrl()))
                .then(projectId => {
                    const href = buildGraphViewHref(projectId, `journey-${journey.sequenceNumber}`);
                    upsertGraphViewButton(detailDiv, href);
                })
                .catch(error => {
                    console.error('Unable to resolve graph link for journey detail', error);
                });

            if (loadingEl) loadingEl.hidden = true;
        })
        .catch(err => {
            if (loadingEl) loadingEl.hidden = true;
            errorEl.textContent = 'Failed to load journey details.';
            console.error(err);
        });
}

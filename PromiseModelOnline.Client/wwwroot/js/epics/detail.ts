// @ts-nocheck
import { navigate } from '../router.ts';
import { getEpic, getJourneys, updateEpicDescription } from './api.ts';
import { createJourney } from '../journeys/api.ts';
import { getPromiseById } from '../promises/api.ts';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.ts';
import { escapeHtml } from '../utils/html.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchChildMetrics,
    patchDetailStackGraphNode,
} from '../projects/detail-stack-graph.ts';
import { getStatusHtml, getStatusIcon, getStatusLabel, initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';

/** @typedef {{ id: number, sequenceNumber: number, statement: string, description?: string, statusColor?: string, createdAt: string, updatedAt?: string, productPromiseId: number }} Epic */

/**
 * Load and render the epic detail page with journeys, graph, comments, and reactions.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} epicId - The epic's sequence number.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @param {{ permission?: string }|null} permission - The user's permission object.
 */
export function loadEpicDetail(owner, project, epicId, navContentDiv, contentDiv, permission) {
    const detailDiv = /** @type {HTMLElement} */ (document.getElementById('epic-detail-content'));
    const errorEl = /** @type {HTMLElement} */ (document.getElementById('error-text'));
    const loadingEl = /** @type {HTMLElement|null} */ (document.getElementById('epic-detail-loading'));

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    getEpic(owner, project, epicId)
        .then(epic => Promise.all([
            Promise.resolve(epic),
            loadEntityLookupMap('Epic', epic.id, owner, project),
        ]))
        .then(([epic]) => {
            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
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

            const descInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('description-input'));
            const descView = /** @type {HTMLElement|null} */ (document.getElementById('description-view'));
            const editBtn = /** @type {HTMLElement|null} */ (document.getElementById('edit-desc-btn'));
            const saveBtn = /** @type {HTMLElement|null} */ (document.getElementById('save-desc'));
            const cancelBtn = /** @type {HTMLElement|null} */ (document.getElementById('cancel-desc'));
            let editor = null;
            if (descInput && descView && editBtn) {
                createCommentAutocomplete(descInput, 'Epic', epic.id);
                editor = setupInlineEdit(descInput, descView, editBtn, saveBtn, cancelBtn);
            }

            const parentCell = /** @type {HTMLElement} */ (document.getElementById('epic-parent-promise'));
            getPromiseById(owner, project, epic.productPromiseId)
                .then(promise => {
                    const icon = getStatusIcon(promise.statusColor);
                    const label = getStatusLabel(promise.statusColor);
                    parentCell.innerHTML = `<a href="/${owner}/${project}/promises/${promise.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(promise.statement)}</a> <span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;

                    const link = parentCell.querySelector('a.detail-link');

                    if (link) {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;
                            e.preventDefault();
                            navigate(link.getAttribute('href'), navContentDiv, contentDiv);
                        });
                    }
                })
                .catch(() => {
                    parentCell.textContent = `Promise ${epic.productPromiseId}`;
                });

            const journeysList = /** @type {HTMLElement} */ (document.getElementById('epic-journeys-list'));
            getJourneys(owner, project, epicId)
                .then(journeys => {
                    patchChildMetrics(`epic-${epic.sequenceNumber}`, journeys);
                    const tbody = renderTableWithInlineAddRow(journeysList, {
                        headers: ['Statement', 'Actions'],
                        items: journeys || [],
                        emptyMessage: 'No journeys found for this epic.',
                        renderItemRow: j => `
                            <tr data-journey-id="${j.id}">
                                <td>${escapeHtml(j.statement)}</td>
                                <td><a href="/${owner}/${project}/journeys/${j.sequenceNumber}" journey-id="${j.id}" journey-seq="${j.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
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
                    const msg = journeysList.querySelector('#add-journey-msg');
                    const submitBtn = journeysList.querySelector('#add-journey-submit');

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
                            } catch (err) {
                                msg.textContent = 'Failed to add journey.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
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
                                ${journeys.map(j => `
                                    <tr>
                                        <td>${escapeHtml(j.statement)}</td>
                                        <td><a href="/${owner}/${project}/journeys/${j.sequenceNumber}" journey-id="${j.id}" journey-seq="${j.sequenceNumber}" class="btn btn-sm btn-outline-primary">View</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;

                    journeysList.querySelectorAll('a[journey-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;
                            e.preventDefault();
                            navigate(`/${owner}/${project}/journeys/${link.getAttribute('journey-seq')}`, navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    journeysList.innerHTML = '<p class="error">Failed to load journeys.</p>';
                });

            initBackLink();
            (function gateEpicDetailControls() {
                const canEdit = permission?.permission === 'Edit';
                if (!canEdit) {
                    const editBtn = document.getElementById('edit-desc-btn');
                    const saveBtn = document.getElementById('save-desc');
                    const descInput = document.getElementById('description-input');
                    if (editBtn) { editBtn.disabled = true; editBtn.title = 'Requires Edit permission.'; }
                    if (saveBtn) { saveBtn.disabled = true; saveBtn.title = 'Requires Edit permission.'; }
                    if (descInput) descInput.disabled = true;

                    const addJourneyInput = document.getElementById('add-journey-statement');
                    const addJourneySubmit = document.getElementById('add-journey-submit');
                    if (addJourneyInput) addJourneyInput.disabled = true;
                    if (addJourneySubmit) { addJourneySubmit.disabled = true; addJourneySubmit.title = 'Requires Edit permission.'; }
                }
            })();

            loadCommentsAndReactions(detailDiv, 'Epic', epic.id, owner, project, permission);

            const descMsg = document.getElementById('desc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    descMsg.textContent = '';
                    saveBtn.disabled = true;
                    const newDesc = /** @type {HTMLTextAreaElement} */(document.getElementById('description-input')).value;
                    try {
                        const updated = await updateEpicDescription(owner, project, epicId, newDesc);
                        epic.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        patchDetailStackGraphNode(`epic-${epic.sequenceNumber}`, {
                            description: epic.description,
                        });
                        if (editor) editor.showSavedPopover(formatCommentText(epic.description || ''));
                    } catch (err) {
                        descMsg.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        saveBtn.disabled = false;
                    }
                });
            }

            const { owner: go, project: gp } = getOwnerProjectFromPath();
            if (go && gp) {
                const href = buildGraphViewHref(go, gp, `epic-${epic.sequenceNumber}`);
                upsertGraphViewButton(detailDiv, href);
            }
        })
        .catch(err => {
            if (loadingEl) loadingEl.hidden = true;
            errorEl.textContent = 'Failed to load epic details.';
            console.error(err);
        });
}

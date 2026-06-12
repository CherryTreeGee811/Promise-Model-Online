import { navigate } from '../router.mjs';
import { getFlow, getMoments, updateFlowDescription } from './api.mjs';
import { createMoment, updateMomentType } from '../moments/api.mjs';
import { getJourneyById } from '../journeys/api.mjs';
import { renderTableWithInlineAddRow, insertRowBeforeAddRow, removeInlineEmptyRow } from '../utils/inline-table.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, getOwnerProjectFromPath, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';
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

export function loadFlowDetail(owner, project, flowId, navContentDiv, contentDiv, permission) {
    const detailDiv = document.getElementById('flow-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('flow-detail-loading');

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    getFlow(owner, project, flowId)
        .then(flow => Promise.all([
            Promise.resolve(flow),
            loadEntityLookupMap('Flow', flow.id, owner, project),
        ]))
        .then(([flow]) => {
            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
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

            // Autocomplete + inline edit for description
            const descInput = document.getElementById('description-input');
            const descView = document.getElementById('description-view');
            const editBtn = document.getElementById('edit-desc-btn');
            const saveBtn = document.getElementById('save-desc');
            const cancelBtn = document.getElementById('cancel-desc');
            let editor = null;
            if (descInput && descView && editBtn) {
                createCommentAutocomplete(descInput, 'Flow', flow.id);
                editor = setupInlineEdit(descInput, descView, editBtn, saveBtn, cancelBtn);
            }

            const journeyLink = detailDiv.querySelector('.detail-link[journey-id]');
            if (journeyLink) {
                journeyLink.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;

                    e.preventDefault();

                    navigate(`/${owner}/${project}/journeys/${journeyLink.getAttribute('journey-seq')}`, navContentDiv, contentDiv);
                });
            }

            // Load moments for this flow
            const momentsList = document.getElementById('flow-moments-list');
            getMoments(owner, project, flowId)
                .then(moments => {
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
                    const msg = momentsList.querySelector('#add-moment-msg');
                    const submitBtn = momentsList.querySelector('#add-moment-submit');

                    if (form && statementInput && typeSelect && msg && submitBtn) {
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
                            } catch (err) {
                                msg.textContent = 'Failed to add moment.';
                                console.error(err);
                            } finally {
                                submitBtn.disabled = false;
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

                    momentsList.addEventListener('change', async (e) => {
                        const target = e.target;
                        if (target.matches('.moment-type-select')) {
                            const momentId = parseInt(target.dataset.momentId, 10);
                            const newType = target.value;
                            const previous = target.dataset.currentType || newType;
                            try {
                                await updateMomentType(owner, project, momentId, newType);
                                target.dataset.currentType = newType;
                            } catch (err) {
                                target.value = previous;
                                console.error('Failed to update moment type:', err);
                            }
                        }
                    });

                    momentsList.querySelectorAll('a[moment-id]').forEach(link => {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;

                            e.preventDefault();

                            navigate(`/${owner}/${project}/moments/${link.getAttribute('moment-seq')}`, navContentDiv, contentDiv);
                        });
                    });
                })
                .catch(() => {
                    momentsList.innerHTML = '<p class="error">Failed to load moments.</p>';
                });

            // Back button event
            initBackLink();

            // Load parent journey to show its status emoji
            const journeyCell = document.getElementById('flow-journey-cell');
            getJourneyById(owner, project, flow.journeyId)
                .then(journey => {
                    const icon = getStatusIcon(journey.statusColor);
                    const label = getStatusLabel(journey.statusColor);
                    journeyCell.innerHTML = `<a href="/${owner}/${project}/journeys/${journey.sequenceNumber}" class="detail-link link-primary text-decoration-none fw-semibold">${escapeHtml(journey.statement)}</a> <span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
                    
                    const link = journeyCell.querySelector('a.detail-link');
                    if (link) {
                        link.addEventListener('click', (e) => {
                            if (e.ctrlKey || e.metaKey || e.button === 1) return;

                            e.preventDefault();

                            navigate(link.getAttribute('href'), navContentDiv, contentDiv);
                        });
                    }
                })
                .catch(() => {
                    // leave link as-is
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
                        const updated = await updateFlowDescription(owner, project, flowId, newDesc);
                        flow.description = updated?.description ?? (newDesc.trim() ? newDesc : null);
                        patchDetailStackGraphNode(`flow-${flow.sequenceNumber}`, {
                            description: flow.description,
                        });
                        if (editor) editor.showSavedPopover(formatCommentText(flow.description || ''));
                    } catch (err) {
                        descMsg.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        saveBtn.disabled = false;
                    }
                });
            }

            // Permission gating
            (function gateFlowDetailControls() {
                const canEdit = permission?.permission === 'Edit';
                if (!canEdit) {
                    const editBtn = document.getElementById('edit-desc-btn');
                    const saveBtn = document.getElementById('save-desc');
                    const descInput = document.getElementById('description-input');
                    if (editBtn) { editBtn.disabled = true; editBtn.title = 'Requires Edit permission.'; }
                    if (saveBtn) { saveBtn.disabled = true; saveBtn.title = 'Requires Edit permission.'; }
                    if (descInput) descInput.disabled = true;

                    const addMomentInput = document.getElementById('add-moment-statement');
                    const addMomentSubmit = document.getElementById('add-moment-submit');
                    if (addMomentInput) addMomentInput.disabled = true;
                    if (addMomentSubmit) { addMomentSubmit.disabled = true; addMomentSubmit.title = 'Requires Edit permission.'; }

                    const addMomentType = document.getElementById('add-moment-type');
                    if (addMomentType) addMomentType.disabled = true;
                }
            })();

            loadCommentsAndReactions(detailDiv, 'Flow', flow.id, owner, project, permission);

            const { owner: go, project: gp } = getOwnerProjectFromPath();
            if (go && gp) {
                const href = buildGraphViewHref(go, gp, `flow-${flow.sequenceNumber}`);
                upsertGraphViewButton(detailDiv, href);
            }
        })
        .catch(err => {
            if (loadingEl) loadingEl.hidden = true;
            errorEl.textContent = 'Failed to load flow details.';
            console.error(err);
        });
}

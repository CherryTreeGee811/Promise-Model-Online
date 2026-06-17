// @ts-nocheck
import { navigate } from '../router.ts';
import { getMoment, createTask, updateTaskCompletion, updateMomentDescription, updateMomentEstimate, updateMomentStatus, assignMomentToStride, updateMomentType } from './api.ts';
import { getStrides } from '../strides/api.ts';
import { insertRowBeforeAddRow, removeInlineEmptyRow, renderTableWithInlineAddRow } from '../utils/inline-table.ts';
import { escapeHtml } from '../utils/html.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { initBackLink, loadCommentsAndReactions } from '../utils/detail-common.ts';
import { getStatusOptionHtml } from '../utils/status-utils.ts';
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { isAtLeast } from '../utils/permissions.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchDetailStackGraphNode,
    refreshDetailStackGraph,
} from '../projects/detail-stack-graph.ts';

/** @typedef {{ id: number, sequenceNumber: number, statement: string, description?: string, type: string, status: string, statusColor?: string, effortEstimate?: string, assignedStrideId?: number, createdAt: string, completedAt?: string, tasks?: Array<{ id: number, name: string, description: string, isCompleted: boolean }> }} Moment */

/**
 * Load and render the moment detail page with tasks, comments, and reactions.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} momentId - The moment's sequence number.
 * @param {HTMLElement} navContentDiv - Navigation container for client-side routing.
 * @param {HTMLElement} contentDiv - Content container for client-side routing.
 * @param {{ permission?: string }|null} permission - The user's permission object.
 */
export function loadMomentDetail(owner, project, momentId, navContentDiv, contentDiv, permission) {
    const detailDiv = /** @type {HTMLElement} */ (document.getElementById('moment-detail-content'));
    const errorEl = /** @type {HTMLElement} */ (document.getElementById('error-text'));
    const loadingEl = /** @type {HTMLElement|null} */ (document.getElementById('moment-detail-loading'));

    destroyDetailStackGraph();
    if (loadingEl) loadingEl.hidden = false;
    errorEl.textContent = '';

    getMoment(owner, project, momentId)
        .then(moment => Promise.all([
            Promise.resolve(moment),
            loadEntityLookupMap('Moment', moment.id, owner, project),
        ]))
        .then(async ([moment]) => {
            if (loadingEl) loadingEl.hidden = true;

            mountDetailStackGraph({
                nodeType: 'moment',
                nodeId: momentId,
                owner,
                project,
            });

            detailDiv.innerHTML = `
                <div class="detail-card moment-detail-card">
                    <h2>${escapeHtml(moment.statement)}</h2>
                    <table class="table table-sm table-striped align-middle detail-table">
                        <tr>
                            <th scope="row"><label for="moment-description-input">Description</label></th>
                            <td>
                                <div class="inline-edit-wrapper">
                                    <p id="moment-description-view" class="inline-edit-view">${formatCommentText(moment.description || '')}</p>
                                    <button id="edit-moment-desc-btn" class="btn btn-success btn-sm inline-edit-btn" type="button" title="Edit description"><i class="bi bi-pencil"></i></button>
                                    <textarea id="moment-description-input" rows="4" class="form-control detail-textarea" aria-label="Description" style="display:none">${escapeHtml(moment.description || '')}</textarea>
                                </div>
                                <div class="field-actions"><button id="moment-description-cancel" class="btn btn-outline-secondary btn-sm" type="button" style="display:none">Cancel</button> <button id="moment-description-save" class="btn btn-primary btn-sm" type="button">Save</button> <span id="moment-description-msg"></span></div>
                            </td>
                        </tr>
                        <tr><th scope="row"><label for="moment-type-select">Type</label></th><td>
                            <select id="moment-type-select" class="form-select form-select-sm">
                                <option value="Story" ${moment.type === 'Story' ? 'selected' : ''}>Story</option>
                                <option value="Job" ${moment.type === 'Job' ? 'selected' : ''}>Job</option>
                            </select>
                        </td></tr>
                        <tr><th scope="row"><label for="moment-status-select">Status</label></th><td>
                            <select id="moment-status-select" class="form-select form-select-sm">
                                ${getStatusOptionHtml('Todo', moment.status)}
                                ${getStatusOptionHtml('InProgress', moment.status)}
                                ${getStatusOptionHtml('Blocked', moment.status)}
                                ${getStatusOptionHtml('Done', moment.status)}
                            </select>
                        </td></tr>
                        <tr>
                            <th scope="row"><label for="moment-estimate-select">Effort Estimate</label></th>
                            <td>
                                <select id="moment-estimate-select" class="form-select form-select-sm">
                                    <option value="-" ${moment.effortEstimate == null ? 'selected' : ''}>-</option>
                                    <option value="XS"  ${moment.effortEstimate === 'XS'  ? 'selected' : ''}>XS</option>
                                    <option value="S"   ${moment.effortEstimate === 'S'   ? 'selected' : ''}>S</option>
                                    <option value="M"   ${moment.effortEstimate === 'M'   ? 'selected' : ''}>M</option>
                                    <option value="L"   ${moment.effortEstimate === 'L'   ? 'selected' : ''}>L</option>
                                    <option value="XL"  ${moment.effortEstimate === 'XL'  ? 'selected' : ''}>XL</option>
                                    <option value="XXL" ${moment.effortEstimate === 'XXL' ? 'selected' : ''}>XXL</option>
                                    <option value="XXXL"${moment.effortEstimate === 'XXXL'? 'selected' : ''}>XXXL</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="moment-stride-select">Assigned Stride</label></th>
                            <td>
                                <select id="moment-stride-select" class="form-select form-select-sm">
                                    <option value="">Backlog</option>
                                </select>
                            </td>
                        </tr>
                        <tr><th scope="row">Created</th><td>${new Date(moment.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th scope="row">Completed</th><td>${moment.completedAt ? new Date(moment.completedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Moment Tasks</h3>
                    <div id="moment-tasks"></div>
                    <div id="moment-comments"></div>
                    <button id="back-link" class="btn btn-outline-secondary btn-sm" type="button"><span aria-hidden="true">←</span> Back</button>
                </div>
            `;

            const momentDescInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('moment-description-input'));
            const momentDescView = /** @type {HTMLElement|null} */ (document.getElementById('moment-description-view'));
            const momentEditBtn = /** @type {HTMLElement|null} */ (document.getElementById('edit-moment-desc-btn'));
            const descriptionSaveButton = /** @type {HTMLElement|null} */ (document.getElementById('moment-description-save'));
            const momentDescriptionCancelBtn = /** @type {HTMLElement|null} */ (document.getElementById('moment-description-cancel'));
            let momentEditor = null;
            if (momentDescInput && momentDescView && momentEditBtn) {
                createCommentAutocomplete(momentDescInput, 'Moment', moment.id);
                momentEditor = setupInlineEdit(momentDescInput, momentDescView, momentEditBtn, descriptionSaveButton, momentDescriptionCancelBtn);
            }

            (function gateMomentDetailControls() {
                const canEdit = isAtLeast(permission?.permission, 'Edit');
                if (!canEdit) {
                    const editBtn = document.getElementById('edit-moment-desc-btn');
                    const saveBtn = document.getElementById('moment-description-save');
                    const descInput = document.getElementById('moment-description-input');
                    if (editBtn) { editBtn.disabled = true; editBtn.title = 'Requires Edit permission.'; }
                    if (saveBtn) { saveBtn.disabled = true; saveBtn.title = 'Requires Edit permission.'; }
                    if (descInput) descInput.disabled = true;

                    const typeSelect = document.getElementById('moment-type-select');
                    const statusSelect = document.getElementById('moment-status-select');
                    const estSelect = document.getElementById('moment-estimate-select');
                    const strideSelect = document.getElementById('moment-stride-select');
                    if (typeSelect) { typeSelect.disabled = true; typeSelect.title = 'Requires Edit permission.'; }
                    if (statusSelect) { statusSelect.disabled = true; statusSelect.title = 'Requires Edit permission.'; }
                    if (estSelect) { estSelect.disabled = true; estSelect.title = 'Requires Edit permission.'; }
                    if (strideSelect) { strideSelect.disabled = true; strideSelect.title = 'Requires Edit permission.'; }
                }
            })();

            const tasksContainer = /** @type {HTMLElement} */ (document.getElementById('moment-tasks'));
            renderMomentTasks(tasksContainer, momentId, moment.tasks, moment, permission, owner, project);

            const descriptionInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('moment-description-input'));
            const descriptionMessage = /** @type {HTMLElement|null} */ (document.getElementById('moment-description-msg'));
            if (descriptionSaveButton && descriptionInput && descriptionMessage) {
                descriptionSaveButton.addEventListener('click', async () => {
                    descriptionMessage.textContent = '';
                    descriptionSaveButton.disabled = true;

                    const newDescription = descriptionInput.value;
                    try {
                        const updated = await updateMomentDescription(owner, project, momentId, newDescription);
                        moment.description = updated?.description ?? (newDescription.trim() ? newDescription : null);
                        patchDetailStackGraphNode(`moment-${moment.sequenceNumber}`, {
                            description: moment.description,
                        });
                        if (momentEditor) momentEditor.showSavedPopover(formatCommentText(moment.description || ''));
                    } catch (err) {
                        descriptionMessage.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        descriptionSaveButton.disabled = false;
                    }
                });
            }

            detailDiv.addEventListener('click', (e) => {
                const flowLink = e.target.closest('a.detail-link');
                if (!flowLink) return;

                if (e.ctrlKey || e.metaKey || e.button === 1) return;

                e.preventDefault();
                navigate(`/${owner}/${project}/flows/${flowLink.getAttribute('flow-seq')}`, navContentDiv, contentDiv);
            });

            const estSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('moment-estimate-select'));
            if (estSelect) {
                estSelect.addEventListener('change', async () => {
                    const estimate = estSelect.value === '-' ? null : estSelect.value;
                    try {
                        await updateMomentEstimate(owner, project, momentId, estimate);
                        moment.effortEstimate = estimate;
                        patchDetailStackGraphNode(`moment-${moment.sequenceNumber}`, {
                            effortEstimate: estimate,
                        });
                    } catch (err) {
                        alert('Failed to update estimate');
                        console.error(err);
                    }
                });
            }

            const strideSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('moment-stride-select'));
            if (strideSelect) {
                try {
                    const strides = await getStrides(owner, project);
                    strides.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
                    strides.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = String(s.id);
                        opt.textContent = s.name || `Stride ${s.id}`;
                        if (String(s.id) === String(moment.assignedStrideId)) opt.selected = true;
                        strideSelect.appendChild(opt);
                    });
                    if (!moment.assignedStrideId) {
                        strideSelect.value = '';
                    }

                    strideSelect.addEventListener('change', async () => {
                        const val = strideSelect.value === '' ? null : parseInt(strideSelect.value, 10);
                        try {
                            const updated = await assignMomentToStride(owner, project, momentId, val);
                            moment.assignedStrideId = updated.assignedStrideId;
                            patchDetailStackGraphNode(`moment-${moment.sequenceNumber}`, {
                                assignedStrideId: updated.assignedStrideId,
                            });
                            strideSelect.value = updated.assignedStrideId ? String(updated.assignedStrideId) : '';
                        } catch (err) {
                            alert('Failed to update assigned stride');
                            console.error(err);
                        }
                    });
                } catch (err) {
                    console.error('Failed to load strides', err);
                }
            }

            const statusSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('moment-status-select'));
            const completedCell = /** @type {HTMLElement|null} */ (detailDiv.querySelector('tr:nth-last-child(1) td'));
            if (statusSelect) {
                statusSelect.addEventListener('change', async () => {
                    const prev = statusSelect.value;
                    try {
                        const updated = await updateMomentStatus(owner, project, momentId, statusSelect.value);
                        moment.status = updated.status;
                        moment.statusColor = updated.statusColor;
                        moment.completedAt = updated.completedAt;
                        statusSelect.value = updated.status;
                        await refreshDetailStackGraph();
                        if (updated.completedAt) {
                            const d = new Date(updated.completedAt);
                            completedCell.textContent = d.toLocaleDateString('en-CA');
                        } else {
                            completedCell.textContent = '–';
                        }
                    } catch (err) {
                        statusSelect.value = prev;
                        alert('Failed to update status');
                    }
                });
            }

            const typeSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('moment-type-select'));
            if (typeSelect) {
                typeSelect.addEventListener('change', async () => {
                    const newType = typeSelect.value;
                    try {
                        const updated = await updateMomentType(owner, project, momentId, newType);
                        if (updated && updated.type) {
                            moment.type = updated.type;
                            typeSelect.value = updated.type;
                            patchDetailStackGraphNode(`moment-${moment.sequenceNumber}`, {
                                type: updated.type,
                            });
                        }
                    } catch (err) {
                        alert('Failed to update type');
                        typeSelect.value = moment.type;
                    }
                });
            }

            initBackLink();
            loadCommentsAndReactions(detailDiv, 'Moment', moment.id, owner, project, permission);

            const { owner: go, project: gp } = getOwnerProjectFromPath();
            if (go && gp) {
                const href = buildGraphViewHref(go, gp, `moment-${moment.sequenceNumber}`);
                upsertGraphViewButton(detailDiv, href);
            }
        })
        .catch(err => {
            if (loadingEl) loadingEl.hidden = true;
            errorEl.textContent = 'Failed to load moment details.';
            console.error(err);
        });
}

/**
 * Render the tasks section for a moment.
 * @param {HTMLElement} container - The container element.
 * @param {number} momentId - The moment ID.
 * @param {Array} tasks - The list of tasks.
 * @param {Moment} moment - The moment data object.
 * @param {{ permission?: string }|null} permission - The user's permission object.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 */
function renderMomentTasks(container, momentId, tasks, moment, permission, owner, project) {
    if (!container) return;

    const taskList = Array.isArray(tasks) ? tasks : [];

    const tbody = renderTableWithInlineAddRow(container, {
        headers: ['Name', 'Description', 'Completion Status'],
        items: taskList,
        emptyMessage: 'No moment tasks found.',
        renderItemRow: task => `
            <tr data-moment-task-id="${task.id}">
                <td>${escapeHtml(task.name || '')}</td>
                <td>${formatCommentText(task.description)}</td>
                <td>
                    <label class="moment-task-completion">
                            <input type="checkbox" class="moment-task-complete-checkbox form-check-input" data-moment-task-id="${task.id}" ${task.isCompleted ? 'checked' : ''} />
                        <span>${task.isCompleted ? 'Completed' : 'Open'}</span>
                    </label>
                </td>
            </tr>
        `,
        renderAddRow: () => `
            <tr data-inline-add-row="1">
                <td>
                    <input id="add-moment-task-name" class="form-control form-control-sm" type="text" maxlength="200" required placeholder="New task name...">
                </td>
                <td>
                    <input id="add-moment-task-description" class="form-control form-control-sm" type="text" maxlength="500" placeholder="Task description...">
                </td>
                <td>
                    <div class="inline-add-actions">
                        <label class="moment-task-completion">
                            <input id="add-moment-task-completed" type="checkbox" />
                            <span>Completed</span>
                        </label>
                        <button id="add-moment-task-submit" type="button" class="btn btn-sm btn-outline-primary">Add</button>
                        <span id="add-moment-task-msg"></span>
                    </div>
                </td>
            </tr>
        `,
    });

    const addTaskName = /** @type {HTMLInputElement|null} */ (container.querySelector('#add-moment-task-name'));
    const addTaskDescription = /** @type {HTMLInputElement|null} */ (container.querySelector('#add-moment-task-description'));
    const addTaskCompleted = /** @type {HTMLInputElement|null} */ (container.querySelector('#add-moment-task-completed'));
    const addTaskButton = /** @type {HTMLElement|null} */ (container.querySelector('#add-moment-task-submit'));
    const addTaskMessage = /** @type {HTMLElement|null} */ (container.querySelector('#add-moment-task-msg'));

    if (addTaskDescription) createCommentAutocomplete(addTaskDescription, 'Moment', moment.id);

    const canEdit = isAtLeast(permission?.permission, 'Edit');
    if (!canEdit) {
        if (addTaskName) addTaskName.disabled = true;
        if (addTaskDescription) addTaskDescription.disabled = true;
        if (addTaskCompleted) addTaskCompleted.disabled = true;
        if (addTaskButton) { addTaskButton.disabled = true; addTaskButton.title = 'Requires Edit permission.'; }
    }

    if (addTaskButton && addTaskName && addTaskDescription && addTaskCompleted && addTaskMessage) {
        addTaskButton.addEventListener('click', async () => {
            addTaskMessage.textContent = '';

            const name = addTaskName.value.trim();
            if (!name) {
                addTaskMessage.textContent = 'Name is required.';
                return;
            }

            addTaskButton.disabled = true;

            try {
                const created = await createTask(owner, project, momentId, {
                    name,
                    description: addTaskDescription.value.trim(),
                    isCompleted: addTaskCompleted.checked,
                });

                if (created) {
                    removeInlineEmptyRow(tbody);
                    const row = document.createElement('tr');
                    row.dataset.momentTaskId = created.id;
                    row.innerHTML = `
                        <td>${escapeHtml(created.name || '')}</td>
                        <td>${formatCommentText(created.description || '')}</td>
                        <td>
                            <label class="moment-task-completion">
                                <input type="checkbox" class="moment-task-complete-checkbox" data-moment-task-id="${created.id}" ${created.isCompleted ? 'checked' : ''} />
                                <span>${created.isCompleted ? 'Completed' : 'Open'}</span>
                            </label>
                        </td>
                    `;
                    insertRowBeforeAddRow(tbody, row);
                    addTaskName.value = '';
                    addTaskDescription.value = '';
                    addTaskCompleted.checked = false;
                    if (!Array.isArray(moment.tasks)) moment.tasks = [];
                    moment.tasks.push(created);
                    syncMomentTasksToStackGraph(momentId, moment);
                    bindMomentTaskCompletionToggle(tbody, momentId, moment, null, owner, project);
                }
            } catch (err) {
                addTaskMessage.textContent = 'Failed to add task.';
                console.error(err);
            } finally {
                addTaskButton.disabled = false;
            }
        });
    }

    bindMomentTaskCompletionToggle(tbody, momentId, moment, permission, owner, project);
}

/**
 * Sync the current moment's task list into the detail-stack graph node.
 * @param {number} momentId - The moment's sequence number.
 * @param {Moment} moment - The moment data object.
 */
function syncMomentTasksToStackGraph(momentId, moment) {
    patchDetailStackGraphNode(`moment-${moment.sequenceNumber}`, {
        tasks: Array.isArray(moment?.tasks) ? [...moment.tasks] : [],
    });
}

/**
 * Bind change event listeners to task completion checkboxes.
 * @param {HTMLElement} tbody - The table body containing the checkboxes.
 * @param {number} momentId - The moment's sequence number.
 * @param {Moment} moment - The moment data object.
 * @param {{ permission?: string }|null} permission - The user's permission object.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 */
function bindMomentTaskCompletionToggle(tbody, momentId, moment, permission, owner, project) {
    if (!tbody) return;

    const canEdit = isAtLeast(permission?.permission, 'Edit');

    tbody.querySelectorAll('.moment-task-complete-checkbox').forEach(checkbox => {
        if (checkbox.dataset.bound === '1') return;
        checkbox.dataset.bound = '1';

        if (!canEdit) {
            checkbox.disabled = true;
            checkbox.title = 'Requires Edit permission.';
            return;
        }

        checkbox.addEventListener('change', async () => {
            const taskId = Number.parseInt(String(checkbox.dataset.momentTaskId ?? ''), 10);
            const row = checkbox.closest('tr');
            const label = row?.querySelector('.moment-task-completion span');
            const prevChecked = !checkbox.checked;
            checkbox.disabled = true;

            try {
                const updated = await updateTaskCompletion(owner, project, momentId, taskId, checkbox.checked);
                if (updated) {
                    checkbox.checked = Boolean(updated.isCompleted);
                    if (label) label.textContent = updated.isCompleted ? 'Completed' : 'Open';
                    const task = (moment.tasks ?? []).find(item => Number(item.id) === taskId);
                    if (task) {
                        task.isCompleted = updated.isCompleted;
                        syncMomentTasksToStackGraph(momentId, moment);
                    }
                } else if (label) {
                    label.textContent = checkbox.checked ? 'Completed' : 'Open';
                }
            } catch (err) {
                checkbox.checked = prevChecked;
                if (label) label.textContent = prevChecked ? 'Completed' : 'Open';
                alert('Failed to update task completion');
                console.error(err);
            } finally {
                checkbox.disabled = false;
            }
        });
    });
}

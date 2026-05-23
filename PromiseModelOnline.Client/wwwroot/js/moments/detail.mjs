import { routeHandler } from '../router.mjs';
import { getMomentById, addMomentTask, updateMomentTaskCompletion, updateMomentDescription, updateMomentEstimate, updateMomentStatus, moveMomentToStride, updateMomentType } from './api.mjs';
import { loadComments } from '../comments/comments.mjs';
import { getAllStrides } from '../strides/api.mjs';
import { getFlowById } from '../flows/api.mjs';
import { getJourneyById } from '../journeys/api.mjs';
import { getEpicById } from '../epics/api.mjs';
import { insertRowBeforeAddRow, removeInlineEmptyRow, renderTableWithInlineAddRow } from '../utils/inline-table.mjs';
import { buildGraphViewHref, getGraphProjectIdHintFromUrl, resolveProjectIdForPromise, upsertGraphViewButton } from '../projects/graph-link.mjs';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchDetailStackGraphNode,
    refreshDetailStackGraph,
} from '../projects/detail-stack-graph.mjs';

export function loadMomentDetail(momentId, navContentDiv, contentDiv) {
    const detailDiv = document.getElementById('moment-detail-content');
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');

    destroyDetailStackGraph();
    loadingEl.textContent = 'Loading moment...';
    errorEl.textContent = '';

    getMomentById(momentId)
        .then(async moment => {
            loadingEl.textContent = '';

            mountDetailStackGraph({
                nodeType: 'moment',
                nodeId: momentId,
                projectIdHint: getGraphProjectIdHintFromUrl(),
            });

            detailDiv.innerHTML = `
                <div class="detail-card moment-detail-card">
                    <h2>${escapeHtml(moment.statement)}</h2>
                    <table class="detail-table">
                        <tr>
                            <th>Description</th>
                            <td>
                                <textarea id="moment-description-input" rows="4" class="detail-textarea">${escapeHtml(moment.description || '')}</textarea>
                                <div class="field-actions"><button id="moment-description-save" class="save-btn">Save</button> <span id="moment-description-msg"></span></div>
                            </td>
                        </tr>
                        <tr><th>Type</th><td>
                            <select id="moment-type-select">
                                <option value="Story" ${moment.type === 'Story' ? 'selected' : ''}>Story</option>
                                <option value="Job" ${moment.type === 'Job' ? 'selected' : ''}>Job</option>
                            </select>
                        </td></tr>
                        <tr><th>Status</th><td>
                            <select id="moment-status-select">
                                ${getStatusOption('Todo', moment.status)}
                                ${getStatusOption('InProgress', moment.status)}
                                ${getStatusOption('Blocked', moment.status)}
                                ${getStatusOption('Done', moment.status)}
                            </select>
                        </td></tr>
                        <tr>
                            <th>Effort Estimate</th>
                            <td>
                                <select id="moment-estimate-select">
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
                            <th>Assigned Stride</th>
                            <td>
                                <select id="moment-stride-select">
                                    <option value="">Backlog</option>
                                </select>
                            </td>
                        </tr>
                        <tr><th>Created</th><td>${new Date(moment.createdAt).toLocaleDateString('en-CA')}</td></tr>
                        <tr><th>Completed</th><td>${moment.completedAt ? new Date(moment.completedAt).toLocaleDateString('en-CA') : '–'}</td></tr>
                    </table>
                    <h3>Moment Tasks</h3>
                    <div id="moment-tasks"></div>
                    <div id="moment-comments"></div>
                    <button id="back-link" class="back-btn">← Back</button>
                </div>
            `;

            const tasksContainer = document.getElementById('moment-tasks');
            renderMomentTasks(tasksContainer, momentId, moment.tasks, moment);

            const descriptionSaveButton = document.getElementById('moment-description-save');
            const descriptionInput = document.getElementById('moment-description-input');
            const descriptionMessage = document.getElementById('moment-description-msg');
            if (descriptionSaveButton && descriptionInput && descriptionMessage) {
                descriptionSaveButton.addEventListener('click', async () => {
                    descriptionMessage.textContent = '';
                    descriptionSaveButton.disabled = true;

                    const newDescription = descriptionInput.value;
                    try {
                        const updated = await updateMomentDescription(momentId, newDescription);
                        moment.description = updated?.description ?? (newDescription.trim() ? newDescription : null);
                        patchDetailStackGraphNode(`moment-${momentId}`, {
                            description: moment.description,
                        });
                        descriptionMessage.textContent = 'Saved';
                    } catch (err) {
                        descriptionMessage.textContent = 'Save failed';
                        console.error(err);
                    } finally {
                        descriptionSaveButton.disabled = false;
                    }
                });
            }

            // allow routing by clicking detail links
            detailDiv.addEventListener('click', (e) => {
                const flowLink = e.target.closest('a.detail-link');
                if (!flowLink) return;

                // allow new-tab behaviour
                if (e.ctrlKey || e.metaKey || e.button === 1) return;

                e.preventDefault();
                const flowId = flowLink.getAttribute('flow-id');
                window.history.pushState({}, '', `/flows/${flowId}`);
                routeHandler(navContentDiv, contentDiv);
            });

            // Estimate auto‑save on change
            const estSelect = document.getElementById('moment-estimate-select');
            if (estSelect) {
                estSelect.addEventListener('change', async () => {
                    const estimate = estSelect.value === '-' ? null : estSelect.value;
                    try {
                        await updateMomentEstimate(momentId, estimate);
                        moment.effortEstimate = estimate;
                        patchDetailStackGraphNode(`moment-${momentId}`, {
                            effortEstimate: estimate,
                        });
                    } catch (err) {
                        alert('Failed to update estimate');
                        console.error(err);
                    }
                });
            }

            // Populate strides select
            const strideSelect = document.getElementById('moment-stride-select');
            if (strideSelect) {
                try {
                    const strides = await getAllStrides();
                    // sort by name
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
                            const updated = await moveMomentToStride(momentId, val);
                            moment.assignedStrideId = updated.assignedStrideId;
                            patchDetailStackGraphNode(`moment-${momentId}`, {
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

            // Status change handler
            const statusSelect = document.getElementById('moment-status-select');
            const completedCell = detailDiv.querySelector('tr:nth-last-child(1) td');
            if (statusSelect) {
                statusSelect.addEventListener('change', async () => {
                    const prev = statusSelect.value;
                    try {
                        const updated = await updateMomentStatus(momentId, statusSelect.value);
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

            // Type change handler
            const typeSelect = document.getElementById('moment-type-select');
            if (typeSelect) {
                typeSelect.addEventListener('change', async () => {
                    const newType = typeSelect.value;
                    try {
                        const updated = await updateMomentType(momentId, newType);
                        if (updated && updated.type) {
                            moment.type = updated.type;
                            typeSelect.value = updated.type;
                            patchDetailStackGraphNode(`moment-${momentId}`, {
                                type: updated.type,
                            });
                        }
                    } catch (err) {
                        alert('Failed to update type');
                        typeSelect.value = moment.type;
                    }
                });
            }

            // Back button event
            const backLink = document.getElementById('back-link');
            if (backLink) {
                backLink.addEventListener('click', () => {
                    window.history.back();
                });
            }

            // Comments
            const commentsContainer = document.getElementById('moment-comments');
            loadComments(commentsContainer, 'Moment', momentId);

            getFlowById(moment.flowId)
                .then(flow => getJourneyById(flow.journeyId))
                .then(journey => getEpicById(journey.epicId))
                .then(epic => resolveProjectIdForPromise(epic.productPromiseId, getGraphProjectIdHintFromUrl()))
                .then(projectId => {
                    const href = buildGraphViewHref(projectId, `moment-${moment.id}`);
                    upsertGraphViewButton(detailDiv, href);
                })
                .catch(error => {
                    console.error('Unable to resolve graph link for moment detail', error);
                });
        })
        .catch(err => {
            loadingEl.textContent = '';
            errorEl.textContent = 'Failed to load moment details.';
            console.error(err);
        });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function getStatusIcon(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();
    if (normalized.includes('green')) return '🟢';
    if (normalized.includes('black') || normalized.includes('blocked')) return '⚫️';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '🟠';
    if (normalized.includes('red') || normalized.includes('todo')) return '🔴';
    return '⚪';
}

function getStatusOption(value, selectedValue) {
    const icon = getStatusIconForStatus(value);
    const selected = value === selectedValue ? 'selected' : '';
    return `<option value="${value}" ${selected}>${icon} ${value}</option>`;
}

function getStatusIconForStatus(status) {
    switch (String(status ?? '')) {
        case 'Todo': return '🔴';
        case 'InProgress': return '🟠';
        case 'Blocked': return '⚫️';
        case 'Done': return '🟢';
        default: return '⚪';
    }
}

function renderMomentTasks(container, momentId, tasks, moment) {
    if (!container) return;

    const taskList = Array.isArray(tasks) ? tasks : [];

    const tbody = renderTableWithInlineAddRow(container, {
        headers: ['Name', 'Description', 'Completion Status'],
        items: taskList,
        emptyMessage: 'No moment tasks found.',
        renderItemRow: task => `
            <tr data-moment-task-id="${task.id}">
                <td>${escapeHtml(task.name || '')}</td>
                <td>${escapeHtml(task.description)}</td>
                <td>
                    <label class="moment-task-completion">
                        <input type="checkbox" class="moment-task-complete-checkbox" data-moment-task-id="${task.id}" ${task.isCompleted ? 'checked' : ''} />
                        <span>${task.isCompleted ? 'Completed' : 'Open'}</span>
                    </label>
                </td>
            </tr>
        `,
        renderAddRow: () => `
            <tr data-inline-add-row="1">
                <td>
                    <input id="add-moment-task-name" class="inline-add-input" type="text" maxlength="200" required placeholder="New task name...">
                </td>
                <td>
                    <input id="add-moment-task-description" class="inline-add-input" type="text" maxlength="500" placeholder="Task description...">
                </td>
                <td>
                    <div class="inline-add-actions">
                        <label class="moment-task-completion">
                            <input id="add-moment-task-completed" type="checkbox" />
                            <span>Completed</span>
                        </label>
                        <button id="add-moment-task-submit" type="button" class="view-btn">Add</button>
                        <span id="add-moment-task-msg"></span>
                    </div>
                </td>
            </tr>
        `,
    });

    const addTaskName = container.querySelector('#add-moment-task-name');
    const addTaskDescription = container.querySelector('#add-moment-task-description');
    const addTaskCompleted = container.querySelector('#add-moment-task-completed');
    const addTaskButton = container.querySelector('#add-moment-task-submit');
    const addTaskMessage = container.querySelector('#add-moment-task-msg');

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
                const created = await addMomentTask(momentId, {
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
                        <td>${escapeHtml(created.description || '')}</td>
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
                    bindMomentTaskCompletionToggle(tbody, momentId, moment);
                }
            } catch (err) {
                addTaskMessage.textContent = 'Failed to add task.';
                console.error(err);
            } finally {
                addTaskButton.disabled = false;
            }
        });
    }

    bindMomentTaskCompletionToggle(tbody, momentId, moment);
}

function syncMomentTasksToStackGraph(momentId, moment) {
    patchDetailStackGraphNode(`moment-${momentId}`, {
        tasks: Array.isArray(moment?.tasks) ? [...moment.tasks] : [],
    });
}

function bindMomentTaskCompletionToggle(tbody, momentId, moment) {
    if (!tbody) return;

    tbody.querySelectorAll('.moment-task-complete-checkbox').forEach(checkbox => {
        if (checkbox.dataset.bound === '1') return;
        checkbox.dataset.bound = '1';

        checkbox.addEventListener('change', async () => {
            const taskId = Number.parseInt(String(checkbox.dataset.momentTaskId ?? ''), 10);
            const row = checkbox.closest('tr');
            const label = row?.querySelector('.moment-task-completion span');
            const prevChecked = !checkbox.checked;
            checkbox.disabled = true;

            try {
                const updated = await updateMomentTaskCompletion(momentId, taskId, checkbox.checked);
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
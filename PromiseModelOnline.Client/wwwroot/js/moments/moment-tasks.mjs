import {
    insertRowBeforeAddRow, 
    removeInlineEmptyRow, 
    renderTableWithInlineAddRow
} from '../utils/inline-table.mjs';

import { escapeHtml } from '../utils/html.mjs';

import { 
    addMomentTask, 
    updateMomentTaskCompletion 
} from './api.mjs';

import { patchDetailStackGraphNode } from '../projects/detail-stack-graph.mjs';


export function renderMomentTasks(container, momentId, tasks, moment) {
    if (!container) return;

    const taskList = Array.isArray(tasks) ? tasks : [];

    const tbody = renderTableWithInlineAddRow(container, {
        headers: ['Name', 'Description', 'Completion Status'],
        items: taskList,
        emptyMessage: 'No moment tasks found.',
        renderItemRow: task => `
            <tr data-moment-task-id="${task.id}">
                <td>${escapeHtml(task.name || '')}</td>
                <td>${escapeHtml(task.description || '')}</td>
                <td>
                    <label class="moment-task-completion">
                        <input type="checkbox"
                               class="moment-task-complete-checkbox form-check-input"
                               data-moment-task-id="${task.id}"
                               ${task.isCompleted ? 'checked' : ''}/>
                        <span>${task.isCompleted ? 'Completed' : 'Open'}</span>
                    </label>
                </td>
            </tr>
        `,
        renderAddRow: () => `
            <tr data-inline-add-row="1">
                <td>
                    <input id="add-moment-task-name" class="form-control form-control-sm"
                           type="text" maxlength="200" placeholder="New task name...">
                </td>
                <td>
                    <input id="add-moment-task-description" class="form-control form-control-sm"
                           type="text" maxlength="500" placeholder="Task description...">
                </td>
                <td>
                    <div class="inline-add-actions">
                        <label class="moment-task-completion">
                            <input id="add-moment-task-completed" type="checkbox"/>
                            <span>Completed</span>
                        </label>
                        <button id="add-moment-task-submit"
                                class="btn btn-sm btn-outline-primary"
                                type="button">
                            Add
                        </button>
                        <span id="add-moment-task-msg"></span>
                    </div>
                </td>
            </tr>
        `,
    });

    const addBtn = container.querySelector('#add-moment-task-submit');
    const nameInput = container.querySelector('#add-moment-task-name');
    const descInput = container.querySelector('#add-moment-task-description');
    const completedInput = container.querySelector('#add-moment-task-completed');
    const msg = container.querySelector('#add-moment-task-msg');

    if (addBtn && nameInput && descInput && completedInput && msg) {
        addBtn.addEventListener('click', async () => {
            msg.textContent = '';

            const name = nameInput.value.trim();
            if (!name) {
                msg.textContent = 'Name is required.';
                return;
            }

            addBtn.disabled = true;

            try {
                const created = await addMomentTask(momentId, {
                    name,
                    description: descInput.value.trim(),
                    isCompleted: completedInput.checked,
                });

                if (created) {
                    removeInlineEmptyRow(tbody);

                    const row = document.createElement('tr');
                    row.dataset.momentTaskId = created.id;

                    row.innerHTML = `
                        <td>${escapeHtml(created.name)}</td>
                        <td>${escapeHtml(created.description || '')}</td>
                        <td>
                            <label class="moment-task-completion">
                                <input type="checkbox"
                                       class="moment-task-complete-checkbox form-check-input"
                                       data-moment-task-id="${created.id}"
                                       ${created.isCompleted ? 'checked' : ''}/>
                                <span>${created.isCompleted ? 'Completed' : 'Open'}</span>
                            </label>
                        </td>
                    `;

                    insertRowBeforeAddRow(tbody, row);

                    nameInput.value = '';
                    descInput.value = '';
                    completedInput.checked = false;

                    moment.tasks = [...(moment.tasks || []), created];

                    syncMomentTasksToStackGraph(momentId, moment);
                    bindMomentTaskCompletionToggle(tbody, momentId, moment);
                }

            } catch (err) {
                msg.textContent = 'Failed to add task.';
                console.error(err);
            } finally {
                addBtn.disabled = false;
            }
        });
    }

    bindMomentTaskCompletionToggle(tbody, momentId, moment);
}


function syncMomentTasksToStackGraph(momentId, moment) {
    patchDetailStackGraphNode(`moment-${momentId}`, {
        tasks: [...(moment.tasks || [])]
    });
}


function bindMomentTaskCompletionToggle(tbody, momentId, moment) {
    if (!tbody) return;

    tbody.querySelectorAll('.moment-task-complete-checkbox').forEach(cb => {
        if (cb.dataset.bound) return;
        cb.dataset.bound = '1';

        cb.addEventListener('change', async () => {
            const taskId = parseInt(cb.dataset.momentTaskId, 10);
            const prev = !cb.checked;

            const label = cb.closest('label')?.querySelector('span');

            cb.disabled = true;

            try {
                const updated = await updateMomentTaskCompletion(momentId, taskId, cb.checked);

                if (updated) {
                    cb.checked = updated.isCompleted;

                    if (label) {
                        label.textContent = updated.isCompleted ? 'Completed' : 'Open';
                    }

                    const task = moment.tasks?.find(t => t.id === taskId);
                    if (task) {
                        task.isCompleted = updated.isCompleted;
                        syncMomentTasksToStackGraph(momentId, moment);
                    }
                }

            } catch {
                cb.checked = prev;
                if (label) {
                    label.textContent = prev ? 'Completed' : 'Open';
                }
            } finally {
                cb.disabled = false;
            }
        });
    });
}
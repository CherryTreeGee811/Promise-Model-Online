import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import {
    destroyDetailStackGraph,
    mountDetailStackGraph,
    patchDetailStackGraphNode,
    refreshDetailStackGraph,
} from '../projects/detail-stack-graph.ts';
import { buildGraphViewHref, getOwnerProjectFromPath, upsertGraphViewButton } from '../projects/graph-link.ts';
import { navigate } from '../router.ts';
import { getStrides } from '../strides/api.ts';
import { showToast } from '../ui/toast.ts';
import { initBackLink, loadCommentsAndReactions, buildInlineEditUI, createDateRow } from '../utils/detail-common.ts';
import { formatCommentText, loadEntityLookupMap } from '../utils/entity-reference.ts';
import { escapeHtml, htmlToNodes } from '../utils/html.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';
import { insertRowBeforeAddRow, removeInlineEmptyRow, renderTableWithInlineAddRow } from '../utils/inline-table.ts';
import { isAtLeast } from '../utils/permissions.ts';

import { getMoment, createTask, updateTaskCompletion, updateMomentDescription, updateMomentEstimate, updateMomentStatus, assignMomentToStride, updateMomentType } from './api.ts';

interface MomentTask {
    id: number;
    name: string;
    description: string;
    isCompleted: boolean;
}

interface Moment {
    id: number;
    flowId: number;
    sequenceNumber: number;
    statement: string;
    description?: string;
    type: string;
    status: string;
    statusColor?: string;
    effortEstimate?: string;
    assignedStrideId?: number;
    createdAt: string;
    completedAt?: string;
    tasks?: MomentTask[];
}

/**
 * @param {Moment} moment - The moment data object
 * @param {HTMLElement} detailCard - The detail card element
 * @param {HTMLElement} detailDiv - The detail container element
 * @param {HTMLElement} _navContentDiv - Navigation content container
 * @param {HTMLElement} _contentDiv - Main content container
 * @param {string} _owner - The project owner
 * @param {string} _project - The project slug
 */
function buildMomentUI(moment: Record<string, unknown>, detailCard: HTMLElement, detailDiv: HTMLElement, _navContentDiv: HTMLElement, _contentDiv: HTMLElement, _owner: string, _project: string): void {
        const heading = document.createElement('h2');
        heading.textContent = moment.statement as string;
        detailCard.append(heading);

        const table = document.createElement('table');
        table.className = 'table table-sm table-striped align-middle detail-table';

        // Description row
        const descRow = document.createElement('tr');
        const descTh = document.createElement('th');
        descTh.scope = 'row';
        const descLabel = document.createElement('label');
        descLabel.htmlFor = 'moment-description-input';
        descLabel.textContent = 'Description';
        descTh.append(descLabel);
        descRow.append(descTh);
        const descTd = document.createElement('td');
        buildInlineEditUI(descTd, 'moment-', (moment.description as string) || '');
        descRow.append(descTd);
        table.append(descRow);

        // Type row
        const typeRow = document.createElement('tr');
        const typeTh = document.createElement('th');
        typeTh.scope = 'row';
        const typeLabel = document.createElement('label');
        typeLabel.htmlFor = 'moment-type-select';
        typeLabel.textContent = 'Type';
        typeTh.append(typeLabel);
        typeRow.append(typeTh);
        const typeTd = document.createElement('td');
        const typeSelect = document.createElement('select');
        typeSelect.id = 'moment-type-select';
        typeSelect.className = 'form-select form-select-sm';
        const typeStoryOpt = document.createElement('option');
        typeStoryOpt.value = 'Story';
        typeStoryOpt.textContent = 'Story';
        if (moment.type === 'Story') typeStoryOpt.selected = true;
        typeSelect.append(typeStoryOpt);
        const typeJobOpt = document.createElement('option');
        typeJobOpt.value = 'Job';
        typeJobOpt.textContent = 'Job';
        if (moment.type === 'Job') typeJobOpt.selected = true;
        typeSelect.append(typeJobOpt);
        typeTd.append(typeSelect);
        typeRow.append(typeTd);
        table.append(typeRow);

        // Status row
        const statusRow = document.createElement('tr');
        const statusTh = document.createElement('th');
        statusTh.scope = 'row';
        const statusLabel = document.createElement('label');
        statusLabel.htmlFor = 'moment-status-select';
        statusLabel.textContent = 'Status';
        statusTh.append(statusLabel);
        statusRow.append(statusTh);
        const statusTd = document.createElement('td');
        const statusSelect = document.createElement('select');
        statusSelect.id = 'moment-status-select';
        statusSelect.className = 'form-select form-select-sm';
        for (const value of ['Todo', 'InProgress', 'Blocked', 'Done']) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = value;
            if (value === moment.status) opt.selected = true;
            statusSelect.append(opt);
        }
        statusTd.append(statusSelect);
        statusRow.append(statusTd);
        table.append(statusRow);

        // Effort Estimate row
        const estRow = document.createElement('tr');
        const estTh = document.createElement('th');
        estTh.scope = 'row';
        const estLabel = document.createElement('label');
        estLabel.htmlFor = 'moment-estimate-select';
        estLabel.textContent = 'Effort Estimate';
        estTh.append(estLabel);
        estRow.append(estTh);
        const estTd = document.createElement('td');
        const estSelect = document.createElement('select');
        estSelect.id = 'moment-estimate-select';
        estSelect.className = 'form-select form-select-sm';
        const estOptions = ['-', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        for (const value of estOptions) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = value;
            const isSelected = value === '-' ? !moment.effortEstimate : moment.effortEstimate === value;
            if (isSelected) opt.selected = true;
            estSelect.append(opt);
        }
        estTd.append(estSelect);
        estRow.append(estTd);
        table.append(estRow);

        // Assigned Stride row
        const strideRow = document.createElement('tr');
        const strideTh = document.createElement('th');
        strideTh.scope = 'row';
        const strideLabel = document.createElement('label');
        strideLabel.htmlFor = 'moment-stride-select';
        strideLabel.textContent = 'Assigned Stride';
        strideTh.append(strideLabel);
        strideRow.append(strideTh);
        const strideTd = document.createElement('td');
        const strideSelect = document.createElement('select');
        strideSelect.id = 'moment-stride-select';
        strideSelect.className = 'form-select form-select-sm';
        const backlogOpt = document.createElement('option');
        backlogOpt.value = '';
        backlogOpt.textContent = 'Backlog';
        strideSelect.append(backlogOpt);
        strideTd.append(strideSelect);
        strideRow.append(strideTd);
        table.append(strideRow);

        // Created row
        table.append(createDateRow('Created', moment.createdAt as string | undefined));

        table.append(createDateRow('Completed', moment.completedAt as string | undefined));

        detailCard.append(table);

        const tasksHeading = document.createElement('h3');
        tasksHeading.textContent = 'Moment Tasks';
        detailCard.append(tasksHeading);

        const tasksContainer = document.createElement('div');
        tasksContainer.id = 'moment-tasks';
        detailCard.append(tasksContainer);

        const commentsContainer = document.createElement('div');
        commentsContainer.id = 'moment-comments';
        detailCard.append(commentsContainer);

        const backButton = document.createElement('button');
        backButton.id = 'back-link';
        backButton.className = 'btn btn-outline-secondary btn-sm';
        backButton.type = 'button';
        const backSpan = document.createElement('span');
        backSpan.setAttribute('aria-hidden', 'true');
        backSpan.textContent = '\u{2190}';
        backButton.append(backSpan, ' Back');
        detailCard.append(backButton);

        detailDiv.append(detailCard);}


/**
 * @param {Record<string, unknown>} permission - Permission object
 */
function gateMomentDetailControls(permission: Record<string, unknown>): void {
    const canEdit = isAtLeast(permission?.permission as string, 'Edit');
    if (!canEdit) {
        const editButton = document.querySelector('#edit-moment-desc-btn') as HTMLButtonElement | null;
        const saveButton = document.querySelector('#moment-description-save') as HTMLButtonElement | null;
        const descInput = document.querySelector('#moment-description-input') as HTMLInputElement | null;
        if (editButton) { editButton.disabled = true; editButton.title = 'Requires Edit permission.'; }
        if (saveButton) { saveButton.disabled = true; saveButton.title = 'Requires Edit permission.'; }
        if (descInput) descInput.disabled = true;
        const typeSelect = document.querySelector('#moment-type-select') as HTMLSelectElement | null;
        const statusSelect = document.querySelector('#moment-status-select') as HTMLSelectElement | null;
        const estSelect = document.querySelector('#moment-estimate-select') as HTMLSelectElement | null;
        const strideSelect = document.querySelector('#moment-stride-select') as HTMLSelectElement | null;
        if (typeSelect) { typeSelect.disabled = true; typeSelect.title = 'Requires Edit permission.'; }
        if (statusSelect) { statusSelect.disabled = true; statusSelect.title = 'Requires Edit permission.'; }
        if (estSelect) { estSelect.disabled = true; estSelect.title = 'Requires Edit permission.'; }
        if (strideSelect) { strideSelect.disabled = true; strideSelect.title = 'Requires Edit permission.'; }
    }
}


/**
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {Moment} moment - The moment data object
 * @returns {Promise<void>}
 */
async function setupEstimateHandler(owner: string, project: string, momentId: string, moment: Record<string, unknown>): Promise<void> {
    const estSelectElement = document.querySelector('#moment-estimate-select') as HTMLSelectElement;
    if (estSelectElement) {
        estSelectElement.addEventListener('change', async () => {
            const estimate = estSelectElement.value === '-' ? undefined : estSelectElement.value;
            try {
                await updateMomentEstimate(owner, project, momentId, estimate, (moment as Record<string, unknown>).flowId as number);
                moment.effortEstimate = estimate;
                patchDetailStackGraphNode('moment-' + moment.sequenceNumber, { effortEstimate: estimate });
            } catch (error) { showToast('Failed to update estimate', 'error'); console.error(error); }
        });
    }
}


/**
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {Moment} moment - The moment data object
 * @returns {Promise<void>}
 */
async function setupStrideHandler(owner: string, project: string, momentId: string, moment: Record<string, unknown>): Promise<void> {
    const strideSelectElement = document.querySelector('#moment-stride-select') as HTMLSelectElement;
    if (strideSelectElement) {
        try {
            const strides = await getStrides(owner, project) as Record<string, unknown>[];
            strides.sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
            for (const stride of strides) {
                const opt = document.createElement('option');
                opt.value = String(stride.id);
                opt.textContent = (stride.name as string) || 'Stride ' + stride.id;
                if (String(stride.id) === String(moment.assignedStrideId)) opt.selected = true;
                strideSelectElement.append(opt);
            }
            applyStrideDefault(moment, strideSelectElement);
            strideSelectElement.addEventListener('change', async () => {
                const value = strideSelectElement.value === '' ? undefined : Number(strideSelectElement.value);
                try {
                    const updated = await assignMomentToStride(owner, project, momentId, value, (moment as Record<string, unknown>).flowId as number) as Record<string, unknown>;
                    assignStrideResult(updated);
                } catch (error) { showToast('Failed to update assigned stride', 'error'); console.error(error); }
            });

            /**
             * Sets the stride select element to empty if no stride is assigned to the moment.
             * @param {Record<string, unknown>} moment - The moment data object.
             * @param {HTMLSelectElement} select - The stride select element.
             */
            function applyStrideDefault(moment: Record<string, unknown>, select: HTMLSelectElement): void {
                if (!moment.assignedStrideId) select.value = '';
            }
            /**
             * Applies the result of a stride assignment API call to the moment state and DOM.
             * @param {Record<string, unknown>} updated - The updated moment data from the API response.
             */
            function assignStrideResult(updated: Record<string, unknown>): void {
                moment.assignedStrideId = updated.assignedStrideId as number;
                patchDetailStackGraphNode('moment-' + moment.sequenceNumber, { assignedStrideId: updated.assignedStrideId });
                strideSelectElement.value = updated.assignedStrideId ? String(updated.assignedStrideId) : '';
            }
        } catch (error) { console.error('Failed to load strides', error); }
    }
}

/**
 * @param {Element} saveButton - The save button element
 * @param {HTMLTextAreaElement} input - The description input element
 * @param {HTMLElement} messageElement - The message display element
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {Moment} moment - The moment data object
 * @param {ReturnType<typeof setupInlineEdit>} [editor] - The inline editor instance
 */
function setupMomentEditDescriptionHandler(
    saveButton: Element,
    input: HTMLTextAreaElement,
    messageElement: HTMLElement,
    owner: string,
    project: string,
    momentId: string,
    moment: Moment,
    editor?: ReturnType<typeof setupInlineEdit>,
): void {
    saveButton.addEventListener('click', async () => {
        messageElement.textContent = '';
        (saveButton as HTMLButtonElement).disabled = true;

        const newDescription = input.value;
        try {
            const updated = await updateMomentDescription(owner, project, momentId, newDescription, moment.flowId) as Record<string, unknown>;
            moment.description = (updated?.description as string) ?? (newDescription.trim() ? newDescription : undefined);
            patchDetailStackGraphNode(`moment-${moment.sequenceNumber}`, {
                description: moment.description,
            });
            if (editor) editor.showSavedPopover(formatCommentText(moment.description || ''));
        } catch (error) {
            messageElement.textContent = 'Save failed';
            console.error(error);
        } finally {
            (saveButton as HTMLButtonElement).disabled = false;
        }
    });
}

/**
 * @param {HTMLSelectElement} select - The status select element
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {Moment} moment - The moment data object
 * @param {HTMLElement | null} completedCell - The completed date cell
 */
function setupMomentStatusChangeHandler(
    select: HTMLSelectElement,
    owner: string,
    project: string,
    momentId: string,
    moment: Moment,
    completedCell: HTMLElement | null,
): void {
    select.addEventListener('change', async () => {
        const previous = select.value;
        const writeTo = select;
        try {
            const updated = await updateMomentStatus(owner, project, momentId, select.value, moment.flowId) as Record<string, unknown>;
            moment.status = updated.status as string;
            moment.statusColor = updated.statusColor as string;
            moment.completedAt = updated.completedAt as string;
            writeTo.value = updated.status as string;
            await refreshDetailStackGraph();
            if (updated.completedAt) {
                const d = new Date(updated.completedAt as string);
                if (completedCell) completedCell.textContent = d.toLocaleDateString('en-CA');
            } else {
                if (completedCell) completedCell.textContent = '\u{2013}';
            }
        } catch {
            writeTo.value = previous;
            showToast('Failed to update status', 'error');
        }
    });
}

/**
 * @param {HTMLSelectElement} select - The type select element
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {Moment} moment - The moment data object
 */
function setupMomentTypeChangeHandler(
    select: HTMLSelectElement,
    owner: string,
    project: string,
    momentId: string,
    moment: Moment,
): void {
    select.addEventListener('change', async () => {
        const newType = select.value;
        const writeTo = select;
        try {
            const updated = await updateMomentType(owner, project, momentId, newType, moment.flowId) as Record<string, unknown>;
            if (updated && updated.type) {
                moment.type = updated.type as string;
                writeTo.value = updated.type as string;
                patchDetailStackGraphNode(`moment-${moment.sequenceNumber}`, {
                    type: updated.type,
                });
            }
        } catch {
            writeTo.value = moment.type;
            showToast('Failed to update type', 'error');
        }
    });
}

/**
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {HTMLElement} navContentDiv - Navigation container
 * @param {HTMLElement} contentDiv - Content container
 * @param {Record<string, unknown>} permission - Permission object
 * @returns {Promise<void>}
 */
/**
 * Bind a click delegation handler to a detail container for flow navigation links.
 * @param {HTMLElement} detailDiv - The detail container element
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {HTMLElement} navContentDiv - Navigation container
 * @param {HTMLElement} contentDiv - Content container
 */
function bindFlowNavigationHandler(detailDiv: HTMLElement, owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    detailDiv.addEventListener('click', (event: MouseEvent) => {
        const flowLink = (event.target as HTMLElement).closest('a.detail-link');
        if (!flowLink) return;

        if (event.ctrlKey || event.metaKey || event.button === 1) return;

        event.preventDefault();
        void navigate(`/${owner}/${project}/flows/${flowLink.getAttribute('flow-seq')}`, navContentDiv, contentDiv);
    });
}

/**
 * Upsert the graph view button for a moment detail page.
 * @param {HTMLElement} detailDiv - The detail container element
 * @param {string} sequenceNumber - The moment sequence number
 */
function upsertMomentGraphViewButton(detailDiv: HTMLElement, sequenceNumber: number): void {
    const { owner: go, project: gp } = getOwnerProjectFromPath();
    if (!go || !gp) return;
    const href = buildGraphViewHref(go, gp, `moment-${sequenceNumber}`);
    if (href) upsertGraphViewButton(detailDiv, href);
}

/**
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {HTMLElement} navContentDiv - Navigation container
 * @param {HTMLElement} contentDiv - Content container
 * @param {Record<string, unknown>} permission - Permission object
 * @returns {Promise<void>}
 */
export async function loadMomentDetail(owner: string, project: string, momentId: string, navContentDiv: HTMLElement, contentDiv: HTMLElement, permission: Record<string, unknown>): Promise<void> {
    const detailDiv = document.querySelector('#moment-detail-content') as HTMLElement | null;
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const loadingElement = document.querySelector('#moment-detail-loading') as HTMLElement | null;

    destroyDetailStackGraph();
    if (!detailDiv || !errorElement) return;
    if (loadingElement) loadingElement.hidden = false;
    errorElement.textContent = '';

    try {
        const moment = await getMoment(owner, project, momentId) as Moment;
        if (!moment) return;
        await loadEntityLookupMap('Moment', moment.id, owner, project);
        if (loadingElement) loadingElement.hidden = true;

        void mountDetailStackGraph({
            nodeType: 'moment',
            nodeId: momentId,
            owner,
            project,
        });

        const detailCard = document.createElement('div');
        detailCard.className = 'detail-card moment-detail-card';

        buildMomentUI(moment as unknown as Record<string, unknown>, detailCard, detailDiv, navContentDiv, contentDiv, owner, project);


        const momentDescInput = document.querySelector('#moment-description-input') as HTMLTextAreaElement;
        const momentDescView = document.querySelector('#moment-description-view') as HTMLElement;
        const momentEditButton = document.querySelector('#edit-moment-desc-btn') as HTMLElement;
        const descriptionSaveButton = document.querySelector('#moment-description-save') as HTMLElement;
        const momentDescriptionCancelButton = document.querySelector('#moment-description-cancel') as HTMLElement;
        let momentEditor: ReturnType<typeof setupInlineEdit> | undefined;
        if (momentDescInput && momentDescView && momentEditButton) {
            createCommentAutocomplete(momentDescInput, 'Moment', moment.id);
            momentEditor = setupInlineEdit(momentDescInput, momentDescView, momentEditButton, descriptionSaveButton, momentDescriptionCancelButton);
        }

        gateMomentDetailControls(permission);

        renderMomentTasks(document.querySelector('#moment-tasks') as HTMLElement, momentId, moment.tasks ?? [], moment, permission, owner, project);

        const descriptionInput = document.querySelector('#moment-description-input') as HTMLTextAreaElement;
        const descriptionMessage = document.querySelector('#moment-description-msg') as HTMLElement;
        if (descriptionSaveButton && descriptionInput && descriptionMessage) {
            setupMomentEditDescriptionHandler(descriptionSaveButton, descriptionInput, descriptionMessage, owner, project, momentId, moment, momentEditor);
        }

        bindFlowNavigationHandler(detailDiv, owner, project, navContentDiv, contentDiv);

        void setupEstimateHandler(owner, project, momentId, moment as unknown as Record<string, unknown>);

        await setupStrideHandler(owner, project, momentId, moment as unknown as Record<string, unknown>);

        const statusSelectElement = document.querySelector('#moment-status-select') as HTMLSelectElement;
        const completedCell = detailDiv?.querySelector(':scope tr:nth-last-child(1) td') as HTMLElement | null;
        if (statusSelectElement) {
            setupMomentStatusChangeHandler(statusSelectElement, owner, project, momentId, moment, completedCell);
        }

        const typeSelectElement = document.querySelector('#moment-type-select') as HTMLSelectElement;
        if (typeSelectElement) {
            setupMomentTypeChangeHandler(typeSelectElement, owner, project, momentId, moment);
        }

        initBackLink();
        loadCommentsAndReactions(detailDiv, 'Moment', moment.id, owner, project, permission);

        upsertMomentGraphViewButton(detailDiv, moment.sequenceNumber);
    } catch (error) {
        if (loadingElement) loadingElement.hidden = true;
        if (errorElement) errorElement.textContent = 'Failed to load moment details.';
        console.error(error);
    }
}

/**
 * @param {HTMLElement} container - The container element
 * @param {string} momentId - The moment ID
 * @param {MomentTask[]} tasks - The task list
 * @param {Moment} moment - The moment object
 * @param {Record<string, unknown>} permission - Permission object
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 */
function renderMomentTasks(container: HTMLElement, momentId: string, tasks: MomentTask[], moment: Moment, permission: Record<string, unknown>, owner: string, project: string): void {
    if (!container) return;

    const taskList = Array.isArray(tasks) ? tasks : [];

    const tbody = renderTableWithInlineAddRow(container, {
        headers: ['Name', 'Description', 'Completion Status'],
        items: taskList,
        emptyMessage: 'No moment tasks found.',
        renderItemRow: (item: unknown) => {
            const task = item as MomentTask;
            return `
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
            `;
        },
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
    if (!tbody) return;

    const taskNameInput = container.querySelector('#add-moment-task-name') as HTMLInputElement;
    const taskDescriptionInput = container.querySelector('#add-moment-task-description') as HTMLInputElement;
    const taskCompletedInput = container.querySelector('#add-moment-task-completed') as HTMLInputElement;
    const taskSubmitButton = container.querySelector('#add-moment-task-submit') as HTMLButtonElement;
    const taskMessageElement = container.querySelector('#add-moment-task-msg') as HTMLElement;

    if (taskDescriptionInput) createCommentAutocomplete(taskDescriptionInput as unknown as HTMLTextAreaElement, 'Moment', moment.id);

    const canEdit = isAtLeast(permission?.permission as string, 'Edit');
    if (!canEdit) {
        if (taskNameInput) taskNameInput.disabled = true;
        if (taskDescriptionInput) taskDescriptionInput.disabled = true;
        if (taskCompletedInput) taskCompletedInput.disabled = true;
        if (taskSubmitButton) { taskSubmitButton.disabled = true; taskSubmitButton.title = 'Requires Edit permission.'; }
    }

    if (taskSubmitButton && taskNameInput && taskDescriptionInput && taskCompletedInput && taskMessageElement) {
        taskSubmitButton.addEventListener('click', async () => {
            taskMessageElement.textContent = '';

            const name = taskNameInput.value.trim();
            if (!name) {
                taskMessageElement.textContent = 'Name is required.';
                return;
            }

            taskSubmitButton.disabled = true;

            try {
                const created = await createTask(owner, project, momentId, {
                    name,
                    description: taskDescriptionInput.value.trim(),
                    isCompleted: taskCompletedInput.checked,
                }, moment.flowId) as MomentTask;

                if (created) {
                    removeInlineEmptyRow(tbody);
                    const row = document.createElement('tr');
                    row.dataset.momentTaskId = String(created.id);

                    const tdName = document.createElement('td');
                    tdName.textContent = created.name || '';
                    row.append(tdName);

                    const tdDesc = document.createElement('td');
                    tdDesc.append(...htmlToNodes(formatCommentText(created.description || '')));
                    row.append(tdDesc);

                    const tdCompletion = document.createElement('td');
                    const label = document.createElement('label');
                    label.className = 'moment-task-completion';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'moment-task-complete-checkbox';
                    checkbox.dataset.momentTaskId = String(created.id);
                    if (created.isCompleted) checkbox.checked = true;
                    label.append(checkbox);
                    const statusSpan = document.createElement('span');
                    statusSpan.textContent = created.isCompleted ? 'Completed' : 'Open';
                    label.append(statusSpan);
                    tdCompletion.append(label);
                    row.append(tdCompletion);

                    insertRowBeforeAddRow(tbody, row);
                    resetTaskForm();

                    /**
                     * Resets the new-task form inputs to their default state after a successful task creation.
                     */
                    function resetTaskForm(): void {
                        taskNameInput.value = '';
                        taskDescriptionInput.value = '';
                        taskCompletedInput.checked = false;
                    }
                    if (!Array.isArray(moment.tasks)) moment.tasks = [];
                    moment.tasks.push(created);
                    syncMomentTasksToStackGraph(momentId, moment);
                    bindMomentTaskCompletionToggle(tbody, momentId, moment, {}, owner, project);
                }
            } catch (error) {
                taskMessageElement.textContent = 'Failed to add task.';
                console.error(error);
            } finally {
                taskSubmitButton.disabled = false;
            }
        });
    }

    bindMomentTaskCompletionToggle(tbody, momentId, moment, permission, owner, project);
}

/**
 * @param {string} _momentId - The moment ID
 * @param {Moment} moment - The moment object
 */
function syncMomentTasksToStackGraph(_momentId: string, moment: Moment): void {
    patchDetailStackGraphNode(`moment-${moment.sequenceNumber}`, {
        tasks: Array.isArray(moment?.tasks) ? [...moment.tasks] : [],
    });
}

/**
 * @param {HTMLInputElement} checkbox - The checkbox element
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {Moment} moment - The moment object
 * @returns {Promise<void>}
 */
async function handleCheckToggle(checkbox: HTMLInputElement, owner: string, project: string, momentId: string, moment: Moment): Promise<void> {
    const taskId = Math.trunc(Number(checkbox.dataset.momentTaskId ?? ''));
    const label = checkbox.closest('tr')?.querySelector(':scope > .moment-task-completion span') as HTMLElement | null;
    const isPreviousChecked = !checkbox.checked;
    checkbox.disabled = true;
    try {
        const updated = await updateTaskCompletion(owner, project, momentId, taskId, checkbox.checked, moment.flowId) as Record<string, unknown>;
        applyCheckResult(checkbox, label, updated, isPreviousChecked, moment, momentId, taskId);
    } catch (error) {
        checkbox.checked = isPreviousChecked;
        if (label) label.textContent = isPreviousChecked ? 'Completed' : 'Open';
        showToast('Failed to update task completion', 'error');
        console.error(error);
    } finally { checkbox.disabled = false; }
}

/**
 * @param {HTMLInputElement} checkbox - The checkbox element
 * @param {HTMLElement | null} label - The status label element
 * @param {Record<string, unknown>} updated - The updated task data from API
 * @param {boolean} _isPreviousChecked - The previous checked state
 * @param {Moment} moment - The moment object
 * @param {string} momentId - The moment ID
 * @param {number} taskId - The task ID
 */
function applyCheckResult(checkbox: HTMLInputElement, label: HTMLElement | null, updated: Record<string, unknown>, _isPreviousChecked: boolean, moment: Moment, momentId: string, taskId: number): void {
    if (updated) {
        checkbox.checked = Boolean(updated.isCompleted);
        if (label) label.textContent = updated.isCompleted ? 'Completed' : 'Open';
        const task = (moment.tasks ?? []).find((item: MomentTask) => Number(item.id) === taskId);
        if (task) { task.isCompleted = Boolean(updated.isCompleted); syncMomentTasksToStackGraph(momentId, moment); }
    } else if (label) { label.textContent = checkbox.checked ? 'Completed' : 'Open'; }
}

/**
 * @param {HTMLInputElement} checkbox - The checkbox element
 * @param {boolean} canEdit - Whether the user has edit permission
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 * @param {string} momentId - The moment ID
 * @param {Moment} moment - The moment object
 */
function bindSingleCheckbox(checkbox: HTMLInputElement, canEdit: boolean, owner: string, project: string, momentId: string, moment: Moment): void {
    if (checkbox.dataset.bound === '1') return;
    checkbox.dataset.bound = '1';
    if (!canEdit) { checkbox.disabled = true; checkbox.title = 'Requires Edit permission.'; return; }
    checkbox.addEventListener('change', () => { void handleCheckToggle(checkbox, owner, project, momentId, moment); });
}

/**
 * @param {HTMLElement} tbody - The table body element
 * @param {string} momentId - The moment ID
 * @param {Moment} moment - The moment object
 * @param {Record<string, unknown>} permission - Permission object
 * @param {string} owner - The project owner
 * @param {string} project - The project slug
 */
function bindMomentTaskCompletionToggle(tbody: HTMLElement, momentId: string, moment: Moment, permission: Record<string, unknown>, owner: string, project: string): void {
    if (!tbody) return;
    const canEdit = isAtLeast(permission?.permission as string, 'Edit');
    for (const checkbox of tbody.querySelectorAll(':scope .moment-task-complete-checkbox') as NodeListOf<HTMLInputElement>) {
        bindSingleCheckbox(checkbox, canEdit, owner, project, momentId, moment);
    }
}

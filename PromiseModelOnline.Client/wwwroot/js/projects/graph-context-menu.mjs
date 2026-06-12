import tippy from 'https://cdn.jsdelivr.net/npm/tippy.js@6/+esm';

import { apiFetch } from '../api.mjs';
import { updateMomentStatus } from '../moments/api.mjs';
import { createCommentAutocomplete } from '../comments/autocomplete.mjs';
import { STATUS_OPTIONS } from '../utils/status-utils.mjs';

let _ctxOwner = null;
let _ctxProject = null;
let _ctxPermission = null;

const NODE_CHILD_LABELS = {
    root: 'Promise',
    promise: 'Epic',
    epic: 'Journey',
    journey: 'Flow',
    flow: 'Moment',
};

function getDeleteRoute(nodeType, nodeId) {
    const normalizedType = normalizeNodeType(nodeType);

    if (normalizedType === 'root') {
        return `/api/projects/${encodeURIComponent(_ctxOwner)}/${encodeURIComponent(_ctxProject)}`;
    }

    const numericId = Number.parseInt(nodeId, 10);
    if (Number.isNaN(numericId)) return null;

    switch (normalizedType) {
        case 'promise': return `/api/projects/${encodeURIComponent(_ctxOwner)}/${encodeURIComponent(_ctxProject)}/promises/${numericId}`;
        case 'epic': return `/api/projects/${encodeURIComponent(_ctxOwner)}/${encodeURIComponent(_ctxProject)}/epics/${numericId}`;
        case 'journey': return `/api/projects/${encodeURIComponent(_ctxOwner)}/${encodeURIComponent(_ctxProject)}/journeys/${numericId}`;
        case 'flow': return `/api/projects/${encodeURIComponent(_ctxOwner)}/${encodeURIComponent(_ctxProject)}/flows/${numericId}`;
        case 'moment': return `/api/projects/${encodeURIComponent(_ctxOwner)}/${encodeURIComponent(_ctxProject)}/moments/${numericId}`;
        default: return null;
    }
}

function normalizeNodeType(nodeType) {
    return String(nodeType ?? '').trim().toLowerCase();
}

function getNodeLabel(nodeData) {
    const payload = nodeData?.payload ?? {};
    return String(payload.statement ?? payload.name ?? `#${payload.id ?? ''}`).trim();
}

function getChildLabel(nodeType) {
    return NODE_CHILD_LABELS[normalizeNodeType(nodeType)] ?? null;
}



function getCreateActionMeta(nodeData) {
    const normalizedType = normalizeNodeType(nodeData.nodeType);

    const base = `/api/projects/${encodeURIComponent(_ctxOwner)}/${encodeURIComponent(_ctxProject)}`;
    switch (normalizedType) {
        case 'root':
            return { entityLabel: 'Promise', endpoint: `${base}/promises/create`, parentField: 'projectId' };
        case 'promise':
            return { entityLabel: 'Epic', endpoint: `${base}/epics/create`, parentField: 'productPromiseId' };
        case 'epic':
            return { entityLabel: 'Journey', endpoint: `${base}/journeys/create`, parentField: 'epicId' };
        case 'journey':
            return { entityLabel: 'Flow', endpoint: `${base}/flows/create`, parentField: 'journeyId' };
        case 'flow':
            return { entityLabel: 'Moment', endpoint: `${base}/moments/create`, parentField: 'flowId' };
        default:
            return null;
    }
}

function getCreateFormDefaults(nodeData) {
    const normalizedType = normalizeNodeType(nodeData.nodeType);
    const childCount = Number.parseInt(nodeData.childCount ?? 0, 10) || 0;
    const nextDisplayOrder = childCount + 1;

    switch (normalizedType) {
        case 'root':
            return {
                statement: 'New Promise',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        case 'promise':
            return {
                statement: 'New Epic',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        case 'epic':
            return {
                statement: 'New Journey',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        case 'journey':
            return {
                statement: 'New Flow',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        case 'flow':
            return {
                statement: 'New Moment',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        default:
            return null;
    }
}

async function requestJson(url, options) {
    const { headers: optionHeaders, ...fetchOptions } = options;
    const response = await apiFetch(url, {
        mode: 'cors',
        ...fetchOptions,
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
            ...(optionHeaders ?? {}),
        },
    });

    if (response.ok) {
        if (response.status === 204) {
            return null;
        }
        return response.json();
    }

    if (response.status === 401) {
        document.getElementById('login-link')?.click();
    }

    let message = `HTTP error! status: ${response.status}`;
    try {
        const body = await response.json();
        message = body?.message || body?.title || body?.detail || message;
    } catch {
        // Ignore body parsing errors and fall back to the status-based message.
    }

    throw new Error(message);
}

function ensureModal(modalId, modalMarkup) {
    let modalEl = document.getElementById(modalId);
    if (modalEl) return modalEl;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalMarkup.trim();
    modalEl = wrapper.firstElementChild;

    if (modalEl) {
        document.body.appendChild(modalEl);
    }

    return modalEl;
}

function openDeleteConfirmationModal(label) {
    const modalEl = ensureModal('graph-delete-confirmation-modal', `
        <div class="modal fade" id="graph-delete-confirmation-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="graph-delete-confirmation-modal-title">Delete item</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="graph-delete-confirmation-modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="graph-delete-confirmation-confirm">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    if (!modalEl) {
        return Promise.resolve(window.confirm(`Delete ${label}? This cannot be undone.`));
    }

    const titleEl = modalEl.querySelector('#graph-delete-confirmation-modal-title');
    const bodyEl = modalEl.querySelector('#graph-delete-confirmation-modal-body');
    const confirmButton = modalEl.querySelector('#graph-delete-confirmation-confirm');

    if (!titleEl || !bodyEl || !confirmButton) {
        return Promise.resolve(window.confirm(`Delete ${label}? This cannot be undone.`));
    }

    titleEl.textContent = `Delete ${label}`;
    bodyEl.textContent = `Delete ${label}? This cannot be undone.`;

    return new Promise(resolve => {
        let settled = false;

        const settle = value => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        const modalInstance = window.bootstrap?.Modal?.getOrCreateInstance(modalEl);

        confirmButton.addEventListener('click', () => {
            settle(true);
            modalInstance?.hide();
        }, { once: true });

        modalEl.addEventListener('hidden.bs.modal', () => settle(false), { once: true });
        modalInstance?.show();
    });
}

function createInputField({ name, label, type = 'text', value = '', placeholder = '', rows = 3 }) {
    const field = document.createElement('label');
    field.className = 'graph-context-menu-form__field';

    const fieldLabel = document.createElement('span');
    fieldLabel.className = 'graph-context-menu-form__label';
    fieldLabel.textContent = label;

    let input;
    if (type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = rows;
    } else {
        input = document.createElement('input');
        input.type = type;
    }

    input.name = name;
    input.className = 'graph-context-menu-form__control';
    input.value = value;
    input.placeholder = placeholder;

    field.append(fieldLabel, input);
    return { field, input };
}

function createSelectField({ name, label, value = '', options = [] }) {
    const field = document.createElement('label');
    field.className = 'graph-context-menu-form__field';

    const fieldLabel = document.createElement('span');
    fieldLabel.className = 'graph-context-menu-form__label';
    fieldLabel.textContent = label;

    const select = document.createElement('select');
    select.name = name;
    select.className = 'graph-context-menu-form__control';

    for (const option of options) {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        optionElement.selected = String(option.value) === String(value);
        select.appendChild(optionElement);
    }

    field.append(fieldLabel, select);
    return { field, select };
}

function getMomentTypeOptions() {
    return [
        { value: 'Story', label: 'Story' },
        { value: 'Job', label: 'Job' },
    ];
}

function getMomentStatusValue(nodeData) {
    const payload = nodeData?.payload ?? {};
    const status = String(payload.status ?? payload.Status ?? '').trim();
    if (status) {
        const match = STATUS_OPTIONS.find(option => option.value.toLowerCase() === status.toLowerCase());
        if (match) {
            return match.value;
        }
    }

    const statusColor = String(payload.statusColor ?? payload.StatusColor ?? '').trim().toLowerCase();
    if (statusColor.includes('green') || statusColor.includes('done')) return 'Done';
    if (statusColor.includes('black') || statusColor.includes('blocked')) return 'Blocked';
    if (statusColor.includes('orange') || statusColor.includes('yellow') || statusColor.includes('amber') || statusColor.includes('inprogress') || statusColor.includes('in-progress')) return 'InProgress';
    if (statusColor.includes('red') || statusColor.includes('todo')) return 'Todo';

    return 'Todo';
}

function getMomentEstimateOptions() {
    return [
        { value: '-', label: '-' },
        { value: 'XS', label: 'XS' },
        { value: 'S', label: 'S' },
        { value: 'M', label: 'M' },
        { value: 'L', label: 'L' },
        { value: 'XL', label: 'XL' },
        { value: 'XXL', label: 'XXL' },
        { value: 'XXXL', label: 'XXXL' },
    ];
}

function getStrideOptions(strides = []) {
    return [
        { value: '', label: 'Backlog' },
        ...strides.map(stride => ({
            value: String(stride.id),
            label: stride.name ? `Stride #${stride.id} - ${stride.name}` : `Stride #${stride.id}`,
        })),
    ];
}

function buildMomentFormElement(nodeData, owner, project, getAvailableStrides, onGraphMutated, closeMenus) {
    const createMeta = getCreateActionMeta(nodeData);
    const defaults = getCreateFormDefaults(nodeData);
    if (!createMeta || !defaults) {
        return null;
    }

    const form = document.createElement('form');
    form.className = 'graph-context-menu-form graph-context-menu-form--moment';

    const title = document.createElement('div');
    title.className = 'graph-context-menu-form__title';
    title.textContent = 'Create Moment';

    const subtitle = document.createElement('div');
    subtitle.className = 'graph-context-menu-form__subtitle';
    subtitle.textContent = 'Moments carry status, type, estimate, and stride assignment at creation time.';

    const statementField = createInputField({
        name: 'statement',
        label: 'Statement',
        value: defaults.statement,
        placeholder: 'New Moment',
    });

    const descriptionField = createInputField({
        name: 'description',
        label: 'Description',
        type: 'textarea',
        value: defaults.description,
        placeholder: 'Optional description',
        rows: 3,
    });

    const typeField = createSelectField({
        name: 'type',
        label: 'Type',
        value: 'Story',
        options: getMomentTypeOptions(),
    });

    const statusField = createSelectField({
        name: 'status',
        label: 'Status',
        value: 'Todo',
        options: STATUS_OPTIONS.map(o => ({ value: o.value, label: `${o.icon} ${o.label}` })),
    });

    const estimateField = createSelectField({
        name: 'effortEstimate',
        label: 'Effort Estimate',
        value: '',
        options: getMomentEstimateOptions(),
    });

    const strideField = createSelectField({
        name: 'assignedStrideId',
        label: 'Assigned Stride',
        value: '',
        options: getStrideOptions(getAvailableStrides?.() ?? []),
    });

    const actions = document.createElement('div');
    actions.className = 'graph-context-menu-form__actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'graph-context-menu-form__button graph-context-menu-form__button--secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', event => {
        event.preventDefault();
        closeMenus();
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'graph-context-menu-form__button graph-context-menu-form__button--primary';
    submitButton.textContent = 'Create Moment';

    actions.append(cancelButton, submitButton);

    form.append(
        title,
        subtitle,
        statementField.field,
        descriptionField.field,
        typeField.field,
        statusField.field,
        estimateField.field,
        strideField.field,
        actions
    );

    // Autocomplete for entity references in description
    createCommentAutocomplete(descriptionField.input, nodeData.nodeType, nodeData.payload?.id);

    form.addEventListener('submit', async event => {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Moment...';

        const statement = statementField.input.value.trim();
        const description = descriptionField.input.value.trim();

        if (!statement) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Moment';
            statementField.input.focus();
            return;
        }

        const payload = {
            statement,
            description: description || null,
            flowId: nodeData.payload?.id,
            type: typeField.select.value,
            status: statusField.select.value,
            effortEstimate: estimateField.select.value === '-' ? null : estimateField.select.value || null,
            assignedStrideId: strideField.select.value ? Number.parseInt(strideField.select.value, 10) : null,
            displayOrder: (Number.parseInt(nodeData.childCount ?? 0, 10) || 0) + 1,
        };

        try {
            await requestJson(createMeta.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            closeMenus();
            await onGraphMutated?.();
        } catch (error) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Moment';
            throw error;
        }
    });

    return form;
}

function buildMomentStatusFormElement(nodeData, onGraphMutated, closeMenus) {
    const momentSeq = nodeData?.payload?.sequenceNumber;
    if (momentSeq == null) {
        return null;
    }

    const form = document.createElement('form');
    form.className = 'graph-context-menu-form graph-context-menu-form--moment';

    const title = document.createElement('div');
    title.className = 'graph-context-menu-form__title';
    title.textContent = 'Change Moment Status';

    const subtitle = document.createElement('div');
    subtitle.className = 'graph-context-menu-form__subtitle';
    subtitle.textContent = 'Update the moment status without leaving the graph.';

    const statusField = createSelectField({
        name: 'status',
        label: 'Status',
        value: getMomentStatusValue(nodeData),
        options: STATUS_OPTIONS.map(o => ({ value: o.value, label: `${o.icon} ${o.label}` })),
    });

    const actions = document.createElement('div');
    actions.className = 'graph-context-menu-form__actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'graph-context-menu-form__button graph-context-menu-form__button--secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', event => {
        event.preventDefault();
        closeMenus();
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'graph-context-menu-form__button graph-context-menu-form__button--primary';
    submitButton.textContent = 'Save Status';

    actions.append(cancelButton, submitButton);
    form.append(title, subtitle, statusField.field, actions);

    form.addEventListener('submit', async event => {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Saving Status...';

        try {
            await updateMomentStatus(_ctxOwner, _ctxProject, momentSeq, statusField.select.value);
            closeMenus();
            await onGraphMutated?.();
        } catch (error) {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Status';
            throw error;
        }
    });

    return form;
}

function buildCreateFormElement(nodeData, owner, project, getAvailableStrides, onGraphMutated, closeMenus) {
    const createMeta = getCreateActionMeta(nodeData);
    const defaults = getCreateFormDefaults(nodeData);
    if (!createMeta || !defaults) {
        return null;
    }

    if (createMeta.entityLabel === 'Moment') {
        return buildMomentFormElement(nodeData, owner, project, getAvailableStrides, onGraphMutated, closeMenus);
    }

    const form = document.createElement('form');
    form.className = 'graph-context-menu-form';

    const title = document.createElement('div');
    title.className = 'graph-context-menu-form__title';
    title.textContent = `Create ${createMeta.entityLabel}`;

    const subtitle = document.createElement('div');
    subtitle.className = 'graph-context-menu-form__subtitle';
    subtitle.textContent = `Add a new ${createMeta.entityLabel.toLowerCase()} beneath this card.`;

    const statementField = createInputField({
        name: 'statement',
        label: 'Statement',
        value: defaults.statement,
        placeholder: `New ${createMeta.entityLabel}`,
    });

    const descriptionField = createInputField({
        name: 'description',
        label: 'Description',
        type: 'textarea',
        value: defaults.description,
        placeholder: 'Optional description',
        rows: 4,
    });

    const actions = document.createElement('div');
    actions.className = 'graph-context-menu-form__actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'graph-context-menu-form__button graph-context-menu-form__button--secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', event => {
        event.preventDefault();
        closeMenus();
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'graph-context-menu-form__button graph-context-menu-form__button--primary';
    submitButton.textContent = `Create ${createMeta.entityLabel}`;

    actions.append(cancelButton, submitButton);

    form.append(title, subtitle, statementField.field, descriptionField.field, actions);

    // Autocomplete for entity references in description
    createCommentAutocomplete(descriptionField.input, nodeData.nodeType, nodeData.payload?.id);

    form.addEventListener('submit', async event => {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = `Creating ${createMeta.entityLabel}...`;

        const statement = statementField.input.value.trim();
        const description = descriptionField.input.value.trim();

        if (!statement) {
            submitButton.disabled = false;
            submitButton.textContent = `Create ${createMeta.entityLabel}`;
            statementField.input.focus();
            return;
        }

        const nextDisplayOrder = (Number.parseInt(nodeData.childCount ?? 0, 10) || 0) + 1;
        const payload = {
            statement,
            description: description || null,
            displayOrder: nextDisplayOrder,
        };

        if (createMeta.parentField === 'projectId') {
            // projectId context is encoded in the endpoint URL; no separate body field needed
        } else {
            payload[createMeta.parentField] = nodeData.payload?.id;
        }

        try {
            await requestJson(createMeta.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            closeMenus();
            await onGraphMutated?.();
        } catch (error) {
            submitButton.disabled = false;
            submitButton.textContent = `Create ${createMeta.entityLabel}`;
            throw error;
        }
    });

    return form;
}

function buildMenuActions(
    nodeData,
    owner,
    project,
    onGraphMutated,
    onProjectDeleted,
    closeMenus,
    openCreateForm,
    openMomentStatusForm,
    isNodeChildrenHidden,
    setNodeChildrenHidden,
    revealNextLevel,
    permission,
) {
    const canEdit = permission?.permission === 'Edit';
    const actions = [];
    const childLabel = getChildLabel(nodeData.nodeType);
    const childCount = Number.parseInt(nodeData?.childCount ?? 0, 10) || 0;
    const hiddenDescendantCount = Number.parseInt(nodeData?._hiddenDescendantCount ?? 0, 10) || 0;
    const canToggleChildren = childCount > 0 || hiddenDescendantCount > 0;
    const childrenHidden = canToggleChildren && Boolean(isNodeChildrenHidden?.(nodeData));

    if (childLabel) {
        actions.push({
            id: 'create-child',
            label: `Create New ${childLabel}`,
            danger: false,
            disabled: !canEdit,
            disabledReason: 'Requires Edit permission.',
            handler: async () => {
                openCreateForm(nodeData, owner, project, onGraphMutated);
            },
        });
    }

    if (canToggleChildren) {
        actions.push({
            id: childrenHidden ? 'reveal-children' : 'hide-children',
            label: childrenHidden ? 'Reveal Children' : 'Hide Children',
            danger: false,
            handler: async () => {
                await setNodeChildrenHidden?.(nodeData, !childrenHidden);
            },
        });
    }

    if (childrenHidden && hiddenDescendantCount > 0) {
        actions.push({
            id: 'reveal-next-level',
            label: 'Reveal Next Level',
            danger: false,
            handler: async () => {
                await revealNextLevel?.(nodeData);
            },
        });
    }

    if (normalizeNodeType(nodeData.nodeType) === 'moment') {
        actions.push({
            id: 'change-status',
            label: 'Change Status',
            danger: false,
            disabled: !canEdit,
            disabledReason: 'Requires Edit permission.',
            handler: async () => {
                openMomentStatusForm(nodeData, onGraphMutated);
            },
        });
    }

    actions.push({
        id: 'delete',
        label: 'Delete',
        danger: true,
        disabled: !canEdit,
        disabledReason: 'Requires Edit permission.',
        handler: async () => {
            const label = getNodeLabel(nodeData) || normalizeNodeType(nodeData.nodeType) || 'item';
            const confirmationLabel = nodeData.nodeType === 'root' ? 'project' : label;
            closeMenus?.();

            const confirmed = await openDeleteConfirmationModal(confirmationLabel);
            if (!confirmed) {
                return;
            }

            if (normalizeNodeType(nodeData.nodeType) === 'root') {
                const deleteRoute = getDeleteRoute('root');
                await requestJson(deleteRoute, { method: 'DELETE' });
                await onProjectDeleted?.();
                return;
            }

            const deleteRoute = getDeleteRoute(nodeData.nodeType, nodeData.payload?.id);
            if (!deleteRoute) {
                throw new Error('Unable to determine the delete route for this node.');
            }

            await requestJson(deleteRoute, { method: 'DELETE' });
            await onGraphMutated?.();
        },
    });

    return actions;
}

function buildMenuElement(actions) {
    const menu = document.createElement('div');
    menu.className = 'graph-context-menu';

    for (const action of actions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `graph-context-menu__item${action.danger ? ' graph-context-menu__item--danger' : ''}`;
        button.textContent = action.label;

        if (action.disabled) {
            button.disabled = true;
            button.className += ' graph-context-menu__item--disabled';
            if (action.disabledReason) {
                button.title = action.disabledReason;
            }
        }

        button.addEventListener('click', async event => {
            event.preventDefault();
            event.stopPropagation();
            if (action.disabled) return;
            await action.handler();
        });

        menu.appendChild(button);
    }

    return menu;
}

export function createGraphContextMenuController({
    owner,
    project,
    getAvailableStrides,
    onGraphMutated,
    onProjectDeleted,
    isNodeChildrenHidden,
    setNodeChildrenHidden,
    revealNextLevel,
    permission,
} = {}) {
    _ctxOwner = owner;
    _ctxProject = project;
    _ctxPermission = permission;
    let referenceRect = null;
    const virtualReference = document.createElement('div');
    const menuContent = document.createElement('div');
    const appendTarget = () => {
        const viewport = document.getElementById('graph-viewport');
        if (viewport && document.fullscreenElement === viewport) return viewport;
        return document.body;
    };
    const createFormTippy = tippy(document.createElement('div'), {
        trigger: 'manual',
        appendTo: appendTarget,
        content: document.createElement('div'),
        allowHTML: false,
        interactive: true,
        hideOnClick: true,
        placement: 'right-start',
        theme: 'graph-menu',
        animation: false,
        offset: [8, 8],
        onHidden(instance) {
            instance.setContent(document.createElement('div'));
        },
    });

    const instance = tippy(virtualReference, {
        trigger: 'manual',
        appendTo: appendTarget,
        content: menuContent,
        allowHTML: false,
        interactive: true,
        hideOnClick: true,
        placement: 'bottom-start',
        theme: 'graph-menu',
        animation: false,
        offset: [0, 8],
        getReferenceClientRect: () => referenceRect ?? new DOMRect(0, 0, 0, 0),
        onHidden() {
            menuContent.replaceChildren();
        },
    });

    function hideCreateForm() {
        createFormTippy.hide();
    }

    function closeMenus() {
        hideCreateForm();
        instance.hide();
    }

    function hide() {
        closeMenus();
    }

    function destroy() {
        createFormTippy.destroy();
        instance.destroy();
        menuContent.replaceChildren();
    }

    function openCreateForm(nodeData, sourceOwner, sourceProject, refreshGraph) {
        const menuRect = referenceRect ?? new DOMRect(0, 0, 0, 0);
        const anchorRect = new DOMRect(menuRect.right + 12, menuRect.top, 1, 1);
        const form = buildCreateFormElement(nodeData, sourceOwner, sourceProject, getAvailableStrides, refreshGraph, closeMenus);

        if (!form) {
            return;
        }

        createFormTippy.setProps({
            getReferenceClientRect: () => anchorRect,
        });
        createFormTippy.setContent(form);
        createFormTippy.show();
    }

    function openMomentStatusForm(nodeData, refreshGraph) {
        const menuRect = referenceRect ?? new DOMRect(0, 0, 0, 0);
        const anchorRect = new DOMRect(menuRect.right + 12, menuRect.top, 1, 1);
        const form = buildMomentStatusFormElement(nodeData, refreshGraph, closeMenus);

        if (!form) {
            return;
        }

        createFormTippy.setProps({
            getReferenceClientRect: () => anchorRect,
        });
        createFormTippy.setContent(form);
        createFormTippy.show();
    }

    function open(event, nodeData) {
        const clientX = Number(event?.clientX ?? 0);
        const clientY = Number(event?.clientY ?? 0);
        referenceRect = new DOMRect(clientX, clientY, 1, 1);

        const actions = buildMenuActions(
            nodeData,
            owner,
            project,
            onGraphMutated,
            onProjectDeleted,
            closeMenus,
            openCreateForm,
            openMomentStatusForm,
            isNodeChildrenHidden,
            setNodeChildrenHidden,
            revealNextLevel,
            _ctxPermission,
        );
        menuContent.replaceChildren(buildMenuElement(actions));

        instance.setProps({
            getReferenceClientRect: () => referenceRect,
        });

        instance.show();
    }

    return {
        hide,
        destroy,
        open,
    };
}

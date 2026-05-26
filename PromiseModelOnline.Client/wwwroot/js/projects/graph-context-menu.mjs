import tippy from 'https://cdn.jsdelivr.net/npm/tippy.js@6/+esm';
import { base } from '../api.mjs';
import { getAccessToken } from '../auth-state.mjs';
import { updateMomentStatus } from '../moments/api.mjs';

const NODE_CHILD_LABELS = {
    root: 'Promise',
    promise: 'Epic',
    epic: 'Journey',
    journey: 'Flow',
    flow: 'Moment',
};

const NODE_DELETE_ROUTES = {
    root: '/api/projects',
    promise: '/api/promises',
    epic: '/api/epics',
    journey: '/api/journeys',
    flow: '/api/flows',
    moment: '/api/moments',
};

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

function getDeleteRoute(nodeType, nodeId) {
    const normalizedType = normalizeNodeType(nodeType);

    if (normalizedType === 'root') {
        return `${NODE_DELETE_ROUTES.root}/${nodeId}`;
    }

    const routePrefix = NODE_DELETE_ROUTES[normalizedType];
    const numericId = Number.parseInt(nodeId, 10);

    if (!routePrefix || Number.isNaN(numericId)) {
        return null;
    }

    return `${routePrefix}/${numericId}`;
}

function getCreateActionMeta(nodeData) {
    const normalizedType = normalizeNodeType(nodeData.nodeType);

    switch (normalizedType) {
        case 'root':
            return { entityLabel: 'Promise', endpoint: '/api/promises/create', parentField: 'projectId' };
        case 'promise':
            return { entityLabel: 'Epic', endpoint: '/api/epics/create', parentField: 'productPromiseId' };
        case 'epic':
            return { entityLabel: 'Journey', endpoint: '/api/journeys/create', parentField: 'epicId' };
        case 'journey':
            return { entityLabel: 'Flow', endpoint: '/api/flows/create', parentField: 'journeyId' };
        case 'flow':
            return { entityLabel: 'Moment', endpoint: '/api/moments/create', parentField: 'flowId' };
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
    const accessToken = getAccessToken();
    const { headers: optionHeaders, ...fetchOptions } = options;
    const response = await fetch(`${base}${url}`, {
        mode: 'cors',
        ...fetchOptions,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
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

function getMomentStatusOptions() {
    return [
        { value: 'Todo', label: 'Todo' },
        { value: 'InProgress', label: 'In Progress' },
        { value: 'Blocked', label: 'Blocked' },
        { value: 'Done', label: 'Done' },
    ];
}

function getMomentStatusValue(nodeData) {
    const payload = nodeData?.payload ?? {};
    const status = String(payload.status ?? payload.Status ?? '').trim();
    if (status) {
        const match = getMomentStatusOptions().find(option => option.value.toLowerCase() === status.toLowerCase());
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

function buildMomentFormElement(nodeData, projectId, getAvailableStrides, onGraphMutated, closeMenus) {
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
        options: getMomentStatusOptions(),
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
    const momentId = nodeData?.payload?.id;
    if (momentId == null) {
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
        options: getMomentStatusOptions(),
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
            await updateMomentStatus(momentId, statusField.select.value);
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

function buildCreateFormElement(nodeData, projectId, getAvailableStrides, onGraphMutated, closeMenus) {
    const createMeta = getCreateActionMeta(nodeData);
    const defaults = getCreateFormDefaults(nodeData);
    if (!createMeta || !defaults) {
        return null;
    }

    if (createMeta.entityLabel === 'Moment') {
        return buildMomentFormElement(nodeData, projectId, getAvailableStrides, onGraphMutated, closeMenus);
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
            payload.projectId = Number.parseInt(projectId, 10);
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
    projectId,
    onGraphMutated,
    onProjectDeleted,
    openCreateForm,
    openMomentStatusForm,
    isNodeChildrenHidden,
    setNodeChildrenHidden,
) {
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
            handler: async () => {
                openCreateForm(nodeData, projectId, onGraphMutated);
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

    if (normalizeNodeType(nodeData.nodeType) === 'moment') {
        actions.push({
            id: 'change-status',
            label: 'Change Status',
            danger: false,
            handler: async () => {
                openMomentStatusForm(nodeData, onGraphMutated);
            },
        });
    }

    actions.push({
        id: 'delete',
        label: 'Delete',
        danger: true,
        handler: async () => {
            const label = getNodeLabel(nodeData) || normalizeNodeType(nodeData.nodeType) || 'item';
            const confirmationLabel = nodeData.nodeType === 'root' ? 'project' : label;
            const confirmed = window.confirm(`Delete ${confirmationLabel}? This cannot be undone.`);
            if (!confirmed) {
                return;
            }

            if (normalizeNodeType(nodeData.nodeType) === 'root') {
                const deleteRoute = getDeleteRoute('root', projectId);
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
        button.addEventListener('click', async event => {
            event.preventDefault();
            event.stopPropagation();
            await action.handler();
        });

        menu.appendChild(button);
    }

    return menu;
}

export function createGraphContextMenuController({
    projectId,
    getAvailableStrides,
    onGraphMutated,
    onProjectDeleted,
    isNodeChildrenHidden,
    setNodeChildrenHidden,
} = {}) {
    let referenceRect = null;
    const virtualReference = document.createElement('div');
    const menuContent = document.createElement('div');
    const createFormTippy = tippy(document.createElement('div'), {
        trigger: 'manual',
        appendTo: () => document.body,
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
        appendTo: () => document.body,
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

    function openCreateForm(nodeData, sourceProjectId, refreshGraph) {
        const menuRect = referenceRect ?? new DOMRect(0, 0, 0, 0);
        const anchorRect = new DOMRect(menuRect.right + 12, menuRect.top, 1, 1);
        const form = buildCreateFormElement(nodeData, sourceProjectId, getAvailableStrides, refreshGraph, closeMenus);

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
            projectId,
            onGraphMutated,
            onProjectDeleted,
            openCreateForm,
            openMomentStatusForm,
            isNodeChildrenHidden,
            setNodeChildrenHidden,
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
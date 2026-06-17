// @ts-nocheck
const tippy = (window as any).tippy;

import { apiFetch } from '../api.ts';
import { updateMomentStatus } from '../moments/api.ts';
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { STATUS_OPTIONS } from '../utils/status-utils.ts';

let _ctxOwner: any = null;
let _ctxProject: any = null;
let _ctxPermission: any = null;

const NODE_CHILD_LABELS: Record<string, string> = {
    root: 'Promise',
    promise: 'Epic',
    epic: 'Journey',
    journey: 'Flow',
    flow: 'Moment',
};

/**
 * Get the API route for deleting a graph node by its type and ID.
 * @param {string} nodeType - The node type.
 * @param {string|number} nodeId - The node's ID.
 * @returns {string|null} The delete API route, or null if invalid.
 */
function getDeleteRoute(nodeType: string, nodeId?: string | number): string | null {
    const normalizedType = normalizeNodeType(nodeType);

    if (normalizedType === 'root') {
        return `/api/projects/${encodeURIComponent(_ctxOwner)}/${encodeURIComponent(_ctxProject)}`;
    }

    const numericId = Number.parseInt(nodeId as any, 10);
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

/**
 * Normalize a node type string to lowercase trimmed form.
 * @param {string} nodeType - The raw node type.
 * @returns {string} The normalized node type.
 */
function normalizeNodeType(nodeType: string): string {
    return String(nodeType ?? '').trim().toLowerCase();
}

/**
 * Get the display label for a graph node.
 * @param {object} nodeData - The node data.
 * @returns {string} The node's label text.
 */
function getNodeLabel(nodeData: any): string {
    const payload = nodeData?.payload ?? {};
    return String(payload.statement ?? payload.name ?? `#${payload.id ?? ''}`).trim();
}

/**
 * Get the label for the child type of a given node type.
 * @param {string} nodeType - The parent node type.
 * @returns {string|null} The child type label, or null if none.
 */
function getChildLabel(nodeType: string): string | null {
    return NODE_CHILD_LABELS[normalizeNodeType(nodeType)] ?? null;
}



/**
 * Get the API metadata for creating a child entity under a given node.
 * @param {object} nodeData - The parent node data.
 * @returns {{entityLabel: string, endpoint: string, parentField: string}|null} The create action metadata, or null.
 */
function getCreateActionMeta(nodeData: any): { entityLabel: string; endpoint: string; parentField: string } | null {
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

/**
 * Get default values for the create form based on the parent node type.
 * @param {object} nodeData - The parent node data.
 * @returns {object|null} Default form values (statement, description, displayOrder), or null.
 */
function getCreateFormDefaults(nodeData: any): Record<string, any> | null {
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

/**
 * Make an authenticated JSON API request.
 * @param {string} url - The request URL.
 * @param {object} [options={}] - Fetch options (headers, method, body, etc.).
 * @returns {Promise<object|null>} The parsed JSON response, or null for 204.
 * @throws {Error} If the request fails or returns a non-OK status.
 */
async function requestJson(url: string, options: Record<string, any>): Promise<any> {
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

/**
 * Ensure a Bootstrap modal element exists in the DOM, creating it if necessary.
 * @param {string} modalId - The ID for the modal element.
 * @param {string} modalMarkup - The HTML markup for the modal.
 * @returns {HTMLElement|null} The modal element, or null if creation failed.
 */
function ensureModal(modalId: string, modalMarkup: string): HTMLElement | null {
    let modalEl = document.getElementById(modalId);
    if (modalEl) return modalEl;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalMarkup.trim();
    modalEl = wrapper.firstElementChild as HTMLElement | null;

    if (modalEl) {
        document.body.appendChild(modalEl);
    }

    return modalEl;
}

/**
 * Open a Bootstrap modal to confirm deletion of an item.
 * @param {string} label - The label of the item to delete.
 * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise.
 */
function openDeleteConfirmationModal(label: string): Promise<boolean> {
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

    return new Promise<boolean>(resolve => {
        let settled = false;

        const settle = (value: boolean) => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        const modalInstance = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl);

        confirmButton.addEventListener('click', () => {
            settle(true);
            modalInstance?.hide();
        }, { once: true });

        modalEl.addEventListener('hidden.bs.modal', () => settle(false), { once: true });
        modalInstance?.show();
    });
}

/**
 * Create a form input field element.
 * @param {{name: string, label: string, type?: string, value?: string, placeholder?: string, rows?: number}} config - The field configuration.
 * @returns {{field: HTMLLabelElement, input: HTMLInputElement|HTMLTextAreaElement}} The field and input elements.
 */
function createInputField({ name, label, type = 'text', value = '', placeholder = '', rows = 3 }: {
    name: string;
    label: string;
    type?: string;
    value?: string;
    placeholder?: string;
    rows?: number;
}): { field: HTMLLabelElement; input: HTMLInputElement | HTMLTextAreaElement } {
    const field = document.createElement('label');
    field.className = 'graph-context-menu-form__field';

    const fieldLabel = document.createElement('span');
    fieldLabel.className = 'graph-context-menu-form__label';
    fieldLabel.textContent = label;

    let input: HTMLInputElement | HTMLTextAreaElement;
    if (type === 'textarea') {
        input = document.createElement('textarea') as HTMLTextAreaElement;
        input.rows = rows;
    } else {
        input = document.createElement('input') as HTMLInputElement;
        input.type = type;
    }

    input.name = name;
    input.className = 'graph-context-menu-form__control';
    input.value = value;
    input.placeholder = placeholder;

    field.append(fieldLabel, input);
    return { field, input };
}

/**
 * Create a form select field element.
 * @param {{name: string, label: string, value?: string, options?: {value: string, label: string}[]}} config - The field configuration.
 * @returns {{field: HTMLLabelElement, select: HTMLSelectElement}} The field and select elements.
 */
function createSelectField({ name, label, value = '', options = [] }: {
    name: string;
    label: string;
    value?: string;
    options?: Array<{ value: string; label: string }>;
}): { field: HTMLLabelElement; select: HTMLSelectElement } {
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

/**
 * Get the option list for moment types (Story, Job).
 * @returns {{value: string, label: string}[]} The moment type options.
 */
function getMomentTypeOptions(): Array<{ value: string; label: string }> {
    return [
        { value: 'Story', label: 'Story' },
        { value: 'Job', label: 'Job' },
    ];
}

/**
 * Get the current status value of a moment node, mapping statusColor to a canonical status.
 * @param {object} nodeData - The node data.
 * @returns {string} The canonical status value (Done, Blocked, InProgress, Todo).
 */
function getMomentStatusValue(nodeData: any): string {
    const payload = nodeData?.payload ?? {};
    const status = String(payload.status ?? payload.Status ?? '').trim();
    if (status) {
        const match = STATUS_OPTIONS.find((option: any) => option.value.toLowerCase() === status.toLowerCase());
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

/**
 * Get the option list for moment effort estimates.
 * @returns {{value: string, label: string}[]} The estimate options.
 */
function getMomentEstimateOptions(): Array<{ value: string; label: string }> {
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

/**
 * Get the option list for stride selection, including a Backlog option.
 * @param {object[]} [strides=[]] - The available strides.
 * @returns {{value: string, label: string}[]} The stride options.
 */
function getStrideOptions(strides: Array<{ id: number; name?: string }> = []): Array<{ value: string; label: string }> {
    return [
        { value: '', label: 'Backlog' },
        ...strides.map(stride => ({
            value: String(stride.id),
            label: stride.name ? `Stride #${stride.id} - ${stride.name}` : `Stride #${stride.id}`,
        })),
    ];
}

/**
 * Build the create-moment form element with all moment-specific fields.
 * @param {object} nodeData - The parent (flow) node data.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {function} getAvailableStrides - Function returning the list of available strides.
 * @param {function} onGraphMutated - Callback after successful creation.
 * @param {function} closeMenus - Function to close all context menus.
 * @returns {HTMLFormElement|null} The form element, or null if creation metadata is missing.
 */
function buildMomentFormElement(
    nodeData: any,
    owner: string,
    project: string,
    getAvailableStrides: (() => Array<{ id: number; name?: string }>) | undefined,
    onGraphMutated: (() => void) | undefined,
    closeMenus: () => void,
): HTMLFormElement | null {
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
        options: STATUS_OPTIONS.map((o: any) => ({ value: o.value, label: `${o.icon} ${o.label}` })),
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

        const payload: Record<string, any> = {
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

/**
 * Build the change-moment-status form element.
 * @param {object} nodeData - The moment node data.
 * @param {function} onGraphMutated - Callback after successful status update.
 * @param {function} closeMenus - Function to close all context menus.
 * @returns {HTMLFormElement|null} The form element, or null if the moment sequence number is missing.
 */
function buildMomentStatusFormElement(
    nodeData: any,
    onGraphMutated: ((...args: any[]) => any) | undefined,
    closeMenus: () => void,
): HTMLFormElement | null {
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
        options: STATUS_OPTIONS.map((o: any) => ({ value: o.value, label: `${o.icon} ${o.label}` })),
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

/**
 * Build a create-form element for the given parent node.
 * Dispatches to buildMomentFormElement for moment creation, otherwise builds a generic form.
 * @param {object} nodeData - The parent node data.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {function} getAvailableStrides - Function returning available strides (for moments).
 * @param {function} onGraphMutated - Callback after successful creation.
 * @param {function} closeMenus - Function to close all context menus.
 * @returns {HTMLFormElement|null} The form element, or null if creation metadata is missing.
 */
function buildCreateFormElement(
    nodeData: any,
    owner: string,
    project: string,
    getAvailableStrides: (() => Array<{ id: number; name?: string }>) | undefined,
    onGraphMutated: (() => void) | undefined,
    closeMenus: () => void,
): HTMLFormElement | null {
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
        const payload: Record<string, any> = {
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

/**
 * Build the list of actions for the context menu based on node type and permissions.
 * @param {object} nodeData - The node data for which to build actions.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {function} onGraphMutated - Callback after any mutation.
 * @param {function} onProjectDeleted - Callback when the project is deleted.
 * @param {function} closeMenus - Function to close all context menus.
 * @param {function} openCreateForm - Function to open the create form.
 * @param {function} openMomentStatusForm - Function to open the moment status form.
 * @param {function} isNodeChildrenHidden - Function to check if a node's children are hidden.
 * @param {function} setNodeChildrenHidden - Function to toggle children visibility.
 * @param {function} revealNextLevel - Function to reveal the next level of children.
 * @param {object} permission - The current user's permission object.
 * @returns {{id: string, label: string, danger: boolean, disabled?: boolean, disabledReason?: string, handler: function}[]} The action list.
 */
function buildMenuActions(
    nodeData: any,
    owner: string,
    project: string,
    onGraphMutated: (() => void) | undefined,
    onProjectDeleted: (() => void) | undefined,
    closeMenus: () => void,
    openCreateForm: (nodeData: any, owner: string, project: string, refreshGraph: (() => void) | undefined) => void,
    openMomentStatusForm: (nodeData: any, refreshGraph: (() => void) | undefined) => void,
    isNodeChildrenHidden: ((nodeData: any) => boolean) | undefined,
    setNodeChildrenHidden: ((nodeData: any, hidden: boolean) => void) | undefined,
    revealNextLevel: ((nodeData: any) => void) | undefined,
    permission: { permission?: string } | null | undefined,
): Array<{
    id: string;
    label: string;
    danger: boolean;
    disabled?: boolean;
    disabledReason?: string;
    handler: () => Promise<void>;
}> {
    const canEdit = permission?.permission === 'Edit';
    const actions: Array<{
        id: string;
        label: string;
        danger: boolean;
        disabled?: boolean;
        disabledReason?: string;
        handler: () => Promise<void>;
    }> = [];
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

/**
 * Build the DOM element for the context menu from a list of actions.
 * @param {{id: string, label: string, danger: boolean, disabled?: boolean, disabledReason?: string, handler: function}[]} actions - The action definitions.
 * @returns {HTMLDivElement} The menu element.
 */
function buildMenuElement(actions: Array<{
    id: string;
    label: string;
    danger: boolean;
    disabled?: boolean;
    disabledReason?: string;
    handler: () => Promise<void>;
}>): HTMLDivElement {
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

/**
 * Create a context menu controller for the graph visualization using Tippy.js.
 * @param {{owner: string, project: string, getAvailableStrides: function, onGraphMutated: function, onProjectDeleted: function, isNodeChildrenHidden: function, setNodeChildrenHidden: function, revealNextLevel: function, permission: object}} [options={}] - Configuration options.
 * @returns {{hide: function, destroy: function, open: function}} The context menu controller.
 */
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
}: {
    owner?: string;
    project?: string;
    getAvailableStrides?: () => Array<{ id: number; name?: string }>;
    onGraphMutated?: () => void;
    onProjectDeleted?: () => void;
    isNodeChildrenHidden?: (nodeData: any) => boolean;
    setNodeChildrenHidden?: (nodeData: any, hidden: boolean) => void;
    revealNextLevel?: (nodeData: any) => void;
    permission?: { permission?: string };
} = {}): {
    hide: () => void;
    destroy: () => void;
    open: (event: MouseEvent, nodeData: any) => void;
} {
    _ctxOwner = owner;
    _ctxProject = project;
    _ctxPermission = permission;
    let referenceRect: DOMRect | null = null;
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
        onHidden(instance: any) {
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

    /**
     * Hide the create form tippy popup.
     */
    function hideCreateForm() {
        createFormTippy.hide();
    }

    /**
     * Close all context menu popups (create form and main menu).
     */
    function closeMenus() {
        hideCreateForm();
        instance.hide();
    }

    /**
     * Hide the context menu (public API).
     */
    function hide() {
        closeMenus();
    }

    /**
     * Destroy the context menu controller and clean up resources.
     */
    function destroy() {
        createFormTippy.destroy();
        instance.destroy();
        menuContent.replaceChildren();
    }

    /**
     * Open the create-form tippy popup for a given node.
     * @param {object} nodeData - The parent node data.
     * @param {string} sourceOwner - The project owner's slug.
     * @param {string} sourceProject - The project's slug.
     * @param {function} refreshGraph - Callback to refresh the graph after creation.
     */
    function openCreateForm(nodeData: any, sourceOwner: string, sourceProject: string, refreshGraph: (() => void) | undefined) {
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

    /**
     * Open the change-moment-status form tippy popup.
     * @param {object} nodeData - The moment node data.
     * @param {function} refreshGraph - Callback to refresh the graph after status update.
     */
    function openMomentStatusForm(nodeData: any, refreshGraph: (() => void) | undefined) {
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

    /**
     * Open the context menu at the given mouse event position.
     * @param {MouseEvent} event - The triggering mouse event.
     * @param {object} nodeData - The node data for which to show the context menu.
     */
    function open(event: MouseEvent, nodeData: any) {
        const clientX = Number(event?.clientX ?? 0);
        const clientY = Number(event?.clientY ?? 0);
        referenceRect = new DOMRect(clientX, clientY, 1, 1);

        const actions = buildMenuActions(
            nodeData,
            owner as string,
            project as string,
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
            getReferenceClientRect: () => referenceRect as DOMRect,
        });

        instance.show();
    }

    return {
        hide,
        destroy,
        open,
    };
}

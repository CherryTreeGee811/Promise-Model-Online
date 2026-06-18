import { apiFetch } from '../api.ts';
import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { updateMomentStatus } from '../moments/api.ts';
import { STATUS_OPTIONS } from '../utils/status-utilities.ts';

const tippy = (globalThis as any).tippy;

const _contextState: { owner: any; project: any; permission: any } = { owner: undefined, project: undefined, permission: undefined };

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
 * @returns {string} The delete API route, or null if invalid.
 */
function getDeleteRoute(nodeType: string, nodeId?: string | number): string | undefined {
    const normalizedType = normalizeNodeType(nodeType);

    if (normalizedType === 'root') {
        return `/api/projects/${encodeURIComponent(_contextState.owner)}/${encodeURIComponent(_contextState.project)}`;
    }

    const numericId = Number.parseInt(nodeId as any, 10);
    if (Number.isNaN(numericId)) return;

    switch (normalizedType) {
        case 'promise': { return `/api/projects/${encodeURIComponent(_contextState.owner)}/${encodeURIComponent(_contextState.project)}/promises/${numericId}`;
        }
        case 'epic': { return `/api/projects/${encodeURIComponent(_contextState.owner)}/${encodeURIComponent(_contextState.project)}/epics/${numericId}`;
        }
        case 'journey': { return `/api/projects/${encodeURIComponent(_contextState.owner)}/${encodeURIComponent(_contextState.project)}/journeys/${numericId}`;
        }
        case 'flow': { return `/api/projects/${encodeURIComponent(_contextState.owner)}/${encodeURIComponent(_contextState.project)}/flows/${numericId}`;
        }
        case 'moment': { return `/api/projects/${encodeURIComponent(_contextState.owner)}/${encodeURIComponent(_contextState.project)}/moments/${numericId}`;
        }
        default: { return;
        }
    }
}

/**
 * Normalize a node type string to lowercase trimmed form.
 * @param {string} nodeType - The raw node type.
 * @returns {string} The normalized node type.
 */
function normalizeNodeType(nodeType: string): string {
    return (nodeType ?? '').trim().toLowerCase();
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
 * @returns {string} The child type label, or null if none.
 */
function getChildLabel(nodeType: string): string | undefined {
    return NODE_CHILD_LABELS[normalizeNodeType(nodeType)];
}



/**
 * Get the API metadata for creating a child entity under a given node.
 * @param {object} nodeData - The parent node data.
 * @returns {{entityLabel: string, endpoint: string, parentField: string}} The create action metadata, or null.
 */
function getCreateActionMeta(nodeData: any): { entityLabel: string; endpoint: string; parentField: string } | undefined {
    const normalizedType = normalizeNodeType(nodeData.nodeType);

    const base = `/api/projects/${encodeURIComponent(_contextState.owner)}/${encodeURIComponent(_contextState.project)}`;
    switch (normalizedType) {
        case 'root': {
            return { entityLabel: 'Promise', endpoint: `${base}/promises/create`, parentField: 'projectId' };
        }
        case 'promise': {
            return { entityLabel: 'Epic', endpoint: `${base}/epics/create`, parentField: 'productPromiseId' };
        }
        case 'epic': {
            return { entityLabel: 'Journey', endpoint: `${base}/journeys/create`, parentField: 'epicId' };
        }
        case 'journey': {
            return { entityLabel: 'Flow', endpoint: `${base}/flows/create`, parentField: 'journeyId' };
        }
        case 'flow': {
            return { entityLabel: 'Moment', endpoint: `${base}/moments/create`, parentField: 'flowId' };
        }
        default: {
            return;
        }
    }
}

/**
 * Get default values for the create form based on the parent node type.
 * @param {object} nodeData - The parent node data.
 * @returns {object} Default form values (statement, description, displayOrder), or null.
 */
function getCreateFormDefaults(nodeData: any): Record<string, any> | undefined {
    const normalizedType = normalizeNodeType(nodeData.nodeType);
    const childCount = Number.parseInt(nodeData.childCount ?? 0, 10) || 0;
    const nextDisplayOrder = childCount + 1;

    switch (normalizedType) {
        case 'root': {
            return {
                statement: 'New Promise',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        }
        case 'promise': {
            return {
                statement: 'New Epic',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        }
        case 'epic': {
            return {
                statement: 'New Journey',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        }
        case 'journey': {
            return {
                statement: 'New Flow',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        }
        case 'flow': {
            return {
                statement: 'New Moment',
                description: '',
                displayOrder: nextDisplayOrder,
            };
        }
        default: {
            return;
        }
    }
}

/**
 * Make an authenticated JSON API request.
 * @param {string} url - The request URL.
 * @param {object} [options] - Fetch options (headers, method, body, etc.).
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
            ...optionHeaders,
        },
    });

    if (response.ok) {
        if (response.status === 204) {
            return;
        }
        return response.json();
    }

    if (response.status === 401) {
        (document.querySelector('#login-link') as HTMLElement)?.click();
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
 * @returns {HTMLElement} The modal element, or null if creation failed.
 */
function ensureModal(modalId: string, modalMarkup: string): HTMLElement | null {
    let modalElement = document.querySelector(`#${CSS.escape(modalId)}`) as HTMLElement | null;
    if (modalElement) return modalElement;

    const parser = new DOMParser();
    const document_ = parser.parseFromString(modalMarkup.trim(), 'text/html');
    modalElement = document_.body.firstElementChild as HTMLElement | null;

    if (modalElement) {
        document.body.append(modalElement);
    }

    return modalElement;
}

/**
 * Open a Bootstrap modal to confirm deletion of an item.
 * @param {string} label - The label of the item to delete.
 * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise.
 */
function openDeleteConfirmationModal(label: string): Promise<boolean> {
    const modalElement = ensureModal('graph-delete-confirmation-modal', `
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

    if (!modalElement) {
        return Promise.resolve(confirm(`Delete ${label}? This cannot be undone.`));
    }

    const titleElement = modalElement.querySelector('#graph-delete-confirmation-modal-title') as HTMLElement | null;
    const bodyElement = modalElement.querySelector('#graph-delete-confirmation-modal-body') as HTMLElement | null;
    const confirmButton = modalElement.querySelector('#graph-delete-confirmation-confirm') as HTMLButtonElement | null;

    if (!titleElement || !bodyElement || !confirmButton) {
        return Promise.resolve(confirm(`Delete ${label}? This cannot be undone.`));
    }

    titleElement.textContent = `Delete ${label}`;
    bodyElement.textContent = `Delete ${label}? This cannot be undone.`;

    return new Promise<boolean>(resolve => {
        let isSettled = false;

        const settle = (isConfirmed: boolean) => {
            if (isSettled) return;
            isSettled = true;
            resolve(isConfirmed);
        };

        const modalInstance = (globalThis as any).bootstrap?.Modal?.getOrCreateInstance(modalElement);

        confirmButton.addEventListener('click', () => {
            settle(true);
            modalInstance?.hide();
        }, { once: true });

        modalElement.addEventListener('hidden.bs.modal', () => settle(false), { once: true });
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
        optionElement.selected = option.value === value;
        select.append(optionElement);
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
 * @param {object[]} [strides] - The available strides.
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
 * @param {(() => Array<{ id: number; name?: string }>) | undefined} getAvailableStrides - Function returning the list of available strides.
 * @param {(() => void) | undefined} onGraphMutated - Callback after successful creation.
 * @param {() => void} closeMenus - Function to close all context menus.
 * @returns {HTMLFormElement|undefined} The form element, or undefined if creation metadata is missing.
 */
function buildMomentFormElement(
    nodeData: any,
    owner: string,
    project: string,
    getAvailableStrides: (() => Array<{ id: number; name?: string }>) | undefined,
    onGraphMutated: (() => void) | undefined,
    closeMenus: () => void,
): HTMLFormElement | undefined {
    const actionMeta = getCreateActionMeta(nodeData);
    const defaults = getCreateFormDefaults(nodeData);
    if (!actionMeta || !defaults) {
        return;
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

        if (!statementField.input.value.trim()) {
            submitButton.disabled = false;
            submitButton.textContent = 'Create Moment';
            statementField.input.focus();
            return;
        }

        const statement = statementField.input.value.trim();
        const description = descriptionField.input.value.trim();
        const effortValue = estimateField.select.value;
        let effortEstimate;
        if (effortValue !== '-') {
            effortEstimate = effortValue;
        }
        let assignedStrideId;
        if (strideField.select.value) {
            assignedStrideId = Number.parseInt(strideField.select.value, 10);
        }
        const payload: Record<string, any> = {
            statement,
            description,
            flowId: nodeData.payload?.id,
            type: typeField.select.value,
            status: statusField.select.value,
            effortEstimate,
            assignedStrideId,
            displayOrder: (Number.parseInt(nodeData.childCount ?? 0, 10) || 0) + 1,
        };

        try {
            await requestJson(actionMeta.endpoint, {
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
 * @param {(() => void) | undefined} onGraphMutated - Callback after successful status update.
 * @param {() => void} closeMenus - Function to close all context menus.
 * @returns {HTMLFormElement|undefined} The form element, or undefined if the moment sequence number is missing.
 */
function buildMomentStatusFormElement(
    nodeData: any,
    onGraphMutated: ((...arguments_: any[]) => any) | undefined,
    closeMenus: () => void,
): HTMLFormElement | undefined {
    const momentSeq = nodeData?.payload?.sequenceNumber;
    if (momentSeq === null) {
        return;
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
            await updateMomentStatus(_contextState.owner, _contextState.project, momentSeq, statusField.select.value);
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
 * @param {(() => Array<{ id: number; name?: string }>) | undefined} getAvailableStrides - Function returning available strides (for moments).
 * @param {(() => void) | undefined} onGraphMutated - Callback after successful creation.
 * @param {() => void} closeMenus - Function to close all context menus.
 * @returns {HTMLFormElement|undefined} The form element, or undefined if creation metadata is missing.
 */
function buildCreateFormElement(
    nodeData: any,
    owner: string,
    project: string,
    getAvailableStrides: (() => Array<{ id: number; name?: string }>) | undefined,
    onGraphMutated: (() => void) | undefined,
    closeMenus: () => void,
): HTMLFormElement | undefined {
    const actionMeta = getCreateActionMeta(nodeData);
    const defaults = getCreateFormDefaults(nodeData);
    if (!actionMeta || !defaults) {
        return;
    }

    if (actionMeta.entityLabel === 'Moment') {
        return buildMomentFormElement(nodeData, owner, project, getAvailableStrides, onGraphMutated, closeMenus);
    }

    const form = document.createElement('form');
    form.className = 'graph-context-menu-form';

    const title = document.createElement('div');
    title.className = 'graph-context-menu-form__title';
    title.textContent = `Create ${actionMeta.entityLabel}`;

    const subtitle = document.createElement('div');
    subtitle.className = 'graph-context-menu-form__subtitle';
    subtitle.textContent = `Add a new ${actionMeta.entityLabel.toLowerCase()} beneath this card.`;

    const statementField = createInputField({
        name: 'statement',
        label: 'Statement',
        value: defaults.statement,
        placeholder: `New ${actionMeta.entityLabel}`,
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
    submitButton.textContent = `Create ${actionMeta.entityLabel}`;

    actions.append(cancelButton, submitButton);

    form.append(title, subtitle, statementField.field, descriptionField.field, actions);

    // Autocomplete for entity references in description
    createCommentAutocomplete(descriptionField.input, nodeData.nodeType, nodeData.payload?.id);

    form.addEventListener('submit', async event => {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = `Creating ${actionMeta.entityLabel}...`;

        if (!statementField.input.value.trim()) {
            submitButton.disabled = false;
            submitButton.textContent = `Create ${actionMeta.entityLabel}`;
            statementField.input.focus();
            return;
        }

        const statement = statementField.input.value.trim();
        const description = descriptionField.input.value.trim();
        const nextDisplayOrder = (Number.parseInt(nodeData.childCount ?? 0, 10) || 0) + 1;
        const payload: Record<string, any> = {
            statement,
            description: description || undefined,
            displayOrder: nextDisplayOrder,
        };

        if (actionMeta.parentField === 'projectId') {
            // projectId context is encoded in the endpoint URL; no separate body field needed
        } else {
            payload[actionMeta.parentField] = nodeData.payload?.id;
        }

        try {
            await requestJson(actionMeta.endpoint, {
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
            submitButton.textContent = `Create ${actionMeta.entityLabel}`;
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
 * @param {(() => void) | undefined} onGraphMutated - Callback after any mutation.
 * @param {(() => void) | undefined} onProjectDeleted - Callback when the project is deleted.
 * @param {() => void} closeMenus - Function to close all context menus.
 * @param {(nodeData: object, owner: string, project: string, refreshGraph: (() => void) | undefined) => void} openCreateForm - Function to open the create form.
 * @param {(nodeData: object, refreshGraph: (() => void) | undefined) => void} openMomentStatusForm - Function to open the moment status form.
 * @param {((nodeData: object) => boolean) | undefined} isNodeChildrenHidden - Function to check if a node's children are hidden.
 * @param {((nodeData: object, hidden: boolean) => void) | undefined} setNodeChildrenHidden - Function to toggle children visibility.
 * @param {((nodeData: object) => void) | undefined} revealNextLevel - Function to reveal the next level of children.
 * @param {{ permission?: string } | null | undefined} permission - The current user's permission object.
 * @returns {{id: string, label: string, danger: boolean, disabled?: boolean, disabledReason?: string, handler: () => Promise<void>}[]} The action list.
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
    setNodeChildrenHidden: ((nodeData: any, isHidden: boolean) => void) | undefined,
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
    const isChildrenHidden = canToggleChildren && Boolean(isNodeChildrenHidden?.(nodeData));

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
            id: isChildrenHidden ? 'reveal-children' : 'hide-children',
            label: isChildrenHidden ? 'Reveal Children' : 'Hide Children',
            danger: false,
            handler: async () => {
                await setNodeChildrenHidden?.(nodeData, !isChildrenHidden);
            },
        });
    }

    if (isChildrenHidden && hiddenDescendantCount > 0) {
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

            const isConfirmed = await openDeleteConfirmationModal(confirmationLabel);
            if (!isConfirmed) {
                return;
            }

            if (normalizeNodeType(nodeData.nodeType) === 'root') {
                const endpointUrl = getDeleteRoute('root')!;
                await requestJson(endpointUrl, { method: 'DELETE' });
                await onProjectDeleted?.();
                return;
            }

            const endpointUrl = getDeleteRoute(nodeData.nodeType, nodeData.payload?.id);
            if (!endpointUrl) {
                throw new Error('Unable to determine the delete route for this node.');
            }

            await requestJson(endpointUrl, { method: 'DELETE' });
            await onGraphMutated?.();
        },
    });

    return actions;
}

/**
 * Build the DOM element for the context menu from a list of actions.
 * @param {{id: string, label: string, danger: boolean, disabled?: boolean, disabledReason?: string, handler: () => Promise<void>}[]} actions - The action definitions.
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

        menu.append(button);
    }

    return menu;
}

/**
 * Create a context menu controller for the graph visualization using Tippy.js popups.
 * @param {object} [root0] - Configuration options.
 * @param {string} [root0.owner] - The project owner's slug.
 * @param {string} [root0.project] - The project's slug.
 * @param {() => Array<{ id: number; name?: string }>} [root0.getAvailableStrides] - Function returning available strides (for moment creation).
 * @param {() => void} [root0.onGraphMutated] - Callback invoked after any graph mutation.
 * @param {() => void} [root0.onProjectDeleted] - Callback invoked when the project is deleted.
 * @param {(nodeData: object) => boolean} [root0.isNodeChildrenHidden] - Function to check if a node's children are hidden.
 * @param {(nodeData: object, hidden: boolean) => void} [root0.setNodeChildrenHidden] - Function to toggle a node's children visibility.
 * @param {(nodeData: object) => void} [root0.revealNextLevel] - Function to reveal the next level of children beneath a node.
 * @param {{ permission?: string }} [root0.permission] - The current user's permission object for gating edit actions.
 * @returns {{hide: () => void, destroy: () => void, open: (event: MouseEvent, nodeData: object) => void}} An object with hide, destroy, and open methods for the context menu.
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
    setNodeChildrenHidden?: (nodeData: any, isHidden: boolean) => void;
    revealNextLevel?: (nodeData: any) => void;
    permission?: { permission?: string };
} = {}): {
    hide: () => void;
    destroy: () => void;
    open: (event: MouseEvent, nodeData: any) => void;
} {
    _contextState.owner = owner;
    _contextState.project = project;
    _contextState.permission = permission;
    let referenceRect: DOMRect | undefined;
    const virtualReference = document.createElement('div');
    const menuContent = document.createElement('div');
    const appendTarget = () => {
        const viewport = document.querySelector('#graph-viewport');
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
     * @param {(() => void) | undefined} refreshGraph - Callback to refresh the graph after creation.
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
     * @param {(() => void) | undefined} refreshGraph - Callback to refresh the graph after status update.
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
            _contextState.permission,
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

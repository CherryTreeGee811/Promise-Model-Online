import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { updateMomentStatus } from '../moments/api.ts';
import { STATUS_OPTIONS } from '../utils/status-utilities.ts';

import { normalizeNodeType, requestJson, buildMenuActions } from './graph-context-menu-core.ts';

export { requestJson, buildMenuActions } from './graph-context-menu-core.ts';

const _contextState: { owner: string; project: string; permission: Record<string, unknown> | undefined } = { owner: '', project: '', permission: undefined };

/**
 * Determine the action metadata for creating a new child node based on the parent's node type.
 * @param {Record<string, unknown>} nodeData - The parent node's data.
 * @returns {{entityLabel: string, endpoint: string, parentField: string} | undefined} The metadata or undefined if no creation action is available.
 */
export function getCreateActionMeta(nodeData: Record<string, unknown>): { entityLabel: string; endpoint: string; parentField: string } | undefined {
    const normalizedType = normalizeNodeType(nodeData.nodeType as string);

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
 * Determine the default form values for creating a new child based on the parent's node type.
 * @param {Record<string, unknown>} nodeData - The parent node's data.
 * @returns {Record<string, unknown> | undefined} The default values or undefined.
 */
export function getCreateFormDefaults(nodeData: Record<string, unknown>): Record<string, unknown> | undefined {
    const normalizedType = normalizeNodeType(nodeData.nodeType as string);
    const childCount = Math.trunc(Number(nodeData.childCount ?? 0)) || 0;
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
 * Create a form input field element.
 * @param {{name: string, label: string, type?: string, value?: string, placeholder?: string, rows?: number}} config - The field configuration.
 * @returns {{field: HTMLLabelElement, input: HTMLInputElement|HTMLTextAreaElement}} The field and input elements.
 */
export function createInputField({ name, label, type = 'text', value = '', placeholder = '', rows = 3 }: {
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
export function createSelectField({ name, label, value = '', options = [] }: {
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
export function getMomentTypeOptions(): Array<{ value: string; label: string }> {
    return [
        { value: 'Story', label: 'Story' },
        { value: 'Job', label: 'Job' },
    ];
}

/**
 * Mapping of color keywords to canonical moment status values.
 */
const STATUS_COLOR_MAP: ReadonlyArray<{ keywords: readonly string[]; status: string }> = [
    { keywords: ['green', 'done'], status: 'Done' },
    { keywords: ['black', 'blocked'], status: 'Blocked' },
    { keywords: ['orange', 'yellow', 'amber', 'inprogress', 'in-progress'], status: 'InProgress' },
    { keywords: ['red', 'todo'], status: 'Todo' },
] as const;

/**
 * Get the current status value of a moment node, mapping statusColor to a canonical status.
 * @param {Record<string, unknown>} nodeData - The node data.
 * @returns {string} The canonical status value (Done, Blocked, InProgress, or not started).
 */
export function getMomentStatusValue(nodeData: Record<string, unknown>): string {
    const payload = (nodeData?.payload ?? {}) as Record<string, unknown>;
    const status = String(payload.status ?? payload.Status ?? '').trim();
    if (status) {
        const match = STATUS_OPTIONS.find(
            (option: { value: string; icon: string; label: string }) => option.value.toLowerCase() === status.toLowerCase()
        );
        if (match) {
            return match.value;
        }
    }

    const statusColor = String(payload.statusColor ?? payload.StatusColor ?? '').trim().toLowerCase();
    const matched = STATUS_COLOR_MAP.find(entry => entry.keywords.some(kw => statusColor.includes(kw)));
    return matched?.status ?? 'Todo';
}

/**
 * Get the option list for moment effort estimates.
 * @returns {{value: string, label: string}[]} The estimate options.
 */
export function getMomentEstimateOptions(): Array<{ value: string; label: string }> {
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
export function getStrideOptions(strides: Array<{ id: number; name?: string }> = []): Array<{ value: string; label: string }> {
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

/**
 * Create the cancel and submit buttons for a graph context menu form.
 * @param {() => void} closeMenus - Function to close all menus on cancel.
 * @param {string} submitText - The text for the submit button.
 * @returns {{ cancelButton: HTMLButtonElement; submitButton: HTMLButtonElement }} The created button elements.
 */
export function createFormActionsBar(closeMenus: () => void, submitText: string): { cancelButton: HTMLButtonElement; submitButton: HTMLButtonElement } {
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
    submitButton.textContent = submitText;

    return { cancelButton, submitButton };
}

/**
 * Build the create-moment form element with moment-specific fields.
 * @param {object} nodeData - The parent (flow) node data.
 * @param {string} _owner - The project owner.
 * @param {string} _project - The project slug.
 * @param {(() => Array<{ id: number; name?: string }>) | undefined} getAvailableStrides - Optional stride list.
 * @param {(() => void) | undefined} onGraphMutated - Callback after creation.
 * @param {() => void} closeMenus - Function to close all menus.
 * @returns {HTMLFormElement|undefined} The form element or undefined.
 */
export function buildMomentFormElement(
    nodeData: Record<string, unknown>,
    _owner: string,
    _project: string,
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
        value: defaults.statement as string,
        placeholder: 'New Moment',
    });

    const descriptionField = createInputField({
        name: 'description',
        label: 'Description',
        type: 'textarea',
        value: defaults.description as string,
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
        options: STATUS_OPTIONS.map((o: { value: string; icon: string; label: string }) => ({ value: o.value, label: `${o.icon} ${o.label}` })),
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
    const { cancelButton, submitButton } = createFormActionsBar(closeMenus, 'Submit');
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
    createCommentAutocomplete(descriptionField.input as HTMLTextAreaElement, nodeData.nodeType as string, (nodeData.payload as Record<string, unknown> | undefined)?.id as string);

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
            assignedStrideId = Number(strideField.select.value);
        }
        const payload: Record<string, unknown> = {
            statement,
            description,
            flowId: (nodeData.payload as Record<string, unknown> | undefined)?.id,
            type: typeField.select.value,
            status: statusField.select.value,
            effortEstimate,
            assignedStrideId,
            displayOrder: (Math.trunc(Number(nodeData.childCount ?? 0)) || 0) + 1,
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
export function buildMomentStatusFormElement(
    nodeData: Record<string, unknown>,
    onGraphMutated: ((...arguments_: Record<string, unknown>[]) => unknown) | undefined,
    closeMenus: () => void,
): HTMLFormElement | undefined {
    const momentSeq = (nodeData?.payload as Record<string, unknown> | undefined)?.sequenceNumber;
    if (momentSeq === null) {
        return;
    }

    const flowId = (nodeData?.payload as Record<string, unknown> | undefined)?.flowId;

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
        options: STATUS_OPTIONS.map((o: { value: string; icon: string; label: string }) => ({ value: o.value, label: `${o.icon} ${o.label}` })),
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
            await updateMomentStatus(_contextState.owner, _contextState.project, momentSeq as string | number, statusField.select.value, flowId as number | undefined);
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
export function buildCreateFormElement(
    nodeData: Record<string, unknown>,
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
        value: defaults.statement as string,
        placeholder: `New ${actionMeta.entityLabel}`,
    });

    const descriptionField = createInputField({
        name: 'description',
        label: 'Description',
        type: 'textarea',
        value: defaults.description as string,
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
    createCommentAutocomplete(descriptionField.input as HTMLTextAreaElement, nodeData.nodeType as string, (nodeData.payload as Record<string, unknown> | undefined)?.id as string);

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
        const nextDisplayOrder = (Math.trunc(Number(nodeData.childCount ?? 0)) || 0) + 1;
        const payload: Record<string, unknown> = {
            statement,
            description: description || undefined,
            displayOrder: nextDisplayOrder,
        };

        if (actionMeta.parentField === 'projectId') {
            // projectId context is encoded in the endpoint URL; no separate body field needed
        } else {
            payload[actionMeta.parentField] = (nodeData.payload as Record<string, unknown> | undefined)?.id;
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
 * Build the DOM element for the context menu from a list of actions.
 * @param {{id: string, label: string, danger: boolean, disabled?: boolean, disabledReason?: string, handler: () => Promise<void>}[]} actions - The action definitions.
 * @returns {HTMLDivElement} The menu element.
 */
export function buildMenuElement(actions: Array<{
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
    isNodeChildrenHidden?: (nodeData: Record<string, unknown>) => boolean;
    setNodeChildrenHidden?: (nodeData: Record<string, unknown>, isHidden: boolean) => void;
    revealNextLevel?: (nodeData: Record<string, unknown>) => void;
    permission?: { permission?: string };
} = {}): {
    hide: () => void;
    destroy: () => void;
    open: (event: MouseEvent, nodeData: Record<string, unknown>) => void;
} {
    _contextState.owner = owner ?? '';
    _contextState.project = project ?? '';
    _contextState.permission = permission;
    let referenceRect: DOMRect | undefined;
    const virtualReference = document.createElement('div');
    const menuContent = document.createElement('div');
    const appendTarget = () => {
        const viewport = document.querySelector('#graph-viewport');
        if (viewport && document.fullscreenElement === viewport) return viewport;
        return document.body;
    };
    const formTippy = tippy(document.createElement('div'), {
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
        onHidden(instance: { setContent: (c: HTMLElement) => void; show: () => void; hide: () => void }) {
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
        formTippy.hide();
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
        formTippy.destroy?.();
        instance.destroy?.();
        menuContent.replaceChildren();
    }

    /**
     * Open a tippy popup with a form element.
     * @param {() => HTMLElement | undefined | null} buildForm - Function that builds the form element
     */
    function openForm(buildForm: () => HTMLElement | undefined | null) {
        const menuRect = referenceRect ?? new DOMRect(0, 0, 0, 0);
        const anchorRect = new DOMRect(menuRect.right + 12, menuRect.top, 1, 1);
        const form = buildForm();

        if (!form) {
            return;
        }

        formTippy.setProps({
            getReferenceClientRect: () => anchorRect,
        });
        formTippy.setContent(form);
        formTippy.show();
    }

    /**
     * Open the create-form tippy popup for a given node.
     * @param {object} nodeData - The parent node data.
     * @param {string} sourceOwner - The project owner's slug.
     * @param {string} sourceProject - The project's slug.
     * @param {(() => void) | undefined} refreshGraph - Callback to refresh the graph after creation.
     */
    function openCreateForm(nodeData: Record<string, unknown>, sourceOwner: string, sourceProject: string, refreshGraph: (() => void) | undefined) {
        openForm(() => buildCreateFormElement(nodeData, sourceOwner, sourceProject, getAvailableStrides, refreshGraph, closeMenus));
    }

    /**
     * Open the change-moment-status form tippy popup.
     * @param {object} nodeData - The moment node data.
     * @param {(() => void) | undefined} refreshGraph - Callback to refresh the graph after status update.
     */
    function openMomentStatusForm(nodeData: Record<string, unknown>, refreshGraph: (() => void) | undefined) {
        openForm(() => buildMomentStatusFormElement(nodeData, refreshGraph, closeMenus));
    }

    /**
     * Open the context menu at the given mouse event position.
     * @param {MouseEvent} event - The triggering mouse event.
     * @param {object} nodeData - The node data for which to show the context menu.
     */
    function open(event: MouseEvent, nodeData: Record<string, unknown>) {
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

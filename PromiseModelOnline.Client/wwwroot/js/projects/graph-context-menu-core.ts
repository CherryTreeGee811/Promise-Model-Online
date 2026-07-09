import { apiFetch } from '../api.ts';
import { ensureModal, createConfirmationPromise } from '../utils/html.ts';

const NODE_CHILD_LABELS: Record<string, string> = {
    root: 'Promise',
    promise: 'Epic',
    epic: 'Journey',
    journey: 'Flow',
    flow: 'Moment',
};

/**
 * Normalize a node type string to lowercase trimmed form.
 * @param {string} nodeType - The raw node type.
 * @returns {string} The normalized node type.
 */
export function normalizeNodeType(nodeType: string): string {
    return (nodeType ?? '').trim().toLowerCase();
}

/**
 * Get the display label for a graph node.
 * @param {Record<string, unknown>} nodeData - The node data.
 * @returns {string} The node's label text.
 */
function getNodeLabel(nodeData: Record<string, unknown>): string {
    const payload = (nodeData?.payload ?? {}) as Record<string, unknown>;
    return String(payload.statement ?? payload.name ?? `#${payload.id ?? ''}`).trim();
}

/**
 * Get the label for the child type of a given node type.
 * @param {string} nodeType - The parent node type.
 * @returns {string | undefined} The child type label, or undefined if not found.
 */
function getChildLabel(nodeType: string): string | undefined {
    return NODE_CHILD_LABELS[normalizeNodeType(nodeType)];
}

/**
 * Make an authenticated JSON API request.
 * @param {string} url - The request URL.
 * @param {Record<string, unknown>} options - Fetch options (headers, method, body, etc.).
 * @returns {Promise<unknown>} The parsed JSON response, or undefined for 204.
 * @throws {Error} If the request fails or returns a non-OK status.
 */
export async function requestJson(url: string, options: Record<string, unknown>): Promise<unknown> {
    const existingHeaders = (options.headers as Record<string, unknown> | undefined) ?? {};
    const response = await apiFetch(url, {
        mode: 'cors',
        ...options,
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
            ...existingHeaders,
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
 * Open a modal to confirm deletion of an item, returning a promise that resolves to true if confirmed.
 * Falls back to window.confirm if the modal element cannot be created.
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

    return createConfirmationPromise(modalElement, confirmButton);
}

type ContextMenuAction = {
    id: string;
    label: string;
    danger: boolean;
    disabled?: boolean;
    disabledReason?: string;
    handler: () => Promise<void>;
};

/**
 * Build the delete action definition for the context menu.
 * @param {Record<string, unknown>} nodeData - The node data.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {() => void} closeMenus - Function to close menus.
 * @param {(() => void) | undefined} onGraphMutated - Mutation callback.
 * @param {(() => void) | undefined} onProjectDeleted - Project deletion callback.
 * @param {boolean} canEdit - Whether the user has edit permission.
 * @returns {ContextMenuAction} The delete action definition.
 */
function buildDeleteAction(
    nodeData: Record<string, unknown>,
    owner: string,
    project: string,
    closeMenus: () => void,
    onGraphMutated: (() => void) | undefined,
    onProjectDeleted: (() => void) | undefined,
    canEdit: boolean,
): ContextMenuAction {
    return {
        id: 'delete',
        label: 'Delete',
        danger: true,
        disabled: !canEdit,
        disabledReason: 'Requires Edit permission.',
        handler: async () => {
            const label = getNodeLabel(nodeData) || normalizeNodeType(nodeData.nodeType as string) || 'item';
            const confirmationLabel = (nodeData.nodeType as string) === 'root' ? 'project' : label;
            closeMenus?.();

            const isConfirmed = await openDeleteConfirmationModal(confirmationLabel);
            if (!isConfirmed) {
                return;
            }

            const route = getDeleteRoute(nodeData.nodeType as string, (nodeData.payload as Record<string, unknown> | undefined)?.id as (string | number | undefined), owner, project);
            if (!route) {
                return;
            }

            if ((nodeData.nodeType as string) === 'root') {
                await requestJson(route, { method: 'DELETE' });
                onProjectDeleted?.();
                return;
            }

            await requestJson(route, { method: 'DELETE' });
            onGraphMutated?.();
        },
    };
}

/**
 * Compute child-related state for a given node.
 * @param {Record<string, unknown>} nodeData - The node data.
 * @param {((nodeData: Record<string, unknown>) => boolean) | undefined} isNodeChildrenHidden - Check if children are hidden.
 * @returns {{ childLabel: string | undefined; childCount: number; hiddenDescendantCount: number; canToggleChildren: boolean; isChildrenHidden: boolean }} The computed child state.
 */
function getChildState(
    nodeData: Record<string, unknown>,
    isNodeChildrenHidden: ((nodeData: Record<string, unknown>) => boolean) | undefined,
): { childLabel: string | undefined; childCount: number; hiddenDescendantCount: number; canToggleChildren: boolean; isChildrenHidden: boolean } {
    const childLabel = getChildLabel(nodeData.nodeType as string);
    const childCount = Math.trunc(Number(nodeData?.childCount ?? 0)) || 0;
    const hiddenDescendantCount = Math.trunc(Number(nodeData?._hiddenDescendantCount ?? 0)) || 0;
    const canToggleChildren = childCount > 0 || hiddenDescendantCount > 0;
    const isChildrenHidden = canToggleChildren && Boolean(isNodeChildrenHidden?.(nodeData));
    return { childLabel, childCount, hiddenDescendantCount, canToggleChildren, isChildrenHidden };
}

/**
 * Build the create-child action definition.
 * @param {Record<string, unknown>} nodeData - The parent node data.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {(() => void) | undefined} onGraphMutated - Mutation callback.
 * @param {(nodeData: Record<string, unknown>, owner: string, project: string, refreshGraph: (() => void) | undefined) => void} openCreateForm - Create form opener.
 * @param {string} childLabel - The label for the child type.
 * @param {boolean} canEdit - Whether the user has edit permission.
 * @returns {ContextMenuAction} The create-child action definition.
 */
function buildCreateChildAction(
    nodeData: Record<string, unknown>,
    owner: string,
    project: string,
    onGraphMutated: (() => void) | undefined,
    openCreateForm: (nodeData: Record<string, unknown>, owner: string, project: string, refreshGraph: (() => void) | undefined) => void,
    childLabel: string,
    canEdit: boolean,
): ContextMenuAction {
    return {
        id: 'create-child',
        label: `Create New ${childLabel}`,
        danger: false,
        disabled: !canEdit,
        disabledReason: 'Requires Edit permission.',
        handler: async () => {
            openCreateForm(nodeData, owner, project, onGraphMutated);
        },
    };
}

/**
 * Build the toggle-children action definition.
 * @param {Record<string, unknown>} nodeData - The node data.
 * @param {((nodeData: Record<string, unknown>, isHidden: boolean) => void) | undefined} setNodeChildrenHidden - Children visibility toggle.
 * @param {boolean} isChildrenHidden - Whether children are currently hidden.
 * @param {boolean} _canEdit - Whether the user has edit permission.
 * @returns {ContextMenuAction} The toggle action definition.
 */
function buildToggleChildrenAction(
    nodeData: Record<string, unknown>,
    setNodeChildrenHidden: ((nodeData: Record<string, unknown>, isHidden: boolean) => void) | undefined,
    isChildrenHidden: boolean,
    _canEdit: boolean,
): ContextMenuAction {
    return {
        id: isChildrenHidden ? 'reveal-children' : 'hide-children',
        label: isChildrenHidden ? 'Reveal Children' : 'Hide Children',
        danger: false,
        handler: async () => {
            await setNodeChildrenHidden?.(nodeData, !isChildrenHidden);
        },
    };
}

/**
 * Build the reveal-next-level action definition.
 * @param {Record<string, unknown>} nodeData - The node data.
 * @param {((nodeData: Record<string, unknown>) => void) | undefined} revealNextLevel - Next level revealer.
 * @returns {ContextMenuAction} The reveal action definition.
 */
function buildRevealNextLevelAction(
    nodeData: Record<string, unknown>,
    revealNextLevel: ((nodeData: Record<string, unknown>) => void) | undefined,
): ContextMenuAction {
    return {
        id: 'reveal-next-level',
        label: 'Reveal Next Level',
        danger: false,
        handler: async () => {
            await revealNextLevel?.(nodeData);
        },
    };
}

/**
 * Build the change-status action definition for moment nodes.
 * @param {Record<string, unknown>} nodeData - The moment node data.
 * @param {(() => void) | undefined} onGraphMutated - Mutation callback.
 * @param {(nodeData: Record<string, unknown>, refreshGraph: (() => void) | undefined) => void} openMomentStatusForm - Status form opener.
 * @param {boolean} canEdit - Whether the user has edit permission.
 * @returns {ContextMenuAction} The change-status action definition.
 */
function buildChangeStatusAction(
    nodeData: Record<string, unknown>,
    onGraphMutated: (() => void) | undefined,
    openMomentStatusForm: (nodeData: Record<string, unknown>, refreshGraph: (() => void) | undefined) => void,
    canEdit: boolean,
): ContextMenuAction {
    return {
        id: 'change-status',
        label: 'Change Status',
        danger: false,
        disabled: !canEdit,
        disabledReason: 'Requires Edit permission.',
        handler: async () => {
            openMomentStatusForm(nodeData, onGraphMutated);
        },
    };
}

/**
 * Build the list of context menu actions for a graph node based on its type and permissions.
 * @param {Record<string, unknown>} nodeData - The node data.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {(() => void) | undefined} onGraphMutated - Callback after any mutation.
 * @param {(() => void) | undefined} onProjectDeleted - Callback when the project is deleted.
 * @param {() => void} closeMenus - Function to close context menus.
 * @param {(nodeData: Record<string, unknown>, owner: string, project: string, refreshGraph: (() => void) | undefined) => void} openCreateForm - Create form opener.
 * @param {(nodeData: Record<string, unknown>, refreshGraph: (() => void) | undefined) => void} openMomentStatusForm - Moment status form opener.
 * @param {((nodeData: Record<string, unknown>) => boolean) | undefined} isNodeChildrenHidden - Function to check if children are hidden.
 * @param {((nodeData: Record<string, unknown>, isHidden: boolean) => void) | undefined} setNodeChildrenHidden - Function to toggle children visibility.
 * @param {((nodeData: Record<string, unknown>) => void) | undefined} revealNextLevel - Function to reveal the next level of children.
 * @param {{ permission?: string } | null | undefined} permission - The current user's permission object.
 * @returns {ContextMenuAction[]} The list of action definitions.
 */
export function buildMenuActions(
    nodeData: Record<string, unknown>,
    owner: string,
    project: string,
    onGraphMutated: (() => void) | undefined,
    onProjectDeleted: (() => void) | undefined,
    closeMenus: () => void,
    openCreateForm: (nodeData: Record<string, unknown>, owner: string, project: string, refreshGraph: (() => void) | undefined) => void,
    openMomentStatusForm: (nodeData: Record<string, unknown>, refreshGraph: (() => void) | undefined) => void,
    isNodeChildrenHidden: ((nodeData: Record<string, unknown>) => boolean) | undefined,
    setNodeChildrenHidden: ((nodeData: Record<string, unknown>, isHidden: boolean) => void) | undefined,
    revealNextLevel: ((nodeData: Record<string, unknown>) => void) | undefined,
    permission: { permission?: string } | null | undefined,
): ContextMenuAction[] {
    const canEdit = permission?.permission === 'Edit';
    const { childLabel, hiddenDescendantCount, canToggleChildren, isChildrenHidden } = getChildState(nodeData, isNodeChildrenHidden);
    const actions: ContextMenuAction[] = [];

    if (childLabel) {
        actions.push(buildCreateChildAction(nodeData, owner, project, onGraphMutated, openCreateForm, childLabel, canEdit));
    }
    if (canToggleChildren) {
        actions.push(buildToggleChildrenAction(nodeData, setNodeChildrenHidden, isChildrenHidden, canEdit));
    }
    if (isChildrenHidden && hiddenDescendantCount > 0) {
        actions.push(buildRevealNextLevelAction(nodeData, revealNextLevel));
    }
    if (normalizeNodeType(nodeData.nodeType as string) === 'moment') {
        actions.push(buildChangeStatusAction(nodeData, onGraphMutated, openMomentStatusForm, canEdit));
    }
    actions.push(buildDeleteAction(nodeData, owner, project, closeMenus, onGraphMutated, onProjectDeleted, canEdit));

    return actions;
}

/**
 * Get the API route for deleting a graph node by its type, ID, and project context.
 * @param {string} nodeType - The node type.
 * @param {string | number | undefined} nodeId - The node's ID.
 * @param {string} ownerSlug - The project owner's slug.
 * @param {string} projectSlug - The project's slug.
 * @returns {string | undefined} The delete API route, or undefined if invalid.
 */
function getDeleteRoute(nodeType: string, nodeId: string | number | undefined, ownerSlug: string, projectSlug: string): string | undefined {
    const normalizedType = normalizeNodeType(nodeType);

    if (normalizedType === 'root') {
        return `/api/projects/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(projectSlug)}`;
    }

    const numericId = Math.trunc(Number(nodeId));
    if (Number.isNaN(numericId)) return;

    switch (normalizedType) {
        case 'promise': { return `/api/projects/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(projectSlug)}/promises/${numericId}`; }
        case 'epic': { return `/api/projects/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(projectSlug)}/epics/${numericId}`; }
        case 'journey': { return `/api/projects/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(projectSlug)}/journeys/${numericId}`; }
        case 'flow': { return `/api/projects/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(projectSlug)}/flows/${numericId}`; }
        case 'moment': { return `/api/projects/${encodeURIComponent(ownerSlug)}/${encodeURIComponent(projectSlug)}/moments/${numericId}`; }
        default: { return; }
    }
}

// @ts-nocheck
import { getUserId } from '../auth-state.ts';
import { getStrides } from '../strides/api.ts';
import { escapeHtml } from '../utils/html.ts';
import { STATUS_OPTIONS } from '../utils/status-utilities.ts';

import { getGraphData } from './api.ts';
import { createGraphContextMenuController } from './graph-context-menu.ts';
import {
    NODE_TYPES,
    NODE_TYPE_INDEX,
    normalizeText,
    getStatusBucket,
    getNodeSearchText,
    getMomentEffortBucket,
    getMomentStrideBucket,
    createNode,
    findNodeById,
    countRenderableNodes,
    parseGraphData,
    renderEmptyState,
    renderStackGraph,
} from './stack-graph-core.ts';

interface GraphFilters {
    search: string;
    includeChildren: boolean;
    types: Set<string>;
    effort: string;
    stride: string;
    status: string;
    assignment: string;
}

interface FilterMetrics {
    visibleNodes: number;
    directMatches: number;
    hiddenNodes: number;
}

interface GraphNode {
    id: string;
    nodeType: string;
    children?: GraphNode[];
    payload?: Record<string, unknown>;
    _searchText?: string;
    _statusBucket?: string;
    _effortBucket?: string;
    _strideBucket?: string;
    _searchMatched?: boolean;
    _isCollapsed?: boolean;
    _hiddenDescendantCount?: number;
    [key: string]: unknown;
}

interface StrideInfo {
    id: number | string;
    name?: string;
    startDate?: string;
}

interface GraphState {
    owner: string | null;
    project: string | null;
    d3: unknown;
    rawTree: GraphNode | null;
    filteredTree: GraphNode | null;
    totalRenderableNodes: number;
    availableStrides: StrideInfo[];
    filters: GraphFilters;
    zoomTransform: unknown;
    userZoomTransform: unknown;
    focusNodeId: string | null;
    suppressZoomStateUpdate: boolean;
    zoomBehavior: unknown;
    filterDebounceId: number | null;
    applyTimer: number | null;
    contextMenu: unknown;
    pageShowRefreshHandler: ((event: PageTransitionEvent) => void) | null;
    collapsedNodeIds: Set<string>;
    hasRendered: boolean;
    animationSpeed: number;
    _onFullscreenChange?: (() => void) | null;
}

const graphState: GraphState = {
    owner: undefined,
    project: undefined,
    d3: undefined,
    rawTree: undefined,
    filteredTree: undefined,
    totalRenderableNodes: 0,
    availableStrides: [],
    filters: createDefaultFilters(),
    zoomTransform: undefined,
    userZoomTransform: undefined,
    focusNodeId: undefined,
    suppressZoomStateUpdate: false,
    zoomBehavior: undefined,
    filterDebounceId: undefined,
    applyTimer: undefined,
    contextMenu: undefined,
    pageShowRefreshHandler: undefined,
    collapsedNodeIds: new Set(),
    hasRendered: false,
    animationSpeed: 0.25,
};

/**
 * Check whether a graph node has child nodes.
 * @param {object} node - The graph node to check.
 * @returns {boolean} True if the node has children.
 */
function hasNodeChildren(node: GraphNode): boolean {
    return Array.isArray(node?.children) && node.children.length > 0;
}

/**
 * Check whether a node is currently collapsed in the graph.
 * @param {string} nodeId - The node ID to check.
 * @returns {boolean} True if the node is collapsed.
 */
function isNodeCollapsed(nodeId: string): boolean {
    return Boolean(nodeId) && graphState.collapsedNodeIds.has(nodeId);
}

/**
 * Set the collapsed state of a graph node.
 * @param {string} nodeId - The node ID.
 * @param {boolean} isCollapsed - Whether the node should be collapsed.
 */
function setNodeCollapsed(nodeId: string, isCollapsed: boolean): void {
    if (!nodeId) return;

    if (isCollapsed) {
        graphState.collapsedNodeIds.add(nodeId);
    } else {
        graphState.collapsedNodeIds.delete(nodeId);
    }
}

/**
 * Count how many renderable descendants are hidden under a collapsed node.
 * @param {object} node - The graph node.
 * @returns {number} The number of hidden descendants.
 */
function getHiddenDescendantCount(node: GraphNode): number {
    if (!hasNodeChildren(node)) return 0;

    return node.children!.reduce((sum, child) => sum + countRenderableNodes(child), 0);
}

/**
 * Reconcile the collapsed-node set against the current tree, removing IDs for nodes
 * that no longer exist or have no children.
 */
function reconcileCollapsedNodes(): void {
    if (!graphState.rawTree) {
        graphState.collapsedNodeIds.clear();
        return;
    }

    const reconciled = new Set<string>();
    for (const nodeId of graphState.collapsedNodeIds) {
        const node = findNodeById(graphState.rawTree, nodeId) as GraphNode | null;
        if (node && hasNodeChildren(node)) {
            reconciled.add(nodeId);
        }
    }

    graphState.collapsedNodeIds = reconciled;
}

/**
 * Collapse all top-level promise nodes so only their direct children are visible.
 */
function collapseAllBelowPromises(): void {
    if (!graphState.rawTree) return;

    const nextCollapsed = new Set<string>();
    const rawChildren = graphState.rawTree.children ?? [];
    for (const promiseNode of rawChildren) {
        if (hasNodeChildren(promiseNode)) {
            nextCollapsed.add(promiseNode.id);
        }
    }

    graphState.collapsedNodeIds = nextCollapsed;
}

/**
 * Reveal the next level of children for a node, collapsing its grandchildren.
 * @param {object} nodeData - The node data containing at least an id.
 */
function revealNextLevel(nodeData: GraphNode): void {
    if (!graphState.rawTree || !nodeData?.id) return;

    const node = findNodeById(graphState.rawTree, nodeData.id) as GraphNode | null;
    if (!node) return;

    setNodeCollapsed(node.id, false);

    const nodeChildren = node.children ?? [];
    for (const child of nodeChildren) {
        if (hasNodeChildren(child)) {
            setNodeCollapsed(child.id, true);
        }
    }
}

/**
 * Expand all collapsed nodes in the graph.
 */
function expandAllNodes(): void {
    graphState.collapsedNodeIds.clear();
}

/**
 * Check whether graph focus debug logging is enabled via URL param or localStorage.
 * @returns {boolean} True if debug logging is enabled.
 */
function isGraphFocusDebugEnabled(): boolean {
    try {
        const parameters = new URLSearchParams(location.search);
        const parameterValue = normalizeText(parameters.get('debugGraphFocus'));
        if (['1', 'true', 'yes', 'on'].includes(parameterValue)) {
            return true;
        }

        return globalThis.localStorage?.getItem('pmo.debugGraphFocus') === '1';
    } catch {
        return false;
    }
}

/**
 * Log graph focus debug information if debugging is enabled.
 * @param {string} stage - The debug stage label.
 * @param {object} details - The debug data to log.
 */
function logGraphFocus(stage: string, details: Record<string, unknown>): void {
    if (!isGraphFocusDebugEnabled()) return;
    console.info('[graph-focus]', stage, details);
}

/**
 * Create the default filter state for the graph.
 * @returns {{search: string, includeChildren: boolean, types: Set<string>, effort: string, stride: string, status: string, assignment: string}} The default filters.
 */
function createDefaultFilters(): GraphFilters {
    return {
        search: '',
        includeChildren: false,
        types: new Set(NODE_TYPES),
        effort: 'all',
        stride: 'all',
        status: 'all',
        assignment: 'all',
    };
}

/**
 * Parse a comma-separated type filter string into a set of node types.
 * @param {string} value - The raw type filter value.
 * @returns {Set<string>} The parsed set of node types.
 */
function parseTypeList(value: string | null): Set<string> {
    if (value === null) return new Set(NODE_TYPES);

    const types = new Set<string>();
    for (const item of value.split(',')) {
        const type = normalizeText(item);
        if (NODE_TYPES.includes(type)) {
            types.add(type);
        }
    }

    return normalizeTypeSelection(types);
}

/**
 * Normalize a type selection to a contiguous range of node types.
 * Ensures that if a user selects a leaf type, all ancestor types are also included.
 * @param {Set<string>} types - The raw set of selected types.
 * @returns {Set<string>} The normalized contiguous set of types.
 */
function normalizeTypeSelection(types: Set<string>): Set<string> {
    const selected = [...types ?? []].filter(type => NODE_TYPE_INDEX.has(type));
    if (selected.length === 0) return new Set();

    const selectedIndexes = selected.map(type => NODE_TYPE_INDEX.get(type) as number);
    const minIndex = Math.min(...selectedIndexes);
    const maxIndex = Math.max(...selectedIndexes);

    return new Set(NODE_TYPES.slice(minIndex, maxIndex + 1));
}

/**
 * Normalize a raw status filter value to a canonical bucket.
 * @param {string} value - The raw status filter value.
 * @returns {string} The normalized status bucket ('all', 'done', 'blocked', 'inprogress', 'todo', 'other').
 */
function getStatusFilterValue(value: string): string {
    const normalized = normalizeText(value);
    if (!normalized || normalized === 'all') return 'all';
    if (['done', 'blocked', 'inprogress', 'todo', 'other'].includes(normalized)) return normalized;
    if (normalized.includes('green') || normalized.includes('done')) return 'done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'inprogress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'todo';
    return 'other';
}

/**
 * Normalize a raw assignment filter value.
 * @param {string} value - The raw assignment filter value.
 * @returns {string} The normalized value ('all' or 'assigned-to-me').
 */
function getAssignmentFilterValue(value: string): string {
    const normalized = normalizeText(value);
    if (normalized === 'assigned-to-me') return 'assigned-to-me';
    return 'all';
}

/**
 * Normalize a raw effort filter value.
 * @param {string} value - The raw effort filter value.
 * @returns {string} The normalized effort bucket ('all', 'unestimated', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL').
 */
function getEffortFilterValue(value: string): string {
    const normalized = normalizeText(value);
    if (normalized === 'all' || normalized === 'unestimated') return normalized;
    if (['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'].includes(normalized)) return normalized.toUpperCase();
    return 'all';
}

/**
 * Normalize a raw stride filter value.
 * @param {string} value - The raw stride filter value.
 * @returns {string} The normalized stride bucket ('all', 'backlog', or a stride ID string).
 */
function getStrideFilterValue(value: string): string {
    const normalized = normalizeText(value);
    if (normalized === 'all' || normalized === 'backlog') return normalized;
    if (/^\d+$/.test(normalized)) return normalized;
    return 'all';
}

/**
 * Get the short display label for a node type (used in filter chips).
 * @param {string} nodeType - The node type key.
 * @returns {string} The short label.
 */
function getTypeShortLabel(nodeType: string): string {
    switch (nodeType) {
        case 'promise': { return 'Promise';
        }
        case 'epic': { return 'Epic';
        }
        case 'journey': { return 'Journey';
        }
        case 'flow': { return 'Flow';
        }
        case 'moment': { return 'Moment';
        }
        default: { return nodeType;
        }
    }
}

/**
 * Build a graph node for a moment entity.
 * @param {object} moment - The moment data.
 * @returns {object} The graph node.
 */
function buildMomentNode(moment: Record<string, unknown>): GraphNode {
    return createNode('moment', moment, []) as GraphNode;
}

/**
 * Build a graph node for a flow entity, including its moment children.
 * @param {object} flow - The flow data.
 * @returns {object} The graph node with children.
 */
function buildFlowNode(flow: Record<string, unknown>): GraphNode {
    const moments = ((flow.moments ?? []) as Record<string, unknown>[]).map(x => buildMomentNode(x));
    return createNode('flow', flow, moments) as GraphNode;
}

/**
 * Build a graph node for a journey entity, including its flow children.
 * @param {object} journey - The journey data.
 * @returns {object} The graph node with children.
 */
function buildJourneyNode(journey: Record<string, unknown>): GraphNode {
    const flows = ((journey.flows ?? []) as Record<string, unknown>[]).map(x => buildFlowNode(x));
    return createNode('journey', journey, flows) as GraphNode;
}

/**
 * Build a graph node for an epic entity, including its journey children.
 * @param {object} epic - The epic data.
 * @returns {object} The graph node with children.
 */
function buildEpicNode(epic: Record<string, unknown>): GraphNode {
    const journeys = ((epic.journeys ?? []) as Record<string, unknown>[]).map(x => buildJourneyNode(x));
    return createNode('epic', epic, journeys) as GraphNode;
}

/**
 * Build a graph node for a promise entity, including its epic children.
 * @param {object} promise - The promise data.
 * @returns {object} The graph node with children.
 */
function buildPromiseNode(promise: Record<string, unknown>): GraphNode {
    const epics = ((promise.epics ?? []) as Record<string, unknown>[]).map(x => buildEpicNode(x));
    return createNode('promise', promise, epics) as GraphNode;
}

/**
 * Check whether a node matches the current set of active filters.
 * @param {object} node - The graph node to test.
 * @param {object} filters - The active filter criteria.
 * @returns {boolean} True if the node passes all active filters.
 */
function isNodeMatching(node: GraphNode, filters: GraphFilters): boolean {
    if (node.nodeType === 'root') return false;

    if (!filters.types.has(node.nodeType)) return false;

    if (filters.search) {
        const searchText = node._searchText ?? getNodeSearchText(node) as string;
        if (!searchText.includes(filters.search)) return false;
    }

    if (filters.status !== 'all') {
        const statusBucket = node._statusBucket ?? getStatusBucket(node.payload?.statusColor as string) as string;
        if (statusBucket !== filters.status) return false;
    }

    if (filters.assignment === 'assigned-to-me') {
        if (node.nodeType !== 'moment') return false;

        const currentUserId = getUserId();
        if (currentUserId === null) return false;
        if (node.payload?.ownerId !== currentUserId) return false;
    }

    if (filters.effort !== 'all') {
        if (node.nodeType !== 'moment') return false;
        const effortBucket = node._effortBucket ?? getMomentEffortBucket(node.payload?.effortEstimate) as string;
        if (filters.effort !== effortBucket) return false;
    }

    if (filters.stride !== 'all') {
        if (node.nodeType !== 'moment') return false;
        const strideBucket = node._strideBucket ?? getMomentStrideBucket(node.payload) as string;
        if (filters.stride !== strideBucket) return false;
    }

    return true;
}

/**
 * Clone a subtree for rendering, applying collapse state and counting visible/hidden nodes.
 * @param {GraphNode} node - The root of the subtree to clone.
 * @param {{visibleNodes: number; hiddenNodes: number}} metrics - Accumulator for node counts.
 * @param {number} metrics.visibleNodes - The running count of visible nodes.
 * @param {number} metrics.hiddenNodes - The running count of hidden nodes.
 * @returns {GraphNode} The cloned subtree with collapse metadata.
 */
function cloneSubtree(node: GraphNode, metrics: { visibleNodes: number; hiddenNodes: number }): GraphNode {
    if (node.nodeType !== 'root') {
        metrics.visibleNodes += 1;
    }

    const isCollapsed = isNodeCollapsed(node.id);
    const hiddenDescendantCount = isCollapsed ? getHiddenDescendantCount(node) : 0;

    if (hiddenDescendantCount > 0) {
        metrics.hiddenNodes += hiddenDescendantCount;
    }

    return {
        ...node,
        _searchMatched: false,
        _isCollapsed: isCollapsed,
        _hiddenDescendantCount: hiddenDescendantCount,
        children: isCollapsed ? [] : (node.children ?? []).map(child => cloneSubtree(child, metrics)),
    };
}

/**
 * Recursively filter a graph tree according to the active filters.
 * Nodes that don't match are pruned; collapsed subtrees are summarized as a single node.
 * @param {object} node - The current tree node.
 * @param {object} filters - The active filter criteria.
 * @param {{visibleNodes: number, directMatches: number, hiddenNodes: number}} metrics - Accumulator for filter result metrics.
 * @param {boolean} [isRoot] - Whether this is the root node.
 * @returns {object} The filtered subtree, or null if nothing matches.
 */
function filterTree(node: GraphNode, filters: GraphFilters, metrics: FilterMetrics, isRoot: boolean = false): GraphNode | null {
    const isCollapsed = isNodeCollapsed(node.id);
    const hiddenDescendantCount = isCollapsed ? getHiddenDescendantCount(node) : 0;
    const searchMatched = !isRoot && filters.search && (node._searchText ?? getNodeSearchText(node) as string).includes(filters.search);

    if (searchMatched && filters.includeChildren && !isCollapsed) {
        metrics.directMatches += 1;
        return {
            ...cloneSubtree(node, metrics),
            _searchMatched: true,
        };
    }

    if (hiddenDescendantCount > 0) {
        metrics.hiddenNodes += hiddenDescendantCount;
    }

    const filteredChildren = isCollapsed
        ? []
        : (node.children ?? [])
            .map(child => filterTree(child, filters, metrics))
            .filter(Boolean) as GraphNode[];

    const isSelfMatches = !isRoot && isNodeMatching(node, filters);
    if (isSelfMatches) {
        metrics.directMatches += 1;
    }

    if (isRoot) {
        return {
            ...node,
            _searchMatched: false,
            _isCollapsed: isCollapsed,
            _hiddenDescendantCount: hiddenDescendantCount,
            children: filteredChildren,
        };
    }

    if (isSelfMatches || filteredChildren.length > 0) {
        metrics.visibleNodes += 1;
        return {
            ...node,
            _searchMatched: Boolean(searchMatched && filters.search),
            _isCollapsed: isCollapsed,
            _hiddenDescendantCount: hiddenDescendantCount,
            children: filteredChildren,
        };
    }

    return;
}

/**
 * Read filter state from the current URL search parameters.
 * @returns {{search: string, includeChildren: boolean, types: Set<string>, effort: string, stride: string, status: string, assignment: string}} The parsed filter state.
 */
function readFiltersFromUrl(): GraphFilters {
    const parameters = new URLSearchParams(location.search);
    const search = normalizeText(parameters.get('q'));
    const isIncludeChildren = parameters.get('children') === '1' || parameters.get('children') === 'true';
    const status = getStatusFilterValue(parameters.get('status') ?? '');
    const assignment = getAssignmentFilterValue(parameters.get('assignment') ?? '');
    const effort = getEffortFilterValue(parameters.get('effort') ?? '');
    const stride = getStrideFilterValue(parameters.get('stride') ?? '');
    const rawTypes = parameters.get('types');
    const types = rawTypes === null ? new Set(NODE_TYPES) : normalizeTypeSelection(parseTypeList(rawTypes));

    return {
        search,
        includeChildren: isIncludeChildren,
        status,
        assignment,
        effort,
        stride,
        types,
    };
}

/**
 * Read the graph focus node ID from the current URL search parameters.
 * @returns {string} The focus node ID, or null.
 */
function readGraphFocusFromUrl(): string | null {
    const parameters = new URLSearchParams(location.search);
    return (parameters.get('focus') ?? '').trim() || undefined;
}

/**
 * Synchronize the current filter state to the browser's URL search parameters.
 * @param {object} filters - The filter state to persist.
 */
function syncFiltersToUrl(filters: GraphFilters): void {
    const parameters = new URLSearchParams();

    if (filters.search) {
        parameters.set('q', filters.search);
    }

    if (filters.includeChildren) {
        parameters.set('children', '1');
    }

    const selectedTypes = NODE_TYPES.filter(type => filters.types.has(type));
    if (selectedTypes.length > 0 && selectedTypes.length < NODE_TYPES.length) {
        parameters.set('types', selectedTypes.join(','));
    } else if (selectedTypes.length === 0) {
        parameters.set('types', '');
    }

    if (filters.status !== 'all') {
        parameters.set('status', filters.status);
    }

    if (filters.assignment !== 'all') {
        parameters.set('assignment', filters.assignment);
    }

    if (filters.effort !== 'all') {
        parameters.set('effort', filters.effort);
    }

    if (filters.stride !== 'all') {
        parameters.set('stride', filters.stride);
    }

    if (graphState.focusNodeId) {
        parameters.set('focus', graphState.focusNodeId);
    }

    const nextUrl = `${location.pathname}${parameters.toString() ? `?${parameters.toString()}` : ''}${location.hash || ''}`;
    history.replaceState({ owner: graphState.owner, project: graphState.project }, '', nextUrl);
}

/**
 * Render the graph filter bar UI with all filter controls.
 */
function renderFilterBar(): void {
    const filterBar = document.querySelector('#graph-filter-bar') as HTMLElement | null;
    if (!filterBar) return;

    const strideOptions = [
        `<option value="all" ${graphState.filters.stride === 'all' ? 'selected' : ''}>All strides</option>`,
        `<option value="backlog" ${graphState.filters.stride === 'backlog' ? 'selected' : ''}>Backlog</option>`,
        ...graphState.availableStrides.map(stride => {
            const label = stride.name ? `Stride #${stride.id} - ${escapeHtml(stride.name)}` : `Stride #${stride.id}`;
            return `<option value="${String(stride.id)}" ${graphState.filters.stride === String(stride.id) ? 'selected' : ''}>${label}</option>`;
        }),
    ].join('');

    const typeChips = NODE_TYPES.map(nodeType => {
        const checked = graphState.filters.types.has(nodeType) ? 'checked' : '';
        return `
            <label class="graph-filter-chip">
                <input type="checkbox" data-filter-type value="${nodeType}" ${checked} />
                <span>${getTypeShortLabel(nodeType)}</span>
            </label>
        `;
    }).join('');

    filterBar.innerHTML = `
        <div class="graph-filter-row">
            <div class="graph-filter-search-group">
                <label class="graph-filter-field">
                    <span>Search</span>
                    <input id="graph-filter-search" class="graph-filter-input" type="search" placeholder="Search statements or descriptions" value="${escapeHtml(graphState.filters.search)}" />
                </label>

                <div class="graph-filter-field graph-filter-checkbox-field">
                    <span>Search options</span>
                    <div class="form-check form-switch graph-filter-switch">
                        <input id="graph-filter-include-children" class="form-check-input" type="checkbox" role="switch" ${graphState.filters.includeChildren ? 'checked' : ''} />
                        <label class="form-check-label graph-filter-switch-label" for="graph-filter-include-children">Include Children</label>
                    </div>
                </div>
            </div>

            <label class="graph-filter-field">
                <span>Effort estimate</span>
                <select id="graph-filter-effort" class="graph-filter-select">
                    <option value="all" ${graphState.filters.effort === 'all' ? 'selected' : ''}>All efforts</option>
                    <option value="unestimated" ${graphState.filters.effort === 'unestimated' ? 'selected' : ''}>Unestimated</option>
                    <option value="XS" ${graphState.filters.effort === 'XS' ? 'selected' : ''}>XS</option>
                    <option value="S" ${graphState.filters.effort === 'S' ? 'selected' : ''}>S</option>
                    <option value="M" ${graphState.filters.effort === 'M' ? 'selected' : ''}>M</option>
                    <option value="L" ${graphState.filters.effort === 'L' ? 'selected' : ''}>L</option>
                    <option value="XL" ${graphState.filters.effort === 'XL' ? 'selected' : ''}>XL</option>
                    <option value="XXL" ${graphState.filters.effort === 'XXL' ? 'selected' : ''}>XXL</option>
                    <option value="XXXL" ${graphState.filters.effort === 'XXXL' ? 'selected' : ''}>XXXL</option>
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Stride</span>
                <select id="graph-filter-stride" class="graph-filter-select">
                    ${strideOptions}
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Moment status</span>
                <select id="graph-filter-status" class="graph-filter-select">
                    <option value="all" ${graphState.filters.status === 'all' ? 'selected' : ''}>All statuses</option>
                    ${STATUS_OPTIONS.map(opt => {
                        const value = opt.value.toLowerCase();
                        return `<option value="${value}" ${graphState.filters.status === value ? 'selected' : ''}>${opt.icon} ${opt.label}</option>`;
                    }).join('')}
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Assigned to me</span>
                <select id="graph-filter-assignment" class="graph-filter-select">
                    <option value="all" ${graphState.filters.assignment === 'all' ? 'selected' : ''}>All</option>
                    <option value="assigned-to-me" ${graphState.filters.assignment === 'assigned-to-me' ? 'selected' : ''}>Assigned to me</option>
                </select>
            </label>
        </div>

        <div class="graph-filter-bottom">
            <fieldset class="graph-filter-types">
                <legend class="graph-filter-group-label">Promise types</legend>
                <div class="graph-filter-chip-list">
                    ${typeChips}
                </div>
            </fieldset>

            <div class="graph-filter-bottom-row">
                <div id="graph-filter-summary" class="graph-filter-summary" aria-live="polite"></div>

                <div class="graph-filter-actions">
                    <button id="graph-filter-reset" type="button" class="btn btn-outline-danger btn-sm">Reset</button>
                    <button id="graph-filter-hide-all" type="button" class="btn btn-outline-secondary btn-sm">Hide All</button>
                    <button id="graph-filter-expand-all" type="button" class="btn btn-outline-secondary btn-sm">Expand All</button>
                    <button id="graph-filter-refresh" type="button" class="btn btn-outline-primary btn-sm">Refresh</button>
                </div>
            </div>
        </div>
    `;

    bindFilterControls();
}

/**
 * Toggle the graph loading spinner visibility.
 * @param {boolean} isLoading - Whether the graph is in a loading state.
 */
function setGraphLoading(isLoading: boolean): void {
    const loadingState = document.querySelector('#graph-loading-state') as HTMLElement | null;
    if (loadingState) {
        loadingState.hidden = !isLoading;
        loadingState.classList.toggle('d-none', !isLoading);
        loadingState.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
    }
}

/**
 * Bind a single filter control to its change handler and filter apply trigger.
 * @param {string} id - The element ID.
 * @param {string} eventType - The DOM event type to listen for.
 * @param {(el: HTMLInputElement | HTMLSelectElement, f: GraphFilters) => void} setter - The function to update filter state from the element.
 * @param {boolean} [isImmediate] - Whether to apply filters immediately (true) or debounced (false).
 */
function bindFilter(id: string, eventType: string, setter: (element: HTMLInputElement | HTMLSelectElement, f: GraphFilters) => void, isImmediate?: boolean): void {
    const element = document.querySelector(`#${CSS.escape(id)}`) as HTMLInputElement | HTMLSelectElement | null;
    if (!element) return;
    element.addEventListener(eventType, () => {
        setter(element, graphState.filters);
        (isImmediate ? requestApplyFilters : scheduleFilterApply)();
    });
}

/**
 * Bind event handlers to all filter controls in the filter bar.
 */
function bindFilterControls(): void {
    bindFilter('graph-filter-search', 'input', (element, f) => { f.search = normalizeText((element as HTMLInputElement).value); });
    bindFilter('graph-filter-include-children', 'change', (element, f) => { f.includeChildren = (element as HTMLInputElement).checked; }, true);
    bindFilter('graph-filter-effort', 'change', (element, f) => { f.effort = getEffortFilterValue((element as HTMLSelectElement).value); }, true);
    bindFilter('graph-filter-stride', 'change', (element, f) => { f.stride = getStrideFilterValue((element as HTMLSelectElement).value); }, true);
    bindFilter('graph-filter-status', 'change', (element, f) => { f.status = getStatusFilterValue((element as HTMLSelectElement).value); }, true);
    bindFilter('graph-filter-assignment', 'change', (element, f) => { f.assignment = getAssignmentFilterValue((element as HTMLSelectElement).value); }, true);

    const resetButton = document.querySelector('#graph-filter-reset') as HTMLElement | null;
    const hideAllButton = document.querySelector('#graph-filter-hide-all') as HTMLElement | null;
    const expandAllButton = document.querySelector('#graph-filter-expand-all') as HTMLElement | null;
    const refreshButton = document.querySelector('#graph-filter-refresh') as HTMLElement | null;

    for (const input of document.querySelectorAll<HTMLInputElement>('[data-filter-type]')) {
        input.addEventListener('change', (event) => {
            const changed = event.target as HTMLInputElement;
            const isChecked = !!changed.checked;

            // Work off a copy of the previous selection to avoid extra DOM reads.
            const previousTypes = new Set(graphState.filters.types);

            // If the user just unchecked a type and previously all types were selected,
            // deselect this type and every type after it (inverse cascade).
            if (!isChecked && NODE_TYPES.every(t => previousTypes.has(t))) {
                const index = NODE_TYPES.indexOf(changed.value);
                if (index !== -1) {
                    for (let index_ = index; index_ < NODE_TYPES.length; index_++) {
                        const value = NODE_TYPES[index_];
                        // Update the DOM checkbox to reflect the cascade
                        const element = document.querySelector<HTMLInputElement>(`[data-filter-type][value="${CSS.escape(value)}"]`);
                        if (element) element.checked = false;
                        previousTypes.delete(value);
                    }
                }
            } else {
                // Apply the single change to the copy
                if (isChecked) previousTypes.add(changed.value); else previousTypes.delete(changed.value);
            }

            const selectedTypes = normalizeTypeSelection(previousTypes);
            graphState.filters.types = selectedTypes;
            syncControlsToFilters();
            requestApplyFilters();
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            graphState.filters = createDefaultFilters();
            expandAllNodes();
            syncControlsToFilters();
            requestApplyFilters();
        });
    }

    if (hideAllButton) {
        hideAllButton.addEventListener('click', () => {
            collapseAllBelowPromises();
            requestApplyFilters(0);
        });
    }

    if (expandAllButton) {
        expandAllButton.addEventListener('click', () => {
            expandAllNodes();
            requestApplyFilters(0);
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            void reloadGraphData();
        });
    }
}

const FILTER_FIELDS: [string, 'value' | 'checked', keyof GraphFilters][] = [
  ['graph-filter-search', 'value', 'search'],
  ['graph-filter-include-children', 'checked', 'includeChildren'],
  ['graph-filter-effort', 'value', 'effort'],
  ['graph-filter-stride', 'value', 'stride'],
  ['graph-filter-status', 'value', 'status'],
  ['graph-filter-assignment', 'value', 'assignment'],
];

/**
 * Synchronize the filter control DOM elements to reflect the current filter state.
 */
function syncControlsToFilters(): void {
    for (const [id, property, key] of FILTER_FIELDS) {
        const element = document.querySelector(`#${CSS.escape(id)}`) as HTMLInputElement | HTMLSelectElement | null;
        if (element) (element as unknown as Record<string, unknown>)[property] = graphState.filters[key];
    }
    for (const input of document.querySelectorAll<HTMLInputElement>('[data-filter-type]')) {
        input.checked = graphState.filters.types.has(input.value);
    }
}

/**
 * Schedule a debounced filter application for input-based filters.
 * Uses a longer debounce to avoid excessive re-renders during typing.
 */
function scheduleFilterApply(): void {
    if (graphState.filterDebounceId) {
        clearTimeout(graphState.filterDebounceId);
    }

    graphState.filterDebounceId = setTimeout(() => {
        applyFilters();
    }, 150);
}

/**
 * Request a filter application, debounced to avoid repeated heavy D3 renders.
 * @param {number} [delay] - The debounce delay in milliseconds.
 */
function requestApplyFilters(delay: number = 40): void {
    if (graphState.applyTimer) {
        clearTimeout(graphState.applyTimer);
    }

    graphState.applyTimer = setTimeout(() => {
        delete graphState.applyTimer;
        applyFilters();
    }, delay);
}

/**
 * Update the filter summary text that shows visible/total/hidden node counts.
 * @param {{visibleNodes: number, directMatches: number, hiddenNodes: number}} metrics - The filter result metrics.
 */
function updateFilterSummary(metrics: FilterMetrics): void {
    const summaryElement = document.querySelector('#graph-filter-summary') as HTMLElement | null;
    if (!summaryElement) return;

    if (!graphState.rawTree) {
        summaryElement.textContent = 'Loading graph...';
        return;
    }

    if (metrics.visibleNodes === 0) {
        summaryElement.textContent = 'No promises match the current filters.';
        return;
    }

    const visibleLabel = `${metrics.visibleNodes} visible promise${metrics.visibleNodes === 1 ? '' : 's'}`;
    const totalLabel = `${graphState.totalRenderableNodes} total promise${graphState.totalRenderableNodes === 1 ? '' : 's'}`;

    if (metrics.directMatches === metrics.visibleNodes) {
        summaryElement.textContent = `Showing ${visibleLabel} of ${totalLabel}${metrics.hiddenNodes > 0 ? ` (${metrics.hiddenNodes} hidden)` : ''}.`;
        return;
    }

    summaryElement.textContent = `Showing ${visibleLabel} of ${totalLabel} (${metrics.directMatches} direct match${metrics.directMatches === 1 ? '' : 'es'}${metrics.hiddenNodes > 0 ? `, ${metrics.hiddenNodes} hidden` : ''}).`;
}

/**
 * Find the first node in the tree that matched the current search filter.
 * @param {object} treeData - The tree root to search.
 * @returns {object|undefined} The first matching node, or undefined.
 */
function findFirstSearchMatch(treeData: GraphNode): GraphNode | undefined {
    if (!treeData) return;

    if (treeData._searchMatched) {
        return treeData;
    }

    const treeChildren = treeData.children ?? [];
    for (const child of treeChildren) {
        const match = findFirstSearchMatch(child);
        if (match) {
            return match;
        }
    }

    return;
}

/**
 * Initialize zoom control buttons (zoom in, zoom out, reset, fullscreen).
 * @param {object} zoomBehavior - The D3 zoom behavior instance.
 * @param {SVGElement} svgNode - The SVG element to apply zoom transforms to.
 * @param {object} d3Instance - The D3 module instance.
 */
function initZoomControls(zoomBehavior: unknown, svgNode: SVGElement, d3Instance: Record<string, unknown>): void {
    if (!zoomBehavior || !svgNode || !d3Instance) return;

    const selection = (d3Instance.select as (sel: string | Element | null) => { transition: () => { duration: (ms: number) => { call: (zoom: unknown, ...arguments_: unknown[]) => void } } })(svgNode);

    document.querySelector('#graph-zoom-in')?.addEventListener('click', () => {
        selection.transition().duration(200).call((zoomBehavior as { scaleBy: unknown }).scaleBy, 1.4);
    });

    document.querySelector('#graph-zoom-out')?.addEventListener('click', () => {
        selection.transition().duration(200).call((zoomBehavior as { scaleBy: unknown }).scaleBy, 0.7);
    });

    document.querySelector('#graph-zoom-reset')?.addEventListener('click', () => {
        selection.transition().duration(200).call((zoomBehavior as { transform: unknown }).transform, (d3Instance as { zoomIdentity: unknown }).zoomIdentity);
    });

    const fullscreenButton = document.querySelector('#graph-fullscreen-btn') as HTMLElement | null;
    fullscreenButton?.addEventListener('click', () => {
        const viewport = document.querySelector('#graph-viewport') as HTMLElement;
        if (document.fullscreenElement) {
            void document.exitFullscreen?.();
        } else {
            void (viewport as unknown as { requestFullscreen?: () => Promise<void> }).requestFullscreen?.();
        }
    });
}

/**
 * Render (or re-render) the graph tree into the graph content container.
 * @param {HTMLElement} _contentDiv - The graph content div (unused, kept for signature).
 * @param {object} d3 - The D3 module instance.
 * @param {object} treeData - The tree data to render.
 * @param {object} [restoreTransform] - A D3 zoom transform to restore.
 * @param {object} [focusNodeData] - A specific node to focus on.
 * @param {boolean} [isAnimate] - Whether to animate the transition.
 */
function renderTree(_contentDiv: HTMLElement, d3: Record<string, unknown>, treeData: GraphNode, restoreTransform: unknown = undefined, focusNodeData: GraphNode | undefined = undefined, isAnimate: boolean = false): void {
    const graphContent = document.querySelector('#graph-content') as HTMLElement | null;
    if (!graphContent) return;

    const graphViewport = document.querySelector('#graph-viewport') as HTMLElement | null;

    (graphState.contextMenu as { hide?: () => void } | null)?.hide?.();

    const speedElement = document.querySelector('#graph-animation-speed') as HTMLInputElement | null;
    graphState.animationSpeed = speedElement ? Number.parseFloat(speedElement.value) || 1 : 1;

    const result = renderStackGraph(graphContent, d3, treeData, {
        owner: graphState.owner,
        project: graphState.project,
        focusNodeId: focusNodeData?.id ?? undefined,
        focusNodeData,
        animate: isAnimate,
        animationSpeed: graphState.animationSpeed,
        enableZoom: true,
        compact: false,
        renderRootCard: true,
        restoreTransform,
        viewportElement: graphViewport,
        clipPathIdPrefix: 'graph-card-clip',
        emptyMessage: 'No cards match the current filters.',
        onZoom: (transform: unknown, meta: { user?: boolean } = {}) => {
            graphState.zoomTransform = transform;
            if (meta.user && !graphState.suppressZoomStateUpdate) {
                graphState.userZoomTransform = transform;
            }
        },
        onContextMenu: (event: Event, nodeData: GraphNode) => {
            (graphState.contextMenu as { open?: (event: Event, nodeData: GraphNode) => void } | null)?.open?.(event, nodeData);
        },
    }) as { zoom?: unknown; node?: SVGElement } | null;

    if (result?.zoom) {
        graphState.zoomBehavior = result.zoom;
        if (result.node) {
            initZoomControls(result.zoom, result.node, d3);
        }
    }
}

/**
 * Apply the current filters to the graph tree and re-render the visualization.
 */
function applyFilters(): void {
    if (!graphState.rawTree || !graphState.d3) {
        return;
    }

    const metrics: FilterMetrics = { visibleNodes: 0, directMatches: 0, hiddenNodes: 0 };
    graphState.filteredTree = filterTree(graphState.rawTree, graphState.filters, metrics, true);
    const isAnimate = graphState.hasRendered;

    syncFiltersToUrl(graphState.filters);

    const graphContent = document.querySelector('#graph-content') as HTMLElement | null;
    if (graphState.filteredTree) {
        let focusNode: GraphNode | null;
        if (graphState.filters.search) {
            focusNode = findFirstSearchMatch(graphState.filteredTree);
        } else if (graphState.focusNodeId) {
            focusNode = findNodeById(graphState.filteredTree, graphState.focusNodeId) as GraphNode | null;
        } else if (graphState.userZoomTransform) {
            focusNode = undefined;
        } else {
            focusNode = graphState.filteredTree;
        }

        logGraphFocus('apply-filters-focus-selection', {
            requestedFocusNodeId: graphState.focusNodeId,
            selectedFocusNodeId: focusNode?.id ?? undefined,
            selectedFocusNodeType: focusNode?.nodeType ?? undefined,
            hasUserZoomTransform: Boolean(graphState.userZoomTransform),
            searchFilter: graphState.filters.search,
            includeChildren: graphState.filters.includeChildren,
            visibleNodeCount: metrics.visibleNodes,
            directMatches: metrics.directMatches,
            hiddenNodeCount: metrics.hiddenNodes,
        } as Record<string, unknown>);

        const restoreTransform = focusNode ? undefined : (graphState.userZoomTransform ?? graphState.zoomTransform);
        renderTree(graphContent!, graphState.d3 as Record<string, unknown>, graphState.filteredTree, restoreTransform, focusNode, isAnimate);
    } else {
        renderEmptyState(graphContent, 'No cards match the current filters.');
    }

    graphState.hasRendered = true;
    updateFilterSummary(metrics);
}

/**
 * Reload the full graph data from the server and re-render.
 */
async function reloadGraphData(): Promise<void> {
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const successElement = document.querySelector('#success-text') as HTMLElement | null;

    setGraphLoading(true);
    if (errorElement) errorElement.textContent = '';
    if (successElement) successElement.textContent = '';

    try {
        const graphData = await getGraphData(graphState.owner, graphState.project) as Record<string, unknown>;

        const project = {
            id: graphData.id ?? graphData.Id,
            name: graphData.name ?? graphData.Name,
            description: graphData.description ?? graphData.Description,
        };

        const rootPromises = ((graphData.promises ?? graphData.Promises ?? []) as Record<string, unknown>[]).map(x => buildPromiseNode(x));

        graphState.rawTree = parseGraphData(rootPromises, graphState.owner, graphState.project, project) as GraphNode;
        reconcileCollapsedNodes();
        graphState.totalRenderableNodes = countRenderableNodes(graphState.rawTree);
        applyFilters();

        if (successElement) successElement.textContent = `Loaded ${rootPromises.length} top-level promise${rootPromises.length === 1 ? '' : 's'}.`;
    } catch (error) {
        console.error('Error loading project graph:', error);
        if (errorElement) errorElement.textContent = 'Unable to load the project graph.';
    } finally {
        setGraphLoading(false);
    }
}

/**
 * Load the list of available strides for the stride filter.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 */
async function loadAvailableStrides(owner: string, project: string): Promise<void> {
    const strides = await getStrides(owner, project) as StrideInfo[];
    graphState.availableStrides = (Array.isArray(strides) ? [...strides] : [])
        .toSorted((left, right) => {
            const leftStart = new Date(left.startDate ?? 0).getTime();
            const rightStart = new Date(right.startDate ?? 0).getTime();
            if (leftStart !== rightStart) return leftStart - rightStart;
            return Number(left.id) - Number(right.id);
        });
}

/**
 * Load the project hierarchy graph visualization page with filtering, zoom, and context menus.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {Record<string, unknown> } permission - The current user's permission object for the project.
 * @returns {Promise<void>} Resolves when the graph page is fully loaded and rendered.
 */
export async function loadGraphPage(owner: string, project: string, contentDiv: HTMLElement, permission: Record<string, unknown> | null): Promise<void> {
    const errorElement = document.querySelector('#error-text') as HTMLElement | null;
    const successElement = document.querySelector('#success-text') as HTMLElement | null;

    if (graphState.pageShowRefreshHandler) {
        window.removeEventListener('pageshow', graphState.pageShowRefreshHandler);
        delete graphState.pageShowRefreshHandler;
    }

    graphState.owner = owner;
    graphState.project = project;
    graphState.d3 = (globalThis as unknown as Record<string, unknown>).d3;
    graphState.filters = readFiltersFromUrl();
    graphState.focusNodeId = readGraphFocusFromUrl();
    delete graphState.zoomTransform;
    delete graphState.userZoomTransform;
    graphState.suppressZoomStateUpdate = false;
    delete graphState.rawTree;
    delete graphState.filteredTree;
    graphState.totalRenderableNodes = 0;
    graphState.availableStrides = [];
    graphState.collapsedNodeIds = new Set();
    graphState.hasRendered = false;

    (graphState.contextMenu as { destroy?: () => void } | null)?.destroy?.();
    graphState.contextMenu = createGraphContextMenuController({
        owner,
        project,
        getAvailableStrides: () => graphState.availableStrides,
        onGraphMutated: reloadGraphData,
        isNodeChildrenHidden: (nodeData: GraphNode) => isNodeCollapsed(nodeData?.id),
        setNodeChildrenHidden: async (nodeData: GraphNode, isHidden: boolean) => {
            const nodeId = nodeData?.id;
            if (!nodeId) return;

            setNodeCollapsed(nodeId, isHidden);
            requestApplyFilters(0);
        },
        revealNextLevel: async (nodeData: GraphNode) => {
            revealNextLevel(nodeData);
            requestApplyFilters(0);
        },
        onProjectDeleted: () => {
            location.assign('/projects');
        },
        permission,
    });

    graphState.pageShowRefreshHandler = (event: PageTransitionEvent) => {
        if (!event.persisted) return;
        void reloadGraphData();
    };
    window.addEventListener('pageshow', graphState.pageShowRefreshHandler);

    document.removeEventListener('fullscreenchange', graphState._onFullscreenChange as (() => void) | null);
    graphState._onFullscreenChange = () => {
        const button = document.querySelector('#graph-fullscreen-btn') as HTMLElement | null;
        if (!button) return;
        const icon = button.querySelector('i');
        if (document.fullscreenElement) {
            icon?.classList.replace('bi-arrows-angle-expand', 'bi-arrows-angle-contract');
            button.setAttribute('aria-label', 'Exit fullscreen');
        } else {
            icon?.classList.replace('bi-arrows-angle-contract', 'bi-arrows-angle-expand');
            button.setAttribute('aria-label', 'Fullscreen');
        }
        applyFilters();
    };
    document.addEventListener('fullscreenchange', graphState._onFullscreenChange);

    await loadAvailableStrides(owner, project);

    renderFilterBar();
    syncControlsToFilters();

    if (errorElement) errorElement.textContent = '';
    if (successElement) successElement.textContent = '';
    setGraphLoading(true);

    await reloadGraphData();
}

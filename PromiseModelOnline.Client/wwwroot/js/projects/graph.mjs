import { getProjectById, getProjectPromises } from './api.mjs';
import { getIterationsByProject } from '../iterations/api.mjs';
import { getEpicsByPromise } from '../promises/api.mjs';
import { getJourneysByEpic } from '../epics/api.mjs';
import { getFlowsByJourney } from '../journeys/api.mjs';
import { getStridesByIteration } from '../strides/api.mjs';
import { getMomentsByFlow } from '../flows/api.mjs';
import { createGraphContextMenuController } from './graph-context-menu.mjs';
import {
    NODE_TYPES,
    NODE_TYPE_INDEX,
    normalizeText,
    getStatusBucket,
    getNodeSearchText,
    getMomentEffortBucket,
    getMomentStrideBucket,
    sortByDisplayOrder,
    createNode,
    findNodeById,
    countRenderableNodes,
    parseGraphData,
    renderEmptyState,
    renderStackGraph,
} from './stack-graph-core.mjs';

const graphState = {
    projectId: null,
    d3: null,
    rawTree: null,
    filteredTree: null,
    totalRenderableNodes: 0,
    availableStrides: [],
    filters: createDefaultFilters(),
    zoomTransform: null,
    userZoomTransform: null,
    focusNodeId: null,
    suppressZoomStateUpdate: false,
    filterDebounceId: null,
    applyTimer: null,
    contextMenu: null,
    pageShowRefreshHandler: null,
    collapsedNodeIds: new Set(),
};

function hasNodeChildren(node) {
    return Array.isArray(node?.children) && node.children.length > 0;
}

function isNodeCollapsed(nodeId) {
    return Boolean(nodeId) && graphState.collapsedNodeIds.has(nodeId);
}

function setNodeCollapsed(nodeId, collapsed) {
    if (!nodeId) return;

    if (collapsed) {
        graphState.collapsedNodeIds.add(nodeId);
    } else {
        graphState.collapsedNodeIds.delete(nodeId);
    }
}

function getHiddenDescendantCount(node) {
    if (!hasNodeChildren(node)) return 0;

    return node.children.reduce((sum, child) => sum + countRenderableNodes(child), 0);
}

function reconcileCollapsedNodes() {
    if (!graphState.rawTree) {
        graphState.collapsedNodeIds.clear();
        return;
    }

    const reconciled = new Set();
    for (const nodeId of graphState.collapsedNodeIds) {
        const node = findNodeById(graphState.rawTree, nodeId);
        if (node && hasNodeChildren(node)) {
            reconciled.add(nodeId);
        }
    }

    graphState.collapsedNodeIds = reconciled;
}

function collapseAllBelowPromises() {
    if (!graphState.rawTree) return;

    const nextCollapsed = new Set();
    for (const promiseNode of graphState.rawTree.children ?? []) {
        if (hasNodeChildren(promiseNode)) {
            nextCollapsed.add(promiseNode.id);
        }
    }

    graphState.collapsedNodeIds = nextCollapsed;
}

function expandAllNodes() {
    graphState.collapsedNodeIds.clear();
}

function isGraphFocusDebugEnabled() {
    try {
        const params = new URLSearchParams(window.location.search);
        const paramValue = normalizeText(params.get('debugGraphFocus'));
        if (paramValue === '1' || paramValue === 'true' || paramValue === 'yes' || paramValue === 'on') {
            return true;
        }

        return window.localStorage?.getItem('pmo.debugGraphFocus') === '1';
    } catch {
        return false;
    }
}

function logGraphFocus(stage, details) {
    if (!isGraphFocusDebugEnabled()) return;
    console.info('[graph-focus]', stage, details);
}

function createDefaultFilters() {
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

function parseTypeList(value) {
    if (value == null) return new Set(NODE_TYPES);

    const types = new Set();
    for (const item of String(value).split(',')) {
        const type = normalizeText(item);
        if (NODE_TYPES.includes(type)) {
            types.add(type);
        }
    }

    return normalizeTypeSelection(types);
}

function normalizeTypeSelection(types) {
    const selected = Array.from(types ?? []).filter(type => NODE_TYPE_INDEX.has(type));
    if (selected.length === 0) return new Set();

    const selectedIndexes = selected.map(type => NODE_TYPE_INDEX.get(type));
    const minIndex = Math.min(...selectedIndexes);
    const maxIndex = Math.max(...selectedIndexes);

    return new Set(NODE_TYPES.slice(minIndex, maxIndex + 1));
}

function getStatusFilterValue(value) {
    const normalized = normalizeText(value);
    if (!normalized || normalized === 'all') return 'all';
    if (['done', 'blocked', 'inprogress', 'todo', 'other'].includes(normalized)) return normalized;
    if (normalized.includes('green') || normalized.includes('done')) return 'done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'inprogress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'todo';
    return 'other';
}

function getAssignmentFilterValue(value) {
    const normalized = normalizeText(value);
    if (normalized === 'assigned' || normalized === 'unassigned') return normalized;
    return 'all';
}

function getEffortFilterValue(value) {
    const normalized = normalizeText(value);
    if (normalized === 'all' || normalized === 'unestimated') return normalized;
    if (['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'].includes(normalized)) return normalized.toUpperCase();
    return 'all';
}

function getStrideFilterValue(value) {
    const normalized = normalizeText(value);
    if (normalized === 'all' || normalized === 'backlog') return normalized;
    if (/^\d+$/.test(normalized)) return normalized;
    return 'all';
}

function getTypeLabel(nodeType) {
    switch (nodeType) {
        case 'promise': return 'Product Promise';
        case 'epic': return 'Epic';
        case 'journey': return 'Journey';
        case 'flow': return 'Flow';
        case 'moment': return 'Moment';
        default: return nodeType;
    }
}

function getTypeShortLabel(nodeType) {
    switch (nodeType) {
        case 'promise': return 'Promise';
        case 'epic': return 'Epic';
        case 'journey': return 'Journey';
        case 'flow': return 'Flow';
        case 'moment': return 'Moment';
        default: return nodeType;
    }
}

async function buildMomentNode(moment) {
    return createNode('moment', moment, []);
}

async function buildFlowNode(flow) {
    const moments = sortByDisplayOrder(await getMomentsByFlow(flow.id));
    const children = await Promise.all(moments.map(buildMomentNode));
    return createNode('flow', flow, children);
}

async function buildJourneyNode(journey) {
    const flows = sortByDisplayOrder(await getFlowsByJourney(journey.id));
    const children = await Promise.all(flows.map(buildFlowNode));
    return createNode('journey', journey, children);
}

async function buildEpicNode(epic) {
    const journeys = sortByDisplayOrder(await getJourneysByEpic(epic.id));
    const children = await Promise.all(journeys.map(buildJourneyNode));
    return createNode('epic', epic, children);
}

async function buildPromiseNode(promise) {
    const epics = sortByDisplayOrder(await getEpicsByPromise(promise.id));
    const children = await Promise.all(epics.map(buildEpicNode));
    return createNode('promise', promise, children);
}

function matchesNode(node, filters) {
    if (node.nodeType === 'root') return false;

    if (!filters.types.has(node.nodeType)) return false;

    if (filters.search) {
        const searchText = node._searchText ?? getNodeSearchText(node);
        if (!searchText.includes(filters.search)) return false;
    }

    if (filters.status !== 'all') {
        const statusBucket = node._statusBucket ?? getStatusBucket(node.payload?.statusColor);
        if (statusBucket !== filters.status) return false;
    }

    if (filters.assignment !== 'all') {
        if (node.nodeType !== 'moment') return false;

        const hasStride = node.payload?.assignedStrideId != null;
        if (filters.assignment === 'assigned' && !hasStride) return false;
        if (filters.assignment === 'unassigned' && hasStride) return false;
    }

    if (filters.effort !== 'all') {
        if (node.nodeType !== 'moment') return false;
        const effortBucket = node._effortBucket ?? getMomentEffortBucket(node.payload?.effortEstimate);
        if (filters.effort !== effortBucket) return false;
    }

    if (filters.stride !== 'all') {
        if (node.nodeType !== 'moment') return false;
        const strideBucket = node._strideBucket ?? getMomentStrideBucket(node.payload);
        if (filters.stride !== strideBucket) return false;
    }

    return true;
}

function cloneSubtree(node, metrics) {
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

function filterTree(node, filters, metrics, isRoot = false) {
    const isCollapsed = isNodeCollapsed(node.id);
    const hiddenDescendantCount = isCollapsed ? getHiddenDescendantCount(node) : 0;
    const searchMatched = !isRoot && filters.search && (node._searchText ?? getNodeSearchText(node)).includes(filters.search);

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
            .filter(Boolean);

    const selfMatches = !isRoot && matchesNode(node, filters);
    if (selfMatches) {
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

    if (selfMatches || filteredChildren.length > 0) {
        metrics.visibleNodes += 1;
        return {
            ...node,
            _searchMatched: Boolean(searchMatched && filters.search),
            _isCollapsed: isCollapsed,
            _hiddenDescendantCount: hiddenDescendantCount,
            children: filteredChildren,
        };
    }

    return null;
}

function readFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const search = normalizeText(params.get('q'));
    const includeChildren = params.get('children') === '1' || params.get('children') === 'true';
    const status = getStatusFilterValue(params.get('status'));
    const assignment = getAssignmentFilterValue(params.get('assignment'));
    const effort = getEffortFilterValue(params.get('effort'));
    const stride = getStrideFilterValue(params.get('stride'));
    const rawTypes = params.get('types');
    const types = rawTypes === null ? new Set(NODE_TYPES) : normalizeTypeSelection(parseTypeList(rawTypes));

    return {
        search,
        includeChildren,
        status,
        assignment,
        effort,
        stride,
        types,
    };
}

function readGraphFocusFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get('focus') ?? '').trim() || null;
}

function syncFiltersToUrl(filters) {
    const params = new URLSearchParams();

    if (filters.search) {
        params.set('q', filters.search);
    }

    if (filters.includeChildren) {
        params.set('children', '1');
    }

    const selectedTypes = NODE_TYPES.filter(type => filters.types.has(type));
    if (selectedTypes.length > 0 && selectedTypes.length < NODE_TYPES.length) {
        params.set('types', selectedTypes.join(','));
    } else if (selectedTypes.length === 0) {
        params.set('types', '');
    }

    if (filters.status !== 'all') {
        params.set('status', filters.status);
    }

    if (filters.assignment !== 'all') {
        params.set('assignment', filters.assignment);
    }

    if (filters.effort !== 'all') {
        params.set('effort', filters.effort);
    }

    if (filters.stride !== 'all') {
        params.set('stride', filters.stride);
    }

    if (graphState.focusNodeId) {
        params.set('focus', graphState.focusNodeId);
    }

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash || ''}`;
    window.history.replaceState({ projectId: graphState.projectId }, '', nextUrl);
}

function renderFilterBar() {
    const filterBar = document.getElementById('graph-filter-bar');
    if (!filterBar) return;

    const strideOptions = [
        `<option value="all" ${graphState.filters.stride === 'all' ? 'selected' : ''}>All strides</option>`,
        `<option value="backlog" ${graphState.filters.stride === 'backlog' ? 'selected' : ''}>Backlog</option>`,
        ...graphState.availableStrides.map(stride => {
            const label = stride.name ? `Stride #${stride.id} - ${escapeAttribute(stride.name)}` : `Stride #${stride.id}`;
            return `<option value="${String(stride.id)}" ${String(graphState.filters.stride) === String(stride.id) ? 'selected' : ''}>${label}</option>`;
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
            <label class="graph-filter-field">
                <span>Search</span>
                <input id="graph-filter-search" class="graph-filter-input" type="search" placeholder="Search statements or descriptions" value="${escapeAttribute(graphState.filters.search)}" />
            </label>

            <label class="graph-filter-field graph-filter-checkbox-field">
                <span>Search options</span>
                <span class="graph-filter-checkbox">
                    <input id="graph-filter-include-children" type="checkbox" ${graphState.filters.includeChildren ? 'checked' : ''} />
                    <span>Include Children</span>
                </span>
            </label>

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
                    <option value="todo" ${graphState.filters.status === 'todo' ? 'selected' : ''}>Todo</option>
                    <option value="inprogress" ${graphState.filters.status === 'inprogress' ? 'selected' : ''}>In Progress</option>
                    <option value="blocked" ${graphState.filters.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                    <option value="done" ${graphState.filters.status === 'done' ? 'selected' : ''}>Done</option>
                    <option value="other" ${graphState.filters.status === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </label>

            <label class="graph-filter-field">
                <span>Moment assignment</span>
                <select id="graph-filter-assignment" class="graph-filter-select">
                    <option value="all" ${graphState.filters.assignment === 'all' ? 'selected' : ''}>All moments</option>
                    <option value="assigned" ${graphState.filters.assignment === 'assigned' ? 'selected' : ''}>Assigned only</option>
                    <option value="unassigned" ${graphState.filters.assignment === 'unassigned' ? 'selected' : ''}>Unassigned only</option>
                </select>
            </label>

            <div class="graph-filter-actions">
                <button id="graph-filter-reset" type="button" class="btn btn-outline-secondary btn-sm">Reset</button>
                <button id="graph-filter-hide-all" type="button" class="btn btn-outline-secondary btn-sm">Hide All</button>
                <button id="graph-filter-expand-all" type="button" class="btn btn-outline-secondary btn-sm">Expand All</button>
                <button id="graph-filter-refresh" type="button" class="btn btn-outline-primary btn-sm">Refresh</button>
            </div>
        </div>

        <fieldset class="graph-filter-types">
            <legend class="graph-filter-group-label">Promise types</legend>
            <div class="graph-filter-chip-list">
                ${typeChips}
            </div>
        </fieldset>

        <div id="graph-filter-summary" class="graph-filter-summary" aria-live="polite"></div>
    `;

    bindFilterControls();
}

function setGraphLoading(loading) {
    const loadingState = document.getElementById('graph-loading-state');
    if (loadingState) {
        loadingState.hidden = !loading;
        loadingState.classList.toggle('d-none', !loading);
        loadingState.setAttribute('aria-hidden', loading ? 'false' : 'true');
    }
}

function escapeAttribute(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function bindFilterControls() {
    const searchInput = document.getElementById('graph-filter-search');
    const includeChildrenInput = document.getElementById('graph-filter-include-children');
    const effortSelect = document.getElementById('graph-filter-effort');
    const strideSelect = document.getElementById('graph-filter-stride');
    const statusSelect = document.getElementById('graph-filter-status');
    const assignmentSelect = document.getElementById('graph-filter-assignment');
    const resetButton = document.getElementById('graph-filter-reset');
    const hideAllButton = document.getElementById('graph-filter-hide-all');
    const expandAllButton = document.getElementById('graph-filter-expand-all');
    const refreshButton = document.getElementById('graph-filter-refresh');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            graphState.filters.search = normalizeText(searchInput.value);
            scheduleFilterApply();
        });
    }

    if (includeChildrenInput) {
        includeChildrenInput.addEventListener('change', () => {
            graphState.filters.includeChildren = includeChildrenInput.checked;
            requestApplyFilters();
        });
    }

    if (effortSelect) {
        effortSelect.addEventListener('change', () => {
            graphState.filters.effort = getEffortFilterValue(effortSelect.value);
            requestApplyFilters();
        });
    }

    if (strideSelect) {
        strideSelect.addEventListener('change', () => {
            graphState.filters.stride = getStrideFilterValue(strideSelect.value);
            requestApplyFilters();
        });
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            graphState.filters.status = getStatusFilterValue(statusSelect.value);
            requestApplyFilters();
        });
    }

    if (assignmentSelect) {
        assignmentSelect.addEventListener('change', () => {
            graphState.filters.assignment = getAssignmentFilterValue(assignmentSelect.value);
            requestApplyFilters();
        });
    }

    document.querySelectorAll('[data-filter-type]').forEach(input => {
        input.addEventListener('change', (e) => {
            const changed = e.target;
            const isChecked = !!changed.checked;

            // Work off a copy of the previous selection to avoid extra DOM reads.
            const prevTypes = new Set(graphState.filters.types);

            // If the user just unchecked a type and previously all types were selected,
            // deselect this type and every type after it (inverse cascade).
            if (!isChecked && NODE_TYPES.every(t => prevTypes.has(t))) {
                const idx = NODE_TYPES.indexOf(changed.value);
                if (idx >= 0) {
                    for (let i = idx; i < NODE_TYPES.length; i++) {
                        const val = NODE_TYPES[i];
                        // Update the DOM checkbox to reflect the cascade
                        const el = document.querySelector(`[data-filter-type][value="${val}"]`);
                        if (el) el.checked = false;
                        prevTypes.delete(val);
                    }
                }
            } else {
                // Apply the single change to the copy
                if (isChecked) prevTypes.add(changed.value); else prevTypes.delete(changed.value);
            }

            const selectedTypes = normalizeTypeSelection(prevTypes);
            graphState.filters.types = selectedTypes;
            syncControlsToFilters();
            requestApplyFilters();
        });
    });

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
            reloadGraphData();
        });
    }
}

function syncControlsToFilters() {
    const searchInput = document.getElementById('graph-filter-search');
    const includeChildrenInput = document.getElementById('graph-filter-include-children');
    const effortSelect = document.getElementById('graph-filter-effort');
    const strideSelect = document.getElementById('graph-filter-stride');
    const statusSelect = document.getElementById('graph-filter-status');
    const assignmentSelect = document.getElementById('graph-filter-assignment');

    if (searchInput) {
        searchInput.value = graphState.filters.search;
    }

    if (includeChildrenInput) {
        includeChildrenInput.checked = graphState.filters.includeChildren;
    }

    if (effortSelect) {
        effortSelect.value = graphState.filters.effort;
    }

    if (strideSelect) {
        strideSelect.value = graphState.filters.stride;
    }

    if (statusSelect) {
        statusSelect.value = graphState.filters.status;
    }

    if (assignmentSelect) {
        assignmentSelect.value = graphState.filters.assignment;
    }

    document.querySelectorAll('[data-filter-type]').forEach(input => {
        input.checked = graphState.filters.types.has(input.value);
    });
}

function scheduleFilterApply() {
    if (graphState.filterDebounceId) {
        window.clearTimeout(graphState.filterDebounceId);
    }

    graphState.filterDebounceId = window.setTimeout(() => {
        applyFilters();
    }, 150);
}

// Small-batch debounce for rendering to avoid repeated heavy D3 renders
function requestApplyFilters(delay = 40) {
    if (graphState.applyTimer) {
        window.clearTimeout(graphState.applyTimer);
    }

    graphState.applyTimer = window.setTimeout(() => {
        graphState.applyTimer = null;
        applyFilters();
    }, delay);
}

function updateFilterSummary(metrics) {
    const summaryEl = document.getElementById('graph-filter-summary');
    if (!summaryEl) return;

    if (!graphState.rawTree) {
        summaryEl.textContent = 'Loading graph...';
        return;
    }

    if (metrics.visibleNodes === 0) {
        summaryEl.textContent = 'No promises match the current filters.';
        return;
    }

    const visibleLabel = `${metrics.visibleNodes} visible promise${metrics.visibleNodes === 1 ? '' : 's'}`;
    const totalLabel = `${graphState.totalRenderableNodes} total promise${graphState.totalRenderableNodes === 1 ? '' : 's'}`;

    if (metrics.directMatches === metrics.visibleNodes) {
        summaryEl.textContent = `Showing ${visibleLabel} of ${totalLabel}${metrics.hiddenNodes > 0 ? ` (${metrics.hiddenNodes} hidden)` : ''}.`;
        return;
    }

    summaryEl.textContent = `Showing ${visibleLabel} of ${totalLabel} (${metrics.directMatches} direct match${metrics.directMatches === 1 ? '' : 'es'}${metrics.hiddenNodes > 0 ? `, ${metrics.hiddenNodes} hidden` : ''}).`;
}

function findFirstSearchMatch(treeData) {
    if (!treeData) return null;

    if (treeData._searchMatched) {
        return treeData;
    }

    for (const child of treeData.children ?? []) {
        const match = findFirstSearchMatch(child);
        if (match) {
            return match;
        }
    }

    return null;
}

function renderTree(_contentDiv, d3, treeData, restoreTransform = null, focusNodeData = null) {
    const graphContent = document.getElementById('graph-content');
    const graphViewport = document.getElementById('graph-viewport');
    if (!graphContent) return;

    graphState.contextMenu?.hide();

    renderStackGraph(graphContent, d3, treeData, {
        projectId: graphState.projectId,
        focusNodeId: focusNodeData?.id ?? null,
        focusNodeData,
        enableZoom: true,
        compact: false,
        restoreTransform,
        viewportElement: graphViewport,
        clipPathIdPrefix: 'graph-card-clip',
        emptyMessage: 'No cards match the current filters.',
        onZoom: (transform, meta = {}) => {
            graphState.zoomTransform = transform;
            if (meta.user && !graphState.suppressZoomStateUpdate) {
                graphState.userZoomTransform = transform;
            }
        },
        onContextMenu: (event, nodeData) => {
            graphState.contextMenu?.open(event, nodeData);
        },
    });
}

function applyFilters() {
    if (!graphState.rawTree || !graphState.d3) {
        return;
    }

    const metrics = { visibleNodes: 0, directMatches: 0, hiddenNodes: 0 };
    graphState.filteredTree = filterTree(graphState.rawTree, graphState.filters, metrics, true);

    syncFiltersToUrl(graphState.filters);

    const graphContent = document.getElementById('graph-content');
    if (graphState.filteredTree) {
        const focusNode = graphState.filters.search
            ? findFirstSearchMatch(graphState.filteredTree)
            : (graphState.focusNodeId ? findNodeById(graphState.filteredTree, graphState.focusNodeId) : (graphState.userZoomTransform ? null : graphState.filteredTree));

        logGraphFocus('apply-filters-focus-selection', {
            requestedFocusNodeId: graphState.focusNodeId,
            selectedFocusNodeId: focusNode?.id ?? null,
            selectedFocusNodeType: focusNode?.nodeType ?? null,
            hasUserZoomTransform: Boolean(graphState.userZoomTransform),
            searchFilter: graphState.filters.search,
            includeChildren: graphState.filters.includeChildren,
            visibleNodeCount: metrics.visibleNodes,
            directMatches: metrics.directMatches,
            hiddenNodeCount: metrics.hiddenNodes,
        });

        const restoreTransform = focusNode ? null : (graphState.userZoomTransform ?? graphState.zoomTransform);
        renderTree(graphContent, graphState.d3, graphState.filteredTree, restoreTransform, focusNode);
    } else {
        renderEmptyState(graphContent, 'No cards match the current filters.');
    }

    updateFilterSummary(metrics);
}

async function reloadGraphData() {
    const errorEl = document.getElementById('error-text');
    const successEl = document.getElementById('success-text');

    setGraphLoading(true);
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    try {
        const [projectResult, promisesResult] = await Promise.allSettled([
            getProjectById(graphState.projectId),
            getProjectPromises(graphState.projectId),
        ]);

        if (promisesResult.status !== 'fulfilled') {
            throw promisesResult.reason;
        }

        if (projectResult.status === 'rejected') {
            console.warn('Unable to load project details for graph root card label:', projectResult.reason);
        }

        const project = projectResult.status === 'fulfilled' ? projectResult.value : null;
        const rootPromises = sortByDisplayOrder(promisesResult.value);
        const children = await Promise.all(rootPromises.map(buildPromiseNode));

        graphState.rawTree = parseGraphData(children, graphState.projectId, project);
        reconcileCollapsedNodes();
        graphState.totalRenderableNodes = countRenderableNodes(graphState.rawTree);
        applyFilters();

        if (successEl) successEl.textContent = `Loaded ${children.length} top-level promise${children.length === 1 ? '' : 's'}.`;
    } catch (error) {
        console.error('Error loading project graph:', error);
        if (errorEl) errorEl.textContent = 'Unable to load the project graph.';
    } finally {
        setGraphLoading(false);
    }
}

async function loadAvailableStrides(projectId) {
    const iterations = await getIterationsByProject(projectId);
    const strideGroups = await Promise.all(
        (Array.isArray(iterations) ? iterations : []).map(async iteration => ({
            iteration,
            strides: await getStridesByIteration(iteration.id),
        }))
    );

    const strides = strideGroups
        .flatMap(group => (Array.isArray(group.strides) ? group.strides : []))
        .sort((left, right) => {
            const leftStart = new Date(left.startDate ?? 0).getTime();
            const rightStart = new Date(right.startDate ?? 0).getTime();
            if (leftStart !== rightStart) return leftStart - rightStart;
            return Number(left.id) - Number(right.id);
        });

    graphState.availableStrides = strides;
}

export async function loadGraphPage(projectId, contentDiv) {
    const errorEl = document.getElementById('error-text');
    const successEl = document.getElementById('success-text');

    if (graphState.pageShowRefreshHandler) {
        window.removeEventListener('pageshow', graphState.pageShowRefreshHandler);
        graphState.pageShowRefreshHandler = null;
    }

    graphState.projectId = projectId;
    graphState.d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
    graphState.filters = readFiltersFromUrl();
    graphState.focusNodeId = readGraphFocusFromUrl();
    graphState.zoomTransform = null;
    graphState.userZoomTransform = null;
    graphState.suppressZoomStateUpdate = false;
    graphState.rawTree = null;
    graphState.filteredTree = null;
    graphState.totalRenderableNodes = 0;
    graphState.availableStrides = [];
    graphState.collapsedNodeIds = new Set();

    graphState.contextMenu?.destroy();
    graphState.contextMenu = createGraphContextMenuController({
        projectId,
        getAvailableStrides: () => graphState.availableStrides,
        onGraphMutated: reloadGraphData,
        isNodeChildrenHidden: (nodeData) => isNodeCollapsed(nodeData?.id),
        setNodeChildrenHidden: async (nodeData, hidden) => {
            const nodeId = nodeData?.id;
            if (!nodeId) return;

            setNodeCollapsed(nodeId, hidden);
            requestApplyFilters(0);
        },
        onProjectDeleted: () => {
            window.location.assign('/projects');
        },
    });

    graphState.pageShowRefreshHandler = event => {
        if (!event.persisted) return;
        reloadGraphData();
    };
    window.addEventListener('pageshow', graphState.pageShowRefreshHandler);

    await loadAvailableStrides(projectId);

    renderFilterBar();
    syncControlsToFilters();

    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';
    setGraphLoading(true);

    await reloadGraphData();
}
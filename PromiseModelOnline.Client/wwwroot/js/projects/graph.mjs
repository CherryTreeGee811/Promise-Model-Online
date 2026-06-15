import { getGraphData } from './api.mjs';
import { getStrides } from '../strides/api.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { getUserId } from '../auth-state.mjs';
import { createGraphContextMenuController } from './graph-context-menu.mjs';
import { STATUS_OPTIONS } from '../utils/status-utils.mjs';
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
} from './stack-graph-core.mjs';

const graphState = {
    owner: null,
    project: null,
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
    zoomBehavior: null,
    filterDebounceId: null,
    applyTimer: null,
    contextMenu: null,
    pageShowRefreshHandler: null,
    collapsedNodeIds: new Set(),
    hasRendered: false,
    animationSpeed: 0.25,
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

function revealNextLevel(nodeData) {
    if (!graphState.rawTree || !nodeData?.id) return;

    const node = findNodeById(graphState.rawTree, nodeData.id);
    if (!node) return;

    setNodeCollapsed(node.id, false);

    for (const child of node.children ?? []) {
        if (hasNodeChildren(child)) {
            setNodeCollapsed(child.id, true);
        }
    }
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
    if (normalized === 'assigned-to-me') return 'assigned-to-me';
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

function buildMomentNode(moment) {
    return createNode('moment', moment, []);
}

function buildFlowNode(flow) {
    const moments = (flow.moments ?? []).map(buildMomentNode);
    return createNode('flow', flow, moments);
}

function buildJourneyNode(journey) {
    const flows = (journey.flows ?? []).map(buildFlowNode);
    return createNode('journey', journey, flows);
}

function buildEpicNode(epic) {
    const journeys = (epic.journeys ?? []).map(buildJourneyNode);
    return createNode('epic', epic, journeys);
}

function buildPromiseNode(promise) {
    const epics = (promise.epics ?? []).map(buildEpicNode);
    return createNode('promise', promise, epics);
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

    if (filters.assignment === 'assigned-to-me') {
        if (node.nodeType !== 'moment') return false;

        const currentUserId = getUserId();
        if (currentUserId == null) return false;
        if (node.payload?.ownerId !== currentUserId) return false;
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
    window.history.replaceState({ owner: graphState.owner, project: graphState.project }, '', nextUrl);
}

function renderFilterBar() {
    const filterBar = document.getElementById('graph-filter-bar');
    if (!filterBar) return;

    const strideOptions = [
        `<option value="all" ${graphState.filters.stride === 'all' ? 'selected' : ''}>All strides</option>`,
        `<option value="backlog" ${graphState.filters.stride === 'backlog' ? 'selected' : ''}>Backlog</option>`,
        ...graphState.availableStrides.map(stride => {
            const label = stride.name ? `Stride #${stride.id} - ${escapeHtml(stride.name)}` : `Stride #${stride.id}`;
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
                        const val = opt.value.toLowerCase();
                        return `<option value="${val}" ${graphState.filters.status === val ? 'selected' : ''}>${opt.icon} ${opt.label}</option>`;
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

function setGraphLoading(loading) {
    const loadingState = document.getElementById('graph-loading-state');
    if (loadingState) {
        loadingState.hidden = !loading;
        loadingState.classList.toggle('d-none', !loading);
        loadingState.setAttribute('aria-hidden', loading ? 'false' : 'true');
    }
}

function bindFilter(id, eventType, setter, immediate) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(eventType, () => {
        setter(el, graphState.filters);
        (immediate ? requestApplyFilters : scheduleFilterApply)();
    });
}

function bindFilterControls() {
    bindFilter('graph-filter-search', 'input', (el, f) => { f.search = normalizeText(el.value); });
    bindFilter('graph-filter-include-children', 'change', (el, f) => { f.includeChildren = el.checked; }, true);
    bindFilter('graph-filter-effort', 'change', (el, f) => { f.effort = getEffortFilterValue(el.value); }, true);
    bindFilter('graph-filter-stride', 'change', (el, f) => { f.stride = getStrideFilterValue(el.value); }, true);
    bindFilter('graph-filter-status', 'change', (el, f) => { f.status = getStatusFilterValue(el.value); }, true);
    bindFilter('graph-filter-assignment', 'change', (el, f) => { f.assignment = getAssignmentFilterValue(el.value); }, true);

    const resetButton = document.getElementById('graph-filter-reset');
    const hideAllButton = document.getElementById('graph-filter-hide-all');
    const expandAllButton = document.getElementById('graph-filter-expand-all');
    const refreshButton = document.getElementById('graph-filter-refresh');

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

const FILTER_FIELDS = [
  ['graph-filter-search', 'value', 'search'],
  ['graph-filter-include-children', 'checked', 'includeChildren'],
  ['graph-filter-effort', 'value', 'effort'],
  ['graph-filter-stride', 'value', 'stride'],
  ['graph-filter-status', 'value', 'status'],
  ['graph-filter-assignment', 'value', 'assignment'],
];

function syncControlsToFilters() {
    FILTER_FIELDS.forEach(([id, prop, key]) => {
        const el = document.getElementById(id);
        if (el) el[prop] = graphState.filters[key];
    });
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

function initZoomControls(zoomBehavior, svgNode, d3Instance) {
    if (!zoomBehavior || !svgNode || !d3Instance) return;

    const selection = d3Instance.select(svgNode);

    document.getElementById('graph-zoom-in')?.addEventListener('click', () => {
        selection.transition().duration(200).call(zoomBehavior.scaleBy, 1.4);
    });

    document.getElementById('graph-zoom-out')?.addEventListener('click', () => {
        selection.transition().duration(200).call(zoomBehavior.scaleBy, 0.7);
    });

    document.getElementById('graph-zoom-reset')?.addEventListener('click', () => {
        selection.transition().duration(200).call(zoomBehavior.transform, d3Instance.zoomIdentity);
    });

    const fullscreenBtn = document.getElementById('graph-fullscreen-btn');
    fullscreenBtn?.addEventListener('click', () => {
        const viewport = document.getElementById('graph-viewport');
        if (!document.fullscreenElement) {
            viewport.requestFullscreen?.()?.catch(() => {});
        } else {
            document.exitFullscreen?.()?.catch(() => {});
        }
    });
}

function renderTree(_contentDiv, d3, treeData, restoreTransform = null, focusNodeData = null, animate = false) {
    const graphContent = document.getElementById('graph-content');
    const graphViewport = document.getElementById('graph-viewport');
    if (!graphContent) return;

    graphState.contextMenu?.hide();

    const speedEl = document.getElementById('graph-animation-speed');
    graphState.animationSpeed = speedEl ? Number.parseFloat(speedEl.value) || 1 : 1;

    const result = renderStackGraph(graphContent, d3, treeData, {
        owner: graphState.owner,
        project: graphState.project,
        focusNodeId: focusNodeData?.id ?? null,
        focusNodeData,
        animate,
        animationSpeed: graphState.animationSpeed,
        enableZoom: true,
        compact: false,
        renderRootCard: true,
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

    if (result?.zoom) {
        graphState.zoomBehavior = result.zoom;
        initZoomControls(result.zoom, result.node, d3);
    }
}

function applyFilters() {
    if (!graphState.rawTree || !graphState.d3) {
        return;
    }

    const metrics = { visibleNodes: 0, directMatches: 0, hiddenNodes: 0 };
    graphState.filteredTree = filterTree(graphState.rawTree, graphState.filters, metrics, true);
    const animate = graphState.hasRendered;

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
        renderTree(graphContent, graphState.d3, graphState.filteredTree, restoreTransform, focusNode, animate);
    } else {
        renderEmptyState(graphContent, 'No cards match the current filters.');
    }

    graphState.hasRendered = true;
    updateFilterSummary(metrics);
}

async function reloadGraphData() {
    const errorEl = document.getElementById('error-text');
    const successEl = document.getElementById('success-text');

    setGraphLoading(true);
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    try {
        const graphData = await getGraphData(graphState.owner, graphState.project);

        const project = {
            id: graphData.id ?? graphData.Id,
            name: graphData.name ?? graphData.Name,
            description: graphData.description ?? graphData.Description,
        };

        const rootPromises = (graphData.promises ?? graphData.Promises ?? []).map(buildPromiseNode);

        graphState.rawTree = parseGraphData(rootPromises, graphState.owner, graphState.project, project);
        reconcileCollapsedNodes();
        graphState.totalRenderableNodes = countRenderableNodes(graphState.rawTree);
        applyFilters();

        if (successEl) successEl.textContent = `Loaded ${rootPromises.length} top-level promise${rootPromises.length === 1 ? '' : 's'}.`;
    } catch (error) {
        console.error('Error loading project graph:', error);
        if (errorEl) errorEl.textContent = 'Unable to load the project graph.';
    } finally {
        setGraphLoading(false);
    }
}

async function loadAvailableStrides(owner, project) {
    const strides = await getStrides(owner, project);
    graphState.availableStrides = (Array.isArray(strides) ? strides : [])
        .sort((left, right) => {
            const leftStart = new Date(left.startDate ?? 0).getTime();
            const rightStart = new Date(right.startDate ?? 0).getTime();
            if (leftStart !== rightStart) return leftStart - rightStart;
            return Number(left.id) - Number(right.id);
        });
}

/**
 * Load the project hierarchy graph visualization page.
 * @param {*} owner - TODO
 * @param {*} project - TODO
 * @param {*} navContentDiv - TODO
 * @param {*} contentDiv - TODO
 * @param {*} permission - TODO
 * @param {*} highlightNodeId - TODO
 */
export async function loadGraphPage(owner, project, contentDiv, permission) {
    const errorEl = document.getElementById('error-text');
    const successEl = document.getElementById('success-text');

    if (graphState.pageShowRefreshHandler) {
        window.removeEventListener('pageshow', graphState.pageShowRefreshHandler);
        graphState.pageShowRefreshHandler = null;
    }

    graphState.owner = owner;
    graphState.project = project;
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
    graphState.hasRendered = false;

    graphState.contextMenu?.destroy();
    graphState.contextMenu = createGraphContextMenuController({
        owner,
        project,
        getAvailableStrides: () => graphState.availableStrides,
        onGraphMutated: reloadGraphData,
        isNodeChildrenHidden: (nodeData) => isNodeCollapsed(nodeData?.id),
        setNodeChildrenHidden: async (nodeData, hidden) => {
            const nodeId = nodeData?.id;
            if (!nodeId) return;

            setNodeCollapsed(nodeId, hidden);
            requestApplyFilters(0);
        },
        revealNextLevel: async (nodeData) => {
            revealNextLevel(nodeData);
            requestApplyFilters(0);
        },
        onProjectDeleted: () => {
            window.location.assign('/projects');
        },
        permission,
    });

    graphState.pageShowRefreshHandler = event => {
        if (!event.persisted) return;
        reloadGraphData();
    };
    window.addEventListener('pageshow', graphState.pageShowRefreshHandler);

    document.removeEventListener('fullscreenchange', graphState._onFullscreenChange);
    graphState._onFullscreenChange = () => {
        const btn = document.getElementById('graph-fullscreen-btn');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (document.fullscreenElement) {
            icon?.classList.replace('bi-arrows-angle-expand', 'bi-arrows-angle-contract');
            btn.setAttribute('aria-label', 'Exit fullscreen');
        } else {
            icon?.classList.replace('bi-arrows-angle-contract', 'bi-arrows-angle-expand');
            btn.setAttribute('aria-label', 'Fullscreen');
        }
        applyFilters();
    };
    document.addEventListener('fullscreenchange', graphState._onFullscreenChange);

    await loadAvailableStrides(owner, project);

    renderFilterBar();
    syncControlsToFilters();

    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';
    setGraphLoading(true);

    await reloadGraphData();
}

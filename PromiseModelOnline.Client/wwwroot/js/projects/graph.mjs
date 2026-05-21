import { getProjectPromises } from './api.mjs';
import { getIterationsByProject } from '../iterations/api.mjs';
import { getEpicsByPromise } from '../promises/api.mjs';
import { getJourneysByEpic } from '../epics/api.mjs';
import { getFlowsByJourney } from '../journeys/api.mjs';
import { getStridesByIteration } from '../strides/api.mjs';
import { getMomentsByFlow } from '../flows/api.mjs';

const STEP_GAP_X = 360;
const STEP_GAP_Y = 190;
const CARD_WIDTH = 300;
const CARD_HEIGHT = 144;
const CARD_RADIUS = 18;
const CARD_PADDING_X = 16;
const CARD_PADDING_TOP = 16;
const DETAIL_START_Y = 62;
const DETAIL_LINE_GAP = 22;
const FOREHEAD_GAP = 88;

const NODE_TYPES = ['promise', 'epic', 'journey', 'flow', 'moment'];
const NODE_ROUTE_SEGMENTS = {
    promise: 'promises',
    epic: 'epics',
    journey: 'journeys',
    flow: 'flows',
    moment: 'moments',
};
const NODE_TYPE_INDEX = new Map(NODE_TYPES.map((type, index) => [type, index]));

const graphState = {
    projectId: null,
    d3: null,
    rawTree: null,
    filteredTree: null,
    totalRenderableNodes: 0,
    availableStrides: [],
    filters: createDefaultFilters(),
    zoomTransform: null,
    filterDebounceId: null,
    applyTimer: null,
};

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

function normalizeText(value) {
    return String(value ?? '').trim().toLowerCase();
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

function getStatusBucket(statusColor) {
    const normalized = normalizeText(statusColor);

    if (!normalized || normalized === 'all') return 'other';
    if (normalized.includes('green') || normalized.includes('done')) return 'done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'inprogress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'todo';

    return 'other';
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

function getInnerViewportSize(element) {
    if (!element) return { width: 0, height: 0 };

    const styles = window.getComputedStyle(element);
    const paddingLeft = Number.parseFloat(styles.paddingLeft || '0');
    const paddingRight = Number.parseFloat(styles.paddingRight || '0');
    const paddingTop = Number.parseFloat(styles.paddingTop || '0');
    const paddingBottom = Number.parseFloat(styles.paddingBottom || '0');

    return {
        width: Math.max(0, element.clientWidth - paddingLeft - paddingRight),
        height: Math.max(0, element.clientHeight - paddingTop - paddingBottom),
    };
}

function truncateText(text, maxLength = 40) {
    const value = String(text ?? '').trim();
    if (value.length <= maxLength) return value;
    if (maxLength <= 3) return '.'.repeat(maxLength);
    return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatEstimate(value) {
    return value == null ? 'Unestimated' : String(value);
}

function getStatusIcon(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();

    if (normalized.includes('green')) return '🟢';
    if (normalized.includes('black') || normalized.includes('blocked')) return '⚫️';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '🟠';
    if (normalized.includes('red') || normalized.includes('todo')) return '🔴';

    return '⚪';
}

function getChildTypeLabel(nodeType) {
    switch (nodeType) {
        case 'promise': return 'Epic';
        case 'epic': return 'Journey';
        case 'journey': return 'Flow';
        case 'flow': return 'Moment';
        default: return null;
    }
}

function getChildProgressSummary(nodeData) {
    const childLabel = getChildTypeLabel(nodeData.nodeType);
    const childCount = nodeData.childCount ?? 0;
    const completedCount = nodeData.completedChildCount ?? 0;

    if (!childLabel) return null;

    return `${completedCount}/${childCount} ${childCount === 1 ? childLabel : `${childLabel}s`} completed`;
}

function getStrideLabel(payload) {
    return payload?.assignedStrideId == null ? 'Stride: Backlog' : `Stride # ${payload.assignedStrideId}`;
}

function getNodeTitle(nodeData) {
    const payload = nodeData.payload ?? {};
    const lines = [payload.statement ?? payload.name ?? `#${payload.id}`];

    if (nodeData.nodeType === 'moment') {
        lines.push(getStrideLabel(payload));
        if (payload.description) lines.push(truncateText(payload.description, 40));
        lines.push(`Effort: ${formatEstimate(payload.effortEstimate)}`);
    }

    return lines.join('\n');
}

function sortByDisplayOrder(items) {
    return [...items].sort((left, right) => {
        const orderDelta = (left.displayOrder ?? 0) - (right.displayOrder ?? 0);
        if (orderDelta !== 0) return orderDelta;
        return String(left.statement ?? '').localeCompare(String(right.statement ?? ''));
    });
}

function createNode(nodeType, payload, children = []) {
    const childCount = children.length;
    const completedChildCount = children.filter(child => getStatusBucket(child.payload?.statusColor) === 'done').length;

    const label = payload.statement ?? payload.name ?? `#${payload.id}`;
    const searchText = normalizeText([
        label,
        payload.description,
        nodeType,
        payload.statusColor,
        payload.effortEstimate,
        payload.assignedStrideId,
        getStrideLabel(payload),
    ].join(' '));

    const statusBucket = getStatusBucket(payload?.statusColor);
    const effortBucket = nodeType === 'moment' ? getMomentEffortBucket(payload?.effortEstimate) : null;
    const strideBucket = nodeType === 'moment' ? getMomentStrideBucket(payload) : null;

    return {
        id: `${nodeType}-${payload.id}`,
        nodeType,
        label,
        payload,
        childCount,
        completedChildCount,
        children,
        // cached derived values to speed up filtering
        _searchText: searchText,
        _statusBucket: statusBucket,
        _effortBucket: effortBucket,
        _strideBucket: strideBucket,
    };
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

function getNodeColor(nodeType) {
    switch (nodeType) {
        case 'project': return '#1d3557';
        case 'promise': return '#0f4c5c';
        case 'epic': return '#2d6a4f';
        case 'journey': return '#8b5e34';
        case 'flow': return '#6c584c';
        case 'moment': return '#355070';
        default: return '#334155';
    }
}

function getAppBasePath() {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const routeRootIndex = pathSegments.findIndex(segment => Object.prototype.hasOwnProperty.call(NODE_ROUTE_SEGMENTS, segment));

    if (routeRootIndex <= 0) {
        return '';
    }

    return `/${pathSegments.slice(0, routeRootIndex).join('/')}`;
}

function getNodeHref(node) {
    const routeSegment = NODE_ROUTE_SEGMENTS[node.nodeType];
    if (!routeSegment) return null;

    return `${getAppBasePath()}/${routeSegment}/${node.payload?.id}`;
}

function getNodeSearchText(node) {
    return node._searchText ?? normalizeText([
        node.label,
        node.payload?.description,
        node.nodeType,
        node.payload?.statusColor,
        node.payload?.effortEstimate,
        node.payload?.assignedStrideId,
        getStrideLabel(node.payload),
    ].join(' '));
}

function getMomentEffortBucket(effortEstimate) {
    if (effortEstimate == null) return 'unestimated';

    const normalized = normalizeText(effortEstimate);
    const allowed = new Set(['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']);
    return allowed.has(normalized) ? normalized.toUpperCase() : 'unestimated';
}

function getMomentStrideBucket(payload) {
    return payload?.assignedStrideId == null ? 'backlog' : String(payload.assignedStrideId);
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

    return {
        ...node,
        children: (node.children ?? []).map(child => cloneSubtree(child, metrics)),
    };
}

function filterTree(node, filters, metrics, isRoot = false) {
    const searchMatched = !isRoot && filters.search && matchesNode(node, { ...filters, search: filters.search, includeChildren: false });

    if (searchMatched && filters.includeChildren) {
        metrics.directMatches += 1;
        return cloneSubtree(node, metrics);
    }

    const filteredChildren = (node.children ?? [])
        .map(child => filterTree(child, filters, metrics))
        .filter(Boolean);

    const selfMatches = !isRoot && matchesNode(node, filters);
    if (selfMatches) {
        metrics.directMatches += 1;
    }

    if (isRoot) {
        return {
            ...node,
            children: filteredChildren,
        };
    }

    if (selfMatches || filteredChildren.length > 0) {
        metrics.visibleNodes += 1;
        return {
            ...node,
            children: filteredChildren,
        };
    }

    return null;
}

function countRenderableNodes(node) {
    if (!node) return 0;

    const selfCount = node.nodeType === 'root' ? 0 : 1;
    return selfCount + (node.children ?? []).reduce((sum, child) => sum + countRenderableNodes(child), 0);
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
                <button id="graph-filter-reset" type="button" class="graph-filter-button">Reset</button>
                <button id="graph-filter-refresh" type="button" class="graph-filter-button">Refresh</button>
            </div>
        </div>

        <fieldset class="graph-filter-types">
            <legend class="graph-filter-group-label">Card types</legend>
            <div class="graph-filter-chip-list">
                ${typeChips}
            </div>
        </fieldset>

        <div id="graph-filter-summary" class="graph-filter-summary" aria-live="polite"></div>
    `;

    bindFilterControls();
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
            syncControlsToFilters();
            requestApplyFilters();
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
        summaryEl.textContent = 'Loading graph cards...';
        return;
    }

    if (metrics.visibleNodes === 0) {
        summaryEl.textContent = 'No graph cards match the current filters.';
        return;
    }

    const visibleLabel = `${metrics.visibleNodes} visible card${metrics.visibleNodes === 1 ? '' : 's'}`;
    const totalLabel = `${graphState.totalRenderableNodes} total card${graphState.totalRenderableNodes === 1 ? '' : 's'}`;

    if (metrics.directMatches === metrics.visibleNodes) {
        summaryEl.textContent = `Showing ${visibleLabel} of ${totalLabel}.`;
        return;
    }

    summaryEl.textContent = `Showing ${visibleLabel} of ${totalLabel} (${metrics.directMatches} direct match${metrics.directMatches === 1 ? '' : 'es'}).`;
}

function renderEmptyState(contentDiv, message) {
    if (!contentDiv) return;
    contentDiv.replaceChildren();

    const emptyState = document.createElement('div');
    emptyState.className = 'graph-empty-state';
    emptyState.textContent = message;
    contentDiv.appendChild(emptyState);
}

function renderTree(contentDiv, d3, treeData, restoreTransform = null) {
    const graphContent = document.getElementById('graph-content');
    const graphViewport = document.getElementById('graph-viewport');
    if (!graphContent) return;

    graphContent.replaceChildren();

    const margin = { top: 32, right: 48, bottom: 32, left: 48 };

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().nodeSize([STEP_GAP_Y, STEP_GAP_X]);
    treeLayout(root);

    const descendants = root.descendants();
    const renderable = descendants.filter(node => node.depth > 0);

    if (renderable.length === 0) {
        renderEmptyState(graphContent, 'No cards match the current filters.');
        return;
    }

    const links = root.links();
    const viewportSize = getInnerViewportSize(graphViewport || contentDiv);
    const viewportWidth = viewportSize.width || contentDiv.clientWidth || 0;
    const viewportHeight = viewportSize.height || contentDiv.clientHeight || 0;
    const minX = d3.min(renderable, node => node.x - (CARD_HEIGHT / 2)) ?? -(CARD_HEIGHT / 2);
    const maxX = d3.max(renderable, node => node.x + (CARD_HEIGHT / 2)) ?? (CARD_HEIGHT / 2);
    const minY = d3.min(renderable, node => node.y - (CARD_WIDTH / 2)) ?? -(CARD_WIDTH / 2);
    const maxY = d3.max(renderable, node => node.y + (CARD_WIDTH / 2)) ?? (CARD_WIDTH / 2);
    const graphWidth = Math.max((maxY - minY) + margin.left + margin.right, viewportWidth, 960);
    const graphHeight = Math.max((maxX - minX) + margin.top + margin.bottom + FOREHEAD_GAP, viewportHeight, 520);
    const svg = d3.create('svg')
        .attr('viewBox', [0, 0, graphWidth, graphHeight])
        .attr('width', '100%')
        .attr('height', Math.max(graphHeight, viewportHeight || 0))
        .attr('role', 'img')
        .attr('aria-label', 'Project promise tree');

    const contentOffsetX = margin.left - minY;
    const contentOffsetY = margin.top - minX + FOREHEAD_GAP;

    const zoomLayer = svg.append('g');

    const zoom = d3.zoom()
        .scaleExtent([0.5, 2.5])
        .extent([[0, 0], [viewportWidth, viewportHeight]])
        .translateExtent([[0, 0], [graphWidth, graphHeight]])
        .on('zoom', event => {
            graphState.zoomTransform = event.transform;
            zoomLayer.attr('transform', event.transform);
        });

    svg.call(zoom);
    svg.on('dblclick.zoom', null);

    const initialScale = Math.min(
        viewportWidth > 0 ? viewportWidth / graphWidth : 1,
        viewportHeight > 0 ? viewportHeight / graphHeight : 1,
        1
    );
    const initialTransform = restoreTransform ?? d3.zoomIdentity
        .translate(
            viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
            viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0
        )
        .scale(initialScale);

    graphState.zoomTransform = initialTransform;
    svg.call(zoom.transform, initialTransform);

    zoomLayer.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#94a3b8')
        .attr('stroke-opacity', 0.65)
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('d', d => d3.linkHorizontal()
            .x(point => point.y)
            .y(point => point.x)({
                source: { x: d.source.x + contentOffsetY, y: d.source.y + contentOffsetX + (CARD_WIDTH / 2) },
                target: { x: d.target.x + contentOffsetY, y: d.target.y + contentOffsetX - (CARD_WIDTH / 2) },
            }));

    const node = zoomLayer.append('g')
        .selectAll('a')
        .data(renderable)
        .join('a')
        .attr('class', current => `graph-node graph-node--${current.data.nodeType}`)
        .attr('href', current => getNodeHref(current.data))
        .attr('xlink:href', current => getNodeHref(current.data))
        .attr('transform', current => `translate(${current.y + contentOffsetX}, ${current.x + contentOffsetY})`);

    node.append('title')
        .text(current => getNodeTitle(current.data));

    node.append('rect')
        .attr('class', 'graph-card')
        .attr('x', -CARD_WIDTH / 2)
        .attr('y', -CARD_HEIGHT / 2)
        .attr('width', CARD_WIDTH)
        .attr('height', CARD_HEIGHT)
        .attr('rx', CARD_RADIUS)
        .attr('ry', CARD_RADIUS)
        .attr('fill', current => current.depth === 0 ? '#f8fafc' : '#ffffff')
        .attr('stroke', current => current.depth === 0 ? getNodeColor(current.data.nodeType) : '#cbd5e1')
        .attr('stroke-width', current => current.depth === 0 ? 2.5 : 1.5);

    node.append('rect')
        .attr('class', 'graph-card-accent')
        .attr('x', -CARD_WIDTH / 2)
        .attr('y', -CARD_HEIGHT / 2)
        .attr('width', 10)
        .attr('height', CARD_HEIGHT)
        .attr('rx', CARD_RADIUS)
        .attr('ry', CARD_RADIUS)
        .attr('fill', current => getNodeColor(current.data.nodeType));

    node.append('text')
        .attr('class', 'graph-card-statement')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('fill', '#0f172a')
        .attr('font-size', 14)
        .attr('font-weight', 100)
        .text(current => truncateText(current.data.label, 36));

    node.filter(current => current.data.nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-status')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('text-anchor', 'end')
        .attr('font-size', 18)
        .attr('dominant-baseline', 'hanging')
        .text(current => getStatusIcon(current.data.payload?.statusColor));

    node.append('line')
        .attr('class', 'graph-card-divider')
        .attr('x1', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('x2', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y1', -CARD_HEIGHT / 2 + 42)
        .attr('y2', -CARD_HEIGHT / 2 + 42)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);

    node.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => getStrideLabel(current.data.payload));

    node.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + DETAIL_LINE_GAP)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => `Description: ${truncateText(current.data.payload?.description ?? '', 40) || 'None'}`);

    node.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 2))
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => `Effort: ${formatEstimate(current.data.payload?.effortEstimate)}`);

    node.filter(current => current.data.nodeType !== 'moment' && current.data.nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 88)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('dominant-baseline', 'middle')
        .text(current => getChildProgressSummary(current.data) ?? 'No child cards');

    graphContent.appendChild(svg.node());
}

function applyFilters() {
    if (!graphState.rawTree || !graphState.d3) {
        return;
    }

    const metrics = { visibleNodes: 0, directMatches: 0 };
    graphState.filteredTree = filterTree(graphState.rawTree, graphState.filters, metrics, true);

    syncFiltersToUrl(graphState.filters);

    const graphContent = document.getElementById('graph-content');
    if (graphState.filteredTree) {
        renderTree(graphContent, graphState.d3, graphState.filteredTree, graphState.zoomTransform);
    } else {
        renderEmptyState(graphContent, 'No cards match the current filters.');
    }

    updateFilterSummary(metrics);
}

function parseGraphData(rootPromises, projectId) {
    return {
        id: `root-${projectId}`,
        nodeType: 'root',
        label: '',
        payload: {},
        children: rootPromises,
    };
}

async function reloadGraphData() {
    const loadingEl = document.getElementById('loading-text');
    const errorEl = document.getElementById('error-text');
    const successEl = document.getElementById('success-text');

    if (loadingEl) loadingEl.textContent = 'Loading project graph...';
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    try {
        const rootPromises = sortByDisplayOrder(await getProjectPromises(graphState.projectId));
        const children = await Promise.all(rootPromises.map(buildPromiseNode));

        graphState.rawTree = parseGraphData(children, graphState.projectId);
        graphState.totalRenderableNodes = countRenderableNodes(graphState.rawTree);

        applyFilters();

        if (loadingEl) loadingEl.textContent = '';
        if (successEl) successEl.textContent = `Loaded ${children.length} top-level promise${children.length === 1 ? '' : 's'}.`;
    } catch (error) {
        console.error('Error loading project graph:', error);
        if (loadingEl) loadingEl.textContent = '';
        if (errorEl) errorEl.textContent = 'Unable to load the project graph.';
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
    const loadingEl = document.getElementById('loading-text');
    const successEl = document.getElementById('success-text');

    graphState.projectId = projectId;
    graphState.d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
    graphState.filters = readFiltersFromUrl();
    graphState.zoomTransform = null;
    graphState.rawTree = null;
    graphState.filteredTree = null;
    graphState.totalRenderableNodes = 0;
    graphState.availableStrides = [];

    await loadAvailableStrides(projectId);

    renderFilterBar();
    syncControlsToFilters();

    if (loadingEl) loadingEl.textContent = 'Loading project graph...';
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    await reloadGraphData();
}

import { getStrides } from '../strides/api.ts';
import { STATUS_OPTIONS } from '../utils/status-utilities.ts';

import { getGraphData } from './api.ts';
import { createGraphContextMenuController } from './graph-context-menu.ts';
import {
    ASSIGNED_TO_ME,
    createDefaultFilters,
    parseTypeList,
    normalizeTypeSelection,
    getStatusFilterValue,
    getAssignmentFilterValue,
    getEffortFilterValue,
    getStrideFilterValue,
    getTypeShortLabel,
    buildPromiseNode,
    filterTree,
    findFirstSearchMatch,
} from './graph-core.ts';
import type { GraphFilters, FilterMetrics, GraphNode } from './graph-core.ts';
import {
    graphState,
    isNodeCollapsed,
    setNodeCollapsed,
    reconcileCollapsedNodes,
    collapseAllBelowPromises,
    revealNextLevel,
    expandAllNodes,
} from './graph-state.ts';
import type { StrideInfo } from './graph-state.ts';
import {
    NODE_TYPES,
    normalizeText,
    findNodeById,
    countRenderableNodes,
    parseGraphData,
    renderEmptyState,
    logGraphFocus,
    renderStackGraph,
    D3Module,
} from './stack-graph-core.ts';



export {
    getHiddenDescendantCount,
    createDefaultFilters,
    parseTypeList,
    normalizeTypeSelection,
    getStatusFilterValue,
    getAssignmentFilterValue,
    getEffortFilterValue,
    getStrideFilterValue,
    getTypeShortLabel,
    buildMomentNode,
    buildFlowNode,
    buildJourneyNode,
    buildEpicNode,
    buildPromiseNode,
    isNodeSearchMatching,
    isNodeStatusMatching,
    isNodeEffortMatching,
    isNodeStrideMatching,
    filterTree,
    findFirstSearchMatch,
} from './graph-core.ts';

/** CSS class for graph filter fields. */
const GRAPH_FILTER_FIELD = 'graph-filter-field';

/**
 * Read filter state from the current URL search parameters.
 * @returns {{search: string, includeChildren: boolean, types: Set<string>, effort: string, stride: string, status: string, assignment: string}} The parsed filter state.
 */
export function readFiltersFromUrl(): GraphFilters {
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
function readGraphFocusFromUrl(): string | null | undefined {
    const parameters = new URLSearchParams(location.search);
    return (parameters.get('focus') ?? '').trim() || undefined;
}

/**
 * Synchronize the current filter state to the browser's URL search parameters.
 * @param {object} filters - The filter state to persist.
 */
export function syncFiltersToUrl(filters: GraphFilters): void {
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

    const query = parameters.toString();
    const nextUrl = location.pathname + (query ? '?' + query : '') + (location.hash || '');
    history.replaceState({ owner: graphState.owner, project: graphState.project }, '', nextUrl);
}

/**
 * Render the graph filter bar UI with all filter controls.
 */
function renderFilterBar(): void {
    const filterBar = document.querySelector('#graph-filter-bar') as HTMLElement | undefined | null;
    if (!filterBar) return;

    const row = document.createElement('div');
    row.className = 'graph-filter-row';

    const searchGroup = document.createElement('div');
    searchGroup.className = 'graph-filter-search-group';

    const searchLabel = document.createElement('label');
    searchLabel.className = GRAPH_FILTER_FIELD;
    const searchSpan = document.createElement('span');
    searchSpan.textContent = 'Search';
    const searchInput = document.createElement('input');
    searchInput.id = 'graph-filter-search';
    searchInput.className = 'graph-filter-input';
    searchInput.type = 'search';
    searchInput.placeholder = 'Search statements or descriptions';
    searchInput.value = graphState.filters.search;
    searchLabel.append(searchSpan, searchInput);
    searchGroup.append(searchLabel);

    const checkField = document.createElement('div');
    checkField.className = GRAPH_FILTER_FIELD + ' graph-filter-checkbox-field';
    const checkSpan = document.createElement('span');
    checkSpan.textContent = 'Search options';
    const switchDiv = document.createElement('div');
    switchDiv.className = 'form-check form-switch graph-filter-switch';
    const checkInput = document.createElement('input');
    checkInput.id = 'graph-filter-include-children';
    checkInput.className = 'form-check-input';
    checkInput.type = 'checkbox';
    checkInput.role = 'switch';
    if (graphState.filters.includeChildren) checkInput.checked = true;
    const checkLabel = document.createElement('label');
    checkLabel.className = 'form-check-label graph-filter-switch-label';
    checkLabel.htmlFor = 'graph-filter-include-children';
    checkLabel.textContent = 'Include Children';
    switchDiv.append(checkInput, checkLabel);
    checkField.append(checkSpan, switchDiv);
    searchGroup.append(checkField);
    row.append(searchGroup);

    /**
     * Create an HTMLOptionElement with value, label, and selected state.
     * @param {string} value - The option value.
     * @param {string} label - The display label.
     * @param {boolean} [isSelected] - Whether the option is selected.
     * @returns {HTMLOptionElement} The created option element.
     */
    function createOption(value: string, label: string, isSelected = false): HTMLOptionElement {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (isSelected) opt.selected = true;
        return opt;
    }

    const effortLabel = document.createElement('label');
    effortLabel.className = GRAPH_FILTER_FIELD;
    const effortSpan = document.createElement('span');
    effortSpan.textContent = 'Effort estimate';
    const effortSelect = document.createElement('select');
    effortSelect.id = 'graph-filter-effort';
    effortSelect.className = 'graph-filter-select';
    effortSelect.append(
        createOption('all', 'All efforts', graphState.filters.effort === 'all'),
        createOption('unestimated', 'Unestimated', graphState.filters.effort === 'unestimated'),
        createOption('XS', 'XS', graphState.filters.effort === 'XS'),
        createOption('S', 'S', graphState.filters.effort === 'S'),
        createOption('M', 'M', graphState.filters.effort === 'M'),
        createOption('L', 'L', graphState.filters.effort === 'L'),
        createOption('XL', 'XL', graphState.filters.effort === 'XL'),
        createOption('XXL', 'XXL', graphState.filters.effort === 'XXL'),
        createOption('XXXL', 'XXXL', graphState.filters.effort === 'XXXL'),
    );
    effortLabel.append(effortSpan, effortSelect);
    row.append(effortLabel);

    const strideLabel = document.createElement('label');
    strideLabel.className = GRAPH_FILTER_FIELD;
    const strideSpan = document.createElement('span');
    strideSpan.textContent = 'Stride';
    const strideSelect = document.createElement('select');
    strideSelect.id = 'graph-filter-stride';
    strideSelect.className = 'graph-filter-select';
    strideSelect.append(createOption('all', 'All strides', graphState.filters.stride === 'all'));
    strideSelect.append(createOption('backlog', 'Backlog', graphState.filters.stride === 'backlog'));
    for (const stride of graphState.availableStrides) {
        const label = stride.name ? `Stride #${stride.id} - ${stride.name}` : `Stride #${stride.id}`;
        strideSelect.append(createOption(String(stride.id), label, graphState.filters.stride === String(stride.id)));
    }
    strideLabel.append(strideSpan, strideSelect);
    row.append(strideLabel);

    const statusLabel = document.createElement('label');
    statusLabel.className = GRAPH_FILTER_FIELD;
    const statusSpan = document.createElement('span');
    statusSpan.textContent = 'Moment status';
    const statusSelect = document.createElement('select');
    statusSelect.id = 'graph-filter-status';
    statusSelect.className = 'graph-filter-select';
    statusSelect.append(createOption('all', 'All statuses', graphState.filters.status === 'all'));
    for (const opt of STATUS_OPTIONS) {
        const value = opt.value.toLowerCase();
        statusSelect.append(createOption(value, `${opt.icon} ${opt.label}`, graphState.filters.status === value));
    }
    statusLabel.append(statusSpan, statusSelect);
    row.append(statusLabel);

    const assignLabel = document.createElement('label');
    assignLabel.className = GRAPH_FILTER_FIELD;
    const assignSpan = document.createElement('span');
    assignSpan.textContent = 'Assigned to me';
    const assignSelect = document.createElement('select');
    assignSelect.id = 'graph-filter-assignment';
    assignSelect.className = 'graph-filter-select';
    assignSelect.append(
        createOption('all', 'All', graphState.filters.assignment === 'all'),
        createOption(ASSIGNED_TO_ME, 'Assigned to me', graphState.filters.assignment === ASSIGNED_TO_ME),
    );
    assignLabel.append(assignSpan, assignSelect);
    row.append(assignLabel);

    const bottom = document.createElement('div');
    bottom.className = 'graph-filter-bottom';

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'graph-filter-types';
    const legend = document.createElement('legend');
    legend.className = 'graph-filter-group-label';
    legend.textContent = 'Promise types';
    const chipList = document.createElement('div');
    chipList.className = 'graph-filter-chip-list';
    for (const nodeType of NODE_TYPES) {
        const chipLabel = document.createElement('label');
        chipLabel.className = 'graph-filter-chip';
        const chipInput = document.createElement('input');
        chipInput.type = 'checkbox';
        chipInput.dataset.filterType = '';
        chipInput.value = nodeType;
        if (graphState.filters.types.has(nodeType)) chipInput.checked = true;
        const chipSpan = document.createElement('span');
        chipSpan.textContent = getTypeShortLabel(nodeType);
        chipLabel.append(chipInput, chipSpan);
        chipList.append(chipLabel);
    }
    fieldset.append(legend, chipList);
    bottom.append(fieldset);

    const bottomRow = document.createElement('div');
    bottomRow.className = 'graph-filter-bottom-row';

    const summary = document.createElement('div');
    summary.id = 'graph-filter-summary';
    summary.className = 'graph-filter-summary';
    summary.ariaLive = 'polite';

    const actions = document.createElement('div');
    actions.className = 'graph-filter-actions';

    /**
     * Create a button element with text, id, and CSS classes.
     * @param {string} text - The button label.
     * @param {string} id - The element id.
     * @param {string} className - The CSS class string.
     * @returns {HTMLButtonElement} The created button element.
     */
    function createButton(text: string, id: string, className: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.id = id;
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        return button;
    }
    actions.append(
        createButton('Reset', 'graph-filter-reset', 'btn btn-outline-danger btn-sm'),
        createButton('Hide All', 'graph-filter-hide-all', 'btn btn-outline-secondary btn-sm'),
        createButton('Expand All', 'graph-filter-expand-all', 'btn btn-outline-secondary btn-sm'),
        createButton('Refresh', 'graph-filter-refresh', 'btn btn-outline-primary btn-sm'),
    );

    bottomRow.append(summary, actions);
    bottom.append(bottomRow);

    filterBar.replaceChildren(row, bottom);
    bindFilterControls();
}

/**
 * Toggle the graph loading spinner visibility.
 * @param {boolean} isLoading - Whether the graph is in a loading state.
 */
function setGraphLoading(isLoading: boolean): void {
    const loadingState = document.querySelector('#graph-loading-state') as HTMLElement | undefined | null;
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

    const resetButton = document.querySelector('#graph-filter-reset') as HTMLElement | undefined | null;
    const hideAllButton = document.querySelector('#graph-filter-hide-all') as HTMLElement | undefined | null;
    const expandAllButton = document.querySelector('#graph-filter-expand-all') as HTMLElement | undefined | null;
    const refreshButton = document.querySelector('#graph-filter-refresh') as HTMLElement | undefined | null;

    for (const input of document.querySelectorAll<HTMLInputElement>('[data-filter-type]')) {
        input.addEventListener('change', (event) => {
            const changed = event.target as HTMLInputElement;
            const isChecked = !!changed.checked;

            // Work off a copy of the previous selection to avoid extra DOM reads.
            const previousTypes = new Set(graphState.filters.types);

            // If the user just unchecked a type and previously all types were selected,
            // deselect this type and every type after it (inverse cascade).
            if (!isChecked && NODE_TYPES.every(t => previousTypes.has(t as never))) {
                const index = NODE_TYPES.indexOf(changed.value as never);
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
        graphState.applyTimer = undefined;
        applyFilters();
    }, delay);
}

/**
 * Update the filter summary text that shows visible/total/hidden node counts.
 * @param {{visibleNodes: number, directMatches: number, hiddenNodes: number}} metrics - The filter result metrics.
 */
function updateFilterSummary(metrics: FilterMetrics): void {
    const summaryElement = document.querySelector('#graph-filter-summary') as HTMLElement | undefined | null;
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

    const hiddenSuffix = metrics.hiddenNodes > 0 ? ' (' + metrics.hiddenNodes + ' hidden)' : '';
    if (metrics.directMatches === metrics.visibleNodes) {
        summaryElement.textContent = 'Showing ' + visibleLabel + ' of ' + totalLabel + hiddenSuffix + '.';
        return;
    }

    const matchLabel = 'direct match' + (metrics.directMatches === 1 ? '' : 'es');
    const hiddenExtra = metrics.hiddenNodes > 0 ? ', ' + metrics.hiddenNodes + ' hidden' : '';
    summaryElement.textContent = 'Showing ' + visibleLabel + ' of ' + totalLabel + ' (' + metrics.directMatches + ' ' + matchLabel + hiddenExtra + ').';
}



/**
 * Initialize zoom control buttons (zoom in, zoom out, reset, fullscreen).
 * @param {object} zoomBehavior - The D3 zoom behavior instance.
 * @param {SVGElement} svgNode - The SVG element to apply zoom transforms to.
 * @param {object} d3Instance - The D3 module instance.
 */
export function initZoomControls(zoomBehavior: unknown, svgNode: SVGElement, d3Instance: Record<string, unknown>): void {
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

    const fullscreenButton = document.querySelector('#graph-fullscreen-btn') as HTMLElement | undefined | null;
    fullscreenButton?.addEventListener('click', () => {
        const viewport = document.querySelector('#graph-viewport') as HTMLElement | undefined;
        if (document.fullscreenElement) {
            void document.exitFullscreen?.();
        } else {
            void (viewport as HTMLElement | null)?.requestFullscreen?.();
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
function renderTree(_contentDiv: HTMLElement, d3: Record<string, unknown>, treeData: GraphNode, restoreTransform?: unknown, focusNodeData?: GraphNode | undefined, isAnimate: boolean = false): void {
    const graphContent = document.querySelector('#graph-content') as HTMLElement | undefined | null;
    if (!graphContent) return;

    const graphViewport = document.querySelector('#graph-viewport') as HTMLElement | undefined | null;

    (graphState.contextMenu as { hide?: () => void } | null)?.hide?.();

    const speedElement = document.querySelector('#graph-animation-speed') as HTMLInputElement | null;
    graphState.animationSpeed = speedElement ? Number(speedElement.value) || 1 : 1;

    const result = renderStackGraph(graphContent, d3 as unknown as D3Module, treeData, {
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
    graphState.filteredTree = filterTree(graphState.rawTree, graphState.filters, metrics, true, graphState.collapsedNodeIds);
    const isAnimate = graphState.hasRendered;

    syncFiltersToUrl(graphState.filters);

    const graphContent = document.querySelector('#graph-content') as HTMLElement | undefined | null;
    if (graphState.filteredTree) {
        let focusNode: GraphNode | null | undefined;
        if (graphState.filters.search) {
            focusNode = findFirstSearchMatch(graphState.filteredTree);
        } else if (graphState.focusNodeId) {
            focusNode = findNodeById(graphState.filteredTree, graphState.focusNodeId) as unknown as GraphNode | null | undefined;
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
        renderTree(graphContent!, graphState.d3 as Record<string, unknown>, graphState.filteredTree ?? undefined, restoreTransform, focusNode ?? undefined, isAnimate);
    } else {
        renderEmptyState(graphContent!, 'No cards match the current filters.');
    }

    graphState.hasRendered = true;
    updateFilterSummary(metrics);
}

/**
 * Reload the full graph data from the server and re-render.
 * @returns {Promise<{ rootPromises: GraphNode[]; rawTree: GraphNode }>} The loaded graph data.
 */
async function loadGraphData(): Promise<{ rootPromises: GraphNode[]; rawTree: GraphNode }> {
    const graphData = await getGraphData(graphState.owner ?? '', graphState.project ?? '') as Record<string, unknown>;
    const rootPromises = ((graphData.promises ?? graphData.Promises ?? []) as Record<string, unknown>[]).map(x => buildPromiseNode(x));
    const project = {
        id: graphData.id ?? graphData.Id,
        name: graphData.name ?? graphData.Name,
        description: graphData.description ?? graphData.Description,
    };
    const rawTree = parseGraphData(rootPromises, graphState.owner ?? '', graphState.project ?? '', project) as unknown as GraphNode;
    return { rootPromises, rawTree };
}

/**
 *
 */
async function reloadGraphData(): Promise<void> {
    const errorElement = document.querySelector('#error-text') as HTMLElement | undefined | null;
    const successElement = document.querySelector('#success-text') as HTMLElement | undefined | null;

    setGraphLoading(true);
    if (errorElement) errorElement.textContent = '';
    if (successElement) successElement.textContent = '';

    try {
        const { rootPromises, rawTree } = await loadGraphData();
        graphState.rawTree = rawTree;
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
 * @param {HTMLElement} _contentDiv - The main content container.
 * @param {Record<string, unknown> } permission - The current user's permission object for the project.
 * @returns {Promise<void>} Resolves when the graph page is fully loaded and rendered.
 */
export async function loadGraphPage(owner: string, project: string, _contentDiv: HTMLElement, permission: Record<string, unknown> | null): Promise<void> {
    const errorElement = document.querySelector('#error-text') as HTMLElement | undefined | null;
    const successElement = document.querySelector('#success-text') as HTMLElement | undefined | null;

    if (graphState.pageShowRefreshHandler) {
        window.removeEventListener('pageshow', graphState.pageShowRefreshHandler);
        graphState.pageShowRefreshHandler = undefined;
    }

    graphState.owner = owner;
    graphState.project = project;
    graphState.d3 = (globalThis as unknown as Record<string, unknown>).d3;
    graphState.filters = readFiltersFromUrl();
    graphState.focusNodeId = readGraphFocusFromUrl();
    graphState.zoomTransform = undefined;
    graphState.userZoomTransform = undefined;
    graphState.suppressZoomStateUpdate = false;
    graphState.rawTree = undefined;
    graphState.filteredTree = undefined;
    graphState.totalRenderableNodes = 0;
    graphState.availableStrides = [];
    graphState.collapsedNodeIds = new Set();
    graphState.hasRendered = false;

    (graphState.contextMenu as { destroy?: () => void } | null)?.destroy?.();
    graphState.contextMenu = createGraphContextMenuController({
        owner,
        project,
        getAvailableStrides: () => graphState.availableStrides as unknown as { id: number; name?: string }[],
        onGraphMutated: reloadGraphData,
        isNodeChildrenHidden: (nodeData: Record<string, unknown>) => isNodeCollapsed((nodeData as GraphNode)?.id),
        setNodeChildrenHidden: async (nodeData: Record<string, unknown>, isHidden: boolean) => {
            const nodeId = (nodeData as GraphNode)?.id;
            if (!nodeId) return;

            setNodeCollapsed(nodeId, isHidden);
            requestApplyFilters(0);
        },
        revealNextLevel: async (nodeData: Record<string, unknown>) => {
            revealNextLevel(nodeData as GraphNode);
            requestApplyFilters(0);
        },
        onProjectDeleted: () => {
            location.assign('/projects');
        },
        permission: permission as { permission?: string } | undefined,
    });

    graphState.pageShowRefreshHandler = (event: PageTransitionEvent) => {
        if (!event.persisted) return;
        void reloadGraphData();
    };
    window.addEventListener('pageshow', graphState.pageShowRefreshHandler);

    document.removeEventListener('fullscreenchange', graphState._onFullscreenChange as unknown as EventListener);
    graphState._onFullscreenChange = () => {
        const button = document.querySelector('#graph-fullscreen-btn') as HTMLElement | undefined | null;
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

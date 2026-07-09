import { getStatusIcon, getStatusBucket } from '../utils/status-utilities.ts';

/** Minimal D3 selection interface for chaining. */
type D3Sel = Record<string, (argument: unknown) => unknown> & {
    select: (s: string) => D3Sel;
    selectAll: (s: string) => D3Sel;
    append: (s: string) => D3Sel;
    attr: (a: string, b?: unknown) => D3Sel;
    style: (a: string, b?: unknown) => D3Sel;
    text: (v?: unknown) => D3Sel;
    classed: (a: string, b?: unknown) => D3Sel;
    call: (function_: unknown, ...arguments_: unknown[]) => D3Sel;
    node: () => SVGElement;
    on: (event: string, handler: (...eventData: unknown[]) => void) => D3Sel;
    size: () => number;
    datum: (d?: unknown) => D3Sel;
    data: (d: unknown[], key?: unknown) => D3Sel;
    enter: () => D3Sel;
    exit: () => D3Sel;
    merge: (o: unknown) => D3Sel;
    transition: (n?: unknown) => D3Sel;
    duration: (ms: number) => D3Sel;
    remove: () => D3Sel;
    filter: (p: unknown) => D3Sel;
    each: (f: unknown) => D3Sel;
    html: (v?: unknown) => D3Sel;
    lower: () => D3Sel;
    empty: () => boolean;
};

/** Minimal D3 module interface for graph visualization. */
export interface D3Module {
    select: (selector: string | Element) => unknown;
    transition: (name?: string) => { duration: (ms: number) => unknown };
    linkHorizontal: () => unknown;
    min: <T>(data: T[], accessor: (d: T) => number) => number | undefined;
    max: <T>(data: T[], accessor: (d: T) => number) => number | undefined;
    zoomIdentity: unknown;
    hierarchy: <T>(data: T) => { descendants: () => { data: T; x: number; y: number; depth?: number; parent?: unknown; children?: unknown[] }[]; links: () => { source: unknown; target: unknown }[]; height: number };
    zoomTransform: (node: SVGElement) => unknown;
    create: (ns: string) => unknown;
    tree: () => { nodeSize: (size: [number, number]) => { (root: Record<string, unknown>): void }; (root: Record<string, unknown>): void };
    zoom: () => { scaleExtent: (s: [number, number]) => unknown; extent: (s: [[number, number], [number, number]]) => unknown; translateExtent: (s: [[number, number], [number, number]]) => unknown; on: (event: string, handler: (event: Record<string, unknown>) => void) => unknown; transform: unknown };
}



/** Horizontal gap between graph tiers in full mode. */
const STEP_GAP_X = 360;
/** Vertical gap between graph tiers in full mode. */
const STEP_GAP_Y = 190;
/** Width of a graph card in pixels. */
const CARD_WIDTH = 300;
/** Height of a graph card in pixels. */
const CARD_HEIGHT = 144;
/** Corner radius of graph cards. */
const CARD_RADIUS = 18;
/** Horizontal padding inside graph cards. */
const CARD_PADDING_X = 16;
/** Top padding inside graph cards. */
const CARD_PADDING_TOP = 16;
/** Y-offset for the first detail line on moment cards. */
const DETAIL_START_Y = 62;
/** Vertical gap between detail lines on moment cards. */
const DETAIL_LINE_GAP = 22;
/** Vertical forehead gap above the root card in full mode. */
const FOREHEAD_GAP = 88;

/** Horizontal gap between graph tiers in compact (detail-page) mode. */
const COMPACT_STEP_GAP_X = 400;
/** Vertical gap between graph tiers in compact mode. */
const COMPACT_STEP_GAP_Y = 180;
/** Minimum vertical tier gap in compact mode. */
const COMPACT_MIN_TIER_GAP_Y = 72;
/** Forehead gap above the root card in compact mode. */
const COMPACT_FOREHEAD_GAP = 40;
/** Minimum tier gap used for spacing calculations in compact mode. */
const COMPACT_MIN_TIER_GAP = 140;
/** Largest cards when the detail page shows the fewest tiers (promise). */
const COMPACT_DETAIL_SCALE_MAX = 1.32;
/** Smallest cards when the detail page shows the most tiers (moment). */
const COMPACT_DETAIL_SCALE_MIN = 0.84;

/** Ordered list of all node types in the promise stack, from broadest to most granular. */
export const NODE_TYPES = ['promise', 'epic', 'journey', 'flow', 'moment'] as const;
/** Union type of all valid node type strings. */
type NodeType = typeof NODE_TYPES[number];
/** Map from node type to its URL route segment. */
const NODE_ROUTE_SEGMENTS: Record<string, string> = {
    promise: 'promises',
    epic: 'epics',
    journey: 'journeys',
    flow: 'flows',
    moment: 'moments',
};
/** Map from node type to its index in the NODE_TYPES array for ordering. */
export const NODE_TYPE_INDEX = new Map(NODE_TYPES.map((type, index) => [type, index]));

/**
 * Normalize text by trimming and lowercasing.
 * @param {string} value - The text to normalize.
 * @returns {string} The normalized text.
 */
export function normalizeText(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
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
export function logGraphFocus(stage: string, details: Record<string, unknown>): void {
    if (!isGraphFocusDebugEnabled()) return;
    console.info('[graph-focus]', stage, details);
}

/**
 * Get the inner viewport dimensions of an element, excluding padding.
 * @param {HTMLElement} element - The element to measure.
 * @returns {{width: number, height: number}} The inner dimensions.
 */
function getInnerViewportSize(element: HTMLElement): { width: number; height: number } {
    if (!element) return { width: 0, height: 0 };

    const styles = getComputedStyle(element);
    const paddingLeft = Number(styles.paddingLeft || '0');
    const paddingRight = Number(styles.paddingRight || '0');
    const paddingTop = Number(styles.paddingTop || '0');
    const paddingBottom = Number(styles.paddingBottom || '0');

    return {
        width: Math.max(0, element.clientWidth - paddingLeft - paddingRight),
        height: Math.max(0, element.clientHeight - paddingTop - paddingBottom),
    };
}

/**
 * Truncate text to a maximum length with ellipsis.
 * @param {string} text - The text to truncate.
 * @param {number} [maxLength] - The maximum length before truncation.
 * @returns {string} The truncated text.
 */
function truncateText(text: unknown, maxLength = 40): string {
    const value = String(text ?? '').trim();
    if (value.length <= maxLength) return value;
    if (maxLength <= 3) return '.'.repeat(maxLength);
    return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

/**
 * Format an effort estimate value for display.
 * @param {unknown} value - The effort estimate value.
 * @returns {string} The formatted estimate string.
 */
function formatEstimate(value: unknown): string {
    return value === null ? 'Unestimated' : String(value);
}

/**
 * Get the display label for the child type of a given node type.
 * @param {string} nodeType - The parent node type.
 * @returns {string} The child type label, or null for unknown types.
 */
function getChildTypeLabel(nodeType: string): string | undefined {
    switch (nodeType) {
        case 'promise': { return 'Epic';
        }
        case 'epic': { return 'Journey';
        }
        case 'journey': { return 'Flow';
        }
        case 'flow': { return 'Moment';
        }
        default: { return;
        }
    }
}

/**
 * Get a summary string of completed vs total child nodes.
 * @param {object} nodeData - The node data containing childCount and completedChildCount.
 * @returns {string|undefined} The progress summary string, or undefined if no child type exists.
 */
function getChildProgressSummary(nodeData: Record<string, unknown>): string | undefined {
    const childLabel = getChildTypeLabel(nodeData.nodeType as string);
    if (!childLabel) return;

    const childCount = (nodeData.childCount as number) ?? 0;
    const completedCount = (nodeData.completedChildCount as number) ?? 0;

    return completedCount + '/' + childCount + ' ' + (childCount === 1 ? childLabel : childLabel + 's') + ' completed';
}

/**
 * Get the human-readable label for a node's sub-type (e.g. Story, Job).
 * @param {object} payload - The node payload containing a type field.
 * @returns {string|undefined} The type label, or undefined if not set.
 */
function getNodeTypeLabel(payload: Record<string, unknown> | undefined): string | undefined {
    const value = String(payload?.type ?? payload?.Type ?? '').trim();
    if (!value) return;

    const normalized = value.toLowerCase();
    if (normalized === 'story') return 'Story';
    if (normalized === 'job') return 'Job';

    return value;
}

/**
 * Get a summary of completed tasks within a moment node.
 * @param {object} payload - The moment payload containing a tasks array.
 * @returns {string|undefined} The task summary string, or undefined if no tasks exist.
 */
function getMomentTaskSummary(payload: Record<string, unknown> | undefined): string | undefined {
    const tasks = Array.isArray(payload?.tasks) ? payload.tasks as Record<string, unknown>[] : [];
    if (tasks.length === 0) return;

    const completedCount = tasks.filter(task => task?.isCompleted ?? task?.IsCompleted).length;
    return `Tasks: ${completedCount}/${tasks.length} complete`;
}

/**
 * Get the truncated card description for a graph node.
 * @param {object} payload - The node payload containing a description field.
 * @param {number} [maxLength] - The maximum description length.
 * @returns {string} The truncated description, or 'Description: None' if empty.
 */
function getCardDescription(payload: Record<string, unknown> | undefined, maxLength = 52): string {
    const description = String(payload?.description ?? payload?.Description ?? '').trim();
    if (!description) return 'Description: None';

    return truncateText(description.replaceAll(/\s+/g, ' '), maxLength);
}

/**
 * Get the display label for a stride assignment in the graph.
 * @param {object} payload - The node payload containing an assignedStrideId.
 * @returns {string} The stride label (e.g. 'Stride: Backlog' or 'Stride # N').
 */
function getStrideLabel(payload: Record<string, unknown> | undefined): string {
    const id = payload?.assignedStrideId as string | undefined;
    if ([undefined, 'unassigned', ''].includes(id)) return 'Stride: Backlog';
    return `Stride # ${id}`;
}

/**
 * Get the full title text for a graph node (used in tooltips).
 * @param {object} nodeData - The node data.
 * @returns {string} The multi-line title string.
 */
function getNodeTitle(nodeData: Record<string, unknown>): string {
    const payload = (nodeData.payload ?? {}) as Record<string, unknown>;
    const lines = [String(payload.statement ?? payload.name ?? `#${payload.id}`)];

    if (nodeData.nodeType === 'moment') {
        lines.push(getStrideLabel(payload));
        if (payload.description) lines.push(truncateText(payload.description as string, 40));
        lines.push(`Effort: ${formatEstimate(payload.effortEstimate)}`);
        const taskSummary = getMomentTaskSummary(payload);
        if (taskSummary) lines.push(taskSummary);
    }

    return lines.join('\n');
}


/**
 * Categorize an effort estimate into a bucket for graph filtering.
 * @param {unknown} effortEstimate - The effort estimate value.
 * @returns {string} The effort bucket ('unestimated', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL').
 */
export function getMomentEffortBucket(effortEstimate: unknown): string {
    if (effortEstimate === null) return 'unestimated';

    const normalized = normalizeText(effortEstimate);
    const allowed = new Set(['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']);
    return allowed.has(normalized) ? normalized.toUpperCase() : 'unestimated';
}

/**
 * Categorize a moment by its stride assignment status.
 * @param {object} payload - The moment payload containing assignedStrideId.
 * @returns {string} The stride bucket ('backlog' or the stride ID as string).
 */
export function getMomentStrideBucket(payload: Record<string, unknown> | undefined): string {
    const id = payload?.assignedStrideId as string | undefined;
    if ([undefined, 'unassigned', ''].includes(id)) return 'backlog';
    return String(id);
}

/**
 * Compute child count and completed child count from a list of children.
 * @param {object[]} children - The list of child entities.
 * @returns {{childCount: number, completedChildCount: number}} The computed metrics.
 */
export function computeChildMetrics(children: Record<string, unknown>[]): { childCount: number; completedChildCount: number } {
    const list = Array.isArray(children) ? children : [];
    const childCount = list.length;
    const completedChildCount = list.filter(child => getStatusBucket(child?.statusColor as string) === 'done').length;
    return { childCount, completedChildCount };
}

/**
 * Create a new graph node with the given type, payload, and children.
 * @param {string} nodeType - The node type (promise, epic, journey, flow, moment).
 * @param {object} payload - The node's data payload.
 * @param {object[]} [children] - The node's child nodes.
 * @returns {object} The created graph node with derived fields.
 */
export function createNode(nodeType: string, payload: Record<string, unknown>, children: Record<string, unknown>[] = []) {
    const childCount = children.length;
    const completedChildCount = children.filter(child => getStatusBucket((child.payload as Record<string, unknown> | undefined)?.statusColor as string ?? child.statusColor as string) === 'done').length;

    const label = String(payload.statement ?? payload.name ?? `#${payload.id}`);
    const searchText = normalizeText([
        label,
        payload.description as string,
    ].join(' '));

    const statusBucket = getStatusBucket(payload?.statusColor as string);
    const effortBucket = nodeType === 'moment' ? getMomentEffortBucket(payload?.effortEstimate) : undefined;
    const strideBucket = nodeType === 'moment' ? getMomentStrideBucket(payload) : undefined;

    return {
        id: `${nodeType}-${payload.sequenceNumber ?? payload.id}`,
        nodeType,
        label,
        payload,
        childCount: (payload._childCount as number) ?? childCount,
        completedChildCount: (payload._completedChildCount as number) ?? completedChildCount,
        children,
        _searchText: searchText,
        _statusBucket: statusBucket,
        _effortBucket: effortBucket,
        _strideBucket: strideBucket,
    };
}

/**
 * Create a graph node pre-populated with child metric calculations.
 * @param {string} nodeType - The node type.
 * @param {object} payload - The node's data payload.
 * @param {object} [childMetrics] - Optional pre-computed child metrics.
 * @returns {object} The created graph node.
 */
export function createNodeWithMetrics(nodeType: string, payload: Record<string, unknown>, childMetrics?: { childCount: number; completedChildCount: number } | null) {
    const enrichedPayload = { ...payload } as Record<string, unknown>;
    if (childMetrics) {
        enrichedPayload._childCount = childMetrics.childCount;
        enrichedPayload._completedChildCount = childMetrics.completedChildCount;
    }
    return createNode(nodeType, enrichedPayload, []);
}

/**
 * Get the display accent color for a graph node based on its type.
 * @param {string} nodeType - The node type.
 * @returns {string} The hex color string.
 */
function getNodeColor(nodeType: string): string {
    switch (nodeType) {
        case 'project': { return '#1d3557';
        }
        case 'promise': { return '#0f4c5c';
        }
        case 'epic': { return '#2d6a4f';
        }
        case 'journey': { return '#8b5e34';
        }
        case 'flow': { return '#6c584c';
        }
        case 'moment': { return '#355070';
        }
        default: { return '#334155';
        }
    }
}

/**
 * Get the application base URL path by examining the current URL segments.
 * @returns {string} The base path (empty string or /owner/project).
 */
function getAppBasePath(): string {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const routeRootIndex = pathSegments.findIndex(segment => Object.prototype.hasOwnProperty.call(NODE_ROUTE_SEGMENTS, segment));

    if (routeRootIndex > 0) {
        return `/${pathSegments.slice(0, routeRootIndex).join('/')}`;
    }

    // For project-scoped URLs like /{owner}/{project}/..., use the owner/project prefix
    if (pathSegments.length >= 2) {
        return `/${pathSegments[0]}/${pathSegments[1]}`;
    }

    return '';
}

/**
 * Get the navigation URL for a graph node (links to its detail page with graph focus).
 * @param {object} node - The graph node.
 * @param {string} _owner - The project owner's slug.
 * @param {string} _project - The project's slug.
 * @returns {string|undefined} The detail page URL, or undefined if node type has no route.
 */
function getNodeHref(node: Record<string, unknown>, _owner: string, _project: string): string | undefined {
    const routeSegment = (NODE_ROUTE_SEGMENTS as Record<string, string>)[node.nodeType as string];
    if (!routeSegment) return;

    const parameters = new URLSearchParams();
    parameters.set('graphFocus', node.id as string);

    const seq = (node.payload as Record<string, unknown> | undefined)?.sequenceNumber ?? (node.payload as Record<string, unknown> | undefined)?.id;
    return `${getAppBasePath()}/${routeSegment}/${seq}?${parameters.toString()}`;
}

/**
 * Get the searchable text content for a graph node (label + description).
 * @param {object} node - The graph node.
 * @returns {string} The normalized search text.
 */
export function getNodeSearchText(node: Record<string, unknown>): string {
    return (node._searchText as string) ?? normalizeText([
        node.label as string,
        (node.payload as Record<string, unknown> | undefined)?.description as string,
    ].join(' '));
}

/**
 * Recursively find a node in the graph tree by its ID.
 * @param {object} treeData - The tree root to search.
 * @param {string} nodeId - The node ID to find.
 * @returns {object|undefined} The matching node, or undefined if not found.
 */
export function findNodeById(treeData: Record<string, unknown> | undefined, nodeId: string | undefined): Record<string, unknown> | undefined {
    if (!treeData || !nodeId) return;

    if (treeData.id === nodeId) {
        return treeData;
    }

    const treeChildren = (treeData.children as Record<string, unknown>[]) ?? [];
    for (const child of treeChildren) {
        const match = findNodeById(child, nodeId);
        if (match) {
            return match;
        }
    }

}

/**
 * Count the number of renderable (non-root) nodes in the graph tree.
 * @param {object} node - The tree root node.
 * @returns {number} The count of renderable nodes.
 */
export function countRenderableNodes(node: Record<string, unknown> | undefined): number {
    if (!node) return 0;

    const selfCount = node.nodeType === 'root' ? 0 : 1;
    let sum = selfCount;
    const children = (node.children as Record<string, unknown>[]) ?? [];
    for (const child of children) {
        sum += countRenderableNodes(child);
    }
    return sum;
}

/**
 * Parse raw promise data into a structured graph tree with a root node.
 * @param {object[]} rootPromises - The top-level promise nodes.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} [projectEntity] - Optional project entity for the root label.
 * @returns {object} The parsed tree with a root node.
 */
export function parseGraphData(rootPromises: Record<string, unknown>[], owner: string, project: string, projectEntity?: Record<string, unknown> | null) {
    const rawName = projectEntity?.name ?? projectEntity?.Name ?? '';
    const normalizedName = String(rawName).trim();
    const projectLabel = normalizedName || `Project ${owner}/${project}`;

    return {
        id: `root-${owner}-${project}`,
        nodeType: 'root',
        label: projectLabel,
        payload: {
            id: (projectEntity as Record<string, unknown> | undefined)?.id,
            name: projectLabel,
            description: (projectEntity as Record<string, unknown> | undefined)?.description ?? (projectEntity as Record<string, unknown> | undefined)?.Description,
        },
        children: rootPromises,
    };
}

/**
 * Render an empty state message inside a graph container.
 * @param {HTMLElement} contentDiv - The container element.
 * @param {string} message - The message to display.
 */
export function renderEmptyState(contentDiv: HTMLElement | undefined, message: string): void {
    if (!contentDiv) return;
    contentDiv.replaceChildren();

    const emptyState = document.createElement('div');
    emptyState.className = 'graph-empty-state';
    emptyState.textContent = message;
    contentDiv.append(emptyState);
}

/**
 * Calculate the rendered position of a node in the graph, accounting for content offsets.
 * @param {{ x: number; y: number }} node - The hierarchy node with x/y coordinates.
 * @param {number} node.x - The hierarchy x-coordinate.
 * @param {number} node.y - The hierarchy y-coordinate.
 * @param {number} contentOffsetX - The X content offset.
 * @param {number} contentOffsetY - The Y content offset.
 * @returns {{x: number, y: number}} The rendered position.
 */
function getRenderedNodePosition(node: { x: number; y: number }, contentOffsetX: number, contentOffsetY: number): { x: number; y: number } {
    const nx = Number.isFinite(node.x) ? node.x : 0;
    const ny = Number.isFinite(node.y) ? node.y : 0;
    const rx = ny + contentOffsetX;
    const ry = nx + contentOffsetY;
    return {
        x: Number.isFinite(rx) ? rx : 0,
        y: Number.isFinite(ry) ? ry : 0,
    };
}

/**
 * Sanitize D3 tree layout positions, replacing NaN with 0 to prevent
 * invalid SVG attribute values (translate(NaN), path d="MNaN").
 * NaN coordinates can occur in edge cases such as viewport settling races,
 * zero-depth trees, or D3 internal division-by-zero.
 * @param {object} root - The D3 hierarchy root.
 * @param {() => Array<{ x: number; y: number }>} root.descendants - The descendants accessor returning {x,y} nodes.
 */
function sanitizeTreePositions(root: { descendants: () => Array<{ x: number; y: number }> }): void {
    for (const node of root.descendants()) {
        if (!Number.isFinite(node.x)) node.x = 0;
        if (!Number.isFinite(node.y)) node.y = 0;
    }
}

/**
 * Create a D3 zoom transform that centers the viewport on a given node.
 * @param {object} d3 - The D3 module instance.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {object} node - The hierarchy node to focus on.
 * @param {number} contentOffsetX - The X content offset.
 * @param {number} contentOffsetY - The Y content offset.
 * @param {number} [scale] - The zoom scale.
 * @returns {object|undefined} The zoom transform, or undefined if no node provided.
 */
function createFocusTransform(d3: D3Module, viewportWidth: number, viewportHeight: number, node: { x: number; y: number } | undefined, contentOffsetX: number, contentOffsetY: number, scale = 1.5): Record<string, unknown> | undefined {
    if (!node) return;
    const targetScale = Math.max(0.5, Math.min(2.5, scale));
    const position = getRenderedNodePosition(node, contentOffsetX, contentOffsetY);

    const zi = d3.zoomIdentity as { translate: (x: number, y: number) => { scale: (s: number) => { translate: (x: number, y: number) => Record<string, unknown> } } };
    return zi.translate(viewportWidth / 2, viewportHeight / 2).scale(targetScale).translate(-position.x, -position.y);
}

/**
 * Get the layout profile for compact (detail-page) graph rendering based on visible node count.
 * @param {number} visibleCount - The number of visible nodes.
 * @param {number} _viewportWidth - The viewport width.
 * @param {number} _viewportHeight - The viewport height.
 * @returns {{nodeScale: number, minGapX: number, minGapY: number, forehead: number, anchorOffsetX: number, anchorOffsetY: number}} The layout profile.
 */
function getCompactLayoutProfile(visibleCount: number, _viewportWidth: number, _viewportHeight: number): { nodeScale: number; minGapX: number; minGapY: number; forehead: number; anchorOffsetX: number; anchorOffsetY: number } {
    // Explicit presets tuned for the detail pages (1..5 visible cards)
    // Provide nodeScale and suggested min gaps; fall back to defaults if out of range.
    const presets: Record<number, { nodeScale: number; minGapX: number; minGapY: number; forehead: number; anchorOffsetX: number; anchorOffsetY: number }> = {
        // Promise detail
        1: { nodeScale: 1.1, minGapX: 340, minGapY: 100, forehead: COMPACT_FOREHEAD_GAP, anchorOffsetX: -10, anchorOffsetY: -8 },
        // Epic detail
        2: { nodeScale: 1.1, minGapX: 340, minGapY: 100, forehead: COMPACT_FOREHEAD_GAP, anchorOffsetX: -20, anchorOffsetY: 0 },
        // Journey detail
        3: { nodeScale: 0.98, minGapX: 320, minGapY: 92, forehead: COMPACT_FOREHEAD_GAP, anchorOffsetX: 0, anchorOffsetY: 0 },
        // Flow detail
        4: { nodeScale: 0.94, minGapX: 320, minGapY: 96, forehead: COMPACT_FOREHEAD_GAP, anchorOffsetX: 0, anchorOffsetY: 0 },
        // Moment detail
        5: { nodeScale: 0.94, minGapX: 300, minGapY: 96, forehead: COMPACT_FOREHEAD_GAP, anchorOffsetX: -150, anchorOffsetY: -10 },
    };

    const key = Math.max(1, Math.min(5, visibleCount));
    return presets[key] ?? presets[3];
}

/**
 * Uniform card scale for the detail-page facsimile: fewer tiers on screen (higher stack
 * detail pages) => larger cards; more tiers (e.g. moment) => smaller cards.
 * @param {string} activeDetailNodeType - The active detail node type.
 * @returns {number} The uniform node scale factor.
 */
export function getDetailPageNodeScale(activeDetailNodeType: string): number {
    const index = NODE_TYPES.indexOf(activeDetailNodeType as NodeType);
    if (index === -1) return 1;

    const tiersShown = index + 2;
    const minTiers = 2;
    const maxTiers = NODE_TYPES.length + 1;
    const t = (tiersShown - minTiers) / (maxTiers - minTiers);

    return COMPACT_DETAIL_SCALE_MAX - t * (COMPACT_DETAIL_SCALE_MAX - COMPACT_DETAIL_SCALE_MIN);
}

/**
 * Append (or update) SVG elements for graph nodes and links using D3 data join.
 * @param {object} d3 - The D3 module instance.
 * @param {object} layer - The D3 selection of the graph layer.
 * @param {object[]} renderable - The list of hierarchy nodes to render.
 * @param {object[]} links - The list of link objects between nodes.
 * @param {object} options - Rendering options.
 * @param {number} options.contentOffsetX - The X content offset.
 * @param {number} options.contentOffsetY - The Y content offset.
 * @param {string} options.cardClipPathId - The clip path ID for card masking.
 * @param {string } options.owner - The project owner's slug.
 * @param {string } options.project - The project's slug.
 * @param {string } options.focusNodeId - The focused node ID.
 * @param {((event: MouseEvent | KeyboardEvent | Record<string, unknown>, data: Record<string, unknown>) => void) } options.onContextMenu - Context menu event handler.
 * @param {boolean} options.enableZoom - Whether zoom is enabled.
 * @param {boolean} [options.enableLinks] - Whether links are enabled.
 * @param {number } [options.uniformNodeScale] - Uniform node scale factor.
 * @param {boolean} [options.animate] - Whether to animate transitions.
 * @param {number} [options.animationSpeed] - Animation speed multiplier.
 */
function appendGraphNodes(d3: D3Module, layer: D3Sel, renderable: Record<string, unknown>[], links: Record<string, unknown>[], options: {
    contentOffsetX: number;
    contentOffsetY: number;
    cardClipPathId: string;
    owner: string | undefined;
    project: string | undefined;
    focusNodeId: string | undefined;
    onContextMenu: ((event: MouseEvent | KeyboardEvent | Record<string, unknown>, data: Record<string, unknown>) => void) | undefined;
    enableZoom: boolean;
    enableLinks?: boolean;
    uniformNodeScale?: number;
    animate?: boolean;
    animationSpeed?: number;
}): void {
    const {
        contentOffsetX,
        contentOffsetY,
        cardClipPathId,
        owner,
        project,
        focusNodeId,
        onContextMenu,
        enableZoom: isEnableZoom,
        enableLinks: isEnableLinks = isEnableZoom,
        uniformNodeScale,
        animate: isAnimate = false,
        animationSpeed = 1,
    } = options;

    const nodeScale: number = uniformNodeScale !== undefined && Number.isFinite(uniformNodeScale) ? uniformNodeScale : 1;
    const containerTag = isEnableLinks ? 'a' : 'g';
    const duration = Math.max(0, Math.round(200 / Math.max(0.1, animationSpeed)));
    const t = d3.transition().duration(duration);

    /**
     * Compute the final transform for a node in the animated transition.
     * @param {object} d - The D3 node data.
     * @returns {string} A CSS translate() string with the target position and scale.
     */
    function getFinalTransform(d: Record<string, unknown>): string {
        const dx = Number.isFinite(d.x as number) ? (d.x as number) : 0;
        const dy = Number.isFinite(d.y as number) ? (d.y as number) : 0;
        const ttx = dy + contentOffsetX;
        const tty = dx + contentOffsetY;
        return `translate(${Number.isFinite(ttx) ? ttx : 0}, ${Number.isFinite(tty) ? tty : 0}) scale(${Number.isFinite(nodeScale) ? nodeScale : 1})`;
    }

    /**
     * Compute the transform for a node at its parent position (used for exit animations).
     * @param {object} d - The D3 node data.
     * @returns {string} A CSS translate() string with the parent position and scale.
     */
    function getParentTransform(d: Record<string, unknown>): string {
        const parent = d.parent as Record<string, unknown> | undefined;
        const rawPx = parent ? (parent.y as number) : 0;
        const rawPy = parent ? (parent.x as number) : 0;
        const px = Number.isFinite(rawPx) ? rawPx : 0;
        const py = Number.isFinite(rawPy) ? rawPy : 0;
        const ttx = px + contentOffsetX;
        const tty = py + contentOffsetY;
        return `translate(${Number.isFinite(ttx) ? ttx : 0}, ${Number.isFinite(tty) ? tty : 0}) scale(${Number.isFinite(nodeScale) ? nodeScale : 1})`;
    }

    /**
     * Compute the SVG path for a link entering from the parent position.
     * @param {object} d - The D3 link data with source and target nodes.
     * @returns {string} An SVG path data string.
     */
    function getFinalLinkPath(d: Record<string, unknown>): string {
        const rawSx = (d.source as Record<string, unknown>).x as number;
        const rawSy = (d.source as Record<string, unknown>).y as number;
        const rawTx = (d.target as Record<string, unknown>).x as number;
        const rawTy = (d.target as Record<string, unknown>).y as number;
        const sx = Number.isFinite(rawSx) ? rawSx : 0;
        const sy = Number.isFinite(rawSy) ? rawSy : 0;
        const tx = Number.isFinite(rawTx) ? rawTx : 0;
        const ty = Number.isFinite(rawTy) ? rawTy : 0;
        const ax = Number.isFinite(sx + contentOffsetY) ? sx + contentOffsetY : 0;
        const ay = Number.isFinite(sy + contentOffsetX + ((CARD_WIDTH / 2) * nodeScale)) ? sy + contentOffsetX + ((CARD_WIDTH / 2) * nodeScale) : 0;
        const bx = Number.isFinite(tx + contentOffsetY) ? tx + contentOffsetY : 0;
        const by = Number.isFinite(ty + contentOffsetX - ((CARD_WIDTH / 2) * nodeScale)) ? ty + contentOffsetX - ((CARD_WIDTH / 2) * nodeScale) : 0;
        const midY = (ay + by) / 2;
        return 'M' + ay + ',' + ax + 'C' + midY + ',' + ax + ',' + midY + ',' + bx + ',' + by + ',' + bx;
    }

    // --- Link paths ---
    const linkGroup = layer.select('g.links').size()
        ? layer.select('g.links')
        : layer.append('g')
            .attr('class', 'links')
            .attr('fill', 'none')
            .attr('stroke', '#94a3b8')
            .attr('stroke-opacity', 0.65)
            .attr('stroke-width', 1.5);

    const linkBound = linkGroup.selectAll('path')
        .data(links, (l: Record<string, unknown>) => `${((l.source as Record<string, unknown>).data as Record<string, unknown>).id}->${((l.target as Record<string, unknown>).data as Record<string, unknown>).id}` as string);

    linkBound.exit().transition(t)
        .attr('opacity', 0)
        .remove();

    linkBound.attr('opacity', 1)
        .attr('d', (d: Record<string, unknown>) => getFinalLinkPath(d));

    const linkEnter = linkBound.enter()
        .append('path')
        .attr('opacity', 0)
        .attr('d', (d: Record<string, unknown>) => getFinalLinkPath(d));

    if (isAnimate) {
        linkEnter.transition(t).attr('opacity', 1);
    } else {
        linkEnter.attr('opacity', 1);
    }

    // --- Node cards ---
    const nodeGroup = layer.select('g.nodes').size()
        ? layer.select('g.nodes')
        : layer.append('g').attr('class', 'nodes');

    const nodeBound = nodeGroup.selectAll(containerTag)
        .data(renderable, (d: Record<string, unknown>) => (d.data as Record<string, unknown>).id as string);

    nodeBound.exit()
        .transition(t)
        .attr('opacity', 0)
        .attr('transform', (d: Record<string, unknown>) => getParentTransform(d))
        .remove();

    const nodeEnter = nodeBound.enter()
        .append(containerTag)
        .attr('opacity', 0)
        .attr('transform', (d: Record<string, unknown>) => getParentTransform(d))
        .style('text-decoration', 'none');

    nodeEnter.append('title')
        .text((current: Record<string, unknown>) => getNodeTitle(current.data as Record<string, unknown>));

    nodeEnter.append('rect')
        .attr('class', 'graph-card')
        .attr('x', -CARD_WIDTH / 2)
        .attr('y', -CARD_HEIGHT / 2)
        .attr('width', CARD_WIDTH)
        .attr('height', CARD_HEIGHT)
        .attr('rx', CARD_RADIUS)
        .attr('ry', CARD_RADIUS)
        .attr('fill', 'var(--graph-card-bg)')
        .attr('stroke', 'var(--graph-stroke)')
        .attr('stroke-width', 'var(--graph-stroke-width)')
        .attr('focusable', 'false');

    nodeEnter.append('rect')
        .attr('class', 'graph-card-accent')
        .attr('x', -CARD_WIDTH / 2)
        .attr('y', -CARD_HEIGHT / 2)
        .attr('width', 10)
        .attr('height', CARD_HEIGHT)
        .attr('rx', CARD_RADIUS)
        .attr('ry', CARD_RADIUS)
        .attr('clip-path', `url(#${cardClipPathId})`)
        .attr('focusable', 'false')
        .attr('fill', (current: Record<string, unknown>) => getNodeColor((current.data as Record<string, unknown>).nodeType as string));

    nodeEnter.append('text')
        .attr('class', 'graph-card-statement')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('focusable', 'false')
        .text((current: Record<string, unknown>) => truncateText((current.data as Record<string, unknown>).label as string, 36));

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType !== 'moment' && (current.data as Record<string, unknown>).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--node-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .attr('focusable', 'false')
        .text((current: Record<string, unknown>) => getNodeTypeLabel((current.data as Record<string, unknown>).payload as Record<string, unknown>) ?? '');

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-status')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'hanging')
        .attr('focusable', 'false')
        .text((current: Record<string, unknown>) => getStatusIcon((current.data as Record<string, unknown>).payload!['statusColor' as keyof object] as string));

    nodeEnter.filter((current: Record<string, unknown>) => {
            const hiddenCount = Number((current.data as Record<string, unknown>)._hiddenDescendantCount as string ?? '0') || 0;
            return hiddenCount > 0 && Boolean((current.data as Record<string, unknown>)._isCollapsed);
        })
        .append('text')
        .attr('class', 'graph-card-collapsed-badge')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', CARD_HEIGHT / 2 - 12)
        .attr('text-anchor', 'end')
        .text((current: Record<string, unknown>) => {
            const hiddenCount = Number((current.data as Record<string, unknown>)._hiddenDescendantCount as string ?? '0') || 0;
            return `${hiddenCount} hidden`;
        });

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text((current: Record<string, unknown>) => getNodeTypeLabel((current.data as Record<string, unknown>).payload as Record<string, unknown>) ?? '');

    nodeEnter.append('line')
        .attr('class', 'graph-card-divider')
        .attr('x1', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('x2', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y1', -CARD_HEIGHT / 2 + 42)
        .attr('y2', -CARD_HEIGHT / 2 + 42)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: Record<string, unknown>) => getStrideLabel((current.data as Record<string, unknown>).payload as Record<string, unknown>));

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + DETAIL_LINE_GAP)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: Record<string, unknown>) => getCardDescription((current.data as Record<string, unknown>).payload as Record<string, unknown>, 52));

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 2))
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: Record<string, unknown>) => `Effort: ${formatEstimate((current.data as Record<string, unknown>).payload!['effortEstimate' as keyof object])}`);

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment' && getMomentTaskSummary((current.data as Record<string, unknown>).payload as Record<string, unknown>))
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-tasks')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 3))
        .attr('fill', '#0f766e')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text((current: Record<string, unknown>) => getMomentTaskSummary((current.data as Record<string, unknown>).payload as Record<string, unknown>));

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType !== 'moment' && (current.data as Record<string, unknown>).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 62)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: Record<string, unknown>) => getCardDescription((current.data as Record<string, unknown>).payload as Record<string, unknown>));

    nodeEnter.filter((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType !== 'moment' && (current.data as Record<string, unknown>).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 88)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('dominant-baseline', 'middle')
        .text((current: Record<string, unknown>) => getChildProgressSummary(current.data as Record<string, unknown>) ?? 'No child cards');

    const node = nodeEnter.merge(nodeBound);

    node.select('title').text((current: Record<string, unknown>) => getNodeTitle(current.data as Record<string, unknown>));
    node.select('text.graph-card-statement').text((current: Record<string, unknown>) => truncateText((current.data as Record<string, unknown>).label as string, 36));
    node.select('rect.graph-card-accent').attr('fill', (current: Record<string, unknown>) => getNodeColor((current.data as Record<string, unknown>).nodeType as string));
    node.select('text.graph-card-status').text((current: Record<string, unknown>) => getStatusIcon(((current.data as Record<string, unknown>).payload as Record<string, unknown>)?.statusColor as string));

    (node.each as (isFilterMatch: (d: Record<string, unknown>, index: number, nodes: unknown[]) => void) => void)(function (current: Record<string, unknown>, _index: number, nodes: unknown[]) {
        const currentNode = nodes[_index] as Element;
        const badge = (d3.select(currentNode) as unknown as D3Sel).select('text.graph-card-collapsed-badge');
        const hiddenCount = Number((current.data as Record<string, unknown>)._hiddenDescendantCount as string ?? '0') || 0;
        const shouldShowBadge = hiddenCount > 0 && Boolean((current.data as Record<string, unknown>)._isCollapsed);

        if (shouldShowBadge) {
            if (badge.empty()) {
                (d3.select(currentNode) as unknown as D3Sel).append('text')
                    .attr('class', 'graph-card-collapsed-badge')
                    .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
                    .attr('y', CARD_HEIGHT / 2 - 12)
                    .attr('text-anchor', 'end')
                    .text(`${hiddenCount} hidden`);
            } else {
                badge.text(`${hiddenCount} hidden`);
            }
        } else if (!badge.empty()) {
            badge.remove();
        }
    });

    if (isEnableLinks) {
        node.attr('href', (current: Record<string, unknown>) => getNodeHref(current.data as Record<string, unknown>, owner as string, project as string))
            .attr('xlink:href', (current: Record<string, unknown>) => getNodeHref(current.data as Record<string, unknown>, owner as string, project as string))
            .attr('data-nav', '');
    }

    node.style('text-decoration', 'none')
        .style('--graph-card-bg', '#ffffff')
        .style('--graph-accent', (current: Record<string, unknown>) => getNodeColor((current.data as Record<string, unknown>).nodeType as string))
        .style('--graph-stroke', (current: Record<string, unknown>) => {
            const isFocused = focusNodeId !== undefined && (current.data as Record<string, unknown>).id === focusNodeId;
            const isAllowFocusHighlight = (current.data as Record<string, unknown>).nodeType !== 'root';
            if ((current.data as Record<string, unknown>)._isSearchMatched || (isFocused && isAllowFocusHighlight)) return '#d4af37';
            return (current as Record<string, unknown>).depth === 0 ? getNodeColor((current.data as Record<string, unknown>).nodeType as string) : '#cbd5e1';
        })
        .style('--graph-stroke-width', (current: Record<string, unknown>) => {
            const isFocused = focusNodeId !== undefined && (current.data as Record<string, unknown>).id === focusNodeId;
            const isAllowFocusHighlight = (current.data as Record<string, unknown>).nodeType !== 'root';
            if ((current.data as Record<string, unknown>)._isSearchMatched || (isFocused && isAllowFocusHighlight)) return 3;
            return (current as Record<string, unknown>).depth === 0 ? 2.5 : 1.5;
        })
        .classed('graph-node', true)
        .classed('is-root', (current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'root')
        .classed('is-promise', (current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'promise')
        .classed('is-epic', (current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'epic')
        .classed('is-journey', (current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'journey')
        .classed('is-flow', (current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'flow')
        .classed('is-moment', (current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .classed('is-collapsed', (current: Record<string, unknown>) => Boolean((current.data as Record<string, unknown>)._isCollapsed))
        .classed('is-search-matched', (current: Record<string, unknown>) => Boolean((current.data as Record<string, unknown>)._isSearchMatched))
        .classed('is-focused', (current: Record<string, unknown>) => (focusNodeId !== undefined && (current.data as Record<string, unknown>).id === focusNodeId))
        .attr('tabindex', (current: Record<string, unknown>) => {
            if ((current.data as Record<string, unknown>).nodeType === 'root') return;
            return isEnableZoom ? 0 : -1;
        })
        .attr('role', (current: Record<string, unknown>) => (isEnableZoom && (current.data as Record<string, unknown>).nodeType !== 'root') ? 'treeitem' : undefined)
        .attr('aria-label', (current: Record<string, unknown>) => (isEnableZoom && (current.data as Record<string, unknown>).nodeType !== 'root') ? (getNodeTitle(current.data as Record<string, unknown>) || 'Graph node') : undefined);

    if (onContextMenu) {
        (node.on as (event: string, handler: (...eventData: unknown[]) => void) => unknown)('contextmenu', ((_event: unknown, _current: Record<string, unknown>) => {
            (_event as MouseEvent).preventDefault();
            (onContextMenu as (...eventData: unknown[]) => void)(_event, (_current as Record<string, unknown>).data as Record<string, unknown>);
        }) as (...eventData: unknown[]) => void);

        (node.on as (event: string, handler: (...eventData: unknown[]) => void) => unknown)('keydown', ((_event: unknown, _current: Record<string, unknown>) => {
            if (!['Enter', ' ', 'Space'].includes((_event as KeyboardEvent).key)) return;
            (_event as KeyboardEvent).preventDefault();
            (onContextMenu as (...eventData: unknown[]) => void)(_event, (_current as Record<string, unknown>).data as Record<string, unknown>);
        }) as (...eventData: unknown[]) => void);
    }

    nodeBound.attr('opacity', 1)
        .attr('transform', (d: Record<string, unknown>) => getFinalTransform(d));

    if (isAnimate) {
        nodeEnter.transition(t)
            .attr('opacity', 1)
            .attr('transform', (d: Record<string, unknown>) => getFinalTransform(d));
    } else {
        nodeEnter.attr('opacity', 1)
            .attr('transform', (d: Record<string, unknown>) => getFinalTransform(d));
    }
}

/**
 * Render a promise stack tree into the given content div using D3.
 * Supports both full graph (zoomable) and compact detail-page modes.
 * @param {HTMLElement | undefined} contentDiv - The container element to render into.
 * @param {object} d3 - The D3 module instance.
 * @param {object} treeData - The tree data to render.
 * @param {object} [options] - Rendering options.
 * @param {string} [options.owner] - The project owner's slug.
 * @param {string} [options.project] - The project's slug.
 * @param {string } [options.focusNodeId] - The focused node ID.
 * @param {object } [options.focusNodeData] - Specific node data to focus on.
 * @param {boolean} [options.enableZoom] - Whether zoom is enabled.
 * @param {boolean} [options.compact] - Whether to use compact detail-page mode.
 * @param {object } [options.restoreTransform] - A D3 zoom transform to restore.
 * @param {HTMLElement } [options.viewportElement] - The viewport element for scroll/clipping.
 * @param {string} [options.clipPathIdPrefix] - Prefix for the clip path ID.
 * @param {string} [options.ariaLabel] - The SVG aria-label.
 * @param {string} [options.emptyMessage] - Message when no cards to display.
 * @param {((transform: object, meta: { user?: boolean }) => void) } [options.onZoom] - Zoom event callback.
 * @param {((event: Event, nodeData: object) => void) } [options.onContextMenu] - Context menu event callback.
 * @param {number } [options.minGraphWidth] - Minimum graph width.
 * @param {number } [options.minGraphHeight] - Minimum graph height.
 * @param {number } [options.uniformNodeScale] - Uniform node scale factor.
 * @param {boolean} [options.renderRootCard] - Whether to render the root card.
 * @param {boolean} [options.enableLinks] - Whether links are enabled.
 * @param {boolean} [options.animate] - Whether to animate transitions.
 * @param {number} [options.animationSpeed] - Animation speed multiplier.
 * @returns {{node: SVGElement | null, zoom: object } | undefined} The SVG node and zoom behavior (if enabled).
 */

/**
 * Compute the graph layout parameters (gaps, forehead, card scale) for full or compact mode.
 * @param {boolean} isCompact - Whether to use compact detail-page mode.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {{ top: number; right: number; bottom: number; left: number }} margin - The SVG margin.
 * @param {number} margin.top - The top margin.
 * @param {number} margin.right - The right margin.
 * @param {number} margin.bottom - The bottom margin.
 * @param {number} margin.left - The left margin.
 * @param {number} maxDepth - The maximum tree depth.
 * @param {object} treeData - The tree data.
 * @param {number} [uniformNodeScale] - Uniform node scale factor.
 * @returns {{ stepGapX: number; stepGapY: number; foreheadGap: number; cardScale: number }} The computed layout values.
 */

/**
 * Apply compact layout adjustments for the tree graph.
 * @param {object} treeData - The tree data.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {object} margin - The SVG margin.
 * @param {number} margin.left - The left margin.
 * @param {number} margin.right - The right margin.
 * @param {number} margin.top - The top margin.
 * @param {number} margin.bottom - The bottom margin.
 * @param {number} maxDepth - The maximum tree depth.
 * @param {object} defaults - The default layout values.
 * @param {number} defaults.stepGapX - Default step gap X.
 * @param {number} defaults.stepGapY - Default step gap Y.
 * @param {number} defaults.foreheadGap - Default forehead gap.
 * @param {number} defaults.cardScale - Default card scale.
 * @returns {{ stepGapX: number; stepGapY: number; foreheadGap: number; cardScale: number }} The adjusted layout values.
 */
function applyCompactLayout(treeData: Record<string, unknown>, viewportWidth: number, viewportHeight: number, margin: { top: number; right: number; bottom: number; left: number }, maxDepth: number, defaults: { stepGapX: number; stepGapY: number; foreheadGap: number; cardScale: number }): { stepGapX: number; stepGapY: number; foreheadGap: number; cardScale: number } {
    const vc = countRenderableNodes(treeData);
    const p = getCompactLayoutProfile(vc, viewportWidth, viewportHeight);
    const cs = Number.isFinite(p.nodeScale) ? p.nodeScale : defaults.cardScale;
    const sgy1 = Number.isFinite(p.minGapY) ? p.minGapY : defaults.stepGapY;
    const fg = Number.isFinite(p.forehead) ? p.forehead : defaults.foreheadGap;
    const minGapX = Number.isFinite(p.minGapX) ? p.minGapX : COMPACT_MIN_TIER_GAP;
    const sgx = maxDepth > 0 && viewportWidth > 0
        ? Math.max(Math.max(viewportWidth - margin.left - margin.right - CARD_WIDTH * cs, CARD_WIDTH) / maxDepth, minGapX)
        : defaults.stepGapX;
    const sgy = maxDepth > 0 && viewportHeight > 0
        ? Math.max(Math.floor(Math.max(viewportHeight - margin.top - margin.bottom - CARD_HEIGHT * cs - fg, CARD_HEIGHT) / Math.max(1, maxDepth)), COMPACT_MIN_TIER_GAP_Y)
        : sgy1;
    return { stepGapX: sgx, stepGapY: sgy, foreheadGap: fg, cardScale: cs };
}
/**
 * Sanitize layout values, replacing NaN/Infinity with safe defaults.
 * @param {object} layout - The computed layout values.
 * @param {number} layout.stepGapX - The step gap on the X axis.
 * @param {number} layout.stepGapY - The step gap on the Y axis.
 * @param {number} layout.foreheadGap - The forehead gap.
 * @param {number} layout.cardScale - The card scale.
 * @returns {{ stepGapX: number; stepGapY: number; foreheadGap: number; cardScale: number }} Sanitized layout values.
 */
function getSafeLayout(layout: { stepGapX: number; stepGapY: number; foreheadGap: number; cardScale: number }): { stepGapX: number; stepGapY: number; foreheadGap: number; cardScale: number } {
    return {
        stepGapX: Number.isFinite(layout.stepGapX) ? layout.stepGapX : 200,
        stepGapY: Number.isFinite(layout.stepGapY) ? layout.stepGapY : 100,
        foreheadGap: Number.isFinite(layout.foreheadGap) ? layout.foreheadGap : 20,
        cardScale: Number.isFinite(layout.cardScale) ? layout.cardScale : 1,
    };
}

/**
 * Compute tree graph layout parameters for compact or standard mode.
 * @param {boolean} isCompact - Whether compact mode is active.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {object} margin - The SVG margin.
 * @param {number} margin.left - The left margin.
 * @param {number} margin.right - The right margin.
 * @param {number} margin.top - The top margin.
 * @param {number} margin.bottom - The bottom margin.
 * @param {number} maxDepth - The maximum tree depth.
 * @param {object} treeData - The tree data.
 * @param {number} [uniformNodeScale] - Uniform node scale factor.
 * @returns {{ stepGapX: number; stepGapY: number; foreheadGap: number; cardScale: number }} The computed layout values.
 */
function computeGraphLayout(isCompact: boolean, viewportWidth: number, viewportHeight: number, margin: { top: number; right: number; bottom: number; left: number }, maxDepth: number, treeData: Record<string, unknown>, uniformNodeScale = 1) {
    const cs = Number.isFinite(uniformNodeScale) ? uniformNodeScale : 1;
    if (isCompact) {
        return applyCompactLayout(treeData, viewportWidth, viewportHeight, margin, maxDepth, {
            stepGapX: COMPACT_STEP_GAP_X, stepGapY: COMPACT_STEP_GAP_Y, foreheadGap: COMPACT_FOREHEAD_GAP, cardScale: cs,
        });
    }
    return { stepGapX: STEP_GAP_X, stepGapY: STEP_GAP_Y, foreheadGap: FOREHEAD_GAP, cardScale: cs };
}

/**
 * Resolve animation options by checking for an existing SVG element and reduced motion preference.
 * @param {HTMLElement} contentDiv - The container element.
 * @param {boolean} shouldAnimate - Whether animation is requested.
 * @returns {{ existingSvgElement: SVGElement | undefined; isAnimating: boolean }} The resolved animation options.
 */
function resolveAnimationOptions(contentDiv: HTMLElement, shouldAnimate: boolean): { existingSvgElement: SVGElement | undefined; isAnimating: boolean } {
    const existingSvgElement = shouldAnimate ? contentDiv.querySelector('svg') as SVGElement | undefined : undefined;
    const isPrefersReducedMotion = typeof window !== 'undefined' && globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isAnimating = shouldAnimate && !isPrefersReducedMotion;
    return { existingSvgElement, isAnimating };
}

/**
 * Compute the bounding dimensions of the graph based on rendered node positions.
 * @param {object} d3 - The D3 module instance.
 * @param {object[]} renderable - The list of hierarchy nodes to render.
 * @param {number} cardScale - The card scale factor.
 * @param {object} margin - The SVG margin.
 * @param {number} margin.top - The top margin.
 * @param {number} margin.right - The right margin.
 * @param {number} margin.bottom - The bottom margin.
 * @param {number} margin.left - The left margin.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {number} foreheadGap - The forehead gap above the root.
 * @param {boolean} isCompact - Whether compact mode is active.
 * @param {number | null} minGraphWidth - Minimum graph width.
 * @param {number | null} minGraphHeight - Minimum graph height.
 * @returns {{ minX: number; maxX: number; minY: number; maxY: number; graphWidth: number; graphHeight: number }} The computed dimensions.
 */
function computeGraphDimensions(
    d3: D3Module,
    renderable: Record<string, unknown>[],
    cardScale: number,
    margin: { top: number; right: number; bottom: number; left: number },
    viewportWidth: number,
    viewportHeight: number,
    foreheadGap: number,
    isCompact: boolean,
    minGraphWidth: number | undefined,
    minGraphHeight: number | undefined,
): { minX: number; maxX: number; minY: number; maxY: number; graphWidth: number; graphHeight: number } {
    const scaledCardWidth = CARD_WIDTH * cardScale;
    const scaledCardHeight = CARD_HEIGHT * cardScale;
    const minX = d3.min(renderable, (node: Record<string, unknown>) => (node.x as number) - (scaledCardHeight / 2)) ?? -(scaledCardHeight / 2);
    const maxX = d3.max(renderable, (node: Record<string, unknown>) => (node.x as number) + (scaledCardHeight / 2)) ?? (scaledCardHeight / 2);
    const minY = d3.min(renderable, (node: Record<string, unknown>) => (node.y as number) - (scaledCardWidth / 2)) ?? -(scaledCardWidth / 2);
    const maxY = d3.max(renderable, (node: Record<string, unknown>) => (node.y as number) + (scaledCardWidth / 2)) ?? (scaledCardWidth / 2);
    const defaultMinWidth = isCompact ? viewportWidth || 400 : 960;
    const defaultMinHeight = isCompact ? viewportHeight || 180 : 520;
    const graphWidth = Math.max((maxY - minY) + margin.left + margin.right, viewportWidth, (minGraphWidth as number) ?? defaultMinWidth);
    const graphHeight = Math.max((maxX - minX) + margin.top + margin.bottom + foreheadGap, viewportHeight, (minGraphHeight as number) ?? defaultMinHeight);
    return { minX, maxX, minY, maxY, graphWidth, graphHeight };
}

/**
 * Set up the SVG container, creating a new one or reusing an existing element.
 * @param {object} d3 - The D3 module instance.
 * @param {HTMLElement} contentDiv - The container element.
 * @param {SVGElement | undefined} existingSvgElement - An existing SVG element to reuse.
 * @param {number} graphWidth - The computed graph width.
 * @param {number} graphHeight - The computed graph height.
 * @param {boolean} isCompact - Whether compact mode is active.
 * @param {number} viewportHeight - The viewport height.
 * @param {boolean} isZoomEnabled - Whether zoom is enabled.
 * @param {string} ariaLabel - The SVG aria-label.
 * @param {string} cardClipPathId - The clip path ID for card masking.
 * @returns {object} The D3 selection of the SVG element.
 */
function setupSvgContainer(
    d3: D3Module,
    contentDiv: HTMLElement,
    existingSvgElement: SVGElement | undefined,
    graphWidth: number,
    graphHeight: number,
    isCompact: boolean,
    viewportHeight: number,
    isZoomEnabled: boolean,
    ariaLabel: string,
    cardClipPathId: string,
): D3Sel {
    let svg: D3Sel;
    if (existingSvgElement) {
        svg = d3.select(existingSvgElement) as unknown as D3Sel;
        svg.attr('viewBox', [0, 0, graphWidth, graphHeight])
           .attr('height', isCompact ? '100%' : Math.max(graphHeight, viewportHeight || 0));
        svg.select('defs').remove();
    } else {
        contentDiv.replaceChildren();
        svg = d3.create('svg') as unknown as D3Sel;
        svg
            .attr('viewBox', [0, 0, graphWidth, graphHeight])
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('width', '100%')
            .attr('height', isCompact ? '100%' : Math.max(graphHeight, viewportHeight || 0))
            .attr('role', isZoomEnabled ? 'tree' : undefined)
            .attr('aria-label', ariaLabel);
    }

    svg.append('defs')
        .append('clipPath')
        .attr('id', cardClipPathId)
        .append('rect')
        .attr('x', -CARD_WIDTH / 2)
        .attr('y', -CARD_HEIGHT / 2)
        .attr('width', CARD_WIDTH)
        .attr('height', CARD_HEIGHT)
        .attr('rx', CARD_RADIUS)
        .attr('ry', CARD_RADIUS);

    return svg;
}

/**
 * Find the hierarchy node corresponding to the focused node by data identity or ID.
 * @param {object} root - The D3 hierarchy root.
 * @param {object | undefined} focusNodeData - The specific node data to match.
 * @param {string | undefined} resolvedFocusNodeId - The resolved focus node ID.
 * @returns {object | undefined} The matching hierarchy node, or undefined.
 */
function findFocusedHierarchyNode(
    root: Record<string, unknown>,
    focusNodeData: Record<string, unknown> | undefined,
    resolvedFocusNodeId: string | undefined,
): Record<string, unknown> | undefined {
    const desc = (root as unknown as { descendants: () => { data: Record<string, unknown>; x: number; y: number }[] }).descendants();
    if (focusNodeData) {
        const byIdentity = desc.find(node => node.data === focusNodeData);
        if (byIdentity) return byIdentity;
    }

    if (!resolvedFocusNodeId) return;
    return desc.find(node => node.data?.id === resolvedFocusNodeId);
}

/**
 * Compute the scale factor to fit the entire graph within the viewport.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {number} graphWidth - The graph width.
 * @param {number} graphHeight - The graph height.
 * @returns {number} The fit scale factor (0 to 1).
 */
function computeFitScale(viewportWidth: number, viewportHeight: number, graphWidth: number, graphHeight: number): number {
    return Math.min(
        viewportWidth > 0 ? viewportWidth / graphWidth : 1,
        viewportHeight > 0 ? viewportHeight / graphHeight : 1,
        1,
    );
}

/**
 * Compute the initial zoom transforms (focus, fit, restore) and determine the mode.
 * @param {object} d3 - The D3 module instance.
 * @param {object | undefined} focusedHierarchyNode - The focused hierarchy node.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {number} contentOffsetX - The X content offset.
 * @param {number} contentOffsetY - The Y content offset.
 * @param {number} cardScale - The card scale factor.
 * @param {number} graphWidth - The graph width.
 * @param {number} graphHeight - The graph height.
 * @param {number} initialScale - The initial fit scale.
 * @param {SVGElement | undefined} existingSvgElement - An existing SVG element.
 * @param {object} svg - The D3 selection of the SVG element.
 * @param {object | undefined} restoreTransform - A previously saved transform to restore.
 * @returns {{ focusTransform: object | undefined; fitTransform: object; initialTransform: object; mode: string }} The computed transforms and mode.
 */
function computeInitialTransforms(
    d3: D3Module,
    focusedHierarchyNode: Record<string, unknown> | undefined,
    viewportWidth: number,
    viewportHeight: number,
    contentOffsetX: number,
    contentOffsetY: number,
    cardScale: number,
    graphWidth: number,
    graphHeight: number,
    initialScale: number,
    existingSvgElement: SVGElement | undefined,
    svg: D3Sel,
    restoreTransform: Record<string, unknown> | undefined,
): { focusTransform: Record<string, unknown> | undefined; fitTransform: Record<string, unknown>; initialTransform: Record<string, unknown>; mode: string } {
    const focusTransform = focusedHierarchyNode
        ? createFocusTransform(d3, viewportWidth, viewportHeight, focusedHierarchyNode as unknown as { x: number; y: number }, contentOffsetX, contentOffsetY, cardScale)
        : undefined;
    const zi = d3.zoomIdentity as { translate: (x: number, y: number) => { scale: (s: number) => Record<string, unknown> } };
    const fitTransform = zi
        .translate(viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0, viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0)
        .scale(initialScale);
    const initialTransform = existingSvgElement
        ? d3.zoomTransform(svg.node() as SVGElement) as Record<string, unknown>
        : (focusTransform ?? restoreTransform ?? fitTransform);

    let mode: string;
    if (existingSvgElement) {
        mode = 'preserve';
    } else if (focusTransform) {
        mode = 'focus';
    } else if (restoreTransform) {
        mode = 'restore';
    } else {
        mode = 'fit';
    }

    return { focusTransform, fitTransform, initialTransform, mode };
}

/**
 * Schedule a focus refinement pass after the first render to adjust zoom for the actual viewport size.
 * @param {object} d3 - The D3 module instance.
 * @param {object} svg - The D3 selection of the SVG element.
 * @param {object} zoom - The D3 zoom behavior.
 * @param {(...args: unknown[]) => unknown} zoom.transform - The zoom transform function.
 * @param {object | undefined} focusedHierarchyNode - The focused hierarchy node.
 * @param {HTMLElement} viewportElement - The viewport element.
 * @param {number} contentOffsetX - The X content offset.
 * @param {number} contentOffsetY - The Y content offset.
 * @param {number} cardScale - The card scale factor.
 * @param {SVGElement | undefined} existingSvgElement - An existing SVG element.
 * @returns {void}
 */
function scheduleFocusRefinement(
    d3: D3Module,
    svg: D3Sel,
    zoom: { transform: unknown },
    focusedHierarchyNode: Record<string, unknown> | undefined,
    viewportElement: HTMLElement,
    contentOffsetX: number,
    contentOffsetY: number,
    cardScale: number,
    existingSvgElement: SVGElement | undefined,
): void {
    if (!focusedHierarchyNode || existingSvgElement) return;

    requestAnimationFrame(() => {
        const measuredViewport = getInnerViewportSize(viewportElement);
        const measuredWidth = Number(measuredViewport.width ?? 0);
        const measuredHeight = Number(measuredViewport.height ?? 0);

        if (!Number.isFinite(measuredWidth) || !Number.isFinite(measuredHeight) || measuredWidth <= 1 || measuredHeight <= 1) {
            return;
        }

        const refinedTransform = createFocusTransform(
            d3,
            Math.max(measuredWidth, 1),
            Math.max(measuredHeight, 1),
            focusedHierarchyNode as unknown as { x: number; y: number },
            contentOffsetX,
            contentOffsetY,
            cardScale,
        );

        if (!refinedTransform) return;

        svg.call(zoom.transform, refinedTransform);
    });
}

/**
 * Render the graph without zoom interactions (compact/detail mode), centering nodes in the viewport.
 * @param {object} d3 - The D3 module instance.
 * @param {object} _graphLayer - The D3 selection of the graph layer.
 * @param {object[]} renderable - The list of hierarchy nodes to render.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {number} graphWidth - The graph width.
 * @param {number} graphHeight - The graph height.
 * @param {number} contentOffsetX - The X content offset.
 * @param {number} contentOffsetY - The Y content offset.
 * @param {boolean} isCompact - Whether compact mode is active.
 * @param {number} cardScale - The card scale factor.
 * @returns {object} The computed fit transform.
 */
function renderGraphWithoutZoom(
    d3: D3Module,
    _graphLayer: Record<string, unknown>,
    renderable: Record<string, unknown>[],
    viewportWidth: number,
    viewportHeight: number,
    graphWidth: number,
    graphHeight: number,
    contentOffsetX: number,
    contentOffsetY: number,
    isCompact: boolean,
    cardScale: number,
): unknown {
    const initialScale = Math.min(
        viewportWidth > 0 ? viewportWidth / graphWidth : 1,
        viewportHeight > 0 ? viewportHeight / graphHeight : 1,
        1,
    );

    const zi = d3.zoomIdentity as { translate: (x: number, y: number) => { scale: (s: number) => Record<string, unknown> } };
    let fitTransform = zi.translate(
            viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
            viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0,
        )
        .scale(initialScale);

    if (isCompact) {
        const ordered = renderable.toSorted((a, b) => ((a.y as number) || 0) - ((b.y as number) || 0));
        if (ordered.length > 0) {
            const mid = Math.floor((ordered.length - 1) / 2);
            const anchors = ordered.length % 2 === 1 ? [ordered[mid]] : [ordered[mid], ordered[mid + 1]];
            const anchorPos = { x: 0, y: 0 };
            for (const anchor of anchors) {
                const pos = getRenderedNodePosition(anchor as unknown as { x: number; y: number }, contentOffsetX, contentOffsetY);
                anchorPos.x += pos.x;
                anchorPos.y += pos.y;
            }
            anchorPos.x /= anchors.length;
            anchorPos.y /= anchors.length;

            const profile = getCompactLayoutProfile(ordered.length, viewportWidth, viewportHeight) || {};
            anchorPos.x += profile.anchorOffsetX ?? 0;
            anchorPos.y += profile.anchorOffsetY ?? 0;

            const zi2 = d3.zoomIdentity as { translate: (x: number, y: number) => { scale: (s: number) => { translate: (x: number, y: number) => Record<string, unknown> } } };
            fitTransform = zi2.translate(viewportWidth / 2, viewportHeight / 2)
                .scale(cardScale)
                .translate(-anchorPos.x, -anchorPos.y);
        }
    }

    return fitTransform;
}

/**
 * Log the status of the focused node resolution for debugging.
 * @param {object | undefined} focusedHierarchyNode - The resolved hierarchy node.
 * @param {string | undefined} resolvedFocusNodeId - The resolved focus node ID.
 * @param {object | undefined} focusNodeData - The original focus node data.
 * @param {number} renderableCount - The number of renderable nodes.
 * @returns {void}
 */
function logFocusNodeStatus(
    focusedHierarchyNode: Record<string, unknown> | undefined,
    resolvedFocusNodeId: string | undefined,
    focusNodeData: Record<string, unknown> | undefined,
    renderableCount: number,
): void {
    if (focusedHierarchyNode) {
        logGraphFocus('focus-node-resolved', {
            resolvedFocusNodeId,
            hierarchyX: focusedHierarchyNode.x,
            hierarchyY: focusedHierarchyNode.y,
            dataId: (focusedHierarchyNode.data as Record<string, unknown> | undefined)?.id,
            nodeType: (focusedHierarchyNode.data as Record<string, unknown> | undefined)?.nodeType,
            label: (focusedHierarchyNode.data as Record<string, unknown> | undefined)?.label,
        });
    } else {
        logGraphFocus('focus-node-missing', {
            resolvedFocusNodeId,
            hasFocusNodeData: Boolean(focusNodeData),
            renderableCount,
        });
    }
}

/**
 * Log post-render focus debug information including transform state and bounding rects.
 * @param {HTMLElement} contentDiv - The container element.
 * @param {object} svg - The D3 selection of the SVG element.
 * @param {object} graphLayer - The D3 selection of the graph layer.
 * @param {string | undefined} resolvedFocusNodeId - The resolved focus node ID.
 * @param {HTMLElement} viewportElement - The viewport element.
 * @returns {void}
 */
function logPostRenderFocusDebug(
    contentDiv: HTMLElement,
    svg: D3Sel,
    graphLayer: D3Sel,
    resolvedFocusNodeId: string | undefined,
    viewportElement: HTMLElement,
): void {
    if (!isGraphFocusDebugEnabled()) return;

    const focusElement = contentDiv.querySelector(':scope .graph-node.is-focused .graph-card');
    const viewportRect = (viewportElement as HTMLElement)?.getBoundingClientRect?.();
    const focusRect = (focusElement as Element | null)?.getBoundingClientRect?.();
    const zoomTransform = (svg.node() as unknown as Record<string, unknown> | null)?.__zoom;

    logGraphFocus('post-render-transform-state', {
        resolvedFocusNodeId,
        layerTransform: graphLayer.attr('transform') as unknown,
        svgZoomTransform: zoomTransform ? {
            x: (zoomTransform as Record<string, unknown>).x,
            y: (zoomTransform as Record<string, unknown>).y,
            k: (zoomTransform as Record<string, unknown>).k,
        } : undefined,
        svgViewBox: svg.attr('viewBox') as unknown,
        svgSize: {
            width: svg.attr('width') as unknown,
            height: svg.attr('height') as unknown,
        },
    });

    logGraphFocus('post-render-focus-rect', {
        resolvedFocusNodeId,
        viewportRect: viewportRect ? {
            x: viewportRect.x,
            y: viewportRect.y,
            width: viewportRect.width,
            height: viewportRect.height,
            centerX: viewportRect.x + (viewportRect.width / 2),
            centerY: viewportRect.y + (viewportRect.height / 2),
        } : undefined,
        focusRect: focusRect ? {
            x: focusRect.x,
            y: focusRect.y,
            width: focusRect.width,
            height: focusRect.height,
            centerX: focusRect.x + (focusRect.width / 2),
            centerY: focusRect.y + (focusRect.height / 2),
        } : undefined,
        deltaFromViewportCenter: viewportRect && focusRect ? {
            x: (focusRect.x + (focusRect.width / 2)) - (viewportRect.x + (viewportRect.width / 2)),
            y: (focusRect.y + (focusRect.height / 2)) - (viewportRect.y + (viewportRect.height / 2)),
        } : undefined,
    });
}

/**
 * Render a promise stack tree graph into the given content div using D3.
 * Supports both full zoomable graph and compact detail-page modes.
 * @param {HTMLElement | undefined} contentDiv - The container element to render into.
 * @param {object} d3 - The D3 module instance.
 * @param {object} treeData - The tree data to render.
 * @param {object} [options] - Rendering options.
 * @param {string} [options.owner] - The project owner's slug.
 * @param {string} [options.project] - The project's slug.
 * @param {string} [options.focusNodeId] - The focused node ID.
 * @param {object} [options.focusNodeData] - Specific node data to focus on.
 * @param {boolean} [options.enableZoom] - Whether zoom is enabled.
 * @param {boolean} [options.compact] - Whether to use compact detail-page mode.
 * @param {object} [options.restoreTransform] - A D3 zoom transform to restore.
 * @param {HTMLElement} [options.viewportElement] - The viewport element for scroll/clipping.
 * @param {string} [options.clipPathIdPrefix] - Prefix for the clip path ID.
 * @param {string} [options.ariaLabel] - The SVG aria-label.
 * @param {string} [options.emptyMessage] - Message when no cards to display.
 * @param {(transform: object, meta: { user?: boolean }) => void} [options.onZoom] - Zoom event callback.
 * @param {(event: MouseEvent | KeyboardEvent | object, data: object) => void} [options.onContextMenu] - Context menu event callback.
 * @param {number} [options.minGraphWidth] - Minimum graph width.
 * @param {number} [options.minGraphHeight] - Minimum graph height.
 * @param {number} [options.uniformNodeScale] - Uniform node scale factor.
 * @param {boolean} [options.renderRootCard] - Whether to render the root card.
 * @param {boolean} [options.enableLinks] - Whether links are enabled.
 * @param {boolean} [options.animate] - Whether to animate transitions.
 * @param {number} [options.animationSpeed] - Animation speed multiplier.
 * @returns {({ node: SVGElement | null; zoom: object | null } | null | void)} The SVG node and zoom behavior (if enabled), or null/undefined.
 */

/**
 * Set up D3 zoom behavior on the SVG.
 * @param {object} d3 - The D3 module.
 * @param {object} svg - The D3 selection of the SVG element.
 * @param {object} zoomLayer - The D3 selection of the zoom layer.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @param {number} graphWidth - The graph width.
 * @param {number} graphHeight - The graph height.
 * @param {(transform: object, meta: {user?: boolean}) => void | null | undefined} onZoom - Zoom event callback.
 * @returns {{ zoom: object; initialScale: number }} The zoom behavior and initial scale.
 */
function setupZoomBehavior(d3: D3Module, svg: D3Sel, zoomLayer: D3Sel, viewportWidth: number, viewportHeight: number, graphWidth: number, graphHeight: number, onZoom: ((transform: Record<string, unknown>, meta: Record<string, unknown>) => void) | null | undefined): { zoom: unknown; initialScale: number } {
    const safeW = Math.max(viewportWidth, 1);
    const safeH = Math.max(viewportHeight, 1);
    const extent: [[number, number], [number, number]] = [[0, 0], [safeW, safeH]];
    const translateExtent: [[number, number], [number, number]] = [[-safeW, -safeH], [graphWidth + safeW, graphHeight + safeH]];
    const zoomHandler = (event: Record<string, unknown>) => {
        zoomLayer.attr('transform', event.transform);
        onZoom?.(event.transform as Record<string, unknown>, { user: Boolean(event.sourceEvent) });
    };
    const zoomBehavior = d3.zoom() as unknown as {
        scaleExtent: (s: [number, number]) => { extent: (s: [[number, number], [number, number]]) => { translateExtent: (s: [[number, number], [number, number]]) => { on: (event: string, handler: (..._: never[]) => void) => { transform: unknown; call: (..._: never[]) => void } } } };
        call: (..._: never[]) => void;
        transform: unknown;
    };
    zoomBehavior
        .scaleExtent([0.5, 2.5])
        .extent(extent)
        .translateExtent(translateExtent)
        .on('zoom', zoomHandler);
    svg.call(zoomBehavior);
    svg.on('dblclick.zoom', undefined as unknown as (...eventData: unknown[]) => void);
    return { zoom: zoomBehavior as { transform: unknown }, initialScale: computeFitScale(viewportWidth, viewportHeight, graphWidth, graphHeight) };
}

/**
 * Defer graph rendering if viewport dimensions are not yet available.
 * @param {HTMLElement | undefined} contentDiv - The container element.
 * @param {object} d3 - The D3 module instance.
 * @param {object} treeData - The hierarchy tree data.
 * @param {object} options - Rendering options.
 * @param {number} retryCount - Current retry attempt number.
 * @returns {undefined}
 */
function deferRender(contentDiv: HTMLElement | undefined, d3: D3Module, treeData: Record<string, unknown>, options: Record<string, unknown>, retryCount: number): undefined {
    if (retryCount < 3) {
        requestAnimationFrame(() => renderStackGraph(contentDiv, d3, treeData, { ...options, _retryCount: retryCount + 1 }));
    }
}

/**
 * Build the node options object for appendGraphNodes.
 * @param {number} contentOffsetX - X offset.
 * @param {number} contentOffsetY - Y offset.
 * @param {string} cardClipPathId - Clip path ID.
 * @param {object} options - Additional options.
 * @param {string | undefined} options.owner - Project owner.
 * @param {string | undefined} options.project - Project slug.
 * @param {string | undefined} options.focusNodeId - Focus node ID.
 * @param {(event: MouseEvent | KeyboardEvent | object, data: object) => void | undefined} options.onContextMenu - Context menu callback.
 * @param {boolean} options.enableZoom - Whether zoom is enabled.
 * @param {boolean | undefined} options.enableLinks - Whether links are enabled.
 * @param {number | undefined} options.uniformNodeScale - Node scale factor.
 * @param {boolean} options.isAnimating - Whether animation is active.
 * @param {number} options.animationSpeed - Animation speed.
 * @returns {object} The node options object.
 */

type NodeOptionsParameters = {
    owner: string | undefined;
    project: string | undefined;
    focusNodeId: string | undefined;
    onContextMenu: ((event: MouseEvent | KeyboardEvent | Record<string, unknown>, data: Record<string, unknown>) => void) | undefined;
    enableZoom: boolean;
    enableLinks?: boolean;
    uniformNodeScale?: number;
    isAnimating: boolean;
    animationSpeed: number;
};

/**
 * Build the node options object for appendGraphNodes.
 * @param {number} contentOffsetX - X offset.
 * @param {number} contentOffsetY - Y offset.
 * @param {string} cardClipPathId - Clip path ID.
 * @param {object} options - Additional options.
 * @param {string | undefined} options.owner - Project owner.
 * @param {string | undefined} options.project - Project slug.
 * @param {string | undefined} options.focusNodeId - Focus node ID.
 * @param {(event: MouseEvent | KeyboardEvent | object, data: object) => void | undefined} options.onContextMenu - Context menu callback.
 * @param {boolean} options.enableZoom - Whether zoom is enabled.
 * @param {boolean | undefined} options.enableLinks - Whether links are enabled.
 * @param {number | undefined} options.uniformNodeScale - Node scale factor.
 * @param {boolean} options.isAnimating - Whether animation is active.
 * @param {number} options.animationSpeed - Animation speed.
 * @returns {object} The node options object.
 */
function getNodeOptions(contentOffsetX: number, contentOffsetY: number, cardClipPathId: string, options: NodeOptionsParameters): Record<string, unknown> {
    return {
        contentOffsetX,
        contentOffsetY,
        cardClipPathId,
        owner: options.owner,
        project: options.project,
        focusNodeId: options.focusNodeId ?? undefined,
        onContextMenu: options.onContextMenu,
        enableZoom: options.enableZoom,
        enableLinks: options.enableLinks ?? options.enableZoom,
        uniformNodeScale: options.uniformNodeScale,
        animate: options.isAnimating,
        animationSpeed: options.animationSpeed,
    };
}

/**
 * Build a clip path ID from a prefix and optional owner/project slugs.
 * @param {string} prefix - The clip path ID prefix.
 * @param {string | undefined} ownerSlug - The project owner slug.
 * @param {string | undefined} projectSlug - The project slug.
 * @returns {string} The constructed clip path ID.
 */
function buildCardClipPathId(prefix: string, ownerSlug: string | undefined, projectSlug: string | undefined): string {
    return `${prefix}-${ownerSlug ?? 'stack'}-${projectSlug ?? 'stack'}`;
}

/**
 * Get the render margin based on compact mode.
 * @param {boolean} isCompact - Whether compact mode is active.
 * @returns {{ top: number; right: number; bottom: number; left: number }} The margin values.
 */
function getRenderMargin(isCompact: boolean): { top: number; right: number; bottom: number; left: number } {
    return isCompact
        ? { top: 12, right: 20, bottom: 12, left: 20 }
        : { top: 32, right: 48, bottom: 32, left: 48 };
}

/**
 * Resolve the focus node ID from either a direct ID or data object.
 * @param {string | undefined} focusNodeId - The focus node identifier.
 * @param {Record<string, unknown> | null | undefined} focusNodeData - The focus node data object.
 * @returns {string | undefined} The resolved focus node ID.
 */
function resolveFocusId(focusNodeId: string | undefined, focusNodeData: Record<string, unknown> | null | undefined): string | undefined {
    return focusNodeId ?? (focusNodeData as Record<string, unknown> | null)?.id as string | undefined;
}

/**
 * Compute a safe content offset, defaulting to 0 if not finite.
 * @param {number} rawOffset - The raw offset value.
 * @returns {number} The computed offset.
 */
function computeContentOffset(rawOffset: number): number {
    return Number.isFinite(rawOffset) ? rawOffset : 0;
}

/**
 * Build the node options payload for getNodeOptions.
 * @param {unknown} owner - The project owner slug.
 * @param {unknown} project - The project slug.
 * @param {unknown} focusNodeId - The focus node ID.
 * @param {unknown} onContextMenu - Context menu callback.
 * @param {unknown} isZoomEnabled - Whether zoom is enabled.
 * @param {unknown} isLinksEnabled - Whether links are enabled.
 * @param {unknown} isCompact - Whether compact mode is active.
 * @param {unknown} cardScale - The card scale factor.
 * @param {unknown} isAnimating - Whether animation is active.
 * @param {unknown} animationSpeed - Animation speed multiplier.
 * @returns {NodeOptionsParameters} The node options parameters.
 */
function buildNodeOptionsPayload(
    owner: unknown, project: unknown, focusNodeId: unknown,
    onContextMenu: unknown, isZoomEnabled: unknown, isLinksEnabled: unknown,
    isCompact: unknown, cardScale: unknown, isAnimating: unknown, animationSpeed: unknown,
): NodeOptionsParameters {
    return {
        owner: owner as string | undefined,
        project: project as string | undefined,
        focusNodeId: focusNodeId as string | undefined,
        onContextMenu: onContextMenu as ((event: MouseEvent | KeyboardEvent | Record<string, unknown>, data: Record<string, unknown>) => void) | undefined,
        enableZoom: isZoomEnabled as boolean,
        enableLinks: isLinksEnabled as boolean | undefined,
        uniformNodeScale: (isCompact as boolean) ? cardScale as number : undefined,
        isAnimating: isAnimating as boolean,
        animationSpeed: animationSpeed as number,
    };
}

/**
 * Check whether a node should be rendered.
 * @param {{ data: Record<string, unknown> }} node - The hierarchy node.
 * @param {Record<string, unknown>} node.data - The node data record.
 * @param {boolean} isRenderRootCard - Whether the root card should be rendered.
 * @returns {boolean} Whether the node is renderable.
 */
function isNodeRenderable(node: { data: Record<string, unknown> }, isRenderRootCard: boolean): boolean {
    return isRenderRootCard || (node.data as Record<string, unknown> | undefined)?.nodeType !== 'root';
}

/**
 * Check whether a link should be rendered.
 * @param {{ source: Record<string, unknown>; target: Record<string, unknown> }} l - The link object.
 * @param {Record<string, unknown>} l.source - The link source node.
 * @param {Record<string, unknown>} l.target - The link target node.
 * @param {boolean} isRootCardVisible - Whether the root card is visible.
 * @returns {boolean} Whether the link is renderable.
 */
function isLinkRenderable(l: { source: Record<string, unknown>; target: Record<string, unknown> }, isRootCardVisible: boolean): boolean {
    return isRootCardVisible || (((l.source as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.nodeType !== 'root' && ((l.target as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.nodeType !== 'root');
}

/**
 * Finalize the graph content by appending nodes and setting up zoom.
 * @param {D3Module} d3 - The D3 module instance.
 * @param {HTMLElement} contentDiv - The container element.
 * @param {D3Sel} svg - The SVG selection.
 * @param {Element | undefined} existingSvgElement - An existing SVG element to reuse.
 * @param {boolean} isZoomEnabled - Whether zoom is enabled.
 * @param {boolean} isCompact - Whether compact mode is active.
 * @param {number} vw - Viewport width.
 * @param {number} vh - Viewport height.
 * @param {number} graphWidth - The computed graph width.
 * @param {number} graphHeight - The computed graph height.
 * @param {number} contentOffsetX - X content offset.
 * @param {number} contentOffsetY - Y content offset.
 * @param {number} cardScale - The card scale factor.
 * @param {{ descendants: () => unknown[]; links: () => unknown[] }} root - The hierarchy root node.
 * @param {() => unknown[]} root.descendants - The descendants function of the root node.
 * @param {() => unknown[]} root.links - The links function of the root node.
 * @param {Record<string, unknown> | undefined} focusNodeData - The focus node data.
 * @param {string | undefined} resolvedFocusNodeId - The resolved focus node ID.
 * @param {unknown[]} renderable - The list of renderable nodes.
 * @param {unknown[]} links - The list of links.
 * @param {unknown} onZoom - The zoom callback.
 * @param {Record<string, unknown> | undefined} restoreTransform - A saved zoom transform to restore.
 * @param {HTMLElement} viewportElement_ - The viewport element.
 * @param {string | undefined} owner - The project owner slug.
 * @param {string | undefined} project - The project slug.
 * @param {unknown} onContextMenu - The context menu callback.
 * @param {boolean | undefined} isLinksEnabled - Whether links are enabled.
 * @param {boolean} isAnimating - Whether animation is active.
 * @param {number} animationSpeed - Animation speed multiplier.
 * @param {string} cardClipPathId - The clip path ID.
 * @returns {{ node: SVGElement | null; zoom: unknown | null }} The SVG node and zoom behavior.
 */
function finalizeGraphContent(
    d3: D3Module, contentDiv: HTMLElement, svg: D3Sel, existingSvgElement: Element | undefined,
    isZoomEnabled: boolean, isCompact: boolean, vw: number, vh: number, graphWidth: number, graphHeight: number,
    contentOffsetX: number, contentOffsetY: number, cardScale: number,
    root: { descendants: () => unknown[]; links: () => unknown[] },
    focusNodeData: Record<string, unknown> | undefined, resolvedFocusNodeId: string | undefined,
    renderable: unknown[], links: unknown[], onZoom: unknown, restoreTransform: Record<string, unknown> | undefined,
    viewportElement_: HTMLElement, owner: string | undefined, project: string | undefined,
    onContextMenu: unknown, isLinksEnabled: boolean | undefined, isAnimating: boolean, animationSpeed: number,
    cardClipPathId: string,
): { node: SVGElement | null; zoom: unknown | null } {
    const graphLayer: D3Sel = existingSvgElement ? svg.select('g') : svg.append('g');
    let focusedHierarchyNode: Record<string, unknown> | undefined;
    const nodeOptions = getNodeOptions(contentOffsetX, contentOffsetY, cardClipPathId, buildNodeOptionsPayload(owner, project, resolvedFocusNodeId, onContextMenu, isZoomEnabled, isLinksEnabled, isCompact, cardScale, isAnimating, animationSpeed));

    let zoom: { transform: unknown } | undefined;
    if (isZoomEnabled) {
        const zoomLayer: D3Sel = graphLayer;
        const { zoom: zoomBehavior, initialScale } = setupZoomBehavior(d3, svg, zoomLayer, vw, vh, graphWidth, graphHeight, onZoom as ((transform: Record<string, unknown>, meta: Record<string, unknown>) => void) | null | undefined);
        zoom = zoomBehavior as { transform: unknown };
        focusedHierarchyNode = findFocusedHierarchyNode(root, focusNodeData, resolvedFocusNodeId);
        logFocusNodeStatus(focusedHierarchyNode, resolvedFocusNodeId, focusNodeData, renderable.length);
        const { initialTransform } = computeInitialTransforms(d3, focusedHierarchyNode, vw, vh, contentOffsetX, contentOffsetY, cardScale, graphWidth, graphHeight, initialScale, existingSvgElement as SVGElement | undefined, svg, restoreTransform);
        svg.call(zoom!.transform, initialTransform);
        scheduleFocusRefinement(d3, svg, zoom!, focusedHierarchyNode, viewportElement_, contentOffsetX, contentOffsetY, cardScale, existingSvgElement as SVGElement | undefined);
        appendGraphNodes(d3, zoomLayer, renderable as Record<string, unknown>[], links as Record<string, unknown>[], nodeOptions as never);
    } else {
        const fitTransform = renderGraphWithoutZoom(d3, graphLayer, renderable as Record<string, unknown>[], vw, vh, graphWidth, graphHeight, contentOffsetX, contentOffsetY, isCompact, cardScale);
        graphLayer.attr('transform', fitTransform as string);
        appendGraphNodes(d3, graphLayer, renderable as Record<string, unknown>[], links as Record<string, unknown>[], nodeOptions as never);
    }

    if (!existingSvgElement) contentDiv.append(svg.node() as Node);
    if (focusedHierarchyNode) logPostRenderFocusDebug(contentDiv, svg, graphLayer, resolvedFocusNodeId, viewportElement_);

    const node = svg.node() as SVGElement;
    const zoomResult = svg.node() && isZoomEnabled ? zoom : undefined;
    return { node, zoom: zoomResult };
}

/**
 * Compute the render viewport dimensions and element.
 * @param {HTMLElement | undefined} contentDiv - The content container element.
 * @param {HTMLElement | undefined} viewportElement - The viewport element.
 * @param {Record<string, unknown>} options - The rendering options.
 * @param {D3Module} d3 - The D3 module instance.
 * @param {Record<string, unknown>} treeData - The hierarchy tree data.
 * @returns {{ viewportElement_: HTMLElement; vw: number; vh: number; retryCount: number } | undefined} The viewport info, or undefined if no valid viewport.
 */
function computeRenderViewport(contentDiv: HTMLElement | undefined, viewportElement: HTMLElement | undefined, options: Record<string, unknown>, d3: D3Module, treeData: Record<string, unknown>): { viewportElement_: HTMLElement; vw: number; vh: number; retryCount: number } | undefined {
    if (!contentDiv) return;
    const retryCount = Number(options._retryCount) || 0;
    const viewportElement_ = (viewportElement as HTMLElement) || contentDiv;
    const viewportSize = getInnerViewportSize(viewportElement_);
    const vw = Number(viewportSize.width) || Number(contentDiv.clientWidth) || 0;
    const vh = Number(viewportSize.height) || Number(contentDiv.clientHeight) || 0;
    if (!vw || !vh) { deferRender(contentDiv, d3, treeData, options, retryCount); return; }
    return { viewportElement_, vw, vh, retryCount };
}

/**
 * Render the full promise stack graph into a content container.
 * @param {HTMLElement | undefined} contentDiv - The container element.
 * @param {D3Module} d3 - The D3 module instance.
 * @param {Record<string, unknown>} treeData - The hierarchy tree data.
 * @param {Record<string, unknown>} [options] - Rendering options.
 * @returns {{ node: SVGElement | null; zoom: unknown | null } | null | undefined} The SVG node and zoom behavior, or null/undefined.
 */
export function renderStackGraph(contentDiv: HTMLElement | undefined, d3: D3Module, treeData: Record<string, unknown>, options: Record<string, unknown> = {}): { node: SVGElement | null; zoom: unknown | null } | null | undefined {
    const {
        owner,
        project,
        focusNodeId,
        focusNodeData,
        enableZoom: isZoomEnabled = true,
        compact: isCompact = false,
        restoreTransform,
        viewportElement,
        clipPathIdPrefix = 'graph-card-clip',
        ariaLabel = 'Project promise tree',
        emptyMessage = 'No cards to display.',
        onZoom,
        onContextMenu,
        minGraphWidth,
        minGraphHeight,
        uniformNodeScale,
        renderRootCard: isRenderRootCard = false,
        enableLinks: isLinksEnabled,
        animate = false,

        animationSpeed = 1,
    } = options;

    const viewport = computeRenderViewport(contentDiv, viewportElement as HTMLElement | undefined, options, d3, treeData);
    if (!viewport) return;
    const { viewportElement_, vw, vh } = viewport;

    const { existingSvgElement, isAnimating } = resolveAnimationOptions(contentDiv!, animate as boolean);
    const margin = getRenderMargin(isCompact as boolean);

    const root = d3.hierarchy(treeData);
    const maxDepth = root.height ?? 0;
    const layout = getSafeLayout(computeGraphLayout(isCompact as boolean, vw, vh, margin as unknown as { top: number; right: number; bottom: number; left: number }, maxDepth, treeData, (uniformNodeScale as number) ?? 1));
    const { stepGapX, stepGapY, foreheadGap, cardScale } = layout;


    const treeLayout = d3.tree().nodeSize([stepGapY, stepGapX]);
    treeLayout(root);
    sanitizeTreePositions(root);

    const descendants = root.descendants();
    const renderable = descendants.filter(node => isNodeRenderable(node, isRenderRootCard as boolean));

    if (renderable.length === 0) {
        renderEmptyState(contentDiv, emptyMessage as string);
        return;
    }

    const isRootCardVisible = isRenderRootCard as boolean;
    const links = root.links().filter(l => isLinkRenderable(l as { source: Record<string, unknown>; target: Record<string, unknown> }, isRootCardVisible));
    const resolvedFocusNodeId = resolveFocusId(focusNodeId as string | undefined, focusNodeData as Record<string, unknown> | null | undefined);
    const { minX, maxX, minY, maxY, graphWidth, graphHeight } = computeGraphDimensions(d3, renderable, cardScale, margin as unknown as { top: number; right: number; bottom: number; left: number }, vw, vh, foreheadGap, isCompact as boolean, minGraphWidth as number | undefined, minGraphHeight as number | undefined);

    logGraphFocus('render-start', {
        owner,
        project,
        compact: isCompact,
        resolvedFocusNodeId,
        nodeCount: renderable.length,
        maxDepth,
        viewportWidth: vw,
        viewportHeight: vh,
        graphWidth,
        graphHeight,
        minX,
        maxX,
        minY,
        maxY,
        contentOffsetPreviewX: (margin as unknown as { left: number }).left - minY,
        contentOffsetPreviewY: (margin as unknown as { top: number }).top - minX + foreheadGap,
    });

    const contentOffsetX = computeContentOffset((margin as unknown as { left: number }).left - minY);
    const contentOffsetY = computeContentOffset((margin as unknown as { top: number }).top - minX + foreheadGap);
    const cardClipPathId = buildCardClipPathId(clipPathIdPrefix as string, owner as string | undefined, project as string | undefined);
    const svg = setupSvgContainer(d3, contentDiv!, existingSvgElement, graphWidth, graphHeight, isCompact as boolean, vh, isZoomEnabled as boolean, ariaLabel as string, cardClipPathId);

    const result = finalizeGraphContent(
        d3, contentDiv!, svg, existingSvgElement, isZoomEnabled as boolean, isCompact as boolean,
        vw, vh, graphWidth, graphHeight, contentOffsetX, contentOffsetY, cardScale,
        root, focusNodeData as Record<string, unknown> | undefined, resolvedFocusNodeId,
        renderable, links, onZoom, restoreTransform as Record<string, unknown> | undefined,
        viewportElement_, owner as string | undefined, project as string | undefined,
        onContextMenu, isLinksEnabled as boolean | undefined, isAnimating, animationSpeed as number,
        cardClipPathId,
    );
    return result;
}

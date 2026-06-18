import { getStatusIcon, getStatusBucket } from '../utils/status-utilities.ts';

/** Interface for D3 selection chaining */
interface D3Sel {
    select: (sel: string) => D3Sel;
    selectAll: (sel: string) => D3Sel;
    append: (tag: string) => D3Sel;
    attr(name: string): string | null;
    attr(name: string, value: unknown): D3Sel;
    style: (name: string, value: unknown) => D3Sel;
    text: (value: unknown) => D3Sel;
    size: () => number;
    data: (data: unknown[], key?: (d: Record<string, unknown>, ...arguments_: unknown[]) => string) => D3Sel;
    enter: () => D3Sel;
    exit: () => D3Sel;
    remove: () => D3Sel;
    transition: (...arguments_: unknown[]) => D3Sel;
    on: (event: string, handler: (...arguments_: unknown[]) => void) => D3Sel;
    each: (function_: (d: Record<string, unknown>, index: number, nodes: unknown[]) => void) => D3Sel;
    call: (behavior: Record<string, unknown>, ...arguments_: unknown[]) => D3Sel;
    node: () => Element | null;
    empty: () => boolean;
    merge: (sel: D3Sel) => D3Sel;
    classed: (name: string, value: boolean | ((d: Record<string, unknown>) => boolean)) => D3Sel;
    filter: (isFilterMatch: (d: Record<string, unknown>, ...arguments_: unknown[]) => boolean) => D3Sel;
    duration: (duration: number) => D3Sel;
    [key: string]: unknown;
}

/** Horizontal gap between graph tiers in full mode. */
export const STEP_GAP_X = 360;
/** Vertical gap between graph tiers in full mode. */
export const STEP_GAP_Y = 190;
/** Width of a graph card in pixels. */
export const CARD_WIDTH = 300;
/** Height of a graph card in pixels. */
export const CARD_HEIGHT = 144;
/** Corner radius of graph cards. */
export const CARD_RADIUS = 18;
/** Horizontal padding inside graph cards. */
export const CARD_PADDING_X = 16;
/** Top padding inside graph cards. */
export const CARD_PADDING_TOP = 16;
/** Y-offset for the first detail line on moment cards. */
export const DETAIL_START_Y = 62;
/** Vertical gap between detail lines on moment cards. */
export const DETAIL_LINE_GAP = 22;
/** Vertical forehead gap above the root card in full mode. */
export const FOREHEAD_GAP = 88;

/** Horizontal gap between graph tiers in compact (detail-page) mode. */
export const COMPACT_STEP_GAP_X = 400;
/** Vertical gap between graph tiers in compact mode. */
export const COMPACT_STEP_GAP_Y = 180;
/** Minimum vertical tier gap in compact mode. */
export const COMPACT_MIN_TIER_GAP_Y = 72;
/** Forehead gap above the root card in compact mode. */
export const COMPACT_FOREHEAD_GAP = 40;
/** Minimum tier gap used for spacing calculations in compact mode. */
export const COMPACT_MIN_TIER_GAP = 140;
/** Largest cards when the detail page shows the fewest tiers (promise). */
export const COMPACT_DETAIL_SCALE_MAX = 1.32;
/** Smallest cards when the detail page shows the most tiers (moment). */
export const COMPACT_DETAIL_SCALE_MIN = 0.84;

/** Ordered list of all node types in the promise stack, from broadest to most granular. */
export const NODE_TYPES = ['promise', 'epic', 'journey', 'flow', 'moment'] as const;
/** Union type of all valid node type strings. */
export type NodeType = typeof NODE_TYPES[number];
/** Map from node type to its URL route segment. */
export const NODE_ROUTE_SEGMENTS: Record<string, string> = {
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
 * Check whether graph focus debug logging is enabled.
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
 * @param {object} details - The debug data.
 */
function logGraphFocus(stage: string, details: Record<string, unknown>): void {
    if (!isGraphFocusDebugEnabled()) return;
    console.info('[graph-focus]', stage, details);
}

/**
 * Get the inner viewport dimensions of an element, excluding padding.
 * @param {HTMLElement} element - The element to measure.
 * @returns {{width: number, height: number}} The inner dimensions.
 */
export function getInnerViewportSize(element: HTMLElement): { width: number; height: number } {
    if (!element) return { width: 0, height: 0 };

    const styles = getComputedStyle(element);
    const paddingLeft = Number.parseFloat(styles.paddingLeft || '0');
    const paddingRight = Number.parseFloat(styles.paddingRight || '0');
    const paddingTop = Number.parseFloat(styles.paddingTop || '0');
    const paddingBottom = Number.parseFloat(styles.paddingBottom || '0');

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
export function truncateText(text: unknown, maxLength = 40): string {
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
export function formatEstimate(value: unknown): string {
    return value === null ? 'Unestimated' : String(value);
}

/**
 * Get the display label for the child type of a given node type.
 * @param {string} nodeType - The parent node type.
 * @returns {string} The child type label, or null for unknown types.
 */
export function getChildTypeLabel(nodeType: string): string | undefined {
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
export function getChildProgressSummary(nodeData: Record<string, unknown>): string | undefined {
    const childLabel = getChildTypeLabel(nodeData.nodeType as string);
    if (!childLabel) return;

    const childCount = (nodeData.childCount as number) ?? 0;
    const completedCount = (nodeData.completedChildCount as number) ?? 0;

    return `${completedCount}/${childCount} ${childCount === 1 ? childLabel : `${childLabel}s`} completed`;
}

/**
 * Get the human-readable label for a node's sub-type (e.g. Story, Job).
 * @param {object} payload - The node payload containing a type field.
 * @returns {string|undefined} The type label, or undefined if not set.
 */
export function getNodeTypeLabel(payload: Record<string, unknown> | null | undefined): string | undefined {
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
export function getMomentTaskSummary(payload: Record<string, unknown> | null | undefined): string | undefined {
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
export function getCardDescription(payload: Record<string, unknown> | null | undefined, maxLength = 52): string {
    const description = String(payload?.description ?? payload?.Description ?? '').trim();
    if (!description) return 'Description: None';

    return truncateText(description.replaceAll(/\s+/g, ' '), maxLength);
}

/**
 * Get the display label for a stride assignment in the graph.
 * @param {object} payload - The node payload containing an assignedStrideId.
 * @returns {string} The stride label (e.g. 'Stride: Backlog' or 'Stride # N').
 */
export function getStrideLabel(payload: Record<string, unknown> | null | undefined): string {
    const id = payload?.assignedStrideId as string | undefined;
    if ([undefined, 'unassigned', ''].includes(id as string | undefined)) return 'Stride: Backlog';
    return `Stride # ${id}`;
}

/**
 * Get the full title text for a graph node (used in tooltips).
 * @param {object} nodeData - The node data.
 * @returns {string} The multi-line title string.
 */
export function getNodeTitle(nodeData: Record<string, unknown>): string {
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
 * Sort items by their displayOrder property, with statement as secondary sort.
 * @param {object[]} items - The items to sort.
 * @returns {object[]} A new sorted array.
 */
export function sortByDisplayOrder(items: Record<string, unknown>[]): Record<string, unknown>[] {
    return items.toSorted((left, right) => {
        const orderDelta = ((left.displayOrder as number) ?? 0) - ((right.displayOrder as number) ?? 0);
        if (orderDelta !== 0) return orderDelta;
        return String(left.statement ?? '').localeCompare(String(right.statement ?? ''));
    });
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
export function getMomentStrideBucket(payload: Record<string, unknown> | null | undefined): string {
    const id = payload?.assignedStrideId as string | undefined;
    if ([undefined, 'unassigned', ''].includes(id as string | undefined)) return 'backlog';
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
export function getNodeColor(nodeType: string): string {
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
export function getAppBasePath(): string {
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
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {string|undefined} The detail page URL, or undefined if node type has no route.
 */
export function getNodeHref(node: Record<string, unknown>, owner: string, project: string): string | undefined {
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
export function findNodeById(treeData: Record<string, unknown> | null | undefined, nodeId: string | null | undefined): Record<string, unknown> | undefined {
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

    return;
}

/**
 * Count the number of renderable (non-root) nodes in the graph tree.
 * @param {object} node - The tree root node.
 * @returns {number} The count of renderable nodes.
 */
export function countRenderableNodes(node: Record<string, unknown> | null | undefined): number {
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
export function renderEmptyState(contentDiv: HTMLElement | null | undefined, message: string): void {
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
    return {
        x: node.y + contentOffsetX,
        y: node.x + contentOffsetY,
    };
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
function createFocusTransform(d3: Record<string, unknown>, viewportWidth: number, viewportHeight: number, node: { x: number; y: number } | null | undefined, contentOffsetX: number, contentOffsetY: number, scale = 1.5): Record<string, unknown> | undefined {
    if (!node) return;
    const targetScale = Math.max(0.5, Math.min(2.5, scale));
    const position = getRenderedNodePosition(node, contentOffsetX, contentOffsetY);

    const identityTranslate = (d3.zoomIdentity as Record<string, unknown>).translate as (x: number, y: number) => D3Sel;
    const translated = identityTranslate(viewportWidth / 2, viewportHeight / 2);
    const scaled = (translated.scale as (k: number) => D3Sel)(targetScale);
    return (scaled.translate as (x: number, y: number) => D3Sel)(-position.x, -position.y) as unknown as Record<string, unknown>;
}

/**
 * Get the layout profile for compact (detail-page) graph rendering based on visible node count.
 * @param {number} visibleCount - The number of visible nodes.
 * @param {number} viewportWidth - The viewport width.
 * @param {number} viewportHeight - The viewport height.
 * @returns {{nodeScale: number, minGapX: number, minGapY: number, forehead: number, anchorOffsetX: number, anchorOffsetY: number}} The layout profile.
 */
function getCompactLayoutProfile(visibleCount: number, viewportWidth: number, viewportHeight: number): { nodeScale: number; minGapX: number; minGapY: number; forehead: number; anchorOffsetX: number; anchorOffsetY: number } {
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
function appendGraphNodes(d3: Record<string, unknown>, layer: Record<string, unknown>, renderable: Record<string, unknown>[], links: Record<string, unknown>[], options: {
    contentOffsetX: number;
    contentOffsetY: number;
    cardClipPathId: string;
    owner: string | null;
    project: string | null;
    focusNodeId: string | null;
    onContextMenu: ((event: MouseEvent | KeyboardEvent | Record<string, unknown>, data: Record<string, unknown>) => void) | null;
    enableZoom: boolean;
    enableLinks?: boolean;
    uniformNodeScale?: number | null;
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

    const nodeScale = uniformNodeScale ?? 1;
    const containerTag = isEnableLinks ? 'a' : 'g';
    const duration = Math.max(0, Math.round(200 / Math.max(0.1, animationSpeed)));
    const t = ((d3.transition as (...arguments_: unknown[]) => D3Sel)().duration as (duration: number) => D3Sel)(duration);

    /**
     * Compute the final transform for a node in the animated transition.
     * @param {object} d - The D3 node data.
     * @returns {string} A CSS translate() string with the target position and scale.
     */
    function getFinalTransform(d: Record<string, unknown>): string {
        return `translate(${(d.y as number) + contentOffsetX}, ${(d.x as number) + contentOffsetY}) scale(${nodeScale})`;
    }

    /**
     * Compute the transform for a node at its parent position (used for exit animations).
     * @param {object} d - The D3 node data.
     * @returns {string} A CSS translate() string with the parent position and scale.
     */
    function getParentTransform(d: Record<string, unknown>): string {
        const parent = d.parent as Record<string, unknown> | null | undefined;
        const px = parent ? (parent.y as number) : 0;
        const py = parent ? (parent.x as number) : 0;
        return `translate(${px + contentOffsetX}, ${py + contentOffsetY}) scale(${nodeScale})`;
    }

    /**
     * Compute the SVG path for a link entering from the parent position.
     * @param {object} d - The D3 link data with source and target nodes.
     * @returns {string} An SVG path data string.
     */
    function getFinalLinkPath(d: Record<string, unknown>): string {
        const linkGen = (d3.linkHorizontal as (...arguments_: unknown[]) => D3Sel)();
        const withX = (linkGen.x as (...arguments_: unknown[]) => D3Sel)((point: Record<string, unknown>) => (point as Record<string, unknown>).y);
        const withY = (withX.y as (...arguments_: unknown[]) => D3Sel)((point: Record<string, unknown>) => (point as Record<string, unknown>).x);
        return (withY as unknown as (...arguments_: unknown[]) => string)({
            source: {
                x: (d.source as Record<string, unknown>).x as number + contentOffsetY,
                y: (d.source as Record<string, unknown>).y as number + contentOffsetX + ((CARD_WIDTH / 2) * nodeScale),
            },
            target: {
                x: (d.target as Record<string, unknown>).x as number + contentOffsetY,
                y: (d.target as Record<string, unknown>).y as number + contentOffsetX - ((CARD_WIDTH / 2) * nodeScale),
            },
        });
    }

    // --- Link paths ---
    const linkGroup = (layer.select as (sel: string) => D3Sel)('g.links').size()
        ? (layer.select as (sel: string) => D3Sel)('g.links')
        : (layer.append as (tag: string) => D3Sel)('g')
            .attr('class', 'links')
            .attr('fill', 'none')
            .attr('stroke', '#94a3b8')
            .attr('stroke-opacity', 0.65)
            .attr('stroke-width', 1.5);

    const linkBound = (linkGroup.selectAll as (sel: string) => D3Sel)('path')
        .data(links, (l: Record<string, unknown>) => `${((l.source as Record<string, unknown>).data as Record<string, unknown>).id}->${((l.target as Record<string, unknown>).data as Record<string, unknown>).id}` as unknown as string);

    (linkBound.exit as () => D3Sel)().transition(t)
        .attr('opacity', 0)
        .remove();

    (linkBound.attr as (attribute: string, value: unknown) => D3Sel)('opacity', 1)
        .attr('d', (d: Record<string, unknown>) => getFinalLinkPath(d));

    const linkEnter = (linkBound.enter as () => D3Sel)()
        .append('path')
        .attr('opacity', 0)
        .attr('d', (d: Record<string, unknown>) => getFinalLinkPath(d));

    if (isAnimate) {
        (linkEnter.transition as (...arguments_: unknown[]) => D3Sel)(t).attr('opacity', 1);
    } else {
        (linkEnter.attr as (attribute: string, value: unknown) => D3Sel)('opacity', 1);
    }

    // --- Node cards ---
    const nodeGroup = (layer.select as (sel: string) => D3Sel)('g.nodes').size()
        ? (layer.select as (sel: string) => D3Sel)('g.nodes')
        : (layer.append as (tag: string) => D3Sel)('g').attr('class', 'nodes');

    const nodeBound = (nodeGroup.selectAll as (sel: string) => D3Sel)(containerTag)
        .data(renderable, (d: Record<string, unknown>) => (d.data as Record<string, unknown>).id as string);

    (nodeBound.exit as () => D3Sel)()
        .transition(t)
        .attr('opacity', 0)
        .attr('transform', (d: Record<string, unknown>) => getParentTransform(d))
        .remove();

    const nodeEnter = (nodeBound.enter as () => D3Sel)()
        .append(containerTag)
        .attr('opacity', 0)
        .attr('transform', (d: Record<string, unknown>) => getParentTransform(d))
        .style('text-decoration', 'none');

    (nodeEnter.append as (tag: string) => D3Sel)('title')
        .text((current: Record<string, unknown>) => getNodeTitle(current.data as Record<string, unknown>));

    (nodeEnter.append as (tag: string) => D3Sel)('rect')
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

    (nodeEnter.append as (tag: string) => D3Sel)('rect')
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

    (nodeEnter.append as (tag: string) => D3Sel)('text')
        .attr('class', 'graph-card-statement')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('focusable', 'false')
        .text((current: Record<string, unknown>) => truncateText((current.data as Record<string, unknown>).label as string, 36));

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType !== 'moment' && (current.data as Record<string, unknown>).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--node-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .attr('focusable', 'false')
        .text((current: Record<string, unknown>) => getNodeTypeLabel((current.data as Record<string, unknown>).payload as Record<string, unknown>) ?? '');

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-status')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'hanging')
        .attr('focusable', 'false')
        .text((current: Record<string, unknown>) => getStatusIcon((current.data as Record<string, unknown>).payload!['statusColor' as keyof object] as string));

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => {
            const hiddenCount = Number.parseInt((current.data as Record<string, unknown>)._hiddenDescendantCount as string ?? '0', 10) || 0;
            return hiddenCount > 0 && Boolean((current.data as Record<string, unknown>)._isCollapsed);
        })
        .append('text')
        .attr('class', 'graph-card-collapsed-badge')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', CARD_HEIGHT / 2 - 12)
        .attr('text-anchor', 'end')
        .text((current: Record<string, unknown>) => {
            const hiddenCount = Number.parseInt((current.data as Record<string, unknown>)._hiddenDescendantCount as string ?? '0', 10) || 0;
            return `${hiddenCount} hidden`;
        });

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text((current: Record<string, unknown>) => getNodeTypeLabel((current.data as Record<string, unknown>).payload as Record<string, unknown>) ?? '');

    (nodeEnter.append as (tag: string) => D3Sel)('line')
        .attr('class', 'graph-card-divider')
        .attr('x1', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('x2', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y1', -CARD_HEIGHT / 2 + 42)
        .attr('y2', -CARD_HEIGHT / 2 + 42)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: Record<string, unknown>) => getStrideLabel((current.data as Record<string, unknown>).payload as Record<string, unknown>));

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + DETAIL_LINE_GAP)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: Record<string, unknown>) => getCardDescription((current.data as Record<string, unknown>).payload as Record<string, unknown>, 52));

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 2))
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: Record<string, unknown>) => `Effort: ${formatEstimate((current.data as Record<string, unknown>).payload!['effortEstimate' as keyof object])}`);

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment' && !!getMomentTaskSummary((current.data as Record<string, unknown>).payload as Record<string, unknown>))
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-tasks')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 3))
        .attr('fill', '#0f766e')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text((current: Record<string, unknown>) => getMomentTaskSummary((current.data as Record<string, unknown>).payload as Record<string, unknown>));

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType !== 'moment' && (current.data as Record<string, unknown>).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 62)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: Record<string, unknown>) => getCardDescription((current.data as Record<string, unknown>).payload as Record<string, unknown>));

    (nodeEnter.filter as (isFilterMatch: (d: Record<string, unknown>) => boolean) => D3Sel)((current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType !== 'moment' && (current.data as Record<string, unknown>).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 88)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('dominant-baseline', 'middle')
        .text((current: Record<string, unknown>) => getChildProgressSummary(current.data as Record<string, unknown>) ?? 'No child cards');

    const node = (nodeEnter.merge as (sel: Record<string, unknown>) => D3Sel)(nodeBound);

    (node.select as (sel: string) => D3Sel)('title').text((current: Record<string, unknown>) => getNodeTitle(current.data as Record<string, unknown>));
    (node.select as (sel: string) => D3Sel)('text.graph-card-statement').text((current: Record<string, unknown>) => truncateText((current.data as Record<string, unknown>).label as string, 36));
    (node.select as (sel: string) => D3Sel)('rect.graph-card-accent').attr('fill', (current: Record<string, unknown>) => getNodeColor((current.data as Record<string, unknown>).nodeType as string));
    (node.select as (sel: string) => D3Sel)('text.graph-card-status').text((current: Record<string, unknown>) => getStatusIcon(((current.data as Record<string, unknown>).payload as Record<string, unknown>)?.statusColor as string));

    (node.each as (isFilterMatch: (d: Record<string, unknown>, index: number, nodes: unknown[]) => void) => void)(function (current: Record<string, unknown>, _index: number, nodes: unknown[]) {
        const currentNode = nodes[_index] as Element;
        const badge = (d3.select as (element: Element) => D3Sel)(currentNode).select('text.graph-card-collapsed-badge');
        const hiddenCount = Number.parseInt((current.data as Record<string, unknown>)._hiddenDescendantCount as string ?? '0', 10) || 0;
        const shouldShowBadge = hiddenCount > 0 && Boolean((current.data as Record<string, unknown>)._isCollapsed);

        if (shouldShowBadge) {
            if (badge.empty()) {
                (d3.select as (element: Element) => D3Sel)(currentNode).append('text')
                    .attr('class', 'graph-card-collapsed-badge')
                    .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
                    .attr('y', CARD_HEIGHT / 2 - 12)
                    .attr('text-anchor', 'end')
                    .text(`${hiddenCount} hidden`);
            } else {
                (badge.text as (value: string) => void)(`${hiddenCount} hidden`);
            }
        } else if (!badge.empty()) {
            (badge.remove as () => void)();
        }
    });

    if (isEnableLinks) {
        (node.attr as (attribute: string, value: unknown) => D3Sel)('href', (current: Record<string, unknown>) => getNodeHref(current.data as Record<string, unknown>, owner as string, project as string))
            .attr('xlink:href', (current: Record<string, unknown>) => getNodeHref(current.data as Record<string, unknown>, owner as string, project as string))
            .attr('data-nav', '');
    }

    (node.style as (property: string, value: unknown) => D3Sel)('text-decoration', 'none')
        .style('--graph-card-bg', '#ffffff')
        .style('--graph-accent', (current: Record<string, unknown>) => getNodeColor((current.data as Record<string, unknown>).nodeType as string))
        .style('--graph-stroke', (current: Record<string, unknown>) => {
            const isFocused = focusNodeId !== null && (current.data as Record<string, unknown>).id === focusNodeId;
            const isAllowFocusHighlight = (current.data as Record<string, unknown>).nodeType !== 'root';
            if ((current.data as Record<string, unknown>)._searchMatched || (isFocused && isAllowFocusHighlight)) return '#d4af37';
            return (current as Record<string, unknown>).depth === 0 ? getNodeColor((current.data as Record<string, unknown>).nodeType as string) : '#cbd5e1';
        })
        .style('--graph-stroke-width', (current: Record<string, unknown>) => {
            const isFocused = focusNodeId !== null && (current.data as Record<string, unknown>).id === focusNodeId;
            const isAllowFocusHighlight = (current.data as Record<string, unknown>).nodeType !== 'root';
            if ((current.data as Record<string, unknown>)._searchMatched || (isFocused && isAllowFocusHighlight)) return 3;
            return (current as Record<string, unknown>).depth === 0 ? 2.5 : 1.5;
        })
        .classed('graph-node', true)
        .classed('is-root', (current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'root')
        .classed('is-moment', (current: Record<string, unknown>) => (current.data as Record<string, unknown>).nodeType === 'moment')
        .classed('is-collapsed', (current: Record<string, unknown>) => Boolean((current.data as Record<string, unknown>)._isCollapsed))
        .classed('is-search-matched', (current: Record<string, unknown>) => Boolean((current.data as Record<string, unknown>)._searchMatched))
        .classed('is-focused', (current: Record<string, unknown>) => (focusNodeId !== null && (current.data as Record<string, unknown>).id === focusNodeId))
        .attr('tabindex', (current: Record<string, unknown>) => {
            if ((current.data as Record<string, unknown>).nodeType === 'root') return;
            return isEnableZoom ? 0 : -1;
        })
        .attr('role', (current: Record<string, unknown>) => (isEnableZoom && (current.data as Record<string, unknown>).nodeType !== 'root') ? 'treeitem' : undefined)
        .attr('aria-label', (current: Record<string, unknown>) => (isEnableZoom && (current.data as Record<string, unknown>).nodeType !== 'root') ? (getNodeTitle(current.data as Record<string, unknown>) || 'Graph node') : undefined);

    if (onContextMenu) {
        (node.on as (event: string, handler: (...arguments_: unknown[]) => void) => D3Sel)('contextmenu', ((event: MouseEvent, current: Record<string, unknown>) => {
            event.preventDefault();
            onContextMenu(event, current.data as Record<string, unknown>);
        }) as (...arguments_: unknown[]) => void);

        (node.on as (event: string, handler: (...arguments_: unknown[]) => void) => D3Sel)('keydown', ((event: KeyboardEvent, current: Record<string, unknown>) => {
            if (!['Enter', ' ', 'Space'].includes(event.key)) return;

            event.preventDefault();
            const rect = (event.target as Element | null)?.getBoundingClientRect?.();
            const fakeEvent = { ...event, clientX: rect?.left ?? 0, clientY: rect?.bottom ?? 0 } as unknown as MouseEvent;
            onContextMenu(fakeEvent, current.data as Record<string, unknown>);
        }) as (...arguments_: unknown[]) => void);
    }

    (nodeBound.attr as (attribute: string, value: unknown) => D3Sel)('opacity', 1)
        .attr('transform', (d: Record<string, unknown>) => getFinalTransform(d));

    if (isAnimate) {
        (nodeEnter.transition as (...arguments_: unknown[]) => D3Sel)(t)
            .attr('opacity', 1)
            .attr('transform', (d: Record<string, unknown>) => getFinalTransform(d));
    } else {
        (nodeEnter.attr as (attribute: string, value: unknown) => D3Sel)('opacity', 1)
            .attr('transform', (d: Record<string, unknown>) => getFinalTransform(d));
    }
}

/**
 * Render a promise stack tree into the given content div using D3.
 * Supports both full graph (zoomable) and compact detail-page modes.
 * @param {HTMLElement | null | undefined} contentDiv - The container element to render into.
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
export function renderStackGraph(contentDiv: HTMLElement | null | undefined, d3: Record<string, unknown>, treeData: Record<string, unknown>, options: Record<string, unknown> = {}): { node: SVGElement | null; zoom: Record<string, unknown> | undefined } | undefined {
    const {
        owner,
        project,
        focusNodeId,
        focusNodeData,
        enableZoom = true,
        compact = false,
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
        renderRootCard = false,
        enableLinks,
        animate = false,

        animationSpeed = 1,
    } = options;

    if (!contentDiv) return;

    const existingSvgElement = animate ? contentDiv.querySelector('svg') : undefined;
    const isPrefersReducedMotion = typeof window !== 'undefined' && globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const resolvedAnimate = animate && !isPrefersReducedMotion;

    const margin = compact
        ? { top: 12, right: 20, bottom: 12, left: 20 }
        : { top: 32, right: 48, bottom: 32, left: 48 };

    const root = (d3.hierarchy as (data: Record<string, unknown>) => D3Sel)(treeData);
    const maxDepth = (root.height as number) ?? 0;
    const viewportElement_ = (viewportElement as HTMLElement) || contentDiv;
    const viewportSize = getInnerViewportSize(viewportElement_);
    const viewportWidth = viewportSize.width || contentDiv.clientWidth || 0;
    const viewportHeight = viewportSize.height || contentDiv.clientHeight || 0;

    // Determine compact layout profile when in compact detail mode. This drives node scale
    // and both X/Y tier gaps so small containers don't produce overlapping cards.
    let stepGapX = compact ? COMPACT_STEP_GAP_X : STEP_GAP_X;
    let stepGapY = compact ? COMPACT_STEP_GAP_Y : STEP_GAP_Y;
    let foreheadGap = compact ? COMPACT_FOREHEAD_GAP : FOREHEAD_GAP;

    // Default card scale; may be overridden for compact detail pages by the profile
    let cardScale = uniformNodeScale as number ?? 1;
    if (compact) {
        const visibleCount = countRenderableNodes(treeData);
        const profile = getCompactLayoutProfile(visibleCount, viewportWidth, viewportHeight);
        cardScale = profile.nodeScale ?? cardScale;
        stepGapY = profile.minGapY ?? stepGapY;
        foreheadGap = profile.forehead ?? foreheadGap;

        if (maxDepth > 0 && viewportWidth > 0) {
            const usableWidth = Math.max(
                viewportWidth - margin.left - margin.right - (CARD_WIDTH * cardScale),
                CARD_WIDTH,
            );
            stepGapX = Math.max(usableWidth / maxDepth, profile.minGapX ?? COMPACT_MIN_TIER_GAP);
        }

        // Also compress vertical spacing when the viewport height is small
        if (maxDepth > 0 && viewportHeight > 0) {
            const usableHeight = Math.max(
                viewportHeight - margin.top - margin.bottom - (CARD_HEIGHT * cardScale) - foreheadGap,
                CARD_HEIGHT,
            );
            // distribute usableHeight across tiers, but don't go below a small minimum
            stepGapY = Math.max(Math.floor(usableHeight / Math.max(1, maxDepth)), COMPACT_MIN_TIER_GAP_Y);
        }
    }

    const treeLayout = ((d3.tree as () => Record<string, unknown>)().nodeSize as (...arguments_: unknown[]) => Record<string, unknown>)([stepGapY, stepGapX]);
    (treeLayout as unknown as (root: Record<string, unknown>) => void)(root);

    const descendants = (root.descendants as () => Record<string, unknown>[])();
    const renderable = descendants.filter(node => renderRootCard || (node.data as Record<string, unknown> | undefined)?.nodeType !== 'root');

    if (renderable.length === 0) {
        renderEmptyState(contentDiv, emptyMessage as string);
        return;
    }

    const links = (root.links as () => Record<string, unknown>[])().filter(l => {
        if (renderRootCard) return true;
        return ((l.source as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.nodeType !== 'root' && ((l.target as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.nodeType !== 'root';
    });
    const resolvedFocusNodeId = (focusNodeId as string) ?? (focusNodeData as Record<string, unknown> | null)?.id;
    const scaledCardWidth = CARD_WIDTH * cardScale;
    const scaledCardHeight = CARD_HEIGHT * cardScale;
    const minX = (d3.min as (array: Record<string, unknown>[], isFilterMatch: (d: Record<string, unknown>) => number) => number | undefined)(renderable, (node: Record<string, unknown>) => (node.x as number) - (scaledCardHeight / 2)) ?? -(scaledCardHeight / 2);
    const maxX = (d3.max as (array: Record<string, unknown>[], isFilterMatch: (d: Record<string, unknown>) => number) => number | undefined)(renderable, (node: Record<string, unknown>) => (node.x as number) + (scaledCardHeight / 2)) ?? (scaledCardHeight / 2);
    const minY = (d3.min as (array: Record<string, unknown>[], isFilterMatch: (d: Record<string, unknown>) => number) => number | undefined)(renderable, (node: Record<string, unknown>) => (node.y as number) - (scaledCardWidth / 2)) ?? -(scaledCardWidth / 2);
    const maxY = (d3.max as (array: Record<string, unknown>[], isFilterMatch: (d: Record<string, unknown>) => number) => number | undefined)(renderable, (node: Record<string, unknown>) => (node.y as number) + (scaledCardWidth / 2)) ?? (scaledCardWidth / 2);
    const defaultMinWidth = compact ? viewportWidth || 400 : 960;
    const defaultMinHeight = compact ? viewportHeight || 180 : 520;
    const graphWidth = Math.max((maxY - minY) + margin.left + margin.right, viewportWidth, (minGraphWidth as number) ?? defaultMinWidth);
    const graphHeight = Math.max((maxX - minX) + margin.top + margin.bottom + foreheadGap, viewportHeight, (minGraphHeight as number) ?? defaultMinHeight);

    logGraphFocus('render-start', {
        owner,
        project,
        compact,
        resolvedFocusNodeId,
        nodeCount: renderable.length,
        maxDepth,
        viewportWidth,
        viewportHeight,
        graphWidth,
        graphHeight,
        minX,
        maxX,
        minY,
        maxY,
        contentOffsetPreviewX: margin.left - minY,
        contentOffsetPreviewY: margin.top - minX + foreheadGap,
    });

    const contentOffsetX = margin.left - minY;
    const contentOffsetY = margin.top - minX + foreheadGap;
    const cardClipPathId = `${clipPathIdPrefix as string}-${owner ?? 'stack'}-${project ?? 'stack'}`;

    let svg: D3Sel;
    if (existingSvgElement) {
        svg = (d3.select as (element: Element) => D3Sel)(existingSvgElement);
        (svg.attr as (attribute: string, value: unknown) => D3Sel)('viewBox', [0, 0, graphWidth, graphHeight])
           .attr('height', compact ? '100%' : Math.max(graphHeight, viewportHeight || 0));
        (svg.select as (sel: string) => D3Sel)('defs').remove();
    } else {
        contentDiv.replaceChildren();
        svg = (d3.create as (tag: string) => D3Sel)('svg')
            .attr('viewBox', [0, 0, graphWidth, graphHeight])
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('width', '100%')
            .attr('height', compact ? '100%' : Math.max(graphHeight, viewportHeight || 0))
            .attr('role', enableZoom ? 'tree' : ((enableLinks as boolean | undefined) ? undefined : 'img'))
            .attr('aria-label', ariaLabel);
    }

    (svg.append as (tag: string) => D3Sel)('defs')
        .append('clipPath')
        .attr('id', cardClipPathId)
        .append('rect')
        .attr('x', -CARD_WIDTH / 2)
        .attr('y', -CARD_HEIGHT / 2)
        .attr('width', CARD_WIDTH)
        .attr('height', CARD_HEIGHT)
        .attr('rx', CARD_RADIUS)
        .attr('ry', CARD_RADIUS);

    const graphLayer: D3Sel = existingSvgElement ? (svg.select as (sel: string) => D3Sel)('g') : (svg.append as (tag: string) => D3Sel)('g');
    let focusedHierarchyNode: Record<string, unknown> | undefined;
    const nodeOptions = {
        contentOffsetX,
        contentOffsetY,
        cardClipPathId,
        owner: owner as string,
        project: project as string,
        focusNodeId: resolvedFocusNodeId,
        onContextMenu: onContextMenu as (event: Record<string, unknown> | MouseEvent | KeyboardEvent, data: Record<string, unknown>) => void,
        enableZoom: Boolean(enableZoom),
        enableLinks: (enableLinks as boolean | undefined) ?? Boolean(enableZoom),
        uniformNodeScale: compact ? cardScale : undefined,
        animate: Boolean(resolvedAnimate),
        animationSpeed: animationSpeed as number,
    };

    let zoom: Record<string, unknown> | undefined;
    if (enableZoom) {
        const zoomLayer = graphLayer;
        const safeViewportWidth = Math.max(viewportWidth, 1);
        const safeViewportHeight = Math.max(viewportHeight, 1);

        zoom = (d3.zoom as unknown as () => Record<string, unknown>)();
        (zoom.scaleExtent as (...arguments_: unknown[]) => Record<string, unknown>)([0.5, 2.5]);
        (zoom.extent as (...arguments_: unknown[]) => Record<string, unknown>)([[0, 0], [safeViewportWidth, safeViewportHeight]]);
        (zoom.translateExtent as (...arguments_: unknown[]) => Record<string, unknown>)([
                [-safeViewportWidth, -safeViewportHeight],
                [graphWidth + safeViewportWidth, graphHeight + safeViewportHeight],
        ]);
        (zoom.on as (event: string, handler: (...arguments_: unknown[]) => void) => Record<string, unknown>)('zoom', ((event: unknown) => {
                const zoomEvent = event as Record<string, unknown>;
                (zoomLayer.attr as (attribute: string, value: unknown) => D3Sel)('transform', zoomEvent.transform);
                (onZoom as ((transform: Record<string, unknown>, meta: Record<string, unknown>) => void) | null)?.(zoomEvent.transform as Record<string, unknown>, { user: Boolean(zoomEvent.sourceEvent) });
            }) as (...arguments_: unknown[]) => void);

        (svg.call as (behavior: Record<string, unknown>) => void)(zoom!);
        (svg.on as (event: string, handler: unknown) => void)('dblclick.zoom', undefined);

        const initialScale = Math.min(
            viewportWidth > 0 ? viewportWidth / graphWidth : 1,
            viewportHeight > 0 ? viewportHeight / graphHeight : 1,
            1
        );
        focusedHierarchyNode = (() => {
            if (focusNodeData) {
                const byIdentity = (root.descendants as () => Record<string, unknown>[])().find(node => node.data === focusNodeData);
                if (byIdentity) return byIdentity;
            }

            if (!resolvedFocusNodeId) return;
            return (root.descendants as () => Record<string, unknown>[])().find(node => (node.data as Record<string, unknown> | undefined)?.id === resolvedFocusNodeId);
        })();

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
                renderableCount: renderable.length,
            });
        }

        const focusTransform = focusedHierarchyNode
            ? createFocusTransform(d3, viewportWidth, viewportHeight, focusedHierarchyNode as unknown as { x: number; y: number }, contentOffsetX, contentOffsetY, cardScale)
            : undefined;
        const fitTranslate = (d3.zoomIdentity as Record<string, unknown>).translate as (x: number, y: number) => Record<string, unknown>;
        const fitTransform = (fitTranslate(
                viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
                viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0
            ).scale as (k: number) => Record<string, unknown>)(initialScale);
        const initialTransform = existingSvgElement
            ? (d3.zoomTransform as (node: Element) => D3Sel)(svg.node() as Element)
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

        logGraphFocus('initial-transform', {
            mode,
            transform: initialTransform ? {
                x: (initialTransform as Record<string, unknown>).x,
                y: (initialTransform as Record<string, unknown>).y,
                k: (initialTransform as Record<string, unknown>).k,
            } : undefined,
            focusTransform: focusTransform ? { x: (focusTransform as Record<string, unknown>).x, y: (focusTransform as Record<string, unknown>).y, k: (focusTransform as Record<string, unknown>).k } : undefined,
            fitTransform: { x: (fitTransform as Record<string, unknown>).x, y: (fitTransform as Record<string, unknown>).y, k: (fitTransform as Record<string, unknown>).k },
            restoreTransform: restoreTransform ? { x: (restoreTransform as Record<string, unknown>).x, y: (restoreTransform as Record<string, unknown>).y, k: (restoreTransform as Record<string, unknown>).k } : undefined,
        });

        (svg.call as (behavior: Record<string, unknown>, ...arguments_: unknown[]) => void)(zoom!.transform as Record<string, unknown>, initialTransform);

        if (focusedHierarchyNode && !existingSvgElement) {
            requestAnimationFrame(() => {
                const measuredViewport = getInnerViewportSize(viewportElement_);
                const measuredWidth = Number(measuredViewport.width ?? 0);
                const measuredHeight = Number(measuredViewport.height ?? 0);

                // For large graphs, falling back to contentDiv size can use the full SVG height,
                // which pushes the focus transform far off target. Only refine when we can
                // measure the real viewport dimensions.
                if (measuredWidth <= 1 || measuredHeight <= 1) {
                    logGraphFocus('refine-skip-invalid-viewport', {
                        measuredWidth,
                        measuredHeight,
                    });
                    return;
                }

                const refinedTransform = createFocusTransform(
                    d3,
                    Math.max(measuredWidth, 1),
                    Math.max(measuredHeight, 1),
                    focusedHierarchyNode as unknown as { x: number; y: number },
                    contentOffsetX,
                    contentOffsetY,
                    cardScale
                );

                if (!refinedTransform) return;

                logGraphFocus('refined-transform', {
                    measuredWidth,
                    measuredHeight,
                    transform: {
                        x: (refinedTransform as Record<string, unknown>).x,
                        y: (refinedTransform as Record<string, unknown>).y,
                        k: (refinedTransform as Record<string, unknown>).k,
                    },
                });

                (svg.call as (behavior: Record<string, unknown>, ...arguments_: unknown[]) => void)(zoom!.transform as Record<string, unknown>, refinedTransform);
            });
        }

        appendGraphNodes(d3, zoomLayer, renderable, links, nodeOptions);
    } else {
        const initialScale = Math.min(
            viewportWidth > 0 ? viewportWidth / graphWidth : 1,
            viewportHeight > 0 ? viewportHeight / graphHeight : 1,
            1
        );
        // For compact non-zoom mode prefer a deterministic anchor-centered transform
        // based on visible nodes so detail pages center predictably.
        const fitTranslate1 = (d3.zoomIdentity as Record<string, unknown>).translate as (x: number, y: number) => Record<string, unknown>;
        let fitTransform = (fitTranslate1(
                viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
                viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0
            ).scale as (k: number) => Record<string, unknown>)(initialScale);

        if (compact) {
            // Choose anchor: middle card for odd counts, midpoint between middle two for even
            const ordered = renderable.toSorted((a, b) => ((a.y as number) || 0) - ((b.y as number) || 0));
            if (ordered.length > 0) {
                const mid = Math.floor((ordered.length - 1) / 2);
                let anchors: Record<string, unknown>[] = [];
                anchors = ordered.length % 2 === 1 ? [ordered[mid]] : [ordered[mid], ordered[mid + 1]];

                const anchorPos = { x: 0, y: 0 };
                for (const anchor of anchors) {
                    const pos = getRenderedNodePosition(anchor as unknown as { x: number; y: number }, contentOffsetX, contentOffsetY);
                    anchorPos.x += pos.x;
                    anchorPos.y += pos.y;
                }
                anchorPos.x /= anchors.length; anchorPos.y /= anchors.length;

                // Apply any profile-specified anchor offsets (helps nudge centering)
                const profile = getCompactLayoutProfile(ordered.length, viewportWidth, viewportHeight) || {};
                anchorPos.x += profile.anchorOffsetX ?? 0;
                anchorPos.y += profile.anchorOffsetY ?? 0;

                const ftTranslate = (d3.zoomIdentity as Record<string, unknown>).translate as (x: number, y: number) => Record<string, unknown>;
                const ftTranslated = ftTranslate(viewportWidth / 2, viewportHeight / 2);
                const ftScaled = (ftTranslated.scale as (k: number) => Record<string, unknown>)(cardScale);
                fitTransform = (ftScaled.translate as (x: number, y: number) => Record<string, unknown>)(-anchorPos.x, -anchorPos.y);
            }
        }

        (graphLayer.attr as (attribute: string, value: unknown) => D3Sel)('transform', fitTransform);
        appendGraphNodes(d3, graphLayer, renderable, links, nodeOptions);
    }

    if (!existingSvgElement) {
        contentDiv.append(svg.node() as Node);
    }

    if (focusedHierarchyNode) {
        requestAnimationFrame(() => {
            if (!isGraphFocusDebugEnabled()) return;

            const focusElement = contentDiv.querySelector(':scope .graph-node.is-focused .graph-card');
            const viewportRect = (viewportElement_ as HTMLElement)?.getBoundingClientRect?.();
            const focusRect = (focusElement as Element | null)?.getBoundingClientRect?.();
            const zoomTransform = (svg.node() as Record<string, unknown> | null)?.__zoom;

            logGraphFocus('post-render-transform-state', {
                resolvedFocusNodeId,
                layerTransform: (graphLayer.attr as (attribute: string) => string | null)('transform'),
                svgZoomTransform: zoomTransform ? {
                    x: (zoomTransform as Record<string, unknown>).x,
                    y: (zoomTransform as Record<string, unknown>).y,
                    k: (zoomTransform as Record<string, unknown>).k,
                } : undefined,
                svgViewBox: (svg.attr as (attribute: string) => string | null)('viewBox'),
                svgSize: {
                    width: (svg.attr as (attribute: string) => string | null)('width'),
                    height: (svg.attr as (attribute: string) => string | null)('height'),
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
        });
    }

    return {
        node: svg.node() as SVGElement,
        zoom: svg.node() && enableZoom ? zoom : undefined,
    };
}

export {getStatusIcon, getStatusBucket} from '../utils/status-utilities.ts';
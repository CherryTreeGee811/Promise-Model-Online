declare const d3: any;
import { getStatusIcon, getStatusBucket } from '../utils/status-utilities.ts';



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
export function logGraphFocus(stage: string, details: any): void {
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
function getChildProgressSummary(nodeData: any): string | undefined {
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
function getNodeTypeLabel(payload: any | undefined): string | undefined {
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
function getMomentTaskSummary(payload: any | undefined): string | undefined {
    const tasks = Array.isArray(payload?.tasks) ? payload.tasks as any[] : [];
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
function getCardDescription(payload: any | undefined, maxLength = 52): string {
    const description = String(payload?.description ?? payload?.Description ?? '').trim();
    if (!description) return 'Description: None';

    return truncateText(description.replaceAll(/\s+/g, ' '), maxLength);
}

/**
 * Get the display label for a stride assignment in the graph.
 * @param {object} payload - The node payload containing an assignedStrideId.
 * @returns {string} The stride label (e.g. 'Stride: Backlog' or 'Stride # N').
 */
function getStrideLabel(payload: any | undefined): string {
    const id = payload?.assignedStrideId as string | undefined;
    if ([undefined, 'unassigned', ''].includes(id)) return 'Stride: Backlog';
    return `Stride # ${id}`;
}

/**
 * Get the full title text for a graph node (used in tooltips).
 * @param {object} nodeData - The node data.
 * @returns {string} The multi-line title string.
 */
function getNodeTitle(nodeData: any): string {
    const payload = (nodeData.payload ?? {}) as any;
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
export function getMomentStrideBucket(payload: any | undefined): string {
    const id = payload?.assignedStrideId as string | undefined;
    if ([undefined, 'unassigned', ''].includes(id)) return 'backlog';
    return String(id);
}

/**
 * Compute child count and completed child count from a list of children.
 * @param {object[]} children - The list of child entities.
 * @returns {{childCount: number, completedChildCount: number}} The computed metrics.
 */
export function computeChildMetrics(children: any[]): { childCount: number; completedChildCount: number } {
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
export function createNode(nodeType: string, payload: any, children: any[] = []) {
    const childCount = children.length;
    const completedChildCount = children.filter(child => getStatusBucket((child.payload as any | undefined)?.statusColor as string ?? child.statusColor as string) === 'done').length;

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
export function createNodeWithMetrics(nodeType: string, payload: any, childMetrics?: { childCount: number; completedChildCount: number } | null) {
    const enrichedPayload = { ...payload } as any;
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
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {string|undefined} The detail page URL, or undefined if node type has no route.
 */
function getNodeHref(node: any, owner: string, project: string): string | undefined {
    const routeSegment = (NODE_ROUTE_SEGMENTS as Record<string, string>)[node.nodeType as string];
    if (!routeSegment) return;

    const parameters = new URLSearchParams();
    parameters.set('graphFocus', node.id as string);

    const seq = (node.payload as any | undefined)?.sequenceNumber ?? (node.payload as any | undefined)?.id;
    return `${getAppBasePath()}/${routeSegment}/${seq}?${parameters.toString()}`;
}

/**
 * Get the searchable text content for a graph node (label + description).
 * @param {object} node - The graph node.
 * @returns {string} The normalized search text.
 */
export function getNodeSearchText(node: any): string {
    return (node._searchText as string) ?? normalizeText([
        node.label as string,
        (node.payload as any | undefined)?.description as string,
    ].join(' '));
}

/**
 * Recursively find a node in the graph tree by its ID.
 * @param {object} treeData - The tree root to search.
 * @param {string} nodeId - The node ID to find.
 * @returns {object|undefined} The matching node, or undefined if not found.
 */
export function findNodeById(treeData: any | undefined, nodeId: string | undefined): any | undefined {
    if (!treeData || !nodeId) return;

    if (treeData.id === nodeId) {
        return treeData;
    }

    const treeChildren = (treeData.children as any[]) ?? [];
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
export function countRenderableNodes(node: any | undefined): number {
    if (!node) return 0;

    const selfCount = node.nodeType === 'root' ? 0 : 1;
    let sum = selfCount;
    const children = (node.children as any[]) ?? [];
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
export function parseGraphData(rootPromises: any[], owner: string, project: string, projectEntity?: Record<string, unknown> | null) {
    const rawName = projectEntity?.name ?? projectEntity?.Name ?? '';
    const normalizedName = String(rawName).trim();
    const projectLabel = normalizedName || `Project ${owner}/${project}`;

    return {
        id: `root-${owner}-${project}`,
        nodeType: 'root',
        label: projectLabel,
        payload: {
            id: (projectEntity as any | undefined)?.id,
            name: projectLabel,
            description: (projectEntity as any | undefined)?.description ?? (projectEntity as any | undefined)?.Description,
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
function createFocusTransform(d3: any, viewportWidth: number, viewportHeight: number, node: { x: number; y: number } | undefined, contentOffsetX: number, contentOffsetY: number, scale = 1.5): any | undefined {
    if (!node) return;
    const targetScale = Math.max(0.5, Math.min(2.5, scale));
    const position = getRenderedNodePosition(node, contentOffsetX, contentOffsetY);

    return (d3.zoomIdentity as any)
        .translate(viewportWidth / 2, viewportHeight / 2)
        .scale(targetScale)
        .translate(-position.x, -position.y) as unknown as any;
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
 * @param {((event: MouseEvent | KeyboardEvent | Record<string, unknown>, data: any) => void) } options.onContextMenu - Context menu event handler.
 * @param {boolean} options.enableZoom - Whether zoom is enabled.
 * @param {boolean} [options.enableLinks] - Whether links are enabled.
 * @param {number } [options.uniformNodeScale] - Uniform node scale factor.
 * @param {boolean} [options.animate] - Whether to animate transitions.
 * @param {number} [options.animationSpeed] - Animation speed multiplier.
 */
function appendGraphNodes(d3: any, layer: any, renderable: any[], links: any[], options: {
    contentOffsetX: number;
    contentOffsetY: number;
    cardClipPathId: string;
    owner: string | null;
    project: string | null;
    focusNodeId: string | null;
    onContextMenu: ((event: MouseEvent | KeyboardEvent | Record<string, unknown>, data: any) => void) | null;
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
    const t = d3.transition().duration(duration);

    /**
     * Compute the final transform for a node in the animated transition.
     * @param {object} d - The D3 node data.
     * @returns {string} A CSS translate() string with the target position and scale.
     */
    function getFinalTransform(d: any): string {
        return `translate(${(d.y as number) + contentOffsetX}, ${(d.x as number) + contentOffsetY}) scale(${nodeScale})`;
    }

    /**
     * Compute the transform for a node at its parent position (used for exit animations).
     * @param {object} d - The D3 node data.
     * @returns {string} A CSS translate() string with the parent position and scale.
     */
    function getParentTransform(d: any): string {
        const parent = d.parent as any | undefined;
        const px = parent ? (parent.y as number) : 0;
        const py = parent ? (parent.x as number) : 0;
        return `translate(${px + contentOffsetX}, ${py + contentOffsetY}) scale(${nodeScale})`;
    }

    /**
     * Compute the SVG path for a link entering from the parent position.
     * @param {object} d - The D3 link data with source and target nodes.
     * @returns {string} An SVG path data string.
     */
    function getFinalLinkPath(d: any): string {
        return d3.linkHorizontal({
                source: {
                    x: (d.source as any).x as number + contentOffsetY,
                    y: (d.source as any).y as number + contentOffsetX + ((CARD_WIDTH / 2) * nodeScale),
                },
                target: {
                    x: (d.target as any).x as number + contentOffsetY,
                    y: (d.target as any).y as number + contentOffsetX - ((CARD_WIDTH / 2) * nodeScale),
                },
            });
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
        .data(links, (l: any) => `${(l.source as any).data!.id}->${(l.target as any).data!.id}` as unknown as string);

    linkBound.exit().transition(t)
        .attr('opacity', 0)
        .remove();

    linkBound.attr('opacity', 1)
        .attr('d', (d: any) => getFinalLinkPath(d));

    const linkEnter = linkBound.enter()
        .append('path')
        .attr('opacity', 0)
        .attr('d', (d: any) => getFinalLinkPath(d));

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
        .data(renderable, (d: any) => (d.data as any).id as string);

    nodeBound.exit()
        .transition(t)
        .attr('opacity', 0)
        .attr('transform', (d: any) => getParentTransform(d))
        .remove();

    const nodeEnter = nodeBound.enter()
        .append(containerTag)
        .attr('opacity', 0)
        .attr('transform', (d: any) => getParentTransform(d))
        .style('text-decoration', 'none');

    nodeEnter.append('title')
        .text((current: any) => getNodeTitle(current.data as any));

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
        .attr('fill', (current: any) => getNodeColor(current.data!.nodeType as string));

    nodeEnter.append('text')
        .attr('class', 'graph-card-statement')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('focusable', 'false')
        .text((current: any) => truncateText(current.data!.label as string, 36));

    nodeEnter.filter((current: any) => (current.data as any).nodeType !== 'moment' && (current.data as any).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--node-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .attr('focusable', 'false')
        .text((current: any) => getNodeTypeLabel(current.data!.payload as any) ?? '');

    nodeEnter.filter((current: any) => (current.data as any).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-status')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'hanging')
        .attr('focusable', 'false')
        .text((current: any) => getStatusIcon((current.data as any).payload!['statusColor' as keyof object] as string));

    nodeEnter.filter((current: any) => {
            const hiddenCount = Number.parseInt((current.data as any)._hiddenDescendantCount as string ?? '0', 10) || 0;
            return hiddenCount > 0 && Boolean((current.data as any)._isCollapsed);
        })
        .append('text')
        .attr('class', 'graph-card-collapsed-badge')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', CARD_HEIGHT / 2 - 12)
        .attr('text-anchor', 'end')
        .text((current: any) => {
            const hiddenCount = Number.parseInt((current.data as any)._hiddenDescendantCount as string ?? '0', 10) || 0;
            return `${hiddenCount} hidden`;
        });

    nodeEnter.filter((current: any) => (current.data as any).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text((current: any) => getNodeTypeLabel((current.data as any).payload as any) ?? '');

    nodeEnter.append('line')
        .attr('class', 'graph-card-divider')
        .attr('x1', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('x2', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y1', -CARD_HEIGHT / 2 + 42)
        .attr('y2', -CARD_HEIGHT / 2 + 42)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);

    nodeEnter.filter((current: any) => (current.data as any).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: any) => getStrideLabel((current.data as any).payload as any));

    nodeEnter.filter((current: any) => (current.data as any).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + DETAIL_LINE_GAP)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: any) => getCardDescription((current.data as any).payload as any, 52));

    nodeEnter.filter((current: any) => (current.data as any).nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 2))
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: any) => `Effort: ${formatEstimate((current.data as any).payload!['effortEstimate' as keyof object])}`);

    nodeEnter.filter((current: any) => (current.data as any).nodeType === 'moment' && getMomentTaskSummary((current.data as any).payload as any))
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-tasks')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 3))
        .attr('fill', '#0f766e')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text((current: any) => getMomentTaskSummary((current.data as any).payload as any));

    nodeEnter.filter((current: any) => (current.data as any).nodeType !== 'moment' && (current.data as any).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 62)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text((current: any) => getCardDescription((current.data as any).payload as any));

    nodeEnter.filter((current: any) => (current.data as any).nodeType !== 'moment' && (current.data as any).nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 88)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('dominant-baseline', 'middle')
        .text((current: any) => getChildProgressSummary(current.data as any) ?? 'No child cards');

    const node = nodeEnter.merge(nodeBound);

    node.select('title').text((current: any) => getNodeTitle(current.data as any));
    node.select('text.graph-card-statement').text((current: any) => truncateText((current.data as any).label as string, 36));
    node.select('rect.graph-card-accent').attr('fill', (current: any) => getNodeColor((current.data as any).nodeType as string));
    node.select('text.graph-card-status').text((current: any) => getStatusIcon(((current.data as any).payload as any)?.statusColor as string));

    (node.each as (isFilterMatch: (d: any, index: number, nodes: unknown[]) => void) => void)(function (current: any, _index: number, nodes: unknown[]) {
        const currentNode = nodes[_index] as Element;
        const badge = d3.select(currentNode).select('text.graph-card-collapsed-badge');
        const hiddenCount = Number.parseInt((current.data as any)._hiddenDescendantCount as string ?? '0', 10) || 0;
        const shouldShowBadge = hiddenCount > 0 && Boolean((current.data as any)._isCollapsed);

        if (shouldShowBadge) {
            if (badge.empty()) {
                d3.select(currentNode).append('text')
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
        node.attr('href', (current: any) => getNodeHref(current.data as any, owner as string, project as string))
            .attr('xlink:href', (current: any) => getNodeHref(current.data as any, owner as string, project as string))
            .attr('data-nav', '');
    }

    node.style('text-decoration', 'none')
        .style('--graph-card-bg', '#ffffff')
        .style('--graph-accent', (current: any) => getNodeColor((current.data as any).nodeType as string))
        .style('--graph-stroke', (current: any) => {
            const isFocused = focusNodeId !== null && (current.data as any).id === focusNodeId;
            const isAllowFocusHighlight = (current.data as any).nodeType !== 'root';
            if ((current.data as any)._searchMatched || (isFocused && isAllowFocusHighlight)) return '#d4af37';
            return (current as any).depth === 0 ? getNodeColor((current.data as any).nodeType as string) : '#cbd5e1';
        })
        .style('--graph-stroke-width', (current: any) => {
            const isFocused = focusNodeId !== null && (current.data as any).id === focusNodeId;
            const isAllowFocusHighlight = (current.data as any).nodeType !== 'root';
            if ((current.data as any)._searchMatched || (isFocused && isAllowFocusHighlight)) return 3;
            return (current as any).depth === 0 ? 2.5 : 1.5;
        })
        .classed('graph-node', true)
        .classed('is-root', (current: any) => (current.data as any).nodeType === 'root')
        .classed('is-moment', (current: any) => (current.data as any).nodeType === 'moment')
        .classed('is-collapsed', (current: any) => Boolean((current.data as any)._isCollapsed))
        .classed('is-search-matched', (current: any) => Boolean((current.data as any)._searchMatched))
        .classed('is-focused', (current: any) => (focusNodeId !== null && (current.data as any).id === focusNodeId))
        .attr('tabindex', (current: any) => {
            if ((current.data as any).nodeType === 'root') return;
            return isEnableZoom ? 0 : -1;
        })
        .attr('role', (current: any) => (isEnableZoom && (current.data as any).nodeType !== 'root') ? 'treeitem' : undefined)
        .attr('aria-label', (current: any) => (isEnableZoom && (current.data as any).nodeType !== 'root') ? (getNodeTitle(current.data as any) || 'Graph node') : undefined);

    if (onContextMenu) {
        (node.on as any)('contextmenu', (event: MouseEvent, current: any) => {
            event.preventDefault();
            onContextMenu        });

        (node.on as any)('keydown', (event: KeyboardEvent, current: any) => {
            if (!['Enter', ' ', 'Space'].includes(event.key)) return;

            event.preventDefault();
            onContextMenu        });
    }

    nodeBound.attr('opacity', 1)
        .attr('transform', (d: any) => getFinalTransform(d));

    if (isAnimate) {
        nodeEnter.transition(t)
            .attr('opacity', 1)
            .attr('transform', (d: any) => getFinalTransform(d));
    } else {
        nodeEnter.attr('opacity', 1)
            .attr('transform', (d: any) => getFinalTransform(d));
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
function computeGraphLayout(isCompact: boolean, viewportWidth: number, viewportHeight: number, margin: any, maxDepth: number, treeData: any, uniformNodeScale = 1) {
    let sgx = isCompact ? COMPACT_STEP_GAP_X : STEP_GAP_X;
    let sgy = isCompact ? COMPACT_STEP_GAP_Y : STEP_GAP_Y;
    let fg = isCompact ? COMPACT_FOREHEAD_GAP : FOREHEAD_GAP;
    let cs = uniformNodeScale;
    if (isCompact) {
        const vc = countRenderableNodes(treeData);
        const p = getCompactLayoutProfile(vc, viewportWidth, viewportHeight);
        cs = p.nodeScale ?? cs; sgy = p.minGapY ?? sgy; fg = p.forehead ?? fg;
        if (maxDepth > 0 && viewportWidth > 0) sgx = Math.max(Math.max(viewportWidth - margin.left - margin.right - CARD_WIDTH * cs, CARD_WIDTH) / maxDepth, p.minGapX ?? COMPACT_MIN_TIER_GAP);
        if (maxDepth > 0 && viewportHeight > 0) sgy = Math.max(Math.floor(Math.max(viewportHeight - margin.top - margin.bottom - CARD_HEIGHT * cs - fg, CARD_HEIGHT) / Math.max(1, maxDepth)), COMPACT_MIN_TIER_GAP_Y);
    }
    return { stepGapX: sgx, stepGapY: sgy, foreheadGap: fg, cardScale: cs };
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
    d3: any,
    renderable: any[],
    cardScale: number,
    margin: { top: number; right: number; bottom: number; left: number },
    viewportWidth: number,
    viewportHeight: number,
    foreheadGap: number,
    isCompact: boolean,
    minGraphWidth: number | null,
    minGraphHeight: number | null,
): { minX: number; maxX: number; minY: number; maxY: number; graphWidth: number; graphHeight: number } {
    const scaledCardWidth = CARD_WIDTH * cardScale;
    const scaledCardHeight = CARD_HEIGHT * cardScale;
    const minX = d3.min(renderable, (node: any) => (node.x as number) - (scaledCardHeight / 2)) ?? -(scaledCardHeight / 2);
    const maxX = d3.max(renderable, (node: any) => (node.x as number) + (scaledCardHeight / 2)) ?? (scaledCardHeight / 2);
    const minY = d3.min(renderable, (node: any) => (node.y as number) - (scaledCardWidth / 2)) ?? -(scaledCardWidth / 2);
    const maxY = d3.max(renderable, (node: any) => (node.y as number) + (scaledCardWidth / 2)) ?? (scaledCardWidth / 2);
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
    d3: any,
    contentDiv: HTMLElement,
    existingSvgElement: SVGElement | undefined,
    graphWidth: number,
    graphHeight: number,
    isCompact: boolean,
    viewportHeight: number,
    isZoomEnabled: boolean,
    ariaLabel: string,
    cardClipPathId: string,
): any {
    let svg: any;
    if (existingSvgElement) {
        svg = d3.select(existingSvgElement);
        svg.attr('viewBox', [0, 0, graphWidth, graphHeight])
           .attr('height', isCompact ? '100%' : Math.max(graphHeight, viewportHeight || 0));
        svg.select('defs').remove();
    } else {
        contentDiv.replaceChildren();
        svg = d3.create('svg')
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
    root: any,
    focusNodeData: any | undefined,
    resolvedFocusNodeId: string | undefined,
): any | undefined {
    if (focusNodeData) {
        const byIdentity = root.descendants().find(node => node.data === focusNodeData);
        if (byIdentity) return byIdentity;
    }

    if (!resolvedFocusNodeId) return;
    return root.descendants().find(node => (node.data as any | undefined)?.id === resolvedFocusNodeId);
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
    d3: any,
    focusedHierarchyNode: any | undefined,
    viewportWidth: number,
    viewportHeight: number,
    contentOffsetX: number,
    contentOffsetY: number,
    cardScale: number,
    graphWidth: number,
    graphHeight: number,
    initialScale: number,
    existingSvgElement: SVGElement | undefined,
    svg: any,
    restoreTransform: any | undefined,
): { focusTransform: any | undefined; fitTransform: any; initialTransform: any; mode: string } {
    const focusTransform = focusedHierarchyNode
        ? createFocusTransform(d3, viewportWidth, viewportHeight, focusedHierarchyNode as unknown as { x: number; y: number }, contentOffsetX, contentOffsetY, cardScale)
        : undefined;
    const fitTransform = ((d3.zoomIdentity as any).translate as (x: number, y: number) => any)(
            viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
            viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0,
        )
        .scale(initialScale);
    const initialTransform = existingSvgElement
        ? d3.zoomTransform(svg.node() as Element)
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
 * @param {object | undefined} focusedHierarchyNode - The focused hierarchy node.
 * @param {HTMLElement} viewportElement - The viewport element.
 * @param {number} contentOffsetX - The X content offset.
 * @param {number} contentOffsetY - The Y content offset.
 * @param {number} cardScale - The card scale factor.
 * @param {SVGElement | undefined} existingSvgElement - An existing SVG element.
 * @returns {void}
 */
function scheduleFocusRefinement(
    d3: any,
    svg: any,
    zoom: any,
    focusedHierarchyNode: any | undefined,
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

        if (measuredWidth <= 1 || measuredHeight <= 1) {
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

        svg.call(zoom.transform as any, refinedTransform);
    });
}

/**
 * Render the graph without zoom interactions (compact/detail mode), centering nodes in the viewport.
 * @param {object} d3 - The D3 module instance.
 * @param {object} graphLayer - The D3 selection of the graph layer.
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
    d3: any,
    graphLayer: any,
    renderable: any[],
    viewportWidth: number,
    viewportHeight: number,
    graphWidth: number,
    graphHeight: number,
    contentOffsetX: number,
    contentOffsetY: number,
    isCompact: boolean,
    cardScale: number,
): any {
    const initialScale = Math.min(
        viewportWidth > 0 ? viewportWidth / graphWidth : 1,
        viewportHeight > 0 ? viewportHeight / graphHeight : 1,
        1,
    );

    let fitTransform = ((d3.zoomIdentity as any).translate as (x: number, y: number) => any)(
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

            fitTransform = ((d3.zoomIdentity as any).translate as (x: number, y: number) => any)(viewportWidth / 2, viewportHeight / 2)
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
    focusedHierarchyNode: any | undefined,
    resolvedFocusNodeId: string | undefined,
    focusNodeData: any | undefined,
    renderableCount: number,
): void {
    if (focusedHierarchyNode) {
        logGraphFocus('focus-node-resolved', {
            resolvedFocusNodeId,
            hierarchyX: focusedHierarchyNode.x,
            hierarchyY: focusedHierarchyNode.y,
            dataId: (focusedHierarchyNode.data as any | undefined)?.id,
            nodeType: (focusedHierarchyNode.data as any | undefined)?.nodeType,
            label: (focusedHierarchyNode.data as any | undefined)?.label,
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
    svg: any,
    graphLayer: any,
    resolvedFocusNodeId: string | undefined,
    viewportElement: HTMLElement,
): void {
    if (!isGraphFocusDebugEnabled()) return;

    const focusElement = contentDiv.querySelector(':scope .graph-node.is-focused .graph-card');
    const viewportRect = (viewportElement as HTMLElement)?.getBoundingClientRect?.();
    const focusRect = (focusElement as Element | null)?.getBoundingClientRect?.();
    const zoomTransform = (svg.node() as any | null)?.__zoom;

    logGraphFocus('post-render-transform-state', {
        resolvedFocusNodeId,
        layerTransform: graphLayer.attr('transform'),
        svgZoomTransform: zoomTransform ? {
            x: (zoomTransform as any).x,
            y: (zoomTransform as any).y,
            k: (zoomTransform as any).k,
        } : undefined,
        svgViewBox: svg.attr('viewBox'),
        svgSize: {
            width: svg.attr('width'),
            height: svg.attr('height'),
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
export function renderStackGraph(contentDiv: HTMLElement | undefined, d3: any, treeData: any, options: any = {}): { node: SVGElement | null; zoom: any | null } | null | undefined {
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
    const { existingSvgElement, isAnimating } = resolveAnimationOptions(contentDiv, animate);

    const margin = compact
        ? { top: 12, right: 20, bottom: 12, left: 20 }
        : { top: 32, right: 48, bottom: 32, left: 48 };

    const root = d3.hierarchy(treeData);
    const maxDepth = (root.height as number) ?? 0;
    const viewportElement_ = (viewportElement as HTMLElement) || contentDiv;
    const viewportSize = getInnerViewportSize(viewportElement_);
    const viewportWidth = viewportSize.width || contentDiv.clientWidth || 0;
    const viewportHeight = viewportSize.height || contentDiv.clientHeight || 0;

    const layout = computeGraphLayout(compact, viewportWidth, viewportHeight, margin, maxDepth, treeData, uniformNodeScale as number ?? 1);
    const { stepGapX, stepGapY, foreheadGap, cardScale } = layout;

    const treeLayout = d3.tree().nodeSize([stepGapY, stepGapX]);
    (treeLayout as (root: any) => void)(root);

    const descendants = root.descendants();
    const renderable = descendants.filter(node => renderRootCard || (node.data as any | undefined)?.nodeType !== 'root');

    if (renderable.length === 0) {
        renderEmptyState(contentDiv, emptyMessage as string);
        return;
    }

    const links = root.links().filter(l => {
        if (renderRootCard) return true;
        return (l.source as any | undefined)?.data?.nodeType !== 'root' && (l.target as any | undefined)?.data?.nodeType !== 'root';
    });
    const resolvedFocusNodeId = (focusNodeId as string) ?? (focusNodeData as any | null)?.id;
    const { minX, maxX, minY, maxY, graphWidth, graphHeight } = computeGraphDimensions(d3, renderable, cardScale, margin, viewportWidth, viewportHeight, foreheadGap, compact, minGraphWidth as number | null, minGraphHeight as number | null);

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

    const svg = setupSvgContainer(d3, contentDiv, existingSvgElement, graphWidth, graphHeight, compact, viewportHeight, enableZoom, ariaLabel as string, cardClipPathId);

    const graphLayer: any = existingSvgElement ? svg.select('g') : svg.append('g');
    let focusedHierarchyNode: any | undefined;
    const nodeOptions = {
        contentOffsetX,
        contentOffsetY,
        cardClipPathId,
        owner,
        project,
        focusNodeId: resolvedFocusNodeId,
        onContextMenu,
        enableZoom,
        enableLinks: (enableLinks as boolean | undefined) ?? enableZoom,
        uniformNodeScale: compact ? cardScale : undefined,
        animate: isAnimating,
        animationSpeed,
    };

    let zoom: any | undefined;
    if (enableZoom) {
        const zoomLayer = graphLayer;
        const safeViewportWidth = Math.max(viewportWidth, 1);
        const safeViewportHeight = Math.max(viewportHeight, 1);

        zoom = d3.zoom()
            .scaleExtent([0.5, 2.5])
            .extent([[0, 0], [safeViewportWidth, safeViewportHeight]])
            .translateExtent([
                [-safeViewportWidth, -safeViewportHeight],
                [graphWidth + safeViewportWidth, graphHeight + safeViewportHeight],
            ])
            .on('zoom', (event: any) => {
                zoomLayer.attr('transform', (event as any).transform);
                (onZoom as ((transform: any, meta: any) => void) | null)?.(event.transform as any, { user: Boolean((event as any).sourceEvent) });
            });

        svg.call(zoom);
        svg.on('dblclick.zoom', undefined);

        const initialScale = computeFitScale(viewportWidth, viewportHeight, graphWidth, graphHeight);
        focusedHierarchyNode = findFocusedHierarchyNode(root, focusNodeData as any | undefined, resolvedFocusNodeId);

        logFocusNodeStatus(focusedHierarchyNode, resolvedFocusNodeId, focusNodeData as any | undefined, renderable.length);

        const { initialTransform } = computeInitialTransforms(d3, focusedHierarchyNode, viewportWidth, viewportHeight, contentOffsetX, contentOffsetY, cardScale, graphWidth, graphHeight, initialScale, existingSvgElement, svg, restoreTransform as any | undefined);

        svg.call(zoom.transform as any, initialTransform);

        scheduleFocusRefinement(d3, svg, zoom, focusedHierarchyNode, viewportElement_, contentOffsetX, contentOffsetY, cardScale, existingSvgElement);

        appendGraphNodes(d3, zoomLayer, renderable, links, nodeOptions);
    } else {
        const fitTransform = renderGraphWithoutZoom(d3, graphLayer, renderable, viewportWidth, viewportHeight, graphWidth, graphHeight, contentOffsetX, contentOffsetY, compact, cardScale);
        graphLayer.attr('transform', fitTransform);
        appendGraphNodes(d3, graphLayer, renderable, links, nodeOptions);
    }

    if (!existingSvgElement) {
        contentDiv.append(svg.node() as Node);
    }

    if (focusedHierarchyNode) {
        logPostRenderFocusDebug(contentDiv, svg, graphLayer, resolvedFocusNodeId, viewportElement_);
    }

    return {
        node: svg.node() as SVGElement,
        zoom: svg.node() && enableZoom ? zoom : undefined,
    };
}

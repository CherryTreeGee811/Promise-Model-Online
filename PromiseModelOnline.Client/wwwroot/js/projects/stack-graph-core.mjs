import { getStatusIcon, getStatusBucket } from '../utils/status-utils.mjs';
export { getStatusIcon, getStatusBucket };

export const STEP_GAP_X = 360;
export const STEP_GAP_Y = 190;
export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 144;
export const CARD_RADIUS = 18;
export const CARD_PADDING_X = 16;
export const CARD_PADDING_TOP = 16;
export const DETAIL_START_Y = 62;
export const DETAIL_LINE_GAP = 22;
export const FOREHEAD_GAP = 88;

export const COMPACT_STEP_GAP_X = 400;
export const COMPACT_STEP_GAP_Y = 180;
export const COMPACT_MIN_TIER_GAP_Y = 72;
export const COMPACT_FOREHEAD_GAP = 40;
export const COMPACT_MIN_TIER_GAP = 140;
/** Largest cards when the detail page shows the fewest tiers (promise). */
export const COMPACT_DETAIL_SCALE_MAX = 1.32;
/** Smallest cards when the detail page shows the most tiers (moment). */
export const COMPACT_DETAIL_SCALE_MIN = 0.84;

export const NODE_TYPES = ['promise', 'epic', 'journey', 'flow', 'moment'];
export const NODE_ROUTE_SEGMENTS = {
    promise: 'promises',
    epic: 'epics',
    journey: 'journeys',
    flow: 'flows',
    moment: 'moments',
};
export const NODE_TYPE_INDEX = new Map(NODE_TYPES.map((type, index) => [type, index]));

/**
 * Normalize text for display in graph nodes.
 * @param {*} text - TODO
 */
export function normalizeText(value) {
    return String(value ?? '').trim().toLowerCase();
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

/**
 * Get the inner viewport dimensions for graph rendering.
 */
export function getInnerViewportSize(element) {
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

/**
 * Truncate text to a maximum length with ellipsis.
 * @param {*} text - TODO
 * @param {*} maxLen - TODO
 */
export function truncateText(text, maxLength = 40) {
    const value = String(text ?? '').trim();
    if (value.length <= maxLength) return value;
    if (maxLength <= 3) return '.'.repeat(maxLength);
    return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

/**
 * Format an effort estimate value for display.
 * @param {*} estimate - TODO
 */
export function formatEstimate(value) {
    return value == null ? 'Unestimated' : String(value);
}

export function getChildTypeLabel(nodeType) {
    switch (nodeType) {
        case 'promise': return 'Epic';
        case 'epic': return 'Journey';
        case 'journey': return 'Flow';
        case 'flow': return 'Moment';
        default: return null;
    }
}

/**
 * Get a summary of completed vs total child nodes.
 * @param {*} node - TODO
 */
export function getChildProgressSummary(nodeData) {
    const childLabel = getChildTypeLabel(nodeData.nodeType);
    const childCount = nodeData.childCount ?? 0;
    const completedCount = nodeData.completedChildCount ?? 0;

    if (!childLabel) return null;

    return `${completedCount}/${childCount} ${childCount === 1 ? childLabel : `${childLabel}s`} completed`;
}

/**
 * Get the human-readable label for a node type.
 * @param {*} nodeType - TODO
 */
export function getNodeTypeLabel(payload) {
    const value = String(payload?.type ?? payload?.Type ?? '').trim();
    if (!value) return null;

    const normalized = value.toLowerCase();
    if (normalized === 'story') return 'Story';
    if (normalized === 'job') return 'Job';

    return value;
}

/**
 * Get a summary of completed tasks within a moment node.
 * @param {*} node - TODO
 */
export function getMomentTaskSummary(payload) {
    const tasks = Array.isArray(payload?.tasks) ? payload.tasks : [];
    if (tasks.length === 0) return null;

    const completedCount = tasks.filter(task => Boolean(task?.isCompleted ?? task?.IsCompleted)).length;
    return `Tasks: ${completedCount}/${tasks.length} complete`;
}

/**
 * Get the card description for a graph node.
 * @param {*} node - TODO
 */
export function getCardDescription(payload, maxLength = 52) {
    const description = String(payload?.description ?? payload?.Description ?? '').trim();
    if (!description) return 'Description: None';

    return truncateText(description.replace(/\s+/g, ' '), maxLength);
}

/**
 * Get the display label for a stride in the graph.
 * @param {*} stride - TODO
 */
export function getStrideLabel(payload) {
    const id = payload?.assignedStrideId;
    if (id == null || id === 'unassigned' || id === '') return 'Stride: Backlog';
    return `Stride # ${id}`;
}

export function getNodeTitle(nodeData) {
    const payload = nodeData.payload ?? {};
    const lines = [payload.statement ?? payload.name ?? `#${payload.id}`];

    if (nodeData.nodeType === 'moment') {
        lines.push(getStrideLabel(payload));
        if (payload.description) lines.push(truncateText(payload.description, 40));
        lines.push(`Effort: ${formatEstimate(payload.effortEstimate)}`);
        const taskSummary = getMomentTaskSummary(payload);
        if (taskSummary) lines.push(taskSummary);
    }

    return lines.join('\n');
}

/**
 * Sort items by their display order property.
 * @param {*} items - TODO
 */
export function sortByDisplayOrder(items) {
    return [...items].sort((left, right) => {
        const orderDelta = (left.displayOrder ?? 0) - (right.displayOrder ?? 0);
        if (orderDelta !== 0) return orderDelta;
        return String(left.statement ?? '').localeCompare(String(right.statement ?? ''));
    });
}

/**
 * Categorize an effort estimate into a bucket for graph coloring.
 * @param {*} effort - TODO
 */
export function getMomentEffortBucket(effortEstimate) {
    if (effortEstimate == null) return 'unestimated';

    const normalized = normalizeText(effortEstimate);
    const allowed = new Set(['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']);
    return allowed.has(normalized) ? normalized.toUpperCase() : 'unestimated';
}

/**
 * Categorize a moment by stride assignment status.
 * @param {*} moment - TODO
 */
export function getMomentStrideBucket(payload) {
    const id = payload?.assignedStrideId;
    if (id == null || id === 'unassigned' || id === '') return 'backlog';
    return String(id);
}

export function computeChildMetrics(children) {
    const list = Array.isArray(children) ? children : [];
    const childCount = list.length;
    const completedChildCount = list.filter(child => getStatusBucket(child?.statusColor) === 'done').length;
    return { childCount, completedChildCount };
}

/**
 * Create a new graph node with the given properties.
 * @param {*} type - TODO
 * @param {*} label - TODO
 * @param {*} data - TODO
 */
export function createNode(nodeType, payload, children = []) {
    const childCount = children.length;
    const completedChildCount = children.filter(child => getStatusBucket(child.payload?.statusColor ?? child.statusColor) === 'done').length;

    const label = payload.statement ?? payload.name ?? `#${payload.id}`;
    const searchText = normalizeText([
        label,
        payload.description,
    ].join(' '));

    const statusBucket = getStatusBucket(payload?.statusColor);
    const effortBucket = nodeType === 'moment' ? getMomentEffortBucket(payload?.effortEstimate) : null;
    const strideBucket = nodeType === 'moment' ? getMomentStrideBucket(payload) : null;

    return {
        id: `${nodeType}-${payload.sequenceNumber ?? payload.id}`,
        nodeType,
        label,
        payload,
        childCount: payload._childCount ?? childCount,
        completedChildCount: payload._completedChildCount ?? completedChildCount,
        children,
        _searchText: searchText,
        _statusBucket: statusBucket,
        _effortBucket: effortBucket,
        _strideBucket: strideBucket,
    };
}

/**
 * Create a graph node pre-populated with metric calculations.
 * @param {*} type - TODO
 * @param {*} data - TODO
 */
export function createNodeWithMetrics(nodeType, payload, childMetrics = null) {
    const enrichedPayload = { ...payload };
    if (childMetrics) {
        enrichedPayload._childCount = childMetrics.childCount;
        enrichedPayload._completedChildCount = childMetrics.completedChildCount;
    }
    return createNode(nodeType, enrichedPayload, []);
}

/**
 * Get the display color for a graph node based on status.
 * @param {*} node - TODO
 */
export function getNodeColor(nodeType) {
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

/**
 * Get the application base URL path.
 */
export function getAppBasePath() {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
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
 * Get the navigation URL for a graph node.
 * @param {*} node - TODO
 */
export function getNodeHref(node, owner, project) {
    const routeSegment = NODE_ROUTE_SEGMENTS[node.nodeType];
    if (!routeSegment) return null;

    const params = new URLSearchParams();
    params.set('graphFocus', node.id);

    const seq = node.payload?.sequenceNumber ?? node.payload?.id;
    return `${getAppBasePath()}/${routeSegment}/${seq}?${params.toString()}`;
}

/**
 * Get the searchable text content for a graph node.
 * @param {*} node - TODO
 */
export function getNodeSearchText(node) {
    return node._searchText ?? normalizeText([
        node.label,
        node.payload?.description,
    ].join(' '));
}

export function findNodeById(treeData, nodeId) {
    if (!treeData || !nodeId) return null;

    if (treeData.id === nodeId) {
        return treeData;
    }

    for (const child of treeData.children ?? []) {
        const match = findNodeById(child, nodeId);
        if (match) {
            return match;
        }
    }

    return null;
}

/**
 * Count the number of renderable nodes in the graph tree.
 * @param {*} nodes - TODO
 */
export function countRenderableNodes(node) {
    if (!node) return 0;

    const selfCount = node.nodeType === 'root' ? 0 : 1;
    return selfCount + (node.children ?? []).reduce((sum, child) => sum + countRenderableNodes(child), 0);
}

/**
 * Parse raw graph data into a structured tree format.
 * @param {*} data - TODO
 */
export function parseGraphData(rootPromises, owner, project, projectEntity = null) {
    const rawName = projectEntity?.name ?? projectEntity?.Name ?? '';
    const normalizedName = String(rawName).trim();
    const projectLabel = normalizedName || `Project ${owner}/${project}`;

    return {
        id: `root-${owner}-${project}`,
        nodeType: 'root',
        label: projectLabel,
        payload: {
            id: projectEntity?.id ?? null,
            name: projectLabel,
            description: projectEntity?.description ?? projectEntity?.Description ?? null,
        },
        children: rootPromises,
    };
}

/**
 * Render an empty state for a graph container.
 * @param {*} container - TODO
 */
export function renderEmptyState(contentDiv, message) {
    if (!contentDiv) return;
    contentDiv.replaceChildren();

    const emptyState = document.createElement('div');
    emptyState.className = 'graph-empty-state';
    emptyState.textContent = message;
    contentDiv.appendChild(emptyState);
}

function getRenderedNodePosition(node, contentOffsetX, contentOffsetY) {
    return {
        x: node.y + contentOffsetX,
        y: node.x + contentOffsetY,
    };
}

function createFocusTransform(d3, viewportWidth, viewportHeight, node, contentOffsetX, contentOffsetY, scale = 1.5) {
    if (!node) return null;
    const targetScale = Math.max(0.5, Math.min(2.5, scale));
    const position = getRenderedNodePosition(node, contentOffsetX, contentOffsetY);

    return d3.zoomIdentity
        .translate(viewportWidth / 2, viewportHeight / 2)
        .scale(targetScale)
        .translate(-position.x, -position.y);
}

function getCompactLayoutProfile(visibleCount, viewportWidth, viewportHeight) {
    // Explicit presets tuned for the detail pages (1..5 visible cards)
    // Provide nodeScale and suggested min gaps; fall back to defaults if out of range.
    const presets = {
        // Promise detail
        1: { nodeScale: 1.10, minGapX: 340, minGapY: 100, forehead: COMPACT_FOREHEAD_GAP, anchorOffsetX: -10, anchorOffsetY: -8 },
        // Epic detail
        2: { nodeScale: 1.10, minGapX: 340, minGapY: 100, forehead: COMPACT_FOREHEAD_GAP, anchorOffsetX: -20, anchorOffsetY: 0 },
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
 */
export function getDetailPageNodeScale(activeDetailNodeType) {
    const index = NODE_TYPES.indexOf(activeDetailNodeType);
    if (index < 0) return 1;

    const tiersShown = index + 2;
    const minTiers = 2;
    const maxTiers = NODE_TYPES.length + 1;
    const t = (tiersShown - minTiers) / (maxTiers - minTiers);

    return COMPACT_DETAIL_SCALE_MAX - t * (COMPACT_DETAIL_SCALE_MAX - COMPACT_DETAIL_SCALE_MIN);
}

function appendGraphNodes(d3, layer, renderable, links, options) {
    const {
        contentOffsetX,
        contentOffsetY,
        cardClipPathId,
        owner,
        project,
        focusNodeId,
        onContextMenu,
        enableZoom,
        enableLinks = enableZoom,
        uniformNodeScale = null,
        animate = false,
        animationSpeed = 1,
    } = options;

    const nodeScale = uniformNodeScale ?? 1;
    const containerTag = enableLinks ? 'a' : 'g';
    const duration = Math.max(0, Math.round(200 / Math.max(0.1, animationSpeed)));
    const t = d3.transition().duration(duration);

    function getFinalTransform(d) {
        return `translate(${d.y + contentOffsetX}, ${d.x + contentOffsetY}) scale(${nodeScale})`;
    }

    function getParentTransform(d) {
        const parent = d.parent;
        const px = parent ? parent.y : 0;
        const py = parent ? parent.x : 0;
        return `translate(${px + contentOffsetX}, ${py + contentOffsetY}) scale(${nodeScale})`;
    }

    function getFinalLinkPath(d) {
        return d3.linkHorizontal()
            .x(point => point.y)
            .y(point => point.x)({
                source: {
                    x: d.source.x + contentOffsetY,
                    y: d.source.y + contentOffsetX + ((CARD_WIDTH / 2) * nodeScale),
                },
                target: {
                    x: d.target.x + contentOffsetY,
                    y: d.target.y + contentOffsetX - ((CARD_WIDTH / 2) * nodeScale),
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
        .data(links, l => `${l.source.data.id}->${l.target.data.id}`);

    linkBound.exit().transition(t)
        .attr('opacity', 0)
        .remove();

    linkBound.attr('opacity', 1)
        .attr('d', d => getFinalLinkPath(d));

    const linkEnter = linkBound.enter()
        .append('path')
        .attr('opacity', 0)
        .attr('d', d => getFinalLinkPath(d));

    if (animate) {
        linkEnter.transition(t).attr('opacity', 1);
    } else {
        linkEnter.attr('opacity', 1);
    }

    // --- Node cards ---
    const nodeGroup = layer.select('g.nodes').size()
        ? layer.select('g.nodes')
        : layer.append('g').attr('class', 'nodes');

    const nodeBound = nodeGroup.selectAll(containerTag)
        .data(renderable, d => d.data.id);

    nodeBound.exit()
        .transition(t)
        .attr('opacity', 0)
        .attr('transform', d => getParentTransform(d))
        .remove();

    const nodeEnter = nodeBound.enter()
        .append(containerTag)
        .attr('opacity', 0)
        .attr('transform', d => getParentTransform(d))
        .style('text-decoration', 'none');

    nodeEnter.append('title')
        .text(current => getNodeTitle(current.data));

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
        .attr('fill', current => getNodeColor(current.data.nodeType));

    nodeEnter.append('text')
        .attr('class', 'graph-card-statement')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('focusable', 'false')
        .text(current => truncateText(current.data.label, 36));

    nodeEnter.filter(current => current.data.nodeType !== 'moment' && current.data.nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--node-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .attr('focusable', 'false')
        .text(current => getNodeTypeLabel(current.data.payload) ?? '');

    nodeEnter.filter(current => current.data.nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-status')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + CARD_PADDING_TOP)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'hanging')
        .attr('focusable', 'false')
        .text(current => getStatusIcon(current.data.payload?.statusColor));

    nodeEnter.filter(current => {
            const hiddenCount = Number.parseInt(current.data._hiddenDescendantCount ?? 0, 10) || 0;
            return hiddenCount > 0 && Boolean(current.data._isCollapsed);
        })
        .append('text')
        .attr('class', 'graph-card-collapsed-badge')
        .attr('x', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y', CARD_HEIGHT / 2 - 12)
        .attr('text-anchor', 'end')
        .text(current => {
            const hiddenCount = Number.parseInt(current.data._hiddenDescendantCount ?? 0, 10) || 0;
            return `${hiddenCount} hidden`;
        });

    nodeEnter.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text(current => getNodeTypeLabel(current.data.payload) ?? '');

    nodeEnter.append('line')
        .attr('class', 'graph-card-divider')
        .attr('x1', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('x2', CARD_WIDTH / 2 - CARD_PADDING_X)
        .attr('y1', -CARD_HEIGHT / 2 + 42)
        .attr('y2', -CARD_HEIGHT / 2 + 42)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);

    nodeEnter.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => getStrideLabel(current.data.payload));

    nodeEnter.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + DETAIL_LINE_GAP)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => getCardDescription(current.data.payload, 52));

    nodeEnter.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 2))
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => `Effort: ${formatEstimate(current.data.payload?.effortEstimate)}`);

    nodeEnter.filter(current => current.data.nodeType === 'moment' && getMomentTaskSummary(current.data.payload))
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-tasks')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 3))
        .attr('fill', '#0f766e')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text(current => getMomentTaskSummary(current.data.payload));

    nodeEnter.filter(current => current.data.nodeType !== 'moment' && current.data.nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 62)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => getCardDescription(current.data.payload));

    nodeEnter.filter(current => current.data.nodeType !== 'moment' && current.data.nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 88)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('dominant-baseline', 'middle')
        .text(current => getChildProgressSummary(current.data) ?? 'No child cards');

    const node = nodeEnter.merge(nodeBound);

    node.select('title').text(current => getNodeTitle(current.data));
    node.select('text.graph-card-statement').text(current => truncateText(current.data.label, 36));
    node.select('rect.graph-card-accent').attr('fill', current => getNodeColor(current.data.nodeType));
    node.select('text.graph-card-status').text(current => getStatusIcon(current.data.payload?.statusColor));

    node.each(function (current) {
        const badge = d3.select(this).select('text.graph-card-collapsed-badge');
        const hiddenCount = Number.parseInt(current.data._hiddenDescendantCount ?? 0, 10) || 0;
        const shouldShowBadge = hiddenCount > 0 && Boolean(current.data._isCollapsed);

        if (shouldShowBadge) {
            if (badge.empty()) {
                d3.select(this).append('text')
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

    if (enableLinks) {
        node
            .attr('href', current => getNodeHref(current.data, owner, project))
            .attr('xlink:href', current => getNodeHref(current.data, owner, project))
            .attr('data-nav', '');
    }

    node.style('text-decoration', 'none')
        .style('--graph-card-bg', '#ffffff')
        .style('--graph-accent', current => getNodeColor(current.data.nodeType))
        .style('--graph-stroke', current => {
            const isFocused = focusNodeId != null && current.data.id === focusNodeId;
            const allowFocusHighlight = current.data.nodeType !== 'root';
            if (current.data._searchMatched || (isFocused && allowFocusHighlight)) return '#d4af37';
            return current.depth === 0 ? getNodeColor(current.data.nodeType) : '#cbd5e1';
        })
        .style('--graph-stroke-width', current => {
            const isFocused = focusNodeId != null && current.data.id === focusNodeId;
            const allowFocusHighlight = current.data.nodeType !== 'root';
            if (current.data._searchMatched || (isFocused && allowFocusHighlight)) return 3;
            return current.depth === 0 ? 2.5 : 1.5;
        })
        .classed('graph-node', true)
        .classed('is-root', current => current.data.nodeType === 'root')
        .classed('is-moment', current => current.data.nodeType === 'moment')
        .classed('is-collapsed', current => Boolean(current.data._isCollapsed))
        .classed('is-search-matched', current => Boolean(current.data._searchMatched))
        .classed('is-focused', current => (focusNodeId != null && current.data.id === focusNodeId))
        .attr('tabindex', current => {
            if (current.data.nodeType === 'root') return null;
            return enableZoom ? 0 : -1;
        })
        .attr('role', current => (enableZoom && current.data.nodeType !== 'root') ? 'treeitem' : null)
        .attr('aria-label', current => (enableZoom && current.data.nodeType !== 'root') ? (getNodeTitle(current.data) || 'Graph node') : null);

    if (onContextMenu) {
        node.on('contextmenu', (event, current) => {
            event.preventDefault();
            onContextMenu(event, current.data);
        });

        node.on('keydown', (event, current) => {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
                event.preventDefault();
                const rect = event.target?.getBoundingClientRect?.();
                const fakeEvent = { ...event, clientX: rect?.left ?? 0, clientY: rect?.bottom ?? 0 };
                onContextMenu(fakeEvent, current.data);
            }
        });
    }

    nodeBound.attr('opacity', 1)
        .attr('transform', d => getFinalTransform(d));

    if (animate) {
        nodeEnter.transition(t)
            .attr('opacity', 1)
            .attr('transform', d => getFinalTransform(d));
    } else {
        nodeEnter.attr('opacity', 1)
            .attr('transform', d => getFinalTransform(d));
    }
}

/**
 * Renders a promise stack tree into contentDiv.
 * @returns {SVGElement|null} the root svg element
 */
export function renderStackGraph(contentDiv, d3, treeData, options = {}) {
    const {
        owner = null,
        project = null,
        focusNodeId = null,
        focusNodeData = null,
        enableZoom = true,
        compact = false,
        restoreTransform = null,
        viewportElement = null,
        clipPathIdPrefix = 'graph-card-clip',
        ariaLabel = 'Project promise tree',
        emptyMessage = 'No cards to display.',
        onZoom = null,
        onContextMenu = null,
        minGraphWidth = null,
        minGraphHeight = null,
        uniformNodeScale = null,
        renderRootCard = false,
        enableLinks,
        animate = false,
        animationSpeed = 1,
    } = options;

    if (!contentDiv) return null;

    const existingSvgEl = animate ? contentDiv.querySelector('svg') : null;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const resolvedAnimate = animate && !prefersReducedMotion;

    const margin = compact
        ? { top: 12, right: 20, bottom: 12, left: 20 }
        : { top: 32, right: 48, bottom: 32, left: 48 };

    const root = d3.hierarchy(treeData);
    const maxDepth = root.height ?? 0;
    const viewportEl = viewportElement || contentDiv;
    const viewportSize = getInnerViewportSize(viewportEl);
    const viewportWidth = viewportSize.width || contentDiv.clientWidth || 0;
    const viewportHeight = viewportSize.height || contentDiv.clientHeight || 0;

    // Determine compact layout profile when in compact detail mode. This drives node scale
    // and both X/Y tier gaps so small containers don't produce overlapping cards.
    let stepGapX = compact ? COMPACT_STEP_GAP_X : STEP_GAP_X;
    let stepGapY = compact ? COMPACT_STEP_GAP_Y : STEP_GAP_Y;
    let foreheadGap = compact ? COMPACT_FOREHEAD_GAP : FOREHEAD_GAP;

    // Default card scale; may be overridden for compact detail pages by the profile
    let cardScale = uniformNodeScale ?? 1;
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

    const treeLayout = d3.tree().nodeSize([stepGapY, stepGapX]);
    treeLayout(root);

    const descendants = root.descendants();
    const renderable = descendants.filter(node => renderRootCard || node.data?.nodeType !== 'root');

    if (renderable.length === 0) {
        renderEmptyState(contentDiv, emptyMessage);
        return null;
    }

    const links = root.links().filter(l => {
        if (renderRootCard) return true;
        return l.source?.data?.nodeType !== 'root' && l.target?.data?.nodeType !== 'root';
    });
    const resolvedFocusNodeId = focusNodeId ?? focusNodeData?.id ?? null;
    const scaledCardWidth = CARD_WIDTH * cardScale;
    const scaledCardHeight = CARD_HEIGHT * cardScale;
    const minX = d3.min(renderable, node => node.x - (scaledCardHeight / 2)) ?? -(scaledCardHeight / 2);
    const maxX = d3.max(renderable, node => node.x + (scaledCardHeight / 2)) ?? (scaledCardHeight / 2);
    const minY = d3.min(renderable, node => node.y - (scaledCardWidth / 2)) ?? -(scaledCardWidth / 2);
    const maxY = d3.max(renderable, node => node.y + (scaledCardWidth / 2)) ?? (scaledCardWidth / 2);
    const defaultMinWidth = compact ? viewportWidth || 400 : 960;
    const defaultMinHeight = compact ? viewportHeight || 180 : 520;
    const graphWidth = Math.max((maxY - minY) + margin.left + margin.right, viewportWidth, minGraphWidth ?? defaultMinWidth);
    const graphHeight = Math.max((maxX - minX) + margin.top + margin.bottom + foreheadGap, viewportHeight, minGraphHeight ?? defaultMinHeight);

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
    const cardClipPathId = `${clipPathIdPrefix}-${owner ?? 'stack'}-${project ?? 'stack'}`;

    let svg;
    if (existingSvgEl) {
        svg = d3.select(existingSvgEl);
        svg.attr('viewBox', [0, 0, graphWidth, graphHeight])
           .attr('height', compact ? '100%' : Math.max(graphHeight, viewportHeight || 0));
        svg.select('defs').remove();
    } else {
        contentDiv.replaceChildren();
        svg = d3.create('svg')
            .attr('viewBox', [0, 0, graphWidth, graphHeight])
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('width', '100%')
            .attr('height', compact ? '100%' : Math.max(graphHeight, viewportHeight || 0))
            .attr('role', enableZoom ? 'tree' : (enableLinks ? null : 'img'))
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

    const graphLayer = existingSvgEl ? svg.select('g') : svg.append('g');
    let focusedHierarchyNode = null;
    const nodeOptions = {
        contentOffsetX,
        contentOffsetY,
        cardClipPathId,
        owner,
        project,
        focusNodeId: resolvedFocusNodeId,
        onContextMenu,
        enableZoom,
        enableLinks: enableLinks ?? enableZoom,
        uniformNodeScale: compact ? cardScale : null,
        animate: resolvedAnimate,
        animationSpeed,
    };

    let zoom = null;
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
            .on('zoom', event => {
                zoomLayer.attr('transform', event.transform);
                onZoom?.(event.transform, { user: Boolean(event.sourceEvent) });
            });

        svg.call(zoom);
        svg.on('dblclick.zoom', null);

        const initialScale = Math.min(
            viewportWidth > 0 ? viewportWidth / graphWidth : 1,
            viewportHeight > 0 ? viewportHeight / graphHeight : 1,
            1
        );
        focusedHierarchyNode = (() => {
            if (focusNodeData) {
                const byIdentity = root.descendants().find(node => node.data === focusNodeData);
                if (byIdentity) return byIdentity;
            }

            if (!resolvedFocusNodeId) return null;
            return root.descendants().find(node => node.data?.id === resolvedFocusNodeId) ?? null;
        })();

        if (focusedHierarchyNode) {
            logGraphFocus('focus-node-resolved', {
                resolvedFocusNodeId,
                hierarchyX: focusedHierarchyNode.x,
                hierarchyY: focusedHierarchyNode.y,
                dataId: focusedHierarchyNode.data?.id,
                nodeType: focusedHierarchyNode.data?.nodeType,
                label: focusedHierarchyNode.data?.label,
            });
        } else {
            logGraphFocus('focus-node-missing', {
                resolvedFocusNodeId,
                hasFocusNodeData: Boolean(focusNodeData),
                renderableCount: renderable.length,
            });
        }

        const focusTransform = focusedHierarchyNode
            ? createFocusTransform(d3, viewportWidth, viewportHeight, focusedHierarchyNode, contentOffsetX, contentOffsetY, cardScale)
            : null;
        const fitTransform = d3.zoomIdentity
            .translate(
                viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
                viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0
            )
            .scale(initialScale);
        const initialTransform = existingSvgEl
            ? d3.zoomTransform(svg.node())
            : (focusTransform ?? restoreTransform ?? fitTransform);

        logGraphFocus('initial-transform', {
            mode: existingSvgEl ? 'preserve' : (focusTransform ? 'focus' : (restoreTransform ? 'restore' : 'fit')),
            transform: {
                x: initialTransform?.x,
                y: initialTransform?.y,
                k: initialTransform?.k,
            },
            focusTransform: focusTransform ? { x: focusTransform.x, y: focusTransform.y, k: focusTransform.k } : null,
            fitTransform: { x: fitTransform.x, y: fitTransform.y, k: fitTransform.k },
            restoreTransform: restoreTransform ? { x: restoreTransform.x, y: restoreTransform.y, k: restoreTransform.k } : null,
        });

        svg.call(zoom.transform, initialTransform);

        if (focusedHierarchyNode && !existingSvgEl) {
            window.requestAnimationFrame(() => {
                const measuredViewport = getInnerViewportSize(viewportEl);
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
                    focusedHierarchyNode,
                    contentOffsetX,
                    contentOffsetY,
                    cardScale
                );

                if (!refinedTransform) return;

                logGraphFocus('refined-transform', {
                    measuredWidth,
                    measuredHeight,
                    transform: {
                        x: refinedTransform.x,
                        y: refinedTransform.y,
                        k: refinedTransform.k,
                    },
                });

                svg.call(zoom.transform, refinedTransform);
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
        let fitTransform = d3.zoomIdentity
            .translate(
                viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
                viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0
            )
            .scale(initialScale);

        if (compact) {
            // Choose anchor: middle card for odd counts, midpoint between middle two for even
            const ordered = [...renderable].sort((a, b) => (a.y || 0) - (b.y || 0));
            if (ordered.length > 0) {
                const mid = Math.floor((ordered.length - 1) / 2);
                let anchors = [];
                if (ordered.length % 2 === 1) {
                    anchors = [ordered[mid]];
                } else {
                    anchors = [ordered[mid], ordered[mid + 1]];
                }

                const anchorPos = anchors.reduce((acc, node) => {
                    const pos = getRenderedNodePosition(node, contentOffsetX, contentOffsetY);
                    acc.x += pos.x; acc.y += pos.y; return acc;
                }, { x: 0, y: 0 });
                anchorPos.x /= anchors.length; anchorPos.y /= anchors.length;

                // Apply any profile-specified anchor offsets (helps nudge centering)
                const profile = getCompactLayoutProfile(ordered.length, viewportWidth, viewportHeight) || {};
                anchorPos.x += profile.anchorOffsetX ?? 0;
                anchorPos.y += profile.anchorOffsetY ?? 0;

                fitTransform = d3.zoomIdentity
                    .translate(viewportWidth / 2, viewportHeight / 2)
                    .scale(cardScale)
                    .translate(-anchorPos.x, -anchorPos.y);
            }
        }

        graphLayer.attr('transform', fitTransform);
        appendGraphNodes(d3, graphLayer, renderable, links, nodeOptions);
    }

    if (!existingSvgEl) {
        contentDiv.appendChild(svg.node());
    }

    if (focusedHierarchyNode) {
        window.requestAnimationFrame(() => {
            if (!isGraphFocusDebugEnabled()) return;

            const focusElement = contentDiv.querySelector('.graph-node.is-focused .graph-card');
            const viewportRect = viewportEl?.getBoundingClientRect?.() ?? null;
            const focusRect = focusElement?.getBoundingClientRect?.() ?? null;
            const zoomTransform = svg.node()?.__zoom ?? null;

            logGraphFocus('post-render-transform-state', {
                resolvedFocusNodeId,
                layerTransform: graphLayer.attr('transform') ?? null,
                svgZoomTransform: zoomTransform ? {
                    x: zoomTransform.x,
                    y: zoomTransform.y,
                    k: zoomTransform.k,
                } : null,
                svgViewBox: svg.attr('viewBox') ?? null,
                svgSize: {
                    width: svg.attr('width') ?? null,
                    height: svg.attr('height') ?? null,
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
                } : null,
                focusRect: focusRect ? {
                    x: focusRect.x,
                    y: focusRect.y,
                    width: focusRect.width,
                    height: focusRect.height,
                    centerX: focusRect.x + (focusRect.width / 2),
                    centerY: focusRect.y + (focusRect.height / 2),
                } : null,
                deltaFromViewportCenter: viewportRect && focusRect ? {
                    x: (focusRect.x + (focusRect.width / 2)) - (viewportRect.x + (viewportRect.width / 2)),
                    y: (focusRect.y + (focusRect.height / 2)) - (viewportRect.y + (viewportRect.height / 2)),
                } : null,
            });
        });
    }

    return {
        node: svg.node(),
        zoom: svg.node() && enableZoom ? zoom : null,
    };
}

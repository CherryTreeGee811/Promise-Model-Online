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

export function normalizeText(value) {
    return String(value ?? '').trim().toLowerCase();
}

export function getStatusBucket(statusColor) {
    const normalized = normalizeText(statusColor);

    if (!normalized || normalized === 'all') return 'other';
    if (normalized.includes('green') || normalized.includes('done')) return 'done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'inprogress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'todo';

    return 'other';
}

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

export function truncateText(text, maxLength = 40) {
    const value = String(text ?? '').trim();
    if (value.length <= maxLength) return value;
    if (maxLength <= 3) return '.'.repeat(maxLength);
    return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

export function formatEstimate(value) {
    return value == null ? 'Unestimated' : String(value);
}

export function getStatusIcon(statusColor) {
    const normalized = String(statusColor ?? '').toLowerCase();

    if (normalized.includes('green')) return '🟢';
    if (normalized.includes('black') || normalized.includes('blocked')) return '⚫️';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return '🟠';
    if (normalized.includes('red') || normalized.includes('todo')) return '🔴';

    return '⚪';
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

export function getChildProgressSummary(nodeData) {
    const childLabel = getChildTypeLabel(nodeData.nodeType);
    const childCount = nodeData.childCount ?? 0;
    const completedCount = nodeData.completedChildCount ?? 0;

    if (!childLabel) return null;

    return `${completedCount}/${childCount} ${childCount === 1 ? childLabel : `${childLabel}s`} completed`;
}

export function getMomentTypeLabel(payload) {
    const value = String(payload?.type ?? payload?.Type ?? '').trim();
    if (!value) return null;

    const normalized = value.toLowerCase();
    if (normalized === 'story') return 'Story';
    if (normalized === 'job') return 'Job';

    return value;
}

export function getMomentTaskSummary(payload) {
    const tasks = Array.isArray(payload?.tasks) ? payload.tasks : [];
    if (tasks.length === 0) return null;

    const completedCount = tasks.filter(task => Boolean(task?.isCompleted ?? task?.IsCompleted)).length;
    return `Tasks: ${completedCount}/${tasks.length} complete`;
}

export function getCardDescription(payload, maxLength = 52) {
    const description = String(payload?.description ?? payload?.Description ?? '').trim();
    if (!description) return 'Description: None';

    return truncateText(description.replace(/\s+/g, ' '), maxLength);
}

export function getStrideLabel(payload) {
    return payload?.assignedStrideId == null ? 'Stride: Backlog' : `Stride # ${payload.assignedStrideId}`;
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

export function sortByDisplayOrder(items) {
    return [...items].sort((left, right) => {
        const orderDelta = (left.displayOrder ?? 0) - (right.displayOrder ?? 0);
        if (orderDelta !== 0) return orderDelta;
        return String(left.statement ?? '').localeCompare(String(right.statement ?? ''));
    });
}

export function getMomentEffortBucket(effortEstimate) {
    if (effortEstimate == null) return 'unestimated';

    const normalized = normalizeText(effortEstimate);
    const allowed = new Set(['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']);
    return allowed.has(normalized) ? normalized.toUpperCase() : 'unestimated';
}

export function getMomentStrideBucket(payload) {
    return payload?.assignedStrideId == null ? 'backlog' : String(payload.assignedStrideId);
}

export function computeChildMetrics(children) {
    const list = Array.isArray(children) ? children : [];
    const childCount = list.length;
    const completedChildCount = list.filter(child => getStatusBucket(child?.statusColor) === 'done').length;
    return { childCount, completedChildCount };
}

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
        id: `${nodeType}-${payload.id}`,
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

export function createNodeWithMetrics(nodeType, payload, childMetrics = null) {
    const enrichedPayload = { ...payload };
    if (childMetrics) {
        enrichedPayload._childCount = childMetrics.childCount;
        enrichedPayload._completedChildCount = childMetrics.completedChildCount;
    }
    return createNode(nodeType, enrichedPayload, []);
}

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

export function getAppBasePath() {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const routeRootIndex = pathSegments.findIndex(segment => Object.prototype.hasOwnProperty.call(NODE_ROUTE_SEGMENTS, segment));

    if (routeRootIndex <= 0) {
        return '';
    }

    return `/${pathSegments.slice(0, routeRootIndex).join('/')}`;
}

export function getNodeHref(node, projectId) {
    const routeSegment = NODE_ROUTE_SEGMENTS[node.nodeType];
    if (!routeSegment) return null;

    const params = new URLSearchParams();
    if (projectId != null) {
        params.set('graphProjectId', String(projectId));
    }
    params.set('graphFocus', `${node.nodeType}-${node.payload?.id}`);

    return `${getAppBasePath()}/${routeSegment}/${node.payload?.id}?${params.toString()}`;
}

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

export function countRenderableNodes(node) {
    if (!node) return 0;

    const selfCount = node.nodeType === 'root' ? 0 : 1;
    return selfCount + (node.children ?? []).reduce((sum, child) => sum + countRenderableNodes(child), 0);
}

export function parseGraphData(rootPromises, projectId, project = null) {
    const rawName = project?.name ?? project?.Name ?? '';
    const normalizedName = String(rawName).trim();
    const projectLabel = normalizedName || `Project #${projectId}`;

    return {
        id: `root-${projectId}`,
        nodeType: 'root',
        label: projectLabel,
        payload: {
            id: projectId,
            name: projectLabel,
            description: project?.description ?? project?.Description ?? null,
        },
        children: rootPromises,
    };
}

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
        projectId,
        focusNodeId,
        onContextMenu,
        uniformNodeScale = null,
    } = options;

    const nodeScale = uniformNodeScale ?? 1;

    layer.append('g')
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
                source: {
                    x: d.source.x + contentOffsetY,
                    y: d.source.y + contentOffsetX + ((CARD_WIDTH / 2) * nodeScale),
                },
                target: {
                    x: d.target.x + contentOffsetY,
                    y: d.target.y + contentOffsetX - ((CARD_WIDTH / 2) * nodeScale),
                },
            }));

    const node = layer.append('g')
        .selectAll('a')
        .data(renderable)
        .join('a')
        .attr('class', current => `graph-node graph-node--${current.data.nodeType}`)
        .attr('href', current => getNodeHref(current.data, projectId))
        .attr('xlink:href', current => getNodeHref(current.data, projectId))
        .attr('transform', current => {
            const x = current.y + contentOffsetX;
            const y = current.x + contentOffsetY;
            return `translate(${x}, ${y}) scale(${nodeScale})`;
        });

    if (onContextMenu) {
        node.on('contextmenu', (event, current) => {
            event.preventDefault();
            onContextMenu(event, current.data);
        });
    }

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
        .attr('stroke', current => {
            const isFocused = focusNodeId != null && current.data.id === focusNodeId;
            const allowFocusHighlight = current.data.nodeType !== 'root';
            if (current.data._searchMatched || (isFocused && allowFocusHighlight)) return '#d4af37';
            return current.depth === 0 ? getNodeColor(current.data.nodeType) : '#cbd5e1';
        })
        .attr('stroke-width', current => {
            const isFocused = focusNodeId != null && current.data.id === focusNodeId;
            const allowFocusHighlight = current.data.nodeType !== 'root';
            if (current.data._searchMatched || (isFocused && allowFocusHighlight)) return 3;
            return current.depth === 0 ? 2.5 : 1.5;
        });

    node.append('rect')
        .attr('class', 'graph-card-accent')
        .attr('x', -CARD_WIDTH / 2)
        .attr('y', -CARD_HEIGHT / 2)
        .attr('width', 10)
        .attr('height', CARD_HEIGHT)
        .attr('rx', CARD_RADIUS)
        .attr('ry', CARD_RADIUS)
        .attr('clip-path', `url(#${cardClipPathId})`)
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

    node.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-type')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 30)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text(current => getMomentTypeLabel(current.data.payload) ?? '');

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
        .text(current => getCardDescription(current.data.payload, 52));

    node.filter(current => current.data.nodeType === 'moment')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 2))
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => `Effort: ${formatEstimate(current.data.payload?.effortEstimate)}`);

    node.filter(current => current.data.nodeType === 'moment' && getMomentTaskSummary(current.data.payload))
        .append('text')
        .attr('class', 'graph-card-line graph-card-line--moment-tasks')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + DETAIL_START_Y + (DETAIL_LINE_GAP * 3))
        .attr('fill', '#0f766e')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .text(current => getMomentTaskSummary(current.data.payload));

    node.filter(current => current.data.nodeType !== 'moment' && current.data.nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 62)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .text(current => getCardDescription(current.data.payload));

    node.filter(current => current.data.nodeType !== 'moment' && current.data.nodeType !== 'root')
        .append('text')
        .attr('class', 'graph-card-line')
        .attr('x', -CARD_WIDTH / 2 + CARD_PADDING_X)
        .attr('y', -CARD_HEIGHT / 2 + 88)
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('dominant-baseline', 'middle')
        .text(current => getChildProgressSummary(current.data) ?? 'No child cards');
}

/**
 * Renders a promise stack tree into contentDiv.
 * @returns {SVGElement|null} the root svg element
 */
export function renderStackGraph(contentDiv, d3, treeData, options = {}) {
    const {
        projectId = null,
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
    } = options;

    if (!contentDiv) return null;

    contentDiv.replaceChildren();

    const margin = compact
        ? { top: 12, right: 20, bottom: 12, left: 20 }
        : { top: 32, right: 48, bottom: 32, left: 48 };

    const root = d3.hierarchy(treeData);
    const maxDepth = root.height ?? 0;
    const viewportEl = viewportElement || contentDiv;
    const viewportSize = getInnerViewportSize(viewportEl);
    const viewportWidth = viewportSize.width || contentDiv.clientWidth || 0;
    const viewportHeight = viewportSize.height || contentDiv.clientHeight || 0;

    let stepGapX = compact ? COMPACT_STEP_GAP_X : STEP_GAP_X;
    const stepGapY = compact ? COMPACT_STEP_GAP_Y : STEP_GAP_Y;
    const foreheadGap = compact ? COMPACT_FOREHEAD_GAP : FOREHEAD_GAP;

    const cardScale = uniformNodeScale ?? 1;

    if (compact && maxDepth > 0 && viewportWidth > 0) {
        const usableWidth = Math.max(
            viewportWidth - margin.left - margin.right - (CARD_WIDTH * cardScale),
            CARD_WIDTH,
        );
        stepGapX = Math.max(usableWidth / maxDepth, COMPACT_MIN_TIER_GAP);
    }

    const treeLayout = d3.tree().nodeSize([stepGapY, stepGapX]);
    treeLayout(root);

    const descendants = root.descendants();
    const renderable = descendants;

    if (renderable.length === 0) {
        renderEmptyState(contentDiv, emptyMessage);
        return null;
    }

    const links = root.links();
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

    const svg = d3.create('svg')
        .attr('viewBox', [0, 0, graphWidth, graphHeight])
        .attr('width', '100%')
        .attr('height', compact ? '100%' : Math.max(graphHeight, viewportHeight || 0))
        .attr('role', 'img')
        .attr('aria-label', ariaLabel);

    const contentOffsetX = margin.left - minY;
    const contentOffsetY = margin.top - minX + foreheadGap;
    const cardClipPathId = `${clipPathIdPrefix}-${projectId ?? 'stack'}`;

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

    const graphLayer = svg.append('g');
    const nodeOptions = {
        contentOffsetX,
        contentOffsetY,
        cardClipPathId,
        projectId,
        focusNodeId: resolvedFocusNodeId,
        onContextMenu,
        uniformNodeScale: compact ? uniformNodeScale : null,
    };

    if (enableZoom) {
        const zoomLayer = graphLayer;
        const safeViewportWidth = Math.max(viewportWidth, 1);
        const safeViewportHeight = Math.max(viewportHeight, 1);

        const zoom = d3.zoom()
            .scaleExtent([0.5, 2.5])
            .extent([[0, 0], [safeViewportWidth, safeViewportHeight]])
            .translateExtent([
                [-safeViewportWidth, -safeViewportHeight],
                [graphWidth + safeViewportWidth, graphHeight + safeViewportHeight],
            ])
            .on('zoom', event => {
                zoomLayer.attr('transform', event.transform);
                onZoom?.(event.transform, { user: true });
            });

        svg.call(zoom);
        svg.on('dblclick.zoom', null);

        const initialScale = Math.min(
            viewportWidth > 0 ? viewportWidth / graphWidth : 1,
            viewportHeight > 0 ? viewportHeight / graphHeight : 1,
            1
        );
        const focusedHierarchyNode = focusNodeData
            ? root.descendants().find(node => node.data === focusNodeData)
            : null;
        const focusTransform = focusNodeData
            ? createFocusTransform(d3, viewportWidth, viewportHeight, focusedHierarchyNode, contentOffsetX, contentOffsetY)
            : null;
        const fitTransform = d3.zoomIdentity
            .translate(
                viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
                viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0
            )
            .scale(initialScale);
        const initialTransform = focusTransform ?? restoreTransform ?? fitTransform;

        zoomLayer.attr('transform', initialTransform);
        onZoom?.(initialTransform, { user: false });

        if (focusedHierarchyNode) {
            window.requestAnimationFrame(() => {
                const measuredViewport = getInnerViewportSize(viewportEl);
                const measuredWidth = Math.max(measuredViewport.width || contentDiv.clientWidth || 0, 1);
                const measuredHeight = Math.max(measuredViewport.height || contentDiv.clientHeight || 0, 1);
                const refinedTransform = createFocusTransform(
                    d3,
                    measuredWidth,
                    measuredHeight,
                    focusedHierarchyNode,
                    contentOffsetX,
                    contentOffsetY
                );

                if (!refinedTransform) return;

                svg.call(zoom.transform, refinedTransform);
                onZoom?.(refinedTransform, { user: false });
            });
        }

        appendGraphNodes(d3, zoomLayer, renderable, links, nodeOptions);
    } else {
        const initialScale = Math.min(
            viewportWidth > 0 ? viewportWidth / graphWidth : 1,
            viewportHeight > 0 ? viewportHeight / graphHeight : 1,
            1
        );
        const fitTransform = d3.zoomIdentity
            .translate(
                viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
                viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0
            )
            .scale(initialScale);

        graphLayer.attr('transform', fitTransform);
        appendGraphNodes(d3, graphLayer, renderable, links, nodeOptions);
    }

    contentDiv.appendChild(svg.node());
    return svg.node();
}

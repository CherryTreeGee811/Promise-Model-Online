import { getProjectPromises } from './api.mjs';
import { getEpicsByPromise } from '../promises/api.mjs';
import { getJourneysByEpic } from '../epics/api.mjs';
import { getFlowsByJourney } from '../journeys/api.mjs';
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
    if (normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('orange')) return '🟡';
    if (normalized.includes('red')) return '🔴';

    return '⚪';
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
    return {
        id: `${nodeType}-${payload.id}`,
        nodeType,
        label: payload.statement ?? payload.name ?? `#${payload.id}`,
        payload,
        children,
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

function renderTree(contentDiv, d3, treeData) {
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
            zoomLayer.attr('transform', event.transform);
        });

    svg.call(zoom);
    svg.on('dblclick.zoom', null);

    const initialScale = Math.min(
        viewportWidth > 0 ? viewportWidth / graphWidth : 1,
        viewportHeight > 0 ? viewportHeight / graphHeight : 1,
        1
    );
    const initialTransform = d3.zoomIdentity
        .translate(
            viewportWidth > 0 ? (viewportWidth - (graphWidth * initialScale)) / 2 : 0,
            viewportHeight > 0 ? (viewportHeight - (graphHeight * initialScale)) / 2 : 0
        )
        .scale(initialScale);

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
        .selectAll('g')
        .data(renderable)
        .join('g')
        .attr('class', current => `graph-node graph-node--${current.data.nodeType}`)
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

    node.filter(current => current.data.nodeType === 'moment')
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

    graphContent.appendChild(svg.node());
}

export async function loadGraphPage(projectId, contentDiv) {
    const errorEl = document.getElementById('error-text');
    const loadingEl = document.getElementById('loading-text');
    const successEl = document.getElementById('success-text');

    if (loadingEl) loadingEl.textContent = 'Loading project graph...';
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    try {
        const d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
        const rootPromises = sortByDisplayOrder(await getProjectPromises(projectId));
        const children = await Promise.all(rootPromises.map(buildPromiseNode));
        const treeData = { id: `root-${projectId}`, nodeType: 'root', label: '', payload: {}, children };

        renderTree(contentDiv, d3, treeData);

        if (loadingEl) loadingEl.textContent = '';
        if (successEl) successEl.textContent = `Loaded ${children.length} top-level promise${children.length === 1 ? '' : 's'}.`;
    } catch (error) {
        console.error('Error loading project graph:', error);
        if (loadingEl) loadingEl.textContent = '';
        if (errorEl) errorEl.textContent = 'Unable to load the project graph.';
    }
}
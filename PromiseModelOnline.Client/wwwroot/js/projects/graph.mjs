import { getProjectPromises } from './api.mjs';
import { getEpicsByPromise } from '../promises/api.mjs';
import { getJourneysByEpic } from '../epics/api.mjs';
import { getFlowsByJourney } from '../journeys/api.mjs';
import { getMomentsByFlow } from '../flows/api.mjs';

const STEP_GAP_X = 220;
const STEP_GAP_Y = 84;

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
    if (!graphContent) return;

    graphContent.replaceChildren();

    const margin = { top: 32, right: 48, bottom: 32, left: 48 };

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().nodeSize([STEP_GAP_Y, STEP_GAP_X]);
    treeLayout(root);

    const descendants = root.descendants();
    const links = root.links();
    const xExtent = d3.extent(descendants, node => node.x) ?? [0, 0];
    const yExtent = d3.extent(descendants, node => node.y) ?? [0, 0];
    const width = Math.max((yExtent[1] - yExtent[0]) + margin.left + margin.right, contentDiv.clientWidth || 0, 960);
    const height = Math.max((xExtent[1] - xExtent[0]) + margin.top + margin.bottom, 240);
    const svg = d3.create('svg')
        .attr('viewBox', [0, 0, width, height])
        .attr('width', '100%')
        .attr('height', height)
        .attr('role', 'img')
        .attr('aria-label', 'Project promise tree');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left - yExtent[0]}, ${margin.top - xExtent[0]})`);

    g.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#94a3b8')
        .attr('stroke-opacity', 0.65)
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('d', d3.linkHorizontal()
            .x(link => link.y)
            .y(link => link.x));

    const node = g.append('g')
        .selectAll('g')
        .data(descendants)
        .join('g')
        .attr('transform', current => `translate(${current.y}, ${current.x})`);

    node.append('circle')
        .attr('r', current => current.depth === 0 ? 0 : 12)
        .attr('fill', current => getNodeColor(current.data.nodeType))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('opacity', current => current.depth === 0 ? 0 : 1);

    node.append('text')
        .attr('dy', '0.32em')
        .attr('x', current => current.depth === 0 ? 0 : 20)
        .attr('text-anchor', current => current.depth === 0 ? 'middle' : 'start')
        .attr('fill', '#0f172a')
        .attr('font-size', 13)
        .attr('font-weight', current => current.depth === 1 ? 700 : 500)
        .text(current => current.depth === 0 ? '' : current.data.label);

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
        const treeData = { id: `project-${projectId}`, nodeType: 'project', label: `Project ${projectId}`, payload: { id: projectId }, children };

        renderTree(contentDiv, d3, treeData);

        if (loadingEl) loadingEl.textContent = '';
        if (successEl) successEl.textContent = `Loaded ${children.length} top-level promise${children.length === 1 ? '' : 's'}.`;
    } catch (error) {
        console.error('Error loading project graph:', error);
        if (loadingEl) loadingEl.textContent = '';
        if (errorEl) errorEl.textContent = 'Unable to load the project graph.';
    }
}
import { getProject } from './api.mjs';
import { getPromise, getEpicsByPromise, getPromiseById } from '../promises/api.mjs';
import { getEpic, getJourneys, getEpicById } from '../epics/api.mjs';
import { getJourney, getFlows, getJourneyById } from '../journeys/api.mjs';
import { getFlow, getMoments, getFlowById } from '../flows/api.mjs';
import { getMoment, getMomentById } from '../moments/api.mjs';
import {
    computeChildMetrics,
    createNodeWithMetrics,
    findNodeById,
    getMomentEffortBucket,
    getMomentStrideBucket,
    getStatusBucket,
    normalizeText,
    parseGraphData,
    getDetailPageNodeScale,
    renderEmptyState,
    renderStackGraph,
} from './stack-graph-core.mjs';

const STACK_NODE_TYPES = ['promise', 'epic', 'journey', 'flow', 'moment'];

let d3Promise = null;
const detailStackState = {
    tree: null,
    owner: null,
    project: null,
    focusNodeId: null,
    activeNodeType: null,
    activeNodeId: null,
    d3: null,
    mountToken: 0,
};

/**
 * Lazy-load the D3.js library.
 */
export function loadD3() {
    if (!d3Promise) {
        d3Promise = import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
    }
    return d3Promise;
}

function getContainer() {
    return document.getElementById('detail-stack-graph');
}

function renderLoadingSpinner(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="d-flex h-100 w-100 align-items-center justify-content-center" aria-live="polite" aria-label="Loading detail stack graph">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading detail stack graph...</span>
            </div>
        </div>
    `;
}

function refreshNodeDerivedFields(node) {
    const payload = node.payload ?? {};
    node.label = payload.statement ?? payload.name ?? `#${payload.id}`;
    node._searchText = normalizeText([node.label, payload.description].join(' '));
    node._statusBucket = getStatusBucket(payload?.statusColor);
    if (node.nodeType === 'moment') {
        node._effortBucket = getMomentEffortBucket(payload?.effortEstimate);
        node._strideBucket = getMomentStrideBucket(payload);
    }
}

function rerenderDetailStackGraph() {
    const container = getContainer();
    if (!container || !detailStackState.tree || !detailStackState.d3) return;

    renderStackGraph(container, detailStackState.d3, detailStackState.tree, {
        owner: detailStackState.owner,
        project: detailStackState.project,
        focusNodeId: detailStackState.focusNodeId,
        enableZoom: false,
        enableLinks: true,
        compact: true,
        uniformNodeScale: getDetailPageNodeScale(detailStackState.activeNodeType),
        viewportElement: container,
        clipPathIdPrefix: 'detail-stack-graph-clip',
        ariaLabel: 'Promise stack context',
        emptyMessage: 'Unable to display stack context.',
    });
}

async function fetchPathEntities(nodeType, nodeId, owner, project) {
    const numericId = Number.parseInt(String(nodeId), 10);
    if (Number.isNaN(numericId)) {
        throw new Error(`Invalid ${nodeType} id`);
    }

    let moment = null;
    let flow = null;
    let journey = null;
    let epic = null;
    let promise = null;

    switch (nodeType) {
        case 'moment': {
            moment = await getMoment(owner, project, numericId);
            flow = await getFlowById(owner, project, moment.flowId);
            journey = await getJourneyById(owner, project, flow.journeyId);
            epic = await getEpicById(owner, project, journey.epicId);
            promise = await getPromiseById(owner, project, epic.productPromiseId);
            break;
        }
        case 'flow': {
            flow = await getFlow(owner, project, numericId);
            journey = await getJourneyById(owner, project, flow.journeyId);
            epic = await getEpicById(owner, project, journey.epicId);
            promise = await getPromiseById(owner, project, epic.productPromiseId);
            break;
        }
        case 'journey': {
            journey = await getJourney(owner, project, numericId);
            epic = await getEpicById(owner, project, journey.epicId);
            promise = await getPromiseById(owner, project, epic.productPromiseId);
            break;
        }
        case 'epic': {
            epic = await getEpic(owner, project, numericId);
            promise = await getPromiseById(owner, project, epic.productPromiseId);
            break;
        }
        case 'promise': {
            promise = await getPromise(owner, project, numericId);
            break;
        }
        default:
            throw new Error(`Unsupported node type: ${nodeType}`);
    }

    let projectEntity = null;
    try {
        projectEntity = await getProject(owner, project);
    } catch (error) {
        console.warn('Unable to load project for detail stack graph:', error);
    }

    return { moment, flow, journey, epic, promise, project: projectEntity };
}

async function fetchChildMetricsForPath({ moment, flow, journey, epic, promise }, owner, project) {
    const metrics = {};

    const fetches = [];
    if (promise) {
        fetches.push(
            getEpicsByPromise(owner, project, promise.sequenceNumber)
                .then(items => { metrics.promise = computeChildMetrics(items); })
                .catch(() => { metrics.promise = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (epic) {
        fetches.push(
            getJourneys(owner, project, epic.sequenceNumber)
                .then(items => { metrics.epic = computeChildMetrics(items); })
                .catch(() => { metrics.epic = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (journey) {
        fetches.push(
            getFlows(owner, project, journey.sequenceNumber)
                .then(items => { metrics.journey = computeChildMetrics(items); })
                .catch(() => { metrics.journey = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (flow) {
        fetches.push(
            getMoments(owner, project, flow.sequenceNumber)
                .then(items => { metrics.flow = computeChildMetrics(items); })
                .catch(() => { metrics.flow = { childCount: 0, completedChildCount: 0 }; })
        );
    }

    await Promise.all(fetches);
    return metrics;
}

function wrapWithChild(node, child) {
    return {
        ...node,
        children: child ? [child] : [],
    };
}

function buildLinearTree(pathEntities, metrics, owner, project) {
    const { moment, flow, journey, epic, promise, project: projectEntity } = pathEntities;

    let tip = null;
    if (moment) {
        tip = createNodeWithMetrics('moment', moment);
    }
    if (flow) {
        tip = wrapWithChild(createNodeWithMetrics('flow', flow, metrics.flow), tip);
    }
    if (journey) {
        tip = wrapWithChild(createNodeWithMetrics('journey', journey, metrics.journey), tip);
    }
    if (epic) {
        tip = wrapWithChild(createNodeWithMetrics('epic', epic, metrics.epic), tip);
    }
    if (promise) {
        tip = wrapWithChild(createNodeWithMetrics('promise', promise, metrics.promise), tip);
    }

    if (!tip) return null;

    if (owner && project) {
        return parseGraphData([tip], owner, project, projectEntity);
    }

    return {
        id: 'root-unknown',
        nodeType: 'root',
        label: 'Project',
        payload: { id: null, name: 'Project' },
        children: [tip],
    };
}

/**
 * Build an ancestor path tree for the detail stack graph.
 * @param {*} nodeType - TODO
 * @param {*} nodeKey - TODO
 * @param {*} owner - TODO
 * @param {*} project - TODO
 */
export async function buildAncestorPathTree(nodeType, nodeId, owner, project) {
    if (!STACK_NODE_TYPES.includes(nodeType)) {
        throw new Error(`Unsupported node type: ${nodeType}`);
    }

    const pathEntities = await fetchPathEntities(nodeType, nodeId, owner, project);
    const metrics = await fetchChildMetricsForPath(pathEntities, owner, project);

    const focusEntity = pathEntities[nodeType];
    const focusSeq = focusEntity?.sequenceNumber ?? nodeId;

    return {
        tree: buildLinearTree(pathEntities, metrics, owner, project),
        focusNodeId: `${nodeType}-${focusSeq}`,
    };
}

/**
 * Destroy the detail stack graph instance.
 */
export function destroyDetailStackGraph() {
    detailStackState.mountToken += 1;
    detailStackState.tree = null;
    detailStackState.owner = null;
    detailStackState.project = null;
    detailStackState.focusNodeId = null;
    detailStackState.activeNodeType = null;
    detailStackState.activeNodeId = null;
    detailStackState.projectIdHint = null;
    detailStackState.d3 = null;

    const container = getContainer();
    if (container) {
        container.classList.remove('detail-stack-graph--loading');
        container.replaceChildren();
    }
}

/**
 * Refresh child metrics for a node in the stack graph.
 * @param {*} nodeType - TODO
 * @param {*} nodeKey - TODO
 * @param {*} owner - TODO
 * @param {*} project - TODO
 */
export function patchChildMetrics(nodeId, children) {
    const metrics = computeChildMetrics(children);
    patchDetailStackGraphNode(nodeId, {
        _childCount: metrics.childCount,
        _completedChildCount: metrics.completedChildCount,
    });
}

/**
 * Map a moment status to a color for graph display.
 * @param {*} status - TODO
 */
export function momentStatusToColor(status) {
    switch (String(status ?? '')) {
        case 'Done': return 'green';
        case 'InProgress': return 'orange';
        case 'Blocked': return 'black';
        case 'Todo':
        default: return 'red';
    }
}

/**
 * Update a specific node in the detail stack graph.
 * @param {*} nodeKey - TODO
 * @param {*} data - TODO
 */
export function patchDetailStackGraphNode(nodeId, payloadPatch = {}) {
    if (!detailStackState.tree || !nodeId) return;

    const node = findNodeById(detailStackState.tree, nodeId);
    if (!node) return;

    node.payload = { ...node.payload, ...payloadPatch };
    if (payloadPatch._childCount != null) {
        node.childCount = payloadPatch._childCount;
    }
    if (payloadPatch._completedChildCount != null) {
        node.completedChildCount = payloadPatch._completedChildCount;
    }
    refreshNodeDerivedFields(node);
    rerenderDetailStackGraph();
}

/**
 * Refetch the ancestor path and re-render (same approach as the full graph's reloadGraphData
 * after a moment status change, which rolls up statusColor on the server).
 */
export async function refreshDetailStackGraph() {
    const { activeNodeType, activeNodeId, owner, project, d3 } = detailStackState;
    if (!activeNodeType || activeNodeId == null || !d3) return;

    try {
        const pathResult = await buildAncestorPathTree(activeNodeType, activeNodeId, owner, project);
        detailStackState.tree = pathResult.tree;
        detailStackState.focusNodeId = pathResult.focusNodeId;
        rerenderDetailStackGraph();
    } catch (error) {
        console.error('Unable to refresh detail stack graph:', error);
    }
}

/**
 * Mount the detail stack graph visualization.
 * @param {*} config - TODO
 */
export async function mountDetailStackGraph({ nodeType, nodeId, owner, project }) {
    const container = getContainer();
    if (!container) return;

    const mountToken = ++detailStackState.mountToken;
    container.classList.add('detail-stack-graph--loading');
    renderLoadingSpinner(container);

    try {
        const [d3, pathResult] = await Promise.all([
            loadD3(),
            buildAncestorPathTree(nodeType, nodeId, owner, project),
        ]);

        if (mountToken !== detailStackState.mountToken) return;

        detailStackState.d3 = d3;
        detailStackState.tree = pathResult.tree;
        detailStackState.focusNodeId = pathResult.focusNodeId;
        detailStackState.activeNodeType = nodeType;
        detailStackState.activeNodeId = nodeId;
        detailStackState.owner = owner;
        detailStackState.project = project;

        container.classList.remove('detail-stack-graph--loading');

        if (!detailStackState.tree) {
            renderEmptyState(container, 'Unable to display stack context.');
            return;
        }

        rerenderDetailStackGraph();
    } catch (error) {
        if (mountToken !== detailStackState.mountToken) return;
        console.error('Unable to load detail stack graph:', error);
        container.classList.remove('detail-stack-graph--loading');
        renderEmptyState(container, 'Unable to display stack context.');
    }
}

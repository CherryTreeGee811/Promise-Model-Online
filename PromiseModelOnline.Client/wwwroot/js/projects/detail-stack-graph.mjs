import { getProjectById } from './api.mjs';
import { getPromiseById, getEpicsByPromise } from '../promises/api.mjs';
import { getEpicById, getJourneysByEpic } from '../epics/api.mjs';
import { getJourneyById, getFlowsByJourney } from '../journeys/api.mjs';
import { getFlowById, getMomentsByFlow } from '../flows/api.mjs';
import { getMomentById } from '../moments/api.mjs';
import { resolveProjectIdForPromise } from './graph-link.mjs';
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
    projectId: null,
    focusNodeId: null,
    activeNodeType: null,
    activeNodeId: null,
    projectIdHint: null,
    d3: null,
    mountToken: 0,
};

function loadD3() {
    if (!d3Promise) {
        d3Promise = import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
    }
    return d3Promise;
}

function getContainer() {
    return document.getElementById('detail-stack-graph');
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
        projectId: detailStackState.projectId,
        focusNodeId: detailStackState.focusNodeId,
        enableZoom: false,
        compact: true,
        uniformNodeScale: getDetailPageNodeScale(detailStackState.activeNodeType),
        viewportElement: container,
        clipPathIdPrefix: 'detail-stack-graph-clip',
        ariaLabel: 'Promise stack context',
        emptyMessage: 'Unable to display stack context.',
    });
}

async function fetchPathEntities(nodeType, nodeId, projectIdHint) {
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
            moment = await getMomentById(numericId);
            flow = await getFlowById(moment.flowId);
            journey = await getJourneyById(flow.journeyId);
            epic = await getEpicById(journey.epicId);
            promise = await getPromiseById(epic.productPromiseId);
            break;
        }
        case 'flow': {
            flow = await getFlowById(numericId);
            journey = await getJourneyById(flow.journeyId);
            epic = await getEpicById(journey.epicId);
            promise = await getPromiseById(epic.productPromiseId);
            break;
        }
        case 'journey': {
            journey = await getJourneyById(numericId);
            epic = await getEpicById(journey.epicId);
            promise = await getPromiseById(epic.productPromiseId);
            break;
        }
        case 'epic': {
            epic = await getEpicById(numericId);
            promise = await getPromiseById(epic.productPromiseId);
            break;
        }
        case 'promise': {
            promise = await getPromiseById(numericId);
            break;
        }
        default:
            throw new Error(`Unsupported node type: ${nodeType}`);
    }

    const projectId = await resolveProjectIdForPromise(promise.id, projectIdHint);
    let project = null;
    if (projectId != null) {
        try {
            project = await getProjectById(projectId);
        } catch (error) {
            console.warn('Unable to load project for detail stack graph:', error);
        }
    }

    return { moment, flow, journey, epic, promise, project, projectId };
}

async function fetchChildMetricsForPath({ moment, flow, journey, epic, promise }) {
    const metrics = {};

    const fetches = [];
    if (promise) {
        fetches.push(
            getEpicsByPromise(promise.id)
                .then(items => { metrics.promise = computeChildMetrics(items); })
                .catch(() => { metrics.promise = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (epic) {
        fetches.push(
            getJourneysByEpic(epic.id)
                .then(items => { metrics.epic = computeChildMetrics(items); })
                .catch(() => { metrics.epic = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (journey) {
        fetches.push(
            getFlowsByJourney(journey.id)
                .then(items => { metrics.journey = computeChildMetrics(items); })
                .catch(() => { metrics.journey = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (flow) {
        fetches.push(
            getMomentsByFlow(flow.id)
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

function buildLinearTree(pathEntities, metrics) {
    const { moment, flow, journey, epic, promise, project, projectId } = pathEntities;

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

    if (projectId != null) {
        return parseGraphData([tip], projectId, project);
    }

    return {
        id: 'root-unknown',
        nodeType: 'root',
        label: 'Project',
        payload: { id: null, name: 'Project' },
        children: [tip],
    };
}

export async function buildAncestorPathTree(nodeType, nodeId, projectIdHint = null) {
    if (!STACK_NODE_TYPES.includes(nodeType)) {
        throw new Error(`Unsupported node type: ${nodeType}`);
    }

    const pathEntities = await fetchPathEntities(nodeType, nodeId, projectIdHint);
    const metrics = await fetchChildMetricsForPath(pathEntities);
    return {
        tree: buildLinearTree(pathEntities, metrics),
        projectId: pathEntities.projectId,
        focusNodeId: `${nodeType}-${nodeId}`,
    };
}

export function destroyDetailStackGraph() {
    detailStackState.mountToken += 1;
    detailStackState.tree = null;
    detailStackState.projectId = null;
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

export function patchChildMetrics(nodeId, children) {
    const metrics = computeChildMetrics(children);
    patchDetailStackGraphNode(nodeId, {
        _childCount: metrics.childCount,
        _completedChildCount: metrics.completedChildCount,
    });
}

export function momentStatusToColor(status) {
    switch (String(status ?? '')) {
        case 'Done': return 'green';
        case 'InProgress': return 'orange';
        case 'Blocked': return 'black';
        case 'Todo':
        default: return 'red';
    }
}

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
    const { activeNodeType, activeNodeId, projectIdHint, d3 } = detailStackState;
    if (!activeNodeType || activeNodeId == null || !d3) return;

    try {
        const pathResult = await buildAncestorPathTree(activeNodeType, activeNodeId, projectIdHint);
        detailStackState.tree = pathResult.tree;
        detailStackState.projectId = pathResult.projectId;
        detailStackState.focusNodeId = pathResult.focusNodeId;
        rerenderDetailStackGraph();
    } catch (error) {
        console.error('Unable to refresh detail stack graph:', error);
    }
}

export async function mountDetailStackGraph({ nodeType, nodeId, projectIdHint = null }) {
    const container = getContainer();
    if (!container) return;

    const mountToken = ++detailStackState.mountToken;
    container.classList.add('detail-stack-graph--loading');
    container.replaceChildren();

    try {
        const [d3, pathResult] = await Promise.all([
            loadD3(),
            buildAncestorPathTree(nodeType, nodeId, projectIdHint),
        ]);

        if (mountToken !== detailStackState.mountToken) return;

        detailStackState.d3 = d3;
        detailStackState.tree = pathResult.tree;
        detailStackState.projectId = pathResult.projectId;
        detailStackState.focusNodeId = pathResult.focusNodeId;
        detailStackState.activeNodeType = nodeType;
        detailStackState.activeNodeId = nodeId;
        detailStackState.projectIdHint = projectIdHint;

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

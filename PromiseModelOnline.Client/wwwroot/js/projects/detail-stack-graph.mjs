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
 * Lazy-load the D3.js library, caching the promise for subsequent calls.
 * @returns {Promise<object>} A promise that resolves to the D3 module.
 */
export function loadD3() {
    if (!d3Promise) {
        d3Promise = Promise.resolve(window.d3);
    }
    return d3Promise;
}

/**
 * Get the detail stack graph DOM container element.
 * @returns {HTMLElement|null} The container element, or null if not found.
 */
function getContainer() {
    return document.getElementById('detail-stack-graph');
}

/**
 * Render a loading spinner inside the given container.
 * @param {HTMLElement|null} container - The container to render the spinner into.
 */
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

/**
 * Refresh the derived display fields on a graph node based on its payload.
 * @param {object} node - The graph node to update.
 */
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

/**
 * Re-render the detail stack graph with the current state.
 */
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

/**
 * Fetch all ancestor entities along the path from a given node up to the project.
 * @param {string} nodeType - The type of the target node (promise, epic, journey, flow, moment).
 * @param {string|number} nodeId - The ID of the target node.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<{moment: object|null, flow: object|null, journey: object|null, epic: object|null, promise: object|null, project: object|null}>} The fetched entities.
 */
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

/**
 * Fetch child metrics (counts, completion) for each entity in the ancestor path.
 * @param {{moment: object|null, flow: object|null, journey: object|null, epic: object|null, promise: object|null}} entities - The ancestor entities.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<{promise: {childCount: number, completedChildCount: number}, epic: object, journey: object, flow: object}>} Child metrics per entity type.
 */
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

/**
 * Wrap a node with a single child, building a parent-child chain.
 * @param {object} node - The parent node.
 * @param {object|null} child - The child node to wrap under the parent.
 * @returns {object} A new node with the child attached.
 */
function wrapWithChild(node, child) {
    return {
        ...node,
        children: child ? [child] : [],
    };
}

/**
 * Build a linear ancestor tree from the root down to the focused node.
 * @param {{moment: object|null, flow: object|null, journey: object|null, epic: object|null, promise: object|null, project: object|null}} pathEntities - The ancestor entities.
 * @param {{promise: object, epic: object, journey: object, flow: object}} metrics - Child metrics per entity type.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {object|null} The root tree node, or null if no entities are present.
 */
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
 * Build an ancestor path tree for the detail stack graph, fetching all parent entities.
 * @param {string} nodeType - The type of the target node.
 * @param {string|number} nodeId - The ID of the target node.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<{tree: object|null, focusNodeId: string|null}>} The tree data and the focus node ID.
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
 * Destroy the detail stack graph instance, clearing state and container.
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
 * Refresh child metrics for a node in the stack graph based on its current children.
 * @param {string} nodeId - The node ID to update.
 * @param {object[]} children - The current list of child entities.
 */
export function patchChildMetrics(nodeId, children) {
    const metrics = computeChildMetrics(children);
    patchDetailStackGraphNode(nodeId, {
        _childCount: metrics.childCount,
        _completedChildCount: metrics.completedChildCount,
    });
}

/**
 * Map a moment status string to a color for graph display.
 * @param {string} status - The status value (e.g. 'Done', 'InProgress', 'Blocked', 'Todo').
 * @returns {string} The CSS color name.
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
 * Update a specific node in the detail stack graph with a payload patch and re-render.
 * @param {string} nodeId - The ID of the node to update.
 * @param {object} [payloadPatch={}] - Partial payload properties to merge into the node.
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
 * Refetch the ancestor path and re-render the detail stack graph.
 * Used after a moment status change to pick up rolled-up statusColor from the server.
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
 * Mount the detail stack graph visualization, loading D3 and building the ancestor tree.
 * @param {{nodeType: string, nodeId: string|number, owner: string, project: string}} config - Configuration specifying which node to focus on.
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

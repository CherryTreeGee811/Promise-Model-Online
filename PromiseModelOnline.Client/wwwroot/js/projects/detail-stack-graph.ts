import { getEpic, getJourneys, getEpicById } from '../epics/api.ts';
import { getFlow, getMoments, getFlowById } from '../flows/api.ts';
import { getJourney, getFlows, getJourneyById } from '../journeys/api.ts';
import { getMoment } from '../moments/api.ts';
import { getPromise, getEpicsByPromise, getPromiseById } from '../promises/api.ts';
import { getStatusBucket } from '../utils/status-utilities.ts';

import { getProject } from './api.ts';
import {
    computeChildMetrics,
    createNodeWithMetrics,
    findNodeById,
    getMomentEffortBucket,
    getMomentStrideBucket,
    normalizeText,
    parseGraphData,
    getDetailPageNodeScale,
    renderEmptyState,
    renderStackGraph,
} from './stack-graph-core.ts';

const STACK_NODE_TYPES = new Set(['promise', 'epic', 'journey', 'flow', 'moment']);

const _d3State: { promise: Promise<unknown> | undefined } = { promise: undefined };
const detailStackState: {
    tree: Record<string, unknown> | undefined;
    owner: string | undefined;
    project: string | undefined;
    focusNodeId: string | undefined;
    activeNodeType: string | undefined;
    activeNodeId: string | number | undefined;
    d3: unknown | undefined;
    mountToken: number;
} = {
    tree: undefined,
    owner: undefined,
    project: undefined,
    focusNodeId: undefined,
    activeNodeType: undefined,
    activeNodeId: undefined,
    d3: undefined,
    mountToken: 0,
};

/**
 * Load (or return cached) the D3 module instance from the window.
 * @returns {Promise<unknown>} A promise that resolves to the D3 module.
 */
export function loadD3(): Promise<unknown> {
    if (!_d3State.promise) {
        _d3State.promise = Promise.resolve((globalThis as Record<string, unknown>).d3);
    }
    return _d3State.promise;
}

/**
 * Get the detail stack graph container element.
 * @returns {HTMLElement } The container element, or null if not found.
 */
function getContainer(): HTMLElement | null {
    return document.querySelector('#detail-stack-graph');
}

/**
 * Render a loading spinner inside the container element.
 * @param {HTMLElement } container - The container element to render into.
 */
function renderLoadingSpinner(container: HTMLElement | null): void {
    if (!container) return;

     
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex h-100 w-100 align-items-center justify-content-center';
    wrapper.setAttribute('aria-live', 'polite');
    wrapper.setAttribute('aria-label', 'Loading detail stack graph');

    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-primary';
    spinner.setAttribute('role', 'status');

    const srText = document.createElement('span');
    srText.className = 'visually-hidden';
    srText.textContent = 'Loading detail stack graph...';

    spinner.append(srText);
    wrapper.append(spinner);
    container.replaceChildren(wrapper);
}

/**
 * Refresh the derived display fields on a node (label, search text, status/effort/stride buckets).
 * @param {Record<string, unknown>} node - The node to refresh.
 */
function refreshNodeDerivedFields(node: Record<string, unknown>): void {
    const payload = (node.payload ?? {}) as Record<string, unknown>;
    node.label = String(payload.statement ?? payload.name ?? `#${payload.id}`);
    node._searchText = normalizeText([node.label as string, payload.description as string].join(' '));
    node._statusBucket = getStatusBucket(payload?.statusColor as string);
    if (node.nodeType === 'moment') {
        node._effortBucket = getMomentEffortBucket(payload?.effortEstimate as string);
        node._strideBucket = getMomentStrideBucket(payload as { assignedStrideId?: string });
    }
}

/**
 *
 */
function rerenderDetailStackGraph(): void {
    const container = getContainer();
    if (!container || !detailStackState.tree || !detailStackState.d3) return;

    renderStackGraph(container, detailStackState.d3 as Record<string, unknown>, detailStackState.tree!, {
        owner: detailStackState.owner ?? undefined,
        project: detailStackState.project ?? undefined,
        focusNodeId: detailStackState.focusNodeId ?? undefined,
        enableZoom: false,
        enableLinks: true,
        compact: true,
        uniformNodeScale: getDetailPageNodeScale(detailStackState.activeNodeType ?? ''),
        viewportElement: container,
        clipPathIdPrefix: 'detail-stack-graph-clip',
        ariaLabel: 'Promise stack context',
        emptyMessage: 'Unable to display stack context.',
    });
}

interface PathEntities {
    moment: Record<string, unknown> | undefined;
    flow: Record<string, unknown> | undefined;
    journey: Record<string, unknown> | undefined;
    epic: Record<string, unknown> | undefined;
    promise: Record<string, unknown> | undefined;
    project: Record<string, unknown> | undefined;
}

/**
 * Fetch all ancestor entities along the path from a given node up to the project root.
 * @param {string} nodeType - The type of the starting node.
 * @param {string | number} nodeId - The ID of the starting node.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<PathEntities>} The ancestor entities keyed by type.
 */
async function fetchPathEntities(nodeType: string, nodeId: string | number, owner: string, project: string): Promise<PathEntities> {
    const numericId = Math.trunc(Number(nodeId));
    if (Number.isNaN(numericId)) {
        throw new TypeError(`Invalid ${nodeType} id`);
    }

    let moment: Record<string, unknown> | undefined;
    let flow: Record<string, unknown> | undefined;
    let journey: Record<string, unknown> | undefined;
    let epic: Record<string, unknown> | undefined;
    let promise: Record<string, unknown> | undefined;

    switch (nodeType) {
        case 'moment': {
            moment = await getMoment(owner, project, numericId) as Record<string, unknown>;
            flow = await getFlowById(owner, project, (moment as Record<string, unknown>).flowId as number) as Record<string, unknown>;
            break;
        }
        case 'flow': {
            flow = await getFlow(owner, project, numericId) as Record<string, unknown>;
            break;
        }
        case 'journey': {
            journey = await getJourney(owner, project, numericId) as Record<string, unknown>;
            break;
        }
        case 'epic': {
            epic = await getEpic(owner, project, numericId) as Record<string, unknown>;
            break;
        }
        case 'promise': {
            promise = await getPromise(owner, project, numericId) as Record<string, unknown>;
            break;
        }
    }

    // Traverse up the hierarchy from the fetched entity
    if (flow) {
        journey = await getJourneyById(owner, project, (flow as Record<string, unknown>).journeyId as number) as Record<string, unknown>;
    }
    if (journey) {
        epic = await getEpicById(owner, project, (journey as Record<string, unknown>).epicId as number) as Record<string, unknown>;
    }
    if (epic) {
        promise = await getPromiseById(owner, project, (epic as Record<string, unknown>).productPromiseId as number) as Record<string, unknown>;
    }

    let projectEntity: Record<string, unknown> | undefined;
    try {
        projectEntity = await getProject(owner, project) as Record<string, unknown>;
    } catch (error) {
        console.warn('Unable to load project for detail stack graph:', error);
    }

    return { moment, flow, journey, epic, promise, project: projectEntity };
}

interface ChildMetrics {
    childCount: number;
    completedChildCount: number;
}

/**
 * Fetch child metrics for each entity in the path.
 * @param {PathEntities} root0 - The path entities object.
 * @param {Record<string, unknown> } root0.moment - The moment entity.
 * @param {Record<string, unknown> } root0.flow - The flow entity.
 * @param {Record<string, unknown> } root0.journey - The journey entity.
 * @param {Record<string, unknown> } root0.epic - The epic entity.
 * @param {Record<string, unknown> } root0.promise - The promise entity.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<Record<string, ChildMetrics>>} The child metrics keyed by node type.
 */
async function fetchChildMetricsForPath({ moment, flow, journey, epic, promise }: PathEntities, owner: string, project: string): Promise<Record<string, ChildMetrics>> {
    const metrics: Record<string, ChildMetrics> = {};

    const fetches: Promise<void>[] = [];
    if (promise) {
        fetches.push((async () => {
            try {
                const items = await getEpicsByPromise(owner, project, (promise as Record<string, unknown>).sequenceNumber as string) as Record<string, unknown>[];
                metrics.promise = computeChildMetrics(items);
            } catch {
                metrics.promise = { childCount: 0, completedChildCount: 0 };
            }
        })());
    }
    if (epic) {
        fetches.push((async () => {
            try {
                const items = await getJourneys(owner, project, (epic as Record<string, unknown>).sequenceNumber as string) as Record<string, unknown>[];
                metrics.epic = computeChildMetrics(items);
            } catch {
                metrics.epic = { childCount: 0, completedChildCount: 0 };
            }
        })());
    }
    if (journey) {
        fetches.push((async () => {
            try {
                const items = await getFlows(owner, project, (journey as Record<string, unknown>).sequenceNumber as string) as Record<string, unknown>[];
                metrics.journey = computeChildMetrics(items);
            } catch {
                metrics.journey = { childCount: 0, completedChildCount: 0 };
            }
        })());
    }
    if (flow) {
        fetches.push((async () => {
            try {
                const items = await getMoments(owner, project, (flow as Record<string, unknown>).sequenceNumber as string) as Record<string, unknown>[];
                metrics.flow = computeChildMetrics(items);
            } catch {
                metrics.flow = { childCount: 0, completedChildCount: 0 };
            }
        })());
    }

    await Promise.all(fetches);
    return metrics;
}

/**
 * Wrap a node with a single child node.
 * @param {Record<string, unknown>} node - The parent node.
 * @param {Record<string, unknown> } child - The child node to wrap, or null for no children.
 * @returns {Record<string, unknown>} The wrapped node with children array.
 */
function wrapWithChild(node: Record<string, unknown>, child: Record<string, unknown> | undefined): Record<string, unknown> {
    return {
        ...node,
        children: child ? [child] : [],
    };
}

/**
 * Build a linear ancestor tree from path entities and their child metrics.
 * @param {PathEntities} pathEntities - The ancestor entities keyed by type.
 * @param {Record<string, ChildMetrics>} metrics - The child metrics keyed by node type.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Record<string, unknown> | undefined} The constructed tree, or undefined if no entities exist.
 */
function buildLinearTree(pathEntities: PathEntities, metrics: Record<string, ChildMetrics>, owner: string, project: string): Record<string, unknown> | undefined {
    const { moment, flow, journey, epic, promise } = pathEntities;

    let tip: Record<string, unknown> | undefined = moment ? createNodeWithMetrics('moment', moment) as Record<string, unknown> : undefined;
    if (flow) {
        tip = wrapWithChild(createNodeWithMetrics('flow', flow, metrics.flow) as Record<string, unknown>, tip);
    }
    if (journey) {
        tip = wrapWithChild(createNodeWithMetrics('journey', journey, metrics.journey) as Record<string, unknown>, tip);
    }
    if (epic) {
        tip = wrapWithChild(createNodeWithMetrics('epic', epic, metrics.epic) as Record<string, unknown>, tip);
    }
    if (promise) {
        tip = wrapWithChild(createNodeWithMetrics('promise', promise, metrics.promise) as Record<string, unknown>, tip);
    }

    if (!tip) return;

    if (owner && project) {
        return parseGraphData([tip], owner, project, pathEntities.project ?? undefined);
    }

    return {
        id: 'root-unknown',
        nodeType: 'root',
        label: 'Project',
        payload: { id: undefined, name: 'Project' },
        children: [tip],
    };
}

/**
 * Fetch and build a linear ancestor-path tree from the given node up to the project root.
 * @param {string} nodeType - The type of the starting node (promise, epic, journey, flow, moment).
 * @param {string | number} nodeId - The ID of the starting node.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @returns {Promise<{ tree: Record<string, unknown> | null; focusNodeId: string | null }>} The tree data and the focus node ID for the starting node.
 */
async function buildAncestorPathTree(nodeType: string, nodeId: string | number, owner: string, project: string): Promise<{ tree: Record<string, unknown> | undefined; focusNodeId: string }> {
    if (!STACK_NODE_TYPES.has(nodeType)) {
        throw new Error(`Unsupported node type: ${nodeType}`);
    }

    const pathEntities = await fetchPathEntities(nodeType, nodeId, owner, project);
    const metrics = await fetchChildMetricsForPath(pathEntities, owner, project);

    const focusEntity = pathEntities[nodeType as keyof PathEntities];
    const focusSeq = (focusEntity as Record<string, unknown> | undefined)?.sequenceNumber ?? nodeId;

    return {
        tree: buildLinearTree(pathEntities, metrics, owner, project),
        focusNodeId: `${nodeType}-${focusSeq}`,
    };
}

/**
 * Destroy the detail stack graph, clearing state and removing rendered content.
 */
export function destroyDetailStackGraph(): void {
    detailStackState.mountToken += 1;
    delete detailStackState.tree;
    delete detailStackState.owner;
    delete detailStackState.project;
    delete detailStackState.focusNodeId;
    delete detailStackState.activeNodeType;
    delete detailStackState.activeNodeId;
    delete detailStackState.d3;

    const container = getContainer();
    if (container) {
        container.classList.remove('detail-stack-graph--loading');
        container.replaceChildren();
    }
}

/**
 * Update the child metrics (count and completed count) for a given node in the detail stack graph.
 * @param {string} nodeId - The node ID to patch.
 * @param {Record<string, unknown>[]} children - The child entities to compute metrics from.
 */
export function patchChildMetrics(nodeId: string, children: Record<string, unknown>[]): void {
    const metrics = computeChildMetrics(children);
    patchDetailStackGraphNode(nodeId, {
        _childCount: metrics.childCount,
        _completedChildCount: metrics.completedChildCount,
    });
}


/**
 * Apply a partial payload update to a node in the detail stack graph and re-render.
 * @param {string} nodeId - The node ID to patch.
 * @param {Record<string, unknown>} [payloadPatch] - The partial payload properties to merge in.
 */
export function patchDetailStackGraphNode(nodeId: string, payloadPatch: Record<string, unknown> = {}): void {
    if (!detailStackState.tree || !nodeId) return;

    const node = findNodeById(detailStackState.tree, nodeId) as Record<string, unknown> | null;
    if (!node) return;

    node.payload = { ...(node.payload as Record<string, unknown>), ...payloadPatch };
    if (payloadPatch._childCount !== undefined) {
        node.childCount = payloadPatch._childCount as number;
    }
    if (payloadPatch._completedChildCount !== undefined) {
        node.completedChildCount = payloadPatch._completedChildCount as number;
    }
    refreshNodeDerivedFields(node);
    rerenderDetailStackGraph();
}

/**
 * Refresh the detail stack graph by re-fetching the ancestor path tree for the active node.
 * @returns {Promise<void>} Resolves when the graph is re-rendered.
 */
export async function refreshDetailStackGraph(): Promise<void> {
    const { activeNodeType, activeNodeId, owner, project, d3 } = detailStackState;
    if (!activeNodeType || activeNodeId === undefined || !d3) return;

    try {
        const pathResult = await buildAncestorPathTree(activeNodeType, activeNodeId, owner!, project!);
        detailStackState.tree = pathResult.tree;
        detailStackState.focusNodeId = pathResult.focusNodeId;
        rerenderDetailStackGraph();
    } catch (error) {
        console.error('Unable to refresh detail stack graph:', error);
    }
}

/**
 * Mount the detail stack graph for a given node, fetching ancestor path and rendering with D3.
 * @param {{ nodeType: string; nodeId: string | number; owner: string; project: string }} root0 - The mount options.
 * @param {string} root0.nodeType - The node type of the active detail entity.
 * @param {string | number} root0.nodeId - The node ID of the active detail entity.
 * @param {string} root0.owner - The project owner's slug.
 * @param {string} root0.project - The project's slug.
 * @returns {Promise<void>} Resolves when the graph is mounted and rendered.
 */
export async function mountDetailStackGraph({ nodeType, nodeId, owner, project }: { nodeType: string; nodeId: string | number; owner: string; project: string }): Promise<void> {
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

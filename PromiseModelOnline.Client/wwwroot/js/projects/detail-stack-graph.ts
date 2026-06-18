// @ts-nocheck
import { getEpic, getJourneys, getEpicById } from '../epics/api.ts';
import { getFlow, getMoments, getFlowById } from '../flows/api.ts';
import { getJourney, getFlows, getJourneyById } from '../journeys/api.ts';
import { getMoment } from '../moments/api.ts';
import { getPromise, getEpicsByPromise, getPromiseById } from '../promises/api.ts';

import { getProject } from './api.ts';
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
} from './stack-graph-core.ts';

const STACK_NODE_TYPES = ['promise', 'epic', 'journey', 'flow', 'moment'];

let d3Promise: Promise<unknown> | null = null;
const detailStackState: {
    tree: Record<string, unknown> | null;
    owner: string | null;
    project: string | null;
    focusNodeId: string | null;
    activeNodeType: string | null;
    activeNodeId: string | number | null;
    d3: unknown | null;
    mountToken: number;
} = {
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
 * Load (or return cached) the D3 module instance from the window.
 * @returns A promise that resolves to the D3 module.
 */
export function loadD3(): Promise<unknown> {
    if (!d3Promise) {
        d3Promise = Promise.resolve((window as Record<string, unknown>).d3);
    }
    return d3Promise;
}

/**
 *
 */
function getContainer(): HTMLElement | null {
    return document.getElementById('detail-stack-graph');
}

/**
 *
 * @param container
 */
function renderLoadingSpinner(container: HTMLElement | null): void {
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
 *
 * @param node
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

    renderStackGraph(container, detailStackState.d3, detailStackState.tree, {
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
    moment: Record<string, unknown> | null;
    flow: Record<string, unknown> | null;
    journey: Record<string, unknown> | null;
    epic: Record<string, unknown> | null;
    promise: Record<string, unknown> | null;
    project: Record<string, unknown> | null;
}

/**
 *
 * @param nodeType
 * @param nodeId
 * @param owner
 * @param project
 */
async function fetchPathEntities(nodeType: string, nodeId: string | number, owner: string, project: string): Promise<PathEntities> {
    const numericId = Number.parseInt(String(nodeId), 10);
    if (Number.isNaN(numericId)) {
        throw new Error(`Invalid ${nodeType} id`);
    }

    let moment: Record<string, unknown> | null = null;
    let flow: Record<string, unknown> | null = null;
    let journey: Record<string, unknown> | null = null;
    let epic: Record<string, unknown> | null = null;
    let promise: Record<string, unknown> | null = null;

    switch (nodeType) {
        case 'moment': {
            moment = await getMoment(owner, project, numericId);
            flow = await getFlowById(owner, project, (moment as Record<string, unknown>).flowId as number);
            journey = await getJourneyById(owner, project, (flow as Record<string, unknown>).journeyId as number);
            epic = await getEpicById(owner, project, (journey as Record<string, unknown>).epicId as number);
            promise = await getPromiseById(owner, project, (epic as Record<string, unknown>).productPromiseId as number);
            break;
        }
        case 'flow': {
            flow = await getFlow(owner, project, numericId);
            journey = await getJourneyById(owner, project, (flow as Record<string, unknown>).journeyId as number);
            epic = await getEpicById(owner, project, (journey as Record<string, unknown>).epicId as number);
            promise = await getPromiseById(owner, project, (epic as Record<string, unknown>).productPromiseId as number);
            break;
        }
        case 'journey': {
            journey = await getJourney(owner, project, numericId);
            epic = await getEpicById(owner, project, (journey as Record<string, unknown>).epicId as number);
            promise = await getPromiseById(owner, project, (epic as Record<string, unknown>).productPromiseId as number);
            break;
        }
        case 'epic': {
            epic = await getEpic(owner, project, numericId);
            promise = await getPromiseById(owner, project, (epic as Record<string, unknown>).productPromiseId as number);
            break;
        }
        case 'promise': {
            promise = await getPromise(owner, project, numericId);
            break;
        }
        default:
            throw new Error(`Unsupported node type: ${nodeType}`);
    }

    let projectEntity: Record<string, unknown> | null = null;
    try {
        projectEntity = await getProject(owner, project);
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
 *
 * @param root0
 * @param root0.moment
 * @param root0.flow
 * @param root0.journey
 * @param root0.epic
 * @param root0.promise
 * @param owner
 * @param project
 */
async function fetchChildMetricsForPath({ moment, flow, journey, epic, promise }: PathEntities, owner: string, project: string): Promise<Record<string, ChildMetrics>> {
    const metrics: Record<string, ChildMetrics> = {};

    const fetches: Promise<void>[] = [];
    if (promise) {
        fetches.push(
            getEpicsByPromise(owner, project, (promise as Record<string, unknown>).sequenceNumber as string)
                .then(items => { metrics.promise = computeChildMetrics(items); })
                .catch(() => { metrics.promise = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (epic) {
        fetches.push(
            getJourneys(owner, project, (epic as Record<string, unknown>).sequenceNumber as string)
                .then(items => { metrics.epic = computeChildMetrics(items); })
                .catch(() => { metrics.epic = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (journey) {
        fetches.push(
            getFlows(owner, project, (journey as Record<string, unknown>).sequenceNumber as string)
                .then(items => { metrics.journey = computeChildMetrics(items); })
                .catch(() => { metrics.journey = { childCount: 0, completedChildCount: 0 }; })
        );
    }
    if (flow) {
        fetches.push(
            getMoments(owner, project, (flow as Record<string, unknown>).sequenceNumber as string)
                .then(items => { metrics.flow = computeChildMetrics(items); })
                .catch(() => { metrics.flow = { childCount: 0, completedChildCount: 0 }; })
        );
    }

    await Promise.all(fetches);
    return metrics;
}

/**
 *
 * @param node
 * @param child
 */
function wrapWithChild(node: Record<string, unknown>, child: Record<string, unknown> | null): Record<string, unknown> {
    return {
        ...node,
        children: child ? [child] : [],
    };
}

/**
 *
 * @param pathEntities
 * @param metrics
 * @param owner
 * @param project
 */
function buildLinearTree(pathEntities: PathEntities, metrics: Record<string, ChildMetrics>, owner: string, project: string): Record<string, unknown> | null {
    const { moment, flow, journey, epic, promise } = pathEntities;

    let tip: Record<string, unknown> | null = null;
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
        return parseGraphData([tip], owner, project, pathEntities.project ?? undefined);
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
 * Fetch and build a linear ancestor-path tree from the given node up to the project root.
 * @param nodeType - The type of the starting node (promise, epic, journey, flow, moment).
 * @param nodeId - The ID of the starting node.
 * @param owner - The project owner's slug.
 * @param project - The project's slug.
 * @returns The tree data and the focus node ID for the starting node.
 */
export async function buildAncestorPathTree(nodeType: string, nodeId: string | number, owner: string, project: string): Promise<{ tree: Record<string, unknown> | null; focusNodeId: string | null }> {
    if (!STACK_NODE_TYPES.includes(nodeType)) {
        throw new Error(`Unsupported node type: ${nodeType}`);
    }

    const pathEntities = await fetchPathEntities(nodeType, nodeId, owner, project);
    const metrics = await fetchChildMetricsForPath(pathEntities, owner, project);

    const focusEntity = pathEntities[nodeType as keyof PathEntities];
    const focusSeq = (focusEntity as Record<string, unknown> | null)?.sequenceNumber ?? nodeId;

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
    detailStackState.tree = null;
    detailStackState.owner = null;
    detailStackState.project = null;
    detailStackState.focusNodeId = null;
    detailStackState.activeNodeType = null;
    detailStackState.activeNodeId = null;
    detailStackState.d3 = null;

    const container = getContainer();
    if (container) {
        container.classList.remove('detail-stack-graph--loading');
        container.replaceChildren();
    }
}

/**
 * Update the child metrics (count and completed count) for a given node in the detail stack graph.
 * @param nodeId - The node ID to patch.
 * @param children - The child entities to compute metrics from.
 */
export function patchChildMetrics(nodeId: string, children: Record<string, unknown>[]): void {
    const metrics = computeChildMetrics(children);
    patchDetailStackGraphNode(nodeId, {
        _childCount: metrics.childCount,
        _completedChildCount: metrics.completedChildCount,
    });
}

/**
 * Map a moment status string to a color name for display.
 * @param status - The status value (Done, InProgress, Blocked, Todo).
 * @returns The corresponding color name (green, orange, black, red).
 */
export function momentStatusToColor(status: string): string {
    switch (String(status ?? '')) {
        case 'Done': return 'green';
        case 'InProgress': return 'orange';
        case 'Blocked': return 'black';
        case 'Todo':
        default: return 'red';
    }
}

/**
 * Apply a partial payload update to a node in the detail stack graph and re-render.
 * @param nodeId - The node ID to patch.
 * @param payloadPatch - The partial payload properties to merge in.
 */
export function patchDetailStackGraphNode(nodeId: string, payloadPatch: Record<string, unknown> = {}): void {
    if (!detailStackState.tree || !nodeId) return;

    const node = findNodeById(detailStackState.tree, nodeId) as Record<string, unknown> | null;
    if (!node) return;

    node.payload = { ...(node.payload as Record<string, unknown>), ...payloadPatch };
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
 * Refresh the detail stack graph by re-fetching the ancestor path tree for the active node.
 * @returns Resolves when the graph is re-rendered.
 */
export async function refreshDetailStackGraph(): Promise<void> {
    const { activeNodeType, activeNodeId, owner, project, d3 } = detailStackState;
    if (!activeNodeType || activeNodeId == null || !d3) return;

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
 * @param options.nodeType - The node type of the active detail entity.
 * @param root0
 * @param root0.nodeType
 * @param options.nodeId - The node ID of the active detail entity.
 * @param root0.nodeId
 * @param options.owner - The project owner's slug.
 * @param root0.owner
 * @param options.project - The project's slug.
 * @param root0.project
 * @returns Resolves when the graph is mounted and rendered.
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

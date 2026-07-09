import { hasNodeChildren, createDefaultFilters } from './graph-core.ts';
import type { GraphFilters, GraphNode } from './graph-core.ts';
import { findNodeById } from './stack-graph-core.ts';

interface StrideInfo {
    id: number | string;
    name?: string;
    startDate?: string;
}

interface GraphState {
    owner: string | null | undefined;
    project: string | null | undefined;
    d3: unknown;
    rawTree: GraphNode | null | undefined;
    filteredTree: GraphNode | null | undefined;
    totalRenderableNodes: number;
    availableStrides: StrideInfo[];
    filters: GraphFilters;
    zoomTransform: unknown;
    userZoomTransform: unknown;
    focusNodeId: string | null | undefined;
    suppressZoomStateUpdate: boolean;
    zoomBehavior: unknown;
    filterDebounceId: number | null | undefined;
    applyTimer: number | null | undefined;
    contextMenu: unknown;
    pageShowRefreshHandler: ((event: PageTransitionEvent) => void) | null | undefined;
    collapsedNodeIds: Set<string>;
    hasRendered: boolean;
    animationSpeed: number;
    _onFullscreenChange?: (() => void) | null;
}

const graphState: GraphState = {
    owner: undefined,
    project: undefined,
    d3: undefined,
    rawTree: undefined,
    filteredTree: undefined,
    totalRenderableNodes: 0,
    availableStrides: [],
    filters: createDefaultFilters(),
    zoomTransform: undefined,
    userZoomTransform: undefined,
    focusNodeId: undefined,
    suppressZoomStateUpdate: false,
    zoomBehavior: undefined,
    filterDebounceId: undefined,
    applyTimer: undefined,
    contextMenu: undefined,
    pageShowRefreshHandler: undefined,
    collapsedNodeIds: new Set(),
    hasRendered: false,
    animationSpeed: 0.25,
};

/**
 * Check whether a node is collapsed.
 * @param {string} nodeId - The node's ID.
 * @returns {boolean} True if the node is in the collapsed set.
 */
function isNodeCollapsed(nodeId: string): boolean {
    return Boolean(nodeId) && graphState.collapsedNodeIds.has(nodeId);
}

/**
 * Set a node's collapsed state by adding or removing it from the collapsed set.
 * @param {string} nodeId - The node's ID.
 * @param {boolean} isCollapsed - True to collapse, false to expand.
 */
function setNodeCollapsed(nodeId: string, isCollapsed: boolean): void {
    if (!nodeId) return;

    if (isCollapsed) {
        graphState.collapsedNodeIds.add(nodeId);
    } else {
        graphState.collapsedNodeIds.delete(nodeId);
    }
}

/**
 * Remove stale entries from the collapsed nodes set.
 * Entries for nodes that no longer exist or no longer have children are removed.
 */
function reconcileCollapsedNodes(): void {
    if (!graphState.rawTree) {
        graphState.collapsedNodeIds.clear();
        return;
    }

    const reconciled = new Set<string>();
    for (const nodeId of graphState.collapsedNodeIds) {
        const node = findNodeById(graphState.rawTree, nodeId) as unknown as GraphNode | null | undefined;
        if (node && hasNodeChildren(node)) {
            reconciled.add(nodeId);
        }
    }
    graphState.collapsedNodeIds = reconciled;

}

/**
 * Collapse all root-level promise nodes that have children.
 */
function collapseAllBelowPromises(): void {
    if (!graphState.rawTree) return;

    const nextCollapsed = new Set<string>();
    const rawChildren = graphState.rawTree.children ?? [];
    for (const promiseNode of rawChildren) {
        if (hasNodeChildren(promiseNode)) {
            nextCollapsed.add(promiseNode.id);
        }
    }

    graphState.collapsedNodeIds = nextCollapsed;
}

/**
 * Reveal the next level of children beneath a node.
 * The target node is expanded, and its children that have grandchildren are collapsed.
 * @param {GraphNode} nodeData - The node whose next level to reveal.
 */
function revealNextLevel(nodeData: GraphNode): void {
    if (!graphState.rawTree || !nodeData?.id) return;

    const node = findNodeById(graphState.rawTree, nodeData.id) as unknown as GraphNode | null | undefined;
    if (!node) return;

    setNodeCollapsed(node.id, false);

    const nodeChildren = node.children ?? [];
    for (const child of nodeChildren) {
        if (hasNodeChildren(child)) {
            setNodeCollapsed(child.id, true);
        }
    }
}

/**
 * Expand all collapsed nodes by clearing the collapsed set.
 */
function expandAllNodes(): void {
    graphState.collapsedNodeIds.clear();
}

export type { StrideInfo, GraphState };
export {
    graphState,
    isNodeCollapsed,
    setNodeCollapsed,
    reconcileCollapsedNodes,
    collapseAllBelowPromises,
    revealNextLevel,
    expandAllNodes,
};

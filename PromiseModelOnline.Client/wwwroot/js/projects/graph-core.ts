import { getUserId } from '../auth-state.ts';
import { getStatusBucket } from '../utils/status-utilities.ts';

import {
    NODE_TYPES,
    NODE_TYPE_INDEX,
    normalizeText,
    getNodeSearchText,
    getMomentEffortBucket,
    getMomentStrideBucket,
    createNode,
    countRenderableNodes,
} from './stack-graph-core.ts';

export interface GraphFilters {
    search: string;
    includeChildren: boolean;
    types: Set<string>;
    effort: string;
    stride: string;
    status: string;
    assignment: string;
}

export interface FilterMetrics {
    visibleNodes: number;
    directMatches: number;
    hiddenNodes: number;
}

export interface GraphNode {
    id: string;
    nodeType: string;
    children?: GraphNode[];
    payload?: Record<string, unknown>;
    _searchText?: string;
    _statusBucket?: string;
    _effortBucket?: string;
    _strideBucket?: string;
    _isSearchMatched?: boolean;
    _isCollapsed?: boolean;
    _hiddenDescendantCount?: number;
    [key: string]: unknown;
}

export const ASSIGNED_TO_ME = 'assigned-to-me';

/**
 * @param {GraphNode} node - The node to check
 * @returns {boolean} Whether the node has children
 */
export function hasNodeChildren(node: GraphNode): boolean {
    return Array.isArray(node?.children) && node.children.length > 0;
}

/**
 * @param {GraphNode} node - The node to check
 * @returns {number} The count of hidden descendant nodes
 */
export function getHiddenDescendantCount(node: GraphNode): number {
    if (!hasNodeChildren(node)) return 0;
    return node.children!.reduce((sum, child) => sum + countRenderableNodes(child), 0);
}

/**
 * @returns {GraphFilters} A new filter set with default values
 */
export function createDefaultFilters(): GraphFilters {
    return {
        search: '',
        includeChildren: false,
        types: new Set(NODE_TYPES),
        effort: 'all',
        stride: 'all',
        status: 'all',
        assignment: 'all',
    };
}

/**
 * @param {string|null} value - The comma-separated type list
 * @returns {Set<string>} The parsed set of node types
 */
export function parseTypeList(value: string | null): Set<string> {
    if (value === null) return new Set(NODE_TYPES);

    const types = new Set<string>();
    for (const item of value.split(',')) {
        const type = normalizeText(item);
        if (NODE_TYPES.includes(type as never)) {
            types.add(type);
        }
    }

    return normalizeTypeSelection(types);
}

/**
 * @param {Set<string>} types - The set of types to normalize
 * @returns {Set<string>} The normalized contiguous range of types
 */
export function normalizeTypeSelection(types: Set<string>): Set<string> {
    const selected = [...types ?? []].filter(type => NODE_TYPE_INDEX.has(type as never));
    if (selected.length === 0) return new Set();

    const selectedIndexes = selected.map(type => NODE_TYPE_INDEX.get(type as never) as number);
    const minIndex = Math.min(...selectedIndexes);
    const maxIndex = Math.max(...selectedIndexes);

    return new Set(NODE_TYPES.slice(minIndex, maxIndex + 1));
}

/**
 * @param {string} value - The raw status filter value
 * @returns {string} The normalized status filter value
 */
export function getStatusFilterValue(value: string): string {
    const normalized = normalizeText(value);
    if (!normalized || normalized === 'all') return 'all';
    if (['done', 'blocked', 'inprogress', 'todo', 'other'].includes(normalized)) return normalized;
    if (normalized.includes('green') || normalized.includes('done')) return 'done';
    if (normalized.includes('black') || normalized.includes('blocked')) return 'blocked';
    if (normalized.includes('orange') || normalized.includes('yellow') || normalized.includes('amber') || normalized.includes('inprogress') || normalized.includes('in-progress')) return 'inprogress';
    if (normalized.includes('red') || normalized.includes('todo')) return 'todo';
    return 'other';
}

/**
 * @param {string} value - The raw assignment filter value
 * @returns {string} The normalized assignment filter value
 */
export function getAssignmentFilterValue(value: string): string {
    const normalized = normalizeText(value);
    if (normalized === ASSIGNED_TO_ME) return ASSIGNED_TO_ME;
    return 'all';
}

/**
 * @param {string} value - The raw effort filter value
 * @returns {string} The normalized effort filter value
 */
export function getEffortFilterValue(value: string): string {
    const normalized = normalizeText(value);
    if (normalized === 'all' || normalized === 'unestimated') return normalized;
    if (['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'].includes(normalized)) return normalized.toUpperCase();
    return 'all';
}

/**
 * @param {string} value - The raw stride filter value
 * @returns {string} The normalized stride filter value
 */
export function getStrideFilterValue(value: string): string {
    const normalized = normalizeText(value);
    if (normalized === 'all' || normalized === 'backlog') return normalized;
    if (/^\d+$/.test(normalized)) return normalized;
    return 'all';
}

/**
 * @param {string} nodeType - The node type key
 * @returns {string} The human-readable label
 */
export function getTypeShortLabel(nodeType: string): string {
    switch (nodeType) {
        case 'promise': { return 'Promise'; }
        case 'epic': { return 'Epic'; }
        case 'journey': { return 'Journey'; }
        case 'flow': { return 'Flow'; }
        case 'moment': { return 'Moment'; }
        default: { return nodeType; }
    }
}

/**
 * @param {Record<string, unknown>} moment - The moment data
 * @returns {GraphNode} The constructed moment node
 */
export function buildMomentNode(moment: Record<string, unknown>): GraphNode {
    return createNode('moment', moment, []) as unknown as GraphNode;
}

/**
 * @param {Record<string, unknown>} flow - The flow data
 * @returns {GraphNode} The constructed flow node
 */
export function buildFlowNode(flow: Record<string, unknown>): GraphNode {
    const moments = ((flow.moments ?? []) as Record<string, unknown>[]).map(x => buildMomentNode(x));
    return createNode('flow', flow, moments) as unknown as GraphNode;
}

/**
 * @param {Record<string, unknown>} journey - The journey data
 * @returns {GraphNode} The constructed journey node
 */
export function buildJourneyNode(journey: Record<string, unknown>): GraphNode {
    const flows = ((journey.flows ?? []) as Record<string, unknown>[]).map(x => buildFlowNode(x));
    return createNode('journey', journey, flows) as unknown as GraphNode;
}

/**
 * @param {Record<string, unknown>} epic - The epic data
 * @returns {GraphNode} The constructed epic node
 */
export function buildEpicNode(epic: Record<string, unknown>): GraphNode {
    const journeys = ((epic.journeys ?? []) as Record<string, unknown>[]).map(x => buildJourneyNode(x));
    return createNode('epic', epic, journeys) as unknown as GraphNode;
}

/**
 * @param {Record<string, unknown>} promise - The promise data
 * @returns {GraphNode} The constructed promise node
 */
export function buildPromiseNode(promise: Record<string, unknown>): GraphNode {
    const epics = ((promise.epics ?? []) as Record<string, unknown>[]).map(x => buildEpicNode(x));
    return createNode('promise', promise, epics) as unknown as GraphNode;
}

/**
 * @param {GraphNode} node - The node to check
 * @param {string} search - The search string
 * @returns {boolean} Whether the node matches the search
 */
export function isNodeSearchMatching(node: GraphNode, search: string): boolean {
    if (!search) return true;
    const searchText = node._searchText ?? getNodeSearchText(node) as string;
    return searchText.includes(search);
}

/**
 * @param {GraphNode} node - The node to check
 * @param {string} status - The status to match
 * @returns {boolean} Whether the node matches the status filter
 */
export function isNodeStatusMatching(node: GraphNode, status: string): boolean {
    if (status === 'all') return true;
    const statusBucket = node._statusBucket ?? getStatusBucket(node.payload?.statusColor as string) as string;
    return statusBucket === status;
}

/**
 * @param {GraphNode} node - The node to check
 * @param {string} assignment - The assignment filter value
 * @returns {boolean} Whether the node matches the assignment filter
 */
function isNodeAssignmentMatching(node: GraphNode, assignment: string): boolean {
    if (assignment !== ASSIGNED_TO_ME) return true;
    if (node.nodeType !== 'moment') return false;
    const currentUserId = getUserId();
    if (currentUserId === null) return false;
    return node.payload?.ownerId === currentUserId;
}

/**
 * @param {GraphNode} node - The node to check
 * @param {string} effort - The effort filter value
 * @returns {boolean} Whether the node matches the effort filter
 */
export function isNodeEffortMatching(node: GraphNode, effort: string): boolean {
    if (effort === 'all') return true;
    if (node.nodeType !== 'moment') return false;
    const effortBucket = node._effortBucket ?? getMomentEffortBucket(node.payload?.effortEstimate) as string;
    return effort === effortBucket;
}

/**
 * @param {GraphNode} node - The node to check
 * @param {string} stride - The stride filter value
 * @returns {boolean} Whether the node matches the stride filter
 */
export function isNodeStrideMatching(node: GraphNode, stride: string): boolean {
    if (stride === 'all') return true;
    if (node.nodeType !== 'moment') return false;
    const strideBucket = node._strideBucket ?? getMomentStrideBucket(node.payload) as string;
    return stride === strideBucket;
}

/**
 * @param {GraphNode} node - The node to check
 * @param {GraphFilters} filters - The active filters
 * @returns {boolean} Whether the node matches all active filters
 */
function isNodeMatching(node: GraphNode, filters: GraphFilters): boolean {
    if (node.nodeType === 'root') return false;
    if (!filters.types.has(node.nodeType as string)) return false;
    if (!isNodeSearchMatching(node, filters.search)) return false;
    if (!isNodeStatusMatching(node, filters.status)) return false;
    if (!isNodeAssignmentMatching(node, filters.assignment)) return false;
    if (!isNodeEffortMatching(node, filters.effort)) return false;
    return isNodeStrideMatching(node, filters.stride);
}

/**
 * @param {GraphNode} node - The node to clone
 * @param {object} metrics - Metrics accumulator
 * @param {number} metrics.visibleNodes - The count of visible nodes
 * @param {number} metrics.hiddenNodes - The count of hidden nodes
 * @param {Set<string>} collapsedIds - The set of collapsed node IDs
 * @returns {GraphNode} The cloned subtree node
 */
export function cloneSubtree(node: GraphNode, metrics: { visibleNodes: number; hiddenNodes: number }, collapsedIds: Set<string>): GraphNode {
    if (node.nodeType !== 'root') {
        metrics.visibleNodes += 1;
    }

    const isCollapsed = collapsedIds.has(node.id);
    const hiddenDescendantCount = isCollapsed ? getHiddenDescendantCount(node) : 0;

    if (hiddenDescendantCount > 0) {
        metrics.hiddenNodes += hiddenDescendantCount;
    }

    return {
        ...node,
        _isSearchMatched: false,
        _isCollapsed: isCollapsed,
        _hiddenDescendantCount: hiddenDescendantCount,
        children: isCollapsed ? [] : (node.children ?? []).map(child => cloneSubtree(child, metrics, collapsedIds)),
    };
}

/**
 * @param {GraphNode} node - The node to check
 * @param {GraphFilters} filters - The active filters
 * @returns {boolean} Whether the node is a search match
 */
function isSearchMatch(node: GraphNode, filters: GraphFilters): boolean {
    return !!filters.search && (node._searchText ?? getNodeSearchText(node) as string).includes(filters.search);
}

/**
 * @param {GraphNode} node - The parent node
 * @param {GraphFilters} filters - The active filters
 * @param {FilterMetrics} metrics - Metrics accumulator
 * @param {Set<string>} collapsedIds - The set of collapsed node IDs
 * @returns {GraphNode[]} The filtered children array
 */
function filterChildren(node: GraphNode, filters: GraphFilters, metrics: FilterMetrics, collapsedIds: Set<string>): GraphNode[] {
    return (node.children ?? [])
        .map(child => filterTree(child, filters, metrics, false, collapsedIds))
        .filter(Boolean) as unknown as GraphNode[];
}

/**
 * @param {GraphNode} node - The node to filter
 * @param {GraphFilters} filters - The active filters
 * @param {FilterMetrics} metrics - Metrics accumulator
 * @param {boolean} [isRoot] - Whether this is the root node
 * @param {Set<string>} collapsedIds - The set of collapsed node IDs
 * @returns {GraphNode|null|undefined} The filtered node or null/undefined if filtered out
 */
export function filterTree(node: GraphNode, filters: GraphFilters, metrics: FilterMetrics, isRoot: boolean = false, collapsedIds: Set<string>): GraphNode | null | undefined {
    const isCollapsed = collapsedIds.has(node.id);
    const hiddenDescendantCount = isCollapsed ? getHiddenDescendantCount(node) : 0;
    const isSearchMatched = !isRoot && isSearchMatch(node, filters);

    if (isSearchMatched && filters.includeChildren && !isCollapsed) {
        metrics.directMatches += 1;
        return {
            ...cloneSubtree(node, metrics, collapsedIds),
            _isSearchMatched: true,
        };
    }

    if (hiddenDescendantCount > 0) {
        metrics.hiddenNodes += hiddenDescendantCount;
    }

    const filteredChildren = isCollapsed ? [] : filterChildren(node, filters, metrics, collapsedIds);
    const isSelfMatches = !isRoot && isNodeMatching(node, filters);
    if (isSelfMatches) {
        metrics.directMatches += 1;
    }

    if (isRoot) {
        return {
            ...node,
            _isSearchMatched: false,
            _isCollapsed: isCollapsed,
            _hiddenDescendantCount: hiddenDescendantCount,
            children: filteredChildren,
        };
    }

    if (isSelfMatches || filteredChildren.length > 0) {
        metrics.visibleNodes += 1;
        return {
            ...node,
            _isSearchMatched: Boolean(isSearchMatched && filters.search),
            _isCollapsed: isCollapsed,
            _hiddenDescendantCount: hiddenDescendantCount,
            children: filteredChildren,
        };
    }

}

/**
 * @param {GraphNode} treeData - The tree data to search
 * @returns {GraphNode|undefined} The first node with a search match, or undefined
 */
export function findFirstSearchMatch(treeData: GraphNode): GraphNode | undefined {
    if (!treeData) return;

    if (treeData._isSearchMatched) {
        return treeData;
    }

    const treeChildren = treeData.children ?? [];
    for (const child of treeChildren) {
        const match = findFirstSearchMatch(child);
        if (match) {
            return match;
        }
    }

}

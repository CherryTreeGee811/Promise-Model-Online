import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts', async () => {
    const actual = await vi.importActual<object>('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
    return {
        ...actual,
        renderStackGraph: vi.fn(),
        renderEmptyState: vi.fn(),
        logGraphFocus: vi.fn(),
    };
});

function makeNode(id: string, childCount = 0, depth = 0) {
    const children: Array<ReturnType<typeof makeNode>> = [];
    if (depth > 0) {
        for (let i = 0; i < childCount; i++) {
            children.push(makeNode(`${id}-${i}`, childCount, depth - 1));
        }
    }
    return { id, children, nodeType: 'promise', payload: {} };
}

let graphState: { collapsedNodeIds: Set<string>; rawTree: unknown };
let isNodeCollapsed: (nodeId: string) => boolean;
let setNodeCollapsed: (nodeId: string, isCollapsed: boolean) => void;
let reconcileCollapsedNodes: () => void;
let collapseAllBelowPromises: () => void;
let revealNextLevel: (nodeData: { id?: string }) => void;
let expandAllNodes: () => void;

beforeEach(async () => {
    const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-state.ts');
    graphState = mod.graphState as { collapsedNodeIds: Set<string>; rawTree: unknown };
    graphState.collapsedNodeIds = new Set();
    graphState.rawTree = null;
    isNodeCollapsed = mod.isNodeCollapsed;
    setNodeCollapsed = mod.setNodeCollapsed;
    reconcileCollapsedNodes = mod.reconcileCollapsedNodes;
    collapseAllBelowPromises = mod.collapseAllBelowPromises;
    revealNextLevel = mod.revealNextLevel;
    expandAllNodes = mod.expandAllNodes;
});

describe('isNodeCollapsed', () => {
    it('returns true for a collapsed node id', () => {
        graphState.collapsedNodeIds.add('node-1');
        expect(isNodeCollapsed('node-1')).toBe(true);
    });

    it('returns false for a node not in the collapsed set', () => {
        expect(isNodeCollapsed('node-1')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isNodeCollapsed('')).toBe(false);
    });
});

describe('setNodeCollapsed', () => {
    it('adds a node id to collapsed set when collapsing', () => {
        setNodeCollapsed('node-1', true);
        expect(graphState.collapsedNodeIds.has('node-1')).toBe(true);
    });

    it('removes a node id from collapsed set when expanding', () => {
        graphState.collapsedNodeIds.add('node-1');
        setNodeCollapsed('node-1', false);
        expect(graphState.collapsedNodeIds.has('node-1')).toBe(false);
    });

    it('does nothing for empty node id', () => {
        setNodeCollapsed('', true);
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

describe('expandAllNodes', () => {
    it('clears all collapsed node ids', () => {
        graphState.collapsedNodeIds = new Set(['a', 'b', 'c']);
        expandAllNodes();
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

describe('collapseAllBelowPromises', () => {
    it('collapses root-level promise nodes that have children', () => {
        graphState.rawTree = makeNode('root', 2, 2);
        collapseAllBelowPromises();
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(true);
        expect(graphState.collapsedNodeIds.has('root-1')).toBe(true);
    });

    it('does not collapse leaf root-level nodes', () => {
        graphState.rawTree = makeNode('root', 2, 1);
        collapseAllBelowPromises();
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });

    it('does nothing when rawTree is null', () => {
        graphState.rawTree = null;
        collapseAllBelowPromises();
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

describe('reconcileCollapsedNodes', () => {
    it('removes collapsed ids for nodes that no longer exist', () => {
        graphState.rawTree = makeNode('root', 1, 2);
        graphState.collapsedNodeIds = new Set(['root-0', 'ghost-node']);
        reconcileCollapsedNodes();
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(true);
        expect(graphState.collapsedNodeIds.has('ghost-node')).toBe(false);
    });

    it('removes collapsed ids for leaf nodes', () => {
        graphState.rawTree = makeNode('root', 1, 1);
        graphState.collapsedNodeIds.add('root-0');
        reconcileCollapsedNodes();
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(false);
    });

    it('preserves collapsed ids for nodes with children', () => {
        graphState.rawTree = makeNode('root', 1, 2);
        graphState.collapsedNodeIds.add('root-0');
        reconcileCollapsedNodes();
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(true);
    });

    it('clears all collapsed ids when rawTree is null', () => {
        graphState.collapsedNodeIds = new Set(['a', 'b']);
        graphState.rawTree = null;
        reconcileCollapsedNodes();
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

describe('revealNextLevel', () => {
    it('uncollapses target node and collapses children that have grandchildren', () => {
        graphState.rawTree = makeNode('root', 2, 3);
        revealNextLevel({ id: 'root-0' });
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(false);
        expect(graphState.collapsedNodeIds.has('root-0-0')).toBe(true);
        expect(graphState.collapsedNodeIds.has('root-0-1')).toBe(true);
    });

    it('does nothing when rawTree is null', () => {
        graphState.rawTree = null;
        revealNextLevel({ id: 'root-0' });
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });

    it('does nothing when node is not found', () => {
        graphState.rawTree = makeNode('root', 1);
        revealNextLevel({ id: 'nonexistent' });
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

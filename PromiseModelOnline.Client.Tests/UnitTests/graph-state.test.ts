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
        // Arrange
        graphState.collapsedNodeIds.add('node-1');
        // Assert
        expect(isNodeCollapsed('node-1')).toBe(true);
    });

    it('returns false for a node not in the collapsed set', () => {
        // Arrange
        // Assert
        expect(isNodeCollapsed('node-1')).toBe(false);
    });

    it('returns false for empty string', () => {
        // Arrange
        // Assert
        expect(isNodeCollapsed('')).toBe(false);
    });
});

describe('setNodeCollapsed', () => {
    it('adds a node id to collapsed set when collapsing', () => {
        // Arrange
        // Act
        setNodeCollapsed('node-1', true);
        // Assert
        expect(graphState.collapsedNodeIds.has('node-1')).toBe(true);
    });

    it('removes a node id from collapsed set when expanding', () => {
        // Arrange
        graphState.collapsedNodeIds.add('node-1');
        // Act
        setNodeCollapsed('node-1', false);
        // Assert
        expect(graphState.collapsedNodeIds.has('node-1')).toBe(false);
    });

    it('does nothing for empty node id', () => {
        // Arrange
        // Act
        setNodeCollapsed('', true);
        // Assert
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

describe('expandAllNodes', () => {
    it('clears all collapsed node ids', () => {
        // Arrange
        graphState.collapsedNodeIds = new Set(['a', 'b', 'c']);
        // Act
        expandAllNodes();
        // Assert
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

describe('collapseAllBelowPromises', () => {
    it('collapses root-level promise nodes that have children', () => {
        // Arrange
        graphState.rawTree = makeNode('root', 2, 2);
        // Act
        collapseAllBelowPromises();
        // Assert
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(true);
        expect(graphState.collapsedNodeIds.has('root-1')).toBe(true);
    });

    it('does not collapse leaf root-level nodes', () => {
        // Arrange
        graphState.rawTree = makeNode('root', 2, 1);
        // Act
        collapseAllBelowPromises();
        // Assert
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });

    it('does nothing when rawTree is null', () => {
        // Arrange
        graphState.rawTree = null;
        // Act
        collapseAllBelowPromises();
        // Assert
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

describe('reconcileCollapsedNodes', () => {
    it('removes collapsed ids for nodes that no longer exist', () => {
        // Arrange
        graphState.rawTree = makeNode('root', 1, 2);
        graphState.collapsedNodeIds = new Set(['root-0', 'ghost-node']);
        // Act
        reconcileCollapsedNodes();
        // Assert
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(true);
        expect(graphState.collapsedNodeIds.has('ghost-node')).toBe(false);
    });

    it('removes collapsed ids for leaf nodes', () => {
        // Arrange
        graphState.rawTree = makeNode('root', 1, 1);
        graphState.collapsedNodeIds.add('root-0');
        // Act
        reconcileCollapsedNodes();
        // Assert
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(false);
    });

    it('preserves collapsed ids for nodes with children', () => {
        // Arrange
        graphState.rawTree = makeNode('root', 1, 2);
        graphState.collapsedNodeIds.add('root-0');
        // Act
        reconcileCollapsedNodes();
        // Assert
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(true);
    });

    it('clears all collapsed ids when rawTree is null', () => {
        // Arrange
        graphState.collapsedNodeIds = new Set(['a', 'b']);
        graphState.rawTree = null;
        // Act
        reconcileCollapsedNodes();
        // Assert
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

describe('revealNextLevel', () => {
    it('uncollapses target node and collapses children that have grandchildren', () => {
        // Arrange
        graphState.rawTree = makeNode('root', 2, 3);
        // Act
        revealNextLevel({ id: 'root-0' });
        // Assert
        expect(graphState.collapsedNodeIds.has('root-0')).toBe(false);
        expect(graphState.collapsedNodeIds.has('root-0-0')).toBe(true);
        expect(graphState.collapsedNodeIds.has('root-0-1')).toBe(true);
    });

    it('does nothing when rawTree is null', () => {
        // Arrange
        graphState.rawTree = null;
        // Act
        revealNextLevel({ id: 'root-0' });
        // Assert
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });

    it('does nothing when node is not found', () => {
        // Arrange
        graphState.rawTree = makeNode('root', 1);
        // Act
        revealNextLevel({ id: 'nonexistent' });
        // Assert
        expect(graphState.collapsedNodeIds.size).toBe(0);
    });
});

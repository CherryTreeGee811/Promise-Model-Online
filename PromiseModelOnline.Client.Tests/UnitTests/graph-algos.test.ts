import { describe, it, expect } from 'vitest';
import { cloneSubtree, filterTree } from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph-core.ts';

function makeNode(id: string, nodeType = 'epic', children: Record<string, unknown>[] = []): Record<string, unknown> {
    return { id, nodeType, children, _searchText: `node-${id}`, payload: { statement: `Node ${id}`, statusColor: 'green' }, _statusBucket: 'todo' };
}

describe('cloneSubtree', () => {
    it('clones a leaf node', () => {
        // Arrange
        const node = makeNode('n1');
        const metrics = { visibleNodes: 0, hiddenNodes: 0 };
        // Act
        const result = cloneSubtree(node, metrics, new Set()) as Record<string, unknown>;
        // Assert
        expect(result.id).toBe('n1');
        expect(result._isSearchMatched).toBe(false);
        expect(result._isCollapsed).toBe(false);
        expect(metrics.visibleNodes).toBe(1);
    });

    it('marks collapsed nodes with hidden descendants', () => {
        // Arrange
        const child = makeNode('c1');
        const parent = makeNode('p1', 'journey', [child]);
        const metrics = { visibleNodes: 0, hiddenNodes: 0 };
        // Act
        const result = cloneSubtree(parent, metrics, new Set(['p1'])) as Record<string, unknown>;
        // Assert
        expect(result._isCollapsed).toBe(true);
        expect(result._hiddenDescendantCount).toBe(1);
        expect(result.children).toEqual([]);
        expect(metrics.hiddenNodes).toBe(1);
    });

    it('skips root from visible count', () => {
        // Arrange
        const node = makeNode('root', 'root');
        const metrics = { visibleNodes: 0, hiddenNodes: 0 };
        // Act
        cloneSubtree(node, metrics, new Set());
        // Assert
        expect(metrics.visibleNodes).toBe(0);
    });

    it('recursively clones uncollapsed children', () => {
        // Arrange
        const child = makeNode('c1');
        const parent = makeNode('p1', 'journey', [child]);
        const metrics = { visibleNodes: 0, hiddenNodes: 0 };
        // Act
        const result = cloneSubtree(parent, metrics, new Set()) as Record<string, unknown>;
        // Assert
        expect(result.children).toHaveLength(1);
        expect((result.children as Record<string, unknown>[])[0].id).toBe('c1');
        expect(metrics.visibleNodes).toBe(2);
    });
});

describe('filterTree', () => {
    const defaultFilters = {
        search: '', includeChildren: true, types: new Set(['promise', 'epic', 'journey', 'flow', 'moment']),
        effort: 'all', stride: 'all', status: 'all', assignment: 'all',
    };

    it('passes root through with filtered children', () => {
        // Arrange
        const node = makeNode('root', 'root', [makeNode('p1', 'promise')]);
        const metrics = { visibleNodes: 0, directMatches: 0, hiddenNodes: 0 };
        // Act
        const result = filterTree(node, defaultFilters, metrics, true, new Set()) as Record<string, unknown>;
        // Assert
        expect(result).not.toBeUndefined();
        expect(result!.nodeType).toBe('root');
    });

    it('returns undefined when no match', () => {
        // Arrange
        const filters = { ...defaultFilters, types: new Set<string>() };
        const node = makeNode('p1', 'promise', [makeNode('c1', 'epic')]);
        const metrics = { visibleNodes: 0, directMatches: 0, hiddenNodes: 0 };
        // Act
        const result = filterTree(node, filters, metrics, false, new Set());
        // Assert
        expect(result).toBeUndefined();
    });

    it('returns search-matched node with children when includeChildren', () => {
        // Arrange
        const filters = { ...defaultFilters, search: 'match', includeChildren: true };
        const node = { ...makeNode('p1', 'promise', [makeNode('c1', 'epic')]), _searchText: 'match-here' };
        const metrics = { visibleNodes: 0, directMatches: 0, hiddenNodes: 0 };
        // Act
        const result = filterTree(node, filters, metrics, false, new Set()) as Record<string, unknown>;
        // Assert
        expect(result?._isSearchMatched).toBe(true);
        expect(metrics.directMatches).toBe(1);
    });

    it('includes self-matching nodes', () => {
        // Arrange
        const filters = { ...defaultFilters, status: 'todo' };
        const node = { ...makeNode('p1', 'promise'), _statusBucket: 'todo' };
        const metrics = { visibleNodes: 0, directMatches: 0, hiddenNodes: 0 };
        // Act
        const result = filterTree(node, filters, metrics, false, new Set()) as Record<string, unknown>;
        // Assert
        expect(result).not.toBeUndefined();
        expect(metrics.directMatches).toBe(1);
    });

    it('excludes children when collapsed', () => {
        // Arrange
        const node = makeNode('p1', 'promise', [makeNode('c1', 'epic')]);
        const metrics = { visibleNodes: 0, directMatches: 0, hiddenNodes: 0 };
        // Act
        const result = filterTree(node, defaultFilters, metrics, false, new Set(['p1'])) as Record<string, unknown>;
        // Assert
        expect(result).not.toBeUndefined();
        expect((result as Record<string, unknown>).children).toEqual([]);
    });
});

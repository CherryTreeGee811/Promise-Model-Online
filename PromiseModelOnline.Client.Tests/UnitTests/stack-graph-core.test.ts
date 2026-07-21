import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetStatusBucket = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/status-utilities.ts', () => ({
    getStatusBucket: mockGetStatusBucket,
    getStatusIcon: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('normalizeText', () => {
    it('trims and lowercases', async () => {
        // Arrange
        const { normalizeText } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(normalizeText('  Hello World  ')).toBe('hello world');
    });

    it('handles null/undefined', async () => {
        // Arrange
        const { normalizeText } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(normalizeText(null)).toBe('');
        expect(normalizeText(undefined)).toBe('');
    });

    it('converts numbers to strings', async () => {
        // Arrange
        const { normalizeText } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(normalizeText(42)).toBe('42');
    });
});

describe('getMomentEffortBucket', () => {
    it('returns unestimated for null', async () => {
        // Arrange
        const { getMomentEffortBucket } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getMomentEffortBucket(null)).toBe('unestimated');
    });

    it('normalizes valid estimates', async () => {
        // Arrange
        const { getMomentEffortBucket } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getMomentEffortBucket('XS')).toBe('XS');
        expect(getMomentEffortBucket('s')).toBe('S');
        expect(getMomentEffortBucket('M')).toBe('M');
        expect(getMomentEffortBucket('l')).toBe('L');
        expect(getMomentEffortBucket('XL')).toBe('XL');
        expect(getMomentEffortBucket('xxl')).toBe('XXL');
        expect(getMomentEffortBucket('XXXL')).toBe('XXXL');
    });

    it('returns unestimated for unknown values', async () => {
        // Arrange
        const { getMomentEffortBucket } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getMomentEffortBucket('unknown')).toBe('unestimated');
        expect(getMomentEffortBucket('')).toBe('unestimated');
        expect(getMomentEffortBucket('  ')).toBe('unestimated');
    });
});

describe('getMomentStrideBucket', () => {
    it('returns backlog for undefined/unassigned/empty', async () => {
        // Arrange
        const { getMomentStrideBucket } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getMomentStrideBucket({})).toBe('backlog');
        expect(getMomentStrideBucket({ assignedStrideId: undefined })).toBe('backlog');
        expect(getMomentStrideBucket({ assignedStrideId: 'unassigned' })).toBe('backlog');
        expect(getMomentStrideBucket({ assignedStrideId: '' })).toBe('backlog');
    });

    it('returns assignedStrideId as string', async () => {
        // Arrange
        const { getMomentStrideBucket } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getMomentStrideBucket({ assignedStrideId: 10 })).toBe('10');
        expect(getMomentStrideBucket({ assignedStrideId: '15' })).toBe('15');
    });

    it('handles undefined payload', async () => {
        // Arrange
        const { getMomentStrideBucket } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getMomentStrideBucket(undefined)).toBe('backlog');
    });
});

describe('computeChildMetrics', () => {
    it('returns zeros for empty array', async () => {
        // Arrange
        const { computeChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(computeChildMetrics([])).toEqual({ childCount: 0, completedChildCount: 0 });
    });

    it('counts children and completed children', async () => {
        // Arrange
        mockGetStatusBucket.mockImplementation((c: string) => c === 'green' ? 'done' : 'other');
        const { computeChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const result = computeChildMetrics([
            { statusColor: 'green' },
            { statusColor: 'red' },
            { statusColor: 'green' },
            { statusColor: 'yellow' },
        ]);

        // Assert
        expect(result).toEqual({ childCount: 4, completedChildCount: 2 });
    });

    it('handles non-array input', async () => {
        // Arrange
        const { computeChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(computeChildMetrics(null as unknown as Record<string, unknown>[])).toEqual({ childCount: 0, completedChildCount: 0 });
        expect(computeChildMetrics(undefined as unknown as Record<string, unknown>[])).toEqual({ childCount: 0, completedChildCount: 0 });
    });
});

describe('createNode', () => {
    it('creates a node with basic fields', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('epic', { id: 1, name: 'My Epic', description: 'Desc' }, []);

        // Assert
        expect(node.id).toBe('epic-1');
        expect(node.nodeType).toBe('epic');
        expect(node.label).toBe('My Epic');
        expect(node.payload).toEqual({ id: 1, name: 'My Epic', description: 'Desc' });
        expect(node.children).toEqual([]);
    });

    it('uses statement over name', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('moment', { sequenceNumber: 5, statement: 'The statement', name: 'The name' });

        // Assert
        expect(node.label).toBe('The statement');
    });

    it('falls back to payload id', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('flow', { id: 99 });

        // Assert
        expect(node.label).toBe('#99');
    });

    it('computes child counts from children', async () => {
        // Arrange
        mockGetStatusBucket.mockImplementation((c: string) => c === 'green' ? 'done' : 'other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const children = [
            { payload: { statusColor: 'green' }, statusColor: 'green' },
            { payload: { statusColor: 'red' }, statusColor: 'red' },
        ];

        // Act
        const node = createNode('promise', { id: 1 }, children);

        // Assert
        expect(node.childCount).toBe(2);
        expect(node.completedChildCount).toBe(1);
    });

    it('uses _childCount override from payload', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('epic', { id: 1, _childCount: 10, _completedChildCount: 5 }, []);

        // Assert
        expect(node.childCount).toBe(10);
        expect(node.completedChildCount).toBe(5);
    });

    it('generates search text from label and description', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('moment', { sequenceNumber: 1, statement: 'My Moment', description: 'A desc' });

        // Assert
        expect(node._searchText).toBe('my moment a desc');
    });

    it('sets effort bucket for moment nodes', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('moment', { sequenceNumber: 1, statement: 'M', effortEstimate: 'XL' });

        // Assert
        expect(node._effortBucket).toBe('XL');
    });

    it('skips effort bucket for non-moment nodes', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('epic', { id: 1, name: 'E', effortEstimate: 'XL' });

        // Assert
        expect(node._effortBucket).toBeUndefined();
    });

    it('sets stride bucket for moment nodes', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('moment', { sequenceNumber: 1, statement: 'M', assignedStrideId: 5 });

        // Assert
        expect(node._strideBucket).toBe('5');
    });

    it('sets stride bucket to backlog for moment without stride', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('moment', { sequenceNumber: 1, statement: 'M' });

        // Assert
        expect(node._strideBucket).toBe('backlog');
    });

    it('sets status bucket from payload', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('inprogress');
        const { createNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNode('epic', { id: 1, name: 'E', statusColor: 'orange' });

        // Assert
        expect(node._statusBucket).toBe('inprogress');
        expect(mockGetStatusBucket).toHaveBeenCalledWith('orange');
    });
});

describe('createNodeWithMetrics', () => {
    it('creates a node with enriched payload', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNodeWithMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNodeWithMetrics('epic', { id: 1, name: 'E' }, { childCount: 5, completedChildCount: 3 });

        // Assert
        expect(node.childCount).toBe(5);
        expect(node.completedChildCount).toBe(3);
        expect(node.id).toBe('epic-1');
    });

    it('creates a node without metrics', async () => {
        // Arrange
        mockGetStatusBucket.mockReturnValue('other');
        const { createNodeWithMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const node = createNodeWithMetrics('moment', { sequenceNumber: 7, statement: 'M' });

        // Assert
        expect(node.childCount).toBe(0);
    });
});

describe('getNodeSearchText', () => {
    it('uses _searchText when present', async () => {
        // Arrange
        const { getNodeSearchText } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const node = { _searchText: 'my custom search', label: 'Label', payload: { description: 'Desc' } };

        // Act & Assert
        expect(getNodeSearchText(node)).toBe('my custom search');
    });

    it('falls back to label + description', async () => {
        // Arrange
        const { getNodeSearchText } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const node = { label: 'My Label', payload: { description: 'My Desc' } };

        // Act & Assert
        expect(getNodeSearchText(node)).toBe('my label my desc');
    });
});

describe('findNodeById', () => {
    it('returns undefined for null/undefined inputs', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(findNodeById(undefined, 'id')).toBeUndefined();
        expect(findNodeById({ id: 'root' }, undefined)).toBeUndefined();
    });

    it('finds root node', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const tree = { id: 'root', children: [] };

        // Act & Assert
        expect(findNodeById(tree, 'root')).toBe(tree);
    });

    it('finds nested child node', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const target = { id: 'target', children: [] };
        const tree = {
            id: 'root',
            children: [
                { id: 'child1', children: [] },
                { id: 'child2', children: [target] },
            ],
        };

        // Act & Assert
        expect(findNodeById(tree, 'target')).toBe(target);
    });

    it('returns undefined for missing node', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const tree = { id: 'root', children: [{ id: 'child', children: [] }] };

        // Act & Assert
        expect(findNodeById(tree, 'nonexistent')).toBeUndefined();
    });
});

describe('countRenderableNodes', () => {
    it('returns 0 for undefined', async () => {
        // Arrange
        const { countRenderableNodes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(countRenderableNodes(undefined)).toBe(0);
    });

    it('excludes root from count', async () => {
        // Arrange
        const { countRenderableNodes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const tree = { nodeType: 'root', children: [] };

        // Act & Assert
        expect(countRenderableNodes(tree)).toBe(0);
    });

    it('counts all non-root nodes', async () => {
        // Arrange
        const { countRenderableNodes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const tree = {
            nodeType: 'root',
            children: [
                { nodeType: 'promise', children: [
                    { nodeType: 'epic', children: [] },
                    { nodeType: 'epic', children: [
                        { nodeType: 'journey', children: [] },
                    ]},
                ]},
                { nodeType: 'promise', children: [] },
            ],
        };

        // Act & Assert
        expect(countRenderableNodes(tree)).toBe(5);
    });
});

describe('parseGraphData', () => {
    it('creates root with project name', async () => {
        // Arrange
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const root = parseGraphData([], 'owner1', 'proj1', { name: 'My Project' });

        // Assert
        expect(root.id).toBe('root-owner1-proj1');
        expect(root.nodeType).toBe('root');
        expect(root.label).toBe('My Project');
        expect(root.children).toEqual([]);
    });

    it('falls back to owner/project label', async () => {
        // Arrange
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const root = parseGraphData([], 'owner1', 'proj1');

        // Assert
        expect(root.label).toBe('Project owner1/proj1');
    });

    it('uses Name field if name is missing', async () => {
        // Arrange
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const root = parseGraphData([], 'o', 'p', { Name: 'Alt Name' });

        // Assert
        expect(root.label).toBe('Alt Name');
    });

    it('passes promises as children', async () => {
        // Arrange
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const promises = [{ id: 'promise-1' }, { id: 'promise-2' }];

        // Act
        const root = parseGraphData(promises, 'o', 'p');

        // Assert
        expect(root.children).toBe(promises);
    });
});

describe('getDetailPageNodeScale', () => {
    it('returns 1 for unknown node types', async () => {
        // Arrange
        const { getDetailPageNodeScale } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getDetailPageNodeScale('unknown')).toBe(1);
    });

    it('returns max scale for promise (fewest tiers)', async () => {
        // Arrange
        const { getDetailPageNodeScale } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getDetailPageNodeScale('promise')).toBe(1.32);
    });

    it('returns min scale for moment (most tiers)', async () => {
        // Arrange
        const { getDetailPageNodeScale } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act & Assert
        expect(getDetailPageNodeScale('moment')).toBe(0.84);
    });

    it('returns intermediate values for mid-tier types', async () => {
        // Arrange
        const { getDetailPageNodeScale } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');

        // Act
        const epic = getDetailPageNodeScale('epic');
        const journey = getDetailPageNodeScale('journey');
        const flow = getDetailPageNodeScale('flow');

        // Assert
        expect(epic).toBeGreaterThan(journey);
        expect(journey).toBeGreaterThan(flow);
        expect(flow).toBeGreaterThan(0.84);
    });
});

describe('findNodeById', () => {
    it('returns undefined for undefined tree', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(findNodeById(undefined, '1')).toBeUndefined();
    });

    it('returns undefined for undefined nodeId', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(findNodeById({ id: '1' }, undefined)).toBeUndefined();
    });

    it('finds node at root', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(findNodeById({ id: '1' }, '1')).toEqual({ id: '1' });
    });

    it('finds nested node', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const tree = { id: 'root', children: [{ id: 'child', children: [{ id: 'grandchild' }] }] };
        // Act
        // Assert
        expect(findNodeById(tree, 'grandchild')).toEqual({ id: 'grandchild' });
    });

    it('returns undefined for missing node', async () => {
        // Arrange
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const tree = { id: 'root', children: [{ id: 'child' }] };
        // Act
        // Assert
        expect(findNodeById(tree, 'missing')).toBeUndefined();
    });
});

describe('countRenderableNodes', () => {
    it('returns 0 for undefined node', async () => {
        // Arrange
        const { countRenderableNodes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(countRenderableNodes(undefined)).toBe(0);
    });

    it('returns 0 for root-only node', async () => {
        // Arrange
        const { countRenderableNodes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(countRenderableNodes({ id: 'root', nodeType: 'root' })).toBe(0);
    });

    it('counts child nodes recursively', async () => {
        // Arrange
        const { countRenderableNodes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const tree = { id: 'root', nodeType: 'root', children: [{ id: 'p1', nodeType: 'promise', children: [{ id: 'e1', nodeType: 'epic' }] }] };
        // Act
        // Assert
        expect(countRenderableNodes(tree)).toBe(2);
    });

    it('returns 1 for single non-root node', async () => {
        // Arrange
        const { countRenderableNodes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(countRenderableNodes({ id: 'p1', nodeType: 'promise' })).toBe(1);
    });
});

describe('parseGraphData', () => {
    it('creates root node with project label', async () => {
        // Arrange
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const result = parseGraphData([], 'owner', 'project');
        // Act
        // Assert
        expect(result.nodeType).toBe('root');
        expect(result.label).toBe('Project owner/project');
        expect(result.children).toEqual([]);
    });

    it('uses project entity name', async () => {
        // Arrange
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const result = parseGraphData([], 'o', 'p', { name: 'My Project' });
        // Act
        // Assert
        expect(result.label).toBe('My Project');
    });

    it('falls back to Name from project entity', async () => {
        // Arrange
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const result = parseGraphData([], 'o', 'p', { Name: 'Alt Name' });
        // Act
        // Assert
        expect(result.label).toBe('Alt Name');
    });

    it('includes root promises as children', async () => {
        // Arrange
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const promises = [{ id: 'p1' }, { id: 'p2' }];
        const result = parseGraphData(promises, 'o', 'p');
        // Act
        // Assert
        expect(result.children).toHaveLength(2);
    });
});

describe('renderEmptyState', () => {
    it('creates empty state element', async () => {
        // Arrange
        const { renderEmptyState } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const div = document.createElement('div');
        renderEmptyState(div, 'No data');
        // Act
        // Assert
        expect(div.children.length).toBe(1);
        expect(div.children[0].className).toBe('graph-empty-state');
        expect(div.children[0].textContent).toBe('No data');
    });

    it('does nothing for undefined container', async () => {
        // Arrange
        const { renderEmptyState } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        renderEmptyState(undefined, 'No data');
    });
});

describe('logGraphFocus', () => {
    it('logs focus event without throwing', async () => {
        // Arrange
        const { logGraphFocus } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(() => logGraphFocus('test', {})).not.toThrow();
    });

    it('handles empty details object', async () => {
        // Arrange
        const { logGraphFocus } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(() => logGraphFocus('test', undefined as never)).not.toThrow();
    });
});

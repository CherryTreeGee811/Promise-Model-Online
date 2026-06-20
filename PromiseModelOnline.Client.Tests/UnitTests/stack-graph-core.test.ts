import { describe, it, expect } from 'vitest';
import { normalizeText, getMomentEffortBucket, getMomentStrideBucket, computeChildMetrics, createNode, createNodeWithMetrics, getNodeSearchText, findNodeById, countRenderableNodes, parseGraphData, getDetailPageNodeScale } from '../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts';

describe('normalizeText', () => {
    it('returns empty string for null', () => {
        expect(normalizeText(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(normalizeText(undefined)).toBe('');
    });

    it('trims whitespace', () => {
        expect(normalizeText('  hello  ')).toBe('hello');
    });

    it('converts numbers to string', () => {
        expect(normalizeText(42)).toBe('42');
    });

    it('converts objects to lowercase string', () => {
        expect(normalizeText({})).toBe('[object object]');
    });
});

describe('getMomentEffortBucket', () => {
    it('returns "unestimated" for undefined', () => {
        expect(getMomentEffortBucket(undefined)).toBe('unestimated');
    });

    it('returns "unestimated" for null', () => {
        expect(getMomentEffortBucket(null)).toBe('unestimated');
    });

    it('returns uppercase effort value', () => {
        expect(getMomentEffortBucket('S')).toBe('S');
    });
});

describe('getMomentStrideBucket', () => {
    it('returns "backlog" for undefined payload', () => {
        expect(getMomentStrideBucket(undefined)).toBe('backlog');
    });

    it('returns "backlog" for payload without assignedStrideId', () => {
        expect(getMomentStrideBucket({})).toBe('backlog');
    });

    it('returns stride id string for assigned stride', () => {
        expect(getMomentStrideBucket({ assignedStrideId: 10 })).toBe('10');
    });

    it('returns "0" for zero assigned stride', () => {
        expect(getMomentStrideBucket({ assignedStrideId: 0 })).toBe('0');
    });
});

describe('computeChildMetrics', () => {
    it('returns zeros for empty array', () => {
        expect(computeChildMetrics([])).toEqual({ childCount: 0, completedChildCount: 0 });
    });

    it('returns zeros for undefined', () => {
        expect(computeChildMetrics(undefined as unknown as Record<string, unknown>[])).toEqual({ childCount: 0, completedChildCount: 0 });
    });

    it('counts children and completed children from statusColor', () => {
        const children = [
            { statusColor: 'green' },
            { statusColor: 'red' },
            { statusColor: 'green' },
        ];
        expect(computeChildMetrics(children as Record<string, unknown>[])).toEqual({ childCount: 3, completedChildCount: 2 });
    });

    it('handles children with direct statusColor', () => {
        const children = [
            { statusColor: 'green' },
            { statusColor: 'red' },
        ];
        expect(computeChildMetrics(children as Record<string, unknown>[])).toEqual({ childCount: 2, completedChildCount: 1 });
    });
});

describe('createNode', () => {
    it('creates a node with given type and payload', () => {
        const node = createNode('promise', { id: 1, statement: 'Test' });
        expect(node.nodeType).toBe('promise');
        expect(node.payload).toEqual({ id: 1, statement: 'Test' });
        expect(node.children).toEqual([]);
        expect(node.id).toBeTruthy();
    });

    it('creates a node with children', () => {
        const child = { id: 'child-1', nodeType: 'epic', payload: {}, children: [] };
        const node = createNode('promise', { id: 1 }, [child as unknown as Record<string, unknown>]);
        expect(node.children).toHaveLength(1);
        expect(node.children![0].id).toBe('child-1');
    });

    it('computes child metrics from children statusColor', () => {
        const children = [
            { statusColor: 'green' },
            { statusColor: 'red' },
        ];
        const node = createNode('promise', {}, children as unknown as Record<string, unknown>[]);
        expect(node.childCount).toBe(2);
        expect(node.completedChildCount).toBe(1);
    });
});

describe('createNodeWithMetrics', () => {
    it('creates a node with provided metrics', () => {
        const node = createNodeWithMetrics('epic', { name: 'Epic 1' }, { childCount: 5, completedChildCount: 3 });
        expect(node.nodeType).toBe('epic');
        expect(node.childCount).toBe(5);
        expect(node.completedChildCount).toBe(3);
    });
});

describe('getNodeSearchText', () => {
    it('combines label and description in lowercase', () => {
        const node = { payload: { name: 'Test', description: 'A description' }, label: 'Test Label' };
        const text = getNodeSearchText(node as Record<string, unknown>);
        expect(text).toContain('test');
        expect(text).toContain('description');
        expect(text).toContain('test label');
    });

    it('returns empty string for empty node', () => {
        const node = {};
        const text = getNodeSearchText(node as Record<string, unknown>);
        expect(text).toBe('');
    });
});

describe('findNodeById', () => {
    it('returns undefined for undefined tree', () => {
        expect(findNodeById(undefined, 'any')).toBeUndefined();
    });

    it('returns undefined for undefined id', () => {
        expect(findNodeById({ id: 'root' } as Record<string, unknown>, undefined)).toBeUndefined();
    });

    it('finds root node', () => {
        const tree = { id: 'root-1', nodeType: 'root', children: [] };
        expect(findNodeById(tree as unknown as Record<string, unknown>, 'root-1')).toBe(tree);
    });

    it('finds nested child by id', () => {
        const tree = {
            id: 'root',
            children: [
                { id: 'promise-1', children: [{ id: 'epic-1', children: [] }] },
                { id: 'promise-2', children: [] },
            ],
        };
        const found = findNodeById(tree as unknown as Record<string, unknown>, 'epic-1');
        expect(found).toBeDefined();
        expect((found as Record<string, unknown>).id).toBe('epic-1');
    });

    it('returns undefined for non-existent id', () => {
        const tree = { id: 'root', children: [{ id: 'child-1', children: [] }] };
        expect(findNodeById(tree as unknown as Record<string, unknown>, 'non-existent')).toBeUndefined();
    });
});

describe('countRenderableNodes', () => {
    it('returns 0 for undefined', () => {
        expect(countRenderableNodes(undefined)).toBe(0);
    });

    it('counts non-root nodes', () => {
        const tree = {
            nodeType: 'root',
            children: [{ nodeType: 'promise', children: [] }],
        };
        expect(countRenderableNodes(tree as unknown as Record<string, unknown>)).toBe(1);
    });

    it('counts recursively excluding root', () => {
        const tree = {
            nodeType: 'root',
            children: [
                { nodeType: 'promise', children: [
                    { nodeType: 'epic', children: [
                        { nodeType: 'journey', children: [] },
                    ] },
                ] },
            ],
        };
        expect(countRenderableNodes(tree as unknown as Record<string, unknown>)).toBe(3);
    });
});

describe('parseGraphData', () => {
    it('creates root node with project info', () => {
        const promises = [{ nodeType: 'promise', payload: {} }];
        const root = parseGraphData(promises as Record<string, unknown>[], 'owner1', 'proj1');
        expect(root.nodeType).toBe('root');
        expect(root.id).toBe('root-owner1-proj1');
        expect(root.children).toHaveLength(1);
    });

    it('uses project entity name when available', () => {
        const promises = [] as Record<string, unknown>[];
        const root = parseGraphData(promises, 'owner1', 'proj1', { name: 'My Project' });
        expect(root.label).toBe('My Project');
    });

    it('handles empty promises array', () => {
        const root = parseGraphData([], 'o', 'p');
        expect(root.children).toHaveLength(0);
    });
});

describe('getDetailPageNodeScale', () => {
    it('returns compact scale for moment', () => {
        expect(getDetailPageNodeScale('moment')).toBe(0.84);
    });

    it('returns compact scale for flow', () => {
        expect(getDetailPageNodeScale('flow')).toBe(0.96);
    });
});

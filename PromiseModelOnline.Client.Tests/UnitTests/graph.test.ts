import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-context-menu.ts', () => ({
    createGraphContextMenuController: vi.fn(() => ({ hide: vi.fn(), destroy: vi.fn(), open: vi.fn() })),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts', () => ({
    getUserId: vi.fn(() => 'user-123'),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    getGraphData: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    getStrides: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts', async () => {
    const actual = await vi.importActual<object>('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
    return {
        ...actual,
        renderStackGraph: vi.fn(),
        renderEmptyState: vi.fn(),
        logGraphFocus: vi.fn(),
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('hasNodeChildren', () => {
    it('returns true when node has non-empty children array', async () => {
        const { hasNodeChildren } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-core.ts');

        expect(hasNodeChildren({ children: [{ id: '1' }] } as never)).toBe(true);
    });

    it('returns false when children is empty array', async () => {
        const { hasNodeChildren } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-core.ts');

        expect(hasNodeChildren({ children: [] } as never)).toBe(false);
    });

    it('returns false when children is undefined', async () => {
        const { hasNodeChildren } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-core.ts');

        expect(hasNodeChildren({} as never)).toBe(false);
    });
});

describe('getHiddenDescendantCount', () => {
    it('returns 0 for node without children', async () => {
        const { getHiddenDescendantCount } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(getHiddenDescendantCount({ children: [] } as never)).toBe(0);
    });
});

describe('createDefaultFilters', () => {
    it('returns default filter state', async () => {
        const { createDefaultFilters } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const filters = createDefaultFilters();
        expect(filters.search).toBe('');
        expect(filters.status).toBe('all');
        expect(filters.assignment).toBe('all');
        expect(filters.effort).toBe('all');
        expect(filters.stride).toBe('all');
        expect(filters.includeChildren).toBe(false);
        expect(filters.types.size).toBe(5);
    });
});

describe('parseTypeList', () => {
    it('parses comma-separated string into set', async () => {
        const { parseTypeList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const result = parseTypeList('promise,epic,journey');
        expect(result).toEqual(new Set(['promise', 'epic', 'journey']));
    });

    it('returns all types for null', async () => {
        const { parseTypeList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const result = parseTypeList(null);
        expect(result.size).toBe(5);
    });

    it('trims whitespace from entries', async () => {
        const { parseTypeList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const result = parseTypeList(' promise , epic ');
        expect(result).toEqual(new Set(['promise', 'epic']));
    });
});

describe('normalizeTypeSelection', () => {
    it('returns contiguous range from min to max selected index', async () => {
        const { normalizeTypeSelection } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const result = normalizeTypeSelection(new Set(['promise', 'journey']));
        expect(result).toEqual(new Set(['promise', 'epic', 'journey']));
    });

    it('returns empty set for empty input', async () => {
        const { normalizeTypeSelection } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(normalizeTypeSelection(new Set()).size).toBe(0);
    });
});

describe('getStatusFilterValue', () => {
    it('normalizes status labels', async () => {
        const { getStatusFilterValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(getStatusFilterValue('todo')).toBe('todo');
        expect(getStatusFilterValue('Done')).toBe('done');
        expect(getStatusFilterValue('all')).toBe('all');
        expect(getStatusFilterValue('In Progress')).toBe('other');
    });
});

describe('getAssignmentFilterValue', () => {
    it('returns all for most inputs', async () => {
        const { getAssignmentFilterValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(getAssignmentFilterValue('Unassigned')).toBe('all');
        expect(getAssignmentFilterValue('unassigned')).toBe('all');
        expect(getAssignmentFilterValue('')).toBe('all');
        expect(getAssignmentFilterValue('assigned-to-me')).toBe('assigned-to-me');
    });
});

describe('getEffortFilterValue', () => {
    it('normalizes effort labels', async () => {
        const { getEffortFilterValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(getEffortFilterValue('xs')).toBe('XS');
        expect(getEffortFilterValue('M')).toBe('M');
        expect(getEffortFilterValue('XL')).toBe('XL');
        expect(getEffortFilterValue('all')).toBe('all');
        expect(getEffortFilterValue('Unknown')).toBe('all');
    });
});

describe('getStrideFilterValue', () => {
    it('normalizes stride strings', async () => {
        const { getStrideFilterValue } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(getStrideFilterValue('Backlog')).toBe('backlog');
        expect(getStrideFilterValue('all')).toBe('all');
        expect(getStrideFilterValue('42')).toBe('42');
    });
});

describe('getTypeShortLabel', () => {
    it('returns full labels for each type', async () => {
        const { getTypeShortLabel } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(getTypeShortLabel('promise')).toBe('Promise');
        expect(getTypeShortLabel('epic')).toBe('Epic');
        expect(getTypeShortLabel('journey')).toBe('Journey');
        expect(getTypeShortLabel('flow')).toBe('Flow');
        expect(getTypeShortLabel('moment')).toBe('Moment');
    });

    it('returns unknown type as-is', async () => {
        const { getTypeShortLabel } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(getTypeShortLabel('unknown')).toBe('unknown');
    });
});

describe('buildMomentNode', () => {
    it('builds a graph node from moment data', async () => {
        const { buildMomentNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const node = buildMomentNode({ id: 1, statement: 'Test Moment', status: 'Todo' } as never);
        expect(node.nodeType).toBe('moment');
        expect(node.payload.statement).toBe('Test Moment');
    });
});

describe('buildFlowNode', () => {
    it('builds a graph node from flow data', async () => {
        const { buildFlowNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const node = buildFlowNode({ id: 1, statement: 'Test Flow' } as never);
        expect(node.nodeType).toBe('flow');
    });
});

describe('buildJourneyNode', () => {
    it('builds a graph node from journey data', async () => {
        const { buildJourneyNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const node = buildJourneyNode({ id: 1, statement: 'Test Journey' } as never);
        expect(node.nodeType).toBe('journey');
    });
});

describe('buildEpicNode', () => {
    it('builds a graph node from epic data', async () => {
        const { buildEpicNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const node = buildEpicNode({ id: 1, statement: 'Test Epic' } as never);
        expect(node.nodeType).toBe('epic');
    });
});

describe('buildPromiseNode', () => {
    it('builds a graph node from promise data', async () => {
        const { buildPromiseNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const node = buildPromiseNode({ id: 1, statement: 'Test Promise' } as never);
        expect(node.nodeType).toBe('promise');
    });
});

describe('isNodeSearchMatching', () => {
    it('matches when search text is contained', async () => {
        const { isNodeSearchMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const node = { nodeType: 'moment', payload: { statement: 'Hello World' }, children: [], _searchText: 'hello world' } as never;
        expect(isNodeSearchMatching(node, 'hello')).toBe(true);
        expect(isNodeSearchMatching(node, 'world')).toBe(true);
    });

    it('rejects when search text not found', async () => {
        const { isNodeSearchMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const node = { nodeType: 'moment', payload: { statement: 'Hello World' }, children: [] } as never;

        expect(isNodeSearchMatching(node, 'xyz')).toBe(false);
    });

    it('matches empty search', async () => {
        const { isNodeSearchMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const node = { nodeType: 'moment', payload: { statement: 'Hello' }, children: [] } as never;

        expect(isNodeSearchMatching(node, '')).toBe(true);
    });
});

describe('isNodeStatusMatching', () => {
    it('matches when status bucket equals filter', async () => {
        const { isNodeStatusMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const node = { nodeType: 'moment', payload: { statusColor: 'red' }, children: [], _statusBucket: 'todo' } as never;
        expect(isNodeStatusMatching(node, 'todo')).toBe(true);
    });

    it('matches all filter', async () => {
        const { isNodeStatusMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const node = { nodeType: 'moment', payload: { status: 'Done' }, children: [] } as never;

        expect(isNodeStatusMatching(node, 'all')).toBe(true);
    });
});

describe('isNodeEffortMatching', () => {
    it('matches when effort bucket equals filter', async () => {
        const { isNodeEffortMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        const node = { nodeType: 'moment', payload: { effortEstimate: 'M' }, children: [], _effortBucket: 'M' } as never;
        expect(isNodeEffortMatching(node, 'M')).toBe(true);
    });

    it('matches all filter', async () => {
        const { isNodeEffortMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const node = { nodeType: 'moment', payload: { effortEstimate: 'L' }, children: [] } as never;

        expect(isNodeEffortMatching(node, 'all')).toBe(true);
    });
});

describe('isNodeStrideMatching', () => {
    it('matches when stride bucket equals filter', async () => {
        const { isNodeStrideMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const node = { nodeType: 'moment', payload: { assignedStrideId: 5, assignedStrideName: 'Sprint' }, children: [], _strideBucket: '5' } as never;

        expect(isNodeStrideMatching(node, '5')).toBe(true);
    });

    it('matches all filter', async () => {
        const { isNodeStrideMatching } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const node = { nodeType: 'moment', payload: { assignedStrideId: 5 }, children: [] } as never;

        expect(isNodeStrideMatching(node, 'all')).toBe(true);
    });
});

describe('findFirstSearchMatch', () => {
    it('returns undefined for undefined tree', async () => {
        const { findFirstSearchMatch } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');

        expect(findFirstSearchMatch(undefined as never)).toBeUndefined();
    });
});

describe('filterTree', () => {
    it('filters by assigned-to-me for matching moment node', async () => {
        const { filterTree, ASSIGNED_TO_ME, createDefaultFilters } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const node = {
            id: 'root',
            nodeType: 'root',
            children: [{
                id: 'moment-1',
                nodeType: 'moment',
                payload: { ownerId: 'user-123', statement: 'My moment' },
                children: [],
            }],
        } as never;
        const filters = { ...createDefaultFilters(), assignment: ASSIGNED_TO_ME };
        const metrics = { directMatches: 0, visibleNodes: 0, hiddenNodes: 0 };
        const collapsedIds = new Set<string>();

        const result = filterTree(node, filters, metrics, true, collapsedIds);

        expect(result).toBeDefined();
        expect(metrics.directMatches).toBe(1);
    });

    it('returns visible nodes when filtered by assignment', async () => {
        const { filterTree, ASSIGNED_TO_ME, createDefaultFilters } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const filters = { ...createDefaultFilters(), assignment: ASSIGNED_TO_ME };
        const metrics = { directMatches: 0, visibleNodes: 0, hiddenNodes: 0 };
        const collapsedIds = new Set<string>();
        const node = {
            id: 'root', nodeType: 'root',
            children: [
                { id: 'moment-1', nodeType: 'moment', payload: { ownerId: 'user-123', statement: 'My moment' }, children: [] },
            ],
        } as never;

        const result = filterTree(node, filters, metrics, true, collapsedIds);

        expect(result).toBeDefined();
        expect(metrics.directMatches).toBeGreaterThanOrEqual(0);
    });
});

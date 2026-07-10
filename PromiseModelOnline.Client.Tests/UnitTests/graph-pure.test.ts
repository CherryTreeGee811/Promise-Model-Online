import { describe, it, expect } from 'vitest';
import {
    hasNodeChildren, createDefaultFilters, parseTypeList, getStatusFilterValue,
    getEffortFilterValue, getStrideFilterValue, getTypeShortLabel,
    isNodeSearchMatching, isNodeStatusMatching, isNodeEffortMatching, isNodeStrideMatching,
    getHiddenDescendantCount, normalizeTypeSelection, getAssignmentFilterValue,
    buildMomentNode, buildFlowNode, buildJourneyNode, buildEpicNode, buildPromiseNode,
    findFirstSearchMatch,
} from '../../PromiseModelOnline.Client/wwwroot/js/projects/graph-core.ts';

describe('hasNodeChildren', () => {
    it('returns true for node with children', () => {
        expect(hasNodeChildren({ children: [{ id: 'c1' }] })).toBe(true);
    });
    it('returns false for node without children', () => {
        expect(hasNodeChildren({ children: [] })).toBe(false);
    });
    it('returns false for node with missing children', () => {
        expect(hasNodeChildren({})).toBe(false);
    });
});

describe('createDefaultFilters', () => {
    it('returns all filters with defaults', () => {
        const f = createDefaultFilters();
        expect(f.search).toBe('');
        expect(f.types.size).toBeGreaterThan(0);
        expect(f.effort).toBe('all');
        expect(f.stride).toBe('all');
        expect(f.status).toBe('all');
        expect(f.assignment).toBe('all');
    });
});

describe('parseTypeList', () => {
    it('parses comma-separated types', () => {
        const result = parseTypeList('promise,epic');
        expect(result).toContain('promise');
        expect(result).toContain('epic');
    });
    it('returns empty set for empty input', () => {
        const result = parseTypeList('');
        expect(result.size).toBe(0);
    });
});

describe('getStatusFilterValue', () => {
    it('normalizes status strings', () => {
        expect(getStatusFilterValue('done')).toBe('done');
        expect(getStatusFilterValue('inprogress')).toBe('inprogress');
        expect(getStatusFilterValue('all')).toBe('all');
    });
});

describe('getEffortFilterValue', () => {
    it('normalizes effort strings', () => {
        expect(getEffortFilterValue('M')).toBe('M');
        expect(getEffortFilterValue('all')).toBe('all');
        expect(getEffortFilterValue('unestimated')).toBe('unestimated');
    });
});

describe('getStrideFilterValue', () => {
    it('normalizes stride strings', () => {
        expect(getStrideFilterValue('all')).toBe('all');
        expect(getStrideFilterValue('backlog')).toBe('backlog');
    });
});

describe('getTypeShortLabel', () => {
    it('maps node types to labels', () => {
        expect(getTypeShortLabel('promise')).toBe('Promise');
        expect(getTypeShortLabel('epic')).toBe('Epic');
        expect(getTypeShortLabel('flow')).toBe('Flow');
    });
});

describe('isNodeSearchMatching', () => {
    it('returns true when search text contains query', () => {
        const node = { _searchText: 'hello world', data: { label: 'hello world' } };
        expect(isNodeSearchMatching(node as never, 'hello')).toBe(true);
    });
    it('returns false when no match', () => {
        const node = { _searchText: 'hello world', data: { label: 'hello world' } };
        expect(isNodeSearchMatching(node as never, 'zzz')).toBe(false);
    });
});

describe('isNodeStatusMatching', () => {
    it('matches by status bucket', () => {
        const node = { _statusBucket: 'done', data: { payload: { statusColor: 'green' } } };
        expect(isNodeStatusMatching(node as never, 'done')).toBe(true);
    });
    it('returns true for all filter', () => {
        const node = { _statusBucket: 'todo', data: {} };
        expect(isNodeStatusMatching(node as never, 'all')).toBe(true);
    });
});

describe('isNodeEffortMatching', () => {
    it('matches moment nodes by effort bucket', () => {
        const node = { nodeType: 'moment', _effortBucket: 'M', data: { payload: { effortEstimate: 'M' } } };
        expect(isNodeEffortMatching(node as never, 'M')).toBe(true);
    });
    it('returns false for non-moment nodes', () => {
        const node = { nodeType: 'promise', data: { payload: {} } };
        expect(isNodeEffortMatching(node as never, 'M')).toBe(false);
    });
});

describe('isNodeStrideMatching', () => {
    it('matches moment nodes by stride bucket', () => {
        const node = { nodeType: 'moment', _strideBucket: '10', data: { payload: { assignedStrideId: '10' } } };
        expect(isNodeStrideMatching(node as never, '10')).toBe(true);
    });
    it('returns false for non-moment nodes', () => {
        const node = { nodeType: 'epic', data: { payload: {} } };
        expect(isNodeStrideMatching(node as never, '10')).toBe(false);
    });
});

describe('getHiddenDescendantCount', () => {
    it('returns 0 for node with no children', () => {
        expect(getHiddenDescendantCount({ children: [] })).toBe(0);
    });
    it('sums renderable nodes across children', () => {
        const node = { children: [{ nodeType: 'epic', children: [] }, { nodeType: 'epic', children: [] }] };
        expect(getHiddenDescendantCount(node as never)).toBe(2);
    });
});

describe('normalizeTypeSelection', () => {
    it('returns contiguous range from given types', () => {
        const result = normalizeTypeSelection(new Set(['promise', 'epic']));
        expect(result.has('promise')).toBe(true);
        expect(result.has('epic')).toBe(true);
    });
    it('handles empty set', () => {
        const result = normalizeTypeSelection(new Set());
        expect(result.size).toBe(0);
    });
});

describe('getAssignmentFilterValue', () => {
    it('normalizes assignment strings', () => {
        expect(getAssignmentFilterValue('assigned-to-me')).toBe('assigned-to-me');
        expect(getAssignmentFilterValue('all')).toBe('all');
        expect(getAssignmentFilterValue('')).toBe('all');
    });
});

describe('buildMomentNode', () => {
    it('creates a moment node from payload', () => {
        const result = buildMomentNode({ id: 1, sequenceNumber: 100, statement: 'Test Moment', statusColor: 'green' });
        expect(result.nodeType).toBe('moment');
        expect(result.payload?.statement).toContain('Test');
    });
});

describe('buildFlowNode', () => {
    it('creates a flow node with moment children', () => {
        const result = buildFlowNode({ id: 1, sequenceNumber: 1, statement: 'Flow One', moments: [{ id: 100, sequenceNumber: 100, statement: 'M1' }] });
        expect(result.nodeType).toBe('flow');
        expect(result.children?.length).toBe(1);
    });
});

describe('buildJourneyNode', () => {
    it('creates a journey node with flow children', () => {
        const result = buildJourneyNode({ id: 1, sequenceNumber: 1, statement: 'J1', flows: [{ id: 1, sequenceNumber: 1, statement: 'F1', moments: [] }] });
        expect(result.nodeType).toBe('journey');
        expect(result.children?.length).toBe(1);
    });
});

describe('buildEpicNode', () => {
    it('creates an epic node with journey children', () => {
        const result = buildEpicNode({ id: 1, sequenceNumber: 1, statement: 'E1', journeys: [{ id: 1, sequenceNumber: 1, statement: 'J1', flows: [] }] });
        expect(result.nodeType).toBe('epic');
        expect(result.children?.length).toBe(1);
    });
});

describe('buildPromiseNode', () => {
    it('creates a promise node with epic children', () => {
        const result = buildPromiseNode({ id: 1, sequenceNumber: 1, statement: 'P1', epics: [{ id: 1, sequenceNumber: 1, statement: 'E1', journeys: [] }] });
        expect(result.nodeType).toBe('promise');
        expect(result.children?.length).toBe(1);
    });
});

describe('findFirstSearchMatch', () => {
    it('returns the first node with _isSearchMatched true', () => {
        const tree = { _isSearchMatched: false, children: [{ _isSearchMatched: false, children: [] }, { _isSearchMatched: true, id: 'found', children: [] }] };
        const result = findFirstSearchMatch(tree as never);
        expect(result?.id).toBe('found');
    });
    it('returns undefined when no match', () => {
        const tree = { _isSearchMatched: false, children: [{ _isSearchMatched: false, children: [] }] };
        expect(findFirstSearchMatch(tree as never)).toBeUndefined();
    });
});

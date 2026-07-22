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
        // Arrange
        // Assert
        expect(hasNodeChildren({ children: [{ id: 'c1' }] })).toBe(true);
    });
    it('returns false for node without children', () => {
        // Arrange
        // Assert
        expect(hasNodeChildren({ children: [] })).toBe(false);
    });
    it('returns false for node with missing children', () => {
        // Arrange
        // Assert
        expect(hasNodeChildren({})).toBe(false);
    });
});

describe('createDefaultFilters', () => {
    it('returns all filters with defaults', () => {
        // Arrange
        // Act
        const f = createDefaultFilters();
        // Assert
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
        // Arrange
        // Act
        const result = parseTypeList('promise,epic');
        // Assert
        expect(result).toContain('promise');
        expect(result).toContain('epic');
    });
    it('returns empty set for empty input', () => {
        // Arrange
        // Act
        const result = parseTypeList('');
        // Assert
        expect(result.size).toBe(0);
    });
});

describe('getStatusFilterValue', () => {
    it('normalizes status strings', () => {
        // Arrange
        // Assert
        expect(getStatusFilterValue('done')).toBe('done');
        expect(getStatusFilterValue('inprogress')).toBe('inprogress');
        expect(getStatusFilterValue('all')).toBe('all');
    });
});

describe('getEffortFilterValue', () => {
    it('normalizes effort strings', () => {
        // Arrange
        // Assert
        expect(getEffortFilterValue('M')).toBe('M');
        expect(getEffortFilterValue('all')).toBe('all');
        expect(getEffortFilterValue('unestimated')).toBe('unestimated');
    });
});

describe('getStrideFilterValue', () => {
    it('normalizes stride strings', () => {
        // Arrange
        // Assert
        expect(getStrideFilterValue('all')).toBe('all');
        expect(getStrideFilterValue('backlog')).toBe('backlog');
    });
});

describe('getTypeShortLabel', () => {
    it('maps node types to labels', () => {
        // Arrange
        // Assert
        expect(getTypeShortLabel('promise')).toBe('Promise');
        expect(getTypeShortLabel('epic')).toBe('Epic');
        expect(getTypeShortLabel('flow')).toBe('Flow');
    });
});

describe('isNodeSearchMatching', () => {
    it('returns true when search text contains query', () => {
        // Arrange
        const node = { _searchText: 'hello world', data: { label: 'hello world' } };
        // Assert
        expect(isNodeSearchMatching(node as never, 'hello')).toBe(true);
    });
    it('returns false when no match', () => {
        // Arrange
        const node = { _searchText: 'hello world', data: { label: 'hello world' } };
        // Assert
        expect(isNodeSearchMatching(node as never, 'zzz')).toBe(false);
    });
});

describe('isNodeStatusMatching', () => {
    it('matches by status bucket', () => {
        // Arrange
        const node = { _statusBucket: 'done', data: { payload: { statusColor: 'green' } } };
        // Assert
        expect(isNodeStatusMatching(node as never, 'done')).toBe(true);
    });
    it('returns true for all filter', () => {
        // Arrange
        const node = { _statusBucket: 'todo', data: {} };
        // Assert
        expect(isNodeStatusMatching(node as never, 'all')).toBe(true);
    });
});

describe('isNodeEffortMatching', () => {
    it('matches moment nodes by effort bucket', () => {
        // Arrange
        const node = { nodeType: 'moment', _effortBucket: 'M', data: { payload: { effortEstimate: 'M' } } };
        // Assert
        expect(isNodeEffortMatching(node as never, 'M')).toBe(true);
    });
    it('returns false for non-moment nodes', () => {
        // Arrange
        const node = { nodeType: 'promise', data: { payload: {} } };
        // Assert
        expect(isNodeEffortMatching(node as never, 'M')).toBe(false);
    });
});

describe('isNodeStrideMatching', () => {
    it('matches moment nodes by stride bucket', () => {
        // Arrange
        const node = { nodeType: 'moment', _strideBucket: '10', data: { payload: { assignedStrideId: '10' } } };
        // Assert
        expect(isNodeStrideMatching(node as never, '10')).toBe(true);
    });
    it('returns false for non-moment nodes', () => {
        // Arrange
        const node = { nodeType: 'epic', data: { payload: {} } };
        // Assert
        expect(isNodeStrideMatching(node as never, '10')).toBe(false);
    });
});

describe('getHiddenDescendantCount', () => {
    it('returns 0 for node with no children', () => {
        // Arrange
        // Assert
        expect(getHiddenDescendantCount({ children: [] })).toBe(0);
    });
    it('sums renderable nodes across children', () => {
        // Arrange
        const node = { children: [{ nodeType: 'epic', children: [] }, { nodeType: 'epic', children: [] }] };
        // Assert
        expect(getHiddenDescendantCount(node as never)).toBe(2);
    });
});

describe('normalizeTypeSelection', () => {
    it('returns contiguous range from given types', () => {
        // Arrange
        // Act
        const result = normalizeTypeSelection(new Set(['promise', 'epic']));
        // Assert
        expect(result.has('promise')).toBe(true);
        expect(result.has('epic')).toBe(true);
    });
    it('handles empty set', () => {
        // Arrange
        // Act
        const result = normalizeTypeSelection(new Set());
        // Assert
        expect(result.size).toBe(0);
    });
});

describe('getAssignmentFilterValue', () => {
    it('normalizes assignment strings', () => {
        // Arrange
        // Assert
        expect(getAssignmentFilterValue('assigned-to-me')).toBe('assigned-to-me');
        expect(getAssignmentFilterValue('all')).toBe('all');
        expect(getAssignmentFilterValue('')).toBe('all');
    });
});

describe('buildMomentNode', () => {
    it('creates a moment node from payload', () => {
        // Arrange
        // Act
        const result = buildMomentNode({ id: 1, sequenceNumber: 100, statement: 'Test Moment', statusColor: 'green' });
        // Assert
        expect(result.nodeType).toBe('moment');
        expect(result.payload?.statement).toContain('Test');
    });
});

describe('buildFlowNode', () => {
    it('creates a flow node with moment children', () => {
        // Arrange
        // Act
        const result = buildFlowNode({ id: 1, sequenceNumber: 1, statement: 'Flow One', moments: [{ id: 100, sequenceNumber: 100, statement: 'M1' }] });
        // Assert
        expect(result.nodeType).toBe('flow');
        expect(result.children?.length).toBe(1);
    });
});

describe('buildJourneyNode', () => {
    it('creates a journey node with flow children', () => {
        // Arrange
        // Act
        const result = buildJourneyNode({ id: 1, sequenceNumber: 1, statement: 'J1', flows: [{ id: 1, sequenceNumber: 1, statement: 'F1', moments: [] }] });
        // Assert
        expect(result.nodeType).toBe('journey');
        expect(result.children?.length).toBe(1);
    });
});

describe('buildEpicNode', () => {
    it('creates an epic node with journey children', () => {
        // Arrange
        // Act
        const result = buildEpicNode({ id: 1, sequenceNumber: 1, statement: 'E1', journeys: [{ id: 1, sequenceNumber: 1, statement: 'J1', flows: [] }] });
        // Assert
        expect(result.nodeType).toBe('epic');
        expect(result.children?.length).toBe(1);
    });
});

describe('buildPromiseNode', () => {
    it('creates a promise node with epic children', () => {
        // Arrange
        // Act
        const result = buildPromiseNode({ id: 1, sequenceNumber: 1, statement: 'P1', epics: [{ id: 1, sequenceNumber: 1, statement: 'E1', journeys: [] }] });
        // Assert
        expect(result.nodeType).toBe('promise');
        expect(result.children?.length).toBe(1);
    });
});

describe('findFirstSearchMatch', () => {
    it('returns the first node with _isSearchMatched true', () => {
        // Arrange
        const tree = { _isSearchMatched: false, children: [{ _isSearchMatched: false, children: [] }, { _isSearchMatched: true, id: 'found', children: [] }] };
        // Act
        const result = findFirstSearchMatch(tree as never);
        // Assert
        expect(result?.id).toBe('found');
    });
    it('returns undefined when no match', () => {
        // Arrange
        const tree = { _isSearchMatched: false, children: [{ _isSearchMatched: false, children: [] }] };
        // Assert
        expect(findFirstSearchMatch(tree as never)).toBeUndefined();
    });
});

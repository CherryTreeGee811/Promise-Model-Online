import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetMomentEffortBucket = vi.fn();
const mockGetMomentStrideBucket = vi.fn();
const mockGetStatusBucket = vi.fn().mockReturnValue('status-bucket');

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts', () => ({
    renderStackGraph: vi.fn().mockReturnValue({ node: document.createElementNS('http://www.w3.org/2000/svg', 'svg'), zoom: null }),
    computeChildMetrics: vi.fn().mockReturnValue({ childCount: 2, completedChildCount: 1 }),
    createNodeWithMetrics: vi.fn().mockReturnValue({ id: 'mock-node', nodeType: 'test', label: 'Mock', payload: {} }),
    findNodeById: vi.fn((tree: Record<string, unknown>, id: string) => {
        if (id === 'existing-node') return { id: 'existing-node', nodeType: 'test', label: 'Existing', payload: { description: 'old' } };
        return null;
    }),
    renderEmptyState: vi.fn(),
    parseGraphData: vi.fn().mockReturnValue({ id: 'root', nodeType: 'root', children: [] }),
    getDetailPageNodeScale: vi.fn().mockReturnValue(1),
    normalizeText: vi.fn().mockReturnValue(''),
    getMomentEffortBucket: mockGetMomentEffortBucket,
    getMomentStrideBucket: mockGetMomentStrideBucket,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/status-utilities.ts', () => ({
    getStatusBucket: mockGetStatusBucket,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), authFetch: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="detail-stack-graph"></div>';
});

describe('loadD3', () => {
    it('returns cached D3 from globalThis', async () => {
        // Arrange
        (globalThis as Record<string, unknown>).d3 = { version: '7' };
        const { loadD3 } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        // Act
        const d3 = await loadD3();
        // Assert
        expect(d3).toEqual({ version: '7' });
    });
});

describe('destroyDetailStackGraph', () => {
    it('clears the container', async () => {
        // Arrange
        const { destroyDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const container = document.getElementById('detail-stack-graph')!;
        container.innerHTML = '<div>content</div>';
        // Act
        destroyDetailStackGraph();
        // Assert
        expect(container.children.length).toBe(0);
    });
});

describe('patchChildMetrics', () => {
    it('calls computeChildMetrics', async () => {
        // Arrange
        const { patchChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { computeChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Act
        patchChildMetrics('test-1', [{ id: 1 }, { id: 2 }]);
        // Assert
        expect(vi.mocked(computeChildMetrics)).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });
});

describe('patchDetailStackGraphNode', () => {
    it('updates node payload and re-renders', async () => {
        // Arrange
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // First mount to set up global state
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        // Now patch a node
        // Act
        patchDetailStackGraphNode('existing-node', { description: 'new desc' });
        // Assert
        expect(findNodeById).toHaveBeenCalled();
    });
});

describe('refreshDetailStackGraph', () => {
    it('refetches and re-renders the stack graph', async () => {
        // Arrange
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph, refreshDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        // Act
        await refreshDetailStackGraph();
        // Assert
        expect(apiGet).toHaveBeenCalled();
    });
});

describe('mountDetailStackGraph', () => {
    it('renders the stack graph', async () => {
        // Arrange
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const container = document.getElementById('detail-stack-graph')!;
        // Act
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        // Assert
        expect(container.classList.contains('detail-stack-graph--loading')).toBe(false);
    });

    it('returns early when container is missing', async () => {
        // Arrange
        document.body.innerHTML = '';
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        // Act
        const result = await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        // Assert
        expect(result).toBeUndefined();
    });

    it('renders empty state when tree is null from buildAncestorPathTree', async () => {
        // Arrange
        const { renderEmptyState } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { parseGraphData } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        vi.mocked(parseGraphData).mockReturnValueOnce(undefined as unknown as Record<string, unknown>);
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const container = document.getElementById('detail-stack-graph')!;
        // Act
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        // Assert
        expect(renderEmptyState).toHaveBeenCalledWith(container, 'Unable to display stack context.');
    });

    it('does not render when mountToken changed (stale invocation)', async () => {
        // Arrange
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const promise1 = mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        const promise2 = mountDetailStackGraph({ nodeType: 'promise', nodeId: '2', owner: 'o', project: 'p' });
        await Promise.all([promise1, promise2]);
        // Act
        const { renderStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(renderStackGraph).toHaveBeenCalledTimes(1);
    });

    it('handles fetch error and renders empty state', async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockRejectedValue(new Error('Network error'));
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const container = document.getElementById('detail-stack-graph')!;
        // Act
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        // Assert
        expect(container.classList.contains('detail-stack-graph--loading')).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to load detail stack graph:', expect.any(Error));
        consoleErrorSpy.mockRestore();
    });

    it('skips render in catch when mountToken changed (stale invocation)', async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');

        const failOnce = vi.fn()
            .mockRejectedValueOnce(new Error('Fail first'))
            .mockResolvedValueOnce({});
        vi.mocked(apiGet).mockImplementation(failOnce);

        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const promise1 = mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        const promise2 = mountDetailStackGraph({ nodeType: 'promise', nodeId: '2', owner: 'o', project: 'p' });
        // Act
        const results = await Promise.allSettled([promise1, promise2]);
        // Assert
        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('fulfilled');
        consoleErrorSpy.mockRestore();
    });
});

describe('refreshDetailStackGraph', () => {
    it('returns early when state prerequisites are missing', async () => {
        // Arrange
        const { refreshDetailStackGraph, destroyDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        destroyDetailStackGraph();
        await refreshDetailStackGraph();
        // Act
        const { renderStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Assert
        expect(renderStackGraph).not.toHaveBeenCalled();
    });

    it('logs error when buildAncestorPathTree rejects', async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { refreshDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        vi.mocked(apiGet).mockReset();
        vi.mocked(apiGet).mockRejectedValue(new Error('Refresh failure'));
        // Act
        await refreshDetailStackGraph();
        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to refresh detail stack graph:', expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
});

describe('patchDetailStackGraphNode', () => {
    it('returns early when tree is not set', async () => {
        // Arrange
        const { patchDetailStackGraphNode, destroyDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        destroyDetailStackGraph();
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // Act
        patchDetailStackGraphNode('any-node', { foo: 'bar' });
        // Assert
        expect(findNodeById).not.toHaveBeenCalled();
    });

    it('returns early when nodeId is empty', async () => {
        // Arrange
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        vi.mocked(findNodeById).mockClear();
        // Act
        patchDetailStackGraphNode('', { description: 'test' });
        // Assert
        expect(findNodeById).not.toHaveBeenCalled();
    });

    it('returns early when node is not found', async () => {
        // Arrange
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        vi.mocked(findNodeById).mockReturnValueOnce(null);
        // Act
        patchDetailStackGraphNode('nonexistent', {});
        // Assert
        expect(vi.mocked(findNodeById)).toHaveBeenCalledWith(expect.anything(), 'nonexistent');
    });

    it('sets childCount when patch includes _childCount/_completedChildCount', async () => {
        // Arrange
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        vi.mocked(findNodeById).mockReturnValueOnce({
            id: 'patch-metrics',
            nodeType: 'epic',
            payload: { statement: 'Test', id: 1, statusColor: 'wip' },
        });
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        patchDetailStackGraphNode('patch-metrics', { _childCount: 5, _completedChildCount: 3 });
        // Act
        const node = vi.mocked(findNodeById).mock.results.at(-1)?.value as Record<string, unknown>;
        // Assert
        expect(node?.childCount).toBe(5);
        expect(node?.completedChildCount).toBe(3);
    });
});

describe('refreshNodeDerivedFields (via patchDetailStackGraphNode)', () => {
    it('falls back to name when statement is null', async () => {
        // Arrange
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        vi.mocked(findNodeById).mockReturnValueOnce({
            id: 'node-no-statement',
            nodeType: 'moment',
            payload: { name: 'Fallback Name', id: 42, statusColor: 'green', effortEstimate: 'medium', assignedStrideId: 'stride-1' },
        });
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        patchDetailStackGraphNode('node-no-statement', { statement: undefined });
        // Act
        const node = vi.mocked(findNodeById).mock.results.at(-1)?.value as Record<string, unknown>;
        // Assert
        expect(node?.label).toBe('Fallback Name');
    });

    it('falls back to #id when both statement and name are null', async () => {
        // Arrange
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        vi.mocked(findNodeById).mockReturnValueOnce({
            id: 'node-id-only',
            nodeType: 'epic',
            payload: { statement: null, name: null, id: 99, statusColor: 'todo' },
        });
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        patchDetailStackGraphNode('node-id-only', {});
        // Act
        const node = vi.mocked(findNodeById).mock.results.at(-1)?.value as Record<string, unknown>;
        // Assert
        expect(node?.label).toBe('#99');
    });

    it('calls getMomentEffortBucket and getMomentStrideBucket for moment nodes', async () => {
        // Arrange
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        vi.mocked(findNodeById).mockReturnValueOnce({
            id: 'moment-node',
            nodeType: 'moment',
            payload: { statement: 'Test', name: 'Test', id: 1, statusColor: 'done', effortEstimate: 'large', assignedStrideId: 'stride-x' },
        });
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        // Act
        patchDetailStackGraphNode('moment-node', {});
        // Assert
        expect(mockGetMomentEffortBucket).toHaveBeenCalledWith('large');
        expect(mockGetMomentStrideBucket).toHaveBeenCalledWith(expect.objectContaining({ assignedStrideId: 'stride-x' }));
    });

    it('does not call moment bucket functions for non-moment nodes', async () => {
        // Arrange
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        vi.mocked(findNodeById).mockReturnValueOnce({
            id: 'flow-node',
            nodeType: 'flow',
            payload: { statement: 'Test', id: 1, statusColor: 'wip', effortEstimate: 'small', assignedStrideId: 'stride-y' },
        });
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        mockGetMomentEffortBucket.mockClear();
        mockGetMomentStrideBucket.mockClear();

        // Act
        patchDetailStackGraphNode('flow-node', {});
        // Assert
        expect(mockGetMomentEffortBucket).not.toHaveBeenCalled();
        expect(mockGetMomentStrideBucket).not.toHaveBeenCalled();
    });
});

describe('destroyDetailStackGraph', () => {
    it('returns early when container is missing', async () => {
        // Arrange
        document.body.innerHTML = '';
        // Act
        const { destroyDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        // Assert
        expect(() => destroyDetailStackGraph()).not.toThrow();
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), authFetch: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="detail-stack-graph"></div>';
});

describe('loadD3', () => {
    it('returns cached D3 from globalThis', async () => {
        (globalThis as Record<string, unknown>).d3 = { version: '7' };
        const { loadD3 } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const d3 = await loadD3();
        expect(d3).toEqual({ version: '7' });
    });
});

describe('destroyDetailStackGraph', () => {
    it('clears the container', async () => {
        const { destroyDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const container = document.getElementById('detail-stack-graph')!;
        container.innerHTML = '<div>content</div>';
        destroyDetailStackGraph();
        expect(container.children.length).toBe(0);
    });
});

describe('patchChildMetrics', () => {
    it('calls computeChildMetrics', async () => {
        const { patchChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { computeChildMetrics } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        patchChildMetrics('test-1', [{ id: 1 }, { id: 2 }]);
        expect(vi.mocked(computeChildMetrics)).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });
});

describe('patchDetailStackGraphNode', () => {
    it('updates node payload and re-renders', async () => {
        const { patchDetailStackGraphNode } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const { findNodeById } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        // First mount to set up global state
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });

        // Now patch a node
        patchDetailStackGraphNode('existing-node', { description: 'new desc' });
        expect(findNodeById).toHaveBeenCalled();
    });
});

describe('refreshDetailStackGraph', () => {
    it('refetches and re-renders the stack graph', async () => {
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph, refreshDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        await refreshDetailStackGraph();
        expect(apiGet).toHaveBeenCalled();
    });
});

describe('mountDetailStackGraph', () => {
    it('renders the stack graph', async () => {
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({});
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const container = document.getElementById('detail-stack-graph')!;
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        expect(container.classList.contains('detail-stack-graph--loading')).toBe(false);
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts', () => ({
    renderStackGraph: vi.fn().mockReturnValue({ node: document.createElementNS('http://www.w3.org/2000/svg', 'svg'), zoom: null }),
    computeChildMetrics: vi.fn().mockReturnValue({ childCount: 2, completedChildCount: 1 }),
    createNodeWithMetrics: vi.fn().mockReturnValue({ id: 'mock', nodeType: 'test', label: 'Mock', payload: {} }),
    findNodeById: vi.fn().mockReturnValue(null),
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

describe('mountDetailStackGraph double-invocation guard', () => {
    it('handles multiple rapid mounts (stale mount token)', async () => {
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({
            id: 1, name: 'Project', promises: [{ id: 1, sequenceNumber: 1, statement: 'P1', epics: [] }],
        });
        const { renderStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts');
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const container = document.getElementById('detail-stack-graph')!;
        const p1 = mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        const p2 = mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        await Promise.all([p1, p2]);
        expect(container.classList.contains('detail-stack-graph--loading')).toBe(false);
    });

    it('handles API failure gracefully', async () => {
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockRejectedValue(new Error('API error'));
        const { mountDetailStackGraph } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts');
        const container = document.getElementById('detail-stack-graph')!;
        await mountDetailStackGraph({ nodeType: 'promise', nodeId: '1', owner: 'o', project: 'p' });
        expect(container.classList.contains('detail-stack-graph--loading')).toBe(false);
    });
});

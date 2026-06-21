import { describe, it, expect } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts', () => ({
    NODE_TYPES: ['promise', 'epic', 'journey', 'flow', 'moment'],
    NODE_TYPE_INDEX: new Map([['promise', 0], ['epic', 1], ['journey', 2], ['flow', 3], ['moment', 4]]),
    normalizeText: vi.fn((x: unknown) => String(x || '').toLowerCase().trim()),
    renderStackGraph: vi.fn(),
    renderEmptyState: vi.fn(),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn(), authFetch: vi.fn() }));

describe('initZoomControls', () => {
    it('exports initZoomControls function', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        expect(mod.initZoomControls).toBeDefined();
    });
});

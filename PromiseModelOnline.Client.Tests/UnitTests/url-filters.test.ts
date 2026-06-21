import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/stack-graph-core.ts', () => ({
    NODE_TYPES: ['promise', 'epic', 'journey', 'flow', 'moment'],
    NODE_TYPE_INDEX: new Map([['promise', 0], ['epic', 1], ['journey', 2], ['flow', 3], ['moment', 4]]),
    normalizeText: vi.fn((x: unknown) => String(x || '').toLowerCase().trim()),
}));

beforeEach(() => {
    window.history.pushState({}, '', '/o/p/graph');
});

describe('readFiltersFromUrl', () => {
    it('returns defaults for empty query', async () => {
        const { readFiltersFromUrl } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const filters = readFiltersFromUrl();
        expect(filters.search).toBe('');
        expect(filters.types.size).toBeGreaterThan(0);
    });
});

describe('syncFiltersToUrl', () => {
    it('writes filter state to URL', async () => {
        const { syncFiltersToUrl } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/graph.ts');
        const spy = vi.spyOn(history, 'replaceState').mockImplementation(() => {});
        const filters = {
            search: 'test', includeChildren: true, types: new Set(['promise']),
            effort: 'all', stride: 'all', status: 'all', assignment: 'all',
        };
        syncFiltersToUrl(filters as never);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});

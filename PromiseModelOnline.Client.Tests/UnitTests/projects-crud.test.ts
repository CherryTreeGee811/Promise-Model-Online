import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ loadTemplate: vi.fn(), loadTemplateWithError: () => vi.fn(), navigate: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn(), apiGetList: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), authFetch: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="content"></div><div id="error-text"></div><div id="success-text"></div>';
});

describe('loadProjectList', () => {
    it('imports without error', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        expect(mod.loadProjectList).toBeDefined();
    });
});

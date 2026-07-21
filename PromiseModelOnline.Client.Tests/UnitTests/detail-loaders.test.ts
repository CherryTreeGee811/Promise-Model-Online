import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ loadTemplate: vi.fn(), loadTemplateWithError: () => vi.fn(), navigate: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), authFetch: vi.fn() }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="content"></div><ul id="main-menu"></ul>'
        + '<div id="error-text"></div>'
        + '<div id="promise-detail-loading"></div>'
        + '<div id="promise-detail-content"></div>'
        + '<div id="detail-stack-graph"></div>'
        + '<div id="flow-detail-content"><div id="flow-detail-loading"></div></div>'
        + '<div id="journey-detail-content"><div id="journey-detail-loading"></div></div>';
});

describe('loadPromiseDetail', () => {
    it('loads and renders promise detail', async () => {
        // Arrange
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({ id: 1, statement: 'TP', sequenceNumber: 1 });
        const nav = document.createElement('div'); const content = document.createElement('div');
        // Act & Assert
        await expect(loadPromiseDetail('o', 'p', '1', nav, content, { permission: 'Edit' })).resolves.toBeUndefined();
    });
});

describe('loadMomentDetail', () => {
    it('loads and renders moment detail', async () => {
        // Arrange
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        const { apiGet } = await import('../../PromiseModelOnline.Client/wwwroot/js/api.ts');
        vi.mocked(apiGet).mockResolvedValue({ id: 100, statement: 'TM', sequenceNumber: 100 });
        const nav = document.createElement('div'); const content = document.createElement('div');
        // Act & Assert
        await expect(loadMomentDetail('o', 'p', '100', nav, content, { permission: 'Edit' })).resolves.toBeUndefined();
    });
});

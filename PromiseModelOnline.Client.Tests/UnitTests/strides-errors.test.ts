import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts', () => ({
    assignMomentToStride: vi.fn(), updateMomentStatus: vi.fn(), updateMomentEstimate: vi.fn(),
    updateMomentOwner: vi.fn(), updateMomentType: vi.fn(),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    getProjectMembers: vi.fn().mockResolvedValue([]),
    getMyPermission: vi.fn().mockResolvedValue('Edit'),
    getStridesByIteration: vi.fn().mockResolvedValue([]),
    getMomentsByStride: vi.fn().mockResolvedValue([]),
    getMomentsByIteration: vi.fn().mockResolvedValue([]),
    progressStride: vi.fn(),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({ getProject: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({ fetchMyPermission: vi.fn().mockResolvedValue({ permission: 'Edit', isOwner: false }) }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts', () => ({ projectStore: { set: vi.fn() } }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="stride-board"></div><div id="backlog-section"></div><div id="error-text"></div><div id="project-title"></div><div id="create-stride-btn"></div><div id="create-stride-btn-label"></div><div id="stride-scrollspy-nav"></div>';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]), text: () => Promise.resolve('') });
});

describe('loadStridesList error paths', () => {
    it('exports loadStridesList', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        expect(mod.loadStridesList).toBeDefined();
    });
});

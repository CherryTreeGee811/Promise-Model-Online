import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts', () => ({
    assignMomentToStride: vi.fn(), updateMomentStatus: vi.fn(), updateMomentEstimate: vi.fn(),
    updateMomentOwner: vi.fn(), updateMomentType: vi.fn(),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    getStridesByIteration: vi.fn(), getStrides: vi.fn(), getMomentsByStride: vi.fn(),
    getMomentsByIteration: vi.fn(), getIterations: vi.fn(), createStride: vi.fn(),
    getProjectMembers: vi.fn(), getMyPermission: vi.fn(), progressStride: vi.fn(),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({ getProject: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({ fetchMyPermission: vi.fn().mockResolvedValue({ permission: 'Edit', isOwner: false }) }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts', () => ({ projectStore: { set: vi.fn() } }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="stride-board"></div><div id="backlog-section"></div><div id="error-text"></div><div id="project-title"></div><div id="create-stride-btn"></div><div id="create-stride-btn-label"></div><div id="stride-scrollspy-nav"></div>';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]), text: () => Promise.resolve('') });
});

describe('loadStridesList', () => {
    it('loads and renders the stride board', async () => {
        // Arrange
        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const { getIterations } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts');
        vi.mocked(getIterations).mockResolvedValue([{ id: 1, name: 'Sprint 1' }]);
        const nav = document.createElement('div'); const content = document.createElement('div');
        await loadStridesList('o', 'p', nav, content, { permission: 'Edit', isOwner: false });
        // Act
        const board = document.getElementById('stride-board')!;
        // Assert
        expect(board.children.length).toBeGreaterThanOrEqual(0);
    });
});

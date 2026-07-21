import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts', () => ({ projectStore: { set: vi.fn() } }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({ fetchMyPermission: vi.fn().mockResolvedValue({ permission: 'Edit', isOwner: false }) }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="content"></div><div id="error-text"></div>';
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.startsWith('/templates/')) return Promise.resolve({ ok: true, text: () => Promise.resolve('<div>mock</div>') });
        return Promise.reject(new Error('unknown'));
    });
});

describe('handleLegacyProjectRoutes error paths', () => {
    it('shows 404 for unknown projects sub-paths', async () => {
        // Arrange
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        // Act
        await handleLegacyProjectRoutes('/projects/unknown', nav, content);
        // Assert
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
    });
});

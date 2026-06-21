import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts', () => ({ projectStore: { set: vi.fn() } }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({ fetchMyPermission: vi.fn().mockResolvedValue({ permission: 'Edit', isOwner: false }) }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="content"></div><div id="error-text"></div>';
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
});

describe('handleLegacyProjectRoutes catch blocks', () => {
    it('/projects catch renders error', async () => {
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleLegacyProjectRoutes('/projects', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('/projects/add catch renders error', async () => {
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleLegacyProjectRoutes('/projects/add', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });
});

describe('handleProjectScopedRoutes catch blocks', () => {
    it('graph route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/graph', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('settings route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/settings', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('share route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/share', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('history route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/history', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('iterations route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/iterations', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('promises detail route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/promises/1', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('epics detail route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/epics/1', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('journeys detail route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/journeys/1', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('flows detail route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/flows/1', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });

    it('moments detail route catch', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/moments/1', nav, content);
        expect(content.children.length).toBeGreaterThan(0);
    });
});

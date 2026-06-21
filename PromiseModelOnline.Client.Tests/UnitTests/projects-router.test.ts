import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts', () => ({ projectStore: { set: vi.fn() } }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({ fetchMyPermission: vi.fn().mockResolvedValue({ permission: 'Edit', isOwner: false }) }));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="content"></div><ul id="main-menu"></ul><div id="error-text"></div><div id="detail-stack-graph"></div>';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<div>mock</div>') });
    (globalThis as Record<string, unknown>).tippy ??= vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn(), destroy: vi.fn(), setProps: vi.fn() });
});

describe('handleLegacyProjectRoutes', () => {
    it('renders project list for /projects', async () => {
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleLegacyProjectRoutes('/projects', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/list.html');
    });

    it('renders add form for /projects/add', async () => {
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleLegacyProjectRoutes('/projects/add', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/add.html');
    });

    it('shows 404 for unknown legacy routes', async () => {
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleLegacyProjectRoutes('/projects/unknown', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
    });
});

describe('handleProjectScopedRoutes', () => {
    it('renders strides for root path', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/strides/list.html');
    });

    it('renders graph for /{owner}/{project}/graph', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/graph', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/graph.html');
    });

    it('renders settings for /{owner}/{project}/settings', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/settings', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/settings.html');
    });

    it('renders promise detail for /{owner}/{project}/promises/1', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/promises/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/promises/detail.html');
    });

    it('renders epic detail', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/epics/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/epics/detail.html');
    });

    it('shows 404 for unknown routes', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/unknown', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
    });
});

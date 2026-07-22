import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts', () => ({ projectStore: { set: vi.fn() } }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({ fetchMyPermission: vi.fn().mockResolvedValue({ permission: 'Edit', isOwner: false }) }));

const TEST_TIMEOUT = 10_000;

beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    document.body.innerHTML = '<div id="content"></div><ul id="main-menu"></ul><div id="error-text"></div><div id="detail-stack-graph"></div>';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}), text: () => Promise.resolve('<div>mock</div>') }));
    (globalThis as Record<string, unknown>).tippy ??= vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn(), destroy: vi.fn(), setProps: vi.fn() });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('handleLegacyProjectRoutes', () => {
    it('renders project list for /projects', async () => {
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleLegacyProjectRoutes('/projects', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/list.html');
    }, TEST_TIMEOUT);

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

    it('handles fetch failure for /projects in catch block', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleLegacyProjectRoutes('/projects', nav, content);
        expect(vi.mocked(fetch)).toHaveBeenCalledWith('/templates/projects/list.html');
    });

    it('handles fetch failure for /projects/add in catch block', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
        const { handleLegacyProjectRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleLegacyProjectRoutes('/projects/add', nav, content);
        expect(vi.mocked(fetch)).toHaveBeenCalledWith('/templates/projects/add.html');
    });
});

describe('handleProjectScopedRoutes', () => {
    it('renders strides for root path', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/strides/list.html');
    });

    it('normalizes multiple leading slashes in subpath', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '///graph', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/graph.html');
    });

    it('normalizes trailing slashes in subpath', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/graph///', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/graph.html');
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

    it('renders share page for /{owner}/{project}/share', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/share', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/share.html');
    });

    it('renders history for /{owner}/{project}/history', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/history', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/projects/history.html');
    });

    it('renders iterations for /{owner}/{project}/iterations', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/iterations', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/iterations/list.html');
    });

    it('renders promise detail for /{owner}/{project}/promises/1', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/promises/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/promises/detail.html');
    });

    it('renders epic detail for /{owner}/{project}/epics/1', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/epics/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/epics/detail.html');
    });

    it('renders journey detail for /{owner}/{project}/journeys/1', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/journeys/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/journeys/detail.html');
    });

    it('renders flow detail for /{owner}/{project}/flows/1', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/flows/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/flows/detail.html');
    });

    it('renders moment detail for /{owner}/{project}/moments/1', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/moments/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/moments/detail.html');
    });

    it('shows 404 for unknown routes', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/unknown', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
    });

    it('shows 404 for unknown subpath with seq segment', async () => {
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/unknown/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
    });

    it('handles catch block in strides route (fetchMyPermission failure)', async () => {
        const { fetchMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts');
        (fetchMyPermission as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('perm fail'));
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/', nav, content);
        expect(fetchMyPermission).toHaveBeenCalled();
    });

    const CATCH_BLOCK_ROUTES = [
        ['/graph', '/templates/projects/graph.html'],
        ['/settings', '/templates/projects/settings.html'],
        ['/share', '/templates/projects/share.html'],
        ['/history', '/templates/projects/history.html'],
        ['/iterations', '/templates/iterations/list.html'],
        ['/promises/1', '/templates/promises/detail.html'],
        ['/epics/1', '/templates/epics/detail.html'],
        ['/journeys/1', '/templates/journeys/detail.html'],
        ['/flows/1', '/templates/flows/detail.html'],
        ['/moments/1', '/templates/moments/detail.html'],
    ] as const;

    for (const [subPath, expectedTemplate] of CATCH_BLOCK_ROUTES) {
        it(`handles catch block in ${subPath} route`, async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
            const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
            const nav = document.createElement('div'); const content = document.createElement('div');
            await handleProjectScopedRoutes('o', 'p', subPath, nav, content);
            expect(vi.mocked(fetch)).toHaveBeenCalledWith(expectedTemplate);
        });
    }

    it('handles fetchMyPermission returning undefined permission in iterations route', async () => {
        const { fetchMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts');
        (fetchMyPermission as ReturnType<typeof vi.fn>).mockResolvedValue({ permission: undefined, isOwner: false });
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/iterations', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/iterations/list.html');
    });

    it('handles fetchMyPermission returning undefined permission in epic route', async () => {
        const { fetchMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts');
        (fetchMyPermission as ReturnType<typeof vi.fn>).mockResolvedValue({ permission: undefined, isOwner: false });
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/epics/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/epics/detail.html');
    });

    it('handles fetchMyPermission returning undefined permission in journey route', async () => {
        const { fetchMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts');
        (fetchMyPermission as ReturnType<typeof vi.fn>).mockResolvedValue({ permission: undefined, isOwner: false });
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/journeys/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/journeys/detail.html');
    });

    it('handles fetchMyPermission returning undefined permission in flow route', async () => {
        const { fetchMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts');
        (fetchMyPermission as ReturnType<typeof vi.fn>).mockResolvedValue({ permission: undefined, isOwner: false });
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/flows/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/flows/detail.html');
    });

    it('handles fetchMyPermission returning undefined permission in moment route', async () => {
        const { fetchMyPermission } = await import('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts');
        (fetchMyPermission as ReturnType<typeof vi.fn>).mockResolvedValue({ permission: undefined, isOwner: false });
        const { handleProjectScopedRoutes } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts');
        const nav = document.createElement('div'); const content = document.createElement('div');
        await handleProjectScopedRoutes('o', 'p', '/moments/1', nav, content);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/moments/detail.html');
    });
});

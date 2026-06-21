import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts', () => ({ initDeleteAccountPage: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ checkSession: vi.fn().mockResolvedValue(false) }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/guards.ts', () => ({ requireAuth: () => ({ allowed: true }) }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/home.ts', () => ({ loadHomePage: vi.fn() }));

beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div><ul id="main-menu"></ul><main id="main-content" tabindex="-1"></main>';
    document.title = 'Test';
    const titleEl = document.createElement('title');
    titleEl.id = 'page-title';
    document.head.append(titleEl);
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<div>mock page</div>') });
    Object.defineProperty(globalThis, 'location', {
        value: { ...globalThis.location, pathname: '/', assign: vi.fn() }, writable: true,
    });
});

describe('loadTemplate', () => {
    it('fetches template and replaces content', async () => {
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const contentDiv = document.getElementById('content')!;
        await loadTemplate('test.html', contentDiv);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/test.html');
        expect(contentDiv.innerHTML).toContain('mock page');
    });

    it('sets the page title', async () => {
        const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const contentDiv = document.getElementById('content')!;
        await loadTemplate('test.html', contentDiv);
        const titleEl = document.getElementById('page-title');
        expect(titleEl?.textContent).toBeTruthy();
    });
});

describe('navigate', () => {
    it('pushes history state', async () => {
        const { navigate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const contentDiv = document.getElementById('content')!;
        const navDiv = document.getElementById('main-menu')!;
        const pushState = vi.spyOn(history, 'pushState');
        await navigate('/projects', navDiv, contentDiv);
        expect(pushState).toHaveBeenCalledWith({}, '', '/projects');
    });
});

describe('isDetailRoute', () => {
    it('returns true for matching 2-segment route', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const cd = document.createElement('div');
        const nd = document.createElement('div');
        const result = mod.isDetailRoute('/epics/5', cd, 'epics', '', vi.fn(), nd, '');
        expect(result).toBe(true);
    });

    it('returns false for non-matching route', async () => {
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const cd = document.createElement('div');
        const nd = document.createElement('div');
        const result = mod.isDetailRoute('/graph', cd, 'epics', '', vi.fn(), nd, '');
        expect(result).toBe(false);
    });
});

describe('showNotFound', () => {
    it('loads 404 template', async () => {
        const { showNotFound } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const cd = document.createElement('div');
        await showNotFound(cd);
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
    });
});

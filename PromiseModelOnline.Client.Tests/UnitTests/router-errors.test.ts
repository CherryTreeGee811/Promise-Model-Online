import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts', () => ({ initDeleteAccountPage: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ checkSession: vi.fn().mockResolvedValue(false) }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/guards.ts', () => ({ requireAuth: () => ({ allowed: true }) }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/home.ts', () => ({ loadHomePage: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts', () => ({ loadNavTemplate: vi.fn(() => Promise.resolve()), initNavEventDelegation: vi.fn() }));

beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div><ul id="main-menu"></ul><main id="main-content"></main>';
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === '/templates/404.html') return Promise.resolve({ ok: true, text: () => Promise.resolve('<h1>404</h1>') });
        if (url === '/templates/error.html') return Promise.resolve({ ok: true, text: () => Promise.resolve('<h1>Error</h1><span id="error-title"></span><span id="error-message"></span>') });
        return Promise.reject(new Error('unknown url'));
    });
    Object.defineProperty(globalThis, 'location', { value: { ...globalThis.location, pathname: '/unknown-path', assign: vi.fn() }, writable: true });
});

describe('routeHandler 404 fallback', () => {
    it('loads 404 for unknown routes', async () => {
        // Arrange
        const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.getElementById('main-menu')!;
        const content = document.getElementById('content')!;
        // Act
        await routeHandler(nav, content);
        // Assert
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
    });
});

describe('loadTemplateWithError inner catch', () => {
    it('renders inline fallback when error template fails', async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));
        const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.getElementById('main-menu')!;
        const content = document.getElementById('content')!;
        // Act
        await routeHandler(nav, content);
        // Assert
        expect(content.querySelector('h1')).toBeTruthy();
    });
});

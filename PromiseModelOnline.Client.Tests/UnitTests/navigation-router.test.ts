import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<ul id="main-menu"></ul>';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<nav data-test="injected">mock nav</nav>') });
});

describe('loadNavTemplate', () => {
    it('fetches anonymous template and injects into nav', async () => {
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const nav = document.getElementById('main-menu')!;
        const cd = document.createElement('div');
        await loadNavTemplate(nav, cd);
        expect(globalThis.fetch).toHaveBeenCalled();
        expect(nav.innerHTML).toContain('mock nav');
    });
});

describe('initNavEventDelegation', () => {
    it('binds click delegation on main-menu', async () => {
        const { initNavEventDelegation } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const nav = document.getElementById('main-menu')!;
        const cd = document.createElement('div');
        initNavEventDelegation(nav, cd);
        expect(nav.dataset.navBound).toBe('1');
    });

    it('is idempotent (does not rebind)', async () => {
        const { initNavEventDelegation } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const nav = document.getElementById('main-menu')!;
        const cd = document.createElement('div');
        initNavEventDelegation(nav, cd);
        initNavEventDelegation(nav, cd);
        expect(nav.dataset.navBound).toBe('1');
    });
});

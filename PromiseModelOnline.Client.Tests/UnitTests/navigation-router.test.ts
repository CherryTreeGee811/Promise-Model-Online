import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts', () => ({
    isLoggedIn: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts', () => ({
    startNotificationPolling: vi.fn(), getUnreadNotificationsEventName: vi.fn(), updateNotificationBadge: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({
    navigate: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<ul id="main-menu"></ul>';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<nav data-test="injected">mock nav</nav>') });
    Object.defineProperty(globalThis, 'location', {
        value: { pathname: '/test', href: 'https://test.local/test', assign: vi.fn() },
        writable: true,
    });
});

describe('setActiveNavLink', () => {
    it('does nothing when no data-nav links exist', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        document.body.innerHTML = '<ul id="main-menu"></ul>';
        const nav = document.getElementById('main-menu')!;
        // Act
        await loadNavTemplate(nav, document.createElement('div'));
        // Assert
        expect(nav.innerHTML).toContain('mock nav');
    });

    it('marks link as active on exact path match', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<a data-nav href="/test">Test</a>'),
        });
        document.body.innerHTML = '<ul id="main-menu"></ul>';
        const nav = document.getElementById('main-menu')!;
        await loadNavTemplate(nav, document.createElement('div'));
        // Act
        const link = nav.querySelector('a');
        // Assert
        expect(link?.getAttribute('aria-current')).toBe('page');
    });

    it('marks link as active on startsWith path match', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        Object.defineProperty(globalThis, 'location', {
            value: { pathname: '/test/child', href: 'https://test.local/test/child', assign: vi.fn() },
            writable: true,
        });
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<a data-nav href="/test">Test</a>'),
        });
        document.body.innerHTML = '<ul id="main-menu"></ul>';
        const nav = document.getElementById('main-menu')!;
        await loadNavTemplate(nav, document.createElement('div'));
        // Act
        const link = nav.querySelector('a');
        // Assert
        expect(link?.getAttribute('aria-current')).toBe('page');
    });

    it('skips root path for startsWith to avoid overmatching', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        Object.defineProperty(globalThis, 'location', {
            value: { pathname: '/test', href: 'https://test.local/test', assign: vi.fn() },
            writable: true,
        });
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<a data-nav href="/">Home</a><a data-nav href="/test">Test</a>'),
        });
        document.body.innerHTML = '<ul id="main-menu"></ul>';
        const nav = document.getElementById('main-menu')!;
        await loadNavTemplate(nav, document.createElement('div'));
        // Act
        const links = nav.querySelectorAll('a');
        // Assert
        expect(links[0]?.getAttribute('aria-current')).toBeNull();
        expect(links[1]?.getAttribute('aria-current')).toBe('page');
    });

    it('handles href="#" gracefully (skipped before matching link)', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<a data-nav href="/test">Test</a><a data-nav href="#">Placeholder</a>'),
        });
        document.body.innerHTML = '<ul id="main-menu"></ul>';
        const nav = document.getElementById('main-menu')!;
        await loadNavTemplate(nav, document.createElement('div'));
        // Act
        const links = nav.querySelectorAll('a');
        // Assert
        expect(links[0]?.getAttribute('aria-current')).toBe('page');
        const placeholderHref = links[1]?.getAttribute('href');
        expect(placeholderHref).toBe('#');
    });

    it('does not crash when a link has no href (skipped before matching link)', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<a data-nav href="/test">Test</a><a data-nav>NoHref</a>'),
        });
        document.body.innerHTML = '<ul id="main-menu"></ul>';
        const nav = document.getElementById('main-menu')!;
        await loadNavTemplate(nav, document.createElement('div'));
        // Act
        const links = nav.querySelectorAll('a');
        // Assert
        expect(links[0]?.getAttribute('aria-current')).toBe('page');
        const noHrefAttr = links[1]?.getAttribute('href');
        expect(noHrefAttr).toBeNull();
    });
});

describe('handleNavClick', () => {
    it('does nothing when clicking outside a link', async () => {
        // Arrange
        const { initNavEventDelegation } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { navigate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.getElementById('main-menu')!;
        initNavEventDelegation(nav, document.createElement('div'));
        // Act
        nav.click();
        // Assert
        expect(navigate).not.toHaveBeenCalled();
    });

    it('does nothing on link with href="#"', async () => {
        // Arrange
        const { initNavEventDelegation } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { navigate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.getElementById('main-menu')!;
        nav.innerHTML = '<a data-nav href="#">Click</a>';
        initNavEventDelegation(nav, document.createElement('div'));
        const link = nav.querySelector('a')!;
        // Act
        link.click();
        // Assert
        expect(navigate).not.toHaveBeenCalled();
    });

    it('calls navigate on valid data-nav link click', async () => {
        // Arrange
        const { initNavEventDelegation } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { navigate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
        const nav = document.getElementById('main-menu')!;
        const contentDiv = document.createElement('div');
        nav.innerHTML = '<a data-nav href="/valid-path">Link</a>';
        initNavEventDelegation(nav, contentDiv);
        const link = nav.querySelector('a')!;
        // Act
        link.click();
        // Assert
        expect(navigate).toHaveBeenCalledWith('/valid-path', nav, contentDiv);
    });
});

describe('loadNavTemplate', () => {
    it('returns early when navContentDiv is null', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        // Act
        const result = await loadNavTemplate(null as unknown as HTMLElement, document.createElement('div'));
        // Assert
        expect(result).toBeUndefined();
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('returns early when navContentDiv is undefined', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        // Act
        const result = await loadNavTemplate(undefined as unknown as HTMLElement, document.createElement('div'));
        // Assert
        expect(result).toBeUndefined();
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('fetches anonymous template when not logged in', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        const nav = document.getElementById('main-menu')!;
        // Act
        await loadNavTemplate(nav, document.createElement('div'));
        // Assert
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/navigation/anonymous.html');
    });

    it('fetches authenticated template when logged in', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(true);
        const nav = document.getElementById('main-menu')!;
        // Act
        await loadNavTemplate(nav, document.createElement('div'));
        // Assert
        expect(globalThis.fetch).toHaveBeenCalledWith('/templates/navigation/authenticated.html');
    });

    it('starts notification polling when logged in after load', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        const { startNotificationPolling } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(true);
        const nav = document.getElementById('main-menu')!;
        // Act
        await loadNavTemplate(nav, document.createElement('div'));
        // Assert
        expect(startNotificationPolling).toHaveBeenCalled();
    });

    it('does not start notification polling when not logged in', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        const { startNotificationPolling } = await import('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        const nav = document.getElementById('main-menu')!;
        // Act
        await loadNavTemplate(nav, document.createElement('div'));
        // Assert
        expect(startNotificationPolling).not.toHaveBeenCalled();
    });

    it('throws and shows error when response is not ok', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('Not Found') });
        // Act
        const nav = document.getElementById('main-menu')!;
        // Assert
        await expect(loadNavTemplate(nav, document.createElement('div'))).rejects.toThrow('Network response was not ok');
        expect(nav.innerHTML).toContain('Error loading template');
    });

    it('throws and shows error on network failure', async () => {
        // Arrange
        const { loadNavTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const { isLoggedIn } = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        (isLoggedIn as ReturnType<typeof vi.fn>).mockReturnValue(false);
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
        // Act
        const nav = document.getElementById('main-menu')!;
        // Assert
        await expect(loadNavTemplate(nav, document.createElement('div'))).rejects.toThrow('Network error');
        expect(nav.innerHTML).toContain('Error loading template');
    });
});

describe('initNavEventDelegation', () => {
    it('binds click delegation on main-menu', async () => {
        // Arrange
        const { initNavEventDelegation } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const nav = document.getElementById('main-menu')!;
        // Act
        initNavEventDelegation(nav, document.createElement('div'));
        // Assert
        expect(nav.dataset.navBound).toBe('1');
    });

    it('is idempotent (does not rebind)', async () => {
        // Arrange
        const { initNavEventDelegation } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        const nav = document.getElementById('main-menu')!;
        initNavEventDelegation(nav, document.createElement('div'));
        // Act
        initNavEventDelegation(nav, document.createElement('div'));
        // Assert
        expect(nav.dataset.navBound).toBe('1');
    });

    it('does nothing if #main-menu is missing', async () => {
        const { initNavEventDelegation } = await import('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts');
        document.body.innerHTML = '';
        initNavEventDelegation(document.createElement('div'), document.createElement('div'));
    });
});

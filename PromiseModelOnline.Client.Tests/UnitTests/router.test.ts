import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockRequireAuth,
  mockLoadNavTemplate,
  mockHandleLegacyProjectRoutes,
  mockHandleProjectScopedRoutes,
  mockHandleNotificationsRoutes,
  mockHandleInvitationsRoute,
  mockHandleKnowledgeBaseRoutes,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn().mockReturnValue({ allowed: true }),
  mockLoadNavTemplate: vi.fn().mockResolvedValue(undefined),
  mockHandleLegacyProjectRoutes: vi.fn(),
  mockHandleProjectScopedRoutes: vi.fn(),
  mockHandleNotificationsRoutes: vi.fn(),
  mockHandleInvitationsRoute: vi.fn(),
  mockHandleKnowledgeBaseRoutes: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/account/delete-account.ts', () => ({ initDeleteAccountPage: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/account/preferences.ts', () => ({ initPreferencesPage: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/api.ts', () => ({ checkSession: vi.fn().mockResolvedValue(false) }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/guards.ts', () => ({ requireAuth: mockRequireAuth }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/home.ts', () => ({ loadHomePage: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/invitations/router.ts', () => ({ handleInvitationsRoute: mockHandleInvitationsRoute }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/knowledge-base/router.ts', () => ({ handleKnowledgeBaseRoutes: mockHandleKnowledgeBaseRoutes }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts', () => ({ loadMyTasksPage: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/navigation/router.ts', () => ({
  loadNavTemplate: mockLoadNavTemplate,
  initNavEventDelegation: vi.fn(),
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/notifications/router.ts', () => ({ handleNotificationsRoutes: mockHandleNotificationsRoutes }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/telemetry.ts', () => ({ initTelemetry: vi.fn() }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/router.ts', () => ({
  handleLegacyProjectRoutes: mockHandleLegacyProjectRoutes,
  handleProjectScopedRoutes: mockHandleProjectScopedRoutes,
}));

beforeEach(() => {
  document.body.innerHTML = `
    <div id="content"></div>
    <ul id="main-menu"></ul>
    <main id="main-content" tabindex="-1"></main>
    <a id="home-link" href="/">Home</a>
  `;
  document.title = 'Test';
  const existingTitle = document.querySelector('#page-title');
  if (existingTitle) existingTitle.remove();
  const titleEl = document.createElement('title');
  titleEl.id = 'page-title';
  document.head.append(titleEl);

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve('<div>mock page</div>'),
  });

  Object.defineProperty(globalThis, 'location', {
    value: {
      ...globalThis.location,
      pathname: '/',
      assign: vi.fn(),
      replace: vi.fn(),
    },
    writable: true,
    configurable: true,
  });

  globalThis.requestAnimationFrame = vi.fn().mockImplementation((cb: Function) => { cb(); return 0; });
  history.pushState = vi.fn((_data: unknown, _title: string, url?: string | URL | null) => {
    if (url) location.pathname = String(url);
  }) as unknown as typeof history.pushState;
  history.back = vi.fn() as unknown as typeof history.back;

  mockRequireAuth.mockReturnValue({ allowed: true });
  mockLoadNavTemplate.mockResolvedValue(undefined);
  mockHandleLegacyProjectRoutes.mockReset();
  mockHandleProjectScopedRoutes.mockReset();
});

describe('loadTemplate', () => {
  it('fetches template and replaces content', async () => {
    // Arrange
    const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const contentDiv = document.getElementById('content')!;
    // Act
    await loadTemplate('test.html', contentDiv);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/test.html');
    expect(contentDiv.innerHTML).toContain('mock page');
  });

  it('sets the page title from PAGE_TITLES', async () => {
    // Arrange
    location.pathname = '/';
    const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const contentDiv = document.getElementById('content')!;
    // Act
    await loadTemplate('test.html', contentDiv);
    // Assert
    expect(document.querySelector('#page-title')?.textContent).toContain('Home');
  });

  it('sets dynamic page title when path not in PAGE_TITLES', async () => {
    // Arrange
    location.pathname = '/some-custom-route';
    const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const contentDiv = document.getElementById('content')!;
    // Act
    await loadTemplate('test.html', contentDiv);
    // Assert
    expect(document.querySelector('#page-title')?.textContent).toBe('Some custom route - Promise Model Online');
  });

  it('uses Home fallback when path has no segments after filtering', async () => {
    // Arrange
    location.pathname = '';
    const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const contentDiv = document.getElementById('content')!;
    // Act
    await loadTemplate('test.html', contentDiv);
    // Assert
    expect(document.querySelector('#page-title')?.textContent).toBe('Home - Promise Model Online');
  });

  it('throws on bad response', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, text: vi.fn() });
    const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    // Act
    const contentDiv = document.getElementById('content')!;
    // Assert
    await expect(loadTemplate('missing.html', contentDiv)).rejects.toThrow('Network response was not ok');
  });

  it('handles missing page-title element', async () => {
    // Arrange
    document.querySelector('#page-title')?.remove();
    const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const contentDiv = document.getElementById('content')!;
    // Act
    await loadTemplate('test.html', contentDiv);
    // Assert
    expect(contentDiv.innerHTML).toContain('mock page');
  });

  it('handles missing main-content element in announceAndFocus', async () => {
    // Arrange
    document.querySelector('#main-content')?.remove();
    const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const contentDiv = document.getElementById('content')!;
    // Act
    await loadTemplate('test.html', contentDiv);
    // Assert
    expect(contentDiv.innerHTML).toContain('mock page');
  });

  it('skips focus when active element is unrelated', async () => {
    // Arrange
    const other = document.createElement('button');
    other.id = 'other-btn';
    document.body.prepend(other);
    other.focus();
    const { loadTemplate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const contentDiv = document.getElementById('content')!;
    const mainEl = document.getElementById('main-content')!;
    const focusSpy = vi.spyOn(mainEl, 'focus');
    // Act
    await loadTemplate('test.html', contentDiv);
    // Assert
    expect(focusSpy).not.toHaveBeenCalled();
  });
});

describe('navigate', () => {
  it('pushes history state and calls routeHandler', async () => {
    // Arrange
    const { navigate } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const contentDiv = document.getElementById('content')!;
    const navDiv = document.getElementById('main-menu')!;
    // Act
    await navigate('/projects', navDiv, contentDiv);
    // Assert
    expect(history.pushState).toHaveBeenCalledWith({}, '', '/projects');
  });
});

describe('isDetailRoute', () => {
  it('returns true for matching 2-segment route', async () => {
    // Arrange
    const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    const nd = document.createElement('div');
    // Act
    const result = mod.isDetailRoute('/epics/5', cd, 'epics', '', vi.fn(), nd, '');
    // Assert
    expect(result).toBe(true);
  });

  it('returns false when segment count does not equal 2', async () => {
    // Arrange
    const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    const nd = document.createElement('div');
    // Act
    const result = mod.isDetailRoute('/graph', cd, 'epics', '', vi.fn(), nd, '');
    // Assert
    expect(result).toBe(false);
  });

  it('returns false when 2 segments but prefix does not match', async () => {
    // Arrange
    const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    const nd = document.createElement('div');
    // Act
    const result = mod.isDetailRoute('/other/5', cd, 'epics', '', vi.fn(), nd, '');
    // Assert
    expect(result).toBe(false);
  });

  it('catches loadTemplate failure and calls loadTemplateWithError', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));
    const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    const nd = document.createElement('div');
    // Act
    const result = mod.isDetailRoute('/epics/5', cd, 'epics', 'epics.html', vi.fn(), nd, 'epics');
    // Assert
    expect(result).toBe(true);
  });

  it('handles nested catch failure gracefully', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));
    document.querySelector('#error-title')?.remove();
    document.querySelector('#error-message')?.remove();
    const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    const nd = document.createElement('div');
    // Act
    const result = mod.isDetailRoute('/epics/5', cd, 'epics', 'epics.html', vi.fn(), nd, 'epics');
    // Assert
    expect(result).toBe(true);
  });

  it('calls loadFunction with the detail segment', async () => {
    // Arrange
    const loadFn = vi.fn();
    const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    const nd = document.createElement('div');
    mod.isDetailRoute('/epics/42', cd, 'epics', 'epics.html', loadFn, nd, 'epics');
    // Act
    await new Promise(resolve => setTimeout(resolve, 0));
    // Assert
    expect(loadFn).toHaveBeenCalledWith('42', nd, cd);
  });
});

describe('showNotFound', () => {
  it('loads 404 template', async () => {
    // Arrange
    const { showNotFound } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    // Act
    await showNotFound(cd);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
  });
});

describe('loadTemplateWithError', () => {
  it('renders error page with title and message elements', async () => {
    // Arrange
    const { loadTemplateWithError } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    const errorTitle = document.createElement('span');
    errorTitle.id = 'error-title';
    document.body.append(errorTitle);
    const errorMsg = document.createElement('span');
    errorMsg.id = 'error-message';
    document.body.append(errorMsg);
    // Act
    await loadTemplateWithError(cd, 'test page')();
    // Assert
    expect(cd.innerHTML).toContain('mock page');
    expect(errorTitle.textContent).toBe('Something went wrong');
    expect(errorMsg.textContent).toBe('Failed to load test page. Please try again.');
  });

  it('renders error page without title/message elements', async () => {
    // Arrange
    const { loadTemplateWithError } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    // Act
    await loadTemplateWithError(cd, 'test page')();
    // Assert
    expect(cd.innerHTML).toContain('mock page');
  });

  it('renders inline fallback when error template fetch fails', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));
    const { loadTemplateWithError } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const cd = document.createElement('div');
    // Act
    await loadTemplateWithError(cd, 'test page')();
    // Assert
    expect(cd.querySelector('h1')?.textContent).toBe('Something went wrong');
    expect(cd.querySelector('p')?.textContent).toBe('Please try again.');
  });
});

describe('routeHandler', () => {
  it('returns early for /login, /logout, /register paths', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/login';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.innerHTML).toBe('');

    location.pathname = '/logout';
    await routeHandler(nav, content);
    expect(content.innerHTML).toBe('');

    location.pathname = '/register';
    await routeHandler(nav, content);
    expect(content.innerHTML).toBe('');
  });

  it('routes root path / to home page', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.innerHTML).toContain('mock page');
  });

  it('routes with guard allowed', async () => {
    // Arrange
    mockRequireAuth.mockReturnValue({ allowed: true });
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/moments/my-tasks';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.innerHTML).toContain('mock page');
  });

  it('blocks route when guard returns allowed: false without redirect', async () => {
    // Arrange
    mockRequireAuth.mockReturnValue({ allowed: false });
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/moments/my-tasks';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.innerHTML).toBe('');
  });

  it('blocks route and navigates when guard returns redirect', async () => {
    // Arrange
    mockRequireAuth.mockReturnValue({ allowed: false, redirect: '/login' });
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/notifications';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(history.pushState).toHaveBeenCalledWith({}, '', '/login');
  });

  it('shows 404 for unmatched route with < 2 segments', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/some-unknown-path';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
  });

  it('shows inline error when 404 template fetch fails', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/unknown';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.querySelector('h1')?.textContent).toBe('Page not found');
  });

  it('handles project-scoped route for non-reserved owner', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/myowner/myproject/graph';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(mockHandleProjectScopedRoutes).toHaveBeenCalledWith(
      'myowner', 'myproject', '/graph', nav, content
    );
  });

  it('handles project-scoped route with query string', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/owner/proj/board';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(mockHandleProjectScopedRoutes).toHaveBeenCalledWith(
      'owner', 'proj', '/board', nav, content
    );
  });

  it('shows 404 for account-scoped project path', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/account/settings';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
  });

  it('shows 404 for moments-scoped project path', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/moments/tasks';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
  });

  it('shows 404 for knowledge-base-scoped project path', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/knowledge-base/article';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
  });

  it('shows error page when project routes throw', async () => {
    // Arrange
    mockHandleProjectScopedRoutes.mockImplementation(() => { throw new Error('project error'); });
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/owner/proj/board';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.querySelector('h1')?.textContent).toBe('Failed to load project. Please try again.');
  });

  it('shows error page when 404 fetch fails for account-scoped path', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/account/settings';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.querySelector('h1')?.textContent).toBe('Page not found');
  });

  it('calls showErrorPage with null contentDiv returns early', async () => {
    // Arrange
    mockHandleProjectScopedRoutes.mockImplementation(() => { throw new Error('fail'); });
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    // Act
    location.pathname = '/owner/proj/board';
    // Assert
    await expect(routeHandler(nav, null!)).resolves.toBeUndefined();
  });

  it('handles /projects route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/projects';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(mockHandleLegacyProjectRoutes).toHaveBeenCalledWith('/projects', nav, content);
  });

  it('handles /projects sub-route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/projects/add';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(mockHandleLegacyProjectRoutes).toHaveBeenCalledWith('/projects/add', nav, content);
  });

  it('shows error when /projects handler fails', async () => {
    // Arrange
    mockHandleLegacyProjectRoutes.mockImplementation(() => { throw new Error('legacy error'); });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<h1 id="error-title"></h1><p id="error-message"></p>'),
    });
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/projects';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.innerHTML).toContain('Something went wrong');
  });

  it('handles /moments/my-tasks route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/moments/my-tasks';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.innerHTML).toContain('mock page');
  });

  it('handles /notifications route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/notifications';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(mockHandleNotificationsRoutes).toHaveBeenCalledWith('/notifications', nav, content);
  });

  it('handles /invitations route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/invitations';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(mockHandleInvitationsRoute).toHaveBeenCalledWith('/invitations', content);
  });

  it('handles /change-password route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/change-password';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(location.assign).toHaveBeenCalledWith('/account/change-password');
  });

  it('handles /knowledge-base route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/knowledge-base';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(mockHandleKnowledgeBaseRoutes).toHaveBeenCalledWith('/knowledge-base', nav, content);
  });

  it('handles /privacy route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/privacy';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/privacy.html');
  });

  it('handles /tos route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/tos';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/tos.html');
  });

  it('handles /account/delete route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/account/delete';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/account/delete.html');
  });

  it('handles /preferences route', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/preferences';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/account/preferences.html');
  });

  it('handles moment my-tasks error by showing loadTemplateWithError', async () => {
    // Arrange
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fail'));
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/moments/my-tasks';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.querySelector('h1')?.textContent).toBe('Something went wrong');
  });
});

describe('event listeners - click delegation', () => {
  it('navigates on a[data-nav] click', async () => {
    // Arrange
    await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const link = document.createElement('a');
    link.setAttribute('data-nav', '');
    link.setAttribute('href', '/projects');
    document.body.append(link);
    // Act
    link.click();
    // Assert
    expect(history.pushState).toHaveBeenCalledWith({}, '', '/projects');
  });

  it('does not navigate on a[data-nav] click with href="#"', async () => {
    // Arrange
    await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    history.pushState = vi.fn();
    const link = document.createElement('a');
    link.setAttribute('data-nav', '');
    link.setAttribute('href', '#');
    document.body.append(link);
    // Act
    link.click();
    // Assert
    expect(history.pushState).not.toHaveBeenCalled();
  });

  it('does not navigate on a[data-nav] click with no href', async () => {
    // Arrange
    await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    history.pushState = vi.fn();
    const link = document.createElement('a');
    link.setAttribute('data-nav', '');
    document.body.append(link);
    // Act
    link.click();
    // Assert
    expect(history.pushState).not.toHaveBeenCalled();
  });

  it('goes back on [data-action="back"] click', async () => {
    // Arrange
    await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const backBtn = document.createElement('button');
    backBtn.setAttribute('data-action', 'back');
    document.body.append(backBtn);
    // Act
    backBtn.click();
    // Assert
    expect(history.back).toHaveBeenCalled();
  });

  it('does nothing on click without nav link or back button', async () => {
    // Arrange
    await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    history.pushState = vi.fn();
    history.back = vi.fn();
    const btn = document.createElement('button');
    btn.textContent = 'Click me';
    document.body.append(btn);
    // Act
    btn.click();
    // Assert
    expect(history.pushState).not.toHaveBeenCalled();
    expect(history.back).not.toHaveBeenCalled();
  });
});

describe('initApp / appReady', () => {
  it('resolves to true', async () => {
    // Act
    const { appReady } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    // Assert
    await expect(appReady).resolves.toBe(true);
  });

  it('triggers popstate route handling', async () => {
    // Arrange
    await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    mockLoadNavTemplate.mockClear();
    // Act
    window.dispatchEvent(new PopStateEvent('popstate'));
    // Assert
    expect(mockLoadNavTemplate).toHaveBeenCalled();
  });

  it('navigates home on home-link click', async () => {
    // Arrange
    vi.resetModules();
    await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const homeLink = document.getElementById('home-link')!;
    // Act
    homeLink.click();
    // Assert
    expect(history.pushState).toHaveBeenCalledWith({}, '', '/');
  });

  it('handles missing home-link element', async () => {
    // Arrange
    document.querySelector('#home-link')?.remove();
    vi.resetModules();
    // Act
    const { appReady } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    // Assert
    await expect(appReady).resolves.toBe(true);
  });
});

describe('initServiceWorker', () => {
  it('skips registration when serviceWorker not available', async () => {
    // Arrange
    delete (navigator as Record<string, unknown>).serviceWorker;
    vi.resetModules();
    // Act
    const { appReady } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    // Assert
    await expect(appReady).resolves.toBe(true);
  });

  it('handles successful serviceWorker registration', async () => {
    // Arrange
    const registerMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: registerMock },
      configurable: true,
    });
    vi.resetModules();
    // Act
    const { appReady } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    // Assert
    await expect(appReady).resolves.toBe(true);
    expect(registerMock).toHaveBeenCalledWith('/sw.mjs', { scope: '/' });
  });

  it('handles serviceWorker registration failure', async () => {
    // Arrange
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registerMock = vi.fn().mockRejectedValue(new Error('reg failed'));
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: registerMock },
      configurable: true,
    });
    vi.resetModules();
    // Act
    const { appReady } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    // Assert
    await expect(appReady).resolves.toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});

describe('handleProjectScopedPath query string handling', () => {
  it('preserves query string in subPath when present', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/owner/proj/board';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(mockHandleProjectScopedRoutes).toHaveBeenCalledWith(
      'owner', 'proj', '/board', nav, content
    );
  });
});

describe('isRouteBlocked via hasMatchingStaticRoute', () => {
  it('allows route with no guard', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(content.innerHTML).toContain('mock page');
  });
});

describe('hasMatchingStaticRoute returns false for unmatched path', () => {
  it('falls through to 404 for /unknown', async () => {
    // Arrange
    const { routeHandler } = await import('../../PromiseModelOnline.Client/wwwroot/js/router.ts');
    const nav = document.getElementById('main-menu')!;
    const content = document.getElementById('content')!;
    location.pathname = '/nonexistent';
    // Act
    await routeHandler(nav, content);
    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/templates/404.html');
  });
});

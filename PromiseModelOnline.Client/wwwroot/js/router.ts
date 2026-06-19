import { initDeleteAccountPage } from './account/delete-account.ts';
import { checkSession } from './api.ts';
import { requireAuth } from './guards.ts';
import { loadHomePage } from './home.ts';
import { handleInvitationsRoute } from './invitations/router.ts';
import { handleKnowledgeBaseRoutes } from './knowledge-base/router.ts';
import { loadMyTasksPage } from './moments/my-tasks.ts';
import { loadNavTemplate, initNavEventDelegation } from './navigation/router.ts';
import { handleNotificationsRoutes } from './notifications/router.ts';

/**
 * @typedef {{ allowed: true } | { allowed: false; redirect?: string }} GuardResult
 */

/**
 * @typedef {(navContentDiv: HTMLElement, contentDiv: HTMLElement) => void} RouteHandler
 */

/**
 * @typedef {object} Route
 * @property {(path: string) => boolean} test - Function to test if the path matches this route.
 * @property {() => GuardResult | Promise<GuardResult>} [guard] - Optional guard to check before handling.
 * @property {RouteHandler} handler - Function to render the page content.
 */

interface ProjectRoutesModule {
  /** Handle legacy project routes (non-slug-based) like /projects and /projects/add. */
  handleLegacyProjectRoutes: (path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement) => void;
  /** Handle project-scoped routes with owner and project slugs (e.g. /{owner}/{project}/graph). */
  handleProjectScopedRoutes: (owner: string, project: string, subPath: string, navContentDiv: HTMLElement, contentDiv: HTMLElement) => void;
}

const _routeCache: { projectRoutes: Promise<ProjectRoutesModule> | undefined } = { projectRoutes: undefined };

/**
 * Lazy-load the project routes module.
 * Uses a cached promise to avoid re-importing on subsequent calls.
 * @returns {Promise<ProjectRoutesModule>} The project routes module.
 */
function loadProjectRoutes(): Promise<ProjectRoutesModule> {
  if (!_routeCache.projectRoutes) {
    _routeCache.projectRoutes = import('./projects/router.ts');
  }
  return _routeCache.projectRoutes;
}

/**
 * Declarative route table.
 * Each entry has a test function, optional guard, and handler.
 * Routes are evaluated in order; the first match is used.
 * @type {Route[]}
 */
const ROUTES = [
  {
    test: (p) => p === '/',
    handler: async (_nav, contentDiv) => {
      await loadTemplate('home.html', contentDiv);
      loadHomePage();
    },
  },
  {
    test: (p) => p.startsWith('/projects'),
    handler: async (navContentDiv, contentDiv) => {
      const path = location.pathname;
      try {
        const { handleLegacyProjectRoutes } = await loadProjectRoutes();
        handleLegacyProjectRoutes(path, navContentDiv, contentDiv);
      } catch {
        void loadTemplateWithError(contentDiv, 'projects')();
      }
    },
  },
  {
    test: (p) => p === '/moments/my-tasks',
    guard: requireAuth,
    handler: async (navContentDiv, contentDiv) => {
      try {
        await loadTemplate('moments/my-tasks.html', contentDiv);
        void loadMyTasksPage(navContentDiv, contentDiv);
      } catch {
        void loadTemplateWithError(contentDiv, 'my tasks')();
      }
    },
  },
  {
    test: (p) => p.startsWith('/notifications'),
    guard: requireAuth,
    handler: (navContentDiv, contentDiv) => {
      void handleNotificationsRoutes(location.pathname, navContentDiv, contentDiv);
    },
  },
  {
    test: (p) => p.startsWith('/invitations'),
    guard: requireAuth,
    handler: (_nav, contentDiv) => {
      void handleInvitationsRoute(location.pathname, contentDiv);
    },
  },
  {
    test: (p) => p === '/change-password',
    guard: requireAuth,
    handler: () => {
      location.assign('/account/change-password');
    },
  },
  {
    test: (p) => p === '/knowledge-base',
    handler: (navContentDiv, contentDiv) => {
      void handleKnowledgeBaseRoutes(location.pathname, navContentDiv, contentDiv);
    },
  },
  {
    test: (p) => p === '/privacy',
    handler: (_nav, contentDiv) => {
      void loadTemplate('privacy.html', contentDiv);
    },
  },
  {
    test: (p) => p === '/tos',
    handler: (_nav, contentDiv) => {
      void loadTemplate('tos.html', contentDiv);
    },
  },
  {
    test: (p) => p === '/account/delete',
    guard: requireAuth,
    handler: async (_nav, contentDiv) => {
      await loadTemplate('account/delete.html', contentDiv);
      initDeleteAccountPage();
    },
  },
];

/**
 *
 */
async function initServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.mjs', { scope: '/' });
    } catch (error) {
      console.warn('SW registration failed:', error);
    }
  }
}

/**
 *
 */
function initApplication(): void {
  void initServiceWorker();

  document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.querySelector('#content') as HTMLElement;
    const navContentDiv = document.querySelector('#main-menu') as HTMLElement;

    await checkSession();

    initNavEventDelegation(navContentDiv, contentDiv);

    document.addEventListener('click', (event: MouseEvent) => {
      const navLink = (event.target as Element).closest('a[data-nav]');
      if (navLink) {
        const path = navLink.getAttribute('href');
        if (path && path !== '#') {
          event.preventDefault();
          void navigate(path, navContentDiv, contentDiv);
          return;
        }
      }

      const backButton = (event.target as Element).closest('[data-action="back"]');
      if (backButton) {
        event.preventDefault();
        history.back();
      }
    });

    document.querySelector('#home-link')?.addEventListener('click', (event: Event) => {
        event.preventDefault();
        void navigate('/', navContentDiv, contentDiv);
    });

    addEventListener('popstate', () => {
        void routeHandler(navContentDiv, contentDiv);
    });

    void routeHandler(navContentDiv, contentDiv);
  });
}

/* eslint-disable-next-line unicorn/no-top-level-side-effects */
initApplication();

/**
 * Navigate to a new path, updating the URL and rendering the page.
 * @param {string} path - The target URL path.
 * @param {HTMLElement} navContentDiv - The navigation container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 * @returns {void}
 */
export async function navigate(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    history.pushState({}, '', path);
    await routeHandler(navContentDiv, contentDiv);
}


const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/projects': 'Projects',
  '/notifications': 'Notifications',
  '/invitations': 'Invitations',
  '/knowledge-base': 'Knowledge Base',
  '/moments/my-tasks': 'My Tasks',
};

/**
 * Focus the main content area element for accessibility announcements.
 * Uses requestAnimationFrame to ensure the DOM is ready before focusing.
 */
function announceAndFocus(): void {
  const mainElement = document.querySelector('#main-content');
  if (mainElement) { requestAnimationFrame(() => (mainElement as HTMLElement).focus()); }
}

/**
 * Set the browser page title based on the current route.
 * @param {string} path - The current URL path.
 */
function setPageTitle(path: string): void {
  const titleElement = document.querySelector('#page-title');
  if (!titleElement) return;
  let title = PAGE_TITLES[path];
  if (!title) {
    const segments = path.split('/').filter(Boolean);
    title = segments.length > 0 ? segments.at(-1)! : 'Home';
    title = title.charAt(0).toUpperCase() + title.slice(1).replaceAll('-', ' ');
  }
  titleElement.textContent = `${title} - Promise Model Online`;
}

/**
 * Fetch an HTML template and inject it into the content area.
 * @param {string} templateName - The template path relative to /templates/.
 * @param {HTMLElement} contentDiv - The container to render into.
 * @returns {Promise<void>} Promise that resolves when the template is loaded.
 */
export async function loadTemplate(templateName: string, contentDiv: HTMLElement): Promise<void> {
    const response = await fetch(`/templates/${templateName}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const html = await response.text();
    const parser = new DOMParser();
    const document_ = parser.parseFromString(html, 'text/html');
    contentDiv.replaceChildren(...document_.body.childNodes);
    setPageTitle(location.pathname);
    announceAndFocus();
}

/**
 * Handle a detail route with owner/project path pattern.
 * @param {string} path - The full URL path.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} routePrefix - The route prefix to match (e.g., "epics").
 * @param {string} templateName - The template to load on match.
 * @param {(...args: unknown[]) => void} loadFunction - The module function to initialize the page.
 * @param {HTMLElement} navContentDiv - The navigation container.
 * @param {string} label - Human-readable label for error messages.
 * @returns {boolean} True if the route was handled.
 */
export function isDetailRoute(
  path: string,
  contentDiv: HTMLElement,
  routePrefix: string,
  templateName: string,
  loadFunction: (...arguments_: any[]) => void,
  navContentDiv: HTMLElement,
  label: string
): boolean {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 2 && segments[0] === routePrefix) {
    void (async () => {
      try {
        await loadTemplate(templateName, contentDiv);
        loadFunction(segments[1], navContentDiv, contentDiv);
      } catch {
        loadTemplateWithError(contentDiv, label)().catch(() => {});
      }
    })();
    return true;
  }
  return false;
}

/**
 * Show the 404 not-found page.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export function showNotFound(contentDiv: HTMLElement): void {
  void loadTemplate('404.html', contentDiv);
}

/**
 * Return an error handler function that shows a template error page.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} label - Human-readable label for error messages.
 * @returns {() => Promise<void>} The error handler.
 */
export function loadTemplateWithError(contentDiv: HTMLElement, label: string): () => Promise<void> {
  return async () => {
    try {
      const r = await fetch('/templates/error.html');
      const html = await r.text();
      const parser = new DOMParser();
      const document_ = parser.parseFromString(html, 'text/html');
      contentDiv.replaceChildren(...document_.body.childNodes);
      setPageTitle(location.pathname);
      const titleElement = document.querySelector('#error-title');
      const messageElement = document.querySelector('#error-message');
      if (titleElement) titleElement.textContent = 'Something went wrong';
      if (messageElement) messageElement.textContent = `Failed to load ${label}. Please try again.`;
      announceAndFocus();
    } catch {
       
      contentDiv.replaceChildren();
      const h1 = document.createElement('h1');
      h1.textContent = 'Something went wrong';
      contentDiv.append(h1);
      const p = document.createElement('p');
      p.textContent = 'Please try again.';
      contentDiv.append(p);
      setPageTitle(location.pathname);
      announceAndFocus();
    }
  };
}

/**
 * Main route handler matching URL paths to pages.
 * @param {HTMLElement} navContentDiv - The navigation container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export async function routeHandler(navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const path = location.pathname;

    if (['/login', '/logout', '/register'].includes(path)) {
        location.assign(path);
        return;
    }

    void loadNavTemplate(navContentDiv, contentDiv);

    for (const route of ROUTES) {
      if (route.test(path)) {
        if (route.guard) {
          const result = route.guard();
          if ('allowed' in result && !result.allowed) {
            if (result.redirect) {
              void navigate(result.redirect, navContentDiv, contentDiv);
            }
            return;
          }
        }
        void route.handler(navContentDiv, contentDiv);
        return;
      }
    }

    // Default: project-scoped routes or 404
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2) {
        const owner = segments[0];
        const project = segments[1];
        const subPath = '/' + segments.slice(2).join('/') + (path.includes('?') ? path.slice(path.indexOf('?')) : '');

        if (['account', 'moments', 'knowledge-base'].includes(owner)) {
            try {
                await loadTemplate('404.html', contentDiv);
            } catch {
                 
                contentDiv.replaceChildren();
                const h1 = document.createElement('h1');
                h1.textContent = 'Page not found';
                contentDiv.append(h1);
                setPageTitle(path);
                announceAndFocus();
            }
        } else {
            try {
                const { handleProjectScopedRoutes } = await loadProjectRoutes();
                handleProjectScopedRoutes(owner, project, subPath, navContentDiv, contentDiv);
            } catch {
                 
                contentDiv.replaceChildren();
                const h1_ = document.createElement('h1');
                h1_.textContent = 'Something went wrong';
                contentDiv.append(h1_);
                const p_ = document.createElement('p');
                p_.textContent = 'Failed to load project. Please try again.';
                contentDiv.append(p_);
                setPageTitle(path);
                announceAndFocus();
            }
        }
    } else {
        try {
            await loadTemplate('404.html', contentDiv);
        } catch {
             
            contentDiv.replaceChildren();
            const h1_2 = document.createElement('h1');
            h1_2.textContent = 'Page not found';
            contentDiv.append(h1_2);
            setPageTitle(path);
            announceAndFocus();
        }
    }
}

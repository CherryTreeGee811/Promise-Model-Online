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

let _projectRoutes: Promise<ProjectRoutesModule> | undefined;

/**
 * Lazy-load the project routes module.
 * Uses a cached promise to avoid re-importing on subsequent calls.
 * @returns {Promise<ProjectRoutesModule>} The project routes module.
 */
function loadProjectRoutes(): Promise<ProjectRoutesModule> {
  return _projectRoutes || (_projectRoutes = import('./projects/router.ts'));
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
    handler: (_nav, contentDiv) => {
      loadTemplate('home.html', contentDiv).then(() => loadHomePage());
    },
  },
  {
    test: (p) => p.startsWith('/projects'),
    handler: (navContentDiv, contentDiv) => {
      const path = window.location.pathname;
      loadProjectRoutes().then(({ handleLegacyProjectRoutes }) => {
        handleLegacyProjectRoutes(path, navContentDiv, contentDiv);
      }).catch(loadTemplateWithError(contentDiv, 'projects'));
    },
  },
  {
    test: (p) => p === '/moments/my-tasks',
    guard: requireAuth,
    handler: (navContentDiv, contentDiv) => {
      loadTemplate('moments/my-tasks.html', contentDiv)
        .then(() => loadMyTasksPage(navContentDiv, contentDiv))
        .catch(loadTemplateWithError(contentDiv, 'my tasks'));
    },
  },
  {
    test: (p) => p.startsWith('/notifications'),
    guard: requireAuth,
    handler: (navContentDiv, contentDiv) => {
      handleNotificationsRoutes(window.location.pathname, navContentDiv, contentDiv);
    },
  },
  {
    test: (p) => p.startsWith('/invitations'),
    guard: requireAuth,
    handler: (_nav, contentDiv) => {
      handleInvitationsRoute(window.location.pathname, contentDiv);
    },
  },
  {
    test: (p) => p === '/change-password',
    guard: requireAuth,
    handler: () => {
      window.location.href = '/account/change-password';
    },
  },
  {
    test: (p) => p === '/knowledge-base',
    handler: (navContentDiv, contentDiv) => {
      handleKnowledgeBaseRoutes(window.location.pathname, navContentDiv, contentDiv);
    },
  },
  {
    test: (p) => p === '/privacy',
    handler: (_nav, contentDiv) => {
      loadTemplate('privacy.html', contentDiv);
    },
  },
  {
    test: (p) => p === '/tos',
    handler: (_nav, contentDiv) => {
      loadTemplate('tos.html', contentDiv);
    },
  },
  {
    test: (p) => p === '/account/delete',
    guard: requireAuth,
    handler: (_nav, contentDiv) => {
      loadTemplate('account/delete.html', contentDiv)
        .then(() => initDeleteAccountPage());
    },
  },
];

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.mjs', { scope: '/' }).catch(err => console.warn('SW registration failed:', err));
}

document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.getElementById('content') as HTMLElement;
    const navContentDiv = document.getElementById('main-menu') as HTMLElement;

    await checkSession();

    initNavEventDelegation(navContentDiv, contentDiv);

    document.addEventListener('click', (e: MouseEvent) => {
      const navLink = (e.target as Element).closest('a[data-nav]');
      if (navLink) {
        const path = navLink.getAttribute('href');
        if (path && path !== '#') {
          e.preventDefault();
          navigate(path, navContentDiv, contentDiv);
          return;
        }
      }

      const backBtn = (e.target as Element).closest('[data-action="back"]');
      if (backBtn) {
        e.preventDefault();
        window.history.back();
      }
    });

    document.getElementById('home-link')?.addEventListener('click', (e: Event) => {
        e.preventDefault();
        navigate('/', navContentDiv, contentDiv);
    });

    window.addEventListener('popstate', () => {
        routeHandler(navContentDiv, contentDiv);
    });

    routeHandler(navContentDiv, contentDiv);
});

/**
 * Navigate to a new path, updating the URL and rendering the page.
 * @param {string} path - The target URL path.
 * @param {HTMLElement} navContentDiv - The navigation container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 * @returns {void}
 */
export function navigate(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    window.history.pushState({}, '', path);
    return routeHandler(navContentDiv, contentDiv);
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
  const mainEl = document.getElementById('main-content');
  if (mainEl) { requestAnimationFrame(() => mainEl.focus()); }
}

/**
 * Set the browser page title based on the current route.
 * @param {string} path - The current URL path.
 */
function setPageTitle(path: string): void {
  const titleEl = document.getElementById('page-title');
  if (!titleEl) return;
  let title = PAGE_TITLES[path];
  if (!title) {
    const segments = path.split('/').filter(Boolean);
    title = segments.length ? segments[segments.length - 1] : 'Home';
    title = title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, ' ');
  }
  titleEl.textContent = `${title} - Promise Model Online`;
}

/**
 * Fetch an HTML template and inject it into the content area.
 * @param {string} templateName - The template path relative to /templates/.
 * @param {HTMLElement} contentDiv - The container to render into.
 * @returns {Promise<void>} Promise that resolves when the template is loaded.
 */
export function loadTemplate(templateName: string, contentDiv: HTMLElement): Promise<void> {
    return fetch(`/templates/${templateName}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            contentDiv.innerHTML = html;
            setPageTitle(window.location.pathname);
            announceAndFocus();
        });
}

/**
 * Handle a detail route with owner/project path pattern.
 * @param {string} path - The full URL path.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} routePrefix - The route prefix to match (e.g., "epics").
 * @param {string} templateName - The template to load on match.
 * @param {(...args: unknown[]) => void} loadFn - The module function to initialize the page.
 * @param {HTMLElement} navContentDiv - The navigation container.
 * @param {string} label - Human-readable label for error messages.
 * @returns {boolean} True if the route was handled.
 */
export function handleDetailRoute(
  path: string,
  contentDiv: HTMLElement,
  routePrefix: string,
  templateName: string,
  loadFn: (...args: any[]) => void,
  navContentDiv: HTMLElement,
  label: string
): boolean {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 2 && segments[0] === routePrefix) {
    loadTemplate(templateName, contentDiv)
      .then(() => loadFn(segments[1], navContentDiv, contentDiv))
      .catch(loadTemplateWithError(contentDiv, label));
    return true;
  }
  return false;
}

/**
 * Show the 404 not-found page.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export function showNotFound(contentDiv: HTMLElement): void {
  loadTemplate('404.html', contentDiv);
}

/**
 * Return an error handler function that shows a template error page.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} label - Human-readable label for error messages.
 * @returns {() => Promise<void>} The error handler.
 */
export function loadTemplateWithError(contentDiv: HTMLElement, label: string): () => Promise<void> {
  return () => {
    return fetch('/templates/error.html')
      .then(r => r.text())
      .then(html => {
        contentDiv.innerHTML = html;
        setPageTitle(window.location.pathname);
        const titleEl = document.getElementById('error-title');
        const msgEl = document.getElementById('error-message');
        if (titleEl) titleEl.textContent = 'Something went wrong';
        if (msgEl) msgEl.textContent = `Failed to load ${label}. Please try again.`;
        announceAndFocus();
      })
      .catch(() => {
        contentDiv.innerHTML = '<h1>Something went wrong</h1><p>Please try again.</p>';
        setPageTitle(window.location.pathname);
        announceAndFocus();
      });
  };
}

/**
 * Main route handler matching URL paths to pages.
 * @param {HTMLElement} navContentDiv - The navigation container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export function routeHandler(navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const path = window.location.pathname;

    if (path === '/login' || path === '/logout' || path === '/register') {
        window.location.href = path;
        return;
    }

    loadNavTemplate(navContentDiv, contentDiv);

    for (const route of ROUTES) {
      if (route.test(path)) {
        if (route.guard) {
          const result = route.guard();
          if ('allowed' in result && !result.allowed) {
            if (result.redirect) {
              navigate(result.redirect, navContentDiv, contentDiv);
            }
            return;
          }
        }
        route.handler(navContentDiv, contentDiv);
        return;
      }
    }

    // Default: project-scoped routes or 404
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2) {
        const owner = segments[0];
        const project = segments[1];
        const subPath = '/' + segments.slice(2).join('/') + (path.includes('?') ? path.slice(path.indexOf('?')) : '');

        if (owner === 'account' || owner === 'moments' || owner === 'knowledge-base') {
            loadTemplate('404.html', contentDiv)
                .catch(() => {
                    contentDiv.innerHTML = '<h1>Page not found</h1>';
                    setPageTitle(path);
                    announceAndFocus();
                });
        } else {
            loadProjectRoutes().then(({ handleProjectScopedRoutes }) => {
                handleProjectScopedRoutes(owner, project, subPath, navContentDiv, contentDiv);
            }).catch(() => {
                contentDiv.innerHTML = '<h1>Something went wrong</h1><p>Failed to load project. Please try again.</p>';
                setPageTitle(path);
                announceAndFocus();
            });
        }
    } else {
        loadTemplate('404.html', contentDiv)
            .catch(() => {
                contentDiv.innerHTML = '<h1>Page not found</h1>';
                setPageTitle(path);
                announceAndFocus();
            });
    }
}

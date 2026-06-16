import { loadHomePage } from './home.mjs';
import { loadNavTemplate, initNavEventDelegation } from './navigation/router.mjs';
import { clearAuth, isLoggedIn } from './auth-state.mjs';
import { checkSession } from './api.mjs';
import { loadMyTasksPage } from './moments/my-tasks.mjs';
import { handleNotificationsRoutes } from './notifications/router.mjs';
import { handleInvitationsRoute } from './invitations/router.mjs';
import { handleKnowledgeBaseRoutes } from './knowledge-base/router.mjs';
import { initDeleteAccountPage } from './account/delete-account.mjs';

let _projectRoutes;

/**
 * Lazy-load the project routes module.
 * Uses a cached promise to avoid re-importing on subsequent calls.
 * @returns {Promise<{handleLegacyProjectRoutes: Function, handleProjectScopedRoutes: Function}>} The project routes module.
 */
function loadProjectRoutes() {
  return _projectRoutes || (_projectRoutes = import('./projects/router.mjs'));
}

// Register the service worker for offline support.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.mjs', { scope: '/' }).catch(() => {});
}

/** Bootstrap the SPA on DOM content loaded. */
document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.getElementById('content');
    const navContentDiv = document.getElementById('main-menu');

    await checkSession();

    initNavEventDelegation(navContentDiv, contentDiv);

    // Listen for client-side navigation clicks and back button actions.
    document.addEventListener('click', e => {
      const navLink = e.target.closest('a[data-nav]');
      if (navLink) {
        const path = navLink.getAttribute('href');
        if (path && path !== '#') {
          e.preventDefault();
          navigate(path, navContentDiv, contentDiv);
          return;
        }
      }

      const backBtn = e.target.closest('[data-action="back"]');
      if (backBtn) {
        e.preventDefault();
        window.history.back();
      }
    });

    document.getElementById('home-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate('/', navContentDiv, contentDiv);
    });

    // Handle browser back/forward navigation.
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
 */
export function navigate(path, navContentDiv, contentDiv) {
    window.history.pushState({}, '', path);
    return routeHandler(navContentDiv, contentDiv);
}

const PAGE_TITLES = {
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
function announceAndFocus() {
  const mainEl = document.getElementById('main-content');
  if (mainEl) { requestAnimationFrame(() => mainEl.focus()); }
}

/**
 * Set the browser page title based on the current route.
 * @param {string} path - The current URL path.
 */
function setPageTitle(path) {
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
 * @returns {Promise<void>}
 */
export function loadTemplate(templateName, contentDiv) {
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
 * @param {Function} loadFn - The module function to initialize the page.
 * @param {HTMLElement} navContentDiv - The navigation container.
 * @param {string} label - Human-readable label for error messages.
 * @returns {boolean} True if the route was handled.
 */
export function handleDetailRoute(path, contentDiv, routePrefix, templateName, loadFn, navContentDiv, label) {
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
export function showNotFound(contentDiv) {
  loadTemplate('404.html', contentDiv);
}

/**
 * Return an error handler function that shows a template error page.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} label - Human-readable label for error messages.
 * @returns {Function} The error handler.
 */
export function loadTemplateWithError(contentDiv, label) {
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
export function routeHandler(navContentDiv, contentDiv) {
    let path = window.location.pathname;

    // Legacy auth paths — let the server handle them.
    if (path === '/login' || path === '/logout' || path === '/register') {
        window.location.href = path;
        return;
    }

    loadNavTemplate(navContentDiv, contentDiv);

    switch (true) {
        case path == '/':
            loadTemplate('home.html', contentDiv).then(() => {
                return loadHomePage();
            });
            break;
        case path.startsWith('/projects'):
            loadProjectRoutes().then(({ handleLegacyProjectRoutes }) => {
                handleLegacyProjectRoutes(path, navContentDiv, contentDiv);
            }).catch(loadTemplateWithError(contentDiv, 'projects'));
            break;
        case path === '/moments/my-tasks':
            loadTemplate('moments/my-tasks.html', contentDiv)
                .then(() => loadMyTasksPage(navContentDiv, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'my tasks'));
            break;
        case path.startsWith('/notifications'):
            handleNotificationsRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/invitations'):
            handleInvitationsRoute(path, contentDiv);
            break;
        case path == '/change-password':
            if (!isLoggedIn()) {
                navigate('/login', navContentDiv, contentDiv);
                break;
            }
            window.location.href = '/account/change-password';
            break;
        case path == '/knowledge-base':
            handleKnowledgeBaseRoutes(path, navContentDiv, contentDiv);
            break;
        case path == '/privacy':
            loadTemplate('privacy.html', contentDiv);
            break;
        case path == '/tos':
            loadTemplate('tos.html', contentDiv);
            break;
        case path == '/account/delete':
            loadTemplate('account/delete.html', contentDiv)
                .then(() => initDeleteAccountPage());
            break;
        default: {
            // Attempt to match owner/project slug patterns.
            const projectPattern = path.match(/^\/([^\/]+)\/([^\/]+)(\/.*)?$/);
            if (projectPattern) {
                const owner = projectPattern[1];
                const project = projectPattern[2];
                const subPath = projectPattern[3] || '';

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
    }
}

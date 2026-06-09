import { loadHomePage } from './home.mjs';
import { loadNavTemplate, initNavEventDelegation } from './navigation/router.mjs';
import { clearAuth, isLoggedIn } from './auth-state.mjs';
import { stopNotificationPolling } from './notifications/badge.mjs';
import { checkSession } from './api.mjs';
import { handleLegacyProjectRoutes, handleProjectScopedRoutes } from './projects/router.mjs';
import { loadMyTasksPage } from './moments/my-tasks.mjs';
import { handleNotificationsRoutes } from './notifications/router.mjs';
import { handleInvitationsRoute } from './invitations/router.mjs';
import { handleKnowledgeBaseRoutes } from './knowledge-base/router.mjs';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.mjs', { scope: '/' }).catch(() => {});
}

document.addEventListener('DOMContentLoaded', async () => {
    const contentDiv = document.getElementById('content');
    const navContentDiv = document.getElementById('main-menu');

    await checkSession();

    initNavEventDelegation(navContentDiv, contentDiv);

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

    window.addEventListener('popstate', () => {
        routeHandler(navContentDiv, contentDiv);
    });

    routeHandler(navContentDiv, contentDiv);
});

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

function announceAndFocus() {
  const mainEl = document.getElementById('main-content');
  if (mainEl) mainEl.focus();
}

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

export function showNotFound(contentDiv) {
  loadTemplate('404.html', contentDiv);
}

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

export function routeHandler(navContentDiv, contentDiv) {
    let path = window.location.pathname;

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
            handleLegacyProjectRoutes(path, navContentDiv, contentDiv);
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
        default: {
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
                    handleProjectScopedRoutes(owner, project, subPath, navContentDiv, contentDiv);
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

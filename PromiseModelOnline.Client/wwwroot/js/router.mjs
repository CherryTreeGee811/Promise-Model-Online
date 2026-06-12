import { loadHomePage } from './home.mjs';
<<<<<<< HEAD
import { loadNavTemplate, initNavEventDelegation } from './navigation/router.mjs';
import { clearAuth, isLoggedIn } from './auth-state.mjs';
import { checkSession } from './api.mjs';
import { loadMyTasksPage } from './moments/my-tasks.mjs';
import { handleNotificationsRoutes } from './notifications/router.mjs';
import { handleInvitationsRoute } from './invitations/router.mjs';
import { handleKnowledgeBaseRoutes } from './knowledge-base/router.mjs';
||||||| 1bedf4f
=======
import { loadNavTemplate } from './navigation/router.mjs';
import { loadLoginForm } from './login.mjs';
import { loadRegistrationForm } from './register.mjs';
import { loadChangePasswordForm } from './change-password.mjs';
import { clearTokens, getAccessToken } from './auth-state.mjs';
import { requestLogout } from './api.mjs';
import { handleProjectRoutes } from './projects/router.mjs';
import { handleMomentRoutes } from './moments/router.mjs';
import { handleFlowRoutes } from './flows/router.mjs';
import { handleJourneyRoutes } from './journeys/router.mjs';
import { handleEpicRoutes } from './epics/router.mjs';
import { handlePromiseRoutes } from './promises/router.mjs';
import { handleNotificationsRoutes } from './notifications/router.mjs';
import { handleInvitationsRoute } from './invitations/router.mjs';
import { handleIterationRoutes } from './iterations/router.mjs';
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

let _projectRoutes;
function loadProjectRoutes() {
  return _projectRoutes || (_projectRoutes = import('./projects/router.mjs'));
}

<<<<<<< HEAD
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
||||||| 1bedf4f
    // Handle browser back/forward navigation
    window.addEventListener("popstate", routeHandler);
=======
    // Handle browser back/forward navigation
    window.addEventListener("popstate", () => {
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
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
  if (mainEl) { requestAnimationFrame(() => mainEl.focus()); }
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
<<<<<<< HEAD

    if (path === '/login' || path === '/logout' || path === '/register') {
        window.location.href = path;
        return;
    }

||||||| 1bedf4f
    const path = window.location.pathname;
=======
    
    // Handle logout
    if (path === '/logout') {
    requestLogout()
        .then(() => {
            clearTokens();
            window.history.replaceState({}, '', '/');
            path = '/';
            loadNavTemplate(navContentDiv, contentDiv);
            loadTemplate("home.html", contentDiv).then(() => {
                return loadHomePage();
            });
        })
        .catch((error) => {
            console.error('Logout failed:', error);
            // Still clear cookies and redirect even if API call fails
            clearTokens();
            window.history.replaceState({}, '', '/');
            path = '/';
            loadNavTemplate(navContentDiv, contentDiv);
            loadTemplate("home.html", contentDiv).then(() => {
                return loadHomePage();
            });
        });
        return;
    }
    
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    loadNavTemplate(navContentDiv, contentDiv);

    switch (true) {
        case path == '/':
            loadTemplate('home.html', contentDiv).then(() => {
                return loadHomePage();
            });
            break;
<<<<<<< HEAD
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
||||||| 1bedf4f
        default:
            contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
=======
        case path == '/login':
            loadTemplate("login.html", contentDiv).then(() => {
                return loadLoginForm(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading login form js:', error);
            });
            break;
        case path.startsWith('/projects'):
            handleProjectRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/moments/'):
            handleMomentRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/flows/'):
            handleFlowRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/journeys/'):
            handleJourneyRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/epics/'):
            handleEpicRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/promises/'):
            handlePromiseRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/projects') && path.includes('/iterations'):
            handleIterationRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/projects'):
            handleProjectRoutes(path, navContentDiv, contentDiv);
            break;
        case path == '/register':
            loadTemplate("register.html", contentDiv).then(() => {
                return loadRegistrationForm(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading registration form js:', error);
            });
            break;
        case path.startsWith('/notifications'):
            handleNotificationsRoutes(path, navContentDiv, contentDiv);
            break;
        case path.startsWith('/invitations'):
            handleInvitationsRoute(path, contentDiv);
            break;
        case path == '/change-password':
            // Protect route: require authentication
            if (!getAccessToken()) {
                window.history.pushState({}, '', '/login');
                loadNavTemplate(navContentDiv, contentDiv);
                loadTemplate("login.html", contentDiv).then(() => {
                    return loadLoginForm(navContentDiv, contentDiv);
                });
                break;
            }

            loadTemplate("change-password.html", contentDiv).then(() => {
                return loadChangePasswordForm(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading change password form js:', error);
            });
            break;
        default:
            contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}

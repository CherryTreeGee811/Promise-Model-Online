<<<<<<< HEAD
import { navigate } from '../router.mjs';
import { isLoggedIn } from '../auth-state.mjs';
import { startNotificationPolling } from '../notifications/badge.mjs';

function setActiveNavLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('#main-menu a[data-nav]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const isActive = href === currentPath ||
            (href !== '/' && currentPath.startsWith(href));
        link.removeAttribute('aria-current');
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        }
    });
}

function handleNavClick(e, navContentDiv, contentDiv) {
    const link = e.target.closest('a[data-nav]');
    if (!link) return;

    const path = link.getAttribute('href');
    if (!path || path === '#') return;

    e.preventDefault();
    navigate(path, navContentDiv, contentDiv);
}

export function loadNavTemplate(navContentDiv, contentDiv) {
    const templateName = isLoggedIn() ? 'authenticated.html' : 'anonymous.html';

    return fetch(`/templates/navigation/${templateName}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            navContentDiv.innerHTML = html;
            setActiveNavLink();
            if (isLoggedIn()) startNotificationPolling();
        })
        .catch(error => {
            navContentDiv.innerHTML = `<h1>Error loading template</h1><p>${error.message}</p>`;
            throw error;
        });
}

export function initNavEventDelegation(navContentDiv, contentDiv) {
    const menu = document.getElementById('main-menu');
    if (!menu || menu.dataset.navBound) return;
    menu.dataset.navBound = '1';

    menu.addEventListener('click', (e) => handleNavClick(e, navContentDiv, contentDiv));
}
||||||| 1bedf4f
=======
import { routeHandler } from '../router.mjs';
import { getAccessToken } from '../auth-state.mjs';
import { startNotificationPolling } from '../notifications/badge.mjs';

function initGeneralLinkListeners(navContentDiv, contentDiv) {
    document.getElementById("home-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/');
        routeHandler(navContentDiv, contentDiv);
    });
}

function initAuthenticatedLinkListeners(navContentDiv, contentDiv) {
    const notificationLink = document.getElementById("notifications-link");
    if (notificationLink) {
        notificationLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/notifications');
            routeHandler(navContentDiv, contentDiv);
        });
    }
   
    document.getElementById("my-tasks-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/moments/my-tasks');
        routeHandler(navContentDiv, contentDiv);
    });
    
    document.getElementById("logout-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/logout');
        routeHandler(navContentDiv, contentDiv);
    });

    document.getElementById("projects-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/projects');
        routeHandler(navContentDiv, contentDiv);
    });

    const changeLink = document.getElementById("change-password-link");
    if (changeLink) {
        changeLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/change-password');
            routeHandler(navContentDiv, contentDiv);
        });
    }

    const invLink = document.getElementById("invitations-link");
    if (invLink) {
        invLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/invitations');
            routeHandler(navContentDiv, contentDiv);
        });
    }
}

function initAnonymousLinkListeners(navContentDiv, contentDiv) {
    document.getElementById("login-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/login');
        routeHandler(navContentDiv, contentDiv);
    });

    document.getElementById("register-link").addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/register');
        routeHandler(navContentDiv, contentDiv);
    });
}

export function loadNavTemplate(navContentDiv, contentDiv) {
    let templateName = "anonymous.html";

    // Check if an existing token exists
    const token = getAccessToken();
    if (token) {
        templateName = "authenticated.html";
    }

    return fetch(`/templates/navigation/${templateName}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            navContentDiv.innerHTML = html;
            
            if (getAccessToken()) {
                startNotificationPolling();
            }
            
            initNavLinkListeners(templateName, navContentDiv, contentDiv);
            return Promise.resolve();
        })
        .catch(error => {
            navContentDiv.innerHTML = `<h1>Error loading template</h1><p>${error.message}</p>`;
            return Promise.reject(error);
        });
}

function initNavLinkListeners(templateName, navContentDiv, contentDiv) {
    initGeneralLinkListeners(navContentDiv, contentDiv);
    if (templateName === "authenticated.html") {
        initAuthenticatedLinkListeners(navContentDiv, contentDiv);
    }
    else {
        initAnonymousLinkListeners(navContentDiv, contentDiv);
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

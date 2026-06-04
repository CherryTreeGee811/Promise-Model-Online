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

            if (isLoggedIn()) {
                startNotificationPolling();
            }

            return Promise.resolve();
        })
        .catch(error => {
            navContentDiv.innerHTML = `<h1>Error loading template</h1><p>${error.message}</p>`;
            return Promise.reject(error);
        });
}

export function initNavEventDelegation(navContentDiv, contentDiv) {
    const menu = document.getElementById('main-menu');
    if (!menu || menu.dataset.navBound) return;
    menu.dataset.navBound = '1';

    menu.addEventListener('click', (e) => handleNavClick(e, navContentDiv, contentDiv));
}

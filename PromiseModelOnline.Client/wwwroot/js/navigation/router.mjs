import { navigate } from '../router.mjs';
import { isLoggedIn } from '../auth-state.mjs';
import { startNotificationPolling } from '../notifications/badge.mjs';

/**
 * Set the aria-current attribute on the navigation link matching the current URL path.
 * Removes the attribute from all links before applying it to the active match.
 */
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

/**
 * Handle a click event on a navigation link by calling navigate().
 * Prevents default anchor behaviour and delegates to the SPA router.
 * @param {Event} e - The click event.
 * @param {HTMLElement} navContentDiv - The navigation container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
function handleNavClick(e, navContentDiv, contentDiv) {
    const link = e.target.closest('a[data-nav]');
    if (!link) return;

    const path = link.getAttribute('href');
    if (!path || path === '#') return;

    e.preventDefault();
    navigate(path, navContentDiv, contentDiv);
}

/**
 * Load the navigation template into the nav container.
 * Selects the template (authenticated vs anonymous) based on login state,
 * fetches it, and injects it into the nav element. Also activates the
 * current nav link and starts notification polling for authenticated users.
 * @param {HTMLElement} navContentDiv - The container element for the navigation bar.
 * @param {HTMLElement} contentDiv - The main content container element.
 * @returns {Promise<void>} Resolves when the template has been loaded and rendered.
 * @throws {Error} If the fetch request fails.
 */
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

/**
 * Initialize navigation event delegation for menu links.
 * Binds a single click listener on the main-menu element that delegates
 * to handleNavClick. Idempotent — uses a data attribute guard to prevent
 * duplicate listeners.
 * @param {HTMLElement} navContentDiv - The navigation container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export function initNavEventDelegation(navContentDiv, contentDiv) {
    const menu = document.getElementById('main-menu');
    if (!menu || menu.dataset.navBound) return;
    menu.dataset.navBound = '1';

    menu.addEventListener('click', (e) => handleNavClick(e, navContentDiv, contentDiv));
}

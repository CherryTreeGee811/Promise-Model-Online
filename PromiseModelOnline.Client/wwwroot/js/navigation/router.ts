import { isLoggedIn } from '../auth-state.ts';
import { startNotificationPolling } from '../notifications/badge.ts';
import { navigate } from '../router.ts';

/**
 * Set the aria-current attribute on the navigation link matching the current URL path.
 * Removes the attribute from all links before applying it to the active match.
 */
function setActiveNavLink(): void {
    const currentPath = location.pathname;
    for (const link of document.querySelectorAll('#main-menu a[data-nav]')) {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const isActive = href === currentPath ||
            (href !== '/' && currentPath.startsWith(href));
        link.removeAttribute('aria-current');
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        }
    }
}

/**
 * Handle a click event on a navigation link by calling navigate().
 * Prevents default anchor behaviour and delegates to the SPA router.
 * @param {Event} event - The click event.
 * @param {HTMLElement} navContentDiv - The navigation container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
function handleNavClick(event: Event, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const link = (event.target as Element).closest('a[data-nav]');
    if (!link) return;

    const path = link.getAttribute('href');
    if (!path || path === '#') return;

    event.preventDefault();
    void navigate(path, navContentDiv, contentDiv);
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
export async function loadNavTemplate(navContentDiv: HTMLElement, _contentDiv: HTMLElement): Promise<void> {
    const templateName = isLoggedIn() ? 'authenticated.html' : 'anonymous.html';

    try {
        const response = await fetch(`/templates/navigation/${templateName}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const html = await response.text();
        const parser = new DOMParser();
        const document_ = parser.parseFromString(html, 'text/html');
        navContentDiv.replaceChildren(...document_.body.childNodes);
        setActiveNavLink();
        if (isLoggedIn()) void startNotificationPolling();
    } catch (error: unknown) {
        navContentDiv.replaceChildren();
        const errorH1 = document.createElement('h1');
        errorH1.textContent = 'Error loading template';
        const errorP = document.createElement('p');
        errorP.textContent = (error as Error).message;
        navContentDiv.append(errorH1, errorP);
        throw error;
    }
}

/**
 * Initialize navigation event delegation for menu links.
 * Binds a single click listener on the main-menu element that delegates
 * to handleNavClick. Idempotent — uses a data attribute guard to prevent
 * duplicate listeners.
 * @param {HTMLElement} navContentDiv - The navigation container element.
 * @param {HTMLElement} contentDiv - The main content container element.
 */
export function initNavEventDelegation(navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const menu = document.querySelector<HTMLElement>('#main-menu');
    if (!menu || menu.dataset.navBound) return;
    menu.dataset.navBound = '1';

    menu.addEventListener('click', (event) => handleNavClick(event, navContentDiv, contentDiv));
}

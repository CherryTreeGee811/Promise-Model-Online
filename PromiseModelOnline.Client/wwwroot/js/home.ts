import { isLoggedIn } from './auth-state.ts';

/**
 *
 */
export function loadHomePage(): void {
  const isLogged = isLoggedIn();

  const ctaTop = document.querySelector('#home-cta-area');
  const ctaBottom = document.querySelector('#home-cta-area-bottom');

  const buttons = buildCtaButtons(isLogged);
  if (ctaTop) ctaTop.replaceChildren(...buttons);
  if (ctaBottom) ctaBottom.replaceChildren(...buttons);
}

/**
 * @param {boolean} isLogged - Whether user is logged in
 * @returns {HTMLAnchorElement[]} Array of CTA link elements
 */
function buildCtaButtons(isLogged: boolean): HTMLAnchorElement[] {
  if (isLogged) {
    return [
      createLink('/projects', 'btn-light', 'bi-folder', 'Go to Projects', true),
      createLink('/moments/my-tasks', 'btn-outline-light', 'bi-check2-square', 'My Tasks', true),
      createLink('/knowledge-base', 'btn-outline-light', 'bi-book', 'Knowledge Base', true),
    ];
  }
  return [
    createLink('/login', 'btn-light', 'bi-box-arrow-in-right', 'Login'),
    createLink('/account/register', 'btn-outline-light', 'bi-person-plus', 'Register'),
  ];
}

/**
 * @param {string} href - The link URL
 * @param {string} buttonClass - CSS class for the button
 * @param {string} icon - Bootstrap icon class
 * @param {string} text - Button text
 * @param {boolean} hasNav - Whether to add data-nav attribute
 * @returns {HTMLAnchorElement} The created link element
 */
function createLink(href: string, buttonClass: string, icon: string, text: string, hasNav = false): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.className = `btn ${buttonClass} btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2`;
  if (hasNav) a.dataset.nav = '';
  const index = document.createElement('i');
  index.className = `bi ${icon}`;
  index.setAttribute('aria-hidden', 'true');
  a.append(index, ` ${text}`);
  return a;
}

import { isLoggedIn } from './auth-state.mjs';
import { navigate } from './router.mjs';

export function loadHomePage() {
  const loggedIn = isLoggedIn();

  const ctaHtml = loggedIn
    ? `
      <a href="/projects" class="btn btn-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
        <i class="bi bi-folder" aria-hidden="true"></i> Go to Projects
      </a>
      <a href="/moments/my-tasks" class="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
        <i class="bi bi-check2-square" aria-hidden="true"></i> My Tasks
      </a>
      <a href="/knowledge-base" class="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
        <i class="bi bi-book" aria-hidden="true"></i> Knowledge Base
      </a>`
    : `
      <a href="/login" class="btn btn-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
        <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i> Login
      </a>
      <a href="/account/register" class="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
        <i class="bi bi-person-plus" aria-hidden="true"></i> Register
      </a>`;

  const ctaTop = document.getElementById('home-cta-area');
  const ctaBottom = document.getElementById('home-cta-area-bottom');

  if (ctaTop) ctaTop.innerHTML = ctaHtml;
  if (ctaBottom) ctaBottom.innerHTML = ctaHtml;

  bindCtaLinks();
}

function bindCtaLinks() {
  const navContentDiv = document.getElementById('main-menu');
  const contentDiv = document.getElementById('content');

  document.querySelectorAll('#home-cta-area a[href], #home-cta-area-bottom a[href]').forEach(link => {
    if (link.dataset.homeBound) return;
    link.dataset.homeBound = '1';

    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href === '/login' || href === '/logout' || href === '/account/register') {
        return; // Normal full-page navigation
      }
      e.preventDefault();
      navigate(href, navContentDiv, contentDiv);
    });
  });
}

'use strict';

// ---------- Theme ----------
const THEME_STORAGE_KEY = 'pmo.theme';

function getPreferredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.dataset.bsTheme = theme;
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.className = theme === 'dark'
      ? 'bi bi-brightness-high-fill'
      : 'bi bi-brightness-high';
  }
}

function saveTheme(theme) {
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}
}

function setTheme(theme) {
  applyTheme(theme);
  saveTheme(theme);
  document.getElementById('theme-toggle')?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function toggleTheme() {
  const current = document.documentElement.dataset.bsTheme || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  const theme = getPreferredTheme();
  setTheme(theme);

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  try {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        setTheme(e.matches ? 'dark' : 'light');
      });
    }
  } catch {}
}

// ---------- Mobile Menu ----------
let menuOpen = false;

function toggleMenu(open) {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('main-nav');
  if (!btn || !nav) return;
  menuOpen = open !== undefined ? open : !menuOpen;
  btn.setAttribute('aria-expanded', String(menuOpen));
  nav.classList.toggle('is-open', menuOpen);
  document.body.classList.toggle('mobile-menu-open', menuOpen);
}

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('main-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', function () {
    toggleMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) {
      toggleMenu(false);
      btn.focus();
    }
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      toggleMenu(false);
    });
  });

  document.addEventListener('click', function (e) {
    if (menuOpen && !btn.contains(e.target) && !nav.contains(e.target)) {
      toggleMenu(false);
    }
  });
}

// ---------- Password Visibility Toggle ----------
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(function (btn) {
    if (btn.dataset.pwBound) return;
    btn.dataset.pwBound = '1';

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var wrapper = btn.closest('.password-wrapper');
      if (!wrapper) return;

      var input = wrapper.querySelector('.password-input');
      if (!input) return;

      var isPassword = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPassword ? 'text' : 'password');
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      btn.querySelector('.eye-icon')?.classList.toggle('eye-off', isPassword);
    });
  });
}

// ---------- Form Loading State ----------
function initFormLoading() {
  document.querySelectorAll('.auth-form').forEach(function (form) {
    if (form.dataset.loadBound) return;
    form.dataset.loadBound = '1';

    form.addEventListener('submit', function () {
      var btn = form.querySelector('.submit-btn');
      if (btn) {
        btn.disabled = true;
        btn.classList.add('loading');
      }
    });
  });
}

// ---------- Auto-dismiss Success/Error Messages ----------
function initMessageDismiss() {
  document.querySelectorAll('.auth-message').forEach(function (msg) {
    if (msg.dataset.dismissBound) return;
    msg.dataset.dismissBound = '1';

    setTimeout(function () {
      msg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-8px)';
      setTimeout(function () { msg.remove(); }, 300);
    }, 5000);
  });
}

// ---------- Initialize ----------
initTheme();
initMobileMenu();
initPasswordToggles();
initFormLoading();
initMessageDismiss();

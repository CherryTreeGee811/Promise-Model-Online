import { createStore } from './store.ts';

const THEME_STORAGE_KEY = 'pmo.theme';

export type Theme = 'light' | 'dark';
type ThemeState = { theme: Theme };

function loadFromStorage(): ThemeState {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return { theme: stored };
    }
  } catch {
    // Ignore storage errors
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { theme: prefersDark ? 'dark' : 'light' };
}

function saveToStorage(state: ThemeState) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, state.theme);
  } catch {
    // Ignore storage failures
  }
}

export const themeStore = createStore(loadFromStorage());

const originalSet = themeStore.set.bind(themeStore);
themeStore.set = (partial) => {
  originalSet(partial);
  saveToStorage(themeStore.get());
};

function applyTheme(theme: Theme) {
  document.documentElement.dataset.bsTheme = theme;

  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.className = theme === 'dark'
      ? 'bi bi-brightness-high-fill'
      : 'bi bi-brightness-high';
  }
}

export function setTheme(theme: Theme) {
  themeStore.set({ theme });
  applyTheme(theme);
}

export function toggleTheme() {
  const current = themeStore.get().theme;
  setTheme(current === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  applyTheme(themeStore.get().theme);

  try {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      });
    }
  } catch {
    // Ignore
  }
}

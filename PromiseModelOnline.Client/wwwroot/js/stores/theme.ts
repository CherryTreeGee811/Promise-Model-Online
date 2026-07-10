import { createStore } from './store.ts';

const THEME_STORAGE_KEY = 'pmo.theme';

export type Theme = 'light' | 'dark';
type ThemeState = { theme: Theme };

/** @returns {ThemeState} The stored or system-preferred theme. */
function loadFromStorage(): ThemeState {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return { theme: stored };
    }
  } catch {
    // Ignore storage errors
  }
  const isPrefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  return { theme: isPrefersDark ? 'dark' : 'light' };
}

/** @param {ThemeState} state - The theme state */
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

/** @param {Theme} theme - The theme to apply */
function applyTheme(theme: Theme) {
  document.documentElement.dataset.bsTheme = theme;

  const icon = document.querySelector('#theme-toggle-icon');
  if (icon) {
    icon.className = theme === 'dark'
      ? 'bi bi-brightness-high-fill'
      : 'bi bi-brightness-high';
  }
}

/** @param {Theme} theme - The theme to set */
export function setTheme(theme: Theme) {
  themeStore.set({ theme });
  applyTheme(theme);
}

/** Toggle between light and dark themes. */
export function toggleTheme() {
  const current = themeStore.get().theme;
  setTheme(current === 'dark' ? 'light' : 'dark');
}

/** Initialize the theme and listen for system preference changes. */
export function initTheme() {
  applyTheme(themeStore.get().theme);

  try {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        setTheme(event.matches ? 'dark' : 'light');
      });
    }
  } catch {
    // Ignore
  }
}

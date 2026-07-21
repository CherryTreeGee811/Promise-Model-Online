import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { themeStore, setTheme, toggleTheme, initTheme } from '../../PromiseModelOnline.Client/wwwroot/js/stores/theme.ts';

beforeEach(() => {
  localStorage.clear();
  themeStore.set({ theme: 'light' });

  document.documentElement.dataset.bsTheme = '';

  const existingBtn = document.getElementById('theme-toggle');
  if (!existingBtn) {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    const icon = document.createElement('i');
    icon.id = 'theme-toggle-icon';
    btn.append(icon);
    document.body.append(btn);
  }
  const existingIcon = document.getElementById('theme-toggle-icon');
  if (existingIcon) existingIcon.className = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('themeStore', () => {
  it('starts with light theme after reset', () => {
    // Assert
    expect(themeStore.get().theme).toBe('light');
  });

  it('persists theme to localStorage on setTheme', () => {
    // Act
    setTheme('dark');
    // Assert
    expect(themeStore.get().theme).toBe('dark');
    expect(localStorage.getItem('pmo.theme')).toBe('dark');
  });

  it('transitions from light to dark to light', () => {
    // Act
    setTheme('dark');
    // Assert
    expect(themeStore.get().theme).toBe('dark');
    setTheme('light');
    expect(themeStore.get().theme).toBe('light');
  });

  it('sets data-bs-theme attribute on html element', () => {
    // Act
    setTheme('dark');
    // Assert
    expect(document.documentElement.dataset.bsTheme).toBe('dark');
    setTheme('light');
    expect(document.documentElement.dataset.bsTheme).toBe('light');
  });

  it('updates toggle icon class for dark theme', () => {
    // Arrange
    setTheme('dark');
    // Act
    const icon = document.getElementById('theme-toggle-icon');
    // Assert
    expect(icon?.className).toBe('bi bi-brightness-high-fill');
  });

  it('updates toggle icon class for light theme', () => {
    // Arrange
    setTheme('light');
    // Act
    const icon = document.getElementById('theme-toggle-icon');
    // Assert
    expect(icon?.className).toBe('bi bi-brightness-high');
  });
});

describe('toggleTheme', () => {
  it('switches from light to dark', () => {
    // Act
    toggleTheme();
    // Assert
    expect(themeStore.get().theme).toBe('dark');
    expect(document.documentElement.dataset.bsTheme).toBe('dark');
  });

  it('switches from dark to light', () => {
    // Arrange
    setTheme('dark');
    // Act
    toggleTheme();
    // Assert
    expect(themeStore.get().theme).toBe('light');
    expect(document.documentElement.dataset.bsTheme).toBe('light');
  });

  it('round-trips correctly', () => {
    // Act
    toggleTheme();
    // Assert
    expect(themeStore.get().theme).toBe('dark');
    toggleTheme();
    expect(themeStore.get().theme).toBe('light');
  });
});

describe('initTheme', () => {
  it('applies current store theme to html element', () => {
    // Arrange
    setTheme('dark');
    document.documentElement.dataset.bsTheme = '';
    // Act
    initTheme();
    // Assert
    expect(document.documentElement.dataset.bsTheme).toBe('dark');
  });

  it('adds matchMedia listener when no stored preference exists', () => {
    // Arrange
    localStorage.removeItem('pmo.theme');
    const addEventListener = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener,
    })));

    // Act
    initTheme();
    // Assert
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('skips matchMedia listener when stored preference exists', () => {
    // Arrange
    localStorage.setItem('pmo.theme', 'dark');
    const addEventListener = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener,
    })));

    // Act
    initTheme();
    // Assert
    expect(addEventListener).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStore, isLoggedIn, getUsername, getUserId } from '../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts';

beforeEach(() => {
    sessionStorage.clear();
    authStore.set({ isAuthenticated: false, username: undefined, userId: undefined });
});

describe('auth module', () => {
    it('starts unauthenticated after reset', () => {
        // Arrange
        // Assert
        expect(isLoggedIn()).toBe(false);
        expect(getUsername()).toBeUndefined();
        expect(getUserId()).toBeUndefined();
    });

    it('persists auth state to sessionStorage on set', () => {
        // Arrange
        authStore.set({ isAuthenticated: true, username: 'jdoe', userId: 42 });
        // Assert
        expect(isLoggedIn()).toBe(true);
        expect(getUsername()).toBe('jdoe');
        expect(getUserId()).toBe(42);

        const stored = JSON.parse(sessionStorage.getItem('pmo.auth')!);
        expect(stored.isAuthenticated).toBe(true);
        expect(stored.username).toBe('jdoe');
        expect(stored.userId).toBe(42);
    });

    it('transitions from authenticated to unauthenticated', () => {
        // Arrange
        authStore.set({ isAuthenticated: true, username: 'bob', userId: 99 });
        // Assert
        expect(isLoggedIn()).toBe(true);

        authStore.set({ isAuthenticated: false });
        expect(isLoggedIn()).toBe(false);

        const stored = JSON.parse(sessionStorage.getItem('pmo.auth')!);
        expect(stored.isAuthenticated).toBe(false);
    });

    it('reads user name and id from store', () => {
        // Arrange
        authStore.set({ isAuthenticated: true, username: 'charlie', userId: 12 });
        // Assert
        expect(getUsername()).toBe('charlie');
        expect(getUserId()).toBe(12);
    });

    it('handles multiple state updates', () => {
        // Arrange
        authStore.set({ isAuthenticated: true, username: 'alice', userId: 1 });
        // Act
        authStore.set({ username: 'alice-updated' });
        // Assert
        expect(getUsername()).toBe('alice-updated');
        expect(getUserId()).toBe(1);
    });
});

describe('auth module loadFromStorage', () => {
    it('restores authenticated state from sessionStorage', async () => {
        // Arrange
        sessionStorage.setItem('pmo.auth', JSON.stringify({ isAuthenticated: true, username: 'storedUser', userId: 55 }));
        vi.resetModules();
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts');
        // Assert
        expect(mod.isLoggedIn()).toBe(true);
        expect(mod.getUsername()).toBe('storedUser');
        expect(mod.getUserId()).toBe(55);
    });

    it('handles corrupt sessionStorage data', async () => {
        // Arrange
        sessionStorage.setItem('pmo.auth', 'not-json');
        vi.resetModules();
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts');
        // Assert
        expect(mod.isLoggedIn()).toBe(false);
    });

    it('handles missing sessionStorage key', async () => {
        // Arrange
        sessionStorage.clear();
        vi.resetModules();
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts');
        // Assert
        expect(mod.isLoggedIn()).toBe(false);
    });

    it('coerces isAuthenticated to boolean (falsy values)', async () => {
        // Arrange
        sessionStorage.setItem('pmo.auth', JSON.stringify({ isAuthenticated: 0, username: 'u', userId: 1 }));
        vi.resetModules();
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts');
        // Assert
        expect(mod.isLoggedIn()).toBe(false);
    });

    it('coerces isAuthenticated to boolean (truthy values)', async () => {
        // Arrange
        sessionStorage.setItem('pmo.auth', JSON.stringify({ isAuthenticated: 1, username: 'u', userId: 1 }));
        vi.resetModules();
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts');
        // Assert
        expect(mod.isLoggedIn()).toBe(true);
    });

    it('returns userId undefined when stored userId is null', async () => {
        // Arrange
        sessionStorage.setItem('pmo.auth', JSON.stringify({ isAuthenticated: true, username: 'u', userId: null }));
        vi.resetModules();
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts');
        // Assert
        expect(mod.getUserId()).toBeUndefined();
    });

    it('returns userId undefined when stored userId is undefined', async () => {
        // Arrange
        sessionStorage.setItem('pmo.auth', JSON.stringify({ isAuthenticated: true, username: 'u' }));
        vi.resetModules();
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts');
        // Assert
        expect(mod.getUserId()).toBeUndefined();
    });

    it('returns undefined username when stored username is empty string', async () => {
        // Arrange
        sessionStorage.setItem('pmo.auth', JSON.stringify({ isAuthenticated: true, username: '', userId: 5 }));
        vi.resetModules();
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts');
        // Assert
        expect(mod.getUsername()).toBeUndefined();
    });
});

describe('auth module saveToStorage', () => {
    it('silently handles sessionStorage write failure', () => {
        // Arrange
        const setItemSpy = vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => { throw new Error('quota exceeded'); });
        // Assert
        expect(() => authStore.set({ isAuthenticated: true })).not.toThrow();
        setItemSpy.mockRestore();
    });
});

describe('auth-state.ts legacy shim', () => {
    it('re-exports isLoggedIn from stores/auth', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/auth-state.ts');
        // Assert
        expect(typeof mod.isLoggedIn).toBe('function');
        expect(typeof mod.getUsername).toBe('function');
        expect(typeof mod.getUserId).toBe('function');
    });
});

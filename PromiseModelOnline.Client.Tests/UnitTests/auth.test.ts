import { describe, it, expect, beforeEach } from 'vitest';
import { authStore, isLoggedIn, getUsername, getUserId } from '../../PromiseModelOnline.Client/wwwroot/js/stores/auth.ts';

beforeEach(() => {
    sessionStorage.clear();
    authStore.set({ isAuthenticated: false, username: undefined, userId: undefined });
});

describe('auth module', () => {
    it('starts unauthenticated after reset', () => {
        expect(isLoggedIn()).toBe(false);
        expect(getUsername()).toBeUndefined();
        expect(getUserId()).toBeUndefined();
    });

    it('persists auth state to sessionStorage on set', () => {
        authStore.set({ isAuthenticated: true, username: 'jdoe', userId: 42 });
        expect(isLoggedIn()).toBe(true);
        expect(getUsername()).toBe('jdoe');
        expect(getUserId()).toBe(42);

        const stored = JSON.parse(sessionStorage.getItem('pmo.auth')!);
        expect(stored.isAuthenticated).toBe(true);
        expect(stored.username).toBe('jdoe');
        expect(stored.userId).toBe(42);
    });

    it('transitions from authenticated to unauthenticated', () => {
        authStore.set({ isAuthenticated: true, username: 'bob', userId: 99 });
        expect(isLoggedIn()).toBe(true);

        authStore.set({ isAuthenticated: false });
        expect(isLoggedIn()).toBe(false);

        const stored = JSON.parse(sessionStorage.getItem('pmo.auth')!);
        expect(stored.isAuthenticated).toBe(false);
    });

    it('reads user name and id from store', () => {
        authStore.set({ isAuthenticated: true, username: 'charlie', userId: 12 });
        expect(getUsername()).toBe('charlie');
        expect(getUserId()).toBe(12);
    });

    it('handles multiple state updates', () => {
        authStore.set({ isAuthenticated: true, username: 'alice', userId: 1 });
        authStore.set({ username: 'alice-updated' });
        expect(getUsername()).toBe('alice-updated');
        expect(getUserId()).toBe(1);
    });
});

import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../../PromiseModelOnline.Client/wwwroot/js/stores/store.ts';

describe('createStore', () => {
    it('returns initial state via get()', () => {
        // Act
        const store = createStore({ count: 0, name: 'test' });
        // Assert
        expect(store.get()).toEqual({ count: 0, name: 'test' });
    });

    it('returns a copy of the initial state (not the original)', () => {
        // Arrange
        const initial = { items: [1, 2] };
        // Act
        const store = createStore(initial);
        // Assert
        expect(store.get()).toEqual({ items: [1, 2] });
        expect(store.get()).not.toBe(initial);
    });

    it('updates state via set() and reflects in get()', () => {
        // Arrange
        const store = createStore({ count: 0 });
        // Act
        store.set({ count: 5 });
        // Assert
        expect(store.get()).toEqual({ count: 5 });
    });

    it('merges partial updates without removing existing fields', () => {
        // Arrange
        const store = createStore({ a: 1, b: 2 });
        // Act
        store.set({ b: 3 });
        // Assert
        expect(store.get()).toEqual({ a: 1, b: 3 });
    });

    it('notifies subscribers on set()', () => {
        // Arrange
        const store = createStore({ value: 0 });
        const listener = vi.fn();
        store.subscribe(listener);
        // Act
        store.set({ value: 1 });
        // Assert
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not notify after unsubscribe', () => {
        // Arrange
        const store = createStore({ value: 0 });
        const listener = vi.fn();
        const unsubscribe = store.subscribe(listener);
        unsubscribe();
        // Act
        store.set({ value: 1 });
        // Assert
        expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
        // Arrange
        const store = createStore({ value: 0 });
        const a = vi.fn();
        const b = vi.fn();
        store.subscribe(a);
        store.subscribe(b);
        // Act
        store.set({ value: 1 });
        // Assert
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
    });

    it('handles unsubscribe during notification gracefully', () => {
        // Arrange
        const store = createStore({ value: 0 });
        const unsubA = vi.fn(() => unsubB());
        const unsubB = vi.fn();
        store.subscribe(unsubA);
        store.subscribe(unsubB);
        // Act
        store.set({ value: 1 });
        // Assert
        expect(unsubA).toHaveBeenCalledTimes(1);
    });

    it('returns the same object reference on repeated get()', () => {
        // Arrange
        const store = createStore({ count: 0 });
        const first = store.get();
        // Act
        const second = store.get();
        // Assert
        expect(first).toBe(second);
    });

    it('creates a new object after set()', () => {
        // Arrange
        const store = createStore({ count: 0 });
        const before = store.get();
        store.set({ count: 1 });
        // Act
        const after = store.get();
        // Assert
        expect(before).not.toBe(after);
        expect(before.count).toBe(0);
        expect(after.count).toBe(1);
    });

    it('skips non-function listeners to cover typeof branch', () => {
        // Arrange
        const store = createStore({ x: 1 });
        store.subscribe(null as unknown as () => void);
        const listener = vi.fn();
        store.subscribe(listener);
        // Act
        store.set({ x: 2 });
        // Assert
        expect(listener).toHaveBeenCalledTimes(1);
    });
});

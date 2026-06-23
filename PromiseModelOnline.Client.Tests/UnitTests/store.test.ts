import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../../PromiseModelOnline.Client/wwwroot/js/stores/store.ts';

describe('createStore', () => {
    it('returns initial state via get()', () => {
        const store = createStore({ count: 0, name: 'test' });
        expect(store.get()).toEqual({ count: 0, name: 'test' });
    });

    it('returns a copy of the initial state (not the original)', () => {
        const initial = { items: [1, 2] };
        const store = createStore(initial);
        expect(store.get()).toEqual({ items: [1, 2] });
        expect(store.get()).not.toBe(initial);
    });

    it('updates state via set() and reflects in get()', () => {
        const store = createStore({ count: 0 });
        store.set({ count: 5 });
        expect(store.get()).toEqual({ count: 5 });
    });

    it('merges partial updates without removing existing fields', () => {
        const store = createStore({ a: 1, b: 2 });
        store.set({ b: 3 });
        expect(store.get()).toEqual({ a: 1, b: 3 });
    });

    it('notifies subscribers on set()', () => {
        const store = createStore({ value: 0 });
        const listener = vi.fn();
        store.subscribe(listener);
        store.set({ value: 1 });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not notify after unsubscribe', () => {
        const store = createStore({ value: 0 });
        const listener = vi.fn();
        const unsubscribe = store.subscribe(listener);
        unsubscribe();
        store.set({ value: 1 });
        expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
        const store = createStore({ value: 0 });
        const a = vi.fn();
        const b = vi.fn();
        store.subscribe(a);
        store.subscribe(b);
        store.set({ value: 1 });
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
    });

    it('handles unsubscribe during notification gracefully', () => {
        const store = createStore({ value: 0 });
        const unsubA = vi.fn(() => unsubB());
        const unsubB = vi.fn();
        store.subscribe(unsubA);
        store.subscribe(unsubB);
        store.set({ value: 1 });
        expect(unsubA).toHaveBeenCalledTimes(1);
    });

    it('returns the same object reference on repeated get()', () => {
        const store = createStore({ count: 0 });
        const first = store.get();
        const second = store.get();
        expect(first).toBe(second);
    });

    it('creates a new object after set()', () => {
        const store = createStore({ count: 0 });
        const before = store.get();
        store.set({ count: 1 });
        const after = store.get();
        expect(before).not.toBe(after);
        expect(before.count).toBe(0);
        expect(after.count).toBe(1);
    });
});

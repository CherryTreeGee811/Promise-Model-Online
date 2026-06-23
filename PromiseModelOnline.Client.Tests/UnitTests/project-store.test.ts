import { describe, it, expect } from 'vitest';
import { projectStore } from '../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts';

describe('projectStore', () => {
    it('starts with empty default state', () => {
        const state = projectStore.get();
        expect(state).toHaveProperty('owner');
        expect(state).toHaveProperty('project');
        expect(state).toHaveProperty('permission');
        expect(state).toHaveProperty('isOwner');
    });

    it('updates state via set()', () => {
        projectStore.set({ owner: 'alice', project: 'my-proj', permission: 'Edit', isOwner: false });
        const state = projectStore.get();
        expect(state.owner).toBe('alice');
        expect(state.project).toBe('my-proj');
        expect(state.permission).toBe('Edit');
        expect(state.isOwner).toBe(false);
    });

    it('notifies subscribers', () => {
        let notified = false;
        projectStore.subscribe(() => { notified = true; });
        projectStore.set({ owner: 'bob' });
        expect(notified).toBe(true);
    });

    it('merges partial updates', () => {
        projectStore.set({ owner: 'x', project: 'y', permission: 'View', isOwner: false });
        projectStore.set({ permission: 'Owner' });
        expect(projectStore.get().permission).toBe('Owner');
        expect(projectStore.get().owner).toBe('x');
    });
});

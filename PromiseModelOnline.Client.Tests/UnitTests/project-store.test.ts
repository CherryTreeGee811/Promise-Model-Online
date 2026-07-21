import { describe, it, expect } from 'vitest';
import { projectStore } from '../../PromiseModelOnline.Client/wwwroot/js/stores/project.ts';

describe('projectStore', () => {
    it('starts with empty default state', () => {
        // Arrange
        const state = projectStore.get();
        // Assert
        expect(state).toHaveProperty('owner');
        expect(state).toHaveProperty('project');
        expect(state).toHaveProperty('permission');
        expect(state).toHaveProperty('isOwner');
    });

    it('updates state via set()', () => {
        // Arrange
        projectStore.set({ owner: 'alice', project: 'my-proj', permission: 'Edit', isOwner: false });
        // Act
        const state = projectStore.get();
        // Assert
        expect(state.owner).toBe('alice');
        expect(state.project).toBe('my-proj');
        expect(state.permission).toBe('Edit');
        expect(state.isOwner).toBe(false);
    });

    it('notifies subscribers', () => {
        // Arrange
        let notified = false;
        projectStore.subscribe(() => { notified = true; });
        // Act
        projectStore.set({ owner: 'bob' });
        // Assert
        expect(notified).toBe(true);
    });

    it('merges partial updates', () => {
        // Arrange
        projectStore.set({ owner: 'x', project: 'y', permission: 'View', isOwner: false });
        // Act
        projectStore.set({ permission: 'Owner' });
        // Assert
        expect(projectStore.get().permission).toBe('Owner');
        expect(projectStore.get().owner).toBe('x');
    });
});

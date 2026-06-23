import { createStore } from './store.ts';

interface ProjectContext {
    owner: string;
    project: string;
    permission: string | undefined;
    isOwner: boolean;
}

const initial: ProjectContext = { owner: '', project: '', permission: undefined, isOwner: false };

/**
 * Reactive store for the current project context (owner, project slug, permission).
 * Updated automatically during project-scoped route navigation.
 * @type {import('./store.ts').Store<ProjectContext>}
 */
export const projectStore = createStore(initial);

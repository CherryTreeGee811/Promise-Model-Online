import { loadEpicDetail } from '../epics/detail.ts';
import { loadFlowDetail } from '../flows/detail.ts';
import { loadJourneyDetail } from '../journeys/detail.ts';
import { loadMomentDetail } from '../moments/detail.ts';
import { loadPromiseDetail } from '../promises/detail.ts';
import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.ts';
import { projectStore } from '../stores/project.ts';
import { loadStridesPage } from '../strides/router.ts';
import { fetchMyPermission } from '../utils/permissions.ts';

import { loadAddProjectForm } from './add.ts';
import { loadGraphPage } from './graph.ts';
import { loadProjectAuditHistoryPage } from './history.ts';
import { loadProjectList } from './list.ts';
import { loadProjectSettingsPage } from './settings.ts';
import { loadSharePage } from './share.ts';

/**
 * Handle the strides (backlog) route for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleStridesRoute(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const perm = await fetchMyPermission(owner, project);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        void loadStridesPage(owner, project, navContentDiv, contentDiv, perm);
    } catch {
        // fetchMyPermission failure falls through
    }
}

/**
 * Handle the graph view route for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} _navContentDiv - The navigation content container (unused).
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleGraphRoute(owner: string, project: string, _navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('projects/graph.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        void loadGraphPage(owner, project, contentDiv, perm);
    } catch {
        void loadTemplateWithError(contentDiv, 'graph page')();
    }
}

/**
 * Handle the settings route for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleSettingsRoute(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('projects/settings.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        loadProjectSettingsPage(navContentDiv, contentDiv, owner, project, perm);
    } catch {
        void loadTemplateWithError(contentDiv, 'project settings')();
    }
}

/**
 * Handle the share/permissions route for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} _navContentDiv - The navigation content container (unused).
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleShareRoute(owner: string, project: string, _navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('projects/share.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        loadSharePage(owner, project, contentDiv, perm);
    } catch {
        void loadTemplateWithError(contentDiv, 'share page')();
    }
}

/**
 * Handle the audit history route for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleHistoryRoute(owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        await loadTemplate('projects/history.html', contentDiv);
        loadProjectAuditHistoryPage(navContentDiv, contentDiv, owner, project);
    } catch {
        void loadTemplateWithError(contentDiv, 'project activity')();
    }
}

/**
 * Handle the iterations list route for a project.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {HTMLElement} _navContentDiv - The navigation content container (unused).
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleIterationsRoute(owner: string, project: string, _navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('iterations/list.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        const module = await import('../iterations/list.ts');
        void module.loadIterationHistory(owner, project, { permission: perm.permission ?? '' });
    } catch {
        void loadTemplateWithError(contentDiv, 'iterations')();
    }
}

/**
 * Handle the promise detail route.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} seq - The promise sequence number.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handlePromiseDetailRoute(owner: string, project: string, seq: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('promises/detail.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        void loadPromiseDetail(owner, project, seq, navContentDiv, contentDiv, perm);
    } catch {
        void loadTemplateWithError(contentDiv, 'promise')();
    }
}

/**
 * Handle the epic detail route.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} seq - The epic sequence number.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleEpicDetailRoute(owner: string, project: string, seq: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('epics/detail.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        void loadEpicDetail(owner, project, seq, navContentDiv, contentDiv, { permission: perm.permission ?? '' });
    } catch {
        void loadTemplateWithError(contentDiv, 'epic')();
    }
}

/**
 * Handle the journey detail route.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} seq - The journey sequence number.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleJourneyDetailRoute(owner: string, project: string, seq: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('journeys/detail.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        void loadJourneyDetail(owner, project, seq, navContentDiv, contentDiv, { permission: perm.permission ?? '' });
    } catch {
        void loadTemplateWithError(contentDiv, 'journey')();
    }
}

/**
 * Handle the flow detail route.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} seq - The flow sequence number.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleFlowDetailRoute(owner: string, project: string, seq: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('flows/detail.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        void loadFlowDetail(owner, project, seq, navContentDiv, contentDiv, { permission: perm.permission ?? '' });
    } catch {
        void loadTemplateWithError(contentDiv, 'flow')();
    }
}

/**
 * Handle the moment detail route.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} seq - The moment sequence number.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {Promise<void>}
 */
async function handleMomentDetailRoute(owner: string, project: string, seq: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    try {
        const [, perm] = await Promise.all([
            loadTemplate('moments/detail.html', contentDiv),
            fetchMyPermission(owner, project),
        ]);
        projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
        void loadMomentDetail(owner, project, seq, navContentDiv, contentDiv, perm);
    } catch {
        void loadTemplateWithError(contentDiv, 'moment')();
    }
}

/**
 * Handle legacy project routes (non-slug-based) like /projects and /projects/add.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export async function handleLegacyProjectRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    switch (path) {
        case '/projects': {
            try {
                await loadTemplate("projects/list.html", contentDiv);
                void loadProjectList(navContentDiv, contentDiv);
            } catch {
                void loadTemplateWithError(contentDiv, 'project list')();
            }
            break;
        }
        case '/projects/add': {
            try {
                await loadTemplate("projects/add.html", contentDiv);
                loadAddProjectForm(navContentDiv, contentDiv);
            } catch {
                void loadTemplateWithError(contentDiv, 'add project form')();
            }
            break;
        }
        default: {
            showNotFound(contentDiv);
        }
    }
}

/**
 * Handle project-scoped routes with owner and project slugs (e.g. /{owner}/{project}/graph).
 * Dispatches to the appropriate page loader based on the sub-path segment.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} subPath - The sub-path after owner/project.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export async function handleProjectScopedRoutes(owner: string, project: string, subPath: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    projectStore.set({ owner, project, permission: undefined, isOwner: false });

    let normalizedSub = subPath.replace(/^\/+/, '');
    while (normalizedSub.endsWith('/')) normalizedSub = normalizedSub.slice(0, -1);
    const segments = normalizedSub ? normalizedSub.split('/') : [];

    if (segments.length === 0) {
        await handleStridesRoute(owner, project, navContentDiv, contentDiv);
        return;
    }

    const main = segments[0];
    const seq = segments[1];

    const directRoutes: Record<string, (owner: string, project: string, navContentDiv: HTMLElement, contentDiv: HTMLElement) => Promise<void>> = {
        strides: handleStridesRoute,
        graph: handleGraphRoute,
        settings: handleSettingsRoute,
        share: handleShareRoute,
        history: handleHistoryRoute,
        iterations: handleIterationsRoute,
    };

    const handler = directRoutes[main];
    if (handler) {
        await handler(owner, project, navContentDiv, contentDiv);
        return;
    }

    if (seq) {
        const detailRoutes: Record<string, (owner: string, project: string, seq: string, navContentDiv: HTMLElement, contentDiv: HTMLElement) => Promise<void>> = {
            promises: handlePromiseDetailRoute,
            epics: handleEpicDetailRoute,
            journeys: handleJourneyDetailRoute,
            flows: handleFlowDetailRoute,
            moments: handleMomentDetailRoute,
        };

        const detailHandler = detailRoutes[main];
        if (detailHandler) {
            await detailHandler(owner, project, seq, navContentDiv, contentDiv);
            return;
        }
    }

    showNotFound(contentDiv);
}

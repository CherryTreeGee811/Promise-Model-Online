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
 * Handle legacy project routes (non-slug-based) like /projects and /projects/add.
 * @param {string} path - The URL path to match.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export function handleLegacyProjectRoutes(path: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    switch (path) {
        case '/projects':
            loadTemplate("projects/list.html", contentDiv)
                .then(() => loadProjectList(navContentDiv, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'project list'));
            break;
        case '/projects/add':
            loadTemplate("projects/add.html", contentDiv)
                .then(() => loadAddProjectForm(navContentDiv, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'add project form'));
            break;
        default:
            showNotFound(contentDiv);
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
export function handleProjectScopedRoutes(owner: string, project: string, subPath: string, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    projectStore.set({ owner, project, permission: undefined, isOwner: false });

    const normalizedSub = subPath.replace(/^\/+/, '').replace(/\/+$/, '');
    const segments = normalizedSub ? normalizedSub.split('/') : [];

    if (segments.length === 0) {
        fetchMyPermission(owner, project).then(perm => {
            projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
            loadStridesPage(owner, project, navContentDiv, contentDiv, perm);
        });
        return;
    }

    const main = segments[0];
    const seq = segments[1];

    switch (true) {
        case main === 'strides':
            fetchMyPermission(owner, project).then(perm => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadStridesPage(owner, project, navContentDiv, contentDiv, perm);
            });
            break;
        case main === 'graph':
            Promise.all([
                loadTemplate('projects/graph.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadGraphPage(owner, project, contentDiv, perm);
            })
            .catch(loadTemplateWithError(contentDiv, 'graph page'));
            break;
        case main === 'settings':
            Promise.all([
                loadTemplate('projects/settings.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadProjectSettingsPage(navContentDiv, contentDiv, owner, project, perm);
            })
            .catch(loadTemplateWithError(contentDiv, 'project settings'));
            break;
        case main === 'share':
            Promise.all([
                loadTemplate('projects/share.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadSharePage(owner, project, contentDiv, perm);
            })
            .catch(loadTemplateWithError(contentDiv, 'share page'));
            break;
        case main === 'history':
            loadTemplate('projects/history.html', contentDiv)
                .then(() => loadProjectAuditHistoryPage(navContentDiv, contentDiv, owner, project))
                .catch(loadTemplateWithError(contentDiv, 'project activity'));
            break;
        case main === 'iterations':
            Promise.all([
                loadTemplate('iterations/list.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                import('../iterations/list.ts').then(module => {
                    module.loadIterationHistory(owner, project, perm);
                });
            })
            .catch(loadTemplateWithError(contentDiv, 'iterations'));
            break;
        case main === 'promises' && !!seq:
            Promise.all([
                loadTemplate('promises/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadPromiseDetail(owner, project, seq, navContentDiv, contentDiv, perm);
            })
            .catch(loadTemplateWithError(contentDiv, 'promise'));
            break;
        case main === 'epics' && !!seq:
            Promise.all([
                loadTemplate('epics/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadEpicDetail(owner, project, seq, navContentDiv, contentDiv, perm);
            })
            .catch(loadTemplateWithError(contentDiv, 'epic'));
            break;
        case main === 'journeys' && !!seq:
            Promise.all([
                loadTemplate('journeys/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadJourneyDetail(owner, project, seq, navContentDiv, contentDiv, perm);
            })
            .catch(loadTemplateWithError(contentDiv, 'journey'));
            break;
        case main === 'flows' && !!seq:
            Promise.all([
                loadTemplate('flows/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadFlowDetail(owner, project, seq, navContentDiv, contentDiv, perm);
            })
            .catch(loadTemplateWithError(contentDiv, 'flow'));
            break;
        case main === 'moments' && !!seq:
            Promise.all([
                loadTemplate('moments/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => {
                projectStore.set({ permission: perm.permission, isOwner: perm.isOwner });
                loadMomentDetail(owner, project, seq, navContentDiv, contentDiv, perm);
            })
            .catch(loadTemplateWithError(contentDiv, 'moment'));
            break;
        default:
            showNotFound(contentDiv);
    }
}

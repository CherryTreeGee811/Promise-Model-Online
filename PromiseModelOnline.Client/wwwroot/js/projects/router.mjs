<<<<<<< HEAD
import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
import { loadProjectList } from './list.mjs';
import { loadAddProjectForm } from './add.mjs';
import { loadStridesPage } from '../strides/router.mjs';
import { loadSharePage } from './share.mjs';
import { loadGraphPage } from './graph.mjs';
import { loadProjectSettingsPage } from './settings.mjs';
import { loadProjectAuditHistoryPage } from './history.mjs';
import { loadPromiseDetail } from '../promises/detail.mjs';
import { loadEpicDetail } from '../epics/detail.mjs';
import { loadJourneyDetail } from '../journeys/detail.mjs';
import { loadFlowDetail } from '../flows/detail.mjs';
import { loadMomentDetail } from '../moments/detail.mjs';
import { fetchMyPermission } from '../utils/permissions.mjs';

export function handleLegacyProjectRoutes(path, navContentDiv, contentDiv) {
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

export function handleProjectScopedRoutes(owner, project, subPath, navContentDiv, contentDiv) {
    const normalizedSub = subPath.replace(/^\/+/, '').replace(/\/+$/, '');
    const segments = normalizedSub ? normalizedSub.split('/') : [];

    if (segments.length === 0) {
        fetchMyPermission(owner, project).then(perm => {
            loadStridesPage(owner, project, navContentDiv, contentDiv, perm);
        });
        return;
    }

    const main = segments[0];
    const seq = segments[1];

    switch (true) {
        case main === 'strides':
            fetchMyPermission(owner, project).then(perm => {
                loadStridesPage(owner, project, navContentDiv, contentDiv, perm);
            });
            break;
        case main === 'graph':
            Promise.all([
                loadTemplate('projects/graph.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => loadGraphPage(owner, project, contentDiv, perm))
            .catch(loadTemplateWithError(contentDiv, 'graph page'));
            break;
        case main === 'settings':
            Promise.all([
                loadTemplate('projects/settings.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => loadProjectSettingsPage(navContentDiv, contentDiv, owner, project, perm))
            .catch(loadTemplateWithError(contentDiv, 'project settings'));
            break;
        case main === 'share':
            Promise.all([
                loadTemplate('projects/share.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => loadSharePage(owner, project, contentDiv, perm))
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
                import('../iterations/list.mjs').then(module => {
                    module.loadIterationHistory(owner, project, perm);
                });
            })
            .catch(loadTemplateWithError(contentDiv, 'iterations'));
            break;
        case main === 'promises' && !!seq:
            Promise.all([
                loadTemplate('promises/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => loadPromiseDetail(owner, project, seq, navContentDiv, contentDiv, perm))
            .catch(loadTemplateWithError(contentDiv, 'promise'));
            break;
        case main === 'epics' && !!seq:
            Promise.all([
                loadTemplate('epics/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => loadEpicDetail(owner, project, seq, navContentDiv, contentDiv, perm))
            .catch(loadTemplateWithError(contentDiv, 'epic'));
            break;
        case main === 'journeys' && !!seq:
            Promise.all([
                loadTemplate('journeys/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => loadJourneyDetail(owner, project, seq, navContentDiv, contentDiv, perm))
            .catch(loadTemplateWithError(contentDiv, 'journey'));
            break;
        case main === 'flows' && !!seq:
            Promise.all([
                loadTemplate('flows/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => loadFlowDetail(owner, project, seq, navContentDiv, contentDiv, perm))
            .catch(loadTemplateWithError(contentDiv, 'flow'));
            break;
        case main === 'moments' && !!seq:
            Promise.all([
                loadTemplate('moments/detail.html', contentDiv),
                fetchMyPermission(owner, project),
            ]).then(([, perm]) => loadMomentDetail(owner, project, seq, navContentDiv, contentDiv, perm))
            .catch(loadTemplateWithError(contentDiv, 'moment'));
            break;
        default:
            showNotFound(contentDiv);
||||||| 1bedf4f
=======
import { loadTemplate } from '../router.mjs';
import { loadProjectList } from './list.mjs';
import { loadAddProjectForm } from './add.mjs';
import { loadStridesPage } from '../strides/router.mjs';
import { loadSharePage } from './share.mjs';
import { loadGraphPage } from './graph.mjs';
import { loadProjectSettingsPage } from './settings.mjs';

export function handleProjectRoutes(path, navContentDiv, contentDiv) {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');

    if (path === '/projects/edit' && idParam) {
        window.history.replaceState({}, '', `/projects/${idParam}/settings`);
        loadTemplate('projects/settings.html', contentDiv)
            .then(() => loadProjectSettingsPage(navContentDiv, contentDiv, idParam))
            .catch(err => { contentDiv.innerHTML = '<h1>Error loading project settings</h1>'; });
        return;
    }
    
    // Match /projects/{id}/strides
    const stridesMatch = path.match(/^\/projects\/(\d+)\/strides$/);
    if (stridesMatch) {
        const projectId = stridesMatch[1];
        loadStridesPage(projectId, navContentDiv, contentDiv);
        return;
    }

    // Match /projects/{id}/share
    const shareMatch = path.match(/^\/projects\/(\d+)\/share$/);
    if (shareMatch) {
        loadTemplate('projects/share.html', contentDiv)
            .then(() => loadSharePage(shareMatch[1], contentDiv))
            .catch(err => { contentDiv.innerHTML = '<h1>Error loading share page</h1>'; });
        return;
    }

    // Match /projects/{id}/graph
    const graphMatch = path.match(/^\/projects\/(\d+)\/graph$/);
    if (graphMatch) {
        loadTemplate('projects/graph.html', contentDiv)
            .then(() => loadGraphPage(graphMatch[1], contentDiv))
            .catch(err => { contentDiv.innerHTML = '<h1>Error loading graph page</h1>'; });
        return;
    }

    // Match /projects/{id}/settings
    const settingsMatch = path.match(/^\/projects\/(\d+)\/settings$/);
    if (settingsMatch) {
        loadTemplate('projects/settings.html', contentDiv)
            .then(() => loadProjectSettingsPage(navContentDiv, contentDiv, settingsMatch[1]))
            .catch(err => { contentDiv.innerHTML = '<h1>Error loading project settings</h1>'; });
        return;
    }

    // Match /projects/{id}/iterations  <-- NEW
    const iterationsMatch = path.match(/^\/projects\/(\d+)\/iterations$/);
    if (iterationsMatch) {
        import('../iterations/list.mjs').then(module => {
            loadTemplate('iterations/list.html', contentDiv)
                .then(() => module.loadIterationHistory(iterationsMatch[1]))
                .catch(err => { contentDiv.innerHTML = '<h1>Error loading iterations</h1>'; });
        });
        return;
    }

    switch (path) {
        case '/projects':
            loadTemplate("projects/list.html", contentDiv).then(() => {
                return loadProjectList(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading project list page:', error);
            });
            break;
        case '/projects/add':
            loadTemplate("projects/add.html", contentDiv).then(() => {
                return loadAddProjectForm(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading add project page:', error);
            });
            break;
        default:
            contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}
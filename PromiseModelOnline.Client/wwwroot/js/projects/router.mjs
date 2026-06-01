import { loadTemplate } from '../router.mjs';
import { loadProjectList } from './list.mjs';
import { loadAddProjectForm } from './add.mjs';
import { loadStridesPage } from '../strides/router.mjs';
import { loadSharePage } from './share.mjs';
import { loadGraphPage } from './graph.mjs';
import { loadProjectSettingsPage } from './settings.mjs';
import { loadProjectAuditHistoryPage } from './history.mjs';

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

    // Match /projects/{id}/history
    const historyMatch = path.match(/^\/projects\/(\d+)\/history$/);
    if (historyMatch) {
        loadTemplate('projects/history.html', contentDiv)
            .then(() => loadProjectAuditHistoryPage(navContentDiv, contentDiv, historyMatch[1]))
            .catch(err => { contentDiv.innerHTML = '<h1>Error loading project activity</h1>'; });
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
    }
}
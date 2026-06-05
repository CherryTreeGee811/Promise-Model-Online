import { loadTemplate, loadTemplateWithError, showNotFound } from '../router.mjs';
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
            .catch(loadTemplateWithError(contentDiv, 'project settings'));
        return;
    }
    
    const stridesMatch = path.match(/^\/projects\/(\d+)\/strides$/);
    if (stridesMatch) {
        loadStridesPage(stridesMatch[1], navContentDiv, contentDiv);
        return;
    }

    const shareMatch = path.match(/^\/projects\/(\d+)\/share$/);
    if (shareMatch) {
        loadTemplate('projects/share.html', contentDiv)
            .then(() => loadSharePage(shareMatch[1], contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'share page'));
        return;
    }

    const graphMatch = path.match(/^\/projects\/(\d+)\/graph$/);
    if (graphMatch) {
        loadTemplate('projects/graph.html', contentDiv)
            .then(() => loadGraphPage(graphMatch[1], contentDiv))
            .catch(loadTemplateWithError(contentDiv, 'graph page'));
        return;
    }

    const settingsMatch = path.match(/^\/projects\/(\d+)\/settings$/);
    if (settingsMatch) {
        loadTemplate('projects/settings.html', contentDiv)
            .then(() => loadProjectSettingsPage(navContentDiv, contentDiv, settingsMatch[1]))
            .catch(loadTemplateWithError(contentDiv, 'project settings'));
        return;
    }

    const historyMatch = path.match(/^\/projects\/(\d+)\/history$/);
    if (historyMatch) {
        loadTemplate('projects/history.html', contentDiv)
            .then(() => loadProjectAuditHistoryPage(navContentDiv, contentDiv, historyMatch[1]))
            .catch(loadTemplateWithError(contentDiv, 'project activity'));
        return;
    }

    const iterationsMatch = path.match(/^\/projects\/(\d+)\/iterations$/);
    if (iterationsMatch) {
        import('../iterations/list.mjs').then(module => {
            loadTemplate('iterations/list.html', contentDiv)
                .then(() => module.loadIterationHistory(iterationsMatch[1]))
                .catch(loadTemplateWithError(contentDiv, 'iterations'));
        });
        return;
    }

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
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
        loadStridesPage(owner, project, navContentDiv, contentDiv);
        return;
    }

    const main = segments[0];
    const seq = segments[1];

    switch (true) {
        case main === 'strides':
            loadStridesPage(owner, project, navContentDiv, contentDiv);
            break;
        case main === 'graph':
            loadTemplate('projects/graph.html', contentDiv)
                .then(() => loadGraphPage(owner, project, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'graph page'));
            break;
        case main === 'settings':
            loadTemplate('projects/settings.html', contentDiv)
                .then(() => loadProjectSettingsPage(navContentDiv, contentDiv, owner, project))
                .catch(loadTemplateWithError(contentDiv, 'project settings'));
            break;
        case main === 'share':
            loadTemplate('projects/share.html', contentDiv)
                .then(() => loadSharePage(owner, project, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'share page'));
            break;
        case main === 'history':
            loadTemplate('projects/history.html', contentDiv)
                .then(() => loadProjectAuditHistoryPage(navContentDiv, contentDiv, owner, project))
                .catch(loadTemplateWithError(contentDiv, 'project activity'));
            break;
        case main === 'iterations':
            import('../iterations/list.mjs').then(module => {
                loadTemplate('iterations/list.html', contentDiv)
                    .then(() => module.loadIterationHistory(owner, project))
                    .catch(loadTemplateWithError(contentDiv, 'iterations'));
            });
            break;
        case main === 'promises' && !!seq:
            loadTemplate('promises/detail.html', contentDiv)
                .then(() => loadPromiseDetail(owner, project, seq, navContentDiv, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'promise'));
            break;
        case main === 'epics' && !!seq:
            loadTemplate('epics/detail.html', contentDiv)
                .then(() => loadEpicDetail(owner, project, seq, navContentDiv, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'epic'));
            break;
        case main === 'journeys' && !!seq:
            loadTemplate('journeys/detail.html', contentDiv)
                .then(() => loadJourneyDetail(owner, project, seq, navContentDiv, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'journey'));
            break;
        case main === 'flows' && !!seq:
            loadTemplate('flows/detail.html', contentDiv)
                .then(() => loadFlowDetail(owner, project, seq, navContentDiv, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'flow'));
            break;
        case main === 'moments' && !!seq:
            loadTemplate('moments/detail.html', contentDiv)
                .then(() => loadMomentDetail(owner, project, seq, navContentDiv, contentDiv))
                .catch(loadTemplateWithError(contentDiv, 'moment'));
            break;
        default:
            showNotFound(contentDiv);
    }
}
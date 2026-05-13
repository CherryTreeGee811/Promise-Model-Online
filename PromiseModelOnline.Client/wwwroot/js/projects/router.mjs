import { loadTemplate } from '../router.mjs';
import { loadProjectList } from './list.mjs';
import { loadStridesPage } from '../strides/router.mjs';
import { loadSharePage } from './share.mjs';

export function handleProjectRoutes(path, navContentDiv, contentDiv) {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
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

    switch (path) {
        case '/projects':
            loadTemplate("projects/list.html", contentDiv).then(() => {
                return loadProjectList(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading project list page:', error);
            });
            break;
        default:
            contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
    }
}
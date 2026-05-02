import { loadTemplate } from '../router.mjs';
import { loadProjectList } from './list.mjs';

export function handleEmployeeRoutes(path, navContentDiv, contentDiv) {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    switch (path) {
        case '/projects':
            loadTemplate("project/list.html", contentDiv).then(() => {
                return loadProjectList(navContentDiv, contentDiv);
            }).catch((error) => {
                console.error('Error loading project list page:', error);
            });
            break;
        default:
            contentDiv.innerHTML = `<h1>404 Not Found</h1>`;
    }
}
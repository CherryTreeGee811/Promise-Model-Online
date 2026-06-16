import { fetchProjects, getProjectPromises } from './api.mjs';

const promiseProjectCache = new Map();

/**
 * Convert a value to a numeric project ID, returning null if not parseable.
 * @param {*} value - The value to convert.
 * @returns {number|null} The parsed project ID, or null.
 */
function toProjectId(value) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Extract project ID hint from the current URL search params for graph linking.
 * @returns {number|null} The project ID, or null if not present or invalid.
 */
export function getGraphProjectIdHintFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return toProjectId(params.get('graphProjectId'));
}

/**
 * Extract owner and project slugs from the current URL path.
 * @returns {{owner: string|null, project: string|null}} The owner and project slugs.
 */
export function getOwnerProjectFromPath() {
    const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);
    if (match) {
        return { owner: match[1], project: match[2] };
    }
    return { owner: null, project: null };
}

/**
 * Build a URL for viewing the project graph with a highlighted node.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} focusNodeId - The node ID to highlight in the graph.
 * @returns {string|null} The graph URL, or null if required parameters are missing.
 */
export function buildGraphViewHref(owner, project, focusNodeId) {
    const safeOwner = String(owner ?? '').trim();
    const safeProject = String(project ?? '').trim();
    const safeFocus = String(focusNodeId ?? '').trim();

    if (!safeOwner || !safeProject || !safeFocus) return null;
    return `/${safeOwner}/${safeProject}/graph?focus=${encodeURIComponent(safeFocus)}`;
}

/**
 * Add or update a graph view button in a detail page, inserting it near the back button.
 * @param {HTMLElement} detailContainer - The detail page container element.
 * @param {string} href - The graph view URL to link to.
 */
export function upsertGraphViewButton(detailContainer, href) {
    if (!detailContainer || !href) return;

    let button = detailContainer.querySelector('#graph-view-link');
    if (!button) {
        button = document.createElement('a');
        button.id = 'graph-view-link';
        button.className = 'btn btn-outline-secondary btn-sm align-items-center gap-2';
        button.innerHTML = '<i class="bi bi-diagram-3" aria-hidden="true"></i><span> Graph View</span>';

        const backButton = detailContainer.querySelector('#back-link');
        if (backButton?.parentElement) {
            backButton.insertAdjacentElement('beforebegin', button);
            backButton.insertAdjacentText('beforebegin', ' ');
        } else {
            detailContainer.appendChild(button);
        }
    }

    button.href = href;
}

/**
 * Resolve a project ID for a given promise ID for graph linking.
 * Caches results and falls back to searching all projects if no preferred project ID is given.
 * @param {number|string} promiseId - The promise ID to look up.
 * @param {number|string|null} [preferredProjectId=null] - An optional preferred project ID to short-circuit.
 * @returns {Promise<number|null>} The resolved project ID, or null.
 */
export async function resolveProjectIdForPromise(promiseId, preferredProjectId = null) {
    const numericPromiseId = Number.parseInt(String(promiseId), 10);
    if (Number.isNaN(numericPromiseId)) return null;

    const cached = promiseProjectCache.get(numericPromiseId);
    if (cached != null) {
        return cached;
    }

    const preferred = toProjectId(preferredProjectId);
    if (preferred != null) {
        promiseProjectCache.set(numericPromiseId, preferred);
        return preferred;
    }

    const projects = await fetchProjects();
    const projectList = Array.isArray(projects) ? projects : [];

    for (const project of projectList) {
        const projectId = toProjectId(project?.id);
        if (projectId == null) continue;

        const promises = await getProjectPromises(project.ownerSlug, project.slug);
        if ((Array.isArray(promises) ? promises : []).some(item => Number(item?.id) === numericPromiseId)) {
            promiseProjectCache.set(numericPromiseId, projectId);
            return projectId;
        }
    }

    return null;
}

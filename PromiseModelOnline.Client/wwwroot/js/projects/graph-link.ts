// @ts-nocheck
import { fetchProjects, getProjectPromises } from './api.ts';

const promiseProjectCache = new Map<number, number>();

interface OwnerProject {
    owner: string | null;
    project: string | null;
}

/**
 * Parse a raw value into a project ID number.
 * @param {unknown} value - The value to parse.
 * @returns {number | null} The parsed project ID, or null if invalid.
 */
function toProjectId(value: unknown): number | null {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Read a graphProjectId hint from the URL query parameters.
 * @returns {number | null} The project ID if present and valid, or null.
 */
export function getGraphProjectIdHintFromUrl(): number | null {
    const params = new URLSearchParams(window.location.search);
    return toProjectId(params.get('graphProjectId'));
}

/**
 * Parse the owner and project slugs from the current URL path.
 * @returns {OwnerProject} An object with owner and project slugs (both may be null).
 */
export function getOwnerProjectFromPath(): OwnerProject {
    const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);
    if (match) {
        return { owner: match[1], project: match[2] };
    }
    return { owner: null, project: null };
}

/**
 * Build a URL to the graph view focusing on a specific node.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} focusNodeId - The node ID to focus on in the graph.
 * @returns {string | null} The full graph URL with focus parameter, or null if any input is missing.
 */
export function buildGraphViewHref(owner: string, project: string, focusNodeId: string): string | null {
    const safeOwner = String(owner ?? '').trim();
    const safeProject = String(project ?? '').trim();
    const safeFocus = String(focusNodeId ?? '').trim();

    if (!safeOwner || !safeProject || !safeFocus) return null;
    return `/${safeOwner}/${safeProject}/graph?focus=${encodeURIComponent(safeFocus)}`;
}

/**
 * Insert or update a "Graph View" link button in a detail page container.
 * @param {HTMLElement | null} detailContainer - The container element to insert the button into.
 * @param {string} href - The graph view URL for the button.
 */
export function upsertGraphViewButton(detailContainer: HTMLElement | null, href: string): void {
    if (!detailContainer || !href) return;

    let button = detailContainer.querySelector<HTMLAnchorElement>('#graph-view-link');
    if (!button) {
        button = document.createElement('a');
        button.id = 'graph-view-link';
        button.className = 'btn btn-outline-secondary btn-sm align-items-center gap-2';
        button.innerHTML = '<i class="bi bi-diagram-3" aria-hidden="true"></i><span> Graph View</span>';

        const backButton = detailContainer.querySelector<HTMLElement>('#back-link');
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
 * Resolve the project ID that contains a given promise, using cache and fallback project searches.
 * @param {string | number} promiseId - The promise ID to look up.
 * @param {string | number | null} [preferredProjectId] - An optional preferred project ID to short-circuit the search.
 * @returns {Promise<number | null>} The resolved project ID, or null if not found.
 */
export async function resolveProjectIdForPromise(promiseId: string | number, preferredProjectId: string | number | null = null): Promise<number | null> {
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

    const results = await Promise.all(projectList.map(async (project) => {
        const projectId = toProjectId(project?.id);
        if (projectId == null) return null;
        const promises = await getProjectPromises(project.ownerSlug, project.slug);
        const match = (Array.isArray(promises) ? promises : []).some(item => Number(item?.id) === numericPromiseId);
        return match ? projectId : null;
    }));
    const found = results.find(id => id != null);
    if (found != null) {
        promiseProjectCache.set(numericPromiseId, found);
        return found;
    }

    return null;
}

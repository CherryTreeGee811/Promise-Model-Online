import { fetchProjects, getProjectPromises } from './api.mjs';

const promiseProjectCache = new Map();

function toProjectId(value) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
}

export function getGraphProjectIdHintFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return toProjectId(params.get('graphProjectId'));
}

export function getOwnerProjectFromPath() {
    const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);
    if (match) {
        return { owner: match[1], project: match[2] };
    }
    return { owner: null, project: null };
}

export function buildGraphViewHref(owner, project, focusNodeId) {
    const safeOwner = String(owner ?? '').trim();
    const safeProject = String(project ?? '').trim();
    const safeFocus = String(focusNodeId ?? '').trim();

    if (!safeOwner || !safeProject || !safeFocus) return null;
    return `/${safeOwner}/${safeProject}/graph?focus=${encodeURIComponent(safeFocus)}`;
}

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

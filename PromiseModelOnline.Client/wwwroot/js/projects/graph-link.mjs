import { getAllProjects, getProjectPromises } from './api.mjs';

const promiseProjectCache = new Map();

function toProjectId(value) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
}

export function getGraphProjectIdHintFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return toProjectId(params.get('graphProjectId'));
}

export function buildGraphViewHref(projectId, focusNodeId) {
    const safeProjectId = toProjectId(projectId);
    const safeFocus = String(focusNodeId ?? '').trim();

    if (safeProjectId == null || !safeFocus) return null;
    return `/projects/${safeProjectId}/graph?focus=${encodeURIComponent(safeFocus)}`;
}

export function upsertGraphViewButton(detailContainer, href) {
    if (!detailContainer || !href) return;

    let button = detailContainer.querySelector('#graph-view-link');
    if (!button) {
        button = document.createElement('a');
        button.id = 'graph-view-link';
        button.className = 'view-btn';
        button.textContent = 'Graph View';

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

    const projects = await getAllProjects();
    const projectList = Array.isArray(projects) ? projects : [];

    for (const project of projectList) {
        const projectId = toProjectId(project?.id);
        if (projectId == null) continue;

        const promises = await getProjectPromises(projectId);
        if ((Array.isArray(promises) ? promises : []).some(item => Number(item?.id) === numericPromiseId)) {
            promiseProjectCache.set(numericPromiseId, projectId);
            return projectId;
        }
    }

    return null;
}

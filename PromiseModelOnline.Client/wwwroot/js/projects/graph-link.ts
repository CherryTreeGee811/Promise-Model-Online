// @ts-nocheck
import { fetchProjects, getProjectPromises } from './api.ts';

const promiseProjectCache = new Map<number, number>();

interface OwnerProject {
    owner: string | null;
    project: string | null;
}

function toProjectId(value: unknown): number | null {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
}

export function getGraphProjectIdHintFromUrl(): number | null {
    const params = new URLSearchParams(window.location.search);
    return toProjectId(params.get('graphProjectId'));
}

export function getOwnerProjectFromPath(): OwnerProject {
    const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\//);
    if (match) {
        return { owner: match[1], project: match[2] };
    }
    return { owner: null, project: null };
}

export function buildGraphViewHref(owner: string, project: string, focusNodeId: string): string | null {
    const safeOwner = String(owner ?? '').trim();
    const safeProject = String(project ?? '').trim();
    const safeFocus = String(focusNodeId ?? '').trim();

    if (!safeOwner || !safeProject || !safeFocus) return null;
    return `/${safeOwner}/${safeProject}/graph?focus=${encodeURIComponent(safeFocus)}`;
}

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

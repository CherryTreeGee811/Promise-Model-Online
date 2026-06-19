
interface OwnerProject {
    owner: string | undefined;
    project: string | undefined;
}



/**
 * Parse the owner and project slugs from the current URL path.
 * @returns {OwnerProject} An object with owner and project slugs (both may be null).
 */
export function getOwnerProjectFromPath(): OwnerProject {
    const match = /^\/([^/]+)\/([^/]+)\//.exec(location.pathname);
    if (match) {
        return { owner: match[1], project: match[2] };
    }
    return { owner: undefined, project: undefined };
}

/**
 * Build a URL to the graph view focusing on a specific node.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {string} focusNodeId - The node ID to focus on in the graph.
 * @returns {string | undefined} The graph view URL with focus parameter, or undefined if any input is missing.
 */
export function buildGraphViewHref(owner: string, project: string, focusNodeId: string): string | undefined {
    const safeOwner = (owner ?? '').trim();
    const safeProject = (project ?? '').trim();
    const safeFocus = (focusNodeId ?? '').trim();

    if (!safeOwner || !safeProject || !safeFocus) return;
    return `/${safeOwner}/${safeProject}/graph?focus=${encodeURIComponent(safeFocus)}`;
}

/**
 * Insert or update a "Graph View" link button in a detail page container.
 * @param {HTMLElement } detailContainer - The container element to insert the button into.
 * @param {string} href - The graph view URL for the button.
 */
export function upsertGraphViewButton(detailContainer: HTMLElement | null, href: string): void {
    if (!detailContainer || !href) return;

    let button = detailContainer.querySelector<HTMLAnchorElement>('#graph-view-link');
    if (!button) {
        button = document.createElement('a');
        button.id = 'graph-view-link';
        button.className = 'btn btn-outline-secondary btn-sm align-items-center gap-2';
         
        const icon = document.createElement('i');
        icon.className = 'bi bi-diagram-3';
        icon.setAttribute('aria-hidden', 'true');
        const span = document.createElement('span');
        span.textContent = ' Graph View';
        button.append(icon, span);

        const backButton = detailContainer.querySelector<HTMLElement>('#back-link');
        if (backButton?.parentElement) {
            backButton.before(button);
            backButton.before(' ');
        } else {
            detailContainer.append(button);
        }
    }

}

/**
 * Resolve the project ID that contains a given promise, using cache and fallback project searches.
 * @param {string | number} promiseId - The promise ID to look up.
 * @param {string | number } [preferredProjectId] - An optional preferred project ID to short-circuit the search.
 * @returns {Promise<number | null>} The resolved project ID, or null if not found.
 */

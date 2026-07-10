import { navigate } from "../router.ts";
import { renderEmptyTableRow } from "../utils/empty-table.ts";

import { fetchProjects } from './api.ts';

/**
 * Render the empty state when no projects exist and wire up the create button.
 * @param {HTMLElement} tableBody - The table body element to populate.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
function showEmptyState(tableBody: HTMLElement, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(renderEmptyTableRow({
        icon: 'bi-folder',
        title: 'There are no projects yet',
        description: 'Click "Add Project" to create your first project.',
        colspan: 2,
        button: { text: 'Create your first project', icon: 'bi-plus-circle', id: 'empty-state-add-project-btn' },
    }).outerHTML, 'text/html');
    tableBody.replaceChildren(...parsed.body.childNodes);
    const button = document.querySelector('#empty-state-add-project-btn');
    if (button) {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            void navigate('/projects/add', navContentDiv, contentDiv);
        });
    }
}

/**
 * Create an anchor element with the given attributes.
 * @param {string} href - The link href.
 * @param {string} className - The CSS class name.
 * @param {Record<string, string>} dataset - Data attributes to set.
 * @param {string} text - The link text.
 * @param {string} [icon] - Optional icon class.
 * @param {string} [title] - Optional title attribute.
 * @param {string} [ariaLabel] - Optional aria-label attribute.
 * @returns {HTMLAnchorElement} The created anchor element.
 */
function createActionLink(href: string, className: string, dataset: Record<string, string>, text: string, icon?: string, title?: string, ariaLabel?: string): HTMLAnchorElement {
    const a = document.createElement('a');
    a.href = href;
    a.className = className;
    for (const [key, value] of Object.entries(dataset)) {
        a.dataset[key] = value;
    }
    if (title) a.title = title;
    if (ariaLabel) a.setAttribute('aria-label', ariaLabel);
    if (icon) {
        const index = document.createElement('i');
        index.className = icon;
        index.setAttribute('aria-hidden', 'true');
        a.append(index);
    } else {
        a.textContent = text;
    }
    return a;
}

const NAV_BUTTON_SELECTORS: Array<{ selector: string; path: string }> = [
    { selector: '.view-iterations-btn', path: 'strides' },
    { selector: '.graph-btn', path: 'graph' },
    { selector: '.settings-btn', path: 'settings' },
    { selector: '.share-btn', path: 'share' },
    { selector: '.audit-log-btn', path: 'history' },
];

/**
 * Bind click handlers to navigation buttons in the container.
 * @param {HTMLElement} container - The container element to search for buttons.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
function bindNavigationHandlers(container: HTMLElement, navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    for (const { selector, path } of NAV_BUTTON_SELECTORS) {
        for (const button of container.querySelectorAll(`${selector}[data-owner-slug]`)) {
            const element = button as HTMLElement;
            element.addEventListener('click', event => {
                event.preventDefault();
                const owner = element.dataset.ownerSlug;
                const project = element.dataset.projectSlug;
                void navigate(`/${owner}/${project}/${path}`, navContentDiv, contentDiv);
            });
        }
    }
}

/**
 * Render a table row for a project.
 * @param {{ name?: string; ownerSlug?: string; slug?: string }} project - The project object.
 * @param {string} [project.name] - The project name.
 * @param {string} [project.ownerSlug] - The owner slug.
 * @param {string} [project.slug] - The project slug.
 * @returns {HTMLTableRowElement} The rendered table row.
 */
function renderProjectRow(project: { name?: string; ownerSlug?: string; slug?: string }): HTMLTableRowElement {
    const row = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.textContent = project.name ?? '';
    row.append(nameTd);

    const actionsTd = document.createElement('td');
    actionsTd.className = 'd-flex flex-wrap gap-2';
    actionsTd.append(
        createActionLink(`/${project.ownerSlug}/${project.slug}/strides`, 'btn btn-sm btn-outline-primary view-iterations-btn', { ownerSlug: project.ownerSlug!, projectSlug: project.slug! }, 'View Backlog'),
        createActionLink(`/${project.ownerSlug}/${project.slug}/graph`, 'btn btn-sm btn-outline-secondary graph-btn', { ownerSlug: project.ownerSlug!, projectSlug: project.slug! }, '', 'bi bi-diagram-3', 'Open graph view', 'Open graph view'),
        createActionLink(`/${project.ownerSlug}/${project.slug}/settings`, 'btn btn-sm btn-outline-secondary settings-btn', { ownerSlug: project.ownerSlug!, projectSlug: project.slug! }, '', 'bi bi-gear', 'Open project settings', 'Open project settings'),
        createActionLink(`/${project.ownerSlug}/${project.slug}/share`, 'btn btn-sm btn-outline-secondary share-btn', { ownerSlug: project.ownerSlug!, projectSlug: project.slug! }, '', 'bi bi-share', 'Manage sharing permissions', 'Manage sharing permissions'),
        createActionLink(`/${project.ownerSlug}/${project.slug}/history`, 'btn btn-sm btn-outline-secondary audit-log-btn', { ownerSlug: project.ownerSlug!, projectSlug: project.slug! }, '', 'bi bi-eye', 'View project activity', 'View project activity'),
    );
    row.append(actionsTd);
    return row;
}

/**
 * Handle errors during project list loading.
 * @param {unknown} error - The error object.
 * @param {HTMLElement} errorTextElement - The element to display error text.
 */
function handleProjectListError(error: unknown, errorTextElement: HTMLElement): void {
    if ((error as Error).message.includes('404')) {
        errorTextElement.textContent = 'Endpoint not found';
    } else if ((error as Error).message.includes('500')) {
        errorTextElement.textContent = 'Internal server error';
    } else {
        errorTextElement.textContent = 'Unknown error';
    }
}

/**
 * Load and render the project list page.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export async function loadProjectList(navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const tableBody = document.querySelector('#project-list-table-body') as HTMLElement | null;
    const errorTextElement = document.querySelector('#error-text') as HTMLElement | null;
    const successTextElement = document.querySelector('#success-text') as HTMLElement | null;

    if (!tableBody || !errorTextElement || !successTextElement) return;

    const projectLinkElement = document.querySelector('#add-project-link') as HTMLElement | null;
    if (projectLinkElement) {
        projectLinkElement.addEventListener('click', event => {
            event.preventDefault();
            void navigate('/projects/add', navContentDiv, contentDiv);
        });
    }

    errorTextElement.textContent = '';
    successTextElement.textContent = '';
    tableBody.replaceChildren();

    try {
        const projects = await fetchProjects();
        if (!projects || projects.length === 0) {
            showEmptyState(tableBody, navContentDiv, contentDiv);
            return;
        }

        for (const project of projects) {
            tableBody.append(renderProjectRow(project));
        }

        bindNavigationHandlers(tableBody, navContentDiv, contentDiv);
    } catch (error) {
        handleProjectListError(error, errorTextElement);
    }
}

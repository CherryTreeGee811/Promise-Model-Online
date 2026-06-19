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
 * Load the project listing page, fetching all projects and rendering them in a table.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @returns {void}
 */
export async function loadProjectList(navContentDiv: HTMLElement, contentDiv: HTMLElement): Promise<void> {
    const tableBody = document.querySelector('#project-list-table-body') as HTMLElement | null;
    const errorTextElement = document.querySelector("#error-text") as HTMLElement | null;
    const successTextElement = document.querySelector("#success-text") as HTMLElement | null;

    if (!tableBody || !errorTextElement || !successTextElement) {
        return;
    }

    const projectLinkElement = document.querySelector('#add-project-link') as HTMLElement | null;

    if (projectLinkElement) {
        projectLinkElement.addEventListener('click', (event) => {
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
            showEmptyState(tableBody!, navContentDiv, contentDiv);
            return;
        }

        for (const project of projects) {
            const row = document.createElement('tr');
            const nameTd = document.createElement('td');
            nameTd.textContent = project.name ?? '';
            row.append(nameTd);

            const actionsTd = document.createElement('td');
            actionsTd.className = 'd-flex flex-wrap gap-2';

            /**
             * @param {string} href - Link URL
             * @param {string} className - CSS class
             * @param {Record<string, string>} dataset - Data attributes
             * @param {string} text - Link text
             * @param {string} [icon] - Bootstrap icon class
             * @param {string} [title] - Title attribute
             * @param {string} [ariaLabel] - Aria label
             * @returns {HTMLAnchorElement} The action link element
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

            actionsTd.append(
                createActionLink(
                    `/${project.ownerSlug}/${project.slug}/strides`,
                    'btn btn-sm btn-outline-primary view-iterations-btn',
                    { ownerSlug: project.ownerSlug, projectSlug: project.slug },
                    'View Backlog',
                ),
                createActionLink(
                    `/${project.ownerSlug}/${project.slug}/graph`,
                    'btn btn-sm btn-outline-secondary graph-btn',
                    { ownerSlug: project.ownerSlug, projectSlug: project.slug },
                    '',
                    'bi bi-diagram-3',
                    'Open graph view',
                    'Open graph view',
                ),
                createActionLink(
                    `/${project.ownerSlug}/${project.slug}/settings`,
                    'btn btn-sm btn-outline-secondary settings-btn',
                    { ownerSlug: project.ownerSlug, projectSlug: project.slug },
                    '',
                    'bi bi-gear',
                    'Open project settings',
                    'Open project settings',
                ),
                createActionLink(
                    `/${project.ownerSlug}/${project.slug}/share`,
                    'btn btn-sm btn-outline-secondary share-btn',
                    { ownerSlug: project.ownerSlug, projectSlug: project.slug },
                    '',
                    'bi bi-share',
                    'Manage sharing permissions',
                    'Manage sharing permissions',
                ),
                createActionLink(
                    `/${project.ownerSlug}/${project.slug}/history`,
                    'btn btn-sm btn-outline-secondary audit-log-btn',
                    { ownerSlug: project.ownerSlug, projectSlug: project.slug },
                    '',
                    'bi bi-eye',
                    'View project activity',
                    'View project activity',
                ),
            );

            row.append(actionsTd);
            tableBody!.append(row);
        }

        for (const viewButton of tableBody!.querySelectorAll('.view-iterations-btn[data-owner-slug]')) {
            const element = viewButton as HTMLElement;
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = element.dataset.ownerSlug;
                const project = element.dataset.projectSlug;
                void navigate(`/${owner}/${project}/strides`, navContentDiv, contentDiv);
            });
        }

        for (const graphButton of tableBody!.querySelectorAll('.graph-btn[data-owner-slug]')) {
            const element = graphButton as HTMLElement;
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = element.dataset.ownerSlug;
                const project = element.dataset.projectSlug;
                void navigate(`/${owner}/${project}/graph`, navContentDiv, contentDiv);
            });
        }

        for (const settingsButton of tableBody!.querySelectorAll('.settings-btn[data-owner-slug]')) {
            const element = settingsButton as HTMLElement;
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = element.dataset.ownerSlug;
                const project = element.dataset.projectSlug;
                void navigate(`/${owner}/${project}/settings`, navContentDiv, contentDiv);
            });
        }

        for (const shareButton of tableBody!.querySelectorAll('.share-btn[data-owner-slug]')) {
            const element = shareButton as HTMLElement;
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = element.dataset.ownerSlug;
                const project = element.dataset.projectSlug;
                void navigate(`/${owner}/${project}/share`, navContentDiv, contentDiv);
            });
        }

        for (const auditButton of tableBody!.querySelectorAll('.audit-log-btn[data-owner-slug]')) {
            const element = auditButton as HTMLElement;
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = element.dataset.ownerSlug;
                const project = element.dataset.projectSlug;
                void navigate(`/${owner}/${project}/history`, navContentDiv, contentDiv);
            });
        }
    } catch (error) {
        if ((error as Error).message.includes("404")) {
            errorTextElement!.textContent = "Endpoint not found";
        } else if ((error as Error).message.includes("500")) {
            errorTextElement!.textContent = "Internal server error";
        } else {
            errorTextElement!.textContent = "Unknown error";
        }
    }
}

// @ts-nocheck
import { navigate } from "../router.ts";
import { renderEmptyTableRow } from "../utils/empty-table.ts";

import { fetchProjects } from './api.ts';

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
    tableBody.innerHTML = '';

    try {
        const projects = await fetchProjects();
        if (!projects || projects.length === 0) {
            tableBody!.innerHTML = renderEmptyTableRow({
                icon: 'bi-folder',
                title: 'There are no projects yet',
                description: 'Click "Add Project" to create your first project.',
                colspan: 2,
                button: {
                    text: 'Create your first project',
                    icon: 'bi-plus-circle',
                    id: 'empty-state-add-project-btn',
                },
            });
            const emptyButton = document.querySelector('#empty-state-add-project-btn');
            if (emptyButton) {
                emptyButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    void navigate('/projects/add', navContentDiv, contentDiv);
                });
            }
            return;
        }

        for (const project of projects) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.name ?? ''}</td>
                <td class="d-flex flex-wrap gap-2">
                    <a href="/${project.ownerSlug}/${project.slug}/strides" class="btn btn-sm btn-outline-primary view-iterations-btn" data-owner-slug="${project.ownerSlug}" data-project-slug="${project.slug}">View Backlog</a>
                    <a href="/${project.ownerSlug}/${project.slug}/graph" class="btn btn-sm btn-outline-secondary graph-btn" data-owner-slug="${project.ownerSlug}" data-project-slug="${project.slug}" title="Open graph view" aria-label="Open graph view">
                        <i class="bi bi-diagram-3" aria-hidden="true"></i>
                    </a>
                    <a href="/${project.ownerSlug}/${project.slug}/settings" class="btn btn-sm btn-outline-secondary settings-btn" data-owner-slug="${project.ownerSlug}" data-project-slug="${project.slug}" title="Open project settings" aria-label="Open project settings">
                        <i class="bi bi-gear" aria-hidden="true"></i>
                    </a>
                    <a href="/${project.ownerSlug}/${project.slug}/share" class="btn btn-sm btn-outline-secondary share-btn" data-owner-slug="${project.ownerSlug}" data-project-slug="${project.slug}" title="Manage sharing permissions" aria-label="Manage sharing permissions">
                        <i class="bi bi-share" aria-hidden="true"></i>
                    </a>
                    <a href="/${project.ownerSlug}/${project.slug}/history" class="btn btn-sm btn-outline-secondary audit-log-btn" data-owner-slug="${project.ownerSlug}" data-project-slug="${project.slug}" title="View project activity" aria-label="View project activity">
                        <i class="bi bi-eye" aria-hidden="true"></i>
                    </a>
                </td>
            `;
            tableBody!.append(row);
        }

        for (const viewButton of tableBody!.querySelectorAll('.view-iterations-btn[data-owner-slug]')) {
            viewButton.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = viewButton.dataset.ownerSlug;
                const project = viewButton.dataset.projectSlug;
                void navigate(`/${owner}/${project}/strides`, navContentDiv, contentDiv);
            });
        }

        for (const graphButton of tableBody!.querySelectorAll('.graph-btn[data-owner-slug]')) {
            graphButton.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = graphButton.dataset.ownerSlug;
                const project = graphButton.dataset.projectSlug;
                void navigate(`/${owner}/${project}/graph`, navContentDiv, contentDiv);
            });
        }

        for (const settingsButton of tableBody!.querySelectorAll('.settings-btn[data-owner-slug]')) {
            settingsButton.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = settingsButton.dataset.ownerSlug;
                const project = settingsButton.dataset.projectSlug;
                void navigate(`/${owner}/${project}/settings`, navContentDiv, contentDiv);
            });
        }

        for (const shareButton of tableBody!.querySelectorAll('.share-btn[data-owner-slug]')) {
            shareButton.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = shareButton.dataset.ownerSlug;
                const project = shareButton.dataset.projectSlug;
                void navigate(`/${owner}/${project}/share`, navContentDiv, contentDiv);
            });
        }

        for (const auditButton of tableBody!.querySelectorAll('.audit-log-btn[data-owner-slug]')) {
            auditButton.addEventListener('click', (event) => {
                event.preventDefault();
                const owner = auditButton.dataset.ownerSlug;
                const project = auditButton.dataset.projectSlug;
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

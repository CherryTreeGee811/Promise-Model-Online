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
export function loadProjectList(navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const tableBody = document.getElementById('project-list-table-body') as HTMLElement | null;
    const errorTextElement = document.getElementById("error-text") as HTMLElement | null;
    const successTextElement = document.getElementById("success-text") as HTMLElement | null;
    const addProjectLink = document.getElementById('add-project-link') as HTMLElement | null;

    if (!tableBody || !errorTextElement || !successTextElement) {
        return;
    }

    if (addProjectLink) {
        addProjectLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('/projects/add', navContentDiv, contentDiv);
        });
    }

    errorTextElement.textContent = '';
    successTextElement.textContent = '';
    tableBody.innerHTML = '';

    fetchProjects().then(projects => {
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
            const emptyBtn = document.getElementById('empty-state-add-project-btn');
            if (emptyBtn) {
                emptyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigate('/projects/add', navContentDiv, contentDiv);
                });
            }
            return;
        }

        projects.forEach(project => {
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
            tableBody!.appendChild(row);
        });

        tableBody!.querySelectorAll('.view-iterations-btn[data-owner-slug]').forEach(viewBtn => {
            viewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = viewBtn.getAttribute('data-owner-slug');
                const project = viewBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/strides`, navContentDiv, contentDiv);
            });
        });

        tableBody!.querySelectorAll('.graph-btn[data-owner-slug]').forEach(graphBtn => {
            graphBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = graphBtn.getAttribute('data-owner-slug');
                const project = graphBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/graph`, navContentDiv, contentDiv);
            });
        });

        tableBody!.querySelectorAll('.settings-btn[data-owner-slug]').forEach(settingsBtn => {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = settingsBtn.getAttribute('data-owner-slug');
                const project = settingsBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/settings`, navContentDiv, contentDiv);
            });
        });

        tableBody!.querySelectorAll('.share-btn[data-owner-slug]').forEach(shareBtn => {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = shareBtn.getAttribute('data-owner-slug');
                const project = shareBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/share`, navContentDiv, contentDiv);
            });
        });

        tableBody!.querySelectorAll('.audit-log-btn[data-owner-slug]').forEach(auditBtn => {
            auditBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = auditBtn.getAttribute('data-owner-slug');
                const project = auditBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/history`, navContentDiv, contentDiv);
            });
        });
    }).catch(error => {
        if ((error as Error).message.includes("404")) {
            errorTextElement!.textContent = "Endpoint not found";
        } else if ((error as Error).message.includes("500")) {
            errorTextElement!.textContent = "Internal server error";
        } else {
            errorTextElement!.textContent = "Unknown error";
        }
    });
}

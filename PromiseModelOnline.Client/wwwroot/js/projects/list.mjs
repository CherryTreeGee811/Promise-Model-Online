<<<<<<< HEAD
import { navigate } from "../router.mjs";
import { fetchProjects } from "./api.mjs";
import { renderEmptyTableRow } from "../utils/empty-table.mjs";

export function loadProjectList(navContentDiv, contentDiv) {
    const tableBody = document.getElementById('project-list-table-body');
    const errorTextElement = document.getElementById("error-text");
    const successTextElement = document.getElementById("success-text");
    const addProjectLink = document.getElementById('add-project-link');

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
            tableBody.innerHTML = renderEmptyTableRow({
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
            tableBody.appendChild(row);
        });

        tableBody.querySelectorAll('.view-iterations-btn[data-owner-slug]').forEach(viewBtn => {
            viewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = viewBtn.getAttribute('data-owner-slug');
                const project = viewBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/strides`, navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.graph-btn[data-owner-slug]').forEach(graphBtn => {
            graphBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = graphBtn.getAttribute('data-owner-slug');
                const project = graphBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/graph`, navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.settings-btn[data-owner-slug]').forEach(settingsBtn => {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = settingsBtn.getAttribute('data-owner-slug');
                const project = settingsBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/settings`, navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.share-btn[data-owner-slug]').forEach(shareBtn => {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = shareBtn.getAttribute('data-owner-slug');
                const project = shareBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/share`, navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.audit-log-btn[data-owner-slug]').forEach(auditBtn => {
            auditBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const owner = auditBtn.getAttribute('data-owner-slug');
                const project = auditBtn.getAttribute('data-project-slug');
                navigate(`/${owner}/${project}/history`, navContentDiv, contentDiv);
            });
        });
    }).catch(error => {
        if (error.message.includes("404")) {
            errorTextElement.textContent = "Endpoint not found";
        } else if (error.message.includes("500")) {
            errorTextElement.textContent = "Internal server error";
        } else {
            errorTextElement.textContent = "Unknown error";
        }
    });
||||||| 1bedf4f
=======
import { routeHandler } from "../router.mjs";
import { getAllProjects } from "./api.mjs";

export function loadProjectList(navContentDiv, contentDiv) {
    const tableBody = document.getElementById('project-list-table-body');
    const errorTextElement = document.getElementById("error-text");
    const successTextElement = document.getElementById("success-text");
    const loadingTextElement = document.getElementById("loading-text");
    const addProjectLink = document.getElementById('add-project-link');

    if (addProjectLink) {
        addProjectLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/projects/add');
            routeHandler(navContentDiv, contentDiv);
        });
    }

    loadingTextElement.textContent = "Loading projects...";
    tableBody.innerHTML = '';

    getAllProjects().then(projects => {
        projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.id ?? ''}</td>
                <td>${project.name ?? ''}</td>
                <td>
                    <a href="/projects/${project.id}/strides" class="view-btn" project-id="${project.id}">View</a>
                    <a href="/projects/${project.id}/graph" class="graph-btn" project-id="${project.id}">&#128200; Graph View</a>
                    <a href="/projects/${project.id}/settings" class="edit-btn" project-id="${project.id}">&#9881;&#65039; Settings</a>
                    <a href="/projects/${project.id}/share" class="share-btn">Share</a>
                </td>
            `;
            tableBody.appendChild(row);
        });

        tableBody.querySelectorAll('.view-btn[project-id]').forEach(viewBtn => {
            viewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = viewBtn.getAttribute('project-id');
                window.history.pushState({}, '', `/projects/${projectId}/strides`);
                routeHandler(navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.graph-btn[project-id]').forEach(graphBtn => {
            graphBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = graphBtn.getAttribute('project-id');
                window.history.pushState({}, '', `/projects/${projectId}/graph`);
                routeHandler(navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.edit-btn[project-id]').forEach(settingsBtn => {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = settingsBtn.getAttribute('project-id');
                window.history.pushState({}, '', `/projects/${projectId}/settings`);
                routeHandler(navContentDiv, contentDiv);
            });
        });
    }).catch(error => {
        if (error.message.includes("404")) {
            errorTextElement.textContent = "Endpoint not found";
        } else if (error.message.includes("500")) {
            errorTextElement.textContent = "Internal server error";
        } else {
            errorTextElement.textContent = "Unknown error";
        }
    });
    loadingTextElement.textContent = "";
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
}
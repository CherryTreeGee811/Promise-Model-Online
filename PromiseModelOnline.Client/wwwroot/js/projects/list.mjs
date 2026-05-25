import { routeHandler } from "../router.mjs";
import { getAllProjects } from "./api.mjs";

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
            window.history.pushState({}, '', '/projects/add');
            routeHandler(navContentDiv, contentDiv);
        });
    }

    errorTextElement.textContent = '';
    successTextElement.textContent = '';
    tableBody.innerHTML = '';

    getAllProjects().then(projects => {
        projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.name ?? ''}</td>
                <td class="d-flex flex-wrap gap-2">
                    <a href="/projects/${project.id}/strides" class="btn btn-sm btn-outline-primary view-iterations-btn" data-project-id="${project.id}">View Iterations</a>
                    <a href="/projects/${project.id}/graph" class="btn btn-sm btn-outline-secondary graph-btn" data-project-id="${project.id}" title="Open graph view" aria-label="Open graph view">
                        <i class="bi bi-diagram-3" aria-hidden="true"></i>
                    </a>
                    <a href="/projects/${project.id}/settings" class="btn btn-sm btn-outline-secondary settings-btn" data-project-id="${project.id}" title="Open project settings" aria-label="Open project settings">
                        <i class="bi bi-gear" aria-hidden="true"></i>
                    </a>
                    <a href="/projects/${project.id}/share" class="btn btn-sm btn-outline-secondary share-btn" data-project-id="${project.id}" title="Manage sharing permissions" aria-label="Manage sharing permissions">
                        <i class="bi bi-share" aria-hidden="true"></i>
                    </a>
                </td>
            `;
            tableBody.appendChild(row);
        });

        tableBody.querySelectorAll('.view-iterations-btn[data-project-id]').forEach(viewBtn => {
            viewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = viewBtn.getAttribute('data-project-id');
                window.history.pushState({}, '', `/projects/${projectId}/strides`);
                routeHandler(navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.graph-btn[data-project-id]').forEach(graphBtn => {
            graphBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = graphBtn.getAttribute('data-project-id');
                window.history.pushState({}, '', `/projects/${projectId}/graph`);
                routeHandler(navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.settings-btn[data-project-id]').forEach(settingsBtn => {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = settingsBtn.getAttribute('data-project-id');
                window.history.pushState({}, '', `/projects/${projectId}/settings`);
                routeHandler(navContentDiv, contentDiv);
            });
        });

        tableBody.querySelectorAll('.share-btn[data-project-id]').forEach(shareBtn => {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = shareBtn.getAttribute('data-project-id');
                window.history.pushState({}, '', `/projects/${projectId}/share`);
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
}
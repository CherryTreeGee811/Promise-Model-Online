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
}
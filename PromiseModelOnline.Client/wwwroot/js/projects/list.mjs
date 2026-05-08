import { routeHandler } from "../router.mjs";
import { getAllProjects, deleteProject } from "./api.mjs";


export function loadProjectList(navContentDiv, contentDiv) {
    const tableBody = document.getElementById('project-list-table-body');
    const errorTextElement = document.getElementById("error-text");
    const successTextElement = document.getElementById("success-text");
    const loadingTextElement = document.getElementById("loading-text");

    loadingTextElement.textContent = "Loading projects...";

    // Clear any existing projects in the list body
    tableBody.innerHTML = '';

    getAllProjects().then(projects => {
        projects.forEach(project => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.id ?? ''}</td>
                <td>${project.name ?? ''}</td>
                <td>
                    <a href="/projects/edit?id=${project.Id}" 
                        class="edit-btn" project-id="${project.Id}">Edit</a>
                    <button class="delete-btn" project-id="${project.Id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        tableBody.querySelectorAll('.delete-btn[project-id]').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = deleteBtn.getAttribute('project-id');
                deleteProject(projectId).then(() => {
                    // Reload the list after deleting an project
                    loadProjectList();
                }).catch(() => {
                    errorTextElement.textContent = "Failed to delete project. Please try again.";
                });
            });
        });

        tableBody.querySelectorAll('.edit-btn[project-id]').forEach(editBtn => {
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = editBtn.getAttribute('project-id');
                window.history.pushState({}, '', `/projects/edit?id=${projectId}`);
                routeHandler(navContentDiv, contentDiv);
            });
        });
    }).catch (error => {
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
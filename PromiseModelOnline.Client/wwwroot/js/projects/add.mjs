import { addProject } from './api.mjs';
import { routeHandler } from '../router.mjs';

export function loadAddProjectForm(navContentDiv, contentDiv) {
    const form = document.getElementById('add-project-form');
    const cancelLink = document.getElementById('cancel-add-project-link');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            manageAddProjectSubmission(navContentDiv, contentDiv);
        });
    }

    if (cancelLink) {
        cancelLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/projects');
            routeHandler(navContentDiv, contentDiv);
        });
    }
}

function manageAddProjectSubmission(navContentDiv, contentDiv) {
    const nameInput = document.getElementById('project-name-input');
    const descriptionInput = document.getElementById('project-description-input');
    const errorTextElement = document.getElementById('error-text');
    const successTextElement = document.getElementById('success-text');
    const loadingTextElement = document.getElementById('loading-text');

    errorTextElement.textContent = '';
    successTextElement.textContent = '';
    loadingTextElement.textContent = '';

    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!name) {
        errorTextElement.textContent = 'Project name is required.';
        return;
    }

    loadingTextElement.textContent = 'Creating project...';

    addProject({ name, description: description || null })
        .then((createdProject) => {
            if (!createdProject) {
                loadingTextElement.textContent = '';
                return;
            }

            window.history.pushState({}, '', '/projects');
            routeHandler(navContentDiv, contentDiv);
        })
        .catch((error) => {
            loadingTextElement.textContent = '';
            errorTextElement.textContent = error.message || 'Failed to create project.';
        });
}
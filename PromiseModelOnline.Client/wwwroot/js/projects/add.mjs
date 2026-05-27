import { addProject, importProject } from './api.mjs';
import { addPromise } from '../promises/api.mjs';
import { routeHandler } from '../router.mjs';
import { renderSummaryTable } from './summary.mjs';

export function loadAddProjectForm(navContentDiv, contentDiv) {
    const form = document.getElementById('add-project-form');
    const cancelLink = document.getElementById('cancel-add-project-link');
    const nameInput = document.getElementById('project-name-input');
    const descriptionInput = document.getElementById('project-description-input');
    const firstPromisePanel = document.getElementById('first-promise-panel');
    const firstPromiseInput = document.getElementById('first-promise-input');
    const createButton = document.getElementById('create-project-btn');
    const createButtonSpinner = document.getElementById('create-project-btn-spinner');
    const createButtonLabel = document.getElementById('create-project-btn-label');
    const importButton = document.getElementById('import-project-btn');
    const importButtonSpinner = document.getElementById('import-project-btn-spinner');
    const importButtonIcon = document.getElementById('import-project-btn-icon');
    const importButtonLabel = document.getElementById('import-project-btn-label');
    const clearImportButton = document.getElementById('clear-import-btn');
    const importInput = document.getElementById('import-project-input');
    const importSummaryPanel = document.getElementById('project-import-summary-panel');
    const errorTextElement = document.getElementById('error-text');
    const successTextElement = document.getElementById('success-text');

    if (!form || !nameInput || !descriptionInput || !firstPromisePanel || !firstPromiseInput || !createButton || !createButtonSpinner || !createButtonLabel || !importButton || !importButtonSpinner || !importButtonIcon || !importButtonLabel || !clearImportButton || !importInput || !importSummaryPanel || !errorTextElement || !successTextElement) {
        return;
    }

    let currentMode = 'scratch';
    let isBusy = false;

    function clearMessages() {
        errorTextElement.textContent = '';
        successTextElement.textContent = '';
    }

    function getSubmitButtonLabel() {
        return currentMode === 'import' ? 'Import Project' : 'Create Project';
    }

    function getBusySubmitButtonLabel() {
        return currentMode === 'import' ? 'Importing Project...' : 'Creating Project...';
    }

    function setSubmitButtonState(busy) {
        createButton.disabled = busy;
        createButtonSpinner.classList.toggle('d-none', !busy);
        createButtonLabel.textContent = busy ? getBusySubmitButtonLabel() : getSubmitButtonLabel();
    }

    function setImportButtonState(busy, busyLabel = 'Reading Project...') {
        importButton.disabled = busy;
        importButtonSpinner.classList.toggle('d-none', !busy);
        importButtonIcon.classList.toggle('d-none', busy);
        importButtonLabel.textContent = busy ? busyLabel : 'Import Project...';
    }

    function setBusyState(busy, source = 'submit') {
        isBusy = busy;
        setSubmitButtonState(busy && source === 'submit');
        setImportButtonState(busy && source === 'import', source === 'submit' ? 'Importing Project...' : 'Reading Project...');
        createButton.disabled = busy;
        clearImportButton.disabled = busy;
        importButton.disabled = busy;
        nameInput.disabled = busy;
        descriptionInput.disabled = busy;
        firstPromiseInput.disabled = busy;
        if (!busy) {
            setMode(currentMode);
        }
    }

    function setMode(mode) {
        currentMode = mode;
        const isImportMode = mode === 'import';
        const hasImportFile = Boolean(importInput.files?.[0]);
        // Hide the first-promise panel in import mode
        firstPromisePanel.hidden = isImportMode;
        nameInput.readOnly = isImportMode;
        descriptionInput.readOnly = isImportMode;
        createButtonLabel.textContent = isBusy ? getBusySubmitButtonLabel() : getSubmitButtonLabel();
        clearImportButton.hidden = !isImportMode || !hasImportFile;
        clearImportButton.style.display = clearImportButton.hidden ? 'none' : '';
    }

    function resetImportState() {
        importInput.value = '';
        importSummaryPanel.innerHTML = '';
        nameInput.value = '';
        descriptionInput.value = '';
        importButtonLabel.textContent = 'Import Project...';
        importButtonIcon.classList.remove('d-none');
        importButtonSpinner.classList.add('d-none');
        importButton.disabled = false;
        setMode('scratch');
        refreshHeading();
    }

    // Update H1 title as the user types the project name
    const titleHeading = document.querySelector('h1');
    function refreshHeading() {
        const val = nameInput.value.trim();
        const action = currentMode === 'import' ? 'Import' : 'Create';

        if (val) titleHeading.textContent = `${action} '${val}'`;
        else titleHeading.textContent = `${action} Project`;
    }
    nameInput.addEventListener('input', refreshHeading);

    function summarizeProjectExport(document) {
        const project = document.project;

        const promises = Array.isArray(project.productPromises) ? project.productPromises : [];
        const epics = promises.flatMap(promise => Array.isArray(promise.epics) ? promise.epics : []);
        const journeys = epics.flatMap(epic => Array.isArray(epic.journeys) ? epic.journeys : []);
        const flows = journeys.flatMap(journey => Array.isArray(journey.flows) ? journey.flows : []);
        const moments = flows.flatMap(flow => Array.isArray(flow.moments) ? flow.moments : []);
        const iterations = Array.isArray(project.iterations) ? project.iterations : [];
        const strides = iterations.flatMap(iteration => Array.isArray(iteration.strides) ? iteration.strides : []);

        return {
            promises: promises.length,
            epics: epics.length,
            journeys: journeys.length,
            flows: flows.length,
            moments: moments.length,
            iterations: iterations.length,
            strides: strides.length,
            promiseStackTotal: promises.length + epics.length + journeys.length + flows.length + moments.length,
        };
    }

    function renderImportedProjectPreview(document, file) {
        const project = document.project;
        const summary = summarizeProjectExport(document);

        renderSummaryTable(importSummaryPanel, [
            { label: 'Schema Version', value: document.schemaVersion ?? 'Unknown' },
            { label: 'Exported At', value: document.exportedAt ? new Date(document.exportedAt).toLocaleString() : 'Unknown' },
            { label: 'Project Name', value: project.name ?? '' },
            { label: 'Project Description', value: project.description ?? '' },
            { label: 'Promises', value: summary.promises },
            { label: 'Epics', value: summary.epics },
            { label: 'Journeys', value: summary.journeys },
            { label: 'Flows', value: summary.flows },
            { label: 'Moments', value: summary.moments },
            { label: 'Promise Stack Total', value: summary.promiseStackTotal },
            { isGap: true },
            { label: 'Iterations', value: summary.iterations },
            { label: 'Strides', value: summary.strides },
        ]);
    }

    async function readImportedProjectFile(file) {
        let parsed;

        try {
            parsed = JSON.parse(await file.text());
        } catch {
            throw new Error('The selected file is not valid JSON.');
        }

        if (!parsed || typeof parsed !== 'object' || !parsed.project) {
            throw new Error('The selected file does not look like a project export.');
        }

        return parsed;
    }

    async function manageAddProjectSubmission() {
        clearMessages();

        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        const firstPromiseStatement = firstPromiseInput.value.trim();

        if (!name) {
            errorTextElement.textContent = 'Project name is required.';
            return;
        }

        if (!firstPromiseStatement) {
            errorTextElement.textContent = 'The first Product Promise is required when creating from scratch.';
            return;
        }

        try {
            setBusyState(true, 'submit');
            const createdProject = await addProject({ name, description: description || null });

            await addPromise({
                statement: firstPromiseStatement,
                description: null,
                projectId: createdProject.id,
                displayOrder: 0,
            });

            window.history.pushState({}, '', `/projects/${createdProject.id}/graph`);
            routeHandler(navContentDiv, contentDiv);
        } catch (error) {
            errorTextElement.textContent = error.message || 'Failed to create project.';
        } finally {
            setBusyState(false, 'submit');
        }
    }

    async function manageImportSubmission() {
        clearMessages();

        const file = importInput.files?.[0];
        if (!file) {
            errorTextElement.textContent = 'Choose a project export to import.';
            return;
        }

        try {
            setBusyState(true, 'submit');
            const result = await importProject(file);
            const projectId = result?.projectId ?? result?.ProjectId;
            const warnings = Array.isArray(result?.warnings) ? result.warnings : Array.isArray(result?.Warnings) ? result.Warnings : [];

            successTextElement.textContent = warnings.length > 0
                ? `Project imported with ${warnings.length} warning(s).`
                : 'Project imported successfully.';

            if (projectId) {
                window.history.pushState({}, '', `/projects/${projectId}/graph`);
                routeHandler(navContentDiv, contentDiv);
            } else {
                window.history.pushState({}, '', '/projects');
                routeHandler(navContentDiv, contentDiv);
            }
        } catch (error) {
            errorTextElement.textContent = error.message || 'Failed to import project.';
        } finally {
            setBusyState(false, 'submit');
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (currentMode === 'import') {
            await manageImportSubmission();
            return;
        }

        await manageAddProjectSubmission();
    });

    importButton.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', async () => {
        clearMessages();

        const file = importInput.files?.[0];
        if (!file) {
            resetImportState();
            return;
        }

        try {
            setBusyState(true, 'import');
            const document = await readImportedProjectFile(file);
            nameInput.value = document.project.name ?? '';
            descriptionInput.value = document.project.description ?? '';
            setMode('import');
            refreshHeading();
            renderImportedProjectPreview(document, file);
        } catch (error) {
            resetImportState();
            errorTextElement.textContent = error.message || 'Failed to read imported project.';
        } finally {
            setBusyState(false, 'import');
        }
    });

    clearImportButton.addEventListener('click', () => {
        clearMessages();
        resetImportState();
        nameInput.focus();
    });

    if (cancelLink) {
        cancelLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.history.pushState({}, '', '/projects');
            routeHandler(navContentDiv, contentDiv);
        });
    }

    setMode('scratch');
    refreshHeading();
}

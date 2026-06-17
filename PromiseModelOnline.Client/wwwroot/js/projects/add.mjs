import { createProject, importProject } from './api.ts';
import { createPromise } from '../promises/api.ts';
import { navigate } from '../router.mjs';
import { renderSummaryTable } from './summary.mjs';

/**
 * Load the add-project form page with support for creating from scratch or importing.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
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

    /**
     * Clear all error and success message elements.
     */
    function clearMessages() {
        errorTextElement.textContent = '';
        errorTextElement.style.display = 'none';
        successTextElement.textContent = '';
        successTextElement.style.display = 'none';
    }

    /**
     * Get the text label for the submit button based on the current mode.
     * @returns {string} The submit button label.
     */
    function getSubmitButtonLabel() {
        return currentMode === 'import' ? 'Import Project' : 'Create Project';
    }

    /**
     * Get the text label for the submit button when the operation is in progress.
     * @returns {string} The busy submit button label.
     */
    function getBusySubmitButtonLabel() {
        return currentMode === 'import' ? 'Importing Project...' : 'Creating Project...';
    }

    /**
     * Set the submit button's busy/loading state.
     * @param {boolean} busy - Whether the button should show a loading state.
     */
    function setSubmitButtonState(busy) {
        createButton.disabled = busy;
        createButtonSpinner.classList.toggle('d-none', !busy);
        createButtonLabel.textContent = busy ? getBusySubmitButtonLabel() : getSubmitButtonLabel();
    }

    /**
     * Set the import button's busy/loading state.
     * @param {boolean} busy - Whether the button should show a loading state.
     * @param {string} [busyLabel='Reading Project...'] - The label to show while busy.
     */
    function setImportButtonState(busy, busyLabel = 'Reading Project...') {
        importButton.disabled = busy;
        importButtonSpinner.classList.toggle('d-none', !busy);
        importButtonIcon.classList.toggle('d-none', busy);
        importButtonLabel.textContent = busy ? busyLabel : 'Import Project...';
    }

    /**
     * Set the overall busy state for all form controls.
     * @param {boolean} busy - Whether the form is in a busy/loading state.
     * @param {string} [source='submit'] - The source of the busy state ('submit' or 'import').
     */
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

    /**
     * Switch between scratch creation mode and import mode.
     * @param {string} mode - The mode to switch to ('scratch' or 'import').
     */
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

    /**
     * Reset the import-related form state back to scratch mode.
     * Clears the file input, import summary, and project name/description fields.
     */
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
    /**
     * Update the H1 heading to reflect the current project name and mode.
     */
    function refreshHeading() {
        const val = nameInput.value.trim();
        const action = currentMode === 'import' ? 'Import' : 'Create';

        if (val) titleHeading.textContent = `${action} '${val}'`;
        else titleHeading.textContent = `${action} Project`;
    }
    nameInput.addEventListener('input', refreshHeading);

    /**
     * Summarize the counts of all entity types in a project export document.
     * @param {object} document - The parsed project export JSON.
     * @returns {{promises: number, epics: number, journeys: number, flows: number, moments: number, iterations: number, strides: number, promiseStackTotal: number}} The entity count summary.
     */
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

    /**
     * Render a preview summary table for an imported project file.
     * @param {object} document - The parsed project export JSON.
     * @param {File} file - The original import file.
     */
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

    /**
     * Read and parse a project export JSON file.
     * @param {File} file - The file to read.
     * @returns {Promise<object>} The parsed export document.
     * @throws {Error} If the file is not valid JSON or is not a project export.
     */
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

    /**
     * Handle form submission for creating a project from scratch.
     * Validates inputs, creates the project, adds the first promise, then navigates to the graph.
     */
    async function manageAddProjectSubmission() {
        clearMessages();

        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        const firstPromiseStatement = firstPromiseInput.value.trim();

        if (!name) {
            errorTextElement.textContent = 'Project name is required.';
            errorTextElement.style.display = 'block';
            return;
        }

        if (!firstPromiseStatement) {
            errorTextElement.textContent = 'The first Product Promise is required when creating from scratch.';
            errorTextElement.style.display = 'block';
            return;
        }

        try {
            setBusyState(true, 'submit');
            const createdProject = await createProject({ name, description: description || null });

            await createPromise(createdProject.ownerSlug, createdProject.slug, {
                statement: firstPromiseStatement,
                description: null,
                displayOrder: 0,
            });

            navigate(`/${createdProject.ownerSlug}/${createdProject.slug}/graph`, navContentDiv, contentDiv);
        } catch (error) {
            errorTextElement.textContent = error.message || 'Failed to create project.';
            errorTextElement.style.display = 'block';
        } finally {
            setBusyState(false, 'submit');
        }
    }

    /**
     * Handle form submission for importing a project from a JSON file.
     * Uploads the file and navigates to the imported project's graph on success.
     */
    async function manageImportSubmission() {
        clearMessages();

        const file = importInput.files?.[0];
        if (!file) {
            errorTextElement.textContent = 'Choose a project export to import.';
            errorTextElement.style.display = 'block';
            return;
        }

        try {
            setBusyState(true, 'submit');
            const result = await importProject(file);
            const { ownerSlug, slug } = result ?? {};
            const warnings = Array.isArray(result?.warnings) ? result.warnings : Array.isArray(result?.Warnings) ? result.Warnings : [];

            successTextElement.textContent = warnings.length > 0
                ? `Project imported with ${warnings.length} warning(s).`
                : 'Project imported successfully.';
            successTextElement.style.display = 'block';

            if (ownerSlug && slug) {
                navigate(`/${ownerSlug}/${slug}/graph`, navContentDiv, contentDiv);
            } else {
                navigate('/projects', navContentDiv, contentDiv);
            }
        } catch (error) {
            errorTextElement.textContent = error.message || 'Failed to import project.';
            errorTextElement.style.display = 'block';
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
            errorTextElement.style.display = 'block';
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
            navigate('/projects', navContentDiv, contentDiv);
        });
    }

    setMode('scratch');
    refreshHeading();
}

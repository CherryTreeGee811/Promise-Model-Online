import { createPromise } from '../promises/api.ts';
import { navigate } from '../router.ts';

import { createProject, importProject } from './api.ts';
import { renderSummaryTable } from './summary.ts';

/**
 * Load the add-project form, setting up create-from-scratch and import workflows.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export function loadAddProjectForm(navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const form = document.querySelector('#add-project-form') as HTMLFormElement | null;
    const cancelLink = document.querySelector('#cancel-add-project-link') as HTMLElement | null;
    const nameInput = document.querySelector('#project-name-input') as HTMLInputElement | null;
    const descriptionInput = document.querySelector('#project-description-input') as HTMLTextAreaElement | null;
    const firstPromisePanel = document.querySelector('#first-promise-panel') as HTMLElement | null;
    const firstPromiseInput = document.querySelector('#first-promise-input') as HTMLInputElement | null;
    const newButtonElement = document.querySelector('#create-project-btn') as HTMLButtonElement | null;
    const newButtonSpinnerElement = document.querySelector('#create-project-btn-spinner') as HTMLElement | null;
    const newButtonLabelElement = document.querySelector('#create-project-btn-label') as HTMLElement | null;
    const importButton = document.querySelector('#import-project-btn') as HTMLButtonElement | null;
    const importButtonSpinner = document.querySelector('#import-project-btn-spinner') as HTMLElement | null;
    const importButtonIcon = document.querySelector('#import-project-btn-icon') as HTMLElement | null;
    const importButtonLabel = document.querySelector('#import-project-btn-label') as HTMLElement | null;
    const clearImportButton = document.querySelector('#clear-import-btn') as HTMLButtonElement | null;
    const importInput = document.querySelector('#import-project-input') as HTMLInputElement | null;
    const importSummaryPanel = document.querySelector('#project-import-summary-panel') as HTMLElement | null;
    const errorTextElement = document.querySelector('#error-text') as HTMLElement | null;
    const successTextElement = document.querySelector('#success-text') as HTMLElement | null;

    if (!form || !nameInput || !descriptionInput || !firstPromisePanel || !firstPromiseInput || !newButtonElement || !newButtonSpinnerElement || !newButtonLabelElement || !importButton || !importButtonSpinner || !importButtonIcon || !importButtonLabel || !clearImportButton || !importInput || !importSummaryPanel || !errorTextElement || !successTextElement) {
        return;
    }

    let currentMode: 'scratch' | 'import' = 'scratch';
    let isBusy = false;

    /**
     * Clear error and success message elements.
     */
    function clearMessages(): void {
        errorTextElement!.textContent = '';
        errorTextElement!.style.display = 'none';
        successTextElement!.textContent = '';
        successTextElement!.style.display = 'none';
    }

    /**
     * Get the submit button text label based on current mode.
     * @returns {string} The label for the current mode.
     */
    function getSubmitButtonLabel(): string {
        return currentMode === 'import' ? 'Import Project' : 'Create Project';
    }

    /**
     * Get the busy-state submit button label based on current mode.
     * @returns {string} The busy label for the current mode.
     */
    function getBusySubmitButtonLabel(): string {
        return currentMode === 'import' ? 'Importing Project...' : 'Creating Project...';
    }

    /**
     * Update the submit button's disabled state and label.
     * @param {boolean} isBusy - Whether the button should be disabled.
     */
    function setSubmitButtonState(isBusy: boolean): void {
        newButtonElement!.disabled = isBusy;
        newButtonSpinnerElement!.classList.toggle('d-none', !isBusy);
        newButtonLabelElement!.textContent = (isBusy ? getBusySubmitButtonLabel : getSubmitButtonLabel)();
    }

    /**
     * Update the import button's disabled state and label.
     * @param {boolean} isBusy - Whether the button should be disabled.
     * @param {string} [busyLabel] - The label to show while busy.
     */
    function setImportButtonState(isBusy: boolean, busyLabel = 'Reading Project...'): void {
        importButton!.disabled = isBusy;
        importButtonSpinner!.classList.toggle('d-none', !isBusy);
        importButtonIcon!.classList.toggle('d-none', isBusy);
        importButtonLabel!.textContent = isBusy ? busyLabel : 'Import Project...';
    }

    /**
     * Set the global busy state, disabling/enabling all interactive elements.
     * @param {boolean} isBusyParameter - Whether the UI should be in busy state.
     * @param {'submit' | 'import'} [source] - Which action triggered the busy state.
     */
    function setBusyState(isBusyParameter: boolean, source: 'submit' | 'import' = 'submit'): void {
        isBusy = isBusyParameter;
        setSubmitButtonState(isBusyParameter && source === 'submit');
        setImportButtonState(isBusyParameter && source === 'import', source === 'submit' ? 'Importing Project...' : 'Reading Project...');
        newButtonElement!.disabled = isBusyParameter;
        clearImportButton!.disabled = isBusyParameter;
        importButton!.disabled = isBusyParameter;
        nameInput!.disabled = isBusyParameter;
        descriptionInput!.disabled = isBusyParameter;
        firstPromiseInput!.disabled = isBusyParameter;
        if (!isBusyParameter) {
            setMode(currentMode);
        }
    }

    /**
     * Switch between 'scratch' and 'import' mode UI states.
     * @param {'scratch' | 'import'} mode - The mode to switch to.
     */
    function setMode(mode: 'scratch' | 'import'): void {
        currentMode = mode;
        const isImportMode = mode === 'import';
        const hasImportFile = Boolean(importInput!.files?.[0]);
        firstPromisePanel!.hidden = isImportMode;
        nameInput!.readOnly = isImportMode;
        descriptionInput!.readOnly = isImportMode;
        newButtonLabelElement!.textContent = (isBusy ? getBusySubmitButtonLabel : getSubmitButtonLabel)();
        clearImportButton!.hidden = !isImportMode || !hasImportFile;
        clearImportButton!.style.display = clearImportButton!.hidden ? 'none' : '';
    }

    /**
     * Reset the import form and switch back to scratch mode.
     */
    function resetImportState(): void {
        importInput!.value = '';
        
        importSummaryPanel!.replaceChildren();
        nameInput!.value = '';
        descriptionInput!.value = '';
        importButtonLabel!.textContent = 'Import Project...';
        importButtonIcon!.classList.remove('d-none');
        importButtonSpinner!.classList.add('d-none');
        importButton!.disabled = false;
        setMode('scratch');
        refreshHeading();
    }

    const titleHeading = document.querySelector('h1') as HTMLElement | null;

    /**
     * Update the page heading with the current project name and action.
     */
    function refreshHeading(): void {
        const value = nameInput!.value.trim();
        const action = currentMode === 'import' ? 'Import' : 'Create';

        if (value && titleHeading) titleHeading.textContent = `${action} '${value}'`;
        else if (titleHeading) titleHeading.textContent = `${action} Project`;
    }
    nameInput!.addEventListener('input', refreshHeading);

    interface ProjectExportSummary {
        promises: number;
        epics: number;
        journeys: number;
        flows: number;
        moments: number;
        iterations: number;
        strides: number;
        promiseStackTotal: number;
    }

    interface ProjectExportDocument {
        schemaVersion?: string;
        exportedAt?: string;
        project: {
            name?: string;
            description?: string;
            productPromises?: unknown[];
            iterations?: unknown[];
        };
    }

    /**
     * Count all promise-stack entities in a project export document.
     * @param {ProjectExportDocument} document - The parsed export document.
     * @returns {ProjectExportSummary} The entity counts.
     */
    function summarizeProjectExport(document: ProjectExportDocument): ProjectExportSummary {
        const project = document.project;

        const promises = Array.isArray(project.productPromises) ? project.productPromises : [];
        const epics = promises.flatMap(promise => Array.isArray((promise as Record<string, unknown>).epics) ? (promise as Record<string, unknown>).epics as unknown[] : []);
        const journeys = epics.flatMap(epic => Array.isArray((epic as Record<string, unknown>).journeys) ? (epic as Record<string, unknown>).journeys as unknown[] : []);
        const flows = journeys.flatMap(journey => Array.isArray((journey as Record<string, unknown>).flows) ? (journey as Record<string, unknown>).flows as unknown[] : []);
        const moments = flows.flatMap(flow => Array.isArray((flow as Record<string, unknown>).moments) ? (flow as Record<string, unknown>).moments as unknown[] : []);
        const iterations = Array.isArray(project.iterations) ? project.iterations : [];
        const strides = iterations.flatMap(iteration => Array.isArray((iteration as Record<string, unknown>).strides) ? (iteration as Record<string, unknown>).strides as unknown[] : []);

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
     * Render a preview of the imported project into the summary panel.
     * @param {ProjectExportDocument} document - The parsed export document.
     * @param {File} file - The imported file.
     */
    function renderImportedProjectPreview(document: ProjectExportDocument, file: File): void {
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
     * @param {File} file - The JSON export file.
     * @returns {Promise<ProjectExportDocument>} The parsed document.
     * @throws {Error} If the file is not valid JSON or not a project export.
     */
    async function readImportedProjectFile(file: File): Promise<ProjectExportDocument> {
        let parsed: ProjectExportDocument;

        try {
            parsed = JSON.parse(await file.text()) as ProjectExportDocument;
        } catch {
            throw new Error('The selected file is not valid JSON.');
        }

        if (!parsed || typeof parsed !== 'object' || !parsed.project) {
            throw new Error('The selected file does not look like a project export.');
        }

        return parsed;
    }

    /**
     * Handle the create-from-scratch project form submission.
     * @returns {Promise<void>}
     */
    async function manageAddProjectSubmission(): Promise<void> {
        clearMessages();

        const name = nameInput!.value.trim();

        if (!name) {
            errorTextElement!.textContent = 'Project name is required.';
            errorTextElement!.style.display = 'block';
            return;
        }

        const description = descriptionInput!.value.trim();
        const firstPromiseStatement = firstPromiseInput!.value.trim();

        if (!firstPromiseStatement) {
            errorTextElement!.textContent = 'The first Product Promise is required when creating from scratch.';
            errorTextElement!.style.display = 'block';
            return;
        }

        try {
            setBusyState(true, 'submit');
            const createdProject = await createProject({ name, description: description || undefined });

            await createPromise(createdProject.ownerSlug, createdProject.slug, {
                statement: firstPromiseStatement,
                description: undefined,
                displayOrder: 0,
            });

            void navigate(`/${createdProject.ownerSlug}/${createdProject.slug}/graph`, navContentDiv, contentDiv);
        } catch (error) {
            errorTextElement!.textContent = (error as Error).message || 'Failed to create project.';
            errorTextElement!.style.display = 'block';
        } finally {
            setBusyState(false, 'submit');
        }
    }

    /**
     * Handle the import project form submission.
     * @returns {Promise<void>}
     */
    async function manageImportSubmission(): Promise<void> {
        clearMessages();

        const file = importInput!.files?.[0];
        if (!file) {
            errorTextElement!.textContent = 'Choose a project export to import.';
            errorTextElement!.style.display = 'block';
            return;
        }

        try {
            setBusyState(true, 'submit');
            const result = await importProject(file);
            const { ownerSlug, slug } = result ?? {};
            const warnings = Array.isArray(result?.warnings) ? result.warnings : (Array.isArray(result?.Warnings) ? result.Warnings : []);

            successTextElement!.textContent = warnings.length > 0
                ? `Project imported with ${warnings.length} warning(s).`
                : 'Project imported successfully.';
            successTextElement!.style.display = 'block';

            if (ownerSlug && slug) {
                void navigate(`/${ownerSlug}/${slug}/graph`, navContentDiv, contentDiv);
            } else {
                void navigate('/projects', navContentDiv, contentDiv);
            }
        } catch (error) {
            errorTextElement!.textContent = (error as Error).message || 'Failed to import project.';
            errorTextElement!.style.display = 'block';
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

    importButton!.addEventListener('click', () => {
        importInput!.click();
    });

    importInput!.addEventListener('change', async () => {
        clearMessages();

        const file = importInput!.files?.[0];
        if (!file) {
            resetImportState();
            return;
        }

        try {
            setBusyState(true, 'import');
            const document = await readImportedProjectFile(file);
            nameInput!.value = document.project.name ?? '';
            descriptionInput!.value = document.project.description ?? '';
            setMode('import');
            refreshHeading();
            renderImportedProjectPreview(document, file);
        } catch (error) {
            resetImportState();
            errorTextElement!.textContent = (error as Error).message || 'Failed to read imported project.';
            errorTextElement!.style.display = 'block';
        } finally {
            setBusyState(false, 'import');
        }
    });

    clearImportButton!.addEventListener('click', () => {
        clearMessages();
        resetImportState();
        nameInput!.focus();
    });

    if (cancelLink) {
        cancelLink.addEventListener('click', (event) => {
            event.preventDefault();
            void navigate('/projects', navContentDiv, contentDiv);
        });
    }

    setMode('scratch');
    refreshHeading();
}

// @ts-nocheck
import { createProject, importProject } from './api.ts';
import { createPromise } from '../promises/api.ts';
import { navigate } from '../router.ts';
import { renderSummaryTable } from './summary.ts';

export function loadAddProjectForm(navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const form = document.getElementById('add-project-form') as HTMLFormElement | null;
    const cancelLink = document.getElementById('cancel-add-project-link') as HTMLElement | null;
    const nameInput = document.getElementById('project-name-input') as HTMLInputElement | null;
    const descriptionInput = document.getElementById('project-description-input') as HTMLTextAreaElement | null;
    const firstPromisePanel = document.getElementById('first-promise-panel') as HTMLElement | null;
    const firstPromiseInput = document.getElementById('first-promise-input') as HTMLInputElement | null;
    const createButton = document.getElementById('create-project-btn') as HTMLButtonElement | null;
    const createButtonSpinner = document.getElementById('create-project-btn-spinner') as HTMLElement | null;
    const createButtonLabel = document.getElementById('create-project-btn-label') as HTMLElement | null;
    const importButton = document.getElementById('import-project-btn') as HTMLButtonElement | null;
    const importButtonSpinner = document.getElementById('import-project-btn-spinner') as HTMLElement | null;
    const importButtonIcon = document.getElementById('import-project-btn-icon') as HTMLElement | null;
    const importButtonLabel = document.getElementById('import-project-btn-label') as HTMLElement | null;
    const clearImportButton = document.getElementById('clear-import-btn') as HTMLButtonElement | null;
    const importInput = document.getElementById('import-project-input') as HTMLInputElement | null;
    const importSummaryPanel = document.getElementById('project-import-summary-panel') as HTMLElement | null;
    const errorTextElement = document.getElementById('error-text') as HTMLElement | null;
    const successTextElement = document.getElementById('success-text') as HTMLElement | null;

    if (!form || !nameInput || !descriptionInput || !firstPromisePanel || !firstPromiseInput || !createButton || !createButtonSpinner || !createButtonLabel || !importButton || !importButtonSpinner || !importButtonIcon || !importButtonLabel || !clearImportButton || !importInput || !importSummaryPanel || !errorTextElement || !successTextElement) {
        return;
    }

    let currentMode: 'scratch' | 'import' = 'scratch';
    let isBusy = false;

    function clearMessages(): void {
        errorTextElement.textContent = '';
        errorTextElement.style.display = 'none';
        successTextElement.textContent = '';
        successTextElement.style.display = 'none';
    }

    function getSubmitButtonLabel(): string {
        return currentMode === 'import' ? 'Import Project' : 'Create Project';
    }

    function getBusySubmitButtonLabel(): string {
        return currentMode === 'import' ? 'Importing Project...' : 'Creating Project...';
    }

    function setSubmitButtonState(busy: boolean): void {
        createButton.disabled = busy;
        createButtonSpinner.classList.toggle('d-none', !busy);
        createButtonLabel.textContent = busy ? getBusySubmitButtonLabel() : getSubmitButtonLabel();
    }

    function setImportButtonState(busy: boolean, busyLabel = 'Reading Project...'): void {
        importButton.disabled = busy;
        importButtonSpinner.classList.toggle('d-none', !busy);
        importButtonIcon.classList.toggle('d-none', busy);
        importButtonLabel.textContent = busy ? busyLabel : 'Import Project...';
    }

    function setBusyState(busy: boolean, source: 'submit' | 'import' = 'submit'): void {
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

    function setMode(mode: 'scratch' | 'import'): void {
        currentMode = mode;
        const isImportMode = mode === 'import';
        const hasImportFile = Boolean(importInput.files?.[0]);
        firstPromisePanel.hidden = isImportMode;
        nameInput.readOnly = isImportMode;
        descriptionInput.readOnly = isImportMode;
        createButtonLabel.textContent = isBusy ? getBusySubmitButtonLabel() : getSubmitButtonLabel();
        clearImportButton.hidden = !isImportMode || !hasImportFile;
        clearImportButton.style.display = clearImportButton.hidden ? 'none' : '';
    }

    function resetImportState(): void {
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

    const titleHeading = document.querySelector('h1') as HTMLElement | null;

    function refreshHeading(): void {
        const val = nameInput.value.trim();
        const action = currentMode === 'import' ? 'Import' : 'Create';

        if (val && titleHeading) titleHeading.textContent = `${action} '${val}'`;
        else if (titleHeading) titleHeading.textContent = `${action} Project`;
    }
    nameInput.addEventListener('input', refreshHeading);

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

    async function manageAddProjectSubmission(): Promise<void> {
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
            errorTextElement.textContent = (error as Error).message || 'Failed to create project.';
            errorTextElement.style.display = 'block';
        } finally {
            setBusyState(false, 'submit');
        }
    }

    async function manageImportSubmission(): Promise<void> {
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
            errorTextElement.textContent = (error as Error).message || 'Failed to import project.';
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
            errorTextElement.textContent = (error as Error).message || 'Failed to read imported project.';
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

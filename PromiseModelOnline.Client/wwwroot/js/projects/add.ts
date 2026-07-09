import { createPromise } from '../promises/api.ts';
import { navigate } from '../router.ts';

import { createProject, importProject } from './api.ts';
import { renderSummaryTable } from './summary.ts';

interface AddProjectElements {
    form: HTMLFormElement;
    cancelLink: HTMLElement | null;
    nameInput: HTMLInputElement;
    descriptionInput: HTMLTextAreaElement;
    firstPromisePanel: HTMLElement;
    firstPromiseInput: HTMLInputElement;
    newButtonElement: HTMLButtonElement;
    newButtonSpinnerElement: HTMLElement;
    newButtonLabelElement: HTMLElement;
    importButton: HTMLButtonElement;
    importButtonSpinner: HTMLElement;
    importButtonIcon: HTMLElement;
    importButtonLabel: HTMLElement;
    clearImportButton: HTMLButtonElement;
    importInput: HTMLInputElement;
    importSummaryPanel: HTMLElement;
    errorTextElement: HTMLElement;
    successTextElement: HTMLElement;
}

/**
 * @returns {AddProjectElements | undefined} The form elements or undefined if not found
 */
function getAddProjectElements(): AddProjectElements | undefined {
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
    if ([form, nameInput, descriptionInput, firstPromisePanel, firstPromiseInput, newButtonElement, newButtonSpinnerElement, newButtonLabelElement, importButton, importButtonSpinner, importButtonIcon, importButtonLabel, clearImportButton, importInput, importSummaryPanel, errorTextElement, successTextElement].some(element => !element)) return;
    return { form, cancelLink, nameInput, descriptionInput, firstPromisePanel, firstPromiseInput, newButtonElement, newButtonSpinnerElement, newButtonLabelElement, importButton, importButtonSpinner, importButtonIcon, importButtonLabel, clearImportButton, importInput, importSummaryPanel, errorTextElement, successTextElement };
}

/**
 * Load the add-project form, setting up create-from-scratch and import workflows.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 */
export function loadAddProjectForm(navContentDiv: HTMLElement, contentDiv: HTMLElement): void {
    const element = getAddProjectElements();
    if (!element) return;

    let currentMode: 'scratch' | 'import' = 'scratch';
    let isBusy = false;
    const titleHeading = document.querySelector('h1') as HTMLElement | null;

    /**
     *
     */
    function clearMessages(): void {
        element.errorTextElement.textContent = '';
        element.errorTextElement.classList.add('d-none');
        element.successTextElement.textContent = '';
        element.successTextElement.classList.add('d-none');
    }

    /**
     * @param {boolean} isBusyParameter - Whether the submit button should show a busy state
     */
    function setSubmitButtonState(isBusyParameter: boolean): void {
        element.newButtonElement.disabled = isBusyParameter;
        element.newButtonSpinnerElement.classList.toggle('d-none', !isBusyParameter);
        const busyLabel = currentMode === 'import' ? 'Importing Project...' : 'Creating Project...';
        const idleLabel = currentMode === 'import' ? 'Import Project' : 'Create Project';
        element.newButtonLabelElement.textContent = isBusyParameter ? busyLabel : idleLabel;
    }

    /**
     * @param {boolean} isBusyParameter - Whether the import button should show a busy state
     * @param {string} [busyLabel] - The label text to show while busy
     */
    function setImportButtonState(isBusyParameter: boolean, busyLabel = 'Reading Project...'): void {
        element.importButton.disabled = isBusyParameter;
        element.importButtonSpinner.classList.toggle('d-none', !isBusyParameter);
        element.importButtonIcon.classList.toggle('d-none', isBusyParameter);
        element.importButtonLabel.textContent = isBusyParameter ? busyLabel : 'Import Project...';
    }

    /**
     * @param {boolean} isBusyParameter - Whether the app should show a busy state
     * @param {"submit"|"import"} [source] - The source triggering the busy state
     */
    function setBusyState(isBusyParameter: boolean, source: 'submit' | 'import' = 'submit'): void {
        isBusy = isBusyParameter;
        setSubmitButtonState(isBusyParameter && source === 'submit');
        setImportButtonState(isBusyParameter && source === 'import', source === 'submit' ? 'Importing Project...' : 'Reading Project...');
        element.newButtonElement.disabled = isBusyParameter;
        element.clearImportButton.disabled = isBusyParameter;
        element.importButton.disabled = isBusyParameter;
        element.nameInput.disabled = isBusyParameter;
        element.descriptionInput.disabled = isBusyParameter;
        element.firstPromiseInput.disabled = isBusyParameter;
        if (!isBusyParameter) setMode(currentMode);
    }

    /**
     * @param {"scratch"|"import"} mode - The mode to switch to
     */
    function setMode(mode: 'scratch' | 'import'): void {
        currentMode = mode;
        const isImportMode = mode === 'import';
        const hasImportFile = Boolean(element.importInput.files?.[0]);
        element.firstPromisePanel.hidden = isImportMode;
        element.nameInput.readOnly = isImportMode;
        element.descriptionInput.readOnly = isImportMode;
        const busyLabel = currentMode === 'import' ? 'Importing Project...' : 'Creating Project...';
        const idleLabel = currentMode === 'import' ? 'Import Project' : 'Create Project';
        element.newButtonLabelElement.textContent = isBusy ? busyLabel : idleLabel;
        element.clearImportButton.hidden = !isImportMode || !hasImportFile;
        element.clearImportButton.classList.toggle('d-none', element.clearImportButton.hidden);
    }

    /**
     *
     */
    function resetImportState(): void {
        element.importInput.value = '';
        element.importSummaryPanel.replaceChildren();
        element.nameInput.value = '';
        element.descriptionInput.value = '';
        element.importButtonLabel.textContent = 'Import Project...';
        element.importButtonIcon.classList.remove('d-none');
        element.importButtonSpinner.classList.add('d-none');
        element.importButton.disabled = false;
        setMode('scratch');
        refreshHeading();
    }

    /**
     *
     */
    function refreshHeading(): void {
        const value = element.nameInput.value.trim();
        const action = currentMode === 'import' ? 'Import' : 'Create';
        if (value && titleHeading) titleHeading.textContent = `${action} '${value}'`;
        else if (titleHeading) titleHeading.textContent = `${action} Project`;
    }

    element.nameInput.addEventListener('input', refreshHeading);

    /**
     *
     */
    async function manageAddProjectSubmission(): Promise<void> {
        clearMessages();
        const name = element.nameInput.value.trim();
        if (!name) {
            element.errorTextElement.textContent = 'Project name is required.';
            element.errorTextElement.classList.remove('d-none');
            return;
        }
        const firstPromiseStatement = element.firstPromiseInput.value.trim();
        if (!firstPromiseStatement) {
            element.errorTextElement.textContent = 'The first Product Promise is required when creating from scratch.';
            element.errorTextElement.classList.remove('d-none');
            return;
        }
        try {
            setBusyState(true, 'submit');
            const createdProject = await createProject({ name, description: element.descriptionInput.value.trim() || undefined });
            await createPromise(createdProject.ownerSlug, createdProject.slug, { statement: firstPromiseStatement, description: undefined, displayOrder: 0 });
            void navigate(`/${createdProject.ownerSlug}/${createdProject.slug}/graph`, navContentDiv, contentDiv);
        } catch (error) {
            const errorMessage = (error as Error).message || 'Failed to create project.';
            const localErrorTextElement = element.errorTextElement;
            localErrorTextElement.textContent = errorMessage;
            localErrorTextElement.classList.remove('d-none');
        } finally {
            setBusyState(false, 'submit');
        }
    }

    /**
     *
     */
    async function manageImportSubmission(): Promise<void> {
        clearMessages();
        const file = element.importInput.files?.[0];
        if (!file) {
            element.errorTextElement.textContent = 'Choose a project export to import.';
            element.errorTextElement.classList.remove('d-none');
            return;
        }
        try {
            setBusyState(true, 'submit');
            const result = await importProject(file);
            const { ownerSlug, slug } = result ?? {};
            let warnings: unknown[];
            if (Array.isArray(result?.warnings)) {
                warnings = result.warnings;
            } else if (Array.isArray(result?.Warnings)) {
                warnings = result.Warnings;
            } else {
                warnings = [];
            }
            const successMessage = warnings.length > 0 ? `Project imported with ${warnings.length} warning(s).` : 'Project imported successfully.';
            const localSuccessTextElement = element.successTextElement;
            localSuccessTextElement.textContent = successMessage;
            localSuccessTextElement.classList.remove('d-none');
            void navigate(ownerSlug && slug ? `/${ownerSlug}/${slug}/graph` : '/projects', navContentDiv, contentDiv);
        } catch (error) {
            element.errorTextElement.textContent = (error as Error).message || 'Failed to import project.';
            element.errorTextElement.classList.remove('d-none');
        } finally {
            setBusyState(false, 'submit');
        }
    }

    element.form.addEventListener('submit', async event => {
        event.preventDefault();
        const submission = (currentMode === 'import' ? manageImportSubmission : manageAddProjectSubmission)();
        await submission;
    });

    element.importButton.addEventListener('click', () => element.importInput.click());
    element.importInput.addEventListener('change', async () => {
        clearMessages();
        const file = element.importInput.files?.[0];
        if (!file) { resetImportState(); return; }
        try {
            setBusyState(true, 'import');
            let parsed: { project: { name?: string; description?: string; productPromises?: unknown[]; iterations?: unknown[] } };
            try { parsed = JSON.parse(await file.text()); } catch { throw new Error('The selected file is not valid JSON.'); }
            if (!parsed || typeof parsed !== 'object' || !parsed.project) throw new Error('The selected file does not look like a project export.');
            const document_ = parsed;
            const localName = document_.project.name ?? '';
            const localDescription = document_.project.description ?? '';
            const localNameInputElement = element.nameInput;
            const localDescInputElement = element.descriptionInput;
            localNameInputElement.value = localName;
            localDescInputElement.value = localDescription;
            setMode('import');
            refreshHeading();
            renderImportPreview(document_, element.importSummaryPanel);
        } catch (error) {
            resetImportState();
            const errorMessage = (error as Error).message || 'Failed to read imported project.';
            const localErrorTextElement = element.errorTextElement;
            localErrorTextElement.textContent = errorMessage;
            localErrorTextElement.classList.remove('d-none');
        } finally {
            setBusyState(false, 'import');
        }
    });

    element.clearImportButton.addEventListener('click', () => { clearMessages(); resetImportState(); element.nameInput.focus(); });
    if (element.cancelLink) {
        element.cancelLink.addEventListener('click', event => { event.preventDefault(); void navigate('/projects', navContentDiv, contentDiv); });
    }

    setMode('scratch');
    refreshHeading();
}

/**
 * @param {object} document_ - The parsed import document
 * @param {object} document_.project - The project data from the imported document
 * @param {string} [document_.project.name] - The project name
 * @param {string} [document_.project.description] - The project description
 * @param {Array} [document_.project.productPromises] - The product promises array
 * @param {Array} [document_.project.iterations] - The iterations array
 * @param {HTMLElement} panel - The panel element to render the summary table into
 */
function renderImportPreview(document_: { project: { name?: string; description?: string; productPromises?: unknown[]; iterations?: unknown[] } }, panel: HTMLElement): void {
    const project = document_.project;
    const promises = Array.isArray(project.productPromises) ? project.productPromises : [];
    const epics = promises.flatMap(p => Array.isArray((p as Record<string, unknown>).epics) ? (p as Record<string, unknown>).epics as unknown[] : []);
    const journeys = epics.flatMap(epic => Array.isArray((epic as Record<string, unknown>).journeys) ? (epic as Record<string, unknown>).journeys as unknown[] : []);
    const flows = journeys.flatMap(index => Array.isArray((index as Record<string, unknown>).flows) ? (index as Record<string, unknown>).flows as unknown[] : []);
    const moments = flows.flatMap(f => Array.isArray((f as Record<string, unknown>).moments) ? (f as Record<string, unknown>).moments as unknown[] : []);
    const iterations = Array.isArray(project.iterations) ? project.iterations : [];
    const strides = iterations.flatMap(index => Array.isArray((index as Record<string, unknown>).strides) ? (index as Record<string, unknown>).strides as unknown[] : []);
    const total = promises.length + epics.length + journeys.length + flows.length + moments.length;
    renderSummaryTable(panel, [
        { label: 'Schema Version', value: document_.schemaVersion ?? 'Unknown' },
        { label: 'Exported At', value: document_.exportedAt ? new Date(document_.exportedAt).toLocaleString() : 'Unknown' },
        { label: 'Project Name', value: project.name ?? '' },
        { label: 'Project Description', value: project.description ?? '' },
        { label: 'Promises', value: promises.length },
        { label: 'Epics', value: epics.length },
        { label: 'Journeys', value: journeys.length },
        { label: 'Flows', value: flows.length },
        { label: 'Moments', value: moments.length },
        { label: 'Promise Stack Total', value: total },
        { isGap: true },
        { label: 'Iterations', value: iterations.length },
        { label: 'Strides', value: strides.length },
    ]);
}

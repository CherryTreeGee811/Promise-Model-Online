import { createCommentAutocomplete } from '../comments/autocomplete.ts';
import { navigate } from '../router.ts';
import { getProjectMembers } from '../strides/api.ts';
import { formatCommentText } from '../utils/entity-reference.ts';
import { escapeHtml } from '../utils/html.ts';
import { setupInlineEdit } from '../utils/inline-edit.ts';

import { exportProject, getProject, getGraphData, deleteProject, updateProjectDetails } from './api.ts';
import { formatTimestamp } from './audit.ts';
import { renderSummaryTable } from './summary.ts';



/**
 * Load the project settings page with inline editing, summary, export, and delete controls.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {{ permission?: string; isOwner?: boolean } } _permission - The current user's permission object, used for gating edit/delete actions.
 */
interface SettingsElements {
    form: HTMLFormElement;
    titleInput: HTMLInputElement;
    descriptionInput: HTMLTextAreaElement;
    summaryPanel: HTMLElement;
    summaryLoading: HTMLElement;
    errorText: HTMLElement;
    successText: HTMLElement;
    exportButton: HTMLButtonElement;
    saveButton: HTMLButtonElement | null;
    titleView: HTMLElement | null;
    titleEditButton: HTMLButtonElement | null;
    descView: HTMLElement | null;
    descEditButton: HTMLButtonElement | null;
    dangerButtonElement: HTMLButtonElement;
    dangerButtonSpinnerElement: HTMLElement;
    dangerButtonLabelElement: HTMLElement;
    phraseInputElement: HTMLInputElement;
    phrasePromptElement: HTMLElement;
}

/**
 * @returns {SettingsElements | undefined} The settings page elements or undefined if not found
 */
function getSettingsElements(): SettingsElements | undefined {
    const form = document.querySelector('#project-settings-form') as HTMLFormElement | null;
    const titleInput = document.querySelector('#project-title-input') as HTMLInputElement | null;
    const descriptionInput = document.querySelector('#project-description-input') as HTMLTextAreaElement | null;
    const summaryPanel = document.querySelector('#project-summary-panel') as HTMLElement | null;
    const summaryLoading = document.querySelector('#project-summary-loading') as HTMLElement | null;
    const errorText = document.querySelector('#error-text') as HTMLElement | null;
    const successText = document.querySelector('#success-text') as HTMLElement | null;
    const exportButton = document.querySelector('#export-project-btn') as HTMLButtonElement | null;
    const saveButton = document.querySelector('#save-project-settings-btn') as HTMLButtonElement | null;
    const titleView = document.querySelector('#project-title-view') as HTMLElement | null;
    const titleEditButton = document.querySelector('#edit-project-title-btn') as HTMLButtonElement | null;
    const descView = document.querySelector('#project-description-view') as HTMLElement | null;
    const descEditButton = document.querySelector('#edit-project-desc-btn') as HTMLButtonElement | null;
    const dangerButtonElement = document.querySelector('#delete-project-btn') as HTMLButtonElement | null;
    const dangerButtonSpinnerElement = document.querySelector('#delete-project-btn-spinner') as HTMLElement | null;
    const dangerButtonLabelElement = document.querySelector('#delete-project-btn-label') as HTMLElement | null;
    const phraseInputElement = document.querySelector('#project-delete-confirmation-input') as HTMLInputElement | null;
    const phrasePromptElement = document.querySelector('#project-delete-confirmation-text') as HTMLElement | null;
    if (!form || !titleInput || !descriptionInput || !summaryPanel || !summaryLoading || !errorText || !successText || !exportButton || !dangerButtonElement || !dangerButtonSpinnerElement || !dangerButtonLabelElement || !phraseInputElement || !phrasePromptElement) return;
    return { form, titleInput, descriptionInput, summaryPanel, summaryLoading, errorText, successText, exportButton, saveButton, titleView, titleEditButton, descView, descEditButton, dangerButtonElement, dangerButtonSpinnerElement, dangerButtonLabelElement, phraseInputElement, phrasePromptElement };
}

/**
 * @param {Event} event - The form submit event
 * @param {SettingsElements} elements - The settings page DOM elements
 * @param {string} owner - The project owner slug
 * @param {string} project - The project slug
 * @param {object} options - Additional options
 * @param {Record<string, unknown>|undefined} options.currentProject - The current project data
 * @param {SummaryState} options.summaryState - The summary state object
 * @param {ReturnType<typeof setupInlineEdit>} [options.titleEditor] - The title inline editor
 * @param {ReturnType<typeof setupInlineEdit>} [options.descEditor] - The description inline editor
 */
async function handleSettingsSubmit(
    event: Event,
    elements: SettingsElements,
    owner: string,
    project: string,
    options: { currentProject: Record<string, unknown> | undefined; summaryState: SummaryState; titleEditor?: ReturnType<typeof setupInlineEdit>; descEditor?: ReturnType<typeof setupInlineEdit> },
): Promise<void> {
    event.preventDefault();
    elements.errorText.textContent = '';
    elements.successText.textContent = '';
    const name = elements.titleInput.value.trim();
    if (!name) {
        elements.errorText.textContent = 'Project title is required.';
        return;
    }
    try {
        const updated = await updateProjectDetails(owner, project, { name, description: elements.descriptionInput.value.trim() || undefined });
        options.currentProject = updated;
        const updatedTitle = (updated.name as string) ?? '';
        const updatedDesc = (updated.description as string) ?? '';
        const localTitleInputElement = elements.titleInput;
        const localDescInputElement = elements.descriptionInput;
        localTitleInputElement.value = updatedTitle;
        localDescInputElement.value = updatedDesc;
        if (options.titleEditor) options.titleEditor.showView(escapeHtml((updated.name as string) ?? ''));
        if (options.descEditor) options.descEditor.showSavedPopover(formatCommentText((updated.description as string) ?? ''));
        refreshDeleteGateOnSettings((updated.name as string) ?? '', elements);
        renderSettingsSummary(updated, options.summaryState, elements);
        elements.successText.textContent = 'Project settings saved.';
    } catch (error) {
        elements.errorText.textContent = (error as Error).message || 'Failed to save project settings.';
    }
}

/**
 * @param {SettingsElements} elements - The settings page DOM elements
 * @param {string} owner - The project owner slug
 * @param {string} project - The project slug
 */
async function handleExportClick(elements: SettingsElements, owner: string, project: string): Promise<void> {
    elements.errorText.textContent = '';
    elements.successText.textContent = '';
    elements.exportButton.disabled = true;
    try {
        const blob = await exportProject(owner, project);
        downloadBlob(blob, `project-${owner}-${project}-export.json`);
        showExportPopover(elements);
    } catch (error) {
        elements.errorText.textContent = (error as Error).message || 'Failed to export project.';
    } finally {
        elements.exportButton.disabled = false;
    }
}

/**
 * @param {SettingsElements} elements - The settings page DOM elements
 * @param {string} owner - The project owner slug
 * @param {string} project - The project slug
 * @param {HTMLElement} navContentDiv - The navigation content container
 * @param {HTMLElement} contentDiv - The main content container
 * @param {Record<string, unknown>|undefined} currentProject - The current project data
 */
async function handleDeleteClick(
    elements: SettingsElements,
    owner: string,
    project: string,
    navContentDiv: HTMLElement,
    contentDiv: HTMLElement,
    currentProject: Record<string, unknown> | undefined,
): Promise<void> {
    const { errorText, successText, dangerButtonElement, dangerButtonSpinnerElement, dangerButtonLabelElement, phraseInputElement } = elements;
    errorText.textContent = '';
    successText.textContent = '';
    if (!currentProject) {
        errorText.textContent = 'Project is not loaded yet.';
        return;
    }
    if (phraseInputElement.value !== dangerButtonElement.dataset.confirmationPhrase) {
        errorText.textContent = 'Type the exact confirmation phrase to delete the project.';
        return;
    }
    dangerButtonElement.disabled = true;
    dangerButtonSpinnerElement.classList.toggle('d-none', false);
    dangerButtonLabelElement.textContent = 'Deleting Project...';
    try {
        await deleteProject(owner, project);
        void navigate('/projects', navContentDiv, contentDiv);
    } catch (error) {
        const caughtErrorMessage = (error as Error).message || 'Failed to delete project.';
        errorText.textContent = caughtErrorMessage;
    } finally {
        dangerButtonElement.disabled = false;
        dangerButtonSpinnerElement.classList.toggle('d-none', true);
        dangerButtonLabelElement.textContent = 'Delete Project';
    }
}

/**
 * @param {SettingsElements} elements - The settings page DOM elements
 */
function showExportPopover(elements: SettingsElements): void {
    if (!bootstrap.Popover) {
        elements.successText.textContent = 'Exported!';
        setTimeout(() => {
            if (elements.successText.textContent === 'Exported!') {
                elements.successText.textContent = '';
            }
        }, 2000);
        return;
    }
    const popover = new (bootstrap.Popover as unknown as new (element: HTMLElement, options: Record<string, unknown>) => { show: () => void; hide: () => void })(elements.exportButton, {
        trigger: 'manual', placement: 'top', content: 'Exported!',
    });
    popover.show();
    setTimeout(() => popover.hide(), 2000);
}

/**
 * @param {string} projectName - The project name
 * @param {SettingsElements} elements - The settings page DOM elements
 */
function refreshDeleteGateOnSettings(projectName: string, elements: SettingsElements): void {
    const phrase = getDeletePhrase(projectName);
    elements.phrasePromptElement.textContent = phrase;
    elements.phraseInputElement.value = '';
    elements.dangerButtonElement.disabled = true;
    elements.dangerButtonElement.dataset.confirmationPhrase = phrase;
}

/**
 * @param {Record<string, unknown>} updated - The updated project data
 * @param {SettingsElements} elements - The settings page DOM elements
 * @param {object} options - Additional options
 * @param {SummaryState} options.summaryState - The summary state object
 * @param {ReturnType<typeof setupInlineEdit>} [options.titleEditor] - The title inline editor
 * @param {ReturnType<typeof setupInlineEdit>} [options.descEditor] - The description inline editor
 */


interface SummaryState {
    counts: { promises: number; epics: number; journeys: number; flows: number; moments: number; totalPromises: number };
    memberCount: number;
    firstPromise: Record<string, unknown> | undefined;
}

/**
 * @param {Record<string, unknown>} project - The project data
 * @param {SummaryState} summaryState - The summary state with counts
 * @param {SettingsElements} elements - The settings page DOM elements
 */
function renderSettingsSummary(project: Record<string, unknown>, summaryState: SummaryState, elements: SettingsElements): void {
    renderSummaryTable(elements.summaryPanel, [
        { label: 'Created', value: formatDate(project.createdAt as string) },
        { label: 'Team Members', value: summaryState.memberCount },
        { label: 'Promises', value: summaryState.counts.promises },
        { label: 'Epics', value: summaryState.counts.epics },
        { label: 'Journeys', value: summaryState.counts.journeys },
        { label: 'Flows', value: summaryState.counts.flows },
        { label: 'Moments', value: summaryState.counts.moments },
        { label: 'Total Promises', value: summaryState.counts.totalPromises },
    ]);
}

/**
 * @param {string} owner - The project owner slug
 * @param {string} project - The project slug
 * @param {SettingsElements} elements - The settings page DOM elements
 * @returns {Promise<SummaryState>} The summary state with counts and member info
 */
async function loadProjectSummary(owner: string, project: string, elements: SettingsElements): Promise<SummaryState> {
    elements.summaryLoading.hidden = false;
    elements.summaryPanel.hidden = true;
    try {
        const graphData = await getGraphData(owner, project);
        let members: Record<string, unknown>[] = [];
        try { members = await getProjectMembers(owner, project) as Record<string, unknown>[]; } catch { members = []; }
        const epics = (graphData.promises ?? []).flatMap((p: Record<string, unknown>) => (p.epics ?? []) as unknown[]);
        const journeys = epics.flatMap((epic: Record<string, unknown>) => (epic.journeys ?? []) as unknown[]);
        const flows = journeys.flatMap((index: Record<string, unknown>) => (index.flows ?? []) as unknown[]);
        const moments = flows.flatMap((f: Record<string, unknown>) => (f.moments ?? []) as unknown[]);
        return {
            counts: {
                promises: (graphData.promises ?? []).length,
                epics: epics.length,
                journeys: journeys.length,
                flows: flows.length,
                moments: moments.length,
                totalPromises: (graphData.promises ?? []).length + epics.length + journeys.length + flows.length + moments.length,
            },
            memberCount: members.length,
            firstPromise: (graphData.promises ?? [])[0] ?? undefined,
        };
    } catch (error) {
        console.warn('Failed to load project summary:', error);
        return { counts: { promises: 0, epics: 0, journeys: 0, flows: 0, moments: 0, totalPromises: 0 }, memberCount: 0, firstPromise: undefined };
    } finally {
        elements.summaryLoading.hidden = true;
        elements.summaryPanel.hidden = false;
    }
}

/**
 * @param {HTMLElement} navContentDiv - The navigation content container
 * @param {HTMLElement} contentDiv - The main content container
 * @param {string} owner - The project owner slug
 * @param {string} project - The project slug
 * @param {{ permission?: string; isOwner?: boolean } | null} _permission - The current user's permission object
 */
export function loadProjectSettingsPage(navContentDiv: HTMLElement, contentDiv: HTMLElement, owner: string, project: string, _permission: { permission?: string; isOwner?: boolean } | null): void {
    const elements = getSettingsElements();
    if (!elements) return;

    let currentProject: Record<string, unknown> | undefined;
    let summaryState: SummaryState = { counts: { promises: 0, epics: 0, journeys: 0, flows: 0, moments: 0, totalPromises: 0 }, memberCount: 0, firstPromise: undefined };

    const titleEditor = elements.titleInput && elements.titleView && elements.titleEditButton
        ? setupInlineEdit(elements.titleInput, elements.titleView, elements.titleEditButton)
        : undefined;
    const descEditor = elements.descriptionInput && elements.descView && elements.descEditButton && elements.saveButton
        ? setupInlineEdit(elements.descriptionInput, elements.descView, elements.descEditButton, elements.saveButton)
        : undefined;

    const options = { currentProject, summaryState, titleEditor, descEditor };

    elements.form.addEventListener('submit', event => { options.currentProject = currentProject; void handleSettingsSubmit(event, elements, owner, project, options); });
    elements.phraseInputElement.addEventListener('input', () => {
        const expected = elements.dangerButtonElement.dataset.confirmationPhrase || '';
        elements.dangerButtonElement.disabled = elements.phraseInputElement.value !== expected;
    });
    elements.exportButton.addEventListener('click', () => handleExportClick(elements, owner, project));
    elements.dangerButtonElement.addEventListener('click', () => handleDeleteClick(elements, owner, project, navContentDiv, contentDiv, currentProject));

    void (async () => {
        try {
            const projectData = await getProject(owner, project);
            if (!projectData) {
                elements.errorText.textContent = 'Failed to load project settings.';
                return;
            }
            currentProject = projectData;
            options.currentProject = projectData;
            elements.titleInput.value = projectData.name ?? '';
            elements.descriptionInput.value = projectData.description ?? '';
            if (titleEditor) titleEditor.showView(escapeHtml(projectData.name ?? ''));
            if (descEditor) descEditor.showView(formatCommentText(projectData.description ?? ''));
            refreshDeleteGateOnSettings(projectData.name ?? '', elements);
            summaryState = await loadProjectSummary(owner, project, elements);
            options.summaryState = summaryState;
            renderSettingsSummary(projectData, summaryState, elements);
            if (summaryState.firstPromise) {
                createCommentAutocomplete(elements.descriptionInput, 'Promise', (summaryState.firstPromise as Record<string, unknown>).id as string);
            }
        } catch (error) {
            elements.errorText.textContent = 'Failed to load project settings.';
            console.error(error);
        }
    })();
}

/**
 * Get the confirmation phrase required to delete a project.
 * @param {string} projectName - The project name.
 * @returns {string} The confirmation phrase.
 */
function getDeletePhrase(projectName: string): string {
    return `delete ${projectName}`;
}

/**
 * Trigger a browser download of a blob with the given filename.
 * @param {Blob} blob - The blob data to download.
 * @param {string} filename - The filename for the download.
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format a date string for display using the audit timestamp formatter.
 * @param {string} value - The date string to format.
 * @returns {string} The formatted date string.
 */
function formatDate(value: string): string {
    return formatTimestamp(value);
}

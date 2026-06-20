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
 * @param {{ permission?: string; isOwner?: boolean } } permission - The current user's permission object, used for gating edit/delete actions.
 */
export function loadProjectSettingsPage(navContentDiv: HTMLElement, contentDiv: HTMLElement, owner: string, project: string, _permission: { permission?: string; isOwner?: boolean } | null): void {
    const form = document.querySelector('#project-settings-form') as HTMLFormElement | null;
    const titleInput = document.querySelector('#project-title-input') as HTMLInputElement | null;
    const descriptionInput = document.querySelector('#project-description-input') as HTMLTextAreaElement | null;
    const summaryPanel = document.querySelector('#project-summary-panel') as HTMLElement | null;
    const summaryLoading = document.querySelector('#project-summary-loading') as HTMLElement | null;
    const errorText = document.querySelector('#error-text') as HTMLElement | null;
    const successText = document.querySelector('#success-text') as HTMLElement | null;
    const exportButton = document.querySelector('#export-project-btn') as HTMLButtonElement | null;
    const dangerButtonElement = document.querySelector('#delete-project-btn') as HTMLButtonElement | null;
    const dangerButtonSpinnerElement = document.querySelector('#delete-project-btn-spinner') as HTMLElement | null;
    const dangerButtonLabelElement = document.querySelector('#delete-project-btn-label') as HTMLElement | null;
    const phraseInputElement = document.querySelector('#project-delete-confirmation-input') as HTMLInputElement | null;
    const phrasePromptElement = document.querySelector('#project-delete-confirmation-text') as HTMLElement | null;

    if (!form || !titleInput || !descriptionInput || !summaryPanel || !summaryLoading || !errorText || !successText || !exportButton || !dangerButtonElement || !phraseInputElement || !phrasePromptElement) {
        return;
    }

    const saveButton = document.querySelector('#save-project-settings-btn') as HTMLButtonElement | null;

    const titleView = document.querySelector('#project-title-view') as HTMLElement | null;
    const titleEditButton = document.querySelector('#edit-project-title-btn') as HTMLButtonElement | null;
    const descView = document.querySelector('#project-description-view') as HTMLElement | null;
    const descEditButton = document.querySelector('#edit-project-desc-btn') as HTMLButtonElement | null;
    let titleEditor: ReturnType<typeof setupInlineEdit> | undefined;
    let descEditor: ReturnType<typeof setupInlineEdit> | undefined;

    if (titleInput && titleView && titleEditButton) {
        titleEditor = setupInlineEdit(titleInput, titleView, titleEditButton);
    }
    if (descriptionInput && descView && descEditButton && saveButton) {
        descEditor = setupInlineEdit(descriptionInput, descView, descEditButton, saveButton);
    }

    let currentProject: Record<string, unknown> | undefined;
    let summaryState: {
        counts: { promises: number; epics: number; journeys: number; flows: number; moments: number; totalPromises: number };
        memberCount: number;
        firstPromise: Record<string, unknown> | undefined;
    } = {
        counts: { promises: 0, epics: 0, journeys: 0, flows: 0, moments: 0, totalPromises: 0 },
        memberCount: 0,
        firstPromise: undefined,
    };
    let exportPopoverHideTimer: ReturnType<typeof setTimeout> | undefined;
    let exportPopover: { show: () => void; hide: () => void } | undefined;

    /**
     *
     */
    function clearMessages(): void {
        errorText!.textContent = '';
        successText!.textContent = '';
    }

    /**
     * @param {boolean} isLoading - Whether loading
     */
    function setSummaryLoading(isLoading: boolean): void {
        summaryLoading!.hidden = !isLoading;
        summaryPanel!.hidden = isLoading;
    }

    /**
     *
     */
    function showExportPopover(): void {
        if (!bootstrap.Popover) {
            successText!.textContent = 'Exported!';
            setTimeout(() => {
                if (successText!.textContent === 'Exported!') {
                    successText!.textContent = '';
                }
            }, 2000);
            return;
        }

        if (!exportPopover) {
            exportPopover = new (bootstrap.Popover as unknown as new (element: HTMLElement, options: Record<string, unknown>) => { show: () => void; hide: () => void })(exportButton!, {
                trigger: 'manual',
                placement: 'top',
                content: 'Exported!',
            });
        }

        exportPopover!.show();

        if (exportPopoverHideTimer) {
            clearTimeout(exportPopoverHideTimer);
        }

        exportPopoverHideTimer = setTimeout(() => {
            exportPopover?.hide();
        }, 2000);
    }

/**
 * Refresh the delete confirmation UI with the current project name.
 * @param {string} projectName - The project name.
 */
function refreshDeleteGate(projectName: string): void {
        const phrase = getDeletePhrase(projectName);
        phrasePromptElement!.textContent = phrase;
        phraseInputElement!.value = '';
        (dangerButtonElement as HTMLButtonElement).disabled = true;
        dangerButtonElement!.dataset.confirmationPhrase = phrase;
    }

/**
 * Set the delete button loading/disabled state.
 * @param {boolean} isBusy - Whether the delete operation is in progress.
 */
function setDeleteButtonState(isBusy: boolean): void {
        (dangerButtonElement as HTMLButtonElement).disabled = isBusy;
        dangerButtonSpinnerElement!.classList.toggle('d-none', !isBusy);
        dangerButtonLabelElement!.textContent = isBusy ? 'Deleting Project...' : 'Delete Project';
    }

    /**
     *
     */
    function updateDeleteButtonState(): void {
        const expected = dangerButtonElement!.dataset.confirmationPhrase || '';
        (dangerButtonElement as HTMLButtonElement).disabled = phraseInputElement!.value !== expected;
    }

/**
 * Render the project summary table.
 * @param {Record<string, unknown>} project - The project object.
 * @param {{ promises: number; epics: number; journeys: number; flows: number; moments: number; totalPromises: number }} counts - The entity counts.
 * @param {number} counts.promises - The number of promises.
 * @param {number} counts.epics - The number of epics.
 * @param {number} counts.journeys - The number of journeys.
 * @param {number} counts.flows - The number of flows.
 * @param {number} counts.moments - The number of moments.
 * @param {number} counts.totalPromises - The total count across all entity types.
 * @param {number} memberCount - The number of team members.
 */
function renderSummary(project: Record<string, unknown>, counts: { promises: number; epics: number; journeys: number; flows: number; moments: number; totalPromises: number }, memberCount: number): void {
        renderSummaryTable(summaryPanel!, [
            { label: 'Created', value: formatDate(project.createdAt as string) },
            { label: 'Team Members', value: memberCount },
            { label: 'Promises', value: counts.promises },
            { label: 'Epics', value: counts.epics },
            { label: 'Journeys', value: counts.journeys },
            { label: 'Flows', value: counts.flows },
            { label: 'Moments', value: counts.moments },
            { label: 'Total Promises', value: counts.totalPromises },
        ]);
    }

/**
 * Load and render the project summary data.
 * @param {Record<string, unknown>} projectObject - The project object.
 */
async function loadSummary(projectObject: Record<string, unknown>): Promise<void> {
        setSummaryLoading(true);

        try {
    const graphData = await getGraphData(owner, project);
    let members: Record<string, unknown>[] = [];
    try { members = await getProjectMembers(owner, project) as Record<string, unknown>[]; } catch { members = []; }

    const epics = (graphData.promises ?? []).flatMap((p: Record<string, unknown>) => (p.epics ?? []) as unknown[]);
            const journeys = epics.flatMap((epic: Record<string, unknown>) => (epic.journeys ?? []) as unknown[]);
            const flows = journeys.flatMap((index: Record<string, unknown>) => (index.flows ?? []) as unknown[]);
            const moments = flows.flatMap((f: Record<string, unknown>) => (f.moments ?? []) as unknown[]);

            summaryState = {
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

            renderSummary(projectObject, summaryState.counts, summaryState.memberCount);
        } catch (error) {
            summaryState = {
                counts: { promises: 0, epics: 0, journeys: 0, flows: 0, moments: 0, totalPromises: 0 },
                memberCount: 0,
                firstPromise: undefined,
            };

            renderSummary(projectObject, summaryState.counts, summaryState.memberCount);
            console.warn('Failed to load project summary:', error);
        } finally {
            setSummaryLoading(false);
        }
    }

    /**
     *
     */
    async function loadProject(): Promise<void> {
        try {
            const projectData = await getProject(owner, project);
            currentProject = projectData;
            titleInput!.value = projectData.name ?? '';
            descriptionInput!.value = projectData.description ?? '';
            if (titleEditor) titleEditor.showView(escapeHtml(projectData.name ?? ''));
            if (descEditor) descEditor.showView(formatCommentText(projectData.description ?? ''));
            refreshDeleteGate(projectData.name ?? '');
            await loadSummary(projectData);

            if (summaryState.firstPromise) {
                createCommentAutocomplete(descriptionInput!, 'Promise', (summaryState.firstPromise as Record<string, unknown>).id as string);
            }
        } catch (error) {
            errorText!.textContent = 'Failed to load project settings.';
            console.error(error);
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessages();

        const name = titleInput.value.trim();

        if (!name) {
            errorText.textContent = 'Project title is required.';
            return;
        }

        const description = descriptionInput.value.trim();

        try {
            const updatedProject = await updateProjectDetails(owner, project, {
                name,
                description: description || undefined,
            });

            currentProject = updatedProject;
            applyProjectResponse(updatedProject);

            function applyProjectResponse(updated: Record<string, unknown>): void {
                titleInput!.value = (updated.name as string) ?? '';
                descriptionInput!.value = (updated.description as string) ?? '';
                if (titleEditor) titleEditor.showView(escapeHtml((updated.name as string) ?? ''));
                if (descEditor) descEditor.showSavedPopover(formatCommentText((updated.description as string) ?? ''));
                refreshDeleteGate((updated.name as string) ?? '');
                renderSummary(updated, summaryState.counts, summaryState.memberCount);
                successText!.textContent = 'Project settings saved.';
            }
        } catch (error) {
            errorText.textContent = (error as Error).message || 'Failed to save project settings.';
        }
    });

    phraseInputElement.addEventListener('input', updateDeleteButtonState);

    exportButton.addEventListener('click', async () => {
        clearMessages();

        try {
            const blob = await exportProject(owner, project);
            downloadBlob(blob, `project-${owner}-${project}-export.json`);
            showExportPopover();
        } catch (error) {
            errorText.textContent = (error as Error).message || 'Failed to export project.';
        }
    });

    dangerButtonElement.addEventListener('click', async () => {
        clearMessages();

        if (!currentProject) {
            errorText.textContent = 'Project is not loaded yet.';
            return;
        }

        if (phraseInputElement.value !== dangerButtonElement.dataset.confirmationPhrase) {
            errorText.textContent = 'Type the exact confirmation phrase to delete the project.';
            return;
        }

        setDeleteButtonState(true);

        try {
            await deleteProject(owner, project);
            void navigate('/projects', navContentDiv, contentDiv);
        } catch (error) {
            errorText.textContent = (error as Error).message || 'Failed to delete project.';
        } finally {
            setDeleteButtonState(false);
        }
    });

    void loadProject();
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

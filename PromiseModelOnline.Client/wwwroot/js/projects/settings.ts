// @ts-nocheck
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
 * @param navContentDiv - The navigation content container.
 * @param contentDiv - The main content container.
 * @param owner - The project owner's slug.
 * @param project - The project's slug.
 * @param permission - The current user's permission object, used for gating edit/delete actions.
 */
export function loadProjectSettingsPage(navContentDiv: HTMLElement, contentDiv: HTMLElement, owner: string, project: string, permission: { permission?: string; isOwner?: boolean } | null): void {
    const form = document.getElementById('project-settings-form') as HTMLFormElement | null;
    const titleInput = document.getElementById('project-title-input') as HTMLInputElement | null;
    const descriptionInput = document.getElementById('project-description-input') as HTMLTextAreaElement | null;
    const summaryPanel = document.getElementById('project-summary-panel') as HTMLElement | null;
    const summaryLoading = document.getElementById('project-summary-loading') as HTMLElement | null;
    const errorText = document.getElementById('error-text') as HTMLElement | null;
    const successText = document.getElementById('success-text') as HTMLElement | null;
    const exportButton = document.getElementById('export-project-btn') as HTMLButtonElement | null;
    const deleteButton = document.getElementById('delete-project-btn') as HTMLButtonElement | null;
    const deleteButtonSpinner = document.getElementById('delete-project-btn-spinner') as HTMLElement | null;
    const deleteButtonLabel = document.getElementById('delete-project-btn-label') as HTMLElement | null;
    const deleteConfirmationInput = document.getElementById('project-delete-confirmation-input') as HTMLInputElement | null;
    const deleteConfirmationText = document.getElementById('project-delete-confirmation-text') as HTMLElement | null;
    const saveBtn = document.getElementById('save-project-settings-btn') as HTMLButtonElement | null;

    const titleView = document.getElementById('project-title-view') as HTMLElement | null;
    const titleEditBtn = document.getElementById('edit-project-title-btn') as HTMLButtonElement | null;
    const descView = document.getElementById('project-description-view') as HTMLElement | null;
    const descEditBtn = document.getElementById('edit-project-desc-btn') as HTMLButtonElement | null;
    let titleEditor: ReturnType<typeof setupInlineEdit> | null = null;
    let descEditor: ReturnType<typeof setupInlineEdit> | null = null;

    if (titleInput && titleView && titleEditBtn) {
        titleEditor = setupInlineEdit(titleInput, titleView, titleEditBtn);
    }
    if (descriptionInput && descView && descEditBtn) {
        descEditor = setupInlineEdit(descriptionInput, descView, descEditBtn, saveBtn);
    }

    /**
     *
     */
    function applyPermissionGating(): void {
        const canEdit = permission?.permission === 'Edit';
        const isOwner = permission?.isOwner === true;

        if (!canEdit) {
            const titleEditBtn = document.getElementById('edit-project-title-btn') as HTMLButtonElement | null;
            const descEditBtn = document.getElementById('edit-project-desc-btn') as HTMLButtonElement | null;
            const saveBtn = document.getElementById('save-project-settings-btn') as HTMLButtonElement | null;
            const titleInput = document.getElementById('project-title-input') as HTMLInputElement | null;
            const descInput = document.getElementById('project-description-input') as HTMLTextAreaElement | null;

            if (titleEditBtn) { titleEditBtn.disabled = true; titleEditBtn.title = 'Requires Edit permission.'; }
            if (descEditBtn) { descEditBtn.disabled = true; descEditBtn.title = 'Requires Edit permission.'; }
            if (saveBtn) { saveBtn.disabled = true; saveBtn.title = 'Requires Edit permission.'; }
            if (titleInput) titleInput.disabled = true;
            if (descInput) descInput.disabled = true;
        }

        if (!isOwner) {
            const deleteSection = document.querySelector('.detail-card:last-child') as HTMLElement | null;
            if (deleteSection) {
                const deleteBtn = deleteSection.querySelector('#delete-project-btn') as HTMLButtonElement | null;
                const deleteInput = deleteSection.querySelector('#project-delete-confirmation-input') as HTMLInputElement | null;
                if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.title = 'Only the project owner can delete this project.'; }
                if (deleteInput) deleteInput.disabled = true;
            }
        }
    }

    let currentProject: Record<string, unknown> | null = null;
    let summaryState: {
        counts: { promises: number; epics: number; journeys: number; flows: number; moments: number; totalPromises: number };
        memberCount: number;
        firstPromise: Record<string, unknown> | null;
    } = {
        counts: { promises: 0, epics: 0, journeys: 0, flows: 0, moments: 0, totalPromises: 0 },
        memberCount: 0,
        firstPromise: null,
    };
    let exportPopoverHideTimer: ReturnType<typeof setTimeout> | null = null;
    let exportPopover: { show: () => void; hide: () => void } | null = null;

    if (!form || !titleInput || !descriptionInput || !summaryPanel || !summaryLoading || !errorText || !successText || !exportButton || !deleteButton || !deleteConfirmationInput || !deleteConfirmationText) {
        return;
    }

    /**
     *
     */
    function clearMessages(): void {
        errorText.textContent = '';
        successText.textContent = '';
    }

    /**
     *
     * @param loading
     */
    function setSummaryLoading(loading: boolean): void {
        summaryLoading.hidden = !loading;
        summaryPanel.hidden = loading;
    }

    /**
     *
     */
    function showExportPopover(): void {
        if (typeof bootstrap === 'undefined' || !bootstrap.Popover) {
            successText.textContent = 'Exported!';
            window.setTimeout(() => {
                if (successText.textContent === 'Exported!') {
                    successText.textContent = '';
                }
            }, 2000);
            return;
        }

        if (!exportPopover) {
            exportPopover = new bootstrap.Popover(exportButton, {
                trigger: 'manual',
                placement: 'top',
                content: 'Exported!',
            });
        }

        exportPopover.show();

        if (exportPopoverHideTimer) {
            window.clearTimeout(exportPopoverHideTimer);
        }

        exportPopoverHideTimer = window.setTimeout(() => {
            exportPopover?.hide();
        }, 2000);
    }

    /**
     *
     * @param projectName
     */
    function getDeletePhrase(projectName: string): string {
        return `delete ${projectName}`;
    }

    /**
     *
     * @param projectName
     */
    function refreshDeleteGate(projectName: string): void {
        const phrase = getDeletePhrase(projectName);
        deleteConfirmationText.textContent = phrase;
        deleteConfirmationInput.value = '';
        deleteButton.disabled = true;
        deleteButton.dataset.confirmationPhrase = phrase;
    }

    /**
     *
     * @param busy
     */
    function setDeleteButtonState(busy: boolean): void {
        deleteButton.disabled = busy;
        deleteButtonSpinner.classList.toggle('d-none', !busy);
        deleteButtonLabel.textContent = busy ? 'Deleting Project...' : 'Delete Project';
    }

    /**
     *
     */
    function updateDeleteButtonState(): void {
        const expected = deleteButton.dataset.confirmationPhrase || '';
        deleteButton.disabled = deleteConfirmationInput.value !== expected;
    }

    /**
     *
     * @param project
     * @param counts
     * @param counts.promises
     * @param counts.epics
     * @param counts.journeys
     * @param counts.flows
     * @param counts.moments
     * @param counts.totalPromises
     * @param memberCount
     */
    function renderSummary(project: Record<string, unknown>, counts: { promises: number; epics: number; journeys: number; flows: number; moments: number; totalPromises: number }, memberCount: number): void {
        renderSummaryTable(summaryPanel, [
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
     *
     * @param projectObj
     */
    async function loadSummary(projectObj: Record<string, unknown>): Promise<void> {
        setSummaryLoading(true);

        try {
            const [graphData, members] = await Promise.all([
                getGraphData(owner, project),
                getProjectMembers(owner, project).catch(() => []),
            ]);

            const epics = (graphData.promises ?? []).flatMap((p: Record<string, unknown>) => (p.epics ?? []) as unknown[]);
            const journeys = epics.flatMap((e: Record<string, unknown>) => (e.journeys ?? []) as unknown[]);
            const flows = journeys.flatMap((j: Record<string, unknown>) => (j.flows ?? []) as unknown[]);
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
                firstPromise: (graphData.promises ?? [])[0] ?? null,
            };

            renderSummary(projectObj, summaryState.counts, summaryState.memberCount);
        } catch (error) {
            summaryState = {
                counts: { promises: 0, epics: 0, journeys: 0, flows: 0, moments: 0, totalPromises: 0 },
                memberCount: 0,
                firstPromise: null,
            };

            renderSummary(projectObj, summaryState.counts, summaryState.memberCount);
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
            titleInput.value = projectData.name ?? '';
            descriptionInput.value = projectData.description ?? '';
            if (titleEditor) titleEditor.showView(escapeHtml(projectData.name ?? ''));
            if (descEditor) descEditor.showView(formatCommentText(projectData.description ?? ''));
            refreshDeleteGate(projectData.name ?? '');
            await loadSummary(projectData);

            if (summaryState.firstPromise) {
                createCommentAutocomplete(descriptionInput, 'Promise', summaryState.firstPromise.id);
            }
        } catch (error) {
            errorText.textContent = 'Failed to load project settings.';
            console.error(error);
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessages();

        const name = titleInput.value.trim();
        const description = descriptionInput.value.trim();

        if (!name) {
            errorText.textContent = 'Project title is required.';
            return;
        }

        try {
            const updatedProject = await updateProjectDetails(owner, project, {
                name,
                description: description || null,
            });

            currentProject = updatedProject;
            titleInput.value = updatedProject.name ?? '';
            descriptionInput.value = updatedProject.description ?? '';
            if (titleEditor) titleEditor.showView(escapeHtml(updatedProject.name ?? ''));
            if (descEditor) descEditor.showSavedPopover(formatCommentText(updatedProject.description ?? ''));
            refreshDeleteGate(updatedProject.name ?? '');
            renderSummary(updatedProject, summaryState.counts, summaryState.memberCount);
            successText.textContent = 'Project settings saved.';
        } catch (error) {
            errorText.textContent = (error as Error).message || 'Failed to save project settings.';
        }
    });

    deleteConfirmationInput.addEventListener('input', updateDeleteButtonState);

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

    deleteButton.addEventListener('click', async () => {
        clearMessages();

        if (!currentProject) {
            errorText.textContent = 'Project is not loaded yet.';
            return;
        }

        if (deleteConfirmationInput.value !== deleteButton.dataset.confirmationPhrase) {
            errorText.textContent = 'Type the exact confirmation phrase to delete the project.';
            return;
        }

        setDeleteButtonState(true);

        try {
            await deleteProject(owner, project);
            navigate('/projects', navContentDiv, contentDiv);
        } catch (error) {
            errorText.textContent = (error as Error).message || 'Failed to delete project.';
        } finally {
            setDeleteButtonState(false);
        }
    });

    applyPermissionGating();
    loadProject();
}

/**
 * Trigger a browser download of a blob with the given filename.
 * @param blob
 * @param filename
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format a date string for display using the audit timestamp formatter.
 * @param value
 */
function formatDate(value: string): string {
    return formatTimestamp(value);
}

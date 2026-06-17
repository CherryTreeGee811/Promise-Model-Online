import { navigate } from '../router.mjs';
import { exportProject, getProject, getGraphData, deleteProject, updateProjectDetails } from './api.ts';
import { getProjectMembers } from '../strides/api.ts';
import { renderSummaryTable } from './summary.mjs';
import { formatTimestamp } from './audit.mjs';
import { escapeHtml } from '../utils/html.mjs';
import { setupInlineEdit } from '../utils/inline-edit.mjs';
import { formatCommentText } from '../utils/entity-reference.mjs';
import { createCommentAutocomplete } from '../comments/autocomplete.mjs';

/**
 * Load the project settings page with inline editing, summary, export, and delete controls.
 * @param {HTMLElement} navContentDiv - The navigation content container.
 * @param {HTMLElement} contentDiv - The main content container.
 * @param {string} owner - The project owner's slug.
 * @param {string} project - The project's slug.
 * @param {object} permission - The current user's permission object.
 */
export function loadProjectSettingsPage(navContentDiv, contentDiv, owner, project, permission) {
    const form = document.getElementById('project-settings-form');
    const titleInput = document.getElementById('project-title-input');
    const descriptionInput = document.getElementById('project-description-input');
    const summaryPanel = document.getElementById('project-summary-panel');
    const summaryLoading = document.getElementById('project-summary-loading');
    const errorText = document.getElementById('error-text');
    const successText = document.getElementById('success-text');
    const exportButton = document.getElementById('export-project-btn');
    const deleteButton = document.getElementById('delete-project-btn');
    const deleteButtonSpinner = document.getElementById('delete-project-btn-spinner');
    const deleteButtonLabel = document.getElementById('delete-project-btn-label');
    const deleteConfirmationInput = document.getElementById('project-delete-confirmation-input');
    const deleteConfirmationText = document.getElementById('project-delete-confirmation-text');
    const saveBtn = document.getElementById('save-project-settings-btn');

    const titleView = document.getElementById('project-title-view');
    const titleEditBtn = document.getElementById('edit-project-title-btn');
    const descView = document.getElementById('project-description-view');
    const descEditBtn = document.getElementById('edit-project-desc-btn');
    let titleEditor = null;
    let descEditor = null;

    // Wire inline edit
    if (titleInput && titleView && titleEditBtn) {
        titleEditor = setupInlineEdit(titleInput, titleView, titleEditBtn);
    }
    if (descriptionInput && descView && descEditBtn) {
        descEditor = setupInlineEdit(descriptionInput, descView, descEditBtn, saveBtn);
    }

    /**
     * Disable UI controls based on the user's permission level.
     */
    function applyPermissionGating() {
        const canEdit = permission?.permission === 'Edit';
        const isOwner = permission?.isOwner === true;

        if (!canEdit) {
            const titleEditBtn = document.getElementById('edit-project-title-btn');
            const descEditBtn = document.getElementById('edit-project-desc-btn');
            const saveBtn = document.getElementById('save-project-settings-btn');
            const titleInput = document.getElementById('project-title-input');
            const descInput = document.getElementById('project-description-input');

            if (titleEditBtn) { titleEditBtn.disabled = true; titleEditBtn.title = 'Requires Edit permission.'; }
            if (descEditBtn) { descEditBtn.disabled = true; descEditBtn.title = 'Requires Edit permission.'; }
            if (saveBtn) { saveBtn.disabled = true; saveBtn.title = 'Requires Edit permission.'; }
            if (titleInput) titleInput.disabled = true;
            if (descInput) descInput.disabled = true;
        }

        if (!isOwner) {
            const deleteSection = document.querySelector('.detail-card:last-child');
            if (deleteSection) {
                const deleteBtn = deleteSection.querySelector('#delete-project-btn');
                const deleteInput = deleteSection.querySelector('#project-delete-confirmation-input');
                if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.title = 'Only the project owner can delete this project.'; }
                if (deleteInput) deleteInput.disabled = true;
            }
        }
    }

    let currentProject = null;
    let summaryState = {
        counts: {
            promises: 0,
            epics: 0,
            journeys: 0,
            flows: 0,
            moments: 0,
            totalPromises: 0,
        },
        memberCount: 0,
        firstPromise: null,
    };
    let exportPopoverHideTimer = null;
    let exportPopover = null;

    if (!form || !titleInput || !descriptionInput || !summaryPanel || !summaryLoading || !errorText || !successText || !exportButton || !deleteButton || !deleteConfirmationInput || !deleteConfirmationText) {
        return;
    }

    /**
     * Clear error and success message elements.
     */
    function clearMessages() {
        errorText.textContent = '';
        successText.textContent = '';
    }

    /**
     * Toggle the summary section loading state.
     * @param {boolean} loading - Whether the summary is loading.
     */
    function setSummaryLoading(loading) {
        summaryLoading.hidden = !loading;
        summaryPanel.hidden = loading;
    }

    /**
     * Show a success popover on the export button indicating the export is complete.
     */
    function showExportPopover() {
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
     * Get the confirmation phrase required to delete a project.
     * @param {string} projectName - The project name.
     * @returns {string} The deletion confirmation phrase.
     */
    function getDeletePhrase(projectName) {
        return `delete ${projectName}`;
    }

    /**
     * Reset the delete confirmation gate UI for a given project name.
     * @param {string} projectName - The project name to base the confirmation phrase on.
     */
    function refreshDeleteGate(projectName) {
        const phrase = getDeletePhrase(projectName);
        deleteConfirmationText.textContent = phrase;
        deleteConfirmationInput.value = '';
        deleteButton.disabled = true;
        deleteButton.dataset.confirmationPhrase = phrase;
    }

    /**
     * Set the delete button's busy/loading state.
     * @param {boolean} busy - Whether the button should show a loading state.
     */
    function setDeleteButtonState(busy) {
        deleteButton.disabled = busy;
        deleteButtonSpinner.classList.toggle('d-none', !busy);
        deleteButtonLabel.textContent = busy ? 'Deleting Project...' : 'Delete Project';
    }

    /**
     * Update the delete button enabled/disabled state based on the confirmation input.
     */
    function updateDeleteButtonState() {
        const expected = deleteButton.dataset.confirmationPhrase || '';
        deleteButton.disabled = deleteConfirmationInput.value !== expected;
    }

    /**
     * Render the project summary table with entity counts and metadata.
     * @param {object} project - The project object.
     * @param {{promises: number, epics: number, journeys: number, flows: number, moments: number, totalPromises: number}} counts - The entity counts.
     * @param {number} memberCount - The number of team members.
     */
    function renderSummary(project, counts, memberCount) {
        renderSummaryTable(summaryPanel, [
            { label: 'Created', value: formatDate(project.createdAt) },
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
     * Load and render the project summary from graph data and member list.
     * @param {object} projectObj - The project object.
     */
    async function loadSummary(projectObj) {
        setSummaryLoading(true);

        try {
            const [graphData, members] = await Promise.all([
                getGraphData(owner, project),
                getProjectMembers(owner, project).catch(() => []),
            ]);

            const epics = (graphData.promises ?? []).flatMap(p => p.epics ?? []);
            const journeys = epics.flatMap(e => e.journeys ?? []);
            const flows = journeys.flatMap(j => j.flows ?? []);
            const moments = flows.flatMap(f => f.moments ?? []);

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
                counts: {
                    promises: 0,
                    epics: 0,
                    journeys: 0,
                    flows: 0,
                    moments: 0,
                    totalPromises: 0,
                },
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
     * Load the project details and populate the settings form.
     */
    async function loadProject() {
        try {
            const projectData = await getProject(owner, project);
            currentProject = projectData;
            titleInput.value = projectData.name ?? '';
            descriptionInput.value = projectData.description ?? '';
            if (titleEditor) titleEditor.showView(escapeHtml(projectData.name ?? ''));
            if (descEditor) descEditor.showView(formatCommentText(projectData.description ?? ''));
            refreshDeleteGate(projectData.name ?? '');
            await loadSummary(projectData);

            // Set up autocomplete on description using the first promise as parent
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
            errorText.textContent = error.message || 'Failed to save project settings.';
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
            errorText.textContent = error.message || 'Failed to export project.';
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
            errorText.textContent = error.message || 'Failed to delete project.';
        } finally {
            setDeleteButtonState(false);
        }
    });

    applyPermissionGating();
    loadProject();
}

/**
 * Download a blob object as a file in the browser.
 * @param {Blob} blob - The blob to download.
 * @param {string} filename - The desired filename.
 */
function downloadBlob(blob, filename) {
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
 * Format a date value for display in the settings summary.
 * @param {string|Date} value - The date value to format.
 * @returns {string} The formatted date string.
 */
function formatDate(value) {
    return formatTimestamp(value);
}



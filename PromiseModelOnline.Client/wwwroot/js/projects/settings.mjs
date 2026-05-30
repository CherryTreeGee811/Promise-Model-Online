import { routeHandler } from '../router.mjs';
import { exportProject, getProjectAuditHistory, getProjectById, getProjectPromises, deleteProject, updateProjectDetails } from './api.mjs';
import { getEpicsByPromise } from '../promises/api.mjs';
import { getJourneysByEpic } from '../epics/api.mjs';
import { getFlowsByJourney } from '../journeys/api.mjs';
import { getMomentsByFlow } from '../flows/api.mjs';
import { getProjectMembers } from '../strides/api.mjs';
import { renderSummaryTable } from './summary.mjs';
import { formatTimestamp, getAuditDetailsPayload, renderAuditDetailsModal, renderAuditTable } from './audit.mjs';

export function loadProjectSettingsPage(navContentDiv, contentDiv, projectId) {
    const form = document.getElementById('project-settings-form');
    const titleInput = document.getElementById('project-title-input');
    const descriptionInput = document.getElementById('project-description-input');
    const summaryPanel = document.getElementById('project-summary-panel');
    const summaryLoading = document.getElementById('project-summary-loading');
    const auditPanel = document.getElementById('project-audit-panel');
    const auditLoading = document.getElementById('project-audit-loading');
    const auditHistoryLink = document.getElementById('project-audit-history-link');
    const auditDetailsModalContainerId = 'project-audit-details-modal-container';
    const errorText = document.getElementById('error-text');
    const successText = document.getElementById('success-text');
    const exportButton = document.getElementById('export-project-btn');
    const deleteButton = document.getElementById('delete-project-btn');
    const deleteConfirmationInput = document.getElementById('project-delete-confirmation-input');
    const deleteConfirmationText = document.getElementById('project-delete-confirmation-text');

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
    };
    let exportPopoverHideTimer = null;
    let exportPopover = null;

    if (!form || !titleInput || !descriptionInput || !summaryPanel || !summaryLoading || !auditPanel || !auditLoading || !auditHistoryLink || !errorText || !successText || !exportButton || !deleteButton || !deleteConfirmationInput || !deleteConfirmationText) {
        return;
    }

    ensureAuditModal();

    function clearMessages() {
        errorText.textContent = '';
        successText.textContent = '';
    }

    function setSummaryLoading(loading) {
        summaryLoading.hidden = !loading;
        summaryPanel.hidden = loading;
    }

    function setAuditLoading(loading) {
        auditLoading.hidden = !loading;
        auditPanel.hidden = loading;
    }

    function ensureAuditModal() {
        let container = document.getElementById(auditDetailsModalContainerId);
        if (!container) {
            container = document.createElement('div');
            container.id = auditDetailsModalContainerId;
            document.body.appendChild(container);
        }

        container.innerHTML = renderAuditDetailsModal();
    }

    function openAuditDetails(item) {
        const payload = getAuditDetailsPayload(item);
        const titleEl = document.getElementById('audit-details-modal-title');
        const bodyEl = document.getElementById('audit-details-modal-body');
        const modalEl = document.getElementById('audit-details-modal');

        if (!titleEl || !bodyEl || !modalEl) return;

        titleEl.textContent = payload.title;
        bodyEl.innerHTML = payload.html;

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
    }

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

    function getDeletePhrase(projectName) {
        return `delete ${projectName}`;
    }

    function refreshDeleteGate(projectName) {
        const phrase = getDeletePhrase(projectName);
        deleteConfirmationText.textContent = phrase;
        deleteConfirmationInput.value = '';
        deleteButton.disabled = true;
        deleteButton.dataset.confirmationPhrase = phrase;
    }

    function updateDeleteButtonState() {
        const expected = deleteButton.dataset.confirmationPhrase || '';
        deleteButton.disabled = deleteConfirmationInput.value !== expected;
    }

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

    async function loadSummary(project) {
        setSummaryLoading(true);

        try {
            const [promises, members] = await Promise.all([
                getProjectPromises(projectId),
                getProjectMembers(projectId).catch(() => []),
            ]);

            const epicsNested = await Promise.all(promises.map(promise => getEpicsByPromise(promise.id).catch(() => [])));
            const epics = epicsNested.flat();

            const journeysNested = await Promise.all(epics.map(epic => getJourneysByEpic(epic.id).catch(() => [])));
            const journeys = journeysNested.flat();

            const flowsNested = await Promise.all(journeys.map(journey => getFlowsByJourney(journey.id).catch(() => [])));
            const flows = flowsNested.flat();

            const momentsNested = await Promise.all(flows.map(flow => getMomentsByFlow(flow.id).catch(() => [])));
            const moments = momentsNested.flat();

            summaryState = {
                counts: {
                    promises: promises.length,
                    epics: epics.length,
                    journeys: journeys.length,
                    flows: flows.length,
                    moments: moments.length,
                    totalPromises: promises.length + epics.length + journeys.length + flows.length + moments.length,
                },
                memberCount: members.length,
            };

            renderSummary(project, summaryState.counts, summaryState.memberCount);
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
            };

            renderSummary(project, summaryState.counts, summaryState.memberCount);
            console.warn('Failed to load project summary:', error);
        } finally {
            setSummaryLoading(false);
        }
    }

    async function loadAuditHistory() {
        setAuditLoading(true);

        try {
            const { items } = await getProjectAuditHistory(projectId, 10, 0);
            auditPanel.innerHTML = renderAuditTable(items, { showEntity: false });
            bindAuditDetailLinks(items);
        } catch (error) {
            auditPanel.innerHTML = '<p class="text-danger mb-0">Failed to load project activity.</p>';
            console.warn('Failed to load project audit history:', error);
        } finally {
            setAuditLoading(false);
        }
    }

    function bindAuditDetailLinks(items) {
        const detailLinks = auditPanel.querySelectorAll('.audit-show-details-link');
        detailLinks.forEach((link, index) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                openAuditDetails(items[index]);
            });
        });
    }

    async function loadProject() {
        try {
            auditHistoryLink.href = `/projects/${projectId}/history`;
            const project = await getProjectById(projectId);
            currentProject = project;
            titleInput.value = project.name ?? '';
            descriptionInput.value = project.description ?? '';
            refreshDeleteGate(project.name ?? '');
            await loadSummary(project);
            await loadAuditHistory();
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
            const updatedProject = await updateProjectDetails(projectId, {
                name,
                description: description || null,
            });

            currentProject = updatedProject;
            titleInput.value = updatedProject.name ?? '';
            descriptionInput.value = updatedProject.description ?? '';
            refreshDeleteGate(updatedProject.name ?? '');
            renderSummary(updatedProject, summaryState.counts, summaryState.memberCount);
            await loadAuditHistory();
            successText.textContent = 'Project settings saved.';
        } catch (error) {
            errorText.textContent = error.message || 'Failed to save project settings.';
        }
    });

    deleteConfirmationInput.addEventListener('input', updateDeleteButtonState);

    exportButton.addEventListener('click', async () => {
        clearMessages();

        try {
            const blob = await exportProject(projectId);
            downloadBlob(blob, `project-${projectId}-export.json`);
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

        try {
            await deleteProject(projectId);
            window.history.pushState({}, '', '/projects');
            routeHandler(navContentDiv, contentDiv);
        } catch (error) {
            errorText.textContent = error.message || 'Failed to delete project.';
        }
    });

    auditHistoryLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.history.pushState({}, '', `/projects/${projectId}/history`);
        routeHandler(navContentDiv, contentDiv);
    });

    loadProject();
}

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

function formatDate(value) {
    return formatTimestamp(value);
}



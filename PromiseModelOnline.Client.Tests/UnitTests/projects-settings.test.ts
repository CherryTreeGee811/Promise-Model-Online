import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
const mockGetProject = vi.fn();
const mockGetGraphData = vi.fn();
const mockUpdateProjectDetails = vi.fn();
const mockDeleteProject = vi.fn();
const mockExportProject = vi.fn();
const mockGetProjectMembers = vi.fn();
const mockSetupInlineEdit = vi.fn();
const mockCreateCommentAutocomplete = vi.fn();
const mockRenderSummaryTable = vi.fn();
const mockFormatTimestamp = vi.fn();
const mockEscapeHtml = vi.fn((s: string) => s);
const mockFormatCommentText = vi.fn((s: string) => s);

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ navigate: mockNavigate }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    exportProject: mockExportProject,
    getProject: mockGetProject,
    getGraphData: mockGetGraphData,
    deleteProject: mockDeleteProject,
    updateProjectDetails: mockUpdateProjectDetails,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    getProjectMembers: mockGetProjectMembers,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-edit.ts', () => ({
    setupInlineEdit: mockSetupInlineEdit,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts', () => ({
    createCommentAutocomplete: mockCreateCommentAutocomplete,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/summary.ts', () => ({
    renderSummaryTable: mockRenderSummaryTable,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/audit.ts', () => ({
    formatTimestamp: mockFormatTimestamp,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts', () => ({
    escapeHtml: mockEscapeHtml,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/entity-reference.ts', () => ({
    formatCommentText: mockFormatCommentText,
}));

describe('loadProjectSettingsPage', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <form id="project-settings-form">
                <input id="project-title-input" />
                <textarea id="project-description-input"></textarea>
                <div id="project-summary-panel"></div>
                <div id="project-summary-loading"></div>
                <span id="error-text"></span>
                <span id="success-text"></span>
                <button id="export-project-btn" type="button">Export</button>
                <button id="delete-project-btn" type="button" disabled>
                    <span id="delete-project-btn-spinner" class="d-none"></span>
                    <span id="delete-project-btn-label">Delete Project</span>
                </button>
                <input id="project-delete-confirmation-input" />
                <span id="project-delete-confirmation-text"></span>
                <button id="save-project-settings-btn">Save</button>
                <span id="project-title-view">Title View</span>
                <button id="edit-project-title-btn">Edit Title</button>
                <span id="project-description-view">Desc View</span>
                <button id="edit-project-desc-btn">Edit Desc</button>
            </form>
        `;
        vi.clearAllMocks();
        mockGetProject.mockResolvedValue({ name: 'My Project', description: 'My desc', createdAt: '2024-01-01' });
        mockGetGraphData.mockResolvedValue({ promises: [] });
        mockGetProjectMembers.mockResolvedValue([]);
        mockSetupInlineEdit.mockReturnValue({ showView: vi.fn(), showSavedPopover: vi.fn() });
        mockFormatTimestamp.mockReturnValue('Jan 1, 2024');
        URL.createObjectURL = vi.fn(() => 'blob:url');
        URL.revokeObjectURL = vi.fn();
    });

    it('returns early when essential elements are missing', () => {
        // Arrange
        document.body.innerHTML = '';
        const { loadProjectSettingsPage } = import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        // Act & Assert
        expect(() => { loadProjectSettingsPage; }).not.toThrow();
    });

    it('loads project data on init', async () => {
        // Arrange
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        // Act
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'owner1', 'proj1', { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            expect(mockGetProject).toHaveBeenCalledWith('owner1', 'proj1');
        });
    });

    it('fills title and description inputs from project data', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test Project', description: 'Test desc', createdAt: '2024-01-01' });
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        // Act
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            const titleInput = document.querySelector('#project-title-input') as HTMLInputElement;
            expect(titleInput.value).toBe('Test Project');
            const descInput = document.querySelector('#project-description-input') as HTMLTextAreaElement;
            expect(descInput.value).toBe('Test desc');
        });
    });

    it('loads summary when graph data resolves', async () => {
        // Arrange
        mockGetGraphData.mockResolvedValue({ promises: [{ id: 1, label: 'P1' }] });
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        // Act
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            expect(mockGetGraphData).toHaveBeenCalledWith('o', 'p');
            expect(mockRenderSummaryTable).toHaveBeenCalled();
        });
    });

    it('sets up inline editors for title and description', async () => {
        // Arrange
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        // Act
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            expect(mockSetupInlineEdit).toHaveBeenCalledTimes(2);
        });
    });

    it('saves settings on form submit', async () => {
        // Arrange
        mockUpdateProjectDetails.mockResolvedValue({ name: 'Updated', description: 'Updated desc', createdAt: '2024-01-01' });
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(mockGetProject).toHaveBeenCalled();
        });
        const titleInput = document.querySelector('#project-title-input') as HTMLInputElement;
        titleInput.value = 'Updated';
        const descInput = document.querySelector('#project-description-input') as HTMLTextAreaElement;
        descInput.value = 'Updated desc';
        // Act
        const form = document.querySelector('#project-settings-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateProjectDetails).toHaveBeenCalledWith('o', 'p', { name: 'Updated', description: 'Updated desc' });
        });
    });

    it('shows success text after saving', async () => {
        // Arrange
        mockUpdateProjectDetails.mockResolvedValue({ name: 'Updated', description: '', createdAt: '2024-01-01' });
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(mockGetProject).toHaveBeenCalled();
        });
        const titleInput = document.querySelector('#project-title-input') as HTMLInputElement;
        titleInput.value = 'Updated';
        // Act
        const form = document.querySelector('#project-settings-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const successEl = document.querySelector('#success-text') as HTMLElement;
            expect(successEl.textContent).toBe('Project settings saved.');
        });
    });

    it('shows error when saving with empty title', async () => {
        // Arrange
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(mockGetProject).toHaveBeenCalled();
        });
        const titleInput = document.querySelector('#project-title-input') as HTMLInputElement;
        titleInput.value = '';
        // Act
        const form = document.querySelector('#project-settings-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('Project title is required.');
        });
    });

    it('shows error when save API fails', async () => {
        // Arrange
        mockUpdateProjectDetails.mockRejectedValue(new Error('save failed'));
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(mockGetProject).toHaveBeenCalled();
        });
        const titleInput = document.querySelector('#project-title-input') as HTMLInputElement;
        titleInput.value = 'My Project';
        // Act
        const form = document.querySelector('#project-settings-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('save failed');
        });
    });

    it('exports project on export button click', async () => {
        // Arrange
        mockExportProject.mockResolvedValue(new Blob(['data'], { type: 'application/json' }));
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(mockGetProject).toHaveBeenCalled();
        });
        // Act
        const exportBtn = document.querySelector('#export-project-btn') as HTMLButtonElement;
        exportBtn.click();
        // Assert
        await vi.waitFor(() => {
            expect(mockExportProject).toHaveBeenCalledWith('o', 'p');
        });
    });

    it('does not delete when confirmation phrase is wrong', async () => {
        // Arrange
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(mockGetProject).toHaveBeenCalled();
        });
        const confirmInput = document.querySelector('#project-delete-confirmation-input') as HTMLInputElement;
        confirmInput.value = 'wrong phrase';
        // Act
        const deleteBtn = document.querySelector('#delete-project-btn') as HTMLButtonElement;
        deleteBtn.click();
        // Assert
        await vi.waitFor(() => {
            expect(mockDeleteProject).not.toHaveBeenCalled();
        });
    });

    it('deletes project when confirmation matches', async () => {
        // Arrange
        mockDeleteProject.mockResolvedValue(undefined);
        mockGetProject.mockResolvedValue({ name: 'My Project', description: '', createdAt: '2024-01-01' });
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            const confirmText = document.querySelector('#project-delete-confirmation-text') as HTMLElement;
            expect(confirmText.textContent).toBe('delete My Project');
        });
        const confirmInput = document.querySelector('#project-delete-confirmation-input') as HTMLInputElement;
        confirmInput.value = 'delete My Project';
        confirmInput.dispatchEvent(new Event('input'));
        // Act
        const deleteBtn = document.querySelector('#delete-project-btn') as HTMLButtonElement;
        deleteBtn.click();
        // Assert
        await vi.waitFor(() => {
            expect(mockDeleteProject).toHaveBeenCalledWith('o', 'p');
        });
    });

    it('navigates to /projects after successful delete', async () => {
        // Arrange
        mockDeleteProject.mockResolvedValue(undefined);
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        loadProjectSettingsPage(navDiv, contentDiv, 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('#project-delete-confirmation-text')!.textContent).toBe('delete My Project');
        });
        const confirmInput = document.querySelector('#project-delete-confirmation-input') as HTMLInputElement;
        confirmInput.value = 'delete My Project';
        confirmInput.dispatchEvent(new Event('input'));
        confirmInput.dispatchEvent(new Event('input'));
        // Act
        const deleteBtn = document.querySelector('#delete-project-btn') as HTMLButtonElement;
        deleteBtn.click();
        // Assert
        await vi.waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/projects', navDiv, contentDiv);
        });
    });

    it('shows error when delete API fails', async () => {
        // Arrange
        mockDeleteProject.mockRejectedValue(new Error('forbidden'));
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('#project-delete-confirmation-text')!.textContent).toBe('delete My Project');
        });
        const confirmInput = document.querySelector('#project-delete-confirmation-input') as HTMLInputElement;
        confirmInput.value = 'delete My Project';
        confirmInput.dispatchEvent(new Event('input'));
        // Act
        const deleteBtn = document.querySelector('#delete-project-btn') as HTMLButtonElement;
        deleteBtn.click();
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('forbidden');
        });
    });

    it('shows error on export failure', async () => {
        // Arrange
        mockExportProject.mockRejectedValue(new Error('export failed'));
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(mockGetProject).toHaveBeenCalled();
        });
        // Act
        const exportBtn = document.querySelector('#export-project-btn') as HTMLButtonElement;
        exportBtn.click();
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('export failed');
        });
    });

    it('shows error on load failure', async () => {
        // Arrange
        mockGetProject.mockRejectedValue(new Error('not found'));
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        // Act
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('Failed to load project settings.');
        });
    });

    it('enables delete button only when confirmation phrase matches', async () => {
        // Arrange
        const { loadProjectSettingsPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/settings.ts');
        loadProjectSettingsPage(document.createElement('div'), document.createElement('div'), 'o', 'p', { isOwner: true });
        await vi.waitFor(() => {
            expect(document.querySelector('#project-delete-confirmation-text')!.textContent).toBe('delete My Project');
        });
        const deleteBtn = document.querySelector('#delete-project-btn') as HTMLButtonElement;
        expect(deleteBtn.disabled).toBe(true);
        const confirmInput = document.querySelector('#project-delete-confirmation-input') as HTMLInputElement;
        // Act
        confirmInput.value = 'delete My Project';
        confirmInput.dispatchEvent(new Event('input'));
        // Assert
        expect(deleteBtn.disabled).toBe(false);
    });
});

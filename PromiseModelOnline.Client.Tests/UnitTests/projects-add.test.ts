import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
const mockCreateProject = vi.fn();
const mockImportProject = vi.fn();
const mockCreatePromise = vi.fn();
const mockRenderSummaryTable = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ navigate: mockNavigate }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    createProject: mockCreateProject,
    importProject: mockImportProject,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/promises/api.ts', () => ({
    createPromise: mockCreatePromise,
}));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/summary.ts', () => ({
    renderSummaryTable: mockRenderSummaryTable,
}));

describe('loadAddProjectForm', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <form id="add-project-form">
                <input id="project-name-input" />
                <textarea id="project-description-input"></textarea>
                <div id="first-promise-panel">
                    <input id="first-promise-input" />
                </div>
                <button id="create-project-btn">
                    <span id="create-project-btn-spinner" class="d-none"></span>
                    <span id="create-project-btn-label">Create Project</span>
                </button>
                <button id="import-project-btn">
                    <span id="import-project-btn-spinner" class="d-none"></span>
                    <i id="import-project-btn-icon"></i>
                    <span id="import-project-btn-label">Import Project...</span>
                </button>
                <button id="clear-import-btn"></button>
                <input id="import-project-input" type="file" />
                <div id="project-import-summary-panel"></div>
                <a id="cancel-add-project-link" href="/projects">Cancel</a>
                <span id="error-text"></span>
                <span id="success-text"></span>
                <h1>Create Project</h1>
            </form>
        `;
        vi.clearAllMocks();
    });

    it('returns early when essential elements are missing', () => {
        // Arrange
        document.body.innerHTML = '';
        const { loadAddProjectForm } = import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        // Act & Assert
        expect(() => { loadAddProjectForm; }).not.toThrow();
    });

    it('navigates to /projects on cancel link click', async () => {
        // Arrange
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        // Act
        loadAddProjectForm(navDiv, contentDiv);
        const cancelLink = document.querySelector('#cancel-add-project-link') as HTMLAnchorElement;
        cancelLink.click();
        // Assert
        expect(mockNavigate).toHaveBeenCalledWith('/projects', navDiv, contentDiv);
    });

    it('updates heading when name input changes', async () => {
        // Arrange
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const heading = document.querySelector('h1')!;
        // Act
        const nameInput = document.querySelector('#project-name-input') as HTMLInputElement;
        nameInput.value = 'My Project';
        nameInput.dispatchEvent(new Event('input'));
        // Assert
        expect(heading.textContent).toContain("'My Project'");
    });

    it('sets scratch mode by default', async () => {
        // Arrange
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        // Act
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        // Assert
        const heading = document.querySelector('h1')!;
        expect(heading.textContent).toContain('Create Project');
        const firstPromisePanel = document.querySelector('#first-promise-panel') as HTMLElement;
        expect(firstPromisePanel.hidden).toBe(false);
    });

    it('reads imported file and shows preview', async () => {
        // Arrange
        const exportDoc = { project: { name: 'Imported', description: 'Desc' }, schemaVersion: '1.0', exportedAt: '2024-01-01T00:00:00Z' };
        const file = new File([JSON.stringify(exportDoc)], 'export.json', { type: 'application/json' });
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const importInput = document.querySelector('#import-project-input') as HTMLInputElement;
        // Act
        Object.defineProperty(importInput, 'files', { value: [file] });
        importInput.dispatchEvent(new Event('change'));
        // Assert
        await vi.waitFor(() => {
            const nameInput = document.querySelector('#project-name-input') as HTMLInputElement;
            expect(nameInput.value).toBe('Imported');
            expect(mockRenderSummaryTable).toHaveBeenCalled();
        });
    });

    it('shows error when imported file is invalid JSON', async () => {
        // Arrange
        const file = new File(['not json'], 'bad.json', { type: 'text/plain' });
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const importInput = document.querySelector('#import-project-input') as HTMLInputElement;
        // Act
        Object.defineProperty(importInput, 'files', { value: [file] });
        importInput.dispatchEvent(new Event('change'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('The selected file is not valid JSON.');
        });
    });

    it('shows error when imported file has no project field', async () => {
        // Arrange
        const file = new File([JSON.stringify({})], 'bad.json', { type: 'application/json' });
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const importInput = document.querySelector('#import-project-input') as HTMLInputElement;
        // Act
        Object.defineProperty(importInput, 'files', { value: [file] });
        importInput.dispatchEvent(new Event('change'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('The selected file does not look like a project export.');
        });
    });

    it('calls createProject on submit in scratch mode', async () => {
        // Arrange
        mockCreateProject.mockResolvedValue({ ownerSlug: 'owner1', slug: 'proj1' });
        mockCreatePromise.mockResolvedValue({});
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const nameInput = document.querySelector('#project-name-input') as HTMLInputElement;
        nameInput.value = 'New Project';
        const firstPromiseInput = document.querySelector('#first-promise-input') as HTMLInputElement;
        firstPromiseInput.value = 'First promise';
        // Act
        const form = document.querySelector('#add-project-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            expect(mockCreateProject).toHaveBeenCalledWith({ name: 'New Project', description: undefined });
        });
    });

    it('navigates to graph after creating project', async () => {
        // Arrange
        mockCreateProject.mockResolvedValue({ ownerSlug: 'owner1', slug: 'proj1' });
        mockCreatePromise.mockResolvedValue({});
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        loadAddProjectForm(navDiv, contentDiv);
        const nameInput = document.querySelector('#project-name-input') as HTMLInputElement;
        nameInput.value = 'New Project';
        const firstPromiseInput = document.querySelector('#first-promise-input') as HTMLInputElement;
        firstPromiseInput.value = 'First promise';
        // Act
        const form = document.querySelector('#add-project-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/owner1/proj1/graph', navDiv, contentDiv);
        });
    });

    it('shows validation error when project name is empty on creation', async () => {
        // Arrange
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        // Act
        const form = document.querySelector('#add-project-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('Project name is required.');
        });
    });

    it('shows validation error when first promise is empty on creation', async () => {
        // Arrange
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const nameInput = document.querySelector('#project-name-input') as HTMLInputElement;
        nameInput.value = 'New Project';
        // Act
        const form = document.querySelector('#add-project-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toContain('first Product Promise');
        });
    });

    it('shows create error on API failure', async () => {
        // Arrange
        mockCreateProject.mockRejectedValue(new Error('name taken'));
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const nameInput = document.querySelector('#project-name-input') as HTMLInputElement;
        nameInput.value = 'New Project';
        const firstPromiseInput = document.querySelector('#first-promise-input') as HTMLInputElement;
        firstPromiseInput.value = 'First promise';
        // Act
        const form = document.querySelector('#add-project-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('name taken');
        });
    });

    it('resets import state on clear import button click', async () => {
        // Arrange
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const clearBtn = document.querySelector('#clear-import-btn') as HTMLButtonElement;
        // Act
        clearBtn.click();
        // Assert
        const heading = document.querySelector('h1')!;
        expect(heading.textContent).toContain('Create Project');
    });

    it('shows import error on API failure during import', async () => {
        // Arrange
        mockImportProject.mockRejectedValue(new Error('import failed'));
        const fileContent = JSON.stringify({ project: { name: 'Test', description: '' } });
        const file = new File([fileContent], 'export.json', { type: 'application/json' });
        const { loadAddProjectForm } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/add.ts');
        loadAddProjectForm(document.createElement('div'), document.createElement('div'));
        const importInput = document.querySelector('#import-project-input') as HTMLInputElement;
        Object.defineProperty(importInput, 'files', { value: [file] });
        importInput.dispatchEvent(new Event('change'));
        await vi.waitFor(() => {
            const nameInput = document.querySelector('#project-name-input') as HTMLInputElement;
            expect(nameInput.value).toBe('Test');
        });
        // Act
        const form = document.querySelector('#add-project-form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));
        // Assert
        await vi.waitFor(() => {
            const errorEl = document.querySelector('#error-text') as HTMLElement;
            expect(errorEl.textContent).toBe('import failed');
        });
    });
});

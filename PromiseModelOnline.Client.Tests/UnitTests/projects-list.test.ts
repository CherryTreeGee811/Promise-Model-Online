import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
const mockFetchProjects = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ navigate: mockNavigate }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({ fetchProjects: mockFetchProjects }));

describe('loadProjectList', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <table><tbody id="project-list-table-body"></tbody></table>
            <span id="error-text"></span>
            <span id="success-text"></span>
            <a id="add-project-link" href="/projects/add">Add Project</a>
        `;
        vi.clearAllMocks();
    });

    it('renders projects in the table', async () => {
        // Arrange
        mockFetchProjects.mockResolvedValue([
            { name: 'Test Project', ownerSlug: 'owner1', slug: 'proj1' },
        ]);
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act
        await loadProjectList(document.createElement('div'), document.createElement('div'));
        // Assert
        const rows = document.querySelectorAll('#project-list-table-body tr');
        expect(rows.length).toBe(1);
        expect(rows[0].textContent).toContain('Test Project');
    });

    it('renders multiple projects', async () => {
        // Arrange
        mockFetchProjects.mockResolvedValue([
            { name: 'Project A', ownerSlug: 'oa', slug: 'pa' },
            { name: 'Project B', ownerSlug: 'ob', slug: 'pb' },
        ]);
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act
        await loadProjectList(document.createElement('div'), document.createElement('div'));
        // Assert
        const rows = document.querySelectorAll('#project-list-table-body tr');
        expect(rows.length).toBe(2);
    });

    it('shows empty state when no projects returned', async () => {
        // Arrange
        mockFetchProjects.mockResolvedValue([]);
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act
        await loadProjectList(document.createElement('div'), document.createElement('div'));
        // Assert
        const tbody = document.querySelector('#project-list-table-body')!;
        expect(tbody.textContent).toContain('no projects yet');
    });

    it('shows empty state when projects is undefined', async () => {
        // Arrange
        mockFetchProjects.mockResolvedValue(undefined);
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act
        await loadProjectList(document.createElement('div'), document.createElement('div'));
        // Assert
        const tbody = document.querySelector('#project-list-table-body')!;
        expect(tbody.textContent).toContain('no projects yet');
    });

    it('displays error text on 404', async () => {
        // Arrange
        mockFetchProjects.mockRejectedValue(new Error('404'));
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act
        await loadProjectList(document.createElement('div'), document.createElement('div'));
        // Assert
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        expect(errorEl.textContent).toBe('Endpoint not found');
    });

    it('displays error text on 500', async () => {
        // Arrange
        mockFetchProjects.mockRejectedValue(new Error('500'));
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act
        await loadProjectList(document.createElement('div'), document.createElement('div'));
        // Assert
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        expect(errorEl.textContent).toBe('Internal server error');
    });

    it('displays unknown error for other errors', async () => {
        // Arrange
        mockFetchProjects.mockRejectedValue(new Error('network error'));
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act
        await loadProjectList(document.createElement('div'), document.createElement('div'));
        // Assert
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        expect(errorEl.textContent).toBe('Unknown error');
    });

    it('renders action buttons for each project', async () => {
        // Arrange
        mockFetchProjects.mockResolvedValue([
            { name: 'P1', ownerSlug: 'o', slug: 'p' },
        ]);
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act
        await loadProjectList(document.createElement('div'), document.createElement('div'));
        // Assert
        expect(document.querySelector('.view-iterations-btn')).not.toBeNull();
        expect(document.querySelector('.graph-btn')).not.toBeNull();
        expect(document.querySelector('.settings-btn')).not.toBeNull();
        expect(document.querySelector('.share-btn')).not.toBeNull();
        expect(document.querySelector('.audit-log-btn')).not.toBeNull();
    });

    it('wires add-project-link click to navigate', async () => {
        // Arrange
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        // Act
        await loadProjectList(navDiv, contentDiv);
        const link = document.querySelector('#add-project-link') as HTMLAnchorElement;
        link.click();
        // Assert
        expect(mockNavigate).toHaveBeenCalledWith('/projects/add', navDiv, contentDiv);
    });

    it('does not throw when table elements are missing', async () => {
        // Arrange
        document.body.innerHTML = '';
        const { loadProjectList } = await import('../../PromiseModelOnline.Client/wwwroot/js/projects/list.ts');
        // Act & Assert
        await expect(loadProjectList(document.createElement('div'), document.createElement('div'))).resolves.toBeUndefined();
    });
});

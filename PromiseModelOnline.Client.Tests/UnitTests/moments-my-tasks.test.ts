import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
const mockGetMyAssignedMoments = vi.fn();
const mockUpdateMomentType = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({ navigate: mockNavigate }));
vi.mock('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts', () => ({
    getMyAssignedMoments: mockGetMyAssignedMoments,
    updateMomentType: mockUpdateMomentType,
}));

describe('loadMyTasksPage', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="my-tasks-content"></div>
            <span id="error-text"></span>
        `;
        vi.clearAllMocks();
    });

    it('exports expected function', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act & Assert
        expect(mod.loadMyTasksPage).toBeDefined();
    });

    it('renders moments in a table', async () => {
        // Arrange
        mockGetMyAssignedMoments.mockResolvedValue([
            { sequenceNumber: 1, flowId: 10, statement: 'Test task', type: 'Story', status: 'Active', effortEstimate: 'M', ownerSlug: 'o', projectSlug: 'p' },
        ]);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Assert
        const content = document.querySelector('#my-tasks-content')!;
        expect(content.querySelector('table')).not.toBeNull();
        expect(content.textContent).toContain('Test task');
    });

    it('renders multiple moments', async () => {
        // Arrange
        mockGetMyAssignedMoments.mockResolvedValue([
            { sequenceNumber: 1, flowId: 10, statement: 'Task 1', type: 'Story', status: 'Active', ownerSlug: 'o', projectSlug: 'p' },
            { sequenceNumber: 2, flowId: 10, statement: 'Task 2', type: 'Job', status: 'Done', ownerSlug: 'o', projectSlug: 'p' },
        ]);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Assert
        const rows = document.querySelectorAll('#my-tasks-content tbody tr');
        expect(rows.length).toBe(2);
    });

    it('shows empty state when no moments', async () => {
        // Arrange
        mockGetMyAssignedMoments.mockResolvedValue([]);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Assert
        const content = document.querySelector('#my-tasks-content')!;
        expect(content.querySelector('table')).toBeNull();
        expect(content.textContent).toContain('no assigned tasks');
    });

    it('shows empty state when moments is undefined', async () => {
        // Arrange
        mockGetMyAssignedMoments.mockResolvedValue(undefined);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Assert
        const content = document.querySelector('#my-tasks-content')!;
        expect(content.textContent).toContain('no assigned tasks');
    });

    it('displays error when API call fails', async () => {
        // Arrange
        mockGetMyAssignedMoments.mockRejectedValue(new Error('fail'));
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Assert
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        expect(errorEl.textContent).toBe('Failed to load your tasks.');
    });

    it('renders type dropdown for each moment', async () => {
        // Arrange
        mockGetMyAssignedMoments.mockResolvedValue([
            { sequenceNumber: 1, flowId: 10, statement: 'T1', type: 'Story', status: 'Active', effortEstimate: 'M', ownerSlug: 'o', projectSlug: 'p' },
        ]);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Assert
        const selects = document.querySelectorAll('.moment-type-select');
        expect(selects.length).toBe(1);
        expect((selects[0] as HTMLSelectElement).value).toBe('Story');
    });

    it('renders view link with correct href', async () => {
        // Arrange
        mockGetMyAssignedMoments.mockResolvedValue([
            { sequenceNumber: 42, flowId: 10, statement: 'T', type: 'Story', status: 'Active', ownerSlug: 'myowner', projectSlug: 'myproj' },
        ]);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Assert
        const link = document.querySelector('a[moment-seq="42"]') as HTMLAnchorElement;
        expect(link).not.toBeNull();
        expect(link.href).toContain('/myowner/myproj/moments/42');
    });

    it('handles moment type change', async () => {
        // Arrange
        mockUpdateMomentType.mockResolvedValue(undefined);
        mockGetMyAssignedMoments.mockResolvedValue([
            { sequenceNumber: 1, flowId: 10, statement: 'T', type: 'Story', status: 'Active', effortEstimate: 'M', ownerSlug: 'o', projectSlug: 'p' },
        ]);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Act
        const select = document.querySelector('.moment-type-select') as HTMLSelectElement;
        select.value = 'Job';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateMomentType).toHaveBeenCalledWith('o', 'p', 1, 'Job', 10);
        });
    });

    it('reverts type dropdown on API failure', async () => {
        // Arrange
        mockUpdateMomentType.mockRejectedValue(new Error('fail'));
        mockGetMyAssignedMoments.mockResolvedValue([
            { sequenceNumber: 1, flowId: 10, statement: 'T', type: 'Story', status: 'Active', effortEstimate: 'M', ownerSlug: 'o', projectSlug: 'p' },
        ]);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Act
        const select = document.querySelector('.moment-type-select') as HTMLSelectElement;
        select.value = 'Job';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        // Assert
        await vi.waitFor(() => {
            expect(select.value).toBe('Story');
        });
    });

    it('renders status badge with correct class', async () => {
        // Arrange
        mockGetMyAssignedMoments.mockResolvedValue([
            { sequenceNumber: 1, flowId: 10, statement: 'T', type: 'Story', status: 'In Progress', ownerSlug: 'o', projectSlug: 'p' },
        ]);
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act
        await loadMyTasksPage(document.createElement('div'), document.createElement('div'));
        // Assert
        const badge = document.querySelector('.status-badge');
        expect(badge!.className).toContain('status-in progress');
    });

    it('returns early when content element is missing', async () => {
        // Arrange
        document.body.innerHTML = '';
        const { loadMyTasksPage } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/my-tasks.ts');
        // Act & Assert
        await expect(loadMyTasksPage(document.createElement('div'), document.createElement('div'))).resolves.toBeUndefined();
    });
});

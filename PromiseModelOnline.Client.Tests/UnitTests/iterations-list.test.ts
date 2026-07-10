import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetProject = vi.fn();
const mockGetStridesByIteration = vi.fn();
const mockDrawBurndownChart = vi.fn();
const mockOpenIterationCreateModal = vi.fn();
const mockGetIterations = vi.fn();
const mockGetBurndown = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    getProject: mockGetProject,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    getStridesByIteration: mockGetStridesByIteration,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/burndown.ts', () => ({
    drawBurndownChart: mockDrawBurndownChart,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/iteration-create-modal.ts', () => ({
    openIterationCreateModal: mockOpenIterationCreateModal,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/iterations/api.ts', () => ({
    getIterations: mockGetIterations,
    getBurndown: mockGetBurndown,
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    document.body.innerHTML = `
        <div id="iterations-view"></div>
        <div id="iterations-list"></div>
        <div id="iteration-detail"></div>
        <span id="error-text"></span>
        <span id="project-title"></span>
        <button id="create-iteration-btn"></button>
        <div id="burndown-canvas"></div>
        <div id="stride-details"></div>
        <button id="back-to-iterations-btn"></button>
        <span id="iteration-title"></span>
    `;
});

afterEach(() => {
    vi.useRealTimers();
});

async function loadHistory(permission: { permission: string } | undefined = { permission: 'Edit' }): Promise<void> {
    const { loadIterationHistory } = await import('../../PromiseModelOnline.Client/wwwroot/js/iterations/list.ts');
    await loadIterationHistory('owner1', 'proj1', permission);
}

describe('loadIterationHistory', () => {
    it('shows loading spinner while fetching', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test Project' });
        mockGetIterations.mockResolvedValue([]);
        // The function is async, let's initiate it and check DOM immediately
        const { loadIterationHistory } = await import('../../PromiseModelOnline.Client/wwwroot/js/iterations/list.ts');
        const promise = loadIterationHistory('o', 'p', { permission: 'Edit' });
        // Assert
        const listDiv = document.querySelector('#iterations-list')!;
        expect(listDiv.querySelector('.spinner-border')).not.toBeNull();
        await promise;
    });

    it('sets project title from project data', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'My Project' });
        mockGetIterations.mockResolvedValue([]);
        // Act
        await loadHistory();
        // Assert
        const projectTitle = document.querySelector('#project-title') as HTMLElement;
        expect(projectTitle.textContent).toBe('My Project');
    });

    it('falls back to owner/slug when project has no name', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: undefined });
        mockGetIterations.mockResolvedValue([]);
        // Act
        await loadHistory();
        // Assert
        const projectTitle = document.querySelector('#project-title') as HTMLElement;
        expect(projectTitle.textContent).toBe('Project owner1/proj1');
    });

    it('shows empty state when no iterations exist', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([]);
        // Act
        await loadHistory();
        // Assert
        const listDiv = document.querySelector('#iterations-list')!;
        expect(listDiv.textContent).toContain('No iterations found.');
    });

    it('renders iteration table with items', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([
            { id: 1, name: 'Sprint 1', createdAt: '2024-01-15T10:00:00Z' },
            { id: 2, name: 'Sprint 2', createdAt: '2024-02-01T10:00:00Z' },
        ]);
        // Act
        await loadHistory();
        // Assert
        const listDiv = document.querySelector('#iterations-list')!;
        expect(listDiv.textContent).toContain('Sprint 1');
        expect(listDiv.textContent).toContain('Sprint 2');
        const rows = listDiv.querySelectorAll('tbody tr');
        expect(rows.length).toBe(2);
    });

    it('sorts iterations by id descending', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([
            { id: 1, name: 'Oldest', createdAt: '2024-01-01T00:00:00Z' },
            { id: 3, name: 'Newest', createdAt: '2024-03-01T00:00:00Z' },
            { id: 2, name: 'Middle', createdAt: '2024-02-01T00:00:00Z' },
        ]);
        // Act
        await loadHistory();
        // Assert
        const rows = document.querySelectorAll('#iterations-list tbody tr');
        expect(rows[0].textContent).toContain('Newest');
        expect(rows[1].textContent).toContain('Middle');
        expect(rows[2].textContent).toContain('Oldest');
    });

    it('shows error text on iteration load failure', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockRejectedValue(new Error('timeout'));
        // Act
        await loadHistory();
        // Assert
        const errorText = document.querySelector('#error-text') as HTMLElement;
        expect(errorText.textContent).toBe('Error loading iterations.');
    });

    it('hides detail view on load', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([]);
        const detailDiv = document.querySelector('#iteration-detail') as HTMLElement;
        detailDiv.classList.remove('d-none');
        // Act
        await loadHistory();
        // Assert
        expect(detailDiv.classList.contains('d-none')).toBe(true);
    });

    it('clears error text on load', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([]);
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        errorEl.textContent = 'Old error';
        // Act
        await loadHistory();
        // Assert
        expect(errorEl.textContent).toBe('');
    });

    it('sets up create iteration button for Edit permission', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([]);
        // Act
        await loadHistory();
        // Assert
        const createBtn = document.querySelector('#create-iteration-btn') as HTMLElement;
        expect(createBtn.dataset.bound).toBe('1');
    });

    it('hides create iteration button for non-Edit permission', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([]);
        // Act
        await loadHistory({ permission: 'View' });
        // Assert
        const createBtn = document.querySelector('#create-iteration-btn') as HTMLElement;
        expect(createBtn.classList.contains('d-none')).toBe(true);
    });

    it('shows burndown loading when iteration is selected', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockResolvedValue([]);
        mockGetProject.mockResolvedValue({ name: 'Test' });
        // Act
        await loadHistory();
        const viewBtn = document.querySelector('.view-iteration-btn') as HTMLButtonElement;
        viewBtn.click();
        // Assert
        await vi.waitFor(() => {
            const burndownCanvas = document.querySelector('#burndown-canvas')!;
            expect(burndownCanvas.querySelector('.spinner-border')).not.toBeNull();
        });
    });

    it('shows stride empty state when no strides', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockResolvedValue([]);
        // Act
        await loadHistory();
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            const strideDetails = document.querySelector('#stride-details')!;
            expect(strideDetails.textContent).toContain('No strides in this iteration.');
        });
    });

    it('renders stride table when strides exist', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 1, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14', durationDays: 14 },
        ]);
        mockGetBurndown.mockResolvedValue([]);
        // Act
        await loadHistory();
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            const strideDetails = document.querySelector('#stride-details')!;
            expect(strideDetails.textContent).toContain('Week 1');
            expect(strideDetails.textContent).toContain('14 days');
        });
    });

    it('shows iteration title in detail view', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'Sprint Alpha', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockResolvedValue([]);
        // Act
        await loadHistory();
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            const title = document.querySelector('#iteration-title') as HTMLElement;
            expect(title.textContent).toBe('Sprint Alpha');
        });
    });

    it('back button returns to list view', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockResolvedValue([]);
        await loadHistory();
        const viewDiv = document.querySelector('#iterations-view') as HTMLElement;
        const detailDiv = document.querySelector('#iteration-detail') as HTMLElement;
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(detailDiv.classList.contains('d-none')).toBe(false);
        });
        // Act
        const backBtn = document.querySelector('#back-to-iterations-btn') as HTMLButtonElement;
        backBtn.click();
        // Assert
        expect(detailDiv.classList.contains('d-none')).toBe(true);
        expect(viewDiv.classList.contains('d-none')).toBe(false);
    });

    it('handles stride load failure', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockRejectedValue(new Error('network error'));
        mockGetBurndown.mockResolvedValue([]);
        // Act
        await loadHistory();
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            const strideDetails = document.querySelector('#stride-details')!;
            expect(strideDetails.textContent).toContain('Failed to load strides.');
        });
    });

    it('shows burndown error when burndown fails', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockRejectedValue(new Error('burndown error'));
        // Act
        await loadHistory();
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            const burndownCanvas = document.querySelector('#burndown-canvas')!;
            expect(burndownCanvas.textContent).toContain('Failed to load iteration burndown.');
        });
    });

    it('shows burndown empty state when no data points', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockResolvedValue([]);
        // Act
        await loadHistory();
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            const burndownCanvas = document.querySelector('#burndown-canvas')!;
            expect(burndownCanvas.textContent).toContain('No burndown data available');
        });
    });

    it('handles missing DOM elements gracefully', async () => {
        // Arrange
        document.body.innerHTML = '<div id="irrelevant"></div>';
        const { loadIterationHistory } = await import('../../PromiseModelOnline.Client/wwwroot/js/iterations/list.ts');
        // Act & Assert
        await expect(loadIterationHistory('o', 'p', { permission: 'View' })).resolves.toBeUndefined();
    });

    it('calls openIterationCreateModal when create button is clicked', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([]);
        await loadHistory();
        const createBtn = document.querySelector('#create-iteration-btn') as HTMLElement;
        // Act
        createBtn.click();
        // Assert
        expect(mockOpenIterationCreateModal).toHaveBeenCalledTimes(1);
        expect(mockOpenIterationCreateModal).toHaveBeenCalledWith(
            'owner1',
            'proj1',
            expect.any(Function),
        );
        // Also verify the reload callback is a function
        const callback = mockOpenIterationCreateModal.mock.calls[0][2];
        expect(typeof callback).toBe('function');
    });

    it('does not call openIterationCreateModal for non-Edit permission', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([]);
        await loadHistory({ permission: 'View' });
        const createBtn = document.querySelector('#create-iteration-btn') as HTMLElement;
        // Act
        createBtn.click();
        // Assert
        expect(mockOpenIterationCreateModal).not.toHaveBeenCalled();
    });

    it('calls drawBurndownChart when burndown data exists and canvas is present', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockResolvedValue([{ date: '2024-01-01', remainingEffort: 10 }]);
        // Act
        await loadHistory();
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        // Assert
        await vi.waitFor(() => {
            expect(mockDrawBurndownChart).toHaveBeenCalledTimes(1);
            const burndownCanvas = document.querySelector('#burndown-canvas');
            expect(mockDrawBurndownChart).toHaveBeenCalledWith(burndownCanvas, [{ date: '2024-01-01', remainingEffort: 10 }]);
        });
    });

    it('does not crash when burndownCanvas is null but burndown data exists', async () => {
        // Arrange - burndown-canvas is removed from DOM
        const burndownCanvasEl = document.querySelector('#burndown-canvas')!;
        burndownCanvasEl.remove();
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockResolvedValue([{ date: '2024-01-01', remainingEffort: 10 }]);
        // Act & Assert
        await loadHistory();
        (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
        await vi.waitFor(() => {
            expect(mockDrawBurndownChart).not.toHaveBeenCalled();
        });
    });

    it('does not crash when burndownCanvas is null and burndown returns empty data', async () => {
        // Arrange - burndown-canvas is removed from DOM
        const burndownCanvasEl = document.querySelector('#burndown-canvas')!;
        burndownCanvasEl.remove();
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetBurndown.mockResolvedValue([]);
        // Act & Assert - should not throw
        await loadHistory();
        await expect(
            (async () => {
                (document.querySelector('.view-iteration-btn') as HTMLButtonElement).click();
                await vi.waitFor(() => { /* wait for async operations to settle */ });
            })(),
        ).resolves.toBeUndefined();
    });
});

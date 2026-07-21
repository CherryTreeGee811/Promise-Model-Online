import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetProject = vi.fn();
const mockGetIterations = vi.fn();
const mockGetStridesByIteration = vi.fn();
const mockGetMomentsByIteration = vi.fn();
const mockGetMomentsByStride = vi.fn();
const mockGetProjectMembers = vi.fn();
const mockGetMyPermission = vi.fn();
const mockUpdateMomentStatus = vi.fn();
const mockUpdateMomentEstimate = vi.fn();
const mockUpdateMomentOwner = vi.fn();
const mockUpdateMomentType = vi.fn();
const mockAssignMomentToStride = vi.fn();
const mockProgressStride = vi.fn();
const mockNavigate = vi.fn();
const mockShowToast = vi.fn();
const mockBuildGraphViewHref = vi.fn();
const mockOpenIterationCreateModal = vi.fn();
const mockOpenStrideCreateModal = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts', () => ({
    assignMomentToStride: mockAssignMomentToStride,
    updateMomentStatus: mockUpdateMomentStatus,
    updateMomentEstimate: mockUpdateMomentEstimate,
    updateMomentOwner: mockUpdateMomentOwner,
    updateMomentType: mockUpdateMomentType,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/api.ts', () => ({
    getProject: mockGetProject,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-link.ts', () => ({
    buildGraphViewHref: mockBuildGraphViewHref,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({
    navigate: mockNavigate,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({
    showToast: mockShowToast,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/iteration-create-modal.ts', () => ({
    openIterationCreateModal: mockOpenIterationCreateModal,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/stride-create-modal.ts', () => ({
    openStrideCreateModal: mockOpenStrideCreateModal,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    getIterations: mockGetIterations,
    getStridesByIteration: mockGetStridesByIteration,
    getMomentsByStride: mockGetMomentsByStride,
    getMomentsByIteration: mockGetMomentsByIteration,
    getProjectMembers: mockGetProjectMembers,
    getMyPermission: mockGetMyPermission,
    progressStride: mockProgressStride,
}));

const mockBootstrapModal = {
    getOrCreateInstance: vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn() }),
};
const mockScrollSpy = { refresh: vi.fn() };
const mockBootstrapScrollSpy = { getOrCreateInstance: vi.fn().mockReturnValue(mockScrollSpy) };

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `
        <div id="stride-board"></div>
        <div id="backlog-section"></div>
        <span id="error-text"></span>
        <span id="project-title"></span>
        <span id="success-text"></span>
        <button id="create-stride-btn"><span id="create-stride-btn-label">New Stride</span></button>
        <a id="iteration-history-link" href="#">History</a>
        <nav id="stride-scrollspy-nav"></nav>
        <header class="header" style="height:50px"></header>
    `;
    (globalThis as Record<string, unknown>).bootstrap = {
        Modal: mockBootstrapModal,
        ScrollSpy: mockBootstrapScrollSpy,
        Popover: vi.fn(),
    };
    mockBuildGraphViewHref.mockReturnValue('/graph/moment-1');
    mockGetProject.mockResolvedValue({ name: 'Test Project' });
});

afterEach(() => {
    vi.useRealTimers();
});

async function loadList(permission: Record<string, unknown> | null = { permission: 'Edit' }): Promise<void> {
    const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
    const navDiv = document.createElement('div');
    const contentDiv = document.createElement('div');
    await loadStridesList('owner1', 'proj1', navDiv, contentDiv, permission);
}

const defaultIteration = { id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' };

describe('loadStridesList', () => {
    it('returns early when stride board is missing', async () => {
        // Arrange
        document.body.innerHTML = '<div id="irrelevant"></div>';
        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');

        // Act
        await loadStridesList('o', 'p', document.createElement('div'), document.createElement('div'), null);

        // Assert
        expect(mockGetProject).not.toHaveBeenCalled();
    });

    it('shows loading spinner on start', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');

        // Act
        const promise = loadStridesList('o', 'p', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert (before resolution)
        const board = document.querySelector('#stride-board')!;
        expect(board.querySelector('.spinner-border')).not.toBeNull();
        await promise;
    });

    it('clears error text on load', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        errorEl.textContent = 'Old error';

        // Act
        await loadList();

        // Assert
        expect(errorEl.textContent).toBe('');
    });

    it('shows empty state when no iterations exist', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        const board = document.querySelector('#stride-board')!;
        expect(board.textContent).toContain('No iterations found for this project.');
    });

    it('shows empty state when no strides in iteration', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        const board = document.querySelector('#stride-board')!;
        expect(board.textContent).toContain('No strides found for this iteration.');
    });

    it('renders stride cards for each stride', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14' },
            { id: 11, name: 'Week 2', startDate: '2024-01-15', endDate: '2024-01-28' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        const cards = document.querySelectorAll('.stride-card[data-stride-id]');
        expect(cards.length).toBe(2);
        expect(cards[0].textContent).toContain('Week 1');
        expect(cards[1].textContent).toContain('Week 2');
    });

    it('renders moments within stride cards', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([
            { sequenceNumber: 1, statement: 'First moment', type: 'Story', status: 'ToDo', effortEstimate: 'M', ownerId: null },
            { sequenceNumber: 2, statement: 'Second moment', type: 'Job', status: 'Done', effortEstimate: 'L', ownerId: 5 },
        ]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        const rows = document.querySelectorAll('.stride-card[data-stride-id] tr[data-moment-id]');
        expect(rows.length).toBe(2);
        expect(rows[0].textContent).toContain('First moment');
        expect(rows[1].textContent).toContain('Second moment');
    });

    it('shows empty state when no moments in stride', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        expect(document.querySelector('.stride-card[data-stride-id]')!.textContent).toContain('No moments assigned');
    });

    it('updates page header with iteration name', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'Sprint 42', createdAt: '2024-01-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        const title = document.querySelector('#project-title')!;
        expect(title.textContent).toContain('Sprint 42');
    });

    it('renders backlog section with moments', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([
            { sequenceNumber: 5, statement: 'Backlog item', type: 'Story', status: 'ToDo', effortEstimate: 'S' },
        ]);

        // Act
        await loadList();

        // Assert
        const backlogSection = document.querySelector('#backlog-section')!;
        expect(backlogSection.textContent).toContain('Backlog item');
    });

    it('shows empty backlog state', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        const backlogSection = document.querySelector('#backlog-section')!;
        expect(backlogSection.textContent).toContain('No unassigned moments');
    });

    it('handles moment load failure gracefully per stride', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14' },
        ]);
        mockGetMomentsByStride.mockRejectedValue(new Error('network'));
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        expect(document.querySelectorAll('.stride-card[data-stride-id]').length).toBe(1);
        expect(document.querySelector('.stride-card[data-stride-id]')!.textContent).toContain('No moments assigned');
    });

    it('shows error text on iteration API failure', async () => {
        // Arrange
        mockGetIterations.mockRejectedValue(new Error('timeout'));

        // Act
        await loadList();

        // Assert
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        expect(errorEl.textContent).toBe('Failed to load data.');
    });

    it('calls API functions with correct params', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        expect(mockGetProject).toHaveBeenCalledWith('owner1', 'proj1');
        expect(mockGetIterations).toHaveBeenCalledWith('owner1', 'proj1');
        expect(mockGetStridesByIteration).toHaveBeenCalledWith('owner1', 'proj1', 1);
        expect(mockGetMomentsByIteration).toHaveBeenCalledWith('owner1', 'proj1', 1, true);
    });

    it('sets up create stride button for edit permission', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        const btn = document.querySelector('#create-stride-btn') as HTMLElement;
        expect(btn.dataset.bound).toBe('1');
    });

    it('hides create stride button for non-edit permission', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('o', 'p', navDiv, contentDiv, { permission: 'View' });

        // Assert
        const btn = document.querySelector('#create-stride-btn') as HTMLElement;
        expect(btn.classList.contains('d-none')).toBe(true);
    });

    it('collapses non-first stride cards', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'First', startDate: '2024-01-01', endDate: '2024-01-14' },
            { id: 11, name: 'Second', startDate: '2024-01-15', endDate: '2024-01-28' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        // Act
        await loadList();

        // Assert
        const cards = document.querySelectorAll('.stride-card[data-stride-id]');
        expect(cards[0].classList.contains('is-collapsed')).toBe(false);
        expect(cards[1].classList.contains('is-collapsed')).toBe(true);
    });

    it('toggles board collapse on toggle button click', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'First', startDate: '2024-01-01', endDate: '2024-01-14' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        await loadList();

        // Act
        const card = document.querySelector('.stride-card[data-stride-id]')!;
        (card.querySelector('.stride-toggle-btn') as HTMLButtonElement).click();

        // Assert
        expect(card.classList.contains('is-collapsed')).toBe(true);
    });

    it('loads project members and checks permission', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProjectMembers.mockResolvedValue([{ userId: 1, userName: 'Alice' }]);
        mockGetMyPermission.mockResolvedValue('Edit');

        // Act
        await loadList();

        // Assert
        expect(mockGetProjectMembers).toHaveBeenCalledWith('owner1', 'proj1');
        expect(mockGetMyPermission).toHaveBeenCalledWith('owner1', 'proj1');
    });

    it('handles status change and updates badge', async () => {
        // Arrange
        mockUpdateMomentStatus.mockResolvedValue({ status: 'Done' });
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([
            { sequenceNumber: 1, statement: 'Test moment', type: 'Story', status: 'ToDo' },
        ]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProjectMembers.mockResolvedValue([]);
        mockGetMyPermission.mockResolvedValue('Edit');
        await loadList();

        // Act
        const statusSelect = document.querySelector('.status-dropdown') as HTMLSelectElement;
        statusSelect.value = 'Done';
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            const badge = document.querySelector('.status-badge')!;
            expect(badge.textContent).toBe('Done');
        });
    });

    it('handles estimate change and recalculates total effort', async () => {
        // Arrange
        mockUpdateMomentEstimate.mockResolvedValue(undefined);
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([
            { sequenceNumber: 1, statement: 'Moment', type: 'Story', status: 'ToDo', effortEstimate: null, ownerId: null },
        ]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProjectMembers.mockResolvedValue([]);
        mockGetMyPermission.mockResolvedValue('Edit');
        await loadList();

        // Act
        const estimateSelect = document.querySelector('.estimate-dropdown') as HTMLSelectElement;
        estimateSelect.value = 'M';
        estimateSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateMomentEstimate).toHaveBeenCalled();
        });
    });

    it('invokes navigate when view link is clicked', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([
            { id: 10, name: 'Week 1', startDate: '2024-01-01', endDate: '2024-01-14' },
        ]);
        mockGetMomentsByStride.mockResolvedValue([
            { sequenceNumber: 55, statement: 'Moment', type: 'Story', status: 'ToDo' },
        ]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProjectMembers.mockResolvedValue([]);
        mockGetMyPermission.mockResolvedValue('Edit');
        await loadList();

        // Act
        const viewLink = document.querySelector('a[data-moment-view]') as HTMLAnchorElement;
        viewLink.click();

        // Assert
        expect(mockNavigate).toHaveBeenCalled();
    });

    it('handles getMyPermission rejection gracefully', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetMyPermission.mockRejectedValue(new Error('permission error'));

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('o', 'p', navDiv, contentDiv, { permission: 'Edit' });

        const board = document.querySelector('#stride-board')!;
        // Act
        // Assert
        expect(board).toBeTruthy();
    });

    it('updates countdown with ended stride', async () => {
        // Arrange
        const pastDate = new Date(Date.now() - 86400000 * 5).toISOString();
        document.body.innerHTML += `<span class="stride-countdown" data-end-date="${pastDate}"></span>`;

        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('o', 'p', navDiv, contentDiv, { permission: 'Edit' });

        const el = document.querySelector('.stride-countdown')!;
        // Act
        // Assert
        expect(el.textContent).toBe('Ended');
        expect(el.classList.contains('stride-countdown--ended')).toBe(true);
    });

    it('updates countdown with ending today stride', async () => {
        // Arrange
        const todayDate = new Date(Date.now()).toISOString();
        document.body.innerHTML += `<span class="stride-countdown" data-end-date="${todayDate}"></span>`;

        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('o', 'p', navDiv, contentDiv, { permission: 'Edit' });

        const el = document.querySelector('.stride-countdown')!;
        // Act
        // Assert
        expect(el.textContent).toBe('Ends today');
    });

    it('updates countdown with ending soon stride (within 3 days)', async () => {
        // Arrange
        const soonDate = new Date(Date.now() + 86400000 * 2).toISOString();
        document.body.innerHTML += `<span class="stride-countdown" data-end-date="${soonDate}"></span>`;

        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('o', 'p', navDiv, contentDiv, { permission: 'Edit' });

        const el = document.querySelector('.stride-countdown')!;
        // Act
        // Assert
        expect(el.textContent).toMatch(/\d+ days? left/);
    });

    it('updates countdown with healthy stride', async () => {
        // Arrange
        const farDate = new Date(Date.now() + 86400000 * 10).toISOString();
        document.body.innerHTML += `<span class="stride-countdown" data-end-date="${farDate}"></span>`;

        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('o', 'p', navDiv, contentDiv, { permission: 'Edit' });

        const el = document.querySelector('.stride-countdown')!;
        // Act
        // Assert
        expect(el.textContent).toMatch(/\d+ days left/);
        expect(el.classList.contains('stride-countdown--healthy')).toBe(true);
    });

    it('navigates to history page on history link click', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);

        await loadList();

        const historyLink = document.querySelector('#iteration-history-link') as HTMLAnchorElement;
        historyLink.click();
        // Act

        // Assert
        expect(mockNavigate).toHaveBeenCalledWith('/owner1/proj1/iterations', expect.any(HTMLElement), expect.any(HTMLElement));
    });

    it('handles getProjectMembers rejection gracefully', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProjectMembers.mockRejectedValue(new Error('members error'));

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('o', 'p', navDiv, contentDiv, { permission: 'Edit' });

        const board = document.querySelector('#stride-board')!;
        // Act
        // Assert
        expect(board).toBeTruthy();
    });

    it('handles getProject rejection in tryFetchProjectData', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProject.mockRejectedValue(new Error('project error'));

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('o', 'p', navDiv, contentDiv, { permission: 'Edit' });

        const board = document.querySelector('#stride-board')!;
        // Act
        // Assert
        expect(board).toBeTruthy();
    });

    it('opens stride create modal with onCreated callback when create button clicked', async () => {
        // Arrange
        mockGetIterations.mockResolvedValue([defaultIteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        let capturedOnCreated: (() => void) | undefined;
        mockOpenStrideCreateModal.mockImplementation((opts: Record<string, unknown>) => {
            capturedOnCreated = opts.onCreated as () => void;
        });

        await loadList();

        const createBtn = document.querySelector('#create-stride-btn') as HTMLElement;
        createBtn.click();
        // Act

        // Assert
        expect(mockOpenStrideCreateModal).toHaveBeenCalled();
        expect(capturedOnCreated).toBeDefined();
        expect(typeof capturedOnCreated).toBe('function');
    });
});

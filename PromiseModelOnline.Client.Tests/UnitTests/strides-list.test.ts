import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAssignMomentToStride = vi.hoisted(() => vi.fn());
const mockProgressStride = vi.hoisted(() => vi.fn());
const mockBuildGraphViewHref = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockGetProject = vi.hoisted(() => vi.fn());
const mockGetIterations = vi.hoisted(() => vi.fn());
const mockGetStridesByIteration = vi.hoisted(() => vi.fn());
const mockGetMomentsByStride = vi.hoisted(() => vi.fn());
const mockGetMomentsByIteration = vi.hoisted(() => vi.fn());
const mockGetProjectMembers = vi.hoisted(() => vi.fn());
const mockGetMyPermission = vi.hoisted(() => vi.fn());
const mockUpdateMomentStatus = vi.hoisted(() => vi.fn());
const mockUpdateMomentEstimate = vi.hoisted(() => vi.fn());
const mockUpdateMomentOwner = vi.hoisted(() => vi.fn());
const mockUpdateMomentType = vi.hoisted(() => vi.fn());
const mockOpenIterationCreateModal = vi.hoisted(() => vi.fn());
const mockOpenStrideCreateModal = vi.hoisted(() => vi.fn());

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

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    getIterations: mockGetIterations,
    getStridesByIteration: mockGetStridesByIteration,
    getMomentsByStride: mockGetMomentsByStride,
    getMomentsByIteration: mockGetMomentsByIteration,
    getProjectMembers: mockGetProjectMembers,
    getMyPermission: mockGetMyPermission,
    progressStride: mockProgressStride,
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

const mockBootstrapModal = { getOrCreateInstance: vi.fn().mockReturnValue({ show: vi.fn(), hide: vi.fn() }) };

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    (globalThis as Record<string, unknown>).bootstrap = {
        Modal: mockBootstrapModal,
        ScrollSpy: { getOrCreateInstance: vi.fn() },
    };
    if (typeof window.scrollTo !== 'function') {
        window.scrollTo = vi.fn();
    }
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
});

describe('loadStridesList', () => {
    it('exports expected function', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.loadStridesList).toBeDefined();
    });
});

describe('applyPermissionUI', () => {
    it('disables controls when canEdit is false', async () => {
        // Arrange
        document.body.innerHTML = `
            <select class="status-dropdown"></select>
            <select class="estimate-dropdown"></select>
            <select class="owner-dropdown"></select>
            <select class="moment-type-dropdown"></select>
            <button class="progress-stride-btn">Progress</button>
        `;
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        mod.applyPermissionUI(false);
        const controls = document.querySelectorAll('.status-dropdown, .estimate-dropdown, .owner-dropdown, .moment-type-dropdown');
        // Act
        for (const el of controls) expect((el as HTMLInputElement).disabled).toBe(true);
        // Assert
        expect(document.querySelector('.progress-stride-btn')!.classList.contains('hidden')).toBe(true);
    });

    it('enables controls when canEdit is true', async () => {
        // Arrange
        document.body.innerHTML = '<select class="status-dropdown"></select><button class="progress-stride-btn">Progress</button>';
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Act
        mod.applyPermissionUI(true);
        // Assert
        expect((document.querySelector('.status-dropdown') as HTMLInputElement).disabled).toBe(false);
        expect(document.querySelector('.progress-stride-btn')!.classList.contains('hidden')).toBe(false);
    });

    it('does not throw when controls are missing', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(() => mod.applyPermissionUI(false)).not.toThrow();
    });

    it('does not throw when progress buttons are missing', async () => {
        // Arrange
        document.body.innerHTML = '<select class="status-dropdown"></select>';
        // Act
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(() => mod.applyPermissionUI(true)).not.toThrow();
    });
});

describe('getStrideStartDateValue', () => {
    it('returns timestamp for valid date', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.getStrideStartDateValue({ startDate: '2024-06-15' })).toBeGreaterThan(0);
    });
    it('returns 0 for invalid date', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.getStrideStartDateValue({ startDate: 'not-a-date' })).toBe(0);
    });
    it('returns 0 when stride is null', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.getStrideStartDateValue(null as unknown as Record<string, unknown>)).toBe(0);
    });
    it('returns 0 when stride is undefined', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.getStrideStartDateValue(undefined as unknown as Record<string, unknown>)).toBe(0);
    });
    it('returns 0 when startDate is missing', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.getStrideStartDateValue({})).toBe(0);
    });
    it('returns 0 for empty string date', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.getStrideStartDateValue({ startDate: '' })).toBe(0);
    });
    it('parses ISO date strings', async () => {
        // Arrange
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        // Assert
        expect(mod.getStrideStartDateValue({ startDate: '2024-01-01T00:00:00Z' })).toBeGreaterThan(0);
    });
});

describe('handleMoveToBacklog', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="backlog-section">
                <div class="backlog-content"><table class="promisemodel-table"><tbody></tbody></table></div>
            </div>
            <div id="move-to-backlog-modal">
                <p id="move-to-backlog-modal-text"></p>
                <button id="move-to-backlog-modal-confirm">Confirm</button>
            </div>
        `;
    });

    it('calls assignMomentToStride on confirm', async () => {
        mockAssignMomentToStride.mockResolvedValue({ sequenceNumber: 1, statement: 'Test', type: 'Story', status: 'Todo' });
        mockBuildGraphViewHref.mockReturnValue('/graph/moment-1');

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.momentId = '1';
        await mod.handleMoveToBacklog(button, 'owner1', 'proj1');

        const confirmBtn = document.getElementById('move-to-backlog-modal-confirm') as HTMLButtonElement;
        confirmBtn.click();

        await vi.waitFor(() => expect(mockAssignMomentToStride).toHaveBeenCalled());
    });

    it('sends flowId when button inside data-flow-id', async () => {
        mockAssignMomentToStride.mockResolvedValue({ sequenceNumber: 2, statement: 'Moment', type: 'Job', status: 'InProgress' });
        mockBuildGraphViewHref.mockReturnValue('/graph/moment-2');

        document.body.innerHTML = `
            <div data-flow-id="42">
                <button data-moment-id="2" class="move-to-backlog-btn">Backlog</button>
            </div>
            <div id="backlog-section">
                <div class="backlog-content"><table class="promisemodel-table"><tbody></tbody></table></div>
            </div>
            <div id="move-to-backlog-modal">
                <p id="move-to-backlog-modal-text"></p>
                <button id="move-to-backlog-modal-confirm">Confirm</button>
            </div>
        `;

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.querySelector('button')!;
        await mod.handleMoveToBacklog(button, 'owner1', 'proj1');

        const confirmBtn = document.getElementById('move-to-backlog-modal-confirm') as HTMLButtonElement;
        confirmBtn.click();

        await vi.waitFor(() => expect(mockAssignMomentToStride).toHaveBeenCalledWith('owner1', 'proj1', 2, undefined, 42));
    });

    it('shows toast on API error', async () => {
        mockAssignMomentToStride.mockRejectedValue(new Error('API error'));

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.momentId = '1';
        await mod.handleMoveToBacklog(button, 'owner1', 'proj1');

        const confirmBtn = document.getElementById('move-to-backlog-modal-confirm') as HTMLButtonElement;
        confirmBtn.click();

        await vi.waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Failed to move moment', 'error'));
    });

    it('does nothing when modal elements are missing', async () => {
        // Arrange
        document.body.innerHTML = '<div id="backlog-section"><div class="backlog-content"><table class="promisemodel-table"><tbody></tbody></table></div></div>';
        mockBuildGraphViewHref.mockReturnValue('/graph/moment-1');

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.momentId = '1';
        // Act
        await mod.handleMoveToBacklog(button, 'owner1', 'proj1');
        // Assert
        expect(mockAssignMomentToStride).not.toHaveBeenCalled();
    });
});

describe('handleMoveToStride', () => {
    it('does nothing when no stride target selected', async () => {
        // Arrange
        document.body.innerHTML = '<div id="move-to-stride-modal"><p id="move-to-stride-modal-text"></p><button id="move-to-stride-modal-confirm">Confirm</button></div>';
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.momentId = '1';
        button.className = 'move-to-stride-from-backlog-btn';
        // Act
        await mod.handleMoveToStride(button, 'owner1', 'proj1');
        // Assert
        expect(mockAssignMomentToStride).not.toHaveBeenCalled();
    });

    it('does nothing when strideId is NaN', async () => {
        // Arrange
        document.body.innerHTML = '<div id="move-to-stride-modal"><p id="move-to-stride-modal-text"></p><button id="move-to-stride-modal-confirm">Confirm</button></div>';
        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const row = document.createElement('tr');
        row.dataset.momentId = '1';
        const select = document.createElement('select');
        select.className = 'backlog-target-stride';
        const opt = document.createElement('option');
        opt.value = '';
        opt.selected = true;
        select.append(opt);
        const button = document.createElement('button');
        button.className = 'move-to-stride-from-backlog-btn';
        button.dataset.momentId = '1';
        row.append(select, button);
        document.body.append(row);
        // Act
        await mod.handleMoveToStride(button, 'owner1', 'proj1');
        // Assert
        expect(mockAssignMomentToStride).not.toHaveBeenCalled();
    });

    it('calls assignMomentToStride on confirm', async () => {
        mockAssignMomentToStride.mockResolvedValue({ sequenceNumber: 1, statement: 'Test', type: 'Story', status: 'Todo' });
        mockBuildGraphViewHref.mockReturnValue('/graph/moment-1');

        document.body.innerHTML = `
            <div class="stride-card" data-stride-id="10">
                <table class="promisemodel-table"><tbody></tbody></table>
                <span class="stride-total-effort">Total Effort: 0</span>
            </div>
            <div id="move-to-stride-modal">
                <p id="move-to-stride-modal-text"></p>
                <button id="move-to-stride-modal-confirm">Confirm</button>
            </div>
        `;

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const row = document.createElement('tr');
        row.dataset.momentId = '1';
        const select = document.createElement('select');
        select.className = 'backlog-target-stride';
        const opt = document.createElement('option');
        opt.value = '10';
        opt.selected = true;
        select.append(opt);
        const button = document.createElement('button');
        button.className = 'move-to-stride-from-backlog-btn';
        button.dataset.momentId = '1';
        row.append(select, button);
        document.body.append(row);

        await mod.handleMoveToStride(button, 'owner1', 'proj1');

        const confirmBtn = document.getElementById('move-to-stride-modal-confirm') as HTMLButtonElement;
        confirmBtn.click();

        await vi.waitFor(() => expect(mockAssignMomentToStride).toHaveBeenCalled());
    });

    it('shows toast on API error', async () => {
        mockAssignMomentToStride.mockRejectedValue(new Error('API error'));
        mockBuildGraphViewHref.mockReturnValue('/graph/moment-1');

        document.body.innerHTML = `
            <div class="stride-card" data-stride-id="10">
                <table class="promisemodel-table"><tbody></tbody></table>
                <span class="stride-total-effort">Total Effort: 0</span>
            </div>
            <div id="move-to-stride-modal">
                <p id="move-to-stride-modal-text"></p>
                <button id="move-to-stride-modal-confirm">Confirm</button>
            </div>
        `;

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const row = document.createElement('tr');
        row.dataset.momentId = '1';
        const select = document.createElement('select');
        select.className = 'backlog-target-stride';
        const opt = document.createElement('option');
        opt.value = '10';
        opt.selected = true;
        select.append(opt);
        const button = document.createElement('button');
        button.className = 'move-to-stride-from-backlog-btn';
        button.dataset.momentId = '1';
        row.append(select, button);
        document.body.append(row);

        await mod.handleMoveToStride(button, 'owner1', 'proj1');

        const confirmBtn = document.getElementById('move-to-stride-modal-confirm') as HTMLButtonElement;
        confirmBtn.click();

        await vi.waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Failed to move moment', 'error'));
    });
});

describe('handleProgressStride', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="stride-board">
                <div class="stride-card" data-stride-id="1">
                    <div class="stride-header"><h3>Stride 1</h3></div>
                    <div class="stride-moments">
                        <table class="promisemodel-table">
                            <tbody>
                                <tr data-moment-id="1">
                                    <td>Moment 1</td>
                                    <td>
                                        <span class="status-badge status-inprogress">InProgress</span>
                                        <select class="status-dropdown">
                                            <option value="Todo">Todo</option>
                                            <option value="InProgress" selected>InProgress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </td>
                                    <td><select class="estimate-dropdown" data-current-estimate="M"></select></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <span class="stride-total-effort">Total Effort: 0</span>
                </div>
                <div class="stride-card" data-stride-id="2">
                    <div class="stride-header"><h3>Stride 2</h3></div>
                    <div class="stride-moments">
                        <table class="promisemodel-table"><tbody></tbody></table>
                    </div>
                    <span class="stride-total-effort">Total Effort: 0</span>
                </div>
            </div>
            <div id="error-text"></div>
            <div id="success-text"></div>
            <div id="backlog-section"></div>
        `;
        mockBuildGraphViewHref.mockReturnValue('/graph/moment-1');
    });

    it('progresses stride when confirm is clicked', async () => {
        // Arrange
        mockProgressStride.mockResolvedValue(undefined);

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.strideId = '1';

        const promise = mod.handleProgressStride(button, 'owner1', 'proj1');

        await vi.waitFor(() => expect(document.querySelector('#progress-stride-modal-confirm')).not.toBeNull());
        (document.querySelector('#progress-stride-modal-confirm') as HTMLButtonElement).click();

        // Act
        await promise;
        // Assert
        expect(mockProgressStride).toHaveBeenCalledWith('owner1', 'proj1', 1);
    });

    it('shows success message when moments moved to visible target', async () => {
        // Arrange
        mockProgressStride.mockResolvedValue(undefined);

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.strideId = '1';

        const promise = mod.handleProgressStride(button, 'owner1', 'proj1');

        await vi.waitFor(() => expect(document.querySelector('#progress-stride-modal-confirm')).not.toBeNull());
        (document.querySelector('#progress-stride-modal-confirm') as HTMLButtonElement).click();

        // Act
        await promise;
        // Assert
        expect(document.getElementById('success-text')!.textContent).toContain('Moved');
    });

    it('shows message when no unfinished moments', async () => {
        // Arrange
        (document.querySelector('.status-dropdown') as HTMLSelectElement).value = 'Done';
        (document.querySelector('.status-badge') as HTMLElement).textContent = 'Done';
        mockProgressStride.mockResolvedValue(undefined);

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.strideId = '1';

        const promise = mod.handleProgressStride(button, 'owner1', 'proj1');

        await vi.waitFor(() => expect(document.querySelector('#progress-stride-modal-confirm')).not.toBeNull());
        (document.querySelector('#progress-stride-modal-confirm') as HTMLButtonElement).click();

        // Act
        await promise;
        // Assert
        expect(document.getElementById('success-text')!.textContent).toContain('No unfinished moments');
    });

    it('shows toast on API error', async () => {
        // Arrange
        mockProgressStride.mockRejectedValue(new Error('API error'));

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.strideId = '1';

        const promise = mod.handleProgressStride(button, 'owner1', 'proj1');

        await vi.waitFor(() => expect(document.querySelector('#progress-stride-modal-confirm')).not.toBeNull());
        (document.querySelector('#progress-stride-modal-confirm') as HTMLButtonElement).click();

        // Act
        await promise;
        // Assert
        expect(mockShowToast).toHaveBeenCalledWith('Failed to progress stride', 'error');
    });

    it('shows success without targetVisible when no next card DOM element', async () => {
        // Arrange
        mockProgressStride.mockResolvedValue(undefined);

        document.body.innerHTML = `
            <div class="stride-card" data-stride-id="99">
                <div class="stride-header"><h3>Lone Stride</h3></div>
                <div class="stride-moments">
                    <table class="promisemodel-table"><tbody>
                        <tr data-moment-id="5">
                            <td>Moment</td>
                            <td><select class="status-dropdown"><option value="Todo" selected>Todo</option></select></td>
                            <td><select class="estimate-dropdown" data-current-estimate="M"></select></td>
                        </tr>
                    </tbody></table>
                </div>
            </div>
            <div id="error-text"></div>
            <div id="success-text"></div>
        `;

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.strideId = '99';
        const promise = mod.handleProgressStride(button, 'owner1', 'proj1');

        await vi.waitFor(() => expect(document.querySelector('#progress-stride-modal-confirm')).not.toBeNull());
        (document.querySelector('#progress-stride-modal-confirm') as HTMLButtonElement).click();
        await promise;

        // Act
        const successEl = document.getElementById('success-text')!;
        // Assert
        expect(successEl.textContent).toContain('Moved');
    });

    it('shows success moved message even when no next stride exists', async () => {
        // Arrange
        mockProgressStride.mockResolvedValue(undefined);

        document.body.innerHTML = `
            <div class="stride-card" data-stride-id="10">
                <div class="stride-header"><h3>Solo</h3></div>
                <div class="stride-moments">
                    <table class="promisemodel-table"><tbody>
                        <tr data-moment-id="1">
                            <td>M1</td>
                            <td><span class="status-badge status-todo">Todo</span><select class="status-dropdown"><option value="Todo" selected>Todo</option></select></td>
                            <td><select class="estimate-dropdown" data-current-estimate="M"></select></td>
                        </tr>
                    </tbody></table>
                </div>
            </div>
            <div id="error-text"></div>
            <div id="success-text"></div>
        `;

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.strideId = '10';
        const promise = mod.handleProgressStride(button, 'owner1', 'proj1');

        await vi.waitFor(() => expect(document.querySelector('#progress-stride-modal-confirm')).not.toBeNull());
        (document.querySelector('#progress-stride-modal-confirm') as HTMLButtonElement).click();
        // Act
        await promise;

        // Assert
        expect(mockProgressStride).toHaveBeenCalledWith('owner1', 'proj1', 10);
        expect(document.getElementById('success-text')!.textContent).toContain('Moved');
    });

    it('handles missing current card in DOM update', async () => {
        // Arrange
        mockProgressStride.mockResolvedValue(undefined);
        document.body.innerHTML = `<div id="error-text"></div><div id="success-text"></div>`;

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const button = document.createElement('button');
        button.dataset.strideId = '999';
        const promise = mod.handleProgressStride(button, 'owner1', 'proj1');

        await vi.waitFor(() => expect(document.querySelector('#progress-stride-modal-confirm')).not.toBeNull());
        (document.querySelector('#progress-stride-modal-confirm') as HTMLButtonElement).click();
        // Act
        await promise;

        // Assert
        expect(mockProgressStride).toHaveBeenCalledWith('owner1', 'proj1', 999);
        const successEl = document.getElementById('success-text')!;
        expect(successEl.textContent).toContain('Stride progressed');
    });
});

describe('setUpCreateStrideButton (branch coverage)', () => {
    it('opens iteration create modal when no cached iterations exist', async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="stride-board"></div>
            <span id="error-text"></span>
            <button id="create-stride-btn"><span id="create-stride-btn-label">New Stride</span></button>
        `;
        mockGetIterations.mockResolvedValue([]);
        mockGetProject.mockResolvedValue({});

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        await loadStridesList('owner1', 'proj1', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const btn = document.querySelector('#create-stride-btn') as HTMLElement;
        // Act
        btn.click();

        // Assert
        expect(mockOpenIterationCreateModal).toHaveBeenCalledWith('owner1', 'proj1', expect.any(Function));
        expect(mockOpenStrideCreateModal).not.toHaveBeenCalled();
    });

    it('executes onCreated callback which reloads the strides list', async () => {
        // Arrange
        document.body.innerHTML = `
            <div id="stride-board"></div>
            <span id="error-text"></span>
            <span id="project-title"></span>
            <button id="create-stride-btn"><span id="create-stride-btn-label">New Stride</span></button>
        `;
        const iteration = { id: 1, name: 'S1', createdAt: '2024-01-01T00:00:00Z' };
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([iteration]);
        mockGetStridesByIteration.mockResolvedValue([]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProjectMembers.mockResolvedValue([]);
        mockGetMyPermission.mockResolvedValue('Edit');

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('owner1', 'proj1', navDiv, contentDiv, { permission: 'Edit' });

        mockOpenStrideCreateModal.mockImplementation((opts: Record<string, unknown>) => {
            if (typeof opts.onCreated === 'function') (opts.onCreated as () => void)();
        });

        const btn = document.querySelector('#create-stride-btn') as HTMLElement;
        btn.click();

        // Act
        await vi.waitFor(() => {
            // Assert
            expect(mockGetIterations).toHaveBeenCalledTimes(2);
        });
    });
});

describe('ensureStrideTbody', () => {
    it('creates tbody for target stride card with no table (lines 1017-1020)', async () => {
        // Arrange
        mockAssignMomentToStride.mockResolvedValue({ sequenceNumber: 1, statement: 'Test', type: 'Story', status: 'Todo' });
        mockBuildGraphViewHref.mockReturnValue('/graph/moment-1');

        document.body.innerHTML = `
            <div class="stride-card" data-stride-id="10">
                <div class="stride-moments"></div>
                <span class="stride-total-effort">Total Effort: 0</span>
            </div>
            <div id="move-to-stride-modal">
                <p id="move-to-stride-modal-text"></p>
                <button id="move-to-stride-modal-confirm">Confirm</button>
            </div>
        `;

        const mod = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const row = document.createElement('tr');
        row.dataset.momentId = '1';
        const select = document.createElement('select');
        select.className = 'backlog-target-stride';
        const opt = document.createElement('option');
        opt.value = '10';
        opt.selected = true;
        select.append(opt);
        const button = document.createElement('button');
        button.className = 'move-to-stride-from-backlog-btn';
        button.dataset.momentId = '1';
        row.append(select, button);
        document.body.append(row);

        await mod.handleMoveToStride(button, 'owner1', 'proj1');

        (document.getElementById('move-to-stride-modal-confirm') as HTMLButtonElement).click();

        // Act
        await vi.waitFor(() => {
            // Assert
            expect(mockAssignMomentToStride).toHaveBeenCalled();
        });

        const targetCard = document.querySelector('.stride-card[data-stride-id="10"]');
        const tbody = targetCard?.querySelector('table.promisemodel-table tbody');
        expect(tbody).not.toBeNull();
        expect(tbody?.children.length).toBe(1);
    });
});

describe('inline moment controls via event delegation', () => {
    it('calls updateMomentOwner on owner-dropdown change (line 1120-1121)', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-06-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([{ id: 10, name: 'Stride 1', startDate: '2024-06-01' }]);
        mockGetMomentsByStride.mockResolvedValue([
            { sequenceNumber: 1, statement: 'M 1', type: 'Story', status: 'Todo', ownerId: null, effortEstimate: null },
        ]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProjectMembers.mockResolvedValue([]);
        mockGetMyPermission.mockResolvedValue('Edit');
        mockUpdateMomentOwner.mockResolvedValue({ ownerId: 0 });

        document.body.innerHTML = `
            <div id="stride-board"></div>
            <span id="error-text"></span>
            <span id="project-title"></span>
            <button id="create-stride-btn"><span id="create-stride-btn-label">New Stride</span></button>
        `;

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('owner1', 'proj1', navDiv, contentDiv, { permission: 'Edit' });

        // Act
        const sel = document.querySelector('.owner-dropdown') as HTMLSelectElement;
        // Assert
        expect(sel).not.toBeNull();
        const opt = document.createElement('option');
        opt.value = '5';
        opt.textContent = 'Alice';
        sel.append(opt);
        sel.value = '5';
        sel.dispatchEvent(new Event('change', { bubbles: true }));

        await vi.waitFor(() => {
            expect(mockUpdateMomentOwner).toHaveBeenCalledWith('owner1', 'proj1', 1, 5, undefined);
        });
    });

    it('calls updateMomentType on moment-type-dropdown change (line 1122-1123)', async () => {
        // Arrange
        mockGetProject.mockResolvedValue({ name: 'Test' });
        mockGetIterations.mockResolvedValue([{ id: 1, name: 'S1', createdAt: '2024-06-01T00:00:00Z' }]);
        mockGetStridesByIteration.mockResolvedValue([{ id: 10, name: 'Stride 1', startDate: '2024-06-01' }]);
        mockGetMomentsByStride.mockResolvedValue([
            { sequenceNumber: 1, statement: 'M 1', type: 'Story', status: 'Todo', ownerId: null, effortEstimate: null },
        ]);
        mockGetMomentsByIteration.mockResolvedValue([]);
        mockGetProjectMembers.mockResolvedValue([]);
        mockGetMyPermission.mockResolvedValue('Edit');
        mockUpdateMomentType.mockResolvedValue(undefined);

        document.body.innerHTML = `
            <div id="stride-board"></div>
            <span id="error-text"></span>
            <span id="project-title"></span>
            <button id="create-stride-btn"><span id="create-stride-btn-label">New Stride</span></button>
        `;

        const { loadStridesList } = await import('../../PromiseModelOnline.Client/wwwroot/js/strides/list.ts');
        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        await loadStridesList('owner1', 'proj1', navDiv, contentDiv, { permission: 'Edit' });

        // Act
        const sel = document.querySelector('.moment-type-dropdown') as HTMLSelectElement;
        // Assert
        expect(sel).not.toBeNull();
        sel.value = 'Job';
        sel.dispatchEvent(new Event('change', { bubbles: true }));

        await vi.waitFor(() => {
            expect(mockUpdateMomentType).toHaveBeenCalledWith('owner1', 'proj1', 1, 'Job', undefined);
        });
    });
});

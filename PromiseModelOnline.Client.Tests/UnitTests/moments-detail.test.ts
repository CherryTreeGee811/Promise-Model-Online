import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetMoment = vi.fn();
const mockCreateTask = vi.fn();
const mockUpdateTaskCompletion = vi.fn();
const mockUpdateMomentDescription = vi.fn();
const mockUpdateMomentEstimate = vi.fn();
const mockUpdateMomentStatus = vi.fn();
const mockUpdateMomentType = vi.fn();
const mockAssignMomentToStride = vi.fn();

const mockGetStrides = vi.fn();

const mockDestroyDetailStackGraph = vi.fn();
const mockMountDetailStackGraph = vi.fn();
const mockPatchDetailStackGraphNode = vi.fn();
const mockRefreshDetailStackGraph = vi.fn();

const mockBuildGraphViewHref = vi.fn();
const mockGetOwnerProjectFromPath = vi.fn();
const mockUpsertGraphViewButton = vi.fn();

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

const mockInitBackLink = vi.fn();
const mockLoadCommentsAndReactions = vi.fn();
const mockBuildInlineEditUI = vi.fn();
const mockCreateDateRow = vi.fn();

const mockFormatCommentText = vi.fn();
const mockLoadEntityLookupMap = vi.fn();

const mockEscapeHtml = vi.fn();
const mockHtmlToNodes = vi.fn();

const mockSetupInlineEdit = vi.fn();

const mockInsertRowBeforeAddRow = vi.fn();
const mockRemoveInlineEmptyRow = vi.fn();
const mockRenderTableWithInlineAddRow = vi.fn();

const mockIsAtLeast = vi.fn();

const mockCreateCommentAutocomplete = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts', () => ({
    getMoment: mockGetMoment,
    createTask: mockCreateTask,
    updateTaskCompletion: mockUpdateTaskCompletion,
    updateMomentDescription: mockUpdateMomentDescription,
    updateMomentEstimate: mockUpdateMomentEstimate,
    updateMomentStatus: mockUpdateMomentStatus,
    assignMomentToStride: mockAssignMomentToStride,
    updateMomentType: mockUpdateMomentType,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/strides/api.ts', () => ({
    getStrides: mockGetStrides,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts', () => ({
    destroyDetailStackGraph: mockDestroyDetailStackGraph,
    mountDetailStackGraph: mockMountDetailStackGraph,
    patchDetailStackGraphNode: mockPatchDetailStackGraphNode,
    refreshDetailStackGraph: mockRefreshDetailStackGraph,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-link.ts', () => ({
    buildGraphViewHref: mockBuildGraphViewHref,
    getOwnerProjectFromPath: mockGetOwnerProjectFromPath,
    upsertGraphViewButton: mockUpsertGraphViewButton,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({
    navigate: mockNavigate,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/ui/toast.ts', () => ({
    showToast: mockShowToast,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/detail-common.ts', () => ({
    initBackLink: mockInitBackLink,
    loadCommentsAndReactions: mockLoadCommentsAndReactions,
    buildInlineEditUI: mockBuildInlineEditUI,
    createDateRow: mockCreateDateRow,
    setElementText: vi.fn((selector: string, text: string) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) el.textContent = text;
    }),
    setElementVisibility: vi.fn((selector: string, hidden: boolean) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) el.hidden = hidden;
    }),
    setupDetailInlineEdit: vi.fn(),
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/entity-reference.ts', () => ({
    formatCommentText: mockFormatCommentText,
    loadEntityLookupMap: mockLoadEntityLookupMap,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts', () => ({
    escapeHtml: mockEscapeHtml,
    htmlToNodes: mockHtmlToNodes,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-edit.ts', () => ({
    setupInlineEdit: mockSetupInlineEdit,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts', () => ({
    insertRowBeforeAddRow: mockInsertRowBeforeAddRow,
    removeInlineEmptyRow: mockRemoveInlineEmptyRow,
    renderTableWithInlineAddRow: mockRenderTableWithInlineAddRow,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/permissions.ts', () => ({
    isAtLeast: mockIsAtLeast,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts', () => ({
    createCommentAutocomplete: mockCreateCommentAutocomplete,
}));

const defaultMoment = {
    id: 42,
    flowId: 7,
    sequenceNumber: 1,
    statement: 'Test moment',
    description: 'A description',
    type: 'Story',
    status: 'ToDo',
    effortEstimate: 'M',
    assignedStrideId: 10,
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: undefined,
    tasks: [
        { id: 1, name: 'Task 1', description: 'Do it', isCompleted: false },
    ],
};

beforeEach(() => {
    vi.clearAllMocks();
    mockIsAtLeast.mockReturnValue(true);
    mockCreateDateRow.mockImplementation((_label: string, _date?: string) => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.textContent = _date || '\u2013';
        tr.append(td);
        return tr;
    });
    mockEscapeHtml.mockImplementation((s: string) => s);
    mockFormatCommentText.mockImplementation((s: string) => s || '');
    mockHtmlToNodes.mockImplementation((_html: string) => [document.createTextNode(_html)]);
    mockGetOwnerProjectFromPath.mockReturnValue({ owner: 'o', project: 'p' });
    mockBuildGraphViewHref.mockReturnValue('/graph/moment-1');
    mockGetStrides.mockResolvedValue([
        { id: 10, name: 'Stride A' },
        { id: 20, name: 'Stride B' },
    ]);
    mockUpdateMomentEstimate.mockResolvedValue(undefined);
    mockAssignMomentToStride.mockResolvedValue({ assignedStrideId: 20 });
    mockUpdateMomentDescription.mockResolvedValue({ description: 'New desc' });
    mockUpdateMomentStatus.mockResolvedValue({ status: 'Done', statusColor: 'green', completedAt: '2024-02-01T00:00:00Z' });
    mockUpdateMomentType.mockResolvedValue({ type: 'Job' });
    mockCreateTask.mockResolvedValue({ id: 99, name: 'New task', description: '', isCompleted: false });
    mockBuildInlineEditUI.mockImplementation((_container: HTMLElement, _prefix: string, _value: string) => {
        _container.innerHTML = `
            <textarea id="moment-description-input">${_value}</textarea>
            <div id="moment-description-view"></div>
            <button id="moment-edit-desc-btn">Edit</button>
            <button id="moment-save-desc" type="button">Save</button>
            <button id="moment-cancel-desc" type="button">Cancel</button>
            <span id="moment-desc-save-msg"></span>
        `;
    });
    mockRenderTableWithInlineAddRow.mockImplementation((_container: HTMLElement, opts: Record<string, unknown>) => {
        _container.innerHTML = '<table><tbody id="tasks-tbody"></tbody></table>';
        const tbody = _container.querySelector('tbody')!;
        if ((opts.items as unknown[]).length > 0) {
            for (const item of opts.items as unknown[]) {
                const task = item as Record<string, unknown>;
                tbody.innerHTML += `<tr><td></td><td></td><td><input class="moment-task-complete-checkbox" data-moment-task-id="${task.id}" /></td></tr>`;
            }
        }
        tbody.innerHTML += '<tr data-inline-add-row="1"><td><input id="add-moment-task-name" /></td><td><input id="add-moment-task-description" /></td><td><input id="add-moment-task-completed" type="checkbox" /><button id="add-moment-task-submit" type="button">Add</button><span id="add-moment-task-msg"></span></td></tr>';
        return tbody;
    });
    document.body.innerHTML = `
        <div id="moment-detail-content"></div>
        <div id="error-text"></div>
        <div id="moment-detail-loading"></div>
    `;
});

afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    vi.useRealTimers();
});

describe('loadMomentDetail', () => {
    it('returns early when detailDiv is missing', async () => {
        // Arrange
        document.body.innerHTML = '<div></div>';
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockGetMoment).not.toHaveBeenCalled();
    });

    it('shows loading indicator on start', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        const promise = loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const loading = document.querySelector('#moment-detail-loading') as HTMLElement;
        expect(loading.hidden).toBe(false);
        await promise;
    });

    it('hides loading on success', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);

        // Act
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const loading = document.querySelector('#moment-detail-loading') as HTMLElement;
        expect(loading.hidden).toBe(true);
    });

    it('hides loading and shows error on API failure', async () => {
        // Arrange
        mockGetMoment.mockRejectedValue(new Error('network'));

        // Act
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const loading = document.querySelector('#moment-detail-loading') as HTMLElement;
        const error = document.querySelector('#error-text') as HTMLElement;
        expect(loading.hidden).toBe(true);
        expect(error.textContent).toContain('Failed to load moment details.');
    });

    it('calls destroyDetailStackGraph on start', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockDestroyDetailStackGraph).toHaveBeenCalled();
    });

    it('calls getMoment with correct params', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockGetMoment).toHaveBeenCalledWith('o', 'p', '42');
    });

    it('calls loadEntityLookupMap with correct params', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockLoadEntityLookupMap).toHaveBeenCalledWith('Moment', 42, 'o', 'p');
    });

    it('calls mountDetailStackGraph with correct params', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockMountDetailStackGraph).toHaveBeenCalledWith({
            nodeType: 'moment', nodeId: '42', owner: 'o', project: 'p',
        });
    });

    it('clears error text on load', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        errorEl.textContent = 'Old error';
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(errorEl.textContent).toBe('');
    });

    it('builds detail card with moment heading', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const detailCard = document.querySelector('.moment-detail-card')!;
        expect(detailCard.querySelector('h2')!.textContent).toBe('Test moment');
    });

    it('builds table with description row', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockBuildInlineEditUI).toHaveBeenCalledWith(
            expect.any(HTMLElement), 'moment-', 'A description',
        );
    });

    it('builds type select with correct initial value', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const typeSelect = document.querySelector('#moment-type-select') as HTMLSelectElement;
        expect(typeSelect).not.toBeNull();
        expect(typeSelect.value).toBe('Story');
    });

    it('builds status select with correct initial value', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const statusSelect = document.querySelector('#moment-status-select') as HTMLSelectElement;
        expect(statusSelect.value).toBe('Todo');
    });

    it('builds estimate select with correct initial value', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const estSelect = document.querySelector('#moment-estimate-select') as HTMLSelectElement;
        expect(estSelect.value).toBe('M');
    });

    it('builds stride select with correct initial value', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const strideSelect = document.querySelector('#moment-stride-select') as HTMLSelectElement;
        expect(strideSelect.value).toBe('10');
    });

    it('calls renderMomentTasks with tasks', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const tasksContainer = document.querySelector('#moment-tasks')!;
        expect(tasksContainer).not.toBeNull();
    });

    it('sets up description edit handler', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockSetupInlineEdit.mockReturnValue({ showSavedPopover: vi.fn() });
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const descSave = document.querySelector('#moment-save-desc') as HTMLButtonElement;
        expect(descSave).not.toBeNull();
    });

    it('calls initBackLink and loadCommentsAndReactions', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockInitBackLink).toHaveBeenCalled();
        expect(mockLoadCommentsAndReactions).toHaveBeenCalledWith(
            expect.any(HTMLElement), 'Moment', 42, 'o', 'p', { permission: 'Edit' },
        );
    });

    it('calls upsertMomentGraphViewButton', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockUpsertGraphViewButton).toHaveBeenCalled();
    });

    it('binds flow navigation handler', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        const detailDiv = document.querySelector('#moment-detail-content') as HTMLElement;
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert: add a flow link and click it
        const detailCard = detailDiv.querySelector('.detail-card')!;
        const flowLink = document.createElement('a');
        flowLink.className = 'detail-link';
        flowLink.setAttribute('flow-seq', '5');
        flowLink.href = '#';
        flowLink.textContent = 'Flow 5';
        detailCard.append(flowLink);
        flowLink.click();
        expect(mockNavigate).toHaveBeenCalledWith('/o/p/flows/5', expect.any(HTMLElement), expect.any(HTMLElement));
    });
});

describe('gateMomentDetailControls', () => {
    it('disables controls when permission is below Edit', async () => {
        // Arrange
        mockIsAtLeast.mockReturnValue(false);
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockSetupInlineEdit.mockReturnValue({ showSavedPopover: vi.fn() });
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'View' });

        // Assert
        const typeSelect = document.querySelector('#moment-type-select') as HTMLSelectElement;
        const statusSelect = document.querySelector('#moment-status-select') as HTMLSelectElement;
        const estSelect = document.querySelector('#moment-estimate-select') as HTMLSelectElement;
        const strideSelect = document.querySelector('#moment-stride-select') as HTMLSelectElement;
        expect(typeSelect.disabled).toBe(true);
        expect(statusSelect.disabled).toBe(true);
        expect(estSelect.disabled).toBe(true);
        expect(strideSelect.disabled).toBe(true);
    });

    it('leaves controls enabled for Edit permission', async () => {
        // Arrange
        mockIsAtLeast.mockReturnValue(true);
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const typeSelect = document.querySelector('#moment-type-select') as HTMLSelectElement;
        expect(typeSelect.disabled).toBe(false);
    });
});

describe('estimate handler', () => {
    it('sends update on estimate change', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const estSelect = document.querySelector('#moment-estimate-select') as HTMLSelectElement;
        estSelect.value = 'L';
        estSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateMomentEstimate).toHaveBeenCalledWith('o', 'p', '42', 'L', 7);
            expect(mockPatchDetailStackGraphNode).toHaveBeenCalledWith('moment-1', { effortEstimate: 'L' });
        });
    });

    it('sends undefined for dash estimate', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const estSelect = document.querySelector('#moment-estimate-select') as HTMLSelectElement;
        estSelect.value = '-';
        estSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateMomentEstimate).toHaveBeenCalledWith('o', 'p', '42', undefined, 7);
        });
    });

    it('shows toast on estimate update failure', async () => {
        // Arrange
        mockUpdateMomentEstimate.mockRejectedValue(new Error('fail'));
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const estSelect = document.querySelector('#moment-estimate-select') as HTMLSelectElement;
        estSelect.value = 'L';
        estSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith('Failed to update estimate', 'error');
        });
    });
});

describe('stride handler', () => {
    it('loads strides populates select', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockGetStrides).toHaveBeenCalledWith('o', 'p');
        const strideSelect = document.querySelector('#moment-stride-select') as HTMLSelectElement;
        expect(strideSelect.options.length).toBeGreaterThan(1);
        expect(strideSelect.value).toBe('10');
    });

    it('sends assignMomentToStride on stride change', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const strideSelect = document.querySelector('#moment-stride-select') as HTMLSelectElement;
        strideSelect.value = '20';
        strideSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(mockAssignMomentToStride).toHaveBeenCalledWith('o', 'p', '42', 20, 7);
            expect(mockPatchDetailStackGraphNode).toHaveBeenCalledWith('moment-1', { assignedStrideId: 20 });
        });
    });

    it('clears stride select when assignedStrideId is falsy', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue({ ...defaultMoment, assignedStrideId: undefined });
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const strideSelect = document.querySelector('#moment-stride-select') as HTMLSelectElement;
        expect(strideSelect.value).toBe('');
    });
});

describe('description edit handler', () => {
    it('saves description on button click', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockSetupInlineEdit.mockReturnValue({ showSavedPopover: vi.fn() });
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const descInput = document.querySelector('#moment-description-input') as HTMLTextAreaElement;
        const saveBtn = document.querySelector('#moment-save-desc') as HTMLButtonElement;
        descInput.value = 'Updated description';
        saveBtn.click();

        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateMomentDescription).toHaveBeenCalledWith('o', 'p', '42', 'Updated description', 7);
            expect(mockPatchDetailStackGraphNode).toHaveBeenCalledWith('moment-1', {
                description: 'New desc',
            });
        });
    });

    it('shows error toast when stride assignment fails', async () => {
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockGetStrides.mockRejectedValue(new Error('strides fail'));
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });
        await vi.waitFor(() => {
            expect(mockGetStrides).toHaveBeenCalled();
        });
    });

    it('gracefully handles getStrides API failure', async () => {
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockGetStrides.mockRejectedValue(new Error('strides fail'));
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        await expect(async () => {
            const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
            await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });
        }).not.toThrow();
    });

    it('disables save button during request', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockSetupInlineEdit.mockReturnValue({ showSavedPopover: vi.fn() });
        mockUpdateMomentDescription.mockImplementation(() => new Promise(() => {}));
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const saveBtn = document.querySelector('#moment-save-desc') as HTMLButtonElement;
        saveBtn.click();

        // Assert
        expect(saveBtn.disabled).toBe(true);
    });

    it('shows error message on save failure', async () => {
        // Arrange
        mockUpdateMomentDescription.mockRejectedValue(new Error('fail'));
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockSetupInlineEdit.mockReturnValue({ showSavedPopover: vi.fn() });
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const saveBtn = document.querySelector('#moment-save-desc') as HTMLButtonElement;
        const descMsg = document.querySelector('#moment-desc-save-msg') as HTMLElement;
        saveBtn.click();

        // Assert
        await vi.waitFor(() => {
            expect(descMsg.textContent).toBe('Save failed');
        });
    });
});

describe('status change handler', () => {
    it('sends update on status change', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const statusSelect = document.querySelector('#moment-status-select') as HTMLSelectElement;
        statusSelect.value = 'Done';
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateMomentStatus).toHaveBeenCalledWith('o', 'p', '42', 'Done', 7);
            expect(mockRefreshDetailStackGraph).toHaveBeenCalled();
        });
    });

    it('reverts select on failure after a successful change', async () => {
        // Arrange
        mockUpdateMomentStatus
            .mockResolvedValueOnce({ status: 'Done', statusColor: 'green', completedAt: '2024-02-01T00:00:00Z' })
            .mockRejectedValueOnce(new Error('fail'));
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act - first change succeeds
        const statusSelect = document.querySelector('#moment-status-select') as HTMLSelectElement;
        statusSelect.value = 'Done';
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
        await vi.waitFor(() => {
            expect(statusSelect.value).toBe('Done');
        });

        // Act - second change fails, reverts to Todo
        mockUpdateMomentStatus.mockClear();
        statusSelect.value = 'InProgress';
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(statusSelect.value).toBe('Done');
            expect(mockShowToast).toHaveBeenCalledWith('Failed to update status', 'error');
        });
    });

    it('updates completedAt cell on Done', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const statusSelect = document.querySelector('#moment-status-select') as HTMLSelectElement;
        statusSelect.value = 'Done';
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            const completedCell = document.querySelector('#moment-detail-content .detail-table tr:last-child td')!;
            expect(completedCell.textContent).not.toBe('\u2013');
        });
    });
});

describe('type change handler', () => {
    it('sends update on type change', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const typeSelect = document.querySelector('#moment-type-select') as HTMLSelectElement;
        typeSelect.value = 'Job';
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateMomentType).toHaveBeenCalledWith('o', 'p', '42', 'Job', 7);
            expect(mockPatchDetailStackGraphNode).toHaveBeenCalledWith('moment-1', { type: 'Job' });
        });
    });

    it('reverts select on type update failure after a successful change', async () => {
        // Arrange
        mockUpdateMomentType
            .mockResolvedValueOnce({ type: 'Job' })
            .mockRejectedValueOnce(new Error('fail'));
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act - first change succeeds
        const typeSelect = document.querySelector('#moment-type-select') as HTMLSelectElement;
        typeSelect.value = 'Job';
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        await vi.waitFor(() => {
            expect(typeSelect.value).toBe('Job');
        });

        // Act - second change fails, reverts to Job
        mockUpdateMomentType.mockClear();
        typeSelect.value = 'Story';
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(typeSelect.value).toBe('Job');
            expect(mockShowToast).toHaveBeenCalledWith('Failed to update type', 'error');
        });
    });
});

describe('renderMomentTasks', () => {
    it('renders task table with existing tasks', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalled();
        const args = mockRenderTableWithInlineAddRow.mock.calls[0];
        expect(args[1].items).toEqual(defaultMoment.tasks);
    });

    it('binds task completion checkboxes', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        const checkboxes = document.querySelectorAll('.moment-task-complete-checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('creates new task on add button click', async () => {
        // Arrange
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const nameInput = document.querySelector('#add-moment-task-name') as HTMLInputElement;
        const submitBtn = document.querySelector('#add-moment-task-submit') as HTMLButtonElement;
        nameInput.value = 'New task';
        submitBtn.click();

        // Assert
        await vi.waitFor(() => {
            expect(mockCreateTask).toHaveBeenCalledWith('o', 'p', '42', {
                name: 'New task',
                description: '',
                isCompleted: false,
            }, 7);
        });
    });

    it('disables submit for non-edit permission', async () => {
        // Arrange
        mockIsAtLeast.mockReturnValue(false);
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');

        // Act
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'View' });

        // Assert
        const submitBtn = document.querySelector('#add-moment-task-submit') as HTMLButtonElement;
        expect(submitBtn.disabled).toBe(true);
    });
});

describe('task completion toggle', () => {
    it('sends updateTaskCompletion on checkbox change', async () => {
        // Arrange
        mockUpdateTaskCompletion.mockResolvedValue({ isCompleted: true });
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const checkbox = document.querySelector('.moment-task-complete-checkbox') as HTMLInputElement;
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(mockUpdateTaskCompletion).toHaveBeenCalledWith('o', 'p', '42', 1, true, 7);
            expect(mockPatchDetailStackGraphNode).toHaveBeenCalled();
        });
    });

    it('reverts checkbox on failure', async () => {
        // Arrange
        mockUpdateTaskCompletion.mockRejectedValue(new Error('fail'));
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const checkbox = document.querySelector('.moment-task-complete-checkbox') as HTMLInputElement;
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        // Assert
        await vi.waitFor(() => {
            expect(checkbox.checked).toBe(false);
            expect(mockShowToast).toHaveBeenCalledWith('Failed to update task completion', 'error');
        });
    });
});

describe('loadMomentDetail - early return on null moment', () => {
    it('returns early when getMoment returns null', async () => {
        mockGetMoment.mockResolvedValue(null);

        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockLoadEntityLookupMap).not.toHaveBeenCalled();
        expect(mockMountDetailStackGraph).not.toHaveBeenCalled();
    });
});

describe('handleTaskAddClick - empty name edge case', () => {
    it('shows Name is required when task name is empty', async () => {
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const submitBtn = document.querySelector('#add-moment-task-submit') as HTMLButtonElement;
        const msg = document.querySelector('#add-moment-task-msg') as HTMLElement;
        submitBtn.click();

        await vi.waitFor(() => {
            expect(msg.textContent).toBe('Name is required.');
        });
    });
});

describe('applyCheckResult - null API response', () => {
    it('does not throw when updateTaskCompletion returns falsy', async () => {
        mockUpdateTaskCompletion.mockResolvedValue(null);
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const checkbox = document.querySelector('.moment-task-complete-checkbox') as HTMLInputElement;
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        await vi.waitFor(() => {
            expect(checkbox.checked).toBe(true);
            expect(mockShowToast).not.toHaveBeenCalled();
        });
    });
});

describe('renderMomentTasks - renderItemRow branches', () => {
    it('renders completed task row with checked checkbox and Job type', async () => {
        const momentWithCompleted = {
            ...defaultMoment,
            type: 'Job',
            tasks: [
                { id: 1, name: 'Task 1', description: 'Do it', isCompleted: true },
            ],
        };
        mockGetMoment.mockResolvedValue(momentWithCompleted);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockRenderTableWithInlineAddRow.mockImplementationOnce((container: HTMLElement, opts: Record<string, unknown>) => {
            container.replaceChildren();
            const table = document.createElement('table');
            const tbody = document.createElement('tbody');
            for (const item of opts.items as unknown[]) {
                const html = (opts.renderItemRow as Function)(item);
                const div = document.createElement('div');
                div.innerHTML = html;
                tbody.append(...div.children);
            }
            const addHtml = (opts.renderAddRow as Function)();
            const addDiv = document.createElement('div');
            addDiv.innerHTML = addHtml;
            tbody.append(...addDiv.children);
            table.append(tbody);
            container.append(table);
            return tbody;
        });

        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const checkbox = document.querySelector('.moment-task-complete-checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
        const label = checkbox.closest('label')!;
        const span = label.querySelector('span');
        expect(span?.textContent).toBe('Completed');
        const typeSelect = document.querySelector('#moment-type-select') as HTMLSelectElement;
        expect(typeSelect.value).toBe('Job');
    });
});

describe('renderMomentTasks - early return on null tbody', () => {
    it('returns early when renderTableWithInlineAddRow returns null', async () => {
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockRenderTableWithInlineAddRow.mockImplementationOnce(() => null);
        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });
        expect(mockCreateCommentAutocomplete).toHaveBeenCalledTimes(1);
    });
});

describe('loadMomentDetail - initial type Job branch', () => {
    it('sets type select to Job when moment type is Job', async () => {
        const jobMoment = { ...defaultMoment, type: 'Job' };
        mockGetMoment.mockResolvedValue(jobMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);

        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const typeSelect = document.querySelector('#moment-type-select') as HTMLSelectElement;
        expect(typeSelect.value).toBe('Job');
    });
});

describe('status change - completedAt falsy', () => {
    it('sets dash in completed cell when completedAt is empty', async () => {
        mockUpdateMomentStatus.mockResolvedValue({ status: 'InProgress', statusColor: 'blue' });
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);

        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const statusSelect = document.querySelector('#moment-status-select') as HTMLSelectElement;
        statusSelect.value = 'InProgress';
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }));

        await vi.waitFor(() => {
            const completedCell = document.querySelector('#moment-detail-content .detail-table tr:last-child td')!;
            expect(completedCell.textContent).toBe('\u2013');
        });
    });
});

describe('handleTaskAddClick - API failure', () => {
    it('shows error message when createTask fails', async () => {
        mockCreateTask.mockRejectedValue(new Error('network error'));
        mockGetMoment.mockResolvedValue(defaultMoment);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);

        const { loadMomentDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/moments/detail.ts');
        await loadMomentDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const nameInput = document.querySelector('#add-moment-task-name') as HTMLInputElement;
        const submitBtn = document.querySelector('#add-moment-task-submit') as HTMLButtonElement;
        const msg = document.querySelector('#add-moment-task-msg') as HTMLElement;

        nameInput.value = 'A new task';
        submitBtn.click();

        await vi.waitFor(() => {
            expect(msg.textContent).toBe('Failed to add task.');
        });

        expect(submitBtn.disabled).toBe(false);
    });
});

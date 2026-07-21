import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetPromise = vi.fn();
const mockGetEpicsByPromise = vi.fn();
const mockUpdatePromiseDescription = vi.fn();

const mockCreateEpic = vi.fn();

const mockDestroyDetailStackGraph = vi.fn();
const mockMountDetailStackGraph = vi.fn();
const mockPatchChildMetrics = vi.fn();

const mockBuildGraphViewHref = vi.fn();
const mockGetOwnerProjectFromPath = vi.fn();
const mockUpsertGraphViewButton = vi.fn();

const mockGateDetailControls = vi.fn();
const mockGetStatusHtml = vi.fn();
const mockBindLinkClickHandlers = vi.fn();
const mockSetupDescriptionHandler = vi.fn();
const mockBuildInlineEditUI = vi.fn();
const mockCreateDateRow = vi.fn();
const mockInitBackLink = vi.fn();
const mockLoadCommentsAndReactions = vi.fn();
const mockSetElementVisibility = vi.fn();
const mockSetElementText = vi.fn();

const mockLoadEntityLookupMap = vi.fn();

const mockEscapeHtml = vi.fn();

const mockSetupAddChildForm = vi.fn();

const mockSetupInlineEdit = vi.fn();

const mockRenderTableWithInlineAddRow = vi.fn();

const mockCreateCommentAutocomplete = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/promises/api.ts', () => ({
    getPromise: mockGetPromise,
    getEpicsByPromise: mockGetEpicsByPromise,
    updatePromiseDescription: mockUpdatePromiseDescription,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/epics/api.ts', () => ({
    createEpic: mockCreateEpic,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts', () => ({
    destroyDetailStackGraph: mockDestroyDetailStackGraph,
    mountDetailStackGraph: mockMountDetailStackGraph,
    patchChildMetrics: mockPatchChildMetrics,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/graph-link.ts', () => ({
    buildGraphViewHref: mockBuildGraphViewHref,
    getOwnerProjectFromPath: mockGetOwnerProjectFromPath,
    upsertGraphViewButton: mockUpsertGraphViewButton,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/detail-common.ts', () => ({
    gateDetailControls: mockGateDetailControls,
    getStatusHtml: mockGetStatusHtml,
    bindLinkClickHandlers: mockBindLinkClickHandlers,
    setupDescriptionHandler: mockSetupDescriptionHandler,
    buildInlineEditUI: mockBuildInlineEditUI,
    createDateRow: mockCreateDateRow,
    initBackLink: mockInitBackLink,
    loadCommentsAndReactions: mockLoadCommentsAndReactions,
    setElementVisibility: mockSetElementVisibility,
    setElementText: mockSetElementText,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/entity-reference.ts', () => ({
    loadEntityLookupMap: mockLoadEntityLookupMap,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/html.ts', () => ({
    escapeHtml: mockEscapeHtml,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-add-form.ts', () => ({
    setupAddChildForm: mockSetupAddChildForm,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-edit.ts', () => ({
    setupInlineEdit: mockSetupInlineEdit,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts', () => ({
    renderTableWithInlineAddRow: mockRenderTableWithInlineAddRow,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/comments/autocomplete.ts', () => ({
    createCommentAutocomplete: mockCreateCommentAutocomplete,
}));

const defaultPromise = {
    id: 42,
    sequenceNumber: 1,
    statement: 'Test promise',
    description: 'A description',
    statusColor: 'green',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
};

const defaultEpics = [
    { id: 1, sequenceNumber: 1, statement: 'Epic 1' },
    { id: 2, sequenceNumber: 2, statement: 'Epic 2' },
];

function setupSuccessMocks(): void {
    mockGetPromise.mockResolvedValue(defaultPromise);
    mockLoadEntityLookupMap.mockResolvedValue(undefined);
    mockMountDetailStackGraph.mockResolvedValue(undefined);
    mockGetEpicsByPromise.mockResolvedValue(defaultEpics);
}

beforeEach(() => {
    vi.clearAllMocks();
    mockGetStatusHtml.mockImplementation((_color: string) => '<span>\u{1F7E2}</span>');
    mockCreateDateRow.mockImplementation((_label: string, _date?: string) => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.textContent = _date || '\u2013';
        tr.append(td);
        return tr;
    });
    mockEscapeHtml.mockImplementation((s: string) => s);
    mockGetOwnerProjectFromPath.mockReturnValue({ owner: 'o', project: 'p' });
    mockBuildGraphViewHref.mockReturnValue('/graph/promise-1');
    mockBuildInlineEditUI.mockImplementation((descTd: HTMLElement, _prefix: string, _value: string) => {
        descTd.innerHTML = `
            <textarea id="description-input">${_value}</textarea>
            <div id="description-view"></div>
            <button id="edit-desc-btn">Edit</button>
            <button id="save-desc" type="button">Save</button>
            <button id="cancel-desc" type="button">Cancel</button>
            <span id="desc-save-msg"></span>
        `;
        return {
            descTextarea: descTd.querySelector('#description-input'),
            cancelButton: descTd.querySelector('#cancel-desc'),
            saveButton: descTd.querySelector('#save-desc'),
            saveMessage: descTd.querySelector('#desc-save-msg'),
        };
    });
    mockRenderTableWithInlineAddRow.mockImplementation((_container: HTMLElement, _opts: Record<string, unknown>) => {
        const opts = _opts as { items?: unknown[]; renderItemRow?: (item: unknown) => string; renderAddRow?: () => string; headers?: string[] };
        let html = '<table><thead><tr>';
        if (opts.headers) opts.headers.forEach(h => { html += '<th>' + h + '</th>'; });
        html += '</tr></thead><tbody>';
        if (opts.items) opts.items.forEach(item => { html += opts.renderItemRow?.(item); });
        if (opts.renderAddRow) html += opts.renderAddRow();
        html += '</tbody></table>';
        _container.innerHTML = html;
        return _container.querySelector('tbody');
    });
    mockSetupAddChildForm.mockImplementation((_opts: Record<string, unknown>) => {
        const opts = _opts as { onCreate?: (statement: string) => Promise<unknown>; getRowHtml?: (created: Record<string, unknown>) => string };
        if (opts.onCreate) void opts.onCreate('test statement');
        if (opts.getRowHtml) opts.getRowHtml({ statement: 'test', sequenceNumber: 1, id: 1 });
    });
    mockSetupInlineEdit.mockReturnValue({ showSavedPopover: vi.fn() });
    mockSetElementVisibility.mockImplementation((selector: string, hidden: boolean) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) el.hidden = hidden;
    });
    mockSetElementText.mockImplementation((selector: string, text: string) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) el.textContent = text;
    });
    document.body.innerHTML = `
        <div id="promise-detail-content"></div>
        <div id="error-text"></div>
        <div id="promise-detail-loading"></div>
    `;
});

afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    vi.useRealTimers();
});

describe('loadPromiseDetail', () => {
    it('returns early when detailDiv is missing', async () => {
        // Arrange
        document.body.innerHTML = '<div></div>';
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockGetPromise).not.toHaveBeenCalled();
    });

    it('shows loading indicator on start', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        const promise = loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const loading = document.querySelector('#promise-detail-loading') as HTMLElement;
        // Assert
        expect(loading.hidden).toBe(false);
        await promise;
    });

    it('hides loading on success', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const loading = document.querySelector('#promise-detail-loading') as HTMLElement;
        // Assert
        expect(loading.hidden).toBe(true);
    });

    it('hides loading and shows error on API failure', async () => {
        // Arrange
        mockGetPromise.mockRejectedValue(new Error('network'));

        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#promise-detail-loading') as HTMLElement;
        // Act
        const error = document.querySelector('#error-text') as HTMLElement;
        // Assert
        expect(loading.hidden).toBe(true);
        expect(error.textContent).toContain('Failed to load promise details.');
    });

    it('calls destroyDetailStackGraph on start', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockDestroyDetailStackGraph).toHaveBeenCalled();
    });

    it('calls getPromise with correct params', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockGetPromise).toHaveBeenCalledWith('o', 'p', '42');
    });

    it('calls loadEntityLookupMap with correct params', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockLoadEntityLookupMap).toHaveBeenCalledWith('Promise', 42, 'o', 'p');
    });

    it('calls mountDetailStackGraph with correct params', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockMountDetailStackGraph).toHaveBeenCalledWith({
            nodeType: 'promise', nodeId: '42', owner: 'o', project: 'p',
        });
    });

    it('builds detail card with promise statement heading', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const detailCard = document.querySelector('.promise-detail-card')!;
        // Assert
        expect(detailCard.querySelector('h2')!.textContent).toBe('Test promise');
    });

    it('calls buildInlineEditUI for description', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockBuildInlineEditUI).toHaveBeenCalledWith(
            expect.any(HTMLElement), '', 'A description',
        );
    });

    it('calls createDateRow for created and updated dates', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockCreateDateRow).toHaveBeenCalledWith('Created', '2024-01-15T10:00:00Z');
        expect(mockCreateDateRow).toHaveBeenCalledWith('Updated', '2024-01-16T10:00:00Z');
    });

    it('loads epics from API', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockGetEpicsByPromise).toHaveBeenCalledWith('o', 'p', '42');
        expect(mockPatchChildMetrics).toHaveBeenCalledWith('promise-1', expect.any(Array));
        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalled();
        expect(mockSetupAddChildForm).toHaveBeenCalled();
        expect(mockBindLinkClickHandlers).toHaveBeenCalled();
    });

    it('handles epic load failure (shows error)', async () => {
        // Arrange
        mockGetPromise.mockResolvedValue(defaultPromise);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetEpicsByPromise.mockRejectedValue(new Error('network'));

        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Act
        const epicsList = document.querySelector('#promise-epics-list')!;
        // Assert
        expect(epicsList.querySelector('.error')).not.toBeNull();
        expect(epicsList.textContent).toContain('Failed to load epics.');
    });

    it('calls gateDetailControls with correct selectors', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockGateDetailControls).toHaveBeenCalledWith(
            { permission: 'Edit' },
            ['#edit-desc-btn', '#save-desc', '#description-input', '#add-epic-statement', '#add-epic-submit'],
        );
    });

    it('calls loadCommentsAndReactions', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockLoadCommentsAndReactions).toHaveBeenCalledWith(
            expect.any(HTMLElement), 'Promise', 42, 'o', 'p', { permission: 'Edit' },
        );
    });

    it('calls initBackLink', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockInitBackLink).toHaveBeenCalled();
    });

    it('calls setupDescriptionHandler', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockSetupDescriptionHandler).toHaveBeenCalledWith(
            'o', 'p', '42', 'promise', expect.any(Object), mockUpdatePromiseDescription,
        );
    });

    it('handles null promise return from API (early return)', async () => {
        // Arrange
        mockGetPromise.mockResolvedValue(null);

        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');
        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockLoadEntityLookupMap).not.toHaveBeenCalled();
        expect(mockMountDetailStackGraph).not.toHaveBeenCalled();
        expect(mockGetEpicsByPromise).not.toHaveBeenCalled();
    });

    it('upserts graph view button', async () => {
        // Arrange
        setupSuccessMocks();
        const { loadPromiseDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/promises/detail.ts');

        // Act
        await loadPromiseDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        // Assert
        expect(mockGetOwnerProjectFromPath).toHaveBeenCalled();
        expect(mockBuildGraphViewHref).toHaveBeenCalledWith('o', 'p', 'promise-1');
        expect(mockUpsertGraphViewButton).toHaveBeenCalled();
    });
});

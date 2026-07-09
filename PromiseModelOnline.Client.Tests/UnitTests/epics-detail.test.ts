import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetEpic = vi.fn();
const mockGetJourneys = vi.fn();
const mockUpdateEpicDescription = vi.fn();

const mockCreateJourney = vi.fn();

const mockDestroyDetailStackGraph = vi.fn();
const mockMountDetailStackGraph = vi.fn();
const mockPatchChildMetrics = vi.fn();

const mockBuildGraphViewHref = vi.fn();
const mockGetOwnerProjectFromPath = vi.fn();
const mockUpsertGraphViewButton = vi.fn();

const mockGetPromiseById = vi.fn();

const mockNavigate = vi.fn();

const mockGateDetailControls = vi.fn();
const mockGetStatusIcon = vi.fn();
const mockGetStatusLabel = vi.fn();
const mockBindLinkClickHandlers = vi.fn();
const mockSetupDescriptionHandler = vi.fn();
const mockBuildInlineEditUI = vi.fn();
const mockCreateStatusRow = vi.fn();
const mockCreateDateRow = vi.fn();
const mockInitBackLink = vi.fn();
const mockLoadCommentsAndReactions = vi.fn();

const mockLoadEntityLookupMap = vi.fn();

const mockEscapeHtml = vi.fn();

const mockSetupAddChildForm = vi.fn();

const mockSetupInlineEdit = vi.fn();

const mockRenderTableWithInlineAddRow = vi.fn();

const mockCreateCommentAutocomplete = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/epics/api.ts', () => ({
    getEpic: mockGetEpic,
    getJourneys: mockGetJourneys,
    updateEpicDescription: mockUpdateEpicDescription,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/journeys/api.ts', () => ({
    createJourney: mockCreateJourney,
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

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/promises/api.ts', () => ({
    getPromiseById: mockGetPromiseById,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/router.ts', () => ({
    navigate: mockNavigate,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/detail-common.ts', () => ({
    gateDetailControls: mockGateDetailControls,
    getStatusIcon: mockGetStatusIcon,
    getStatusLabel: mockGetStatusLabel,
    bindLinkClickHandlers: mockBindLinkClickHandlers,
    setupDescriptionHandler: mockSetupDescriptionHandler,
    buildInlineEditUI: mockBuildInlineEditUI,
    createStatusRow: mockCreateStatusRow,
    createDateRow: mockCreateDateRow,
    initBackLink: mockInitBackLink,
    loadCommentsAndReactions: mockLoadCommentsAndReactions,
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

const defaultEpic = {
    id: 42,
    sequenceNumber: 1,
    statement: 'Test epic',
    description: 'A description',
    statusColor: 'green',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    productPromiseId: 7,
};

const defaultPromise = {
    id: 7,
    sequenceNumber: 5,
    statement: 'Parent promise',
    statusColor: 'blue',
};

const defaultJourneys = [
    { id: 1, sequenceNumber: 1, statement: 'Journey 1' },
    { id: 2, sequenceNumber: 2, statement: 'Journey 2' },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockGetStatusIcon.mockImplementation((color: string) => (color ? '\u25CF' : '\u25CB'));
    mockGetStatusLabel.mockImplementation((color: string) => color || 'No Status');
    mockCreateDateRow.mockImplementation((_label: string, _date?: string) => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.textContent = _date || '\u2013';
        tr.append(td);
        return tr;
    });
    mockCreateStatusRow.mockImplementation((_statusColor?: string) => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.textContent = _statusColor || '';
        tr.append(td);
        return tr;
    });
    mockEscapeHtml.mockImplementation((s: string) => s);
    mockGetOwnerProjectFromPath.mockReturnValue({ owner: 'o', project: 'p' });
    mockBuildGraphViewHref.mockReturnValue('/graph/epic-1');
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
    document.body.innerHTML = `
        <div id="epic-detail-content"></div>
        <div id="error-text"></div>
        <div id="epic-detail-loading"></div>
    `;
});

afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    vi.useRealTimers();
});

describe('loadEpicDetail', () => {
    it('returns early when detailDiv is missing', async () => {
        document.body.innerHTML = '<div></div>';
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetEpic).not.toHaveBeenCalled();
    });

    it('shows loading indicator on start', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        const promise = loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#epic-detail-loading') as HTMLElement;
        expect(loading.hidden).toBe(false);
        await promise;
    });

    it('hides loading on success', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#epic-detail-loading') as HTMLElement;
        expect(loading.style.display).toBe('none');
    });

    it('hides loading and shows error on API failure', async () => {
        mockGetEpic.mockRejectedValue(new Error('network'));

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#epic-detail-loading') as HTMLElement;
        const error = document.querySelector('#error-text') as HTMLElement;
        expect(loading.style.display).toBe('none');
        expect(error.textContent).toContain('Failed to load epic details.');
    });

    it('calls destroyDetailStackGraph on start', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockDestroyDetailStackGraph).toHaveBeenCalled();
    });

    it('calls getEpic with correct params', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetEpic).toHaveBeenCalledWith('o', 'p', '42');
    });

    it('calls loadEntityLookupMap with correct params', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockLoadEntityLookupMap).toHaveBeenCalledWith('Epic', 42, 'o', 'p');
    });

    it('calls mountDetailStackGraph with correct params', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockMountDetailStackGraph).toHaveBeenCalledWith({
            nodeType: 'epic', nodeId: '42', owner: 'o', project: 'p',
        });
    });

    it('clears error text on load', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const errorEl = document.querySelector('#error-text') as HTMLElement;
        errorEl.textContent = 'Old error';
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(errorEl.textContent).toBe('');
    });

    it('builds detail card with epic heading', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const detailCard = document.querySelector('.epic-detail-card')!;
        expect(detailCard.querySelector('h2')!.textContent).toBe('Test epic');
    });

    it('builds table with description row', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildInlineEditUI).toHaveBeenCalledWith(
            expect.any(HTMLElement), '', 'A description',
        );
    });

    it('loads parent promise', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetPromiseById).toHaveBeenCalledWith('o', 'p', 7);
    });

    it('loads epic journeys', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetJourneys).toHaveBeenCalledWith('o', 'p', '42');
        expect(mockPatchChildMetrics).toHaveBeenCalledWith('epic-1', expect.any(Array));
        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalled();
        expect(mockSetupAddChildForm).toHaveBeenCalled();
        expect(mockBindLinkClickHandlers).toHaveBeenCalled();
    });

    it('sets up inline editing', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockCreateCommentAutocomplete).toHaveBeenCalledWith(
            expect.any(HTMLElement), 'Epic', 42,
        );
        expect(mockSetupInlineEdit).toHaveBeenCalledWith(
            expect.any(HTMLElement), expect.any(HTMLElement), expect.any(HTMLElement),
            expect.any(HTMLElement), expect.any(HTMLElement),
        );
    });

    it('calls gateDetailControls', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGateDetailControls).toHaveBeenCalledWith(
            { permission: 'Edit' },
            ['#edit-desc-btn', '#save-desc', '#description-input', '#add-journey-statement', '#add-journey-submit'],
        );
    });

    it('calls initBackLink and loadCommentsAndReactions', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockInitBackLink).toHaveBeenCalled();
        expect(mockLoadCommentsAndReactions).toHaveBeenCalledWith(
            expect.any(HTMLElement), 'Epic', 42, 'o', 'p', { permission: 'Edit' },
        );
    });

    it('calls setupDescriptionHandler', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockSetupDescriptionHandler).toHaveBeenCalledWith(
            'o', 'p', '42', 'epic', expect.any(Object), mockUpdateEpicDescription,
        );
    });

    it('calls upsertEpicGraphViewButton', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');

        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockUpsertGraphViewButton).toHaveBeenCalled();
    });
});

describe('loadParentPromise', () => {
    it('shows fallback text on API error', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockRejectedValue(new Error('network'));
        mockGetJourneys.mockResolvedValue(defaultJourneys);

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const parentCell = document.querySelector('#epic-parent-promise')!;
        expect(parentCell.textContent).toBe('Promise 7');
    });

    it('navigates on link click', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);

        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', navDiv, contentDiv, { permission: 'Edit' });

        const link = document.querySelector('#epic-parent-promise a')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(mockNavigate).toHaveBeenCalledWith('/o/p/promises/5', navDiv, contentDiv);
    });

    it('does not navigate on ctrl+click', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const link = document.querySelector('#epic-parent-promise a')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate on middle-click', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const link = document.querySelector('#epic-parent-promise a')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 1 }));
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

describe('loadEpicJourneys', () => {
    it('renders empty state when no journeys exist', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue([]);

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            expect.objectContaining({
                items: [],
                emptyMessage: 'No journeys found for this epic.',
            }),
        );
    });

    it('shows error on API failure', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockRejectedValue(new Error('network'));

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const journeysList = document.querySelector('#epic-journeys-list')!;
        expect(journeysList.querySelector('.error')).not.toBeNull();
        expect(journeysList.textContent).toContain('Failed to load journeys.');
    });
});

describe('upsertEpicGraphViewButton', () => {
    it('does not insert when owner is empty', async () => {
        mockGetOwnerProjectFromPath.mockReturnValue({ owner: '', project: 'p' });
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildGraphViewHref).not.toHaveBeenCalled();
        expect(mockUpsertGraphViewButton).not.toHaveBeenCalled();
    });

    it('does not insert when project is empty', async () => {
        mockGetOwnerProjectFromPath.mockReturnValue({ owner: 'o', project: '' });
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildGraphViewHref).not.toHaveBeenCalled();
        expect(mockUpsertGraphViewButton).not.toHaveBeenCalled();
    });

    it('does not insert when href is null', async () => {
        mockBuildGraphViewHref.mockReturnValue(null);
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);

        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildGraphViewHref).toHaveBeenCalledWith('o', 'p', 'epic-1');
        expect(mockUpsertGraphViewButton).not.toHaveBeenCalled();
    });
});

describe('additional coverage', () => {
    it('returns early when getEpic returns null', async () => {
        mockGetEpic.mockResolvedValue(null);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });
        expect(mockLoadEntityLookupMap).not.toHaveBeenCalled();
        expect(mockMountDetailStackGraph).not.toHaveBeenCalled();
    });

    it('renders empty description when epic has none', async () => {
        mockGetEpic.mockResolvedValue({ ...defaultEpic, description: undefined });
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });
        expect(mockBuildInlineEditUI).toHaveBeenCalledWith(expect.any(HTMLElement), '', '');
    });

    it('skips inline editing when description DOM elements are absent', async () => {
        mockBuildInlineEditUI.mockImplementation((descTd: HTMLElement) => {
            descTd.innerHTML = '';
            return {};
        });
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });
        expect(mockCreateCommentAutocomplete).not.toHaveBeenCalled();
        expect(mockSetupInlineEdit).not.toHaveBeenCalled();
    });

    it('handles missing loading and error elements on success', async () => {
        document.body.innerHTML = '<div id="epic-detail-content"></div>';
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await expect(loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' })).resolves.toBeUndefined();
    });

    it('handles missing loading and error elements on API failure', async () => {
        document.body.innerHTML = '<div id="epic-detail-content"></div>';
        mockGetEpic.mockRejectedValue(new Error('network'));
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await expect(loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' })).resolves.toBeUndefined();
    });

    it('handles null journeys response', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(null);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await expect(loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' })).resolves.toBeUndefined();
        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalled();
    });

    it('handles undefined permission', async () => {
        mockGetEpic.mockResolvedValue(defaultEpic);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetPromiseById.mockResolvedValue(defaultPromise);
        mockGetJourneys.mockResolvedValue(defaultJourneys);
        const { loadEpicDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/epics/detail.ts');
        await loadEpicDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), undefined);
        expect(mockGateDetailControls).toHaveBeenCalledWith(undefined, expect.any(Array));
    });
});

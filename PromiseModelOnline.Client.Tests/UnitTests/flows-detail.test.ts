import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetFlow = vi.fn();
const mockGetMoments = vi.fn();
const mockUpdateFlowDescription = vi.fn();

const mockGetJourneyById = vi.fn();

const mockCreateMoment = vi.fn();
const mockUpdateMomentType = vi.fn();

const mockDestroyDetailStackGraph = vi.fn();
const mockMountDetailStackGraph = vi.fn();
const mockPatchChildMetrics = vi.fn();

const mockBuildGraphViewHref = vi.fn();
const mockGetOwnerProjectFromPath = vi.fn();
const mockUpsertGraphViewButton = vi.fn();

const mockNavigate = vi.fn();

const mockGateDetailControls = vi.fn();
const mockGetStatusIcon = vi.fn();
const mockGetStatusLabel = vi.fn();
const mockBindLinkClickHandlers = vi.fn();
const mockSetupDescriptionHandler = vi.fn();
const mockBuildInlineEditUI = vi.fn();
const mockCreateDateRow = vi.fn();
const mockInitBackLink = vi.fn();
const mockLoadCommentsAndReactions = vi.fn();
const mockSetElementText = vi.fn();
const mockSetElementVisibility = vi.fn();
const mockSetupDetailInlineEdit = vi.fn();

const mockLoadEntityLookupMap = vi.fn();

const mockEscapeHtml = vi.fn();

const mockSetupAddChildForm = vi.fn();

const mockRenderTableWithInlineAddRow = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/flows/api.ts', () => ({
    getFlow: mockGetFlow,
    getMoments: mockGetMoments,
    updateFlowDescription: mockUpdateFlowDescription,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/journeys/api.ts', () => ({
    getJourneyById: mockGetJourneyById,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/moments/api.ts', () => ({
    createMoment: mockCreateMoment,
    updateMomentType: mockUpdateMomentType,
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
    createDateRow: mockCreateDateRow,
    initBackLink: mockInitBackLink,
    loadCommentsAndReactions: mockLoadCommentsAndReactions,
    setElementText: mockSetElementText,
    setElementVisibility: mockSetElementVisibility,
    setupDetailInlineEdit: mockSetupDetailInlineEdit,
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

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/inline-table.ts', () => ({
    renderTableWithInlineAddRow: mockRenderTableWithInlineAddRow,
}));

const defaultFlow = {
    id: 42,
    sequenceNumber: 1,
    statement: 'Test flow',
    description: 'A flow description',
    statusColor: 'green',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    journeyId: 7,
};

const defaultMoments = [
    { id: 1, sequenceNumber: 1, statement: 'Moment 1', description: '', statusColor: '', type: 'Story', status: 'Done' },
    { id: 2, sequenceNumber: 2, statement: 'Moment 2', description: '', statusColor: '', type: 'Job', status: 'Todo' },
];

const defaultJourney = {
    id: 7,
    sequenceNumber: 3,
    statement: 'Parent journey',
    statusColor: 'blue',
};

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
    mockEscapeHtml.mockImplementation((s: string) => s);
    mockGetOwnerProjectFromPath.mockReturnValue({ owner: 'o', project: 'p' });
    mockBuildGraphViewHref.mockReturnValue('/graph/flow-1');
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
    mockSetupDetailInlineEdit.mockReturnValue({ showSavedPopover: vi.fn() });
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
        const opts = _opts as { onCreate?: (statement: string, type?: string) => Promise<unknown>; getRowHtml?: (created: Record<string, unknown>) => string };
        if (opts.onCreate) void opts.onCreate('test statement', 'Story');
        if (opts.getRowHtml) opts.getRowHtml({ statement: 'test', sequenceNumber: 1, id: 1, type: 'Story', status: 'Todo' });
    });
    mockSetElementText.mockImplementation((selector: string, text: string) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) el.textContent = text;
    });
    mockSetElementVisibility.mockImplementation((selector: string, hidden: boolean) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) el.hidden = hidden;
    });
    document.body.innerHTML = `
        <div id="flow-detail-content"></div>
        <div id="error-text"></div>
        <div id="flow-detail-loading"></div>
    `;
});

afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    vi.useRealTimers();
});

describe('loadFlowDetail', () => {
    it('returns early when detailDiv is missing', async () => {
        document.body.innerHTML = '<div></div>';
        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');

        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetFlow).not.toHaveBeenCalled();
    });

    it('calls destroyDetailStackGraph even when detailDiv is missing', async () => {
        document.body.innerHTML = '<div></div>';
        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');

        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockDestroyDetailStackGraph).toHaveBeenCalled();
    });

    it('shows loading indicator on start', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');

        const promise = loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#flow-detail-loading') as HTMLElement;
        expect(loading.hidden).toBe(false);
        await promise;
    });

    it('clears error text on start', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const errorEl = document.querySelector('#error-text') as HTMLElement;
        errorEl.textContent = 'Old error';

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(errorEl.textContent).toBe('');
    });

    it('hides loading on success', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#flow-detail-loading') as HTMLElement;
        expect(loading.hidden).toBe(true);
    });

    it('shows error and hides loading on API failure', async () => {
        mockGetFlow.mockRejectedValue(new Error('network'));

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#flow-detail-loading') as HTMLElement;
        const error = document.querySelector('#error-text') as HTMLElement;
        expect(loading.hidden).toBe(true);
        expect(error.textContent).toContain('Failed to load flow details.');
    });

    it('calls destroyDetailStackGraph on start', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');

        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockDestroyDetailStackGraph).toHaveBeenCalled();
    });

    it('calls getFlow with correct params', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetFlow).toHaveBeenCalledWith('o', 'p', '42');
    });

    it('returns early when flow is falsy', async () => {
        mockGetFlow.mockResolvedValue(null);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockLoadEntityLookupMap).not.toHaveBeenCalled();
    });

    it('calls loadEntityLookupMap with correct params', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockLoadEntityLookupMap).toHaveBeenCalledWith('Flow', 42, 'o', 'p');
    });

    it('calls mountDetailStackGraph with correct params', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockMountDetailStackGraph).toHaveBeenCalledWith({
            nodeType: 'flow', nodeId: '42', owner: 'o', project: 'p',
        });
    });

    it('builds detail card with flow heading', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const detailCard = document.querySelector('.flow-detail-card')!;
        expect(detailCard.querySelector('h2')!.textContent).toBe('Test flow');
    });

    it('builds table with description row', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildInlineEditUI).toHaveBeenCalledWith(
            expect.any(HTMLElement), '', 'A flow description',
        );
    });

    it('calls getStatusIcon and getStatusLabel for status row', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetStatusIcon).toHaveBeenCalledWith('green');
        expect(mockGetStatusLabel).toHaveBeenCalledWith('green');
    });

    it('calls createDateRow for created and updated dates', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockCreateDateRow).toHaveBeenCalledWith('Created', defaultFlow.createdAt);
        expect(mockCreateDateRow).toHaveBeenCalledWith('Updated', defaultFlow.updatedAt);
    });

    it('creates moments heading and list container', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const detailCard = document.querySelector('.flow-detail-card')!;
        expect(detailCard.querySelector('h3')!.textContent).toBe('Moments');
        expect(detailCard.querySelector('#flow-moments-list')).not.toBeNull();
    });

    it('creates comments container', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const detailCard = document.querySelector('.flow-detail-card')!;
        expect(detailCard.querySelector('#flow-comments')).not.toBeNull();
    });

    it('creates back button', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const detailCard = document.querySelector('.flow-detail-card')!;
        const backBtn = detailCard.querySelector('#back-link') as HTMLButtonElement;
        expect(backBtn).not.toBeNull();
        expect(backBtn.textContent).toContain('Back');
    });

    it('sets up inline editing via setupDetailInlineEdit', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockSetupDetailInlineEdit).toHaveBeenCalledWith(
            '#description-input', '#description-view', '#edit-desc-btn', 'Flow', 42, '#save-desc', '#cancel-desc',
        );
    });

    it('calls bindLinkClickHandlers for journey links', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBindLinkClickHandlers).toHaveBeenCalledWith(
            document.body, '.detail-link[journey-id]', 'journey-seq', 'journeys', 'o', 'p',
            expect.any(HTMLElement), expect.any(HTMLElement),
        );
    });

    it('loads flow moments', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetMoments).toHaveBeenCalledWith('o', 'p', '42');
        expect(mockPatchChildMetrics).toHaveBeenCalledWith('flow-1', expect.any(Array));
        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalled();
        expect(mockSetupAddChildForm).toHaveBeenCalled();
    });

    it('loads flow moments and shows error on failure', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockRejectedValue(new Error('network'));
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const momentsList = document.querySelector('#flow-moments-list')!;
        expect(momentsList.querySelector('.error')).not.toBeNull();
        expect(momentsList.textContent).toContain('Failed to load moments.');
    });

    it('calls initBackLink', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockInitBackLink).toHaveBeenCalled();
    });

    it('loads flow journey name via getJourneyById', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetJourneyById).toHaveBeenCalledWith('o', 'p', 7);
    });

    it('calls setupDescriptionHandler', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockSetupDescriptionHandler).toHaveBeenCalledWith(
            'o', 'p', '42', 'flow', expect.objectContaining({ id: 42, sequenceNumber: 1 }), mockUpdateFlowDescription,
        );
    });

    it('calls gateDetailControls with correct selectors', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGateDetailControls).toHaveBeenCalledWith(
            { permission: 'Edit' },
            ['#edit-desc-btn', '#save-desc', '#description-input', '#add-moment-statement', '#add-moment-submit', '#add-moment-type'],
        );
    });

    it('calls loadCommentsAndReactions', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockLoadCommentsAndReactions).toHaveBeenCalledWith(
            expect.any(HTMLElement), 'Flow', 42, 'o', 'p', { permission: 'Edit' },
        );
    });

    it('calls upsertFlowGraphViewButton', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockUpsertGraphViewButton).toHaveBeenCalled();
    });
});

describe('loadFlowJourneyName', () => {
    it('navigates on link click', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const navDiv = document.createElement('div');
        const contentDiv = document.createElement('div');
        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', navDiv, contentDiv, { permission: 'Edit' });

        const link = document.querySelector('#flow-journey-cell a.detail-link')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(mockNavigate).toHaveBeenCalledWith('/o/p/journeys/3', navDiv, contentDiv);
    });

    it('does not navigate on ctrl+click', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const link = document.querySelector('#flow-journey-cell a.detail-link')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate on middle-click', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const link = document.querySelector('#flow-journey-cell a.detail-link')!;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 1 }));
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles API error gracefully', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockRejectedValue(new Error('network'));

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const journeyCell = document.querySelector('#flow-journey-cell')!;
        expect(journeyCell.textContent).toContain('Journey 7');
    });
});

describe('loadFlowMoments', () => {
    it('renders empty state when no moments exist', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue([]);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            expect.objectContaining({
                items: [],
                emptyMessage: 'No moments found for this flow.',
            }),
        );
    });

    it('handles moment type change via change event', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const select = document.querySelector('.moment-type-select') as HTMLSelectElement;
        expect(select).not.toBeNull();
        mockUpdateMomentType.mockResolvedValue(undefined);
        select.value = 'Job';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        expect(mockUpdateMomentType).toHaveBeenCalledWith('o', 'p', 1, 'Job', 42);
    });

    it('reverts select value when updateMomentType rejects', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const select = document.querySelector('.moment-type-select') as HTMLSelectElement;
        const originalValue = select.value;
        const newValue = originalValue === 'Story' ? 'Job' : 'Story';
        mockUpdateMomentType.mockRejectedValue(new Error('network'));
        select.value = newValue;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(select.value).toBe(originalValue);
    });
});

describe('upsertFlowGraphViewButton', () => {
    it('does not insert when owner is empty', async () => {
        mockGetOwnerProjectFromPath.mockReturnValue({ owner: '', project: 'p' });
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildGraphViewHref).not.toHaveBeenCalled();
        expect(mockUpsertGraphViewButton).not.toHaveBeenCalled();
    });

    it('does not insert when project is empty', async () => {
        mockGetOwnerProjectFromPath.mockReturnValue({ owner: 'o', project: '' });
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildGraphViewHref).not.toHaveBeenCalled();
        expect(mockUpsertGraphViewButton).not.toHaveBeenCalled();
    });

    it('does not insert when href is null', async () => {
        mockBuildGraphViewHref.mockReturnValue(null);
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildGraphViewHref).toHaveBeenCalledWith('o', 'p', 'flow-1');
        expect(mockUpsertGraphViewButton).not.toHaveBeenCalled();
    });
});

describe('additional edge case coverage', () => {
    it('handles flow with empty description', async () => {
        mockGetFlow.mockResolvedValue({ ...defaultFlow, description: '' });
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildInlineEditUI).toHaveBeenCalledWith(expect.any(HTMLElement), '', '');
    });

    it('handles flow with null statusColor', async () => {
        mockGetFlow.mockResolvedValue({ ...defaultFlow, statusColor: null });
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetStatusIcon).toHaveBeenCalledWith('');
        expect(mockGetStatusLabel).toHaveBeenCalledWith('');
    });

    it('handles null moments from API', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(null);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            expect.objectContaining({ items: [] }),
        );
    });

    it('ignores change events on non-select elements', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue(defaultJourney);

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        document.querySelector('#flow-moments-list')!.dispatchEvent(new Event('change', { bubbles: true }));

        expect(mockUpdateMomentType).not.toHaveBeenCalled();
    });

    it('handles journey with null statusColor', async () => {
        mockGetFlow.mockResolvedValue(defaultFlow);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetMoments.mockResolvedValue(defaultMoments);
        mockGetJourneyById.mockResolvedValue({ ...defaultJourney, statusColor: null });

        const { loadFlowDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/flows/detail.ts');
        await loadFlowDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetStatusIcon).toHaveBeenCalledWith('');
        expect(mockGetStatusLabel).toHaveBeenCalledWith('');
    });
});

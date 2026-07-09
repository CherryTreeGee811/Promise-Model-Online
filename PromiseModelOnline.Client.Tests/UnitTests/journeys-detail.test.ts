import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetJourney = vi.fn();
const mockGetFlows = vi.fn();
const mockUpdateJourneyDescription = vi.fn();

const mockGetEpicById = vi.fn();
const mockCreateFlow = vi.fn();

const mockDestroyDetailStackGraph = vi.fn();
const mockMountDetailStackGraph = vi.fn();
const mockPatchChildMetrics = vi.fn();
const mockPatchDetailStackGraphNode = vi.fn();

const mockBuildGraphViewHref = vi.fn();
const mockGetOwnerProjectFromPath = vi.fn();
const mockUpsertGraphViewButton = vi.fn();

const mockNavigate = vi.fn();

const mockGateDetailControls = vi.fn();
const mockGetStatusIcon = vi.fn();
const mockGetStatusLabel = vi.fn();
const mockBindLinkClickHandlers = vi.fn();
const mockBuildInlineEditUI = vi.fn();
const mockCreateStatusRow = vi.fn();
const mockCreateDateRow = vi.fn();
const mockInitBackLink = vi.fn();
const mockLoadCommentsAndReactions = vi.fn();
const mockSetElementText = vi.fn();
const mockSetElementVisibility = vi.fn();
const mockSetupDetailInlineEdit = vi.fn();

const mockFormatCommentText = vi.fn();
const mockLoadEntityLookupMap = vi.fn();

const mockEscapeHtml = vi.fn();

const mockSetupAddChildForm = vi.fn();

const mockRenderTableWithInlineAddRow = vi.fn();

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/journeys/api.ts', () => ({
    getJourney: mockGetJourney,
    getFlows: mockGetFlows,
    updateJourneyDescription: mockUpdateJourneyDescription,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/epics/api.ts', () => ({
    getEpicById: mockGetEpicById,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/flows/api.ts', () => ({
    createFlow: mockCreateFlow,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/projects/detail-stack-graph.ts', () => ({
    destroyDetailStackGraph: mockDestroyDetailStackGraph,
    mountDetailStackGraph: mockMountDetailStackGraph,
    patchChildMetrics: mockPatchChildMetrics,
    patchDetailStackGraphNode: mockPatchDetailStackGraphNode,
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
    buildInlineEditUI: mockBuildInlineEditUI,
    createStatusRow: mockCreateStatusRow,
    createDateRow: mockCreateDateRow,
    initBackLink: mockInitBackLink,
    loadCommentsAndReactions: mockLoadCommentsAndReactions,
    setElementText: mockSetElementText,
    setElementVisibility: mockSetElementVisibility,
    setupDetailInlineEdit: mockSetupDetailInlineEdit,
}));

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/utils/entity-reference.ts', () => ({
    formatCommentText: mockFormatCommentText,
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

const defaultJourney = {
    id: 42,
    sequenceNumber: 1,
    statement: 'Test journey',
    description: 'A description',
    statusColor: 'green',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    epicId: 7,
};

const defaultEpic = {
    id: 7,
    sequenceNumber: 5,
    statement: 'Parent epic',
    statusColor: 'blue',
};

const defaultFlows = [
    { id: 1, sequenceNumber: 1, statement: 'Flow 1' },
    { id: 2, sequenceNumber: 2, statement: 'Flow 2' },
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
    mockFormatCommentText.mockImplementation((s: string) => s || '');
    mockGetOwnerProjectFromPath.mockReturnValue({ owner: 'o', project: 'p' });
    mockBuildGraphViewHref.mockReturnValue('/graph/journey-1');
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
        _container.innerHTML = '<table><tbody></tbody></table>';
        return _container.querySelector('tbody');
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
        <div id="journey-detail-content"></div>
        <div id="error-text"></div>
        <div id="journey-detail-loading"></div>
    `;
});

afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    vi.useRealTimers();
});

describe('loadJourneyDetail', () => {
    it('returns early when detailDiv is missing', async () => {
        document.body.innerHTML = '<div></div>';
        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');

        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetJourney).not.toHaveBeenCalled();
    });

    it('shows loading indicator on start', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');

        const promise = loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#journey-detail-loading') as HTMLElement;
        expect(loading.hidden).toBe(false);
        await promise;
    });

    it('hides loading on success', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#journey-detail-loading') as HTMLElement;
        expect(loading.hidden).toBe(true);
    });

    it('hides loading and shows error on API failure', async () => {
        mockGetJourney.mockRejectedValue(new Error('network'));

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const loading = document.querySelector('#journey-detail-loading') as HTMLElement;
        const error = document.querySelector('#error-text') as HTMLElement;
        expect(loading.hidden).toBe(true);
        expect(error.textContent).toContain('Failed to load journey details.');
    });

    it('calls destroyDetailStackGraph on start', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');

        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockDestroyDetailStackGraph).toHaveBeenCalled();
    });

    it('calls getJourney with correct params', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetJourney).toHaveBeenCalledWith('o', 'p', '42');
    });

    it('calls loadEntityLookupMap with correct params', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockLoadEntityLookupMap).toHaveBeenCalledWith('Journey', 42, 'o', 'p');
    });

    it('calls mountDetailStackGraph with correct params', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockMountDetailStackGraph).toHaveBeenCalledWith({
            nodeType: 'journey', nodeId: '42', owner: 'o', project: 'p',
        });
    });

    it('clears error text on load', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const errorEl = document.querySelector('#error-text') as HTMLElement;
        errorEl.textContent = 'Old error';

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(errorEl.textContent).toBe('');
    });

    it('builds detail card with journey heading', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const detailCard = document.querySelector('.journey-detail-card')!;
        expect(detailCard.querySelector('h2')!.textContent).toBe('Test journey');
    });

    it('builds table with description row', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBuildInlineEditUI).toHaveBeenCalledWith(
            expect.any(HTMLElement), '', 'A description',
        );
    });

    it('loads journey flows', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetFlows).toHaveBeenCalledWith('o', 'p', '42');
        expect(mockPatchChildMetrics).toHaveBeenCalledWith('journey-1', expect.any(Array));
        expect(mockRenderTableWithInlineAddRow).toHaveBeenCalled();
        expect(mockSetupAddChildForm).toHaveBeenCalled();
        expect(mockBindLinkClickHandlers).toHaveBeenCalled();
    });

    it('loads journey flows and shows error on failure', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockRejectedValue(new Error('network'));
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const flowsList = document.querySelector('#journey-flows-list')!;
        expect(flowsList.querySelector('.error')).not.toBeNull();
        expect(flowsList.textContent).toContain('Failed to load flows.');
    });

    it('sets up inline editing via setupDetailInlineEdit', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockSetupDetailInlineEdit).toHaveBeenCalledWith(
            '#description-input', '#description-view', '#edit-desc-btn', 'Journey', 42, '#save-desc', '#cancel-desc',
        );
    });

    it('calls bindLinkClickHandlers', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockBindLinkClickHandlers).toHaveBeenCalledWith(
            document.body, 'a.detail-link[epic-id]', 'epic-seq', 'epics', 'o', 'p',
            expect.any(HTMLElement), expect.any(HTMLElement),
        );
    });

    it('calls initBackLink and loadCommentsAndReactions', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockInitBackLink).toHaveBeenCalled();
        expect(mockLoadCommentsAndReactions).toHaveBeenCalledWith(
            expect.any(HTMLElement), 'Journey', 42, 'o', 'p', { permission: 'Edit' },
        );
    });

    it('loads parent epic', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGetEpicById).toHaveBeenCalledWith('o', 'p', 7);
    });

    it('calls gateDetailControls with correct selectors', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockGateDetailControls).toHaveBeenCalledWith(
            { permission: 'Edit' },
            ['#edit-desc-btn', '#save-desc', '#description-input', '#add-flow-statement', '#add-flow-submit'],
        );
    });

    it('calls upsertJourneyGraphViewButton', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        expect(mockUpsertGraphViewButton).toHaveBeenCalled();
    });

    it('navigates to epic on link click', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const epicLink = document.querySelector('#journey-epic-cell a') as HTMLAnchorElement;
        expect(epicLink).not.toBeNull();
        expect(epicLink.textContent).toBe('Parent epic');
        epicLink.click();
        expect(mockNavigate).toHaveBeenCalledWith('/o/p/epics/5', expect.any(HTMLElement), expect.any(HTMLElement));
    });

    it('saves description on button click', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);
        mockUpdateJourneyDescription.mockResolvedValue({ description: 'Updated description' });

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const descInput = document.querySelector('#description-input') as HTMLTextAreaElement;
        const saveBtn = document.querySelector('#save-desc') as HTMLButtonElement;
        descInput.value = 'Updated description';
        saveBtn.click();

        await vi.waitFor(() => {
            expect(mockUpdateJourneyDescription).toHaveBeenCalledWith('o', 'p', '42', 'Updated description');
            expect(mockPatchDetailStackGraphNode).toHaveBeenCalledWith('journey-1', {
                description: 'Updated description',
            });
        });
    });

    it('disables save button during description save', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);
        mockUpdateJourneyDescription.mockImplementation(() => new Promise(() => {}));

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const saveBtn = document.querySelector('#save-desc') as HTMLButtonElement;
        saveBtn.click();

        expect(saveBtn.disabled).toBe(true);
    });

    it('shows error on description save failure', async () => {
        mockGetJourney.mockResolvedValue(defaultJourney);
        mockLoadEntityLookupMap.mockResolvedValue(undefined);
        mockMountDetailStackGraph.mockResolvedValue(undefined);
        mockGetFlows.mockResolvedValue(defaultFlows);
        mockGetEpicById.mockResolvedValue(defaultEpic);
        mockUpdateJourneyDescription.mockRejectedValue(new Error('fail'));

        const { loadJourneyDetail } = await import('../../PromiseModelOnline.Client/wwwroot/js/journeys/detail.ts');
        await loadJourneyDetail('o', 'p', '42', document.createElement('div'), document.createElement('div'), { permission: 'Edit' });

        const saveBtn = document.querySelector('#save-desc') as HTMLButtonElement;
        const descMsg = document.querySelector('#desc-save-msg') as HTMLElement;
        saveBtn.click();

        await vi.waitFor(() => {
            expect(descMsg.textContent).toBe('Save failed');
        });
    });
});
